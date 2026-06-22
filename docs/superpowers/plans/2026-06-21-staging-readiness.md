# Staging Readiness Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make InsightSphere staging-ready for Vercel frontend, Render backend, Neon PostgreSQL, and Upstash Redis without deploying to production.

**Architecture:** Harden the existing FastAPI and Next.js monorepo rather than introducing a new deployment architecture. Alembic remains the only schema migration path, FastAPI returns sanitized 500 responses, GitHub Actions becomes the staging quality gate, and deployment-specific knowledge lives in a staging runbook. Runtime config uses environment variables only; local `.env` secrets are never read, copied, or modified.

**Tech Stack:** FastAPI, SQLAlchemy, Alembic, PostgreSQL, pytest, Next.js 16, TypeScript, ESLint, node:test, Docker, GitHub Actions, Render, Vercel, Neon, Upstash.

---

## Scope Check

Use the approved spec at `docs/superpowers/specs/2026-06-21-staging-readiness-design.md`.

This plan targets staging readiness only. It does not deploy production, create platform accounts, push to remote, read local `.env` secrets, or modify `backend/scripts/create_admin.py`.

Do not commit in this repository unless the user explicitly asks. Treat each "Checkpoint" step as a local review checkpoint.

## File Structure

Backend files:

- Modify `backend/main.py`: remove traceback response leakage and log unhandled errors server-side.
- Modify `backend/core/config.py`: make `APP_ENV=staging` use production-grade fail-fast config guardrails.
- Modify `backend/alembic/env.py`: import the branches model so Alembic metadata matches the current app.
- Modify `backend/alembic/versions/a155786af199_initial_migration.py`: support fresh empty PostgreSQL bootstrap while preserving legacy-upgrade behavior for existing schemas.
- Modify `backend/alembic/versions/e5f6a7b8c9d0_create_operational_branches.py`: make branch table/index creation idempotent for fresh-bootstrap databases.
- Modify `backend/Dockerfile`: make the Render runtime image self-contained and port-aware.
- Create `backend/.dockerignore`: keep local caches, logs, and test artifacts out of Docker build context.
- Create `backend/tests/test_p0_exception_hardening.py`: assert 500 responses do not expose traceback or secrets.
- Create `backend/tests/integration/test_alembic_upgrade.py`: assert `alembic upgrade head` succeeds on a fresh PostgreSQL database.
- Modify `backend/tests/test_p0_config_hardening.py`: cover staging fail-fast behavior.

Frontend files:

- Modify `frontend/src/app/components/MirrorModeBanner.tsx`: remove synchronous setState-in-effect lint error.
- Modify `frontend/src/app/components/Sidebar.tsx`: remove banned hardcoded `text-[10px]` class.
- Modify `frontend/src/app/components/settings/AccessSettingsPanel.tsx`: replace effect-driven user loading with React Query.
- Modify `frontend/src/app/context/AuthContext.tsx`: derive mirror role from query state instead of synchronizing state in an effect.
- Modify `frontend/next.config.mjs`: set `outputFileTracingRoot` to the frontend directory to silence Next.js root inference warning.
- Modify `frontend/.env.local.example`: document Vercel staging env values clearly.

CI and documentation:

- Modify `.github/workflows/ci.yml`: add frontend lint/build gates and keep backend integration coverage.
- Modify `.env.example`: document staging-safe env requirements without real values.
- Create `docs/deployment/STAGING_RUNBOOK.md`: staging setup, migration, smoke, rollback, and backup drill.
- Create `render.yaml`: optional Render Blueprint for the backend web service with secrets marked as dashboard-managed.

---

### Task 1: Backend Exception Response Hardening

**Files:**
- Create: `backend/tests/test_p0_exception_hardening.py`
- Modify: `backend/main.py`

- [x] **Step 1: Write the failing traceback leak test**

Create `backend/tests/test_p0_exception_hardening.py`:

```python
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
```

- [x] **Step 2: Run the failing test**

Run from repository root:

```powershell
pytest backend/tests/test_p0_exception_hardening.py -q
```

Expected before implementation: FAIL because the current response includes `detail` with the exception text and a `traceback` field.

- [x] **Step 3: Replace the global exception handler**

Modify the bottom of `backend/main.py`. Remove:

```python
from fastapi.responses import JSONResponse
import traceback

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=500,
        content={'detail': str(exc), 'traceback': traceback.format_exc()}
    )
```

Add this import near the existing FastAPI imports:

```python
from fastapi.responses import JSONResponse
```

Add this sanitized handler near the end of `backend/main.py`:

```python
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(
        "Unhandled exception while processing %s %s",
        request.method,
        request.url.path,
        exc_info=(type(exc), exc, exc.__traceback__),
    )
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error"},
    )
```

- [x] **Step 4: Run the traceback hardening test**

Run:

```powershell
pytest backend/tests/test_p0_exception_hardening.py -q
```

Expected: PASS.

- [x] **Step 5: Checkpoint**

Run:

```powershell
git diff -- backend/main.py backend/tests/test_p0_exception_hardening.py
```

Verify the diff only removes traceback exposure and adds the focused test. Do not commit unless the user explicitly asks.

---

### Task 2: Staging Config Guardrails

**Files:**
- Modify: `backend/core/config.py`
- Modify: `backend/tests/test_p0_config_hardening.py`
- Modify: `.env.example`

- [x] **Step 1: Add a failing staging config test**

Append this test to `backend/tests/test_p0_config_hardening.py`:

```python
def test_staging_config_requires_runtime_values(monkeypatch: pytest.MonkeyPatch) -> None:
    _clear_runtime_env(monkeypatch)

    with pytest.raises(ValidationError) as exc_info:
        Settings(APP_ENV="staging", _env_file=None)

    message = str(exc_info.value)
    assert "DATABASE_URL" in message
    assert "SECRET_KEY" in message
    assert "REDIS_URL" in message
    assert "FRONTEND_URL" in message
```

- [x] **Step 2: Run the failing config test**

Run:

```powershell
pytest backend/tests/test_p0_config_hardening.py::test_staging_config_requires_runtime_values -q
```

Expected before implementation: FAIL because `APP_ENV=staging` currently falls back to development defaults.

- [x] **Step 3: Treat staging as protected runtime**

Modify `backend/core/config.py`:

```python
PRODUCTION_ENV_VALUES = {"prod", "production", "staging"}
```

Leave development defaults unchanged for `APP_ENV=development`.

- [x] **Step 4: Document staging env values without secrets**

Modify `.env.example` so the top section contains this staging guidance:

```dotenv
# ---- Environment ----
# development: local defaults are allowed.
# staging/production: DATABASE_URL, SECRET_KEY, REDIS_URL, and FRONTEND_URL are required.
APP_ENV=development
DATABASE_URL=postgresql://postgres:replace-password@localhost:5433/pos_cerdas_db
SECRET_KEY=replace-with-48-plus-random-url-safe-characters
REDIS_URL=redis://localhost:6379/0
```

Keep the existing SMTP and token sections. Do not add real Neon, Upstash, Render, or Vercel secret values.

- [x] **Step 5: Run config hardening tests**

Run:

```powershell
pytest backend/tests/test_p0_config_hardening.py -q
```

Expected: PASS.

- [x] **Step 6: Checkpoint**

Run:

```powershell
git diff -- backend/core/config.py backend/tests/test_p0_config_hardening.py .env.example
```

Verify `.env.example` contains only example values. Do not commit unless the user explicitly asks.

---

### Task 3: Alembic Fresh PostgreSQL Bootstrap

**Files:**
- Create: `backend/tests/integration/test_alembic_upgrade.py`
- Modify: `backend/alembic/env.py`
- Modify: `backend/alembic/versions/a155786af199_initial_migration.py`
- Modify: `backend/alembic/versions/e5f6a7b8c9d0_create_operational_branches.py`
- Test: `backend/tests/integration/test_alembic_upgrade.py`
- Test: `backend/tests/test_p2_logging_and_migrations.py`

- [x] **Step 1: Write the failing fresh Alembic upgrade test**

Create `backend/tests/integration/test_alembic_upgrade.py`:

```python
"""Alembic smoke test for a fresh PostgreSQL database."""

from __future__ import annotations

import os
import subprocess
import sys
from pathlib import Path
from typing import Iterator

import pytest
import sqlalchemy
from sqlalchemy import create_engine, text
from sqlalchemy.engine import Engine


BACKEND_ROOT = Path(__file__).resolve().parents[2]
ADMIN_DB_URL = os.environ.get(
    "INTEGRATION_DATABASE_URL",
    "postgresql://postgres:root@localhost:5433/postgres",
)
TEST_DB_NAME = os.environ.get(
    "INTEGRATION_ALEMBIC_DATABASE_NAME",
    "insightsphere_test_alembic",
)


def _replace_database(url: str, db_name: str) -> str:
    parsed = sqlalchemy.engine.url.make_url(url)
    return str(parsed.set(database=db_name))


def _admin_engine() -> Engine:
    return create_engine(ADMIN_DB_URL, isolation_level="AUTOCOMMIT", pool_pre_ping=True)


@pytest.fixture()
def fresh_alembic_database() -> Iterator[str]:
    try:
        admin = _admin_engine()
        with admin.connect() as conn:
            conn.execute(text("SELECT 1"))
    except Exception as exc:
        pytest.skip(f"Postgres tidak reachable di {ADMIN_DB_URL}: {exc}")

    with admin.connect() as conn:
        conn.execute(
            text(
                "SELECT pg_terminate_backend(pid) FROM pg_stat_activity "
                "WHERE datname = :db AND pid <> pg_backend_pid()"
            ),
            {"db": TEST_DB_NAME},
        )
        conn.execute(text(f'DROP DATABASE IF EXISTS "{TEST_DB_NAME}"'))
        conn.execute(text(f'CREATE DATABASE "{TEST_DB_NAME}"'))

    test_url = _replace_database(ADMIN_DB_URL, TEST_DB_NAME)
    try:
        yield test_url
    finally:
        with admin.connect() as conn:
            conn.execute(
                text(
                    "SELECT pg_terminate_backend(pid) FROM pg_stat_activity "
                    "WHERE datname = :db AND pid <> pg_backend_pid()"
                ),
                {"db": TEST_DB_NAME},
            )
            conn.execute(text(f'DROP DATABASE IF EXISTS "{TEST_DB_NAME}"'))
        admin.dispose()


def test_alembic_upgrade_head_succeeds_on_fresh_postgres(fresh_alembic_database: str) -> None:
    env = os.environ.copy()
    env.update(
        {
            "APP_ENV": "development",
            "DATABASE_URL": fresh_alembic_database,
            "SECRET_KEY": "pytest-secret-key-with-enough-length-for-staging-checks",
            "REDIS_URL": "redis://localhost:6379/0",
            "FRONTEND_URL": "http://localhost:3000",
        }
    )

    result = subprocess.run(
        [sys.executable, "-m", "alembic", "upgrade", "head"],
        cwd=BACKEND_ROOT,
        env=env,
        text=True,
        capture_output=True,
        timeout=180,
    )

    assert result.returncode == 0, result.stdout + result.stderr

    engine = create_engine(fresh_alembic_database, pool_pre_ping=True)
    try:
        with engine.connect() as conn:
            version = conn.execute(text("SELECT version_num FROM alembic_version")).scalar_one()
            branches_exists = conn.execute(text("SELECT to_regclass('public.branches')")).scalar_one()
            users_exists = conn.execute(text("SELECT to_regclass('public.users')")).scalar_one()
            mirror_exists = conn.execute(text("SELECT to_regclass('public.mirror_sessions')")).scalar_one()
    finally:
        engine.dispose()

    assert version == "e5f6a7b8c9d0"
    assert branches_exists == "branches"
    assert users_exists == "users"
    assert mirror_exists == "mirror_sessions"
```

- [x] **Step 2: Run the failing fresh Alembic test**

Run:

```powershell
pytest backend/tests/integration/test_alembic_upgrade.py -q
```

Expected before implementation: FAIL because the initial migration assumes legacy tables already exist.

- [x] **Step 3: Register branches in Alembic metadata**

Modify `backend/alembic/env.py` by adding the branches model import after the reporting import:

```python
from domains.branches import models as _branches
```

- [x] **Step 4: Add fresh-empty bootstrap to the initial revision**

Modify `backend/alembic/versions/a155786af199_initial_migration.py`.

Add this helper below the revision identifiers:

```python
def _bootstrap_empty_database_if_needed() -> bool:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    application_tables = set(inspector.get_table_names()) - {"alembic_version"}
    if application_tables:
        return False

    op.execute("CREATE EXTENSION IF NOT EXISTS pgcrypto")

    from core.database import Base
    import domains.dataset.models  # noqa: F401
    import domains.observability.models  # noqa: F401
    import domains.identity.models  # noqa: F401
    import domains.sales.models  # noqa: F401
    import domains.finance.models  # noqa: F401
    import domains.intelligence.models  # noqa: F401
    import domains.inventory.models  # noqa: F401
    import domains.notification.models  # noqa: F401
    import domains.reporting.models  # noqa: F401
    import domains.branches.models  # noqa: F401

    Base.metadata.create_all(bind=bind)
    return True
```

Then make `upgrade()` start with:

```python
def upgrade() -> None:
    """Upgrade schema."""
    if _bootstrap_empty_database_if_needed():
        return

    # existing legacy migration body continues here
```

Keep the existing legacy migration operations below that guard so existing pre-Alembic schemas still use the current cleanup path.

- [x] **Step 5: Make the branches migration idempotent**

Modify `backend/alembic/versions/e5f6a7b8c9d0_create_operational_branches.py`.

At the top of `upgrade()`, add:

```python
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    has_branches = inspector.has_table("branches")
```

Wrap the existing `op.create_table(...)` call:

```python
    if not has_branches:
        op.create_table(
            # keep the existing column and constraint definitions here
        )
```

Replace the unconditional index creation block with guarded index creation:

```python
    existing_indexes = {
        index["name"]
        for index in sa.inspect(op.get_bind()).get_indexes("branches")
    }
    if op.f("ix_branches_store_nbr") not in existing_indexes:
        op.create_index(op.f("ix_branches_store_nbr"), "branches", ["store_nbr"], unique=False)
    if op.f("ix_branches_branch_code") not in existing_indexes:
        op.create_index(op.f("ix_branches_branch_code"), "branches", ["branch_code"], unique=False)
    if op.f("ix_branches_name") not in existing_indexes:
        op.create_index(op.f("ix_branches_name"), "branches", ["name"], unique=False)
    if op.f("ix_branches_is_active") not in existing_indexes:
        op.create_index(op.f("ix_branches_is_active"), "branches", ["is_active"], unique=False)
    if "ix_branches_active_store" not in existing_indexes:
        op.create_index("ix_branches_active_store", "branches", ["is_active", "store_nbr"], unique=False)
```

Make `downgrade()` safe on already-missing tables:

```python
def downgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    if not inspector.has_table("branches"):
        return

    existing_indexes = {index["name"] for index in inspector.get_indexes("branches")}
    if "ix_branches_active_store" in existing_indexes:
        op.drop_index("ix_branches_active_store", table_name="branches")
    if op.f("ix_branches_is_active") in existing_indexes:
        op.drop_index(op.f("ix_branches_is_active"), table_name="branches")
    if op.f("ix_branches_name") in existing_indexes:
        op.drop_index(op.f("ix_branches_name"), table_name="branches")
    if op.f("ix_branches_branch_code") in existing_indexes:
        op.drop_index(op.f("ix_branches_branch_code"), table_name="branches")
    if op.f("ix_branches_store_nbr") in existing_indexes:
        op.drop_index(op.f("ix_branches_store_nbr"), table_name="branches")
    op.drop_table("branches")
```

- [x] **Step 6: Run Alembic tests**

Run:

```powershell
pytest backend/tests/integration/test_alembic_upgrade.py backend/tests/test_p2_logging_and_migrations.py -q
```

Expected: all tests pass.

- [x] **Step 7: Run branch domain regression tests**

Run:

```powershell
pytest backend/tests/domains/test_branches.py -q
```

Expected: all tests pass.

- [x] **Step 8: Checkpoint**

Run:

```powershell
git diff -- backend/alembic/env.py backend/alembic/versions/a155786af199_initial_migration.py backend/alembic/versions/e5f6a7b8c9d0_create_operational_branches.py backend/tests/integration/test_alembic_upgrade.py
```

Verify the bootstrap path only runs for an empty database and legacy migration logic remains intact. Do not commit unless the user explicitly asks.

---

### Task 4: Frontend Lint Blockers

**Files:**
- Modify: `frontend/src/app/components/MirrorModeBanner.tsx`
- Modify: `frontend/src/app/components/Sidebar.tsx`
- Modify: `frontend/src/app/components/settings/AccessSettingsPanel.tsx`
- Modify: `frontend/src/app/context/AuthContext.tsx`

Baseline:

- `npm run typecheck` passes.
- `npm run build` passes.
- `npm run lint` fails with four errors:
  - `MirrorModeBanner.tsx`: `react-hooks/set-state-in-effect`
  - `Sidebar.tsx`: `design-system/no-banned-tokens`
  - `AccessSettingsPanel.tsx`: `react-hooks/set-state-in-effect`
  - `AuthContext.tsx`: `react-hooks/set-state-in-effect`

- [ ] **Step 1: Remove portal mounted state from MirrorModeBanner**

Modify `frontend/src/app/components/MirrorModeBanner.tsx`.

Change the import:

```typescript
import { useEffect, useMemo, useState } from "react";
```

to:

```typescript
import { useEffect, useMemo, useState } from "react";
```

Keep `useState` because `MirrorCountdown` still uses it.

Replace `MirrorModeWatermark` with:

```typescript
function MirrorModeWatermark({ roleLabel }: MirrorModeWatermarkProps) {
  const { t } = useTranslation();

  if (typeof document === "undefined") return null;

  return createPortal(
    <div
      aria-hidden="true"
      data-testid="mirror-mode-watermark"
      className={cn(
        Z.toast,
        "pointer-events-none fixed select-none",
        "hidden sm:block",
        "sm:bottom-4 sm:right-4",
        "rounded-full border border-amber-300 bg-amber-50/90 sm:px-3 sm:py-1 px-2 py-0.5 shadow-sm backdrop-blur-sm",
        "text-amber-900",
        "dark:border-amber-700/60 dark:bg-amber-900/40 dark:text-amber-100"
      )}
    >
      <span className={cn(T.caption, "flex items-center gap-1.5 font-bold")}>
        <Eye className="size-3" />
        {t("mirror.banner.viewing_as", { role: roleLabel })}
      </span>
    </div>,
    document.body
  );
}
```

- [x] **Step 2: Remove banned text token from Sidebar**

Modify `frontend/src/app/components/Sidebar.tsx`.

Replace:

```typescript
<p className={cn(T.label, "px-3 pt-1 pb-2 text-[10px] uppercase tracking-widest text-slate-400 dark:text-slate-500")}>
```

with:

```typescript
<p className={cn(T.label, "px-3 pt-1 pb-2 uppercase tracking-widest text-slate-400 dark:text-slate-500")}>
```

- [x] **Step 3: Replace AccessSettingsPanel effect loading with React Query**

Modify imports in `frontend/src/app/components/settings/AccessSettingsPanel.tsx`.

Replace:

```typescript
import { useEffect, useState } from "react";
```

with:

```typescript
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
```

Remove:

```typescript
  const [usersData, setUsersData] = useState<BackendUserListItem[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [usersError, setUsersError] = useState("");

  useEffect(() => {
    if (!canManageUsers) return;
    setUsersLoading(true);
    authClient.fetchUsers({ limit: 50 })
      .then(data => { setUsersData(data); setUsersError(""); })
      .catch(() => setUsersError(t("common.error_loading")))
      .finally(() => setUsersLoading(false));
  }, [canManageUsers, t]);

  const members = usersData.map(u => ({
```

Add:

```typescript
  const {
    data: usersData = [],
    isLoading: usersLoading,
    isError: usersLoadFailed,
  } = useQuery<BackendUserListItem[]>({
    queryKey: ["settings", "access", "users"],
    queryFn: () => authClient.fetchUsers({ limit: 50 }),
    enabled: canManageUsers,
    retry: false,
    staleTime: 60_000,
  });

  const usersError = usersLoadFailed ? t("common.error_loading") : "";

  const members = useMemo(() => usersData.map(u => ({
```

Close the `members` declaration with dependencies:

```typescript
  })), [t, usersData]);
```

- [x] **Step 4: Derive mirror role from query state in AuthContext**

Modify `frontend/src/app/context/AuthContext.tsx`.

Remove `useState` from the React import:

```typescript
  useState,
```

Remove the state declaration:

```typescript
  const [viewingAsRole, setViewingAsRole] = useState<UserRole | null>(null);
```

Remove the effect that synchronizes `viewingAsRole` from `mirrorSession`:

```typescript
  useEffect(() => {
    if (!user || user.role !== ROLE_CODES.admin) {
      setViewingAsRole(null);
      return;
    }
    setViewingAsRole(mirrorSession?.target_role && isRoleCode(mirrorSession.target_role) ? mirrorSession.target_role : null);
  }, [mirrorSession, user]);
```

Remove each remaining `setViewingAsRole(...)` call from `handleUnauthorized`, `login`, and `logout`.

In `switchView`, replace:

```typescript
            setViewingAsRole(null);
            queryClient.setQueryData(["auth", "mirror"], null);
            return;
          }
          const session = await authClient.startMirrorSession(newRole);
          setViewingAsRole(session.target_role);
          queryClient.setQueryData(["auth", "mirror"], session);
```

with:

```typescript
            queryClient.setQueryData(["auth", "mirror"], null);
            return;
          }
          const session = await authClient.startMirrorSession(newRole);
          queryClient.setQueryData(["auth", "mirror"], session);
```

Replace effective role derivation:

```typescript
  const effectiveRole: UserRole =
    viewingAsRole || user?.role || ROLE_CODES.cashier;
```

with:

```typescript
  const mirroredRole: UserRole | null =
    user?.role === ROLE_CODES.admin &&
    mirrorSession?.target_role &&
    isRoleCode(mirrorSession.target_role)
      ? mirrorSession.target_role
      : null;

  const effectiveRole: UserRole =
    mirroredRole || user?.role || ROLE_CODES.cashier;
```

- [x] **Step 5: Run frontend lint**

Run from `frontend/`:

```powershell
npm run lint
```

Expected: exit code 0. Warnings may remain, but the four current lint errors must be gone.

- [x] **Step 6: Run frontend typecheck**

Run:

```powershell
npm run typecheck
```

Expected: PASS.

- [x] **Step 7: Checkpoint**

Run:

```powershell
git diff -- frontend/src/app/components/MirrorModeBanner.tsx frontend/src/app/components/Sidebar.tsx frontend/src/app/components/settings/AccessSettingsPanel.tsx frontend/src/app/context/AuthContext.tsx
```

Verify the diff only changes lint-blocking behavior. Do not commit unless the user explicitly asks.

---

### Task 5: Frontend Build and Vercel Configuration

**Files:**
- Modify: `frontend/next.config.mjs`
- Modify: `frontend/.env.local.example`
- Test: `frontend/tests/integration/hardcode-followup-p0-backend-url.test.mjs`

- [x] **Step 1: Set Next.js tracing root to frontend**

Modify `frontend/next.config.mjs`:

```typescript
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
    outputFileTracingRoot: __dirname,
    allowedDevOrigins: ["192.168.1.9", "localhost", "127.0.0.1"],
    devIndicators: false,
};

export default nextConfig
```

- [x] **Step 2: Document Vercel staging envs**

Modify `frontend/.env.local.example` so the production section says:

```dotenv
# Vercel staging:
#   BACKEND_INTERNAL_URL=https://insightsphere-api-staging.onrender.com
#   NEXT_PUBLIC_API_URL=https://insightsphere-api-staging.onrender.com
# Both values are required for production builds/runtime.
BACKEND_INTERNAL_URL=http://127.0.0.1:8000
NEXT_PUBLIC_API_URL=http://127.0.0.1:8000
```

Do not add real project-specific secret values.

- [x] **Step 3: Run frontend env static test**

Run from `frontend/`:

```powershell
node --experimental-strip-types --test --test-isolation=none tests/integration/hardcode-followup-p0-backend-url.test.mjs
```

Expected: PASS.

- [x] **Step 4: Run production build**

Run from `frontend/`:

```powershell
npm run build
```

Expected: PASS. The previous baseline build passed, so any new failure is introduced by this task.

- [x] **Step 5: Checkpoint**

Run:

```powershell
git diff -- frontend/next.config.mjs frontend/.env.local.example
```

Verify only staging docs and tracing root changed. Do not commit unless the user explicitly asks.

---

### Task 6: Backend Render Runtime Image

**Files:**
- Modify: `backend/Dockerfile`
- Create: `backend/.dockerignore`
- Create: `render.yaml`

- [x] **Step 1: Add backend Docker ignore file**

Create `backend/.dockerignore`:

```dockerignore
__pycache__/
*.py[cod]
.pytest_cache/
.mypy_cache/
.ruff_cache/
.venv/
venv/
*.log
system_api.log
output/
alembic/versions/__pycache__/
tests/__pycache__/
tests/**/__pycache__/
```

- [x] **Step 2: Replace backend Dockerfile with a Render-aware runtime**

Replace `backend/Dockerfile` with:

```dockerfile
FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV PIP_NO_CACHE_DIR=1

WORKDIR /app

RUN apt-get update \
    && apt-get install -y --no-install-recommends libgomp1 \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .

RUN python -m pip install --upgrade pip \
    && pip install -r requirements.txt

COPY . .

EXPOSE 8000

CMD ["sh", "-c", "uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000}"]
```

This keeps the image self-contained, avoids duplicate dependency installs, and supports Render's `PORT` environment variable.

- [x] **Step 3: Add optional Render Blueprint**

Create `render.yaml` at the repository root:

```yaml
services:
  - type: web
    name: insightsphere-api-staging
    env: docker
    plan: free
    rootDir: backend
    dockerfilePath: ./Dockerfile
    healthCheckPath: /health
    envVars:
      - key: APP_ENV
        value: staging
      - key: DATABASE_URL
        sync: false
      - key: SECRET_KEY
        sync: false
      - key: REDIS_URL
        sync: false
      - key: FRONTEND_URL
        sync: false
      - key: ANALYTICS_INTERVAL_SECONDS
        value: ""
```

- [x] **Step 4: Build the backend Docker image locally**

Run from repository root:

```powershell
docker build -t insightsphere-api-staging:local ./backend
```

Expected: image builds successfully. If Docker is not running locally, record that and continue to the non-Docker verification commands.

- [x] **Step 5: Verify backend imports still work outside Docker**

Run:

```powershell
python -c "import sys; sys.path.insert(0, 'backend'); import main; print(main.app.title)"
```

Expected output includes:

```text
InsightSphere API
```

- [x] **Step 6: Checkpoint**

Run:

```powershell
git diff -- backend/Dockerfile backend/.dockerignore render.yaml
```

Verify no secret values are present. Do not commit unless the user explicitly asks.

---

### Task 7: CI Staging Quality Gates

**Files:**
- Modify: `.github/workflows/ci.yml`

- [x] **Step 1: Add Alembic database name to backend CI env**

Modify backend job env in `.github/workflows/ci.yml`:

```yaml
      INTEGRATION_ALEMBIC_DATABASE_NAME: insightsphere_test_alembic
```

- [x] **Step 2: Keep backend tests and integration tests as CI gates**

Keep these existing steps:

```yaml
      - name: Run unit pytest (SQLite in-memory)
        run: pytest backend/tests -q --ignore=backend/tests/integration --ignore=backend/tests/manual
      - name: Run integration pytest (real Postgres)
        run: pytest backend/tests/integration -q
```

The new Alembic integration test from Task 3 will run through the existing integration step.

- [x] **Step 3: Add frontend lint gate**

Add after frontend dependency install:

```yaml
      - name: Lint
        working-directory: frontend
        run: npm run lint
```

- [x] **Step 4: Add frontend production build gate**

Add after typecheck and static tests:

```yaml
      - name: Production build
        working-directory: frontend
        env:
          BACKEND_INTERNAL_URL: https://insightsphere-api-staging.onrender.com
          NEXT_PUBLIC_API_URL: https://insightsphere-api-staging.onrender.com
        run: npm run build
```

- [x] **Step 5: Run local CI-equivalent frontend commands**

Run from `frontend/`:

```powershell
npm run lint
npm run typecheck
node --experimental-strip-types --test --test-isolation=none tests/integration/*.test.mjs tests/ui/*.test.mjs tests/*.test.mjs
npm run build
```

Expected: all pass.

- [x] **Step 6: Run local CI-equivalent backend commands**

Run from repository root:

```powershell
pytest backend/tests -q --ignore=backend/tests/integration --ignore=backend/tests/manual
pytest backend/tests/integration -q
```

Expected: all pass. If local PostgreSQL is unavailable, integration tests should skip or fail with a clear connection message; CI will run them against the GitHub Actions PostgreSQL service.

- [x] **Step 7: Checkpoint**

Run:

```powershell
git diff -- .github/workflows/ci.yml
```

Verify CI now gates lint, typecheck, static tests, build, unit tests, integration tests, and Alembic fresh upgrade through integration tests. Do not commit unless the user explicitly asks.

---

### Task 8: Staging Runbook and Smoke Procedures

**Files:**
- Create: `docs/deployment/STAGING_RUNBOOK.md`
- Modify: `.env.example`
- Modify: `frontend/.env.local.example`

- [x] **Step 1: Create staging runbook**

Create `docs/deployment/STAGING_RUNBOOK.md`:

```markdown
# Staging Runbook

Date: 2026-06-21
Target stack: Vercel frontend, Render backend, Neon PostgreSQL, Upstash Redis

## Scope

This runbook prepares staging only. It does not authorize production deploys.

## Required Services

- Vercel project with root directory `frontend`
- Render Web Service using `backend/Dockerfile`
- Neon PostgreSQL database
- Upstash Redis database
- GitHub Actions enabled for the repository

## Backend Environment Variables

Set these in Render:

| Key | Value source |
| --- | --- |
| `APP_ENV` | Use `staging`. |
| `DATABASE_URL` | Paste the Neon PostgreSQL connection string in the Render dashboard. |
| `SECRET_KEY` | Generate a random value with at least 32 characters and store it only in the Render dashboard. |
| `REDIS_URL` | Paste the Upstash Redis URL in the Render dashboard. |
| `FRONTEND_URL` | Paste the Vercel staging URL in the Render dashboard. |

Do not commit these values.

## Frontend Environment Variables

Set these in Vercel:

| Key | Value source |
| --- | --- |
| `BACKEND_INTERNAL_URL` | Paste the Render API URL in the Vercel dashboard. |
| `NEXT_PUBLIC_API_URL` | Paste the Render API URL in the Vercel dashboard. |
| `NEXT_PUBLIC_ENABLE_QUERY_DEVTOOLS` | Use `false`. |

## Vercel Settings

- Root directory: `frontend`
- Install command: `npm ci`
- Build command: `npm run build`
- Output: Vercel Next.js default

## Render Settings

- Environment: Docker
- Root directory: `backend`
- Dockerfile path: `./Dockerfile`
- Health check path: `/health`

## Migration

Run before smoke testing a new staging deploy:

```powershell
cd backend
alembic upgrade head
```

When running outside Render, set `DATABASE_URL` to the Neon staging database first.

## Smoke Test

Set local shell variables:

```powershell
$env:STAGING_API_URL = Read-Host "Render API URL"
$env:STAGING_FRONTEND_URL = Read-Host "Vercel frontend URL"
```

Backend health:

```powershell
curl "$env:STAGING_API_URL/health"
```

Expected: HTTP 200 with `"database":"connected"`.

Backend root:

```powershell
curl "$env:STAGING_API_URL/"
```

Expected: HTTP 200.

Frontend boot:

```powershell
curl "$env:STAGING_FRONTEND_URL/"
```

Expected: HTTP 200.

Auth smoke:

- Log in with a staging-only admin account.
- Try a bad password and confirm the response does not contain `traceback`.

Branch smoke:

- Create a staging-only branch code.
- List branches.
- Update the branch name.
- Deactivate the branch.
- Reactivate only if needed for further testing.
- Do not hard-delete staging branch records.

## Rollback

Frontend rollback:

- Use Vercel deployment rollback to the previous successful deployment.

Backend rollback:

- Use Render rollback/redeploy previous Git commit.

Database rollback:

- Prefer Neon restore point or branch restore.
- Use Alembic downgrade only when the migration is known to be reversible and data-safe.

## Backup Drill

Before production planning:

1. Create a Neon branch or restore point from staging.
2. Run `alembic upgrade head`.
3. Run the smoke test section.
4. Restore or switch back to the pre-migration Neon branch in a disposable staging database.
5. Run `/health` again.

## Done Criteria

- GitHub Actions is green.
- Render `/health` is green.
- Vercel frontend loads.
- Bad backend errors do not expose traceback.
- Backup and rollback steps have been rehearsed at least once in staging.
```

- [x] **Step 2: Ensure root env example mentions staging**

Confirm `.env.example` includes:

```dotenv
# staging/production: DATABASE_URL, SECRET_KEY, REDIS_URL, and FRONTEND_URL are required.
```

- [x] **Step 3: Ensure frontend env example mentions Vercel**

Confirm `frontend/.env.local.example` includes:

```dotenv
# Vercel staging:
```

- [x] **Step 4: Check docs for secret leakage**

Run:

```powershell
rg -n "postgresql://.*:.*@|redis://.*:.*@|SECRET_KEY=.*[A-Za-z0-9]{32,}|sk-|token_" docs/deployment/STAGING_RUNBOOK.md .env.example frontend/.env.local.example render.yaml
```

Expected: no real secret values. Documentation text and localhost development values are acceptable.

- [x] **Step 5: Checkpoint**

Run:

```powershell
git diff -- docs/deployment/STAGING_RUNBOOK.md .env.example frontend/.env.local.example render.yaml
```

Verify the docs are staging-focused and contain no secrets. Do not commit unless the user explicitly asks.

---

### Task 9: Final Verification

**Files:**
- Verify all files touched by Tasks 1-8.

- [x] **Step 1: Check working tree before final commands**

Run:

```powershell
git status --short --branch
```

Expected:

- Staging-readiness files changed or created.
- Existing `backend/scripts/create_admin.py` user change still present and not modified by this plan.
- No `.env` changes.
- No generated logs or build artifacts staged.

- [x] **Step 2: Run backend hardening and migration tests**

Run:

```powershell
pytest backend/tests/test_p0_config_hardening.py backend/tests/test_p0_exception_hardening.py backend/tests/test_p2_logging_and_migrations.py -q
```

Expected: PASS.

- [x] **Step 3: Run backend branch regression tests**

Run:

```powershell
pytest backend/tests/domains/test_branches.py -q
```

Expected: PASS.

- [x] **Step 4: Run backend unit suite**

Run:

```powershell
pytest backend/tests -q --ignore=backend/tests/integration --ignore=backend/tests/manual
```

Expected: PASS.

- [x] **Step 5: Run backend integration suite**

Run:

```powershell
pytest backend/tests/integration -q
```

Expected: PASS when PostgreSQL is reachable. If PostgreSQL is not reachable locally, record the skip/failure reason and rely on GitHub Actions PostgreSQL service after push.

- [x] **Step 6: Run frontend static suite**

Run from `frontend/`:

```powershell
node --experimental-strip-types --test --test-isolation=none tests/integration/*.test.mjs tests/ui/*.test.mjs tests/*.test.mjs
```

Expected: PASS.

- [x] **Step 7: Run frontend lint, typecheck, and build**

Run from `frontend/`:

```powershell
npm run lint
npm run typecheck
npm run build
```

Expected: PASS.

- [x] **Step 8: Run Docker build if Docker is available**

Run from repository root:

```powershell
docker build -t insightsphere-api-staging:local ./backend
```

Expected: PASS. If Docker is unavailable, record the reason.

- [x] **Step 9: Confirm no secret or env file changes**

Run:

```powershell
git diff -- .env
git status --short --ignored | Select-String ".env"
```

Expected: no `.env` diff.

- [x] **Step 10: Final diff review**

Run:

```powershell
git diff --stat
git diff -- backend/scripts/create_admin.py
```

Expected:

- Staging-readiness changes appear in planned files.
- `backend/scripts/create_admin.py` diff is unchanged from the user's existing local change.

---

## Self-Review

Spec coverage:

- Alembic fresh upgrade: Task 3 and Task 7.
- Traceback removal: Task 1.
- Frontend lint/build: Tasks 4, 5, and 7.
- Runtime image: Task 6.
- CI complete gate: Task 7.
- Smoke, rollback, backup drill: Task 8.
- Preserve local `.env` and `create_admin.py`: Scope Check and Task 9.

Placeholder scan:

- The plan uses concrete file paths and code snippets.
- Runtime secrets are intentionally dashboard-managed and never written as concrete values.
- Commands that need live staging URLs use `Read-Host` so no fake secret or URL is committed.

Type consistency:

- Backend test names match created files.
- Frontend imports match existing packages.
- Alembic target revision remains `e5f6a7b8c9d0`.
- Render target stack matches the approved spec.

