import os
import logging
from azure.monitor.opentelemetry import configure_azure_monitor

logger = logging.getLogger("brand_guardian_telemetry")


def setup_telemetry():
    """
    Initializes Azure Monitor OpenTelemetry for Application Insights.
    Captures HTTP requests (FastAPI endpoints), database calls,
    errors, and system performance metrics.
    """
    connection_string = os.getenv("APPLICATIONINSIGHTS_CONNECTION_STRING")

    if not connection_string:
        logger.warning(
            "APPLICATIONINSIGHTS_CONNECTION_STRING is missing. "
            "Azure Application Insights telemetry disabled."
        )
        return

    try:
        # Configure Azure Monitor OpenTelemetry
        # Omitting logger_name allows telemetry to collect logs across all application modules
        configure_azure_monitor(
            connection_string=connection_string
        )
        logger.info("Azure Monitor tracking initialized successfully.")
    except Exception as e:
        logger.error(f"Failed to initialize Azure Monitor: {str(e)}")