from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field

class PredictRequest(BaseModel):
    region: str = Field(default="India", description="Country or Region name, e.g. India, World")
    model_type: str = Field(
        default="random_forest",
        description="ML Model: 'random_forest', 'linear_regression', 'ridge', 'polynomial'"
    )
    horizon_days: int = Field(default=14, ge=1, le=60, description="Forecast horizon between 1 and 60 days")
    scenario: str = Field(
        default="baseline",
        description="Simulation scenario: 'baseline', 'high_surge', 'suppression'"
    )

class ForecastDay(BaseModel):
    date: str
    predicted_cases: int
    lower_bound: int
    upper_bound: int
    confidence: float

class HistoricalPoint(BaseModel):
    date: str
    actual_cases: int

class FeatureWeight(BaseModel):
    feature: str
    feature_label: Optional[str] = None
    importance: float

class PredictResponse(BaseModel):
    region: str
    model_name: str
    horizon_days: int
    scenario: str
    r2_score: Optional[float] = None
    rmse: Optional[float] = None
    mae: Optional[float] = None
    confidence: Optional[float] = None
    peak_predicted: Optional[int] = None
    historical: List[HistoricalPoint] = []
    forecast: List[ForecastDay] = []
    feature_importance: List[FeatureWeight] = []

class PredictionHistoryItem(BaseModel):
    id: int
    created_at: datetime
    region: str
    model_name: str
    horizon_days: int
    scenario: str
    r2_score: Optional[float] = None
    rmse: Optional[float] = None
    mae: Optional[float] = None
    forecast_summary: Optional[Dict[str, Any]] = None

class ModelBenchmarkItem(BaseModel):
    name: str
    r2: float
    rmse: float
    mae: float
    mape: float
    latency_ms: float
    is_best: bool = False

class ModelPerformanceResponse(BaseModel):
    summary: Dict[str, Any]
    models: List[ModelBenchmarkItem] = []
    test_fit_curve: List[Dict[str, Any]] = []
