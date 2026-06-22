"""Guardrails shared by development-only scripts."""

from __future__ import annotations

import os
from urllib.parse import urlparse


DEVELOPMENT_ENV = "development"


def current_environment() -> str:
    return (os.getenv("APP_ENV") or os.getenv("ENVIRONMENT") or DEVELOPMENT_ENV).strip().lower()


def require_development_env(script_name: str) -> None:
    env = current_environment()
    if env != DEVELOPMENT_ENV:
        raise RuntimeError(
            f"{script_name} is development-only; set APP_ENV=development before running it. "
            f"Current environment: {env!r}."
        )


def get_api_base_url() -> str:
    raw_base_url = os.getenv("API_BASE_URL")
    if not raw_base_url:
        raise RuntimeError("API_BASE_URL is required for development API scripts.")

    base_url = raw_base_url.strip().rstrip("/")
    parsed = urlparse(base_url)
    if parsed.scheme not in {"http", "https"} or not parsed.netloc:
        raise RuntimeError("API_BASE_URL must be an absolute HTTP(S) URL.")
    return base_url
