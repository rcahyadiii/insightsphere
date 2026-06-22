import pytest

def test_list_templates_unauthorized(client):
    response = client.get("/reporting/templates")
    assert response.status_code == 401

def test_list_templates_authorized(admin_client):
    response = admin_client.get("/reporting/templates")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert any("export_type" in t for t in data)


def test_reporting_dashboard_stats_authorized(admin_client):
    response = admin_client.get("/reporting/dashboard-stats?period=month")
    assert response.status_code == 200
    data = response.json()
    assert "revenue" in data
    assert "transactions" in data
    assert "inventory_value" in data


def test_export_report_and_history(admin_client):
    # Corrected export_type based on enum
    payload = {
        "export_type": "SALES",
        "period": "month",
        "export_format": "CSV",
        "store_nbr": None
    }
    
    export_res = admin_client.post("/reporting/export", json=payload)
    assert export_res.status_code == 200, export_res.text
    assert export_res.headers["content-type"] in ["text/csv", "text/csv; charset=utf-8"]
    
    history_res = admin_client.get("/reporting/history")
    assert history_res.status_code == 200
    data = history_res.json()
    assert len(data) >= 1
    assert data[0]["export_type"] == "SALES"

def test_export_unauthorized(client):
    payload = {
        "export_type": "PROFIT_LOSS",
        "period": "month",
        "export_format": "CSV",
    }
    response = client.post("/reporting/export", json=payload)
    assert response.status_code == 401
