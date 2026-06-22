"""Rate limiter setup terpusat (slowapi).

Limit dipasang **eksplisit per endpoint** sensitif lewat decorator
`@limiter.limit("...")`: `/auth/login` (5/min), `/auth/login/verify-2fa`
(10/min), `/auth/forgot-password` (3/min), `/auth/mirror` POST (10/min).

Tidak ada `default_limits` global supaya endpoint non-decorated (CRUD
inventory, sales, dst.) tidak ikut kena 5/min — itu menyebabkan 429 false
positive di pytest dan operasi normal.

Enable/disable runtime: `RATE_LIMIT_ENABLED=0` di env mematikan limiter
sepenuhnya — berguna saat pytest atau debugging lokal.
"""

from __future__ import annotations

import os

from slowapi import Limiter
from slowapi.util import get_remote_address

DEFAULT_RATE = "5/minute"


def _enabled() -> bool:
    return os.getenv("RATE_LIMIT_ENABLED", "1") not in {"0", "false", "False"}


# Limit dipasang eksplisit per endpoint via decorator @limiter.limit('...').
# Tidak ada default_limits global — endpoint non-decorated tidak kena limit
# supaya operasi normal (CRUD inventory/sales) tidak 429.
limiter = Limiter(
    key_func=get_remote_address,
    enabled=_enabled(),
)

__all__ = ["DEFAULT_RATE", "limiter"]