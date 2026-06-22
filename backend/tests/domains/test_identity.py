import uuid

from domains.identity.schemas import RoleEnum, UserCreate
from domains.identity.service import create_user


def test_get_me(admin_client):
    response = admin_client.get("/auth/me")
    assert response.status_code == 200
    data = response.json()
    assert data["username"] == "admin_test"
    assert data["role"] == "admin"


def test_refresh_token(admin_client):
    response = admin_client.post("/auth/refresh")
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"


def test_login_history(admin_client):
    response = admin_client.get("/auth/login-history")
    assert response.status_code == 200
    assert isinstance(response.json(), list)


def test_login_with_real_user(client, db_session):
    user_payload = UserCreate(
        username="faiz",
        pin="1234",
        role=RoleEnum.ADMIN,
        full_name="Faiz",
    )
    create_user(db=db_session, user=user_payload)

    response = client.post(
        "/auth/login",
        data={"username": "faiz", "password": "1234"},
    )
    assert response.status_code == 200, response.text
    assert "access_token" in response.json()


def test_login_missing_fields(client):
    response = client.post("/auth/login", data={})
    assert response.status_code == 422


def test_login_invalid_credentials(client):
    response = client.post(
        "/auth/login",
        data={"username": "wrong@test.com", "password": "wrongpassword"},
    )
    assert response.status_code == 401
    assert "Username atau PIN salah" in response.json()["detail"]


def test_register_admin_edge_cases(client):
    response = client.post(
        "/auth/register-admin",
        json={
            "username": "invalid-admin",
            "pin": "123",
            "role": "admin",
            "email": "invalid-email",
            "full_name": "",
        },
    )
    assert response.status_code in [400, 422]


def test_unauthenticated_access_to_protected_routes(client):
    protected_routes = [
        "/auth/me",
        "/auth/login-history",
        "/auth/invitations",
    ]
    for route in protected_routes:
        res = client.get(route)
        assert res.status_code == 401


def test_invite_user_unauthorized(regular_client):
    payload = {
        "email": "test@example.com",
        "role": "cashier",
        "store_nbr": 1,
        "full_name": "Test Cashier",
    }
    response = regular_client.post("/auth/invite-user", json=payload)
    assert response.status_code == 403


def test_invite_user_admin(admin_client):
    payload = {
        "email": f"test-{uuid.uuid4()}@example.com",
        "role": "cashier",
        "store_nbr": 1,
        "full_name": "Test Cashier",
    }
    response = admin_client.post("/auth/invite-user", json=payload)
    assert response.status_code == 201


def test_list_invitations(admin_client):
    response = admin_client.get("/auth/invitations")
    assert response.status_code == 200
    assert isinstance(response.json(), list)


def test_forgot_password(client):
    response = client.post(
        "/auth/forgot-password",
        json={"email": "nonexistent@example.com"},
    )
    assert response.status_code == 200


def test_2fa_setup_init(admin_client):
    response = admin_client.post("/auth/2fa/setup/init")
    assert response.status_code == 200
    data = response.json()
    assert "secret" in data
    assert "otpauth_uri" in data
    assert "qr_code_base64" in data


def test_change_password_invalid_pin(admin_client):
    payload = {
        "current_pin": "9999",
        "new_pin": "123456",
    }
    response = admin_client.post("/auth/change-password", json=payload)
    assert response.status_code == 401
