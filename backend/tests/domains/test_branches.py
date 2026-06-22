import uuid

from core.security import get_current_user_payload
from domains.identity.models import User
from domains.observability.models import AuditEvent
from main import app


def _payload(
    store_nbr: int = 101,
    branch_code: str = "jkt-pst-01",
    name: str = "Jakarta Pusat 01",
):
    return {
        "store_nbr": store_nbr,
        "branch_code": branch_code,
        "name": name,
        "address": "Jl. Merdeka Barat No. 45, Gambir, Jakarta Pusat",
        "phone": "+62 812 0000 0000",
        "email": f"branch-{store_nbr}@example.com",
        "opening_time": "08:00:00",
        "closing_time": "21:00:00",
    }


def test_create_branch_admin_records_audit_event(admin_client, db_session):
    response = admin_client.post("/branches", json=_payload())

    assert response.status_code == 201, response.text
    data = response.json()
    assert data["store_nbr"] == 101
    assert data["branch_code"] == "JKT-PST-01"
    assert data["name"] == "Jakarta Pusat 01"
    assert data["is_active"] is True
    assert data["deleted_at"] is None

    audit = (
        db_session.query(AuditEvent)
        .filter(AuditEvent.event_type == "BRANCH_CREATED")
        .one()
    )
    assert audit.store_nbr is None
    assert audit.event_data["branch_store_nbr"] == 101
    assert audit.event_data["changed_fields"]["branch_code"]["new"] == "JKT-PST-01"


def test_create_branch_rejects_non_owner_admin(regular_client):
    response = regular_client.post("/branches", json=_payload(store_nbr=102))

    assert response.status_code == 403


def test_create_branch_rejects_duplicate_store_nbr(admin_client):
    first = admin_client.post("/branches", json=_payload(store_nbr=103, branch_code="JKT-BRT-01"))
    assert first.status_code == 201, first.text

    second = admin_client.post("/branches", json=_payload(store_nbr=103, branch_code="JKT-BRT-02"))

    assert second.status_code == 409
    assert "store_nbr" in second.text


def test_create_branch_rejects_duplicate_branch_code_after_normalization(admin_client):
    first = admin_client.post("/branches", json=_payload(store_nbr=104, branch_code="jkt-ut-01"))
    assert first.status_code == 201, first.text

    second = admin_client.post("/branches", json=_payload(store_nbr=105, branch_code=" JKT-UT-01 "))

    assert second.status_code == 409
    assert "branch_code" in second.text


def test_list_branches_filters_active_and_inactive(admin_client):
    active = admin_client.post("/branches", json=_payload(store_nbr=106, branch_code="JKT-SL-01"))
    inactive = admin_client.post("/branches", json=_payload(store_nbr=107, branch_code="JKT-SL-02"))
    assert active.status_code == 201, active.text
    assert inactive.status_code == 201, inactive.text

    inactive_id = inactive.json()["id"]
    delete_response = admin_client.delete(f"/branches/{inactive_id}")
    assert delete_response.status_code == 200, delete_response.text

    active_list = admin_client.get("/branches?status=active")
    assert active_list.status_code == 200, active_list.text
    assert {row["store_nbr"] for row in active_list.json()} == {106}

    inactive_list = admin_client.get("/branches?status=inactive")
    assert inactive_list.status_code == 200, inactive_list.text
    assert {row["store_nbr"] for row in inactive_list.json()} == {107}


def test_store_scoped_user_only_reads_own_active_branch(client, db_session):
    from domains.branches.models import Branch

    own = Branch(
        store_nbr=108,
        branch_code="JKT-OWN-01",
        name="Own Branch",
        address="Jakarta",
        is_active=True,
    )
    other = Branch(
        store_nbr=109,
        branch_code="JKT-OTH-01",
        name="Other Branch",
        address="Jakarta",
        is_active=True,
    )
    db_session.add_all([own, other])
    db_session.commit()

    def override_get_current_user_payload():
        return {
            "sub": "cashier_scope",
            "username": "cashier_scope",
            "role": "cashier",
            "store_nbr": 108,
        }

    app.dependency_overrides[get_current_user_payload] = override_get_current_user_payload
    try:
        response = client.get("/branches")
    finally:
        app.dependency_overrides.pop(get_current_user_payload, None)

    assert response.status_code == 200, response.text
    data = response.json()
    assert len(data) == 1
    assert data[0]["store_nbr"] == 108


def test_update_branch_records_changed_fields(admin_client, db_session):
    created = admin_client.post("/branches", json=_payload(store_nbr=110, branch_code="JKT-EDT-01"))
    assert created.status_code == 201, created.text

    branch_id = created.json()["id"]
    response = admin_client.patch(
        f"/branches/{branch_id}",
        json={"name": "Jakarta Edit 01", "phone": "+62 812 1111 1111"},
    )

    assert response.status_code == 200, response.text
    data = response.json()
    assert data["name"] == "Jakarta Edit 01"
    assert data["phone"] == "+62 812 1111 1111"

    audit = (
        db_session.query(AuditEvent)
        .filter(AuditEvent.event_type == "BRANCH_UPDATED")
        .one()
    )
    assert audit.event_data["branch_id"] == branch_id
    assert audit.event_data["changed_fields"]["name"]["old"] == "Jakarta Pusat 01"
    assert audit.event_data["changed_fields"]["name"]["new"] == "Jakarta Edit 01"


def test_deactivate_branch_is_blocked_when_active_users_exist(admin_client, db_session):
    created = admin_client.post("/branches", json=_payload(store_nbr=111, branch_code="JKT-BLK-01"))
    assert created.status_code == 201, created.text

    active_user = User(
        username=f"branch-user-{uuid.uuid4()}",
        email=f"branch-user-{uuid.uuid4()}@example.com",
        role="cashier",
        store_nbr=111,
        is_active=True,
        pin_hash="hashed",
    )
    db_session.add(active_user)
    db_session.commit()

    response = admin_client.delete(f"/branches/{created.json()['id']}")

    assert response.status_code == 409
    detail = response.json()["detail"]
    assert detail["code"] == "BRANCH_HAS_ACTIVE_USERS"
    assert detail["active_user_count"] == 1


def test_deactivate_and_reactivate_branch(admin_client):
    created = admin_client.post("/branches", json=_payload(store_nbr=112, branch_code="JKT-REA-01"))
    assert created.status_code == 201, created.text
    branch_id = created.json()["id"]

    deactivated = admin_client.delete(f"/branches/{branch_id}")
    assert deactivated.status_code == 200, deactivated.text
    assert deactivated.json()["is_active"] is False
    assert deactivated.json()["deleted_at"] is not None

    reactivated = admin_client.patch(f"/branches/{branch_id}", json={"is_active": True})
    assert reactivated.status_code == 200, reactivated.text
    assert reactivated.json()["is_active"] is True
    assert reactivated.json()["deleted_at"] is None
