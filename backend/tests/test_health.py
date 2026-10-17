"""
Tests for GET /api/health endpoint.
"""


def test_health_returns_200(client):
    """Health endpoint should return HTTP 200."""
    response = client.get("/api/health")
    assert response.status_code == 200


def test_health_returns_json(client):
    """Health endpoint should return JSON content-type."""
    response = client.get("/api/health")
    assert response.content_type == "application/json"


def test_health_response_shape(client):
    """Health response must contain status, service, and timestamp keys."""
    response = client.get("/api/health")
    data = response.get_json()
    assert data["status"] == "ok"
    assert data["service"] == "PeerConnect API"
    assert "timestamp" in data
