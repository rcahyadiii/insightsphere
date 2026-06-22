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
