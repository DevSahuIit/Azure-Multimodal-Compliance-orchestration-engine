import json
import os
import logging
import re
import traceback
from typing import Dict, Any, List

from pydantic import BaseModel, Field
from langchain_groq import ChatGroq
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_community.vectorstores import AzureSearch
from langchain_core.messages import SystemMessage, HumanMessage

from backend.src.graph.state import VideoAuditState
from backend.src.services.video_indexer import VideoIndexerService

logger = logging.getLogger("brand_guardian")
logging.basicConfig(level=logging.INFO)

# --------------------------------------------------------------------------
# GLOBAL MODEL / VECTOR STORE SINGLETONS (Loaded once, reused globally)
# --------------------------------------------------------------------------
_embeddings = None
_vector_store = None


def get_vector_store() -> AzureSearch:
    global _embeddings, _vector_store
    if _vector_store is None:
        logger.info("[Initialization] Loading MiniLM Embeddings & Azure Vector Store...")
        _embeddings = HuggingFaceEmbeddings(model_name="all-MiniLM-L6-v2")
        _vector_store = AzureSearch(
            azure_search_endpoint=os.getenv("AZURE_SEARCH_ENDPOINT"),
            azure_search_key=os.getenv("AZURE_SEARCH_API_KEY"),
            index_name=os.getenv("AZURE_SEARCH_INDEX_NAME"),
            embedding_function=_embeddings.embed_query,
        )
    return _vector_store


# --------------------------------------------------------------------------
# STRUCTURED OUTPUT PYDANTIC SCHEMAS
# --------------------------------------------------------------------------
class ComplianceViolation(BaseModel):
    category: str = Field(description="Name of the violation category")
    severity: str = Field(description="Severity degree: critical, high, medium, or low")
    description: str = Field(description="Detailed explanation of the rule violation")


class AuditResult(BaseModel):
    compliance_results: List[ComplianceViolation] = Field(default_factory=list)
    status: str = Field(description="Result status: 'pass' or 'fail'")
    final_report: str = Field(description="Detailed Markdown summary of findings")


# --------------------------------------------------------------------------
# NODE 1: Index Video Node (Cache-aware Azure VI Upload -> Extract Text)
# --------------------------------------------------------------------------
def index_video_node(state: VideoAuditState) -> Dict[str, Any]:
    video_url = state.get("video_url")
    video_id_input = state.get("video_id", "video_demo")

    if state.get("transcript") or state.get("ocr_text"):
        logger.info("[Node: Indexer] Using cached transcript/OCR — skipping download & re-indexing.")
        return {
            "transcript": state.get("transcript", ""),
            "ocr_text": state.get("ocr_text", []),
            "video_metadata": state.get("video_metadata", {}),
        }

    logger.info(f"[Node: Indexer] Processing URL: {video_url}")

    try:
        vi_service = VideoIndexerService()

        azure_video_id = vi_service.upload_video_from_url(
            video_url=video_url, video_name=video_id_input
        )

        if not azure_video_id or not re.fullmatch(r"[A-Za-z0-9]{10}", azure_video_id):
            raise Exception(f"Upload did not return a valid Azure video ID (got: {azure_video_id!r})")

        logger.info(f"[Node: Indexer] Upload success. Azure Video ID: {azure_video_id}")

        raw_insights = vi_service.wait_for_processing(azure_video_id)
        clean_data = vi_service.extract_data(raw_insights)
        logger.info("[Node: Indexer] Extraction complete.")

        try:
            vi_service.delete_video(azure_video_id)
        except Exception as cleanup_err:
            logger.warning(f"[Node: Indexer] Non-fatal cleanup failure: {cleanup_err}")

        return clean_data

    except Exception as e:
        full_trace = traceback.format_exc()
        logger.error(f"[Node: Indexer] Video Indexer failed:\n{full_trace}")

        err_type = type(e).__name__
        err_detail = str(e) if str(e) else "Unknown extraction error"

        return {
            "errors": [f"{err_type}: {err_detail}"],
            "final_status": "fail",
            "transcript": "",
            "ocr_text": [],
        }


# --------------------------------------------------------------------------
# NODE 2: Compliance Auditor Node (RAG + Azure Search + Groq LLM)
# --------------------------------------------------------------------------
def audio_content_node(state: VideoAuditState) -> Dict[str, Any]:
    logger.info("[Node: Auditor] Querying knowledge base and LLM...")

    transcript = state.get("transcript", "")
    ocr_text = state.get("ocr_text", [])
    errors = state.get("errors", [])

    if not transcript and not ocr_text:
        err_msg = errors[0] if errors else "Video processing failed to extract transcript or OCR text."
        logger.warning(f"[Node: Auditor] Extraction failed. Reason: {err_msg}")
        return {
            "final_status": "fail",
            "final_report": f"Audit skipped due to extraction error: {err_msg}",
            "compliance_results": [],
        }

    # 1. Initialize Groq Chat Model
    llm = ChatGroq(
        groq_api_key=os.getenv("GROQ_API_KEY"),
        model_name=os.getenv("GROQ_MODEL_NAME", "llama-3.3-70b-versatile"),
        temperature=0,
    )

    # Enforce structured output via Pydantic schema
    structured_llm = llm.with_structured_output(AuditResult)

    # 2. Retrieve Vector Store Singleton
    vector_store = get_vector_store()

    query_text = (transcript + " " + " ".join(ocr_text)).strip()
    docs = vector_store.similarity_search(query_text, k=3)
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
1. Analyze the transcript and on-screen OCR text provided by the user.
2. Identify any violations of compliance rules.
3. Output the structured audit evaluation according to the required schema.
If no violations are found, set "status" to "pass" and "compliance_results" to an empty list.
"""

    user_message = f"""
Video Metadata: {state.get("video_metadata", {})}
Transcript: {transcript}
On-Screen OCR Text: {ocr_text}
"""

    try:
        # Pydantic object returned directly by structured LLM invocation
        result: AuditResult = structured_llm.invoke(
            [SystemMessage(content=system_prompt), HumanMessage(content=user_message)]
        )

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