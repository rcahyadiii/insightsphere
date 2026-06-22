"""Development stress probe for transaction summary endpoint.

Requires APP_ENV=development and API_BASE_URL.
"""

from __future__ import annotations

import concurrent.futures
import os
import time

import requests

from scripts.dev.dev_script_guard import get_api_base_url, require_development_env


REQUESTS_COUNT = int(os.getenv("STRESS_REQUESTS", "200"))
CONCURRENCY = int(os.getenv("STRESS_CONCURRENCY", "20"))
REQUEST_TIMEOUT_SECONDS = float(os.getenv("STRESS_TIMEOUT_SECONDS", "10"))
SUMMARY_PATH = os.getenv("STRESS_TARGET_PATH", "/transactions/summary/today")


def target_url() -> str:
    path = SUMMARY_PATH if SUMMARY_PATH.startswith("/") else f"/{SUMMARY_PATH}"
    return f"{get_api_base_url()}{path}"


def fetch_url(url: str):
    start = time.perf_counter()
    response = requests.get(url, timeout=REQUEST_TIMEOUT_SECONDS)
    duration = time.perf_counter() - start
    return {"status": response.status_code, "time": duration}


def main() -> None:
    require_development_env("stress_transactions_summary")
    url = target_url()

    print("Memulai Stress Test...")
    print(f"Target: {url}")
    print(f"Total Requests: {REQUESTS_COUNT}")
    print(f"Konkurensi (Simultan): {CONCURRENCY} pekerja\n")

    results = []
    start_total = time.perf_counter()

    with concurrent.futures.ThreadPoolExecutor(max_workers=CONCURRENCY) as executor:
        futures = [executor.submit(fetch_url, url) for _ in range(REQUESTS_COUNT)]
        for future in concurrent.futures.as_completed(futures):
            results.append(future.result())

    total_duration = time.perf_counter() - start_total

    success = [result for result in results if result["status"] == 200]
    times = [result["time"] for result in success]

    avg_time = sum(times) / len(times) if times else 0
    max_time = max(times) if times else 0
    min_time = min(times) if times else 0

    print("=== HASIL STRESS TEST ===")
    print(f"Sukses: {len(success)} / {REQUESTS_COUNT}")
    print(f"Total Waktu Pelaksanaan: {total_duration * 1000:.2f} ms")
    print(f"Rata-rata Waktu Respons: {avg_time * 1000:.2f} ms")
    print(f"Waktu Respons Tercepat: {min_time * 1000:.2f} ms")
    print(f"Waktu Respons Terlama: {max_time * 1000:.2f} ms")
    print("=========================")


if __name__ == "__main__":
    main()
