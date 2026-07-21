import os
import logging
from azure.monitor.opentelemetry import configure_azure_monitor

# Dedicated logger for telemetry initialization
logger = logging.getLogger("brand_guardian_telemetry")


def setup_telemetry():
    """
    Initializes Azure Monitor OpenTelemetry for Application Insights.
    Automatically captures HTTP requests (FastAPI endpoints), database calls,
    errors, and system performance metrics.
    """
    # Retrieve Application Insights Connection String from environment
    connection_string = os.getenv("APPLICATION_INSIGHTS_CONNECTION_STRING")

    # Check if Connection String is available
    if not connection_string:
        logger.warning(
            "No instrumentation key/connection string found. "
            "Azure Application Insights telemetry is disabled."
        )
        return

    try:
        # Configure Azure Monitor with OpenTelemetry
        configure_azure_monitor(
            connection_string=connection_string,
            logger_name="brand_guardian_tracing"
        )
        logger.info("Azure Monitor tracking enabled and connected successfully.")
    except Exception as e:
        logger.error(f"Failed to initialize Azure Monitor: {str(e)}")