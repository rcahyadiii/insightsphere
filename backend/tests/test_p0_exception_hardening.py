from fastapi.testclient import TestClient

from main import app


TEST_PATH = "/__test/unhandled-exception-hardening"
SECRET_MARKER = "postgresql://secret-user:secret-pass@db.internal:5432/prod"


@app.get(TEST_PATH, include_in_schema=False)
def raise_unhandled_exception_for_test():
    raise RuntimeError(f"boom {SECRET_MARKER}")


def test_unhandled_exception_response_is_sanitized():
    client = TestClient(app, raise_server_exceptions=False)

    response = client.get(TEST_PATH)

    assert response.status_code == 500
    body = response.json()
    assert body == {"detail": "Internal server error"}
    serialized = response.text.lower()
    assert "traceback" not in serialized
    assert "runtimeerror" not in serialized
    assert "secret-user" not in serialized
    assert "secret-pass" not in serialized
    assert "db.internal" not in serialized
