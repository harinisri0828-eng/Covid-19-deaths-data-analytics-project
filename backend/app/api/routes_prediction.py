import json
from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import desc, func
import pandas as pd

from app.database import get_db
from app.models.covid import CovidRecord
from app.models.india import IndiaStateRecord
from app.models.prediction import PredictionHistory
from app.schemas.prediction import (
    PredictRequest,
    PredictResponse,
    PredictionHistoryItem,
    ModelPerformanceResponse,
)
from app.ml.models import ml_pipeline

router = APIRouter(tags=["Machine Learning & Predictions"])

@router.post("/predict", response_model=PredictResponse)
@router.post("/prediction/forecast", response_model=PredictResponse, include_in_schema=False)
def execute_prediction(
    request: PredictRequest,
    db: Session = Depends(get_db),
):
    """
    Executes a multi-step forecasting prediction using Scikit-learn regressors.
    Persists prediction request and results into database history.
    """
    # 1. Query actual historical records for the requested region in CovidRecord
    records = (
        db.query(CovidRecord.date, CovidRecord.location, CovidRecord.new_cases, CovidRecord.new_cases_smoothed)
        .filter(CovidRecord.location.ilike(request.region))
        .order_by(CovidRecord.date)
        .all()
    )

    df_hist = None
    if records:
        df_hist = pd.DataFrame([{
            "date": r.date,
            "location": r.location,
            "new_cases": float(r.new_cases_smoothed or r.new_cases or 0),
        } for r in records])
    else:
        # 2. Check if region is an Indian State in IndiaStateRecord
        state_match = db.query(IndiaStateRecord).filter(IndiaStateRecord.state_name.ilike(request.region)).first()
        if state_match:
            total_india_confirmed = db.query(func.sum(IndiaStateRecord.confirmed)).scalar() or 44690000
            scale_ratio = float(state_match.confirmed) / float(total_india_confirmed) if total_india_confirmed > 0 else 0.1
            scale_ratio = max(0.005, min(1.0, scale_ratio))
            
            records_india = (
                db.query(CovidRecord.date, CovidRecord.new_cases, CovidRecord.new_cases_smoothed)
                .filter(CovidRecord.iso_code == "IND")
                .order_by(CovidRecord.date)
                .all()
            )
            df_hist = pd.DataFrame([{
                "date": r.date,
                "location": state_match.state_name,
                "new_cases": float((r.new_cases_smoothed or r.new_cases or 0) * scale_ratio),
            } for r in records_india])
        else:
            # 3. Fallback to India national records
            records_india = (
                db.query(CovidRecord.date, CovidRecord.location, CovidRecord.new_cases, CovidRecord.new_cases_smoothed)
                .filter(CovidRecord.iso_code == "IND")
                .order_by(CovidRecord.date)
                .all()
            )
            if records_india:
                df_hist = pd.DataFrame([{
                    "date": r.date,
                    "location": request.region,
                    "new_cases": float(r.new_cases_smoothed or r.new_cases or 0),
                } for r in records_india])

    if df_hist is None or df_hist.empty:
        raise HTTPException(
            status_code=400,
            detail="No historical epidemiological records available in database for training or forecasting. Run dataset ingestion first."
        )

    try:
        forecast_result = ml_pipeline.predict_multi_step(
            historical_df=df_hist,
            model_type=request.model_type,
            horizon_days=request.horizon_days,
            scenario=request.scenario,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction failed: {str(e)}")

    # Persist in database prediction_history table
    try:
        history_entry = PredictionHistory(
            region=request.region,
            model_name=request.model_type,
            horizon_days=request.horizon_days,
            scenario=request.scenario,
            r2_score=forecast_result.get("r2_score"),
            rmse=forecast_result.get("rmse"),
            mae=forecast_result.get("mae"),
            input_parameters=json.dumps(request.model_dump()),
            forecast_output=json.dumps(forecast_result.get("forecast", [])),
        )
        db.add(history_entry)
        db.commit()
    except Exception:
        db.rollback()

    return PredictResponse(**forecast_result)

@router.get("/predictions/history")
def get_prediction_history(
    limit: int = 50,
    db: Session = Depends(get_db),
):
    """
    Returns list of previously generated and persisted prediction runs.
    """
    entries = (
        db.query(PredictionHistory)
        .order_by(desc(PredictionHistory.created_at))
        .limit(limit)
        .all()
    )
    return {"history": [e.to_dict() for e in entries]}

@router.get("/model-performance", response_model=ModelPerformanceResponse)
@router.get("/models/performance", response_model=ModelPerformanceResponse, include_in_schema=False)
def get_model_performance(db: Session = Depends(get_db)):
    """
    Returns out-of-sample evaluation metrics (R², RMSE, MAE, MAPE, inference latency)
    benchmarked across Scikit-learn architectures on chronological test split.
    """
    if not ml_pipeline.metrics or not ml_pipeline.metrics.get("models"):
        # Attempt to train on India data if available in DB
        records = (
            db.query(CovidRecord.date, CovidRecord.location, CovidRecord.new_cases, CovidRecord.new_cases_smoothed)
            .filter(CovidRecord.iso_code.in_(["IND", "OWID_WRL"]))
            .order_by(CovidRecord.date)
            .all()
        )
        if records and len(records) >= 30:
            df = pd.DataFrame([{
                "date": r.date,
                "location": r.location,
                "new_cases": float(r.new_cases_smoothed or r.new_cases or 0),
            } for r in records])
            try:
                ml_pipeline.train_and_evaluate(df)
            except Exception:
                pass

    if ml_pipeline.metrics and ml_pipeline.metrics.get("models"):
        return ModelPerformanceResponse(
            summary=ml_pipeline.metrics["summary"],
            models=ml_pipeline.metrics["models"],
            test_fit_curve=ml_pipeline.metrics.get("test_fit_curve", []),
        )

    # Empty benchmark structure when no models have trained yet
    return ModelPerformanceResponse(
        summary={
            "best_model_name": "None",
            "best_r2": 0.0,
            "train_samples": 0,
            "test_samples": 0,
            "status": "awaiting_training",
        },
        models=[],
        test_fit_curve=[],
    )

@router.get("/prediction/models", include_in_schema=False)
def get_prediction_models():
    """Frontend helper returning available algorithms."""
    return {
        "models": [
            {"id": "random_forest", "name": "Random Forest Regressor (Ensemble)"},
            {"id": "linear_regression", "name": "Linear Regression (Ordinary Least Squares)"},
            {"id": "ridge", "name": "Ridge Regression (L2 Regularized)"},
        ]
    }
