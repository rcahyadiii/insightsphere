import uuid

from domains.dataset.models import Store
from domains.inventory.models import Inventory


def _create_store_inventory(db_session, product_id, store_nbr=1):
    store = Store(
        store_nbr=store_nbr,
        city="Test City",
        state="Test State",
        type="A",
        cluster=1,
    )
    db_session.add(store)
    db_session.flush()

    inventory = Inventory(
        product_id=uuid.UUID(product_id),
        store_nbr=store_nbr,
        current_stock=100,
        min_stock=1,
        max_stock=200,
        reorder_point=10,
        version=1,
    )
    db_session.add(inventory)
    db_session.commit()
    return store_nbr

def test_fetch_transactions_authorized(admin_client):
    response = admin_client.get("/transactions/")
    assert response.status_code == 200
    assert isinstance(response.json(), list)

def test_create_transaction_and_summary(admin_client, db_session):
    # Create a product
    prod_res = admin_client.post("/inventory/products", json={
        "sku": "TXN-SKU-2", "name": "Transact Item 2", "family": "G", "category": "C",
        "base_price": 50000.0, "cost_price": 40000.0
    })
    assert prod_res.status_code == 201
    product_id = prod_res.json()["id"]
    store_nbr = _create_store_inventory(db_session, product_id)

    payload = {
        "store_nbr": store_nbr,
        "date": "2026-04-19",
        "time": "14:30:00",
        "payment_method": "CASH",
        "items": [
            {
                "product_id": product_id,
                "quantity": 2,
                "unit_price_at_time": 50000.0,
                "version_at_transaction": 1
            }
        ]
    }
    
    response = admin_client.post("/transactions/", json=payload)
    assert response.status_code in [200, 201], response.text
    
    # Test summary endpoint
    summary_res = admin_client.get("/transactions/summary/today")
    assert summary_res.status_code == 200
    data = summary_res.json()
    assert "total_revenue" in data


def test_transactions_summary_range_authorized(admin_client, db_session):
    prod_res = admin_client.post("/inventory/products", json={
        "sku": "SUM-TXN-SKU-2", "name": "Summary Item 2", "family": "G", "category": "C",
        "base_price": 10000.0, "cost_price": 7000.0
    })
    assert prod_res.status_code == 201
    product_id = prod_res.json()["id"]
    store_nbr = _create_store_inventory(db_session, product_id)

    payload = {
        "store_nbr": store_nbr,
        "date": "2026-05-05",
        "time": "10:00:00",
        "payment_method": "QRIS",
        "items": [
            {
                "product_id": product_id,
                "quantity": 3,
                "unit_price_at_time": 10000.0,
                "version_at_transaction": 1
            }
        ]
    }
    create_res = admin_client.post("/transactions/", json=payload)
    assert create_res.status_code in [200, 201], create_res.text

    response = admin_client.get("/transactions/summary?date_from=2026-05-01&date_to=2026-05-12&group_by=day")
    assert response.status_code == 200
    data = response.json()
    assert data["total_revenue"] == 30000.0
    assert data["total_transactions"] == 1
    assert data["total_items"] == 3
    assert data["payment_methods"] == [{"method": "QRIS", "count": 1, "total": 30000.0}]
    assert data["series"] == [{"date": "2026-05-05", "revenue": 30000.0, "transactions": 1}]


def test_sync_offline_transactions(admin_client, db_session):
    # Get valid product and branch
    prod_res = admin_client.post("/inventory/products", json={
        "sku": "OFF-TXN-SKU-2", "name": "Offline Item 2", "family": "G", "category": "C",
        "base_price": 10000, "cost_price": 5000
    })
    assert prod_res.status_code == 201
    product_id = prod_res.json()["id"]
    store_nbr = _create_store_inventory(db_session, product_id)
    client_txn_id = uuid.uuid4()
    payload = {
        "transactions": [
            {
                "store_nbr": store_nbr,
                "date": "2026-04-19",
                "time": "15:00:00",
                "payment_method": "QRIS",
                "client_txn_id": str(client_txn_id),
                "items": [
                    {
                        "product_id": product_id,
                        "quantity": 2,
                        "unit_price_at_time": 10000.0,
                        "version_at_transaction": 1
                    }
                ]
            }
        ]
    }
    response = admin_client.post("/transactions/batch", json=payload)
    assert response.status_code == 207, response.text # 207 Multi-Status is expected
    data = response.json()
    assert data["synced"] >= 0
    assert data["failed"] >= 0

def test_create_transaction_validation_errors(admin_client):
    payload = {
        "branch_id": "invalid-uuid",
        "date": "invalid-date",
        "time": "99:99:99",
        "payment_method": "",
        "items": []
    }
    response = admin_client.post("/transactions/", json=payload)
    assert response.status_code == 422
