#!/usr/bin/env python3
"""
Test spesifik untuk fitur offline sync yang baru ditambahkan:
1. Idempotency via client_txn_id (retry tidak bikin duplikat)
2. /auth/refresh endpoint
3. /inventory/products?updated_since=... (incremental sync)
"""

import requests
import uuid
import json
import time
import os
from datetime import datetime, timezone
import pytest

BASE_URL = os.getenv("OFFLINE_SYNC_BASE_URL", "http://localhost:8000")
pytestmark = pytest.mark.skipif(
    "OFFLINE_SYNC_BASE_URL" not in os.environ,
    reason="manual offline sync tests require OFFLINE_SYNC_BASE_URL",
)


def header(txt):
    print("\n" + "=" * 70)
    print(txt)
    print("=" * 70)


def login():
    r = requests.post(f"{BASE_URL}/auth/login", data={"username": "faiz", "password": "1234"})
    assert r.status_code == 200, f"Login failed: {r.status_code}"
    return r.json()["access_token"]


def get_test_data():
    """Ambil branch & product pertama untuk test.
    Catatan: `transactions.branch_id` FK ke `branches.id` (bukan stores).
    Karena tidak ada endpoint /branches publik, kita ambil dari existing transaction."""
    token = login()
    headers = {"Authorization": f"Bearer {token}"}

    # Ambil branch_id valid dari existing transaction
    txns = requests.get(f"{BASE_URL}/transactions/?limit=1", headers=headers).json()
    branch_id = txns[0]["branch_id"] if txns else None

    products = requests.get(f"{BASE_URL}/inventory/products?limit=1", headers=headers).json()

    return {
        "token": token,
        "branch_id": branch_id,
        "product": products[0] if products else None,
    }


def test_idempotency_single():
    """Patch #1: client_txn_id di POST /transactions/ harus idempotent."""
    header("TEST 1: Idempotency pada POST /transactions/ (single)")

    data = get_test_data()
    token, branch_id, product = data["token"], data["branch_id"], data["product"]
    headers = {"Authorization": f"Bearer {token}"}

    client_txn_id = f"test-{uuid.uuid4()}"
    payload = {
        "branch_id": branch_id,
        "date": datetime.now().date().isoformat(),
        "time": datetime.now().time().strftime("%H:%M:%S"),
        "payment_method": "CASH",
        "client_txn_id": client_txn_id,
        "items": [
            {
                "product_id": product["id"],
                "quantity": 1,
                "unit_price_at_time": 10000.0,
            }
        ],
    }

    # Request pertama
    r1 = requests.post(f"{BASE_URL}/transactions/", json=payload, headers=headers)
    print(f"  Request 1: {r1.status_code}")
    assert r1.status_code in (200, 201), f"Unexpected status: {r1.status_code} — {r1.text[:200]}"
    id1 = r1.json()["id"]
    print(f"    Created txn: {id1}")
    print(f"    client_txn_id: {r1.json().get('client_txn_id')}")

    # Request kedua dengan client_txn_id SAMA — harus return ID yang sama
    r2 = requests.post(f"{BASE_URL}/transactions/", json=payload, headers=headers)
    print(f"  Request 2 (retry same client_txn_id): {r2.status_code}")
    assert r2.status_code in (200, 201), f"Unexpected status: {r2.status_code}"
    id2 = r2.json()["id"]
    print(f"    Returned txn: {id2}")

    assert id1 == id2, f"IDEMPOTENCY FAILED: got different IDs {id1} vs {id2}"
    print(f"  [OK] Same ID returned → NO DUPLICATE!")


def test_idempotency_batch():
    """Patch #1: /transactions/batch harus detect duplicate via client_txn_id."""
    header("TEST 2: Idempotency pada POST /transactions/batch")

    data = get_test_data()
    token, branch_id, product = data["token"], data["branch_id"], data["product"]
    headers = {"Authorization": f"Bearer {token}"}

    # Buat 3 transaksi unik dengan WAKTU BERBEDA
    # Catatan: DB punya unique constraint (branch_id, date, time) untuk mencegah
    # double-entry di detik yang sama. Offset 1 detik per transaksi.
    cids = [f"batch-{uuid.uuid4()}" for _ in range(3)]
    base_time = datetime.now()

    def make_tx(cid, idx):
        tx_time = base_time.replace(second=(base_time.second + idx) % 60)
        return {
            "branch_id": branch_id,
            "date": tx_time.date().isoformat(),
            "time": tx_time.time().strftime("%H:%M:%S"),
            "payment_method": "CASH",
            "client_txn_id": cid,
            "items": [
                {
                    "product_id": product["id"],
                    "quantity": 1,
                    "unit_price_at_time": 5000.0,
                }
            ],
        }

    batch_payload = {"transactions": [make_tx(cid, i) for i, cid in enumerate(cids)]}

    # Sync pertama — semua harus sukses
    r1 = requests.post(f"{BASE_URL}/transactions/batch", json=batch_payload, headers=headers)
    print(f"  Batch sync 1: HTTP {r1.status_code}")
    body1 = r1.json()
    print(f"    Synced: {body1['synced']}, Failed: {body1['failed']}, Duplicate: {body1.get('duplicate', 0)}")
    # Debug: print error details
    for detail in body1.get("details", []):
        if detail.get("status") == "failed":
            print(f"    FAIL detail: {detail}")
    assert body1["synced"] == 3, f"Expected 3 synced, got {body1['synced']}"

    # Sync kedua dengan SAMA client_txn_id — harus semua jadi duplicate
    r2 = requests.post(f"{BASE_URL}/transactions/batch", json=batch_payload, headers=headers)
    print(f"  Batch sync 2 (retry): HTTP {r2.status_code}")
    body2 = r2.json()
    print(f"    Synced: {body2['synced']}, Failed: {body2['failed']}, Duplicate: {body2.get('duplicate', 0)}")
    assert body2["duplicate"] == 3, f"Expected 3 duplicates, got {body2.get('duplicate', 0)}"
    assert body2["synced"] == 0, f"Expected 0 new, got {body2['synced']}"

    # Verifikasi client_txn_id di-echo di response
    for detail in body2["details"]:
        assert detail["client_txn_id"] in cids, f"Missing client_txn_id echo: {detail}"
        assert detail["status"] == "duplicate"
    print(f"  [OK] All 3 detected as duplicate → IDEMPOTENT RETRY!")


def test_token_refresh():
    """Patch #2: /auth/refresh harus return token baru tanpa login ulang."""
    header("TEST 3: POST /auth/refresh (token rotation)")

    token_old = login()
    headers = {"Authorization": f"Bearer {token_old}"}

    # Sleep 1 detik supaya `exp` claim berbeda
    time.sleep(1)

    r = requests.post(f"{BASE_URL}/auth/refresh", headers=headers)
    print(f"  Status: {r.status_code}")
    assert r.status_code == 200, f"Refresh failed: {r.status_code} — {r.text[:200]}"

    token_new = r.json()["access_token"]
    print(f"  Old token: {token_old[:30]}...")
    print(f"  New token: {token_new[:30]}...")
    assert token_old != token_new, "Refresh returned SAME token — should be rotated!"

    # Verifikasi token baru valid
    r2 = requests.get(f"{BASE_URL}/auth/me", headers={"Authorization": f"Bearer {token_new}"})
    assert r2.status_code == 200, f"New token invalid: {r2.status_code}"
    print(f"  [OK] New token works → /auth/me returns {r2.status_code}")


def test_incremental_product_sync():
    """Patch #3: /inventory/products?updated_since=... untuk incremental sync."""
    header("TEST 4: GET /inventory/products?updated_since=... (incremental sync)")

    token = login()
    headers = {"Authorization": f"Bearer {token}"}

    # Query dengan updated_since = 2099 (far future) → harus return []
    r1 = requests.get(
        f"{BASE_URL}/inventory/products",
        params={"updated_since": "2099-01-01T00:00:00"},
        headers=headers,
    )
    print(f"  Query updated_since=2099: HTTP {r1.status_code}")
    body1 = r1.json()
    print(f"    Returned {len(body1)} products")
    assert r1.status_code == 200
    assert len(body1) == 0, f"Expected 0 products updated after 2099, got {len(body1)}"

    # Query tanpa updated_since → harus return semua produk
    r2 = requests.get(f"{BASE_URL}/inventory/products?limit=100", headers=headers)
    body2 = r2.json()
    print(f"  Query tanpa filter: HTTP {r2.status_code}, returned {len(body2)} products")
    assert len(body2) > 0, "Expected some products"

    # Query dengan updated_since = 2020 → harus return semua produk
    r3 = requests.get(
        f"{BASE_URL}/inventory/products?updated_since=2020-01-01T00:00:00Z&limit=100",
        headers=headers,
    )
    body3 = r3.json()
    print(f"  Query dengan updated_since=2020: HTTP {r3.status_code}, returned {len(body3)} products")
    assert len(body3) == len(body2), "Should return all products"
    print(f"  [OK] Incremental sync filter works!")


def main():
    print("\n" + "=" * 70)
    print("  OFFLINE SYNC READINESS TEST — 3 New Features")
    print("=" * 70)

    tests = [
        ("Idempotency (single)", test_idempotency_single),
        ("Idempotency (batch)", test_idempotency_batch),
        ("Token refresh", test_token_refresh),
        ("Incremental product sync", test_incremental_product_sync),
    ]

    passed = 0
    failed = 0
    for name, fn in tests:
        try:
            fn()
            passed += 1
        except AssertionError as e:
            print(f"  [FAIL] {e}")
            failed += 1
        except Exception as e:
            print(f"  [ERROR] Unexpected: {e}")
            failed += 1

    print("\n" + "=" * 70)
    print(f"  RESULT: {passed}/{len(tests)} tests passed")
    print("=" * 70)
    return 0 if failed == 0 else 1


if __name__ == "__main__":
    import sys
    sys.exit(main())
