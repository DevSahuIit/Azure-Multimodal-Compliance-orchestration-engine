import os
import logging
import traceback
import requests
from typing import Dict, Any, List

from pydantic import BaseModel, Field
from langchain_groq import ChatGroq
from langchain_community.vectorstores import AzureSearch
from langchain_core.messages import SystemMessage, HumanMessage

from backend.src.graph.state import VideoAuditState
from backend.src.services.video_indexer import VideoIndexerService

logger = logging.getLogger("brand_guardian")
logging.basicConfig(level=logging.INFO)

# Global vector store cache
_vector_store = None


class GroqCompatibleEmbeddings:
    """
    Lightweight embedding client using HuggingFace's hosted Inference API.
    Replaces local PyTorch/transformers to keep memory usage minimal (~0MB RAM vs ~500MB+).
    """
    def __init__(self, model: str = "sentence-transformers/all-MiniLM-L6-v2"):
        self.api_url = f"https://api-inference.huggingface.co/pipeline/feature-extraction/{model}"
        token = os.getenv("HF_API_TOKEN")
        self.headers = {"Authorization": f"Bearer {token}"} if token else {}

    def embed_query(self, text: str) -> List[float]:
        resp = requests.post(
            self.api_url, 
            headers=self.headers, 
            json={"inputs": text}, 
            timeout=30
        )
        resp.raise_for_status()
        res = resp.json()
        
        # Handle cases where HuggingFace returns nested list representations
        if isinstance(res, list) and len(res) > 0 and isinstance(res[0], list):
            return res[0]
        return res


class ComplianceViolation(BaseModel):
    category: str = Field(description="Name of the violation category")
    severity: str = Field(description="Severity degree: critical, high, medium, or low")
    description: str = Field(description="Detailed explanation of the rule violation")


class AuditResult(BaseModel):
    compliance_results: List[ComplianceViolation] = Field(default_factory=list)
    status: str = Field(description="Result status: 'pass' or 'fail'")
    final_report: str = Field(description="Detailed Markdown summary of findings")


def get_vector_store() -> AzureSearch:
    global _vector_store
    if _vector_store is None:
        logger.info("[Initialization] Connecting to Azure Search with hosted embeddings...")
        embeddings = GroqCompatibleEmbeddings()
        _vector_store = AzureSearch(
            azure_search_endpoint=os.getenv("AZURE_SEARCH_ENDPOINT"),
            azure_search_key=os.getenv("AZURE_SEARCH_API_KEY"),
            index_name=os.getenv("AZURE_SEARCH_INDEX_NAME"),
            embedding_function=embeddings.embed_query,
        )
        logger.info("[Initialization] Azure Search vector store ready.")
    return _vector_store


# --------------------------------------------------------------------------
# NODE 1: Local Upload Indexer Node
# --------------------------------------------------------------------------
def index_video_node(state: VideoAuditState) -> Dict[str, Any]:
    local_file_path = state.get("local_file_path")

    if state.get("transcript"):
        logger.info("[Node: Indexer] Using cached transcript — skipping extraction.")
        return {
            "transcript": state.get("transcript", ""),
            "ocr_text": state.get("ocr_text", []),
            "video_metadata": state.get("video_metadata", {}),
        }

    if not local_file_path or not os.path.exists(local_file_path):
        return {
            "errors": ["No uploaded video file found for this session."],
            "final_status": "fail",
            "transcript": "",
            "ocr_text": [],
        }

    logger.info(f"[Node: Indexer] Processing uploaded file: {local_file_path}")

    try:
        vi_service = VideoIndexerService()
        clean_data = vi_service.analyze_local_video(
            local_file_path, original_filename=state.get("video_url", "")
        )
        return clean_data
    except Exception as e:
        full_trace = traceback.format_exc()
        logger.error(f"[Node: Indexer] Local video analysis failed:\n{full_trace}")
        return {
            "errors": [f"{type(e).__name__}: {str(e)}"],
            "final_status": "fail",
            "transcript": "",
            "ocr_text": [],
        }


# --------------------------------------------------------------------------
# NODE 2: Compliance Auditor Node
# --------------------------------------------------------------------------
def audio_content_node(state: VideoAuditState) -> Dict[str, Any]:
    logger.info("[Node: Auditor] Querying knowledge base and LLM...")

    transcript = state.get("transcript", "")
    ocr_text = state.get("ocr_text", [])
    errors = state.get("errors", [])

    if not transcript:
        err_msg = errors[0] if errors else "Failed to extract video transcript."
        logger.warning(f"[Node: Auditor] Audit aborted. Reason: {err_msg}")
        return {
            "final_status": "fail",
            "final_report": f"Audit skipped due to extraction error: {err_msg}",
            "compliance_results": [],
        }

    llm = ChatGroq(
        groq_api_key=os.getenv("GROQ_API_KEY"),
        model_name=os.getenv("GROQ_MODEL_NAME", "llama-3.3-70b-versatile"),
        temperature=0,
        request_timeout=60,
        max_retries=2,
    )

    structured_llm = llm.with_structured_output(AuditResult)

    logger.info("[Node: Auditor] Loading vector store...")
    vector_store = get_vector_store()
    logger.info("[Node: Auditor] Vector store ready. Running similarity search...")

    query_text = transcript.strip()
    try:
        docs = vector_store.similarity_search(query_text, k=3)
    except Exception as e:
        logger.error(f"[Node: Auditor] Azure Search query failed/timed out: {e}")
        docs = []

    logger.info(f"[Node: Auditor] Retrieved {len(docs)} rule document(s). Invoking LLM...")

    retrieved_rules = (
        "\n\n".join([doc.page_content for doc in docs]) if docs else "No specific compliance documents found."
    )

    system_prompt = f"""
You are a senior brand compliance auditor.
Below are official regulatory rules retrieved from compliance documents:

---
{retrieved_rules}
---

Instructions:
1. Analyze the transcript and metadata provided by the user.
2. Identify any violations of compliance rules.
3. Output the structured audit evaluation according to the required schema.
If no violations are found, set "status" to "pass" and "compliance_results" to an empty list.
"""

    user_message = f"""
Video Metadata: {state.get("video_metadata", {})}
Transcript: {transcript}
"""

    try:
        result: AuditResult = structured_llm.invoke(
            [SystemMessage(content=system_prompt), HumanMessage(content=user_message)]
        )
        logger.info("[Node: Auditor] LLM invocation complete.")
        return {
            "compliance_results": [c.model_dump() for c in result.compliance_results],
            "final_status": result.status,
            "final_report": result.final_report,
        }
    except Exception as e:
        logger.error(f"[Node: Auditor] System error in auditor node: {str(e)}")
        return {
            "errors": [str(e)],
            "final_status": "fail",
            "final_report": f"Audit execution failed: {str(e)}",
            "compliance_results": [],
        }