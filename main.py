import os
import sys
import logging
from dotenv import load_dotenv

from backend.src.graph.workflow import app

load_dotenv(override=True)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("brand_guardian_runner")


def run_cli_simulation(video_url: str):
    """Executes the compliance graph dynamically for a given video URL."""
    initial_inputs = {
        "video_url": video_url,
        "video_id": f"vid_cli_{os.urandom(4).hex()}",
        "compliance_results": [],
        "errors": []
    }

    logger.info(f"Starting audit session for URL: {video_url}")
    try:
        final_state = app.invoke(initial_inputs)
        logger.info("Workflow execution complete.")
        print("\n==================================================")
        print("          COMPLIANCE AUDIT REPORT                 ")
        print("==================================================")
        print(f"Status: {final_state.get('final_status', 'UNKNOWN')}")
        print("--------------------------------------------------")
        print(final_state.get("final_report", "No report generated."))
        return final_state
    except Exception as e:
        logger.error(f"Workflow execution failed: {str(e)}")
        raise e


if __name__ == "__main__":
    # If a URL argument is passed via terminal: python main.py <url>
    # Otherwise, fall back to a default test URL for quick terminal testing
    target_url = sys.argv[1] if len(sys.argv) > 1 else "https://www.youtube.com/watch?v=I3CWFDgqvq8"
    run_cli_simulation(target_url)