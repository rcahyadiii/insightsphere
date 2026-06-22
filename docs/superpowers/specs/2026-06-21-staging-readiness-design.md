# Staging Readiness Design

Date: 2026-06-21
Status: Approved design, awaiting spec review
Target: Vercel frontend, Render backend, Neon PostgreSQL, Upstash Redis

## Goal

Make InsightSphere staging-ready before any production deployment work. The staging path must prove that the repository can build, migrate a fresh database, run without leaking internal tracebacks, deploy with free-tier-friendly runtime settings, and provide a documented smoke, rollback, and backup drill.

This is a deployment-readiness pass, not a feature expansion. The output should be a clean repository state that can be pushed and validated through CI before connecting platform accounts.

## Existing Context

The current repository is a FastAPI and Next.js monorepo with:

- Backend under `backend/`, using FastAPI, SQLAlchemy, Alembic, PostgreSQL, Redis, Celery, and MLOps libraries.
- Frontend under `frontend/`, using Next.js App Router, TypeScript, ESLint, and node:test static tests.
- GitHub Actions at `.github/workflows/ci.yml`.
- Docker files for backend only: `backend/Dockerfile` and `backend/Dockerfile.hf`.
- `docker-compose.yml` intended mostly for local development.
- Local `.env` and `.env.example` at repo root.

Relevant audit findings from the current code:

- `backend/main.py` has a global exception handler that returns `traceback.format_exc()` in 500 responses.
- Alembic has one linear head, but the initial revision contains non-idempotent operations that can fail on a fresh database.
- CI runs backend unit/integration tests and frontend type/static tests, but frontend lint and build are not CI gates yet.
- Runtime image/config is still development-oriented: hardcoded compose credentials, bind-mounted source in compose API service, and no frontend deployment notes.
- `backend/scripts/create_admin.py` has local uncommitted changes and must not be overwritten by this staging-readiness work.

## Non-Goals

This pass does not:

- Deploy to production.
- Configure paid tiers.
- Push to remote without explicit user instruction.
- Read, copy, or modify local secrets in `.env`.
- Add new business features.
- Rewrite the domain architecture.
- Replace Celery/MLOps architecture.
- Make Render Free suitable for production traffic.
- Require Oracle Cloud or a VPS path.

## Platform Decision

Use this free-tier staging stack:

- Frontend: Vercel Hobby.
- Backend API: Render Free Web Service.
- Database: Neon Free PostgreSQL.
- Redis: Upstash Redis Free.
- CI: GitHub Actions.

This split is intentionally pragmatic. Vercel is the simplest target for Next.js. Render is sufficient for a staging FastAPI web service, especially if background worker execution is treated as optional. Neon gives a no-time-limit free Postgres database suitable for fresh migration testing. Upstash gives a lightweight managed Redis endpoint for staging.

Known trade-offs:

- Render Free can sleep and cold-start.
- Backend dependencies are heavy because of XGBoost, SHAP, LightGBM, pandas, and scikit-learn. The first staging goal is to make the API deployable; worker-heavy ML execution can be validated separately.
- Staging should not be treated as high-availability production.

## Architecture

### Backend Runtime

Render runs the FastAPI backend from a staging-ready backend image or build command. The web process must:

- Start Uvicorn on the platform-provided port.
- Use runtime env vars for `APP_ENV`, `DATABASE_URL`, `SECRET_KEY`, `REDIS_URL`, and `FRONTEND_URL`.
- Run without requiring local bind mounts.
- Log internal exceptions server-side.
- Return generic 500 responses to clients without tracebacks.

Alembic remains the only schema migration mechanism. Staging database setup must use:

```powershell
cd backend
alembic upgrade head
```

The application must not rely on `Base.metadata.create_all()` for staging.

### Frontend Runtime

Vercel deploys the Next.js frontend from `frontend/`. The frontend must:

- Build successfully with `npm run build`.
- Pass `npm run lint` and `npm run typecheck`.
- Read the staging backend base URL from environment configuration.
- Avoid localhost fallback in production builds.

### Database

Neon PostgreSQL is the staging database source of truth. The migration chain must support a fresh database from base to head. Migration checks must cover:

- One Alembic head.
- Fresh upgrade to head against PostgreSQL.
- No branch MVP regression for the `branches` table.

### Redis

Upstash Redis is used for staging Redis connectivity. Backend behavior should stay fail-fast in production-like environments, but staging API startup should not require a Celery worker process to already be running.

If worker execution is out of scope for the initial staging environment, documentation must state that scheduled/background ML jobs are disabled or not validated in the first staging pass.

## Required Fix Areas

### 1. Alembic Fresh-DB Safety

The staging plan must identify and fix migration operations that fail on a fresh database. In particular, the initial migration currently includes branch-table drop operations even though the operational `branches` table is created later by a newer migration.

The intended outcome:

- `alembic heads` reports exactly one head.
- `alembic upgrade head` succeeds on a clean Neon-compatible PostgreSQL database.
- Existing migration tests cover the linear chain.
- A fresh-DB integration migration test or documented command is part of CI or final verification.

### 2. No Traceback in HTTP Responses

The global exception handler must stop returning traceback text to clients. For unexpected exceptions:

- Log exception details with `logger.exception`.
- Return a generic payload such as:

```json
{
  "detail": "Internal server error"
}
```

The response must not include:

- `traceback`
- Python stack frames
- exception class internals
- database connection strings or secrets

Add a backend test that triggers an unhandled exception and verifies the response does not expose traceback content.

### 3. Frontend Lint and Build Gate

CI must include frontend quality gates:

- `npm run lint`
- `npm run typecheck`
- `npm run build`
- existing node:test static and UI tests

The staging-readiness work must fix any lint/build failure that appears from these commands.

### 4. Backend Test Gate

CI must continue to run:

- backend unit/domain tests with SQLite where appropriate
- backend integration tests against PostgreSQL
- config hardening tests
- migration/logging tests
- branch management tests

The staging plan may add a focused migration smoke test if the existing integration tests do not validate `alembic upgrade head` on a fresh database.

### 5. Runtime Image and Deployment Config

Backend runtime should be cleaned for staging:

- Remove duplicate dependency installs from Dockerfile where possible.
- Do not bake secrets into images.
- Do not depend on bind-mounted source code for deployed runtime.
- Use a platform port variable where appropriate.
- Keep Dockerfile compatible with Render.

The local `docker-compose.yml` may remain development-oriented, but staging docs must clearly distinguish local compose from staging platform runtime.

Frontend deployment must be documented for Vercel:

- root directory: `frontend`
- install command: `npm ci`
- build command: `npm run build`
- output handled by Next.js/Vercel
- required env var for backend API base URL

### 6. Staging Runbook

Add or update documentation that explains:

- Free-tier platform choice.
- Required environment variables.
- Backend migration command.
- Render deploy/start command.
- Vercel build settings.
- Neon backup/export drill.
- Rollback approach.
- Smoke test checklist.

The runbook must avoid copying real secret values.

## Smoke Test Design

Staging smoke tests should be simple and deterministic:

1. Backend health:

```powershell
curl https://<staging-api>/health
```

Expected:

```json
{
  "api": "healthy",
  "database": "connected"
}
```

2. Backend root:

```powershell
curl https://<staging-api>/
```

Expected: API metadata message returns HTTP 200.

3. Frontend boot:

```powershell
curl https://<staging-frontend>/
```

Expected: HTTP 200 or platform-managed Next.js response.

4. Auth smoke:

Use a staging admin account only. Verify login returns an access token and no traceback on bad credentials.

5. Branch smoke:

Create, list, update, deactivate, and reactivate a test branch using a staging-only branch code. Clean it up by deactivation, not hard delete.

## Rollback Design

Rollback for staging should be conservative:

- Frontend: use Vercel instant rollback to the previous deployment.
- Backend: use Render deploy rollback or redeploy the previous Git commit.
- Database: for migrations that are not trivially reversible, restore a Neon branch/restore point or staging backup instead of manually editing data.

Every migration added during staging-readiness must include a `downgrade()` where reasonable. If a downgrade cannot be safely used, the runbook must state that database restore is the rollback path.

## Backup Drill Design

The staging backup drill should prove that the team can recover data before production work starts:

- Create a Neon restore point or branch before applying migrations.
- Run `alembic upgrade head`.
- Run smoke tests.
- Restore or branch back to the pre-migration state in a disposable staging database.
- Re-run `/health`.

If platform access is not available during local preparation, the runbook must include the exact manual steps and mark live execution as a staging-access task.

## Acceptance Criteria

Staging readiness is complete when:

- Alembic fresh upgrade to head is verified against PostgreSQL.
- Backend 500 responses no longer include traceback or stack content.
- Backend relevant tests pass.
- Frontend lint, typecheck, build, and static tests pass locally and are represented in CI.
- Backend runtime configuration is ready for Render Free staging.
- Frontend deployment configuration is documented for Vercel.
- Neon and Upstash env requirements are documented without secrets.
- Smoke, rollback, and backup drill procedures are documented.
- No local `.env` secrets are modified or exposed.
- Existing local user changes, especially `backend/scripts/create_admin.py`, are preserved.

## Open Questions for Implementation

- Whether Render should deploy from Dockerfile or native Python build. The implementation plan should prefer the smallest reliable path after checking current dependency install and image size behavior.
- Whether Celery worker staging should be configured in the first pass. The recommended first pass validates API staging and documents worker validation as a follow-up unless free-tier capacity proves sufficient.
- Whether GitHub Actions should run a full Next.js build on every pull request and push. The recommended answer is yes for staging readiness.

