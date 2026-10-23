from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.metadata import DatasetMetadata
from app.schemas.metadata import MetadataResponse, DatasetMetaItem

router = APIRouter(tags=["Metadata"])

@router.get("/metadata", response_model=MetadataResponse)
def get_metadata(db: Session = Depends(get_db)):
    """
    Returns recorded dataset metadata, geographic coverage, date boundaries,
    source URLs, and last import timestamps.
    """
    entries = db.query(DatasetMetadata).all()
    datasets = []
    for item in entries:
        datasets.append(DatasetMetaItem(
            dataset_name=item.dataset_name,
            source_url=item.source_url,
            records_count=item.records_count,
            min_date=item.min_date.isoformat() if item.min_date else None,
            max_date=item.max_date.isoformat() if item.max_date else None,
            geographic_coverage=item.geographic_coverage,
            last_imported_at=item.last_imported_at.isoformat() if item.last_imported_at else None,
            status=item.status,
            notes=item.notes,
        ))

    return MetadataResponse(
        system="COVID-19 Analytics and Prediction System",
        academic_scope="B.Tech Artificial Intelligence and Machine Learning (Data Engineering Capstone)",
        datasets=datasets,
    )
