"""Development API probe for transaction endpoints.

Requires APP_ENV=development and API_BASE_URL.
"""

from __future__ import annotations

import requests

from scripts.dev.dev_script_guard import get_api_base_url, require_development_env


TRANSACTION_PAYLOAD = {
    "branch_id": "3a25ed1a-7203-4581-9f28-410f918d579f",
    "date": "2026-04-16",
    "time": "14:30:00",
    "payment_method": "CASH",
    "items": [
        {
            "product_id": "123e4567-e89b-12d3-a456-426614174000",
            "quantity": 2,
            "unit_price_at_time": 25.50,
        }
    ],
}


def api_url(path: str) -> str:
    return f"{get_api_base_url()}{path}"


def main() -> None:
    require_development_env("test_transactions_api")

    print("Menguji POST /transactions/ dengan payload default:")
    response = requests.post(api_url("/transactions/"), json=TRANSACTION_PAYLOAD, timeout=10)
    print(f"Status Code: {response.status_code}")
    print(f"Response: {response.text}")

    print("\nMenguji GET /summary/today:")
    summary_response = requests.get(api_url("/transactions/summary/today"), timeout=10)
    print(f"Status Code: {summary_response.status_code}")
    print(f"Response: {summary_response.text}")


if __name__ == "__main__":
    main()
