# AGENTS.md â€” Backend Scope (InsightSphere)

Scope: seluruh file di `backend/`. Pedoman di `AGENTS.md` root tetap berlaku;
file ini menambahkan konteks spesifik backend.

## 1. Arsitektur Domain-Driven

- Logika bisnis hidup di `backend/domains/<domain>/` (e.g. `identity`, `inventory`, `sales`).
- Setiap domain idealnya punya:
  - `models.py` â€” SQLAlchemy ORM models.
  - `schemas.py` â€” Pydantic schemas (request/response).
  - `service.py` atau `repository.py` â€” logika bisnis & query DB.
  - `router.py` â€” FastAPI route, tipis, hanya orkestrasi.
- Routing tidak menyentuh ORM langsung. Logic database lewat service/repository.

## 2. Skill Pack yang Wajib Dirujuk

- API design â†’ `SKILL/The FullStack Developer Pack/api-patterns/rest.md`, `response.md`, `versioning.md`.
- Auth & 2FA â†’ `SKILL/The FullStack Developer Pack/api-patterns/auth.md`.
- Schema & migrations â†’ `SKILL/The FullStack Developer Pack/database-design/schema-design.md`, `migrations.md`.
- Optimisasi query â†’ `SKILL/The FullStack Developer Pack/database-design/optimization.md` (Anti N+1).
- Indexing â†’ `SKILL/The FullStack Developer Pack/database-design/indexing.md`.
- Senior-level cross-cutting â†’ `SKILL/The FullStack Developer Pack/senior-fullstack/SKILL.md`.

## 3. Pola Wajib

- **Multi-cabang**: tabel transaksional (`transactions`, `cash_sessions`, `inventory`) WAJIB punya `branch_id` atau `store_nbr`.
- **Race condition guard**: insert transaksi WAJIB dalam `db.begin()` / commit-rollback eksplisit.
- **Idempotency POS offline**: gunakan `client_txn_id` untuk dedup.
- **Optimistic locking**: kolom `version` di `inventory` di-bump tiap update.
- **Soft delete**: master data pakai `deleted_at` (timezone aware), bukan hard delete.
- **Dead Letter Queue**: row gagal validasi masuk `dead_letter_queue`, jangan crash atau diam-diam dibuang.

## 4. Migrasi Database

- WAJIB lewat Alembic. Jangan tulis skrip `migrate_*.py` baru di `backend/scripts/`.
- Buat revisi: `cd backend && alembic revision -m "deskripsi"`.
- Operasi DDL idempotent kalau bisa: `ADD COLUMN IF NOT EXISTS`, `CREATE INDEX IF NOT EXISTS`.
- Selalu tulis `downgrade()` yang mirror dari `upgrade()`.

## 5. Konfigurasi & Secrets

- Akses env via `from core.config import settings`. Jangan baca `os.getenv` langsung di domain code.
- Jangan tambah default hardcoded baru di `core/config.py` di luar block dev guard.
- Test env hardening: `pytest backend/tests/test_p0_config_hardening.py`.

## 6. Testing

- Test pakai SQLite in-memory via fixture `db_session` di `tests/conftest.py`.
- Untuk endpoint: gunakan fixture `admin_client` atau `regular_client` (sudah handle auth override).
- JSONB Postgres otomatis di-compile jadi JSON di SQLite (lihat conftest).
- Sebelum claim selesai, minimal jalankan:
  - `pytest backend/tests/test_p0_config_hardening.py`
  - test domain yang Anda sentuh (`tests/domains/test_<domain>.py`).

## 7. ML / MLOps

- Model training: ada di `backend/scripts/local_training*.py` dan `worker_hf.py`.
- Hasil prediksi disimpan di `ai_prediction_logs` dan `ml_feature_store`.
- Inference berat WAJIB lewat background task / Celery worker, bukan request lifecycle.
- XGBoost feature contract harus konsisten antara training & inference.

## 8. Larangan

- Jangan bikin file baru di root `backend/` selain yang sudah ada (main.py, alembic.ini, requirements*.txt, Dockerfile).
- Jangan commit log uvicorn / system_api.log.
- Jangan modify `pgdata/`.
- Jangan ubah port `DEV_DATABASE_URL` tanpa juga sinkronkan ke `docker-compose.yml`.

## 9. Superpowers Backend Plans

- Before backend integration work, read the newest file in `docs/superpowers/plans/` and extract only backend-relevant action items.
- If a Superpowers skill tool is available, use `superpowers:systematic-debugging` for failing tests and `superpowers:verification-before-completion` before final status.
- If no skill tool is available, manually consult the corresponding skill markdown under the installed Superpowers plugin cache.
