from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas.covid import SummaryResponse
from app.services.data_service import get_system_summary

router = APIRouter(tags=["Summary"])

@router.get("/summary", response_model=SummaryResponse)
@router.get("/dashboard/summary", response_model=SummaryResponse, include_in_schema=False)
def get_summary(db: Session = Depends(get_db)):
    """
    Returns global and national summary KPIs, observation dates, and trajectory timelines.
    Directly queries database records; returns empty structure if database is not initialized.
    """
    return get_system_summary(db)
