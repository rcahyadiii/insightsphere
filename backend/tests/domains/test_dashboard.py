from datetime import datetime, timezone

from domains.dataset.models import Store
from domains.sales.models import Transaction


def test_dashboard_overview_returns_expected_shape(admin_client):
    response = admin_client.get("/dashboard/overview")

    assert response.status_code == 200
    data = response.json()
    assert set(data) == {"today", "inventory", "model", "branch_comparison", "period_kpis"}
    assert "revenue" in data["today"]
    assert "total_products" in data["inventory"]
    assert isinstance(data["branch_comparison"], list)
    assert isinstance(data["period_kpis"], list)


def test_dashboard_overview_aggregates_today_branch_comparison(admin_client, db_session):
    store = Store(store_nbr=101, city="Jakarta", state="DKI", type="A", cluster=1)
    db_session.add(store)
    db_session.flush()

    now = datetime.now(timezone.utc)
    db_session.add(
        Transaction(
            branch_id=store.id,
            date=now.date(),
            time=now.time(),
            total_amount=125000,
            payment_method="CASH",
        )
    )
    db_session.commit()

    response = admin_client.get("/dashboard/overview")

    assert response.status_code == 200
    branch = response.json()["branch_comparison"][0]
    assert branch["store_nbr"] == 101
    assert branch["revenue"] == 125000
    assert branch["transactions"] == 1
