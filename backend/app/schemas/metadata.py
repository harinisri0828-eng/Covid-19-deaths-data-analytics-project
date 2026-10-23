from typing import Optional, List, Dict, Any
from pydantic import BaseModel

class DatasetMetaItem(BaseModel):
    dataset_name: str
    source_url: str
    records_count: int
    min_date: Optional[str] = None
    max_date: Optional[str] = None
    geographic_coverage: Optional[str] = None
    last_imported_at: Optional[str] = None
    status: str
    notes: Optional[str] = None

class MetadataResponse(BaseModel):
    system: str = "COVID-19 Analytics and Prediction System"
    academic_scope: str = "B.Tech Artificial Intelligence and Machine Learning"
    datasets: List[DatasetMetaItem]
