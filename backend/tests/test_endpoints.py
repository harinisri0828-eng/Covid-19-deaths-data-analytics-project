import pytest
from datetime import date
from unittest.mock import patch

def test_summary_with_seed(client, seed_test_data):
    """Tests GET /api/summary with seeded records."""
    response = client.get("/api/summary")
    assert response.status_code == 200
    data = response.json()
    assert "observation_period" in data
    assert data["observation_period"]["total_records"] >= 40
    assert data["india_total_cases"] is not None
    assert "ml_active_model" in data

def test_summary_empty_database(client):
    """Tests that GET /api/summary returns meaningful empty response when database has no records."""
    response = client.get("/api/summary")
    assert response.status_code == 200
    data = response.json()
    assert data["dataset_status"] == "empty"
    assert data["global_total_cases"] is None
    assert data["observation_period"]["total_records"] == 0

def test_countries_endpoint(client, seed_test_data):
    """Tests GET /api/countries pagination and structure."""
    response = client.get("/api/countries?limit=10")
    assert response.status_code == 200
    data = response.json()
    assert "countries" in data
    assert "total_count" in data
    assert len(data["countries"]) > 0
    first_c = data["countries"][0]
    assert "iso_code" in first_c
    assert "location" in first_c

def test_india_states_endpoint(client, seed_test_data):
    """Tests GET /api/india/states state-level records and overview calculations."""
    response = client.get("/api/india/states")
    assert response.status_code == 200
    data = response.json()
    assert "overview" in data
    assert "states" in data
    assert len(data["states"]) == 2
    state_names = [s["state_name"] for s in data["states"]]
    assert "Maharashtra" in state_names
    assert "Kerala" in state_names
    assert data["overview"]["total_confirmed"] == 8000000

def test_trends_endpoint_and_filtering(client, seed_test_data):
    """Tests GET /api/trends with rolling series and reproduction rate."""
    response = client.get("/api/trends?location=India")
    assert response.status_code == 200
    data = response.json()
    assert "rolling_series" in data
    assert "waves" in data
    assert len(data["rolling_series"]) > 0
    point = data["rolling_series"][0]
    assert "date" in point
    assert "ma_7" in point

def test_data_explorer_search_and_pagination(client, seed_test_data):
    """Tests GET /api/data with location search, date filter, and pagination."""
    # Search India
    res1 = client.get("/api/data?location=India&page=1&limit=10")
    assert res1.status_code == 200
    data1 = res1.json()
    assert data1["total_count"] >= 40
    assert len(data1["records"]) == 10
    assert data1["records"][0]["location"] == "India"

    # Search nonexistent location
    res2 = client.get("/api/data?location=Atlantis")
    assert res2.status_code == 200
    data2 = res2.json()
    assert data2["total_count"] == 0
    assert len(data2["records"]) == 0

    # Date filter
    res3 = client.get("/api/data?start_date=2021-01-10&end_date=2021-01-20")
    assert res3.status_code == 200
    data3 = res3.json()
    assert data3["total_count"] > 0

def test_csv_export(client, seed_test_data):
    """Tests GET /api/data/export returns valid streaming CSV."""
    response = client.get("/api/data/export?location=India&limit=50")
    assert response.status_code == 200
    assert "text/csv" in response.headers.get("content-type", "")
    assert "attachment;" in response.headers.get("content-disposition", "")
    content = response.text
    lines = content.strip().split("\n")
    assert len(lines) > 1
    assert "iso_code,location,date" in lines[0]
    assert "IND,India" in lines[1]

def test_analytics_endpoint(client, seed_test_data):
    """Tests GET /api/analytics returns statistical distributions and correlations."""
    response = client.get("/api/analytics")
    assert response.status_code == 200
    data = response.json()
    assert "summary" in data
    assert "correlations" in data
    assert "distribution_bins" in data
    assert data["summary"]["total_rows"] >= 40

def test_metadata_endpoint(client, seed_test_data):
    """Tests GET /api/metadata returns recorded dataset provenance."""
    response = client.get("/api/metadata")
    assert response.status_code == 200
    data = response.json()
    assert "datasets" in data
    assert len(data["datasets"]) > 0
    meta = data["datasets"][0]
    assert "dataset_name" in meta
    assert "source_url" in meta
    assert "records_count" in meta

def test_trends_excess_deaths_endpoint(client):
    """Tests GET /api/trends/excess-deaths parses weekly excess mortality safely."""
    response = client.get("/api/trends/excess-deaths")
    assert response.status_code == 200
    data = response.json()
    assert "excess_deaths" in data
    assert isinstance(data["excess_deaths"], list)

def test_database_failure_handling(seed_test_data):
    """Verifies that an unhandled database crash returns clean 500 without exposing secrets."""
    from fastapi.testclient import TestClient
    from app.main import app

    with patch("app.api.routes_summary.get_system_summary") as mock_summary:
        mock_summary.side_effect = Exception("FATAL: password authentication failed for user 'postgres'")
        unhandled_client = TestClient(app, raise_server_exceptions=False)
        response = unhandled_client.get("/api/summary")
        assert response.status_code == 500
        data = response.json()
        assert "internal server error" in data["detail"].lower()
        # Verify secret/password is NOT leaked
        assert "password" not in data["detail"]
