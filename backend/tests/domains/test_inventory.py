import pytest
from uuid import UUID

from core.security import get_current_user_payload
from main import app
from domains.dataset.models import Store
from domains.inventory.models import Inventory

def test_list_products_unauthorized(client):
    response = client.get("/inventory/products")
    assert response.status_code == 401

def test_create_product_admin(admin_client):
    payload = {
        "sku": "SKU-TEST-001",
        "name": "Beras Premium 5kg Test",
        "family": "GROCERY I",
        "category": "Sembako",
        "unit": "pcs",
        "base_price": 75000,
        "cost_price": 62000,
        "supplier": "PT Test"
    }
    response = admin_client.post("/inventory/products", json=payload)
    assert response.status_code == 201, response.text # Status should be 201 Created
    data = response.json()
    assert data["sku"] == "SKU-TEST-001"
    
    list_res = admin_client.get("/inventory/products")
    assert list_res.status_code == 200
    assert any(p["sku"] == "SKU-TEST-001" for p in list_res.json())

    product_id = data["id"]
    get_res = admin_client.get(f"/inventory/products/{product_id}")
    assert get_res.status_code == 200
    assert get_res.json()["name"] == "Beras Premium 5kg Test"

def test_create_product_regular_user_forbidden(regular_client):
    payload = {
        "sku": "SKU-TEST-FORBIDDEN",
        "name": "Should not work",
        "family": "GROCERY",
        "category": "Sembako",
        "base_price": 10000,
        "cost_price": 5000
    }
    response = regular_client.post("/inventory/products", json=payload)
    assert response.status_code == 403, response.text

def test_create_product_duplicate_sku(admin_client):
    payload = {
        "sku": "DUP-SKU",
        "name": "Prod 1",
        "family": "GROCERY",
        "category": "Test",
        "base_price": 15000,
        "cost_price": 10000
    }
    res1 = admin_client.post("/inventory/products", json=payload)
    assert res1.status_code == 201
    
    res2 = admin_client.post("/inventory/products", json=payload)
    assert res2.status_code in [400, 409], res2.text 

def test_update_product(admin_client):
    payload = {"sku": "UPD-SKU", "name": "Old", "family": "G", "category": "C", "base_price": 10, "cost_price": 5}
    res = admin_client.post("/inventory/products", json=payload)
    assert res.status_code == 201
    product_id = res.json()["id"]

    update_res = admin_client.put(f"/inventory/products/{product_id}", json={"name": "New Name", "base_price": 200})
    assert update_res.status_code == 200
    assert update_res.json()["name"] == "New Name"
    
def test_delete_product(admin_client):
    payload = {"sku": "DEL-SKU", "name": "To Delete", "family": "G", "category": "C", "base_price": 10, "cost_price": 5}
    res = admin_client.post("/inventory/products", json=payload)
    assert res.status_code == 201
    product_id = res.json()["id"]

    del_res = admin_client.delete(f"/inventory/products/{product_id}")
    assert del_res.status_code in [200, 204]

    get_res = admin_client.get(f"/inventory/products/{product_id}")
    assert get_res.status_code == 404

def test_get_filter_options(admin_client):
    response = admin_client.get("/inventory/products/filters")
    assert response.status_code == 200
    data = response.json()
    assert "categories" in data
    assert "families" in data
    # The key is 'families', not 'suppliers'
    assert "suppliers" not in data

def test_record_stock_movement_and_summary(admin_client):
    admin_client.post("/inventory/products", json={
        "sku": "STOCK-SKU", "name": "Stock Item", "family": "G", "category": "C", "base_price": 10, "cost_price": 5
    })
    
    list_stock_res = admin_client.get("/inventory/stock")
    assert list_stock_res.status_code == 200
    
    summary_res = admin_client.get("/inventory/stock/summary")
    assert summary_res.status_code == 200
    assert "total_products" in summary_res.json()

def test_stock_list_includes_pos_product_fields(admin_client, db_session):
    store = Store(store_nbr=1, city="Test City", state="Test State", type="D", cluster=1)
    db_session.add(store)
    db_session.commit()

    product_res = admin_client.post("/inventory/products", json={
        "sku": "POS-SKU",
        "name": "POS Product",
        "family": "PRINT",
        "category": "Jasa",
        "unit": "lembar",
        "base_price": 2500,
        "cost_price": 1000,
        "image_url": "https://example.test/product.png",
    })
    assert product_res.status_code == 201, product_res.text

    product_id = UUID(product_res.json()["id"])
    db_session.add(Inventory(
        product_id=product_id,
        store_nbr=1,
        current_stock=25,
        min_stock=5,
        max_stock=100,
        reorder_point=10,
        location="Rak POS",
    ))
    db_session.commit()

    stock_res = admin_client.get("/inventory/stock?store_nbr=1")
    assert stock_res.status_code == 200, stock_res.text
    item = next(row for row in stock_res.json() if row["product_sku"] == "POS-SKU")
    assert item["product_family"] == "PRINT"
    assert item["product_unit"] == "lembar"
    assert item["product_price"] == 2500
    assert item["product_image_url"] == "https://example.test/product.png"


def test_stock_list_defaults_cashier_to_own_store(client, db_session):
    store = Store(store_nbr=1, city="Test City", state="Test State", type="D", cluster=1)
    db_session.add(store)
    db_session.commit()

    product_res = client.post("/inventory/products", json={
        "sku": "CASHIER-STOCK",
        "name": "Cashier Stock",
        "family": "PRINT",
        "category": "Jasa",
        "unit": "lembar",
        "base_price": 1500,
        "cost_price": 500,
    })
    # Product creation is protected, so create directly when unauthenticated.
    if product_res.status_code != 201:
        from domains.inventory.models import Product
        product = Product(
            sku="CASHIER-STOCK",
            name="Cashier Stock",
            family="PRINT",
            category="Jasa",
            unit="lembar",
            base_price=1500,
            cost_price=500,
        )
        db_session.add(product)
        db_session.flush()
        product_id = product.id
    else:
        product_id = UUID(product_res.json()["id"])

    db_session.add(Inventory(
        product_id=product_id,
        store_nbr=1,
        current_stock=10,
        min_stock=2,
        max_stock=50,
        reorder_point=5,
    ))
    db_session.commit()

    def override_get_current_user_payload():
        return {
            "sub": "cashier_test",
            "username": "cashier_test",
            "role": "cashier",
            "store_nbr": 1,
        }

    app.dependency_overrides[get_current_user_payload] = override_get_current_user_payload
    try:
        response = client.get("/inventory/stock")
    finally:
        app.dependency_overrides.pop(get_current_user_payload, None)

    assert response.status_code == 200, response.text
    assert any(row["product_sku"] == "CASHIER-STOCK" for row in response.json())

def test_stock_movement_validation_error(admin_client):
    import uuid
    response = admin_client.post("/inventory/stock/movement", json={
        "inventory_id": str(uuid.UUID("00000000-0000-0000-0000-000000000000")),
        "movement_type": "INVALID_TYPE",
        "quantity": -10,
        "reason": ""
    })
    assert response.status_code == 422
