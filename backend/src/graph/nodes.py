import os
import logging
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

# Singletons for RAG Vector Store
_embeddings = None
_vector_store = None


def get_vector_store() -> AzureSearch:
    global _embeddings, _vector_store
    if _vector_store is None:
        logger.info("[Initialization] Loading Embeddings & Azure Vector Store...")
        _embeddings = HuggingFaceEmbeddings(model_name="all-MiniLM-L6-v2")
        _vector_store = AzureSearch(
            azure_search_endpoint=os.getenv("AZURE_SEARCH_ENDPOINT"),
            azure_search_key=os.getenv("AZURE_SEARCH_API_KEY"),
            index_name=os.getenv("AZURE_SEARCH_INDEX_NAME"),
            embedding_function=_embeddings.embed_query,
        )
    return _vector_store


class ComplianceViolation(BaseModel):
    category: str = Field(description="Name of the violation category")
    severity: str = Field(description="Severity degree: critical, high, medium, or low")
    description: str = Field(description="Detailed explanation of the rule violation")


class AuditResult(BaseModel):
    compliance_results: List[ComplianceViolation] = Field(default_factory=list)
    status: str = Field(description="Result status: 'pass' or 'fail'")
    final_report: str = Field(description="Detailed Markdown summary of findings")


# --------------------------------------------------------------------------
# NODE 1: Lightweight In-Memory Indexer Node
# --------------------------------------------------------------------------
def index_video_node(state: VideoAuditState) -> Dict[str, Any]:
    video_url = state.get("video_url")

    if state.get("transcript"):
        logger.info("[Node: Indexer] Using cached transcript — skipping extraction.")
        return {
            "transcript": state.get("transcript", ""),
            "ocr_text": state.get("ocr_text", []),
            "video_metadata": state.get("video_metadata", {}),
        }

    logger.info(f"[Node: Indexer] Fetching transcript directly from URL: {video_url}")

    try:
        vi_service = VideoIndexerService()
        clean_data = vi_service.fetch_transcript_and_metadata(video_url)
        return clean_data

    except Exception as e:
        full_trace = traceback.format_exc()
        logger.error(f"[Node: Indexer] Direct transcript extraction failed:\n{full_trace}")

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
    )

    structured_llm = llm.with_structured_output(AuditResult)
    vector_store = get_vector_store()

    query_text = transcript.strip()
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