from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas.covid import IndiaStatesResponse
from app.services.india_service import get_india_state_data

router = APIRouter(prefix="/india", tags=["India"])

@router.get("/states", response_model=IndiaStatesResponse)
def get_india_states(db: Session = Depends(get_db)):
    """
    Returns state-level active, confirmed, recovered, deceased, and testing figures.
    """
    data = get_india_state_data(db)
    return IndiaStatesResponse(**data)

@router.get("/overview", include_in_schema=False)
def get_india_overview(db: Session = Depends(get_db)):
    """Frontend helper returning India overview."""
    data = get_india_state_data(db)
    return data
