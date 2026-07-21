import json
import os
import logging
import re
from typing import Dict, Any, List

from langchain_groq import ChatGroq
from langchain_ollama import OllamaEmbeddings
from langchain_community.vectorstores import AzureSearch
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.messages import SystemMessage, HumanMessage

from backend.src.graph.state import VideoAuditState, ComplianceIssue
from backend.src.services.video_indexer import VideoIndexerService

logger = logging.getLogger("brand_guardian")
logging.basicConfig(level=logging.INFO)

# --------------------------------------------------------------------------
# NODE 1: Index Video Node (Video Download -> Azure VI Upload -> Extract Text)
# --------------------------------------------------------------------------
def index_video_node(state: VideoAuditState) -> Dict[str, Any]:
    video_url = state.get("video_url")
    video_id_input = state.get("video_id", "video_demo")
    
    logger.info(f"[Node: Indexer] Processing URL: {video_url}")
    
    temp_local_file = "temp_audit_video.mp4"
    
    try:
        vi_service = VideoIndexerService()
        
        # Download YouTube video locally
        if "youtube.com" in video_url or "youtu.be" in video_url:
            local_path = vi_service.download_youtube_video(
                url=video_url,
                output_path=temp_local_file
            )
        else:
            raise Exception("Please provide a valid YouTube URL.")

        # Upload to Azure Video Indexer
        azure_video_id = vi_service.upload_video(
            video_path=local_path,
            video_name=video_id_input
        )
        logger.info(f"[Node: Indexer] Upload success. Azure Video ID: {azure_video_id}")
        
        # Cleanup temporary local file
        if os.path.exists(local_path):
            os.remove(local_path)
            
        # Poll and wait for processing completion
        raw_insights = vi_service.wait_for_processing(azure_video_id)
        
        # Extract transcript, OCR, and metadata
        clean_data = vi_service.extract_data(raw_insights)
        logger.info("[Node: Indexer] Extraction complete.")
        
        return clean_data

    except Exception as e:
        logger.error(f"[Node: Indexer] Video Indexer failed: {str(e)}")
        return {
            "errors": [str(e)],
            "final_status": "fail",
            "transcript": "",
            "ocr_text": []
        }

# --------------------------------------------------------------------------
# NODE 2: Compliance Auditor Node (RAG + Azure Search + Groq LLM + Ollama)
# --------------------------------------------------------------------------
def audio_content_node(state: VideoAuditState) -> Dict[str, Any]:
    logger.info("[Node: Auditor] Querying knowledge base and LLM...")
    
    transcript = state.get("transcript", "")
    ocr_text = state.get("ocr_text", [])
    
    if not transcript and not ocr_text:
        logger.warning("[Node: Auditor] No transcript/OCR available. Skipping audit.")
        return {
            "final_status": "fail",
            "final_report": "Audit skipped: Video processing failed to extract content."
        }

    # 1. Initialize Groq Chat Model
    llm = ChatGroq(
        groq_api_key=os.getenv("GROQ_API_KEY"),
        model_name=os.getenv("GROQ_MODEL_NAME", "llama-3.3-70b-versatile"),
        temperature=0
    )
    
    # 2. Initialize Lightweight Ollama Embeddings Model
    embeddings = OllamaEmbeddings(
        model=os.getenv("OLLAMA_EMBEDDING_MODEL", "nomic-embed-text")
    )

    # 3. Vector Store with Azure Search (Queries embedded via Ollama)
    vector_store = AzureSearch(
        azure_search_endpoint=os.getenv("AZURE_SEARCH_ENDPOINT"),
        azure_search_key=os.getenv("AZURE_SEARCH_API_KEY"),
        index_name=os.getenv("AZURE_SEARCH_INDEX_NAME"),
        embedding_function=embeddings.embed_query
    )

    # Hybrid Retrieval Query Construction
    query_text = transcript + " " + " ".join(ocr_text)
    docs = vector_store.similarity_search(query_text, k=3)
    retrieved_rules = "\n\n".join([doc.page_content for doc in docs])

    # System & User Prompts
    system_prompt = f"""
You are a senior brand compliance auditor.
Below are the official regulatory rules retrieved from the compliance documents:

---
{retrieved_rules}
---

Instructions:
1. Analyze the transcript and OCR text provided by the user.
2. Identify any violations of the compliance rules.
3. Return strictly valid JSON in the following format:

{{
  "compliance_results": [
    {{
      "category": "<Category Name>",
      "severity": "critical | high | medium | low",
      "description": "<Detailed description of violation>"
    }}
  ],
  "status": "pass | fail",
  "final_report": "<Markdown summary of the audit findings>"
}}
If no violations are found, set "status" to "pass" and "compliance_results" to an empty list [].
"""

    user_message = f"""
Video Metadata: {state.get("video_metadata", {})}
Transcript: {transcript}
On-Screen OCR Text: {ocr_text}
"""

    try:
        response = llm.invoke([
            SystemMessage(content=system_prompt),
            HumanMessage(content=user_message)
        ])
        
        content = response.content

        # Clean markdown backticks if present
        if "```json" in content:
            match = re.search(r"```json\s*([\s\S]*?)\s*```", content)
            if match:
                content = match.group(1)
        elif "```" in content:
            match = re.search(r"```\s*([\s\S]*?)\s*```", content)
            if match:
                content = match.group(1)

        audit_data = json.loads(content)

        return {
            "compliance_results": audit_data.get("compliance_results", []),
            "final_status": audit_data.get("status", "fail"),
            "final_report": audit_data.get("final_report", "No report generated.")
        }

    except Exception as e:
        logger.error(f"[Node: Auditor] System error in auditor node: {str(e)}")
        raw_resp = response.content if 'response' in locals() else None
        logger.error(f"[Node: Auditor] Raw LLM Response: {raw_resp}")
        return {
            "errors": [str(e)],
            "final_status": "fail"
        }