from typing import Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas.covid import TrendsResponse
from app.services.analytics_service import compute_trends_analysis, get_excess_deaths_data

router = APIRouter(prefix="/trends", tags=["Trends"])

@router.get("", response_model=TrendsResponse)
@router.get("/summary", include_in_schema=False)
def get_trends(
    location: str = Query("India", description="Country/location name"),
    db: Session = Depends(get_db)
):
    """
    Returns 7-day and 14-day rolling moving averages, epidemic wave breakdowns,
    transmission velocity, and reproduction rate estimate.
    """
    data = compute_trends_analysis(db, location=location)
    return TrendsResponse(**data)

@router.get("/waves", include_in_schema=False)
def get_wave_dynamics(
    location: str = Query("India"),
    db: Session = Depends(get_db)
):
    """Returns epidemic wave transition comparison."""
    data = compute_trends_analysis(db, location=location)
    return {"waves": data["waves"]}

@router.get("/excess-deaths", include_in_schema=False)
def get_excess_deaths_timeline():
    """Returns weekly excess mortality timeline from demographic dataset."""
    records = get_excess_deaths_data()
    return {"excess_deaths": records}
