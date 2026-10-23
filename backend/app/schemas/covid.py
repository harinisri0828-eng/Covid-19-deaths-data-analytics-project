from datetime import date, datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field

# Health Schemas
class DatabaseHealth(BaseModel):
    status: str
    dialect: str
    latency_ms: Optional[float] = None
    error: Optional[str] = None

class HealthResponse(BaseModel):
    status: str
    app: str = "COVID-19 Analytics and Prediction System API"
    database: DatabaseHealth
    timestamp: datetime
    version: str = "1.0.0"

# Summary Schemas
class ObservationPeriod(BaseModel):
    min_date: Optional[str] = None
    max_date: Optional[str] = None
    total_records: int = 0
    total_locations: int = 0

class SummaryResponse(BaseModel):
    global_total_cases: Optional[int] = None
    global_total_deaths: Optional[int] = None
    global_vaccinations: Optional[int] = None
    india_total_cases: Optional[int] = None
    india_total_recovered: Optional[int] = None
    india_total_deaths: Optional[int] = None
    observation_period: ObservationPeriod
    ml_active_model: str = "Random Forest Regressor (Ensemble)"
    dataset_status: str = "ready"
    global_timeline: List[Dict[str, Any]] = []
    india_timeline: List[Dict[str, Any]] = []

# Country Schemas
class CountryItem(BaseModel):
    iso_code: str
    location: str
    name: Optional[str] = None
    continent: Optional[str] = None
    population: Optional[int] = None
    total_cases: Optional[float] = None
    new_cases: Optional[float] = None
    new_cases_smoothed: Optional[float] = None
    total_deaths: Optional[float] = None
    total_vaccinations: Optional[float] = None
    people_fully_vaccinated: Optional[float] = None
    total_cases_per_million: Optional[float] = None
    total_deaths_per_million: Optional[float] = None

class CountriesResponse(BaseModel):
    total_count: int
    countries: List[CountryItem]

# India State Schemas
class IndiaStateItem(BaseModel):
    state_name: str
    confirmed: Optional[int] = None
    active: Optional[int] = None
    recovered: Optional[int] = None
    deaths: Optional[int] = None
    recovery_rate: Optional[float] = None
    mortality_rate: Optional[float] = None
    tested: Optional[int] = None

class IndiaOverview(BaseModel):
    total_confirmed: Optional[int] = None
    active_cases: Optional[int] = None
    total_recovered: Optional[int] = None
    total_deaths: Optional[int] = None
    recovery_rate: Optional[float] = None
    mortality_rate: Optional[float] = None

class IndiaStatesResponse(BaseModel):
    overview: IndiaOverview
    states: List[IndiaStateItem]
    timeline: List[Dict[str, Any]] = []

# Trends Schemas
class TrendPoint(BaseModel):
    date: str
    raw_cases: Optional[float] = None
    ma_7: Optional[float] = None
    ma_14: Optional[float] = None
    new_deaths: Optional[float] = None

class WaveItem(BaseModel):
    wave_name: str
    period: str
    peak_cases: Optional[int] = None
    peak_deaths: Optional[int] = None
    variant: str
    cfr: Optional[float] = None

class TrendsResponse(BaseModel):
    rolling_series: List[TrendPoint] = []
    waves: List[WaveItem] = []
    current_velocity: Optional[str] = None
    effective_r: Optional[float] = None
    trends: Optional[Dict[str, Any]] = None

# Analytics Schemas
class FeatureStat(BaseModel):
    feature: str
    count: int
    mean: Optional[float] = None
    std: Optional[float] = None
    min: Optional[float] = None
    median: Optional[float] = None
    max: Optional[float] = None
    missing_pct: Optional[float] = None

class CorrelationItem(BaseModel):
    feature: str
    coefficient: float

class DistributionBin(BaseModel):
    bin_range: str
    frequency: int

class AnalyticsResponse(BaseModel):
    summary: Dict[str, Any]
    correlations: List[CorrelationItem] = []
    distribution_bins: List[DistributionBin] = []

# Data Query & Explorer Schemas
class DataQueryResponse(BaseModel):
    source: str
    total_count: int
    page: int
    limit: int
    records: List[Dict[str, Any]]
