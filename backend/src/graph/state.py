import operator
from typing import Annotated, List, Dict, Optional, Any, TypedDict

# Schema for an individual compliance issue / violation
class ComplianceIssue(TypedDict):
    category: str
    description: str
    severity: str
    timestamp: Optional[str]

# Main Graph State Container
class VideoAuditState(TypedDict):
    # Inputs
    video_url: str
    video_id: str
    
    # Ingestion & Extraction Data
    local_file_path: Optional[str]
    video_metadata: Dict[str, Any]
    transcript: Optional[str]
    ocr_text: List[str]
    
    # Analysis & Deliverables
    compliance_results: Annotated[List[ComplianceIssue], operator.add]
    final_status: str
    final_report: str
    
    # Observability / Errors
    errors: Annotated[List[str], operator.add]