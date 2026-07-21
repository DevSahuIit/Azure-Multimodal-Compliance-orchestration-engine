import os
import uuid
import logging
from typing import List, Optional

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from backend.src.api.telemetry import setup_telemetry
from backend.src.graph.workflow import app as compliance_graph

# Load environment variables
load_dotenv(override=True)

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("api_server")

# Initialize Azure OpenTelemetry / Application Insights
setup_telemetry()

# Create FastAPI application instance
app = FastAPI(
    title="Brand Guardian AI API",
    description="API for auditing video content against brand compliance rules.",
    version="1.0.0"
)

# Enable CORS for frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# --------------------------------------------------------------------------
# Pydantic Data Models (Request/Response Schemas)
# --------------------------------------------------------------------------
class AuditRequest(BaseModel):
    video_url: str


class ComplianceIssue(BaseModel):
    category: str
    severity: str
    description: str


class AuditResponse(BaseModel):
    session_id: str
    video_id: str
    status: str
    final_report: str
    compliance_results: List[ComplianceIssue]


# --------------------------------------------------------------------------
# API Endpoints
# --------------------------------------------------------------------------
@app.get("/health")
async def health_check():
    """Simple health check endpoint to verify API server status."""
    return {
        "status": "healthy",
        "service": "Brand Guardian AI"
    }


@app.post("/audit", response_model=AuditResponse)
async def audit_video(request: AuditRequest):
    """
    Main API endpoint that triggers the compliance audit workflow for a YouTube video URL.
    """
    session_id = str(uuid.uuid4())
    video_id_short = f"vid_{session_id[:8]}"

    logger.info(f"Received audit request for URL: {request.video_url} (Session ID: {session_id})")

    # Prepare input payload for LangGraph workflow
    initial_inputs = {
        "video_url": request.video_url,
        "video_id": video_id_short,
        "compliance_results": [],
        "errors": []
    }

    try:
        # Invoke compiled LangGraph execution graph
        final_state = compliance_graph.invoke(initial_inputs)

        return AuditResponse(
            session_id=session_id,
            video_id=final_state.get("video_id", video_id_short),
            status=final_state.get("final_status", "unknown"),
            final_report=final_state.get("final_report", "No report generated."),
            compliance_results=final_state.get("compliance_results", [])
        )

    except Exception as e:
        logger.error(f"Audit request failed: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Workflow execution failed: {str(e)}"
        )