import pytest
import uuid

def test_get_notifications_unauthorized(client):
    response = client.get("/notifications")
    assert response.status_code == 401

def test_trigger_and_list_notifications(admin_client):
    me_res = admin_client.get("/auth/me")
    assert me_res.status_code == 200
    user_id = me_res.json()["id"]

    payload = {
        "recipient_id": user_id,
        "title": "System Alert",
        "message": "Testing Notification",
        "category": "SYSTEM", # Must be uppercase based on enum
        "priority": "HIGH",   # Must be uppercase based on enum
    }
    trigger_res = admin_client.post("/notifications/test-trigger", json=payload)
    assert trigger_res.status_code == 201, trigger_res.text

    list_res = admin_client.get("/notifications")
    assert list_res.status_code == 200
    data = list_res.json()
    assert "items" in data
    assert any(n["title"] == "System Alert" for n in data["items"])

    notification_id = trigger_res.json()["id"]
    read_res = admin_client.patch(f"/notifications/{notification_id}/read")
    assert read_res.status_code == 200
    assert read_res.json()["is_read"] is True

def test_trigger_notification_forbidden_for_regular_user(regular_client):
    payload = {
        "recipient_id": str(uuid.uuid4()),
        "title": "Hack Attempt",
        "message": "Testing",
        "category": "SYSTEM",
        "priority": "LOW"
    }
    res = regular_client.post("/notifications/test-trigger", json=payload)
    assert res.status_code == 403
