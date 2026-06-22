# Branch Management MVP Design

Date: 2026-06-15
Status: Approved design, awaiting spec review
Scope: A - Master Cabang only

## Goal

Build a focused master branch management feature for InsightSphere so owner/admin users can create, view, edit, deactivate, and reactivate operational business branches from the settings area.

This feature establishes the operational branch master for future inventory, user assignment, reporting, and forecasting work. It does not import product data, connect ML models, or migrate transactional flows in this phase.

## Existing context

The current repository already has a `Store` model in `backend/domains/dataset/models.py`, exposed through `GET /stores/`. That model is documented as read-only dataset/Kaggle data and is used by older sales, dashboard, reporting, and ML paths through `store_nbr`.

The current codebase also has:

- `User.store_nbr` for branch-scoped users.
- `require_owner_or_admin` in `backend/core/security.py`.
- `AbstractBase` with `id`, `created_at`, `updated_at`, and `deleted_at`.
- `AuditEvent` in `backend/domains/observability/models.py`.
- A static frontend store settings panel at `frontend/src/app/components/settings/StoreSettingsPanel.tsx`.

Because `stores` is dataset-owned and read-only, this MVP must not mutate or redefine `stores`. Operational branches will live in a new branch domain and table.

## Non-goals

The following are explicitly out of scope for this MVP:

- Importing products from `C:\Portfolio\Dataset\raw_data\cleaned_products.csv`.
- Connecting trained models or forecast datasets.
- Adding `forecast_region_key`.
- Migrating POS transaction creation, dashboard filtering, reporting joins, or inventory stock movement logic to the new branch table.
- Replacing `GET /stores/` for legacy dataset flows.
- Hard deleting branches.
- Running destructive migrations or modifying production data.

These items should be handled in later phases:

- Phase B: product master import.
- Phase C: branch-to-forecast mapping and model integration.
- A separate compatibility phase: migrate transactional branch resolution from dataset `stores` to operational `branches`.

## Key decisions

- Create a new backend domain: `backend/domains/branches/`.
- Create a new table: `branches`.
- Keep `stores` read-only and untouched.
- Keep `store_nbr` on `branches` as a required unique compatibility key.
- Add `branch_code` as a required unique human-facing branch code.
- Use UUID `id` as the internal primary key through `AbstractBase`.
- Use soft delete semantics: `is_active=false` and `deleted_at` set.
- Allow reactivation by setting `is_active=true`, which clears `deleted_at`.
- Only `owner` and `admin` can create, update, deactivate, or reactivate branches.
- Deactivation is blocked while active users still reference the branch `store_nbr`.
- Branch create/update/deactivate actions are audited with changed-field details.

## Backend design

### Domain files

Create a focused `branches` domain:

- `backend/domains/branches/models.py` - SQLAlchemy `Branch` model.
- `backend/domains/branches/schemas.py` - Pydantic request and response schemas.
- `backend/domains/branches/service.py` - validation, uniqueness checks, active-user guard, audit event creation, and transaction boundaries.
- `backend/domains/branches/repository.py` - branch query helpers where useful.
- `backend/domains/branches/router.py` - FastAPI routes only.
- `backend/domains/branches/__init__.py` - domain package marker.
- Alembic migration under `backend/alembic/versions/`.

Register the new model import and router in `backend/main.py`.

### Branch model

The MVP branch model should contain:

- `id`: UUID primary key from `AbstractBase`.
- `store_nbr`: positive integer, unique, indexed, required.
- `branch_code`: string, unique, indexed, required.
- `name`: string, required.
- `address`: text/string, required.
- `phone`: string, optional.
- `email`: string, optional.
- `opening_time`: time, optional.
- `closing_time`: time, optional.
- `is_active`: boolean, default true, indexed.
- `created_at`, `updated_at`, `deleted_at`: inherited from `AbstractBase`.

`branch_code` should be normalized by trimming whitespace and uppercasing before storage. `name`, `address`, `phone`, and `email` should be trimmed. Empty strings should be rejected for required fields and converted to `null` for optional fields.

### API contract

Use `/branches` for operational branch management. Keep `/stores` unchanged for legacy dataset reads.

Endpoints:

- `GET /branches?status=active|inactive|all&search=&skip=0&limit=100`
  - Authenticated users can read the list.
  - Owner/admin see all branches matching filters.
  - Store-scoped roles only see their own active branch when `store_nbr` matches.
- `GET /branches/{branch_id}`
  - Authenticated users can read branch detail if allowed by role/scope.
- `POST /branches`
  - Owner/admin only.
  - Creates an active branch.
- `PATCH /branches/{branch_id}`
  - Owner/admin only.
  - Partial update.
  - Supports reactivation by sending `is_active=true`.
- `DELETE /branches/{branch_id}`
  - Owner/admin only.
  - Soft deactivation.
  - Idempotent for already inactive branches.

Response object:

```json
{
  "id": "uuid",
  "store_nbr": 101,
  "branch_code": "JKT-PST-01",
  "name": "Jakarta Pusat 01",
  "address": "Jl. ... Jakarta Pusat",
  "phone": "+62 ...",
  "email": "branch@example.com",
  "opening_time": "08:00:00",
  "closing_time": "21:00:00",
  "is_active": true,
  "created_at": "2026-06-15T00:00:00Z",
  "updated_at": "2026-06-15T00:00:00Z",
  "deleted_at": null
}
```

### Validation and errors

Validation rules:

- `store_nbr` must be a positive integer.
- `store_nbr` must be unique in `branches`.
- `branch_code` must be unique after normalization.
- `name` and `address` are required.
- `email`, when provided, must be valid email syntax.
- `opening_time` and `closing_time`, when provided, must not be equal.

Expected errors:

- `400 Bad Request` for invalid payloads that pass Pydantic but fail business validation.
- `401 Unauthorized` for missing/invalid auth.
- `403 Forbidden` for roles that cannot mutate branches.
- `404 Not Found` for unknown branch IDs.
- `409 Conflict` for duplicate `store_nbr`, duplicate `branch_code`, or deactivation blocked by active users.

Blocked deactivation should return a specific message and active-user count, for example:

```json
{
  "detail": {
    "code": "BRANCH_HAS_ACTIVE_USERS",
    "message": "Deactivate blocked. Move or deactivate active users assigned to this branch first.",
    "active_user_count": 3
  }
}
```

### Deactivation guard

Before deactivating a branch, check `users` for active users where:

- `User.store_nbr == Branch.store_nbr`
- `User.is_active == true`
- `User.deleted_at IS NULL`

If any active user exists, reject deactivation with `409 Conflict`.

Reactivation should set:

- `is_active=true`
- `deleted_at=null`

### Audit trail

Every branch mutation writes one `AuditEvent`.

Do not set `AuditEvent.store_nbr` for branch CRUD in this MVP because that column currently has a foreign key to dataset `stores.store_nbr`. New operational branches may not exist in `stores`, so setting that FK column could break inserts.

Instead, set:

- `AuditEvent.store_nbr = null`
- `event_type = "BRANCH_CREATED" | "BRANCH_UPDATED" | "BRANCH_DEACTIVATED" | "BRANCH_REACTIVATED"`
- `event_data.branch_id`
- `event_data.branch_store_nbr`
- `event_data.actor_user_id`
- `event_data.changed_fields`

For updates, `changed_fields` should contain only fields that changed:

```json
{
  "name": {
    "old": "Jakarta Pusat Lama",
    "new": "Jakarta Pusat 01"
  },
  "phone": {
    "old": null,
    "new": "+62 812 0000 0000"
  }
}
```

## Frontend design

### Location

Use the existing settings route and panel:

- Page owner: `frontend/src/app/components/pages/PengaturanPage.tsx`
- Panel: `frontend/src/app/components/settings/StoreSettingsPanel.tsx`

The tab remains "Informasi Toko", but the content becomes operational branch management instead of a static single-store form.

### Interaction model

The panel should include:

- Header with title, short description, and `Tambah Cabang` button.
- Segmented filter: `Aktif` and `Nonaktif`.
- Search input for branch name, branch code, or `store_nbr`.
- Desktop table with columns:
  - Kode
  - Nama cabang
  - Store number
  - Kontak
  - Jam operasional
  - Status
  - Aksi
- Mobile compact list/card layout instead of forcing a wide table.
- Create/edit modal.
- Deactivate confirmation dialog.

The primary user flow:

1. Owner/admin opens `Pengaturan > Informasi Toko`.
2. Active branches load by default.
3. User clicks `Tambah Cabang`.
4. Modal opens with fields for `store_nbr`, `branch_code`, `name`, `address`, `phone`, `email`, `opening_time`, and `closing_time`.
5. Submit creates branch, closes modal, refreshes list, and shows success feedback.
6. Edit opens the same modal with existing data.
7. Deactivate opens a confirmation dialog.
8. If deactivation is blocked, show the active-user blocker message.

### UI/UX direction

Use an operational utilitarian dashboard style:

- Dense but readable.
- No landing-page composition.
- No decorative cards inside cards.
- No new font or unrelated palette.
- Follow existing Tailwind tokens, typography utilities, colors, and Lucide icons.
- Use familiar controls: button with plus icon, segmented filter, table/list, dialog, status badge.

Accessibility requirements:

- All inputs must have labels.
- Placeholder text is not a label replacement.
- Async submit buttons must show loading and be disabled while pending.
- Errors must be visible near the field and available through `role="alert"` or `aria-live`.
- Icon-only actions need accessible names.
- Keyboard users must be able to open, submit, cancel, and close dialogs.
- Mobile layout must avoid horizontal viewport overflow.

## Data flow

Frontend data flow:

1. `StoreSettingsPanel` calls a branch API client.
2. API client calls `/branches`.
3. UI stores list loading, empty, error, and success states locally or through the repository's existing frontend API patterns.
4. Create/update/deactivate mutations call backend endpoints.
5. After successful mutation, reload branch list for the current filter.

Backend data flow:

1. Router authenticates user and delegates to service.
2. Service normalizes input.
3. Service checks uniqueness and role/scope rules.
4. Service writes branch change in a transaction.
5. Service records audit event in the same transaction.
6. Router returns Pydantic response.

## Security and safety

- Owner/admin only for mutations.
- Store-scoped roles cannot create, update, deactivate, or reactivate branches.
- No secrets or environment variables are introduced.
- No production data scripts are introduced.
- No hard delete for branches.
- No direct writes to dataset `stores`.
- No destructive migration.
- Deactivation blocked while active users still reference the branch.

## Testing strategy

Backend tests should cover:

- Owner/admin can create branch.
- Cashier/inventory manager cannot create branch.
- Duplicate `store_nbr` returns conflict.
- Duplicate `branch_code` returns conflict after normalization.
- List active branches by default.
- List inactive branches with `status=inactive`.
- Update writes changed fields and audit event.
- Deactivate sets `is_active=false` and `deleted_at`.
- Deactivate is blocked when active users reference the branch `store_nbr`.
- Reactivate clears `deleted_at`.

Frontend tests should cover:

- Store settings panel renders branch management controls.
- Active/inactive filter changes visible state.
- Add branch opens modal with labeled fields.
- Submit disabled/loading state appears during mutation.
- Deactivate confirmation is required.
- Blocked deactivation error is shown to the user.

Relevant verification commands after implementation:

```powershell
pytest backend/tests/domains/test_branches.py -q
pytest backend/tests/test_p0_config_hardening.py
cd frontend
node --experimental-strip-types --test --test-isolation=none tests/integration/*.test.mjs tests/ui/*.test.mjs tests/*.test.mjs
npm run lint
npm run typecheck
```

## Open integration notes for later phases

This MVP intentionally leaves legacy `stores` in place. Later phases should decide how to migrate:

- `sales.service.create_single_transaction` branch resolution.
- Dashboard branch comparison and filters.
- Reporting joins that currently join `Transaction.branch_id == Store.id`.
- Inventory stock queries that use `store_nbr`.
- User management branch dropdown source.
- ML forecast region mapping.

Until that migration is done, the operational `branches` table is the source of truth for branch management UI, while legacy transactional code may still rely on dataset `stores`.

## Acceptance criteria

- Owner/admin can manage operational branches from settings.
- Non-owner/admin users cannot mutate branches.
- Branches are soft-deactivated, never hard-deleted.
- Deactivation is blocked when active users are assigned to the branch.
- Audit events contain changed-field details for branch mutations.
- Existing `/stores/` endpoint and dataset store model remain unchanged.
- Product import and model integration are not included in this phase.
