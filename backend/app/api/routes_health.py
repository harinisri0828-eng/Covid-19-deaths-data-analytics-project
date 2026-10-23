from datetime import datetime, timezone
from fastapi import APIRouter
from app.database import check_db_connection
from app.schemas.covid import HealthResponse, DatabaseHealth

router = APIRouter(tags=["Health"])

@router.get("/health", response_model=HealthResponse)
def health_check():
    """
    Reports application status and database connectivity separately.
    Does not pretend database is connected if query fails.
    """
    db_info = check_db_connection()
    overall_status = "healthy" if db_info["status"] == "connected" else "degraded"

    return HealthResponse(
        status=overall_status,
        app="COVID-19 Analytics and Prediction System API",
        database=DatabaseHealth(
            status=db_info["status"],
            dialect=db_info["dialect"],
            latency_ms=db_info.get("latency_ms"),
            error=db_info.get("error"),
        ),
        timestamp=datetime.now(timezone.utc),
        version="1.0.0",
    )
