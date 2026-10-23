from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas.covid import AnalyticsResponse
from app.services.analytics_service import compute_dataset_analytics

router = APIRouter(tags=["Analytics"])

@router.get("/analytics", response_model=AnalyticsResponse)
def get_analytics(db: Session = Depends(get_db)):
    """
    Returns descriptive statistics (mean, std, quartiles, missing percentages),
    Pearson correlations with mortality, and frequency density bins.
    """
    data = compute_dataset_analytics(db)
    return AnalyticsResponse(**data)

@router.get("/analysis/stats", include_in_schema=False)
def get_analysis_stats(db: Session = Depends(get_db)):
    """Frontend helper returning summary table data and bins."""
    data = compute_dataset_analytics(db)
    return {
        "summary": data["summary"],
        "distribution_bins": data["distribution_bins"],
    }

@router.get("/analysis/correlations", include_in_schema=False)
def get_analysis_correlations(db: Session = Depends(get_db)):
    """Frontend helper returning correlation matrix."""
    data = compute_dataset_analytics(db)
    return {"correlations": data["correlations"]}
