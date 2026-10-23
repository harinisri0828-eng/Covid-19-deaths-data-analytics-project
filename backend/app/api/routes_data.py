from datetime import date
from typing import Optional
from fastapi import APIRouter, Depends, Query, Response
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas.covid import DataQueryResponse
from app.services.data_service import query_covid_records, export_records_csv

router = APIRouter(prefix="/data", tags=["Data Explorer"])

@router.get("", response_model=DataQueryResponse)
@router.get("/explore", response_model=DataQueryResponse, include_in_schema=False)
def get_data_records(
    location: Optional[str] = Query(None, description="Country/Location filter"),
    iso_code: Optional[str] = Query(None, description="ISO Code, e.g. IND, USA"),
    start_date: Optional[date] = Query(None, description="Start date YYYY-MM-DD"),
    end_date: Optional[date] = Query(None, description="End date YYYY-MM-DD"),
    page: int = Query(1, ge=1, description="Page number"),
    limit: int = Query(50, ge=1, le=500, description="Records per page"),
    sort_by: str = Query("date", description="Sort column"),
    sort_dir: str = Query("desc", description="Sort direction: asc or desc"),
    db: Session = Depends(get_db),
):
    """
    Search, filter, paginate, and sort historical COVID-19 database records.
    """
    total_count, records = query_covid_records(
        db,
        location=location,
        iso_code=iso_code,
        start_date=start_date,
        end_date=end_date,
        page=page,
        limit=limit,
        sort_by=sort_by,
        sort_dir=sort_dir,
    )
    return DataQueryResponse(
        source="PostgreSQL / SQLAlchemy",
        total_count=total_count,
        page=page,
        limit=limit,
        records=records,
    )

@router.get("/export")
def export_csv(
    location: Optional[str] = Query(None),
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    limit: int = Query(5000, ge=1, le=50000),
    db: Session = Depends(get_db),
):
    """
    Exports filtered COVID-19 dataset directly as a streaming CSV download.
    """
    csv_data = export_records_csv(
        db,
        location=location,
        start_date=start_date,
        end_date=end_date,
        limit=limit,
    )
    filename = f"covid_data_export_{date.today().isoformat()}.csv"
    return Response(
        content=csv_data,
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )
