import pytest
from unittest.mock import patch

def test_health_endpoint_healthy(client):
    """Verifies that GET /api/health reports healthy status and database dialect."""
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] in ["healthy", "degraded"]
    assert "database" in data
    assert "status" in data["database"]
    assert "dialect" in data["database"]
    assert "app" in data
    assert "timestamp" in data

def test_health_endpoint_database_failure(client):
    """Verifies that GET /api/health accurately reports degraded status when DB is unreachable."""
    with patch("app.api.routes_health.check_db_connection") as mock_check:
        mock_check.return_value = {
            "status": "disconnected",
            "dialect": "postgresql",
            "latency_ms": 150.0,
            "error": "Connection refused to PostgreSQL host",
        }
        response = client.get("/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "degraded"
        assert data["database"]["status"] == "disconnected"
        assert "Connection refused" in data["database"]["error"]
