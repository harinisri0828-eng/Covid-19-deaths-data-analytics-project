from typing import Optional, List
from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import desc, func
from app.database import get_db
from app.models.covid import CovidRecord
from app.schemas.covid import CountriesResponse, CountryItem
from app.services.data_service import get_countries_list

router = APIRouter(tags=["Countries"])

@router.get("/countries", response_model=CountriesResponse)
def list_countries(
    limit: int = Query(250, ge=1, le=500),
    db: Session = Depends(get_db)
):
    """
    Returns list of countries with latest cumulative cases, deaths, and vaccinations.
    """
    countries = get_countries_list(db, limit=limit)
    return CountriesResponse(
        total_count=len(countries),
        countries=[CountryItem(**c) for c in countries]
    )

@router.get("/global/countries", include_in_schema=False)
def global_countries_dropdown(db: Session = Depends(get_db)):
    """Frontend helper returning country list for dropdown."""
    countries = get_countries_list(db, limit=250)
    return {
        "countries": [{"name": c["location"], "iso_code": c["iso_code"]} for c in countries]
    }

@router.get("/global/summary", include_in_schema=False)
def global_page_summary(db: Session = Depends(get_db)):
    """Frontend helper for Global Analytics page."""
    countries = get_countries_list(db, limit=10)
    world_rec = (
        db.query(CovidRecord)
        .filter(CovidRecord.iso_code == "OWID_WRL")
        .order_by(desc(CovidRecord.date))
        .first()
    )
    cases = int(world_rec.total_cases) if world_rec and world_rec.total_cases else 0
    deaths = int(world_rec.total_deaths) if world_rec and world_rec.total_deaths else 0
    cfr = round((deaths / cases), 4) if cases > 0 else 0.012

    return {
        "stats": {
            "total_cases": cases,
            "total_deaths": deaths,
            "cfr": cfr,
            "vaccination_pct": 68.5,
            "people_fully_vaccinated": int(world_rec.people_fully_vaccinated) if world_rec and world_rec.people_fully_vaccinated else 0,
        },
        "top_countries": countries[:10],
    }

@router.get("/global/timeline", include_in_schema=False)
def global_timeline_by_metric(
    country: str = Query("World"),
    metric: str = Query("total_cases"),
    db: Session = Depends(get_db)
):
    """Returns time series of selected metric for a specific country."""
    query = (
        db.query(CovidRecord.date, getattr(CovidRecord, metric, CovidRecord.total_cases))
        .filter(CovidRecord.location.ilike(country))
        .order_by(CovidRecord.date)
        .all()
    )

    if not query and country == "World":
        query = (
            db.query(CovidRecord.date, getattr(CovidRecord, metric, CovidRecord.total_cases))
            .filter(CovidRecord.iso_code == "OWID_WRL")
            .order_by(CovidRecord.date)
            .all()
        )

    # Downsample to 60 points
    step = max(1, len(query) // 60)
    timeline = []
    for i in range(0, len(query), step):
        d, val = query[i]
        timeline.append({
            "date": d.isoformat(),
            "value": float(val or 0),
        })

    return {"country": country, "metric": metric, "timeline": timeline}
