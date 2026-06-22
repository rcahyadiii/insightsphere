import importlib

import pytest
from fastapi.testclient import TestClient


@pytest.fixture(scope="module")
def fresh_client(monkeypatch_module):
    """Reload core.rate_limit and main with limiter enabled."""
    monkeypatch_module.setenv("RATE_LIMIT_ENABLED", "1")

    import core.rate_limit as rl_module

    importlib.reload(rl_module)
    import main as main_module

    importlib.reload(main_module)
    return TestClient(main_module.app)


@pytest.fixture(scope="module")
def monkeypatch_module():
    mp = pytest.MonkeyPatch()
    yield mp
    mp.undo()


def test_login_endpoint_returns_429_after_burst(fresh_client):
    burst_client = "203.0.113.99"
    headers = {"X-Forwarded-For": burst_client}
    seen_429 = False
    for _ in range(8):
        resp = fresh_client.post(
            "/auth/login",
            data={"username": "ratelimit", "password": "wrong-pin"},
            headers=headers,
        )
        if resp.status_code == 429:
            seen_429 = True
            break
    assert seen_429, "expected slowapi to enforce 429 within 8 attempts"


def test_forgot_password_returns_429_after_burst(fresh_client):
    burst_client = "203.0.113.100"
    headers = {"X-Forwarded-For": burst_client}
    seen_429 = False
    for _ in range(6):
        resp = fresh_client.post(
            "/auth/forgot-password",
            json={"email": "no-such-user@example.com"},
            headers=headers,
        )
        if resp.status_code == 429:
            seen_429 = True
            break
    assert seen_429, "expected slowapi to enforce 429 on forgot-password burst"

def test_limiter_does_not_set_global_default_limits():
    """Regression guard: jangan re-introduce `default_limits` global.

    Pernah dipasang `Limiter(default_limits=["5/minute"])` → semua endpoint
    (termasuk `/inventory/products` POST, `/sales/transactions`) ikut kena
    5/min dan 7 pytest CRUD merah karena 429 false positive.
    Kebijakan: limit hanya via decorator eksplisit per endpoint sensitif.
    """
    import core.rate_limit as rate_limit_module

    limiter = rate_limit_module.limiter
    # slowapi menyimpan default limits di internal `_default_limits` (list)
    default_limits = getattr(limiter, "_default_limits", [])
    assert not default_limits, (
        "Limiter dipasang `default_limits` global; semua endpoint akan ikut "
        f"kena limit. Hapus param itu dari `core/rate_limit.py`. (saat ini: {default_limits!r})"
    )
