import pytest

def test_get_predictions_public(client):
    response = client.get("/api/analytics/predictions")
    assert response.status_code == 200
    assert isinstance(response.json(), list)

def test_get_metrics_public(client):
    response = client.get("/api/analytics/metrics")
    assert response.status_code == 200
    assert isinstance(response.json(), list)
