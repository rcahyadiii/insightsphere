from secrets import token_urlsafe
from typing import Optional

from pydantic import model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict
from core.runtime_constants import (
    ACCESS_TOKEN_EXPIRE_MINUTES as DEFAULT_ACCESS_TOKEN_EXPIRE_MINUTES,
    INVITE_TOKEN_EXPIRE_HOURS as DEFAULT_INVITE_TOKEN_EXPIRE_HOURS,
    RESET_TOKEN_EXPIRE_HOURS as DEFAULT_RESET_TOKEN_EXPIRE_HOURS,
)

PRODUCTION_ENV_VALUES = {"prod", "production", "staging"}
PRODUCTION_SECRET_KEY_MIN_LENGTH = 32

DEV_DATABASE_URL = "postgresql://postgres:root@localhost:5433/pos_cerdas_db"
DEV_SECRET_KEY = token_urlsafe(32)
DEV_REDIS_URL = "redis://localhost:6379/0"
DEV_FRONTEND_URL = "http://localhost:3000"

PRODUCTION_FORBIDDEN_VALUES = {
    "DATABASE_URL": {DEV_DATABASE_URL},
    "SECRET_KEY": {"supersecretkey123"},
    "REDIS_URL": {DEV_REDIS_URL},
    "FRONTEND_URL": {DEV_FRONTEND_URL},
}


class Settings(BaseSettings):
    # ---- Core ----
    # APP_ENV=production menolak default development dan wajib pakai env runtime.
    APP_ENV: str = "development"
    DATABASE_URL: str = ""
    SECRET_KEY: str = ""
    # 7 hari — cukup panjang untuk POS offline mode tanpa auto-logout.
    # Trade-off: kalau device hilang/dicuri, attacker punya token valid s.d. 7 hari.
    # Mitigasi: token blacklist / revocation bisa ditambah kemudian.
    ACCESS_TOKEN_EXPIRE_MINUTES: int = DEFAULT_ACCESS_TOKEN_EXPIRE_MINUTES
    REDIS_URL: str = ""

    # ---- App ----
    APP_NAME: str = "InsightSphere"
    FRONTEND_URL: str = ""

    # ---- Email (SMTP) ----
    # Jika SMTP_HOST kosong → service jalan di MODE CONSOLE (log ke stdout, dev-friendly).
    SMTP_HOST: Optional[str] = None
    SMTP_PORT: int = 587
    SMTP_USER: Optional[str] = None
    SMTP_PASSWORD: Optional[str] = None
    SMTP_FROM_EMAIL: Optional[str] = None     # Default ke SMTP_USER kalau kosong
    SMTP_FROM_NAME: Optional[str] = None      # Default ke APP_NAME
    SMTP_USE_TLS: bool = True

    # ---- Token expiry ----
    INVITE_TOKEN_EXPIRE_HOURS: int = DEFAULT_INVITE_TOKEN_EXPIRE_HOURS
    RESET_TOKEN_EXPIRE_HOURS: int = DEFAULT_RESET_TOKEN_EXPIRE_HOURS

    @model_validator(mode="after")
    def apply_environment_guardrails(self):
        is_production = self.APP_ENV.strip().lower() in PRODUCTION_ENV_VALUES

        if not is_production:
            self.DATABASE_URL = self.DATABASE_URL or DEV_DATABASE_URL
            self.SECRET_KEY = self.SECRET_KEY or DEV_SECRET_KEY
            self.REDIS_URL = self.REDIS_URL or DEV_REDIS_URL
            self.FRONTEND_URL = self.FRONTEND_URL or DEV_FRONTEND_URL
            return self

        required_values = {
            "DATABASE_URL": self.DATABASE_URL,
            "SECRET_KEY": self.SECRET_KEY,
            "REDIS_URL": self.REDIS_URL,
            "FRONTEND_URL": self.FRONTEND_URL,
        }
        missing = [
            field
            for field, value in required_values.items()
            if not str(value or "").strip()
        ]
        defaulted = [
            field
            for field, value in required_values.items()
            if value in PRODUCTION_FORBIDDEN_VALUES[field]
        ]

        errors = []
        if missing:
            errors.append(f"missing required production settings: {', '.join(missing)}")
        if defaulted:
            errors.append(f"production settings use development default: {', '.join(defaulted)}")
        if (
            self.SECRET_KEY
            and len(self.SECRET_KEY) < PRODUCTION_SECRET_KEY_MIN_LENGTH
        ):
            errors.append(
                "SECRET_KEY too short for production: "
                f"need at least {PRODUCTION_SECRET_KEY_MIN_LENGTH} characters"
            )
        if errors:
            raise ValueError("; ".join(errors))

        return self

    model_config = SettingsConfigDict(
        env_file=(".env", "../.env"),
        env_file_encoding="utf-8",
        extra="ignore",
    )


settings = Settings()
