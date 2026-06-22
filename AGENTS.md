# AGENTS.md â€” Pedoman untuk AI Coding Agent

File ini adalah sumber kebenaran untuk AI agent (Codex CLI / Kiro) saat bekerja di repo InsightSphere.
Setiap agent yang membaca file ini WAJIB mematuhi pedoman di bawah selama scope-nya berlaku
(seluruh pohon direktori dari folder yang memuat AGENTS.md ini).

## 1. Hierarki Aturan

Urutan prioritas (yang lebih tinggi menang saat konflik):

1. Instruksi langsung dari user di prompt.
2. `PROJECT_RULES.md` di root â€” aturan teknis & arsitektur InsightSphere.
3. `AGENTS.md` (file ini) â€” auto-routing ke skill packs sesuai konteks.
4. Skill packs di `SKILL/` â€” pedoman domain-specific yang detail.
5. Konvensi yang ada di kode existing.

## 2. Auto-Routing Skill Packs

Gunakan pedoman berikut secara otomatis sesuai file yang sedang Anda sentuh.
Baca file SKILL terkait sebelum menulis kode di area tersebut.

### Backend (Python/FastAPI di `backend/`)

- Saat menulis route/endpoint baru â†’ ikuti `SKILL/The FullStack Developer Pack/api-patterns/SKILL.md` dan `rest.md`.
- Saat menulis logika auth/2FA â†’ ikuti `SKILL/The FullStack Developer Pack/api-patterns/auth.md`.
- Saat menambah/mengubah model database â†’ ikuti `SKILL/The FullStack Developer Pack/database-design/schema-design.md` dan `migrations.md`.
- Saat menulis query SQLAlchemy â†’ ikuti `SKILL/The FullStack Developer Pack/database-design/optimization.md` (Anti N+1, gunakan `selectinload`/`joinedload`).
- Saat menambah index baru â†’ ikuti `SKILL/The FullStack Developer Pack/database-design/indexing.md`.
- Saat refactor lintas-domain â†’ ikuti `SKILL/The FullStack Developer Pack/senior-fullstack/SKILL.md`.
- Saat menulis backend test â†’ ikuti pola `tests/conftest.py` (SQLite in-memory + override `get_db`).

### Frontend (Next.js di `frontend/`)

- Saat membuat komponen UI â†’ ikuti `SKILL/The FullStack Developer Pack/frontend-developer/SKILL.md` dan `SKILL/The Web Designer Pack/frontend-design/`.
- Saat membuat halaman/layout â†’ ikuti `SKILL/The Web Designer Pack/ui-ux-pro-max/`.
- Saat membuat tampilan mobile (POS, kasir) â†’ ikuti `SKILL/The Web Designer Pack/mobile-design/`.
- Saat membuat animasi scroll/parallax â†’ ikuti `SKILL/The Web Designer Pack/scroll-experience/`.
- Saat membuat visual canvas (chart, dashboard) â†’ ikuti `SKILL/The Web Designer Pack/canvas-design/`.
- Saat membuat experience 3D (jika ada) â†’ ikuti `SKILL/The Web Designer Pack/3d-web-experience/`.

### Lintas-cutting

- Dokumentasi API â†’ `SKILL/The FullStack Developer Pack/api-patterns/documentation.md`.
- Versioning API â†’ `SKILL/The FullStack Developer Pack/api-patterns/versioning.md`.
- Rate limiting â†’ `SKILL/The FullStack Developer Pack/api-patterns/rate-limiting.md`.
- Security testing â†’ `SKILL/The FullStack Developer Pack/api-patterns/security-testing.md`.
- Integrasi pembayaran (Stripe-like) â†’ `SKILL/The FullStack Developer Pack/stripe-integration/SKILL.md`.

## 3. Aturan Operasional Repo

### Struktur File

- Skrip utilitas backend WAJIB di `backend/scripts/`. Jangan taruh skrip baru di root `backend/`.
- Skrip migrasi schema WAJIB lewat Alembic (`backend/alembic/versions/`). Jangan buat skrip migrasi manual baru.
- Test backend di `backend/tests/`. Test frontend dipisah ke `frontend/tests/integration/` (logika lintas-modul) atau `frontend/tests/ui/` (visual/interaksi).

### Konfigurasi & Secrets

- WAJIB pakai `pydantic-settings` (lihat `backend/core/config.py`). Jangan hardcode credential di luar block dev guard.
- Production env (`APP_ENV=production`) menolak dev defaultsâ€”pastikan `.env` runtime sudah lengkap.
- Jangan commit file `.env` (hanya `.env.example`).

### Database & Migrasi

- Setiap perubahan schema â†’ buat revisi Alembic baru, jangan ALTER TABLE manual.
- Operasi DDL di Alembic harus idempotent jika memungkinkan (`ADD COLUMN IF NOT EXISTS`).
- Soft delete only untuk master data (`deleted_at` timezone aware).

### Testing

- Sebelum claim selesai, jalankan `pytest backend/tests/test_p0_config_hardening.py` dan test domain yang terdampak.
- Frontend test pakai Playwright via folder `frontend/tests/`.

### Git & Logging

- Jangan commit log files (`*.uvicorn-*.log`, `system_api.log`, `pgdata/`). Sudah ter-cover `.gitignore`.
- Jangan auto-commit perubahan kecuali user eksplisit minta.

## 4. Konvensi Kode Singkat

- Python: `snake_case` (file & symbol), Pydantic untuk validasi I/O, type hints wajib di public functions.
- TypeScript/React: `camelCase` untuk symbol, `PascalCase` untuk komponen, hindari `any`.
- Komentar inline minimal (dokumentasikan via docstring/README, bukan inline noise).

## 5. Saat Konflik atau Ambigu

Kalau ada konflik antara skill pack dan pola existing di codebase, pilih yang lebih konsisten dengan kode yang sudah ada,
lalu sebut trade-off itu di final message ke user.

## 6. Superpowers Integration

- If the Codex runtime exposes a `skill`/`Skill`/`activate_skill` tool, invoke relevant Superpowers skills before planning, debugging, implementing, or finishing work.
- If the skill tool is not available, manually read only the relevant Superpowers skill file from `C:/Users/FAIZ/.codex/plugins/cache/openai-curated/superpowers/1141b764/skills/` and follow its workflow.
- For integration/backend work, inspect the newest plan in `docs/superpowers/plans/` before making implementation decisions.
- Treat `docs/superpowers/plans/*.md` as planning context, not as automatically executable truth; reconcile it with current code before editing.
- Do not commit `.superpowers/` runtime artifacts. They are local brainstorm/session state and already ignored.

Recommended Superpowers routing:

- Before broad planning -> `superpowers:writing-plans`.
- Before feature/bug implementation -> `superpowers:test-driven-development` when feasible.
- When debugging failures -> `superpowers:systematic-debugging`.
- Before claiming completion -> `superpowers:verification-before-completion`.
- Before major handoff/review -> `superpowers:requesting-code-review`.
