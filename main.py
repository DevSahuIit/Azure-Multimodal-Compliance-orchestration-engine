import uuid
import json
import logging
from pprint import pprint
from dotenv import load_dotenv

from backend.src.graph.workflow import app

# --------------------------------------------------------------------------
# Setup Logging
# --------------------------------------------------------------------------
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger("brand_guardian_runner")

# Load environment variables from .env
load_dotenv(override=True)


def run_cli_simulation():
    """
    Simulates a video compliance audit request from the Command Line Interface (CLI).
    Orchestrates session creation, workflow invocation, and report formatting.
    """
    session_id = str(uuid.uuid4())
    logger.info(f"Starting audit session: {session_id}")

    # Generate shortened video tracking ID
    video_id_short = f"vid_{session_id[:8]}"

    # Define initial graph state payload
    initial_inputs = {
        # Sample Neutrogena ad URL from the tutorial
        "video_url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",  
        "video_id": video_id_short,
        "compliance_results": [],
        "errors": []
    }

    logger.info("Initializing workflow execution...")
    print("\n--- Input Payload ---")
    print(json.dumps(initial_inputs, indent=2))

    try:
        # Invoke the compiled LangGraph workflow
        final_state = app.invoke(initial_inputs)
        logger.info("Workflow execution complete.")

        print("\n" + "=" * 50)
        print("         COMPLIANCE AUDIT REPORT         ")
        print("=" * 50)
        print(f"Video ID     : {final_state.get('video_id')}")
        print(f"Audit Status : {final_state.get('final_status', 'UNKNOWN').upper()}")
        print("-" * 50)

        # Print detected compliance violations
        results = final_state.get("compliance_results", [])
        if results:
            print("\nViolations Detected:")
            for idx, issue in enumerate(results, 1):
                severity = issue.get("severity", "N/A").upper()
                category = issue.get("category", "General")
                description = issue.get("description", "No description provided.")
                print(f" {idx}. [{severity}] [{category}]: {description}")
        else:
            print("\nNo violations detected. Video is compliant.")

        # Print final report summary
        print("\n--- Final Summary ---")
        print(final_state.get("final_report", "No summary report generated."))
        print("=" * 50 + "\n")

    except Exception as e:
        logger.error(f"Workflow execution failed: {str(e)}")
        raise e


if __name__ == "__main__":
    run_cli_simulation()