import pytest
import pandas as pd
import numpy as np
from datetime import date, timedelta
from app.ml.models import engineer_features, MLPipeline

def test_feature_engineering_no_future_leakage():
    """Verifies that lag features strictly reference preceding time steps."""
    dates = [date(2021, 1, 1) + timedelta(days=i) for i in range(30)]
    cases = [i * 10.0 for i in range(30)]
    df = pd.DataFrame({"date": dates, "new_cases": cases})

    df_feat = engineer_features(df, target_col="new_cases")
    
    # Check that lag_1 corresponds strictly to cases at t-1
    for idx in range(len(df_feat)):
        curr_days = df_feat.iloc[idx]["days_since_start"]
        lag1 = df_feat.iloc[idx]["lag_1"]
        # In our linear test sequence cases = days * 10, so lag_1 should equal (curr_days - 1) * 10
        assert lag1 == (curr_days - 1) * 10

def test_prediction_input_validation(client):
    """Verifies that POST /api/predict rejects invalid horizon values."""
    # Test horizon_days > 60
    res_high = client.post("/api/predict", json={
        "region": "India",
        "model_type": "random_forest",
        "horizon_days": 100,
        "scenario": "baseline",
    })
    assert res_high.status_code == 422

    # Test horizon_days <= 0
    res_low = client.post("/api/predict", json={
        "region": "India",
        "model_type": "random_forest",
        "horizon_days": 0,
        "scenario": "baseline",
    })
    assert res_low.status_code == 422

def test_prediction_output_and_history(client, seed_test_data):
    """Tests POST /api/predict executes forecast and persists into /api/predictions/history."""
    payload = {
        "region": "India",
        "model_type": "random_forest",
        "horizon_days": 14,
        "scenario": "baseline",
    }
    response = client.post("/api/predict", json=payload)
    assert response.status_code == 200
    data = response.json()

    assert data["region"] == "India"
    assert data["horizon_days"] == 14
    assert len(data["forecast"]) == 14
    for day in data["forecast"]:
        assert "date" in day
        assert "predicted_cases" in day
        assert day["lower_bound"] <= day["upper_bound"]

    # Verify history persistence
    hist_res = client.get("/api/predictions/history")
    assert hist_res.status_code == 200
    hist_data = hist_res.json()
    assert "history" in hist_data
    assert len(hist_data["history"]) > 0
    latest = hist_data["history"][0]
    assert latest["region"] == "India"
    assert latest["horizon_days"] == 14

def test_model_performance_endpoint(client, seed_test_data):
    """Tests GET /api/model-performance returns benchmarks."""
    response = client.get("/api/model-performance")
    assert response.status_code == 200
    data = response.json()
    assert "summary" in data
    assert "models" in data
