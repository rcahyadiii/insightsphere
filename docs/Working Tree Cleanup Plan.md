# Working Tree Cleanup Plan (Phase 6)

> Plan komit terstruktur untuk merapikan ~165 file working-tree yang menumpuk dari beberapa fase Healing.
> **Belum dijalankan otomatis** — agen tidak commit tanpa permintaan eksplisit per commit. User pilih satu cara:
> - Eksekusi grup 1-by-1 (rekomendasi).
> - Atau pakai branch khusus `chore/healing-cleanup` lalu PR.

## Ringkasan

| | Modified | Deleted | New | Total |
| --- | --- | --- | --- | --- |
| Backend | 33 | 19 | ~25 | 77 |
| Frontend | 82 | 0 | ~32 | 114 |
| Docs/Root | 3 | 4 | ~10 | 17 |

## Aturan Umum

- Tetap di branch saat ini kalau working tree solo. Pakai `chore/healing-cleanup` kalau co-developer aktif di repo.
- Setiap commit: jalankan minimal `npm run typecheck` (kalau touch FE) atau pytest smoke (kalau touch BE) dulu.
- Jangan `git add -A` masal. Pakai `git add <path>` per grup.
- Setelah grup selesai, `git status` harus mencerminkan grup berikutnya saja.

## Grup Komit (urut deps)

### Commit 1 — Repo hygiene

```sh
git add .gitignore .env.example AGENTS.md backend/AGENTS.md frontend/AGENTS.md
git commit -m "chore: harden gitignore dan tambah AGENTS.md per workspace"
```

`.gitignore` baru menyaring `pytest-cache-files-*/`, `.run-logs/`, root `package-lock.json` stub, `frontend/test-output.txt`, `frontend/test-results/`, `frontend/playwright-report/`. AGENTS.md root + per-workspace memuat pedoman skill routing.

### Commit 2 — Backend P0 secrets & config

```sh
git add backend/core/config.py backend/core/runtime_constants.py backend/tests/test_p0_config_hardening.py
git commit -m "feat(config): pydantic-settings guardrails + production validators"
```

### Commit 3 — Backend P1 Mode Cermin

```sh
git add backend/core/mirror_middleware.py backend/domains/identity/mirror_service.py backend/domains/identity/constants.py backend/alembic/versions/c3d4e5f6a7b8_add_mirror_sessions.py backend/tests/domains/test_identity_mirror.py backend/tests/integration/
git commit -m "feat(identity): Mode Cermin (mirror sessions + read-only middleware + audit)"
```

### Commit 4 — Backend P2 reliability (rate limit, healthcheck, logging, migrasi konsolidasi)

```sh
git add backend/main.py backend/core/rate_limit.py backend/core/health_monitor.py backend/core/redis_health.py backend/requirements.txt backend/requirements-dev.txt backend/alembic.ini backend/alembic/versions/b2f9c1a3d4e5_consolidate_manual_migrations.py backend/tests/test_p2_logging_and_migrations.py backend/tests/test_p2_domain_constants.py backend/tests/test_rate_limit.py backend/tests/test_p6_redis_dev_guard.py backend/tests/test_deprecation_warnings.py
git commit -m "feat(backend): rate limit + DB healthcheck + logging rotate + Redis dev guard"
```

### Commit 5 — Backend domain refactors

```sh
git add backend/core/database.py backend/core/email.py backend/core/security.py backend/domains/dataset/schemas.py backend/domains/finance/ backend/domains/identity/models.py backend/domains/identity/router.py backend/domains/identity/schemas.py backend/domains/identity/service.py backend/domains/intelligence/stock_predictor.py backend/domains/intelligence/stock_predictor_config.py backend/domains/inventory/router.py backend/domains/notification/routes.py backend/domains/reporting/ backend/domains/sales/
git commit -m "refactor(backend): domain consistency (auth, finance, sales, reporting, inventory)"
```

### Commit 6 — Backend test updates

```sh
git add backend/tests/domains/ backend/tests/manual/test_offline_sync.py backend/tests/test_p3_dev_scripts.py backend/tests/test_p3_provider_config.py
git commit -m "test(backend): align domain tests with new schemas"
```

### Commit 7 — Backend scripts move + cleanup obsolete top-level files

```sh
git add backend/scripts/
git rm backend/alter_db.py backend/check_metrics.py backend/create_admin.py backend/init_db_pos.py backend/init_db_scratch.py backend/list_tables.py backend/local_training.py backend/local_training_aggressive.py backend/manual_training_test.py backend/migrate_2fa.py backend/migrate_add_tax_columns.py backend/migrate_inventory_version.py backend/migrate_offline_sync.py backend/scratch_drop_table.py backend/scratch_mock_product.py backend/scratch_stress_test.py backend/scratch_test_api.py backend/seed.py backend/worker_hf.py
git commit -m "chore(backend): pindahkan utilitas ke scripts/ dan hapus skrip ad-hoc lama"
```

### Commit 8 — Frontend domain helpers + i18n + middleware CSRF

```sh
git add frontend/src/app/domain/ frontend/src/app/i18n.tsx frontend/middleware.ts frontend/app/api/auth/
git commit -m "feat(frontend): domain constants helpers + i18n keys + Origin/CSRF middleware"
```

### Commit 9 — Frontend Mode Cermin (banner, watermark, sidebar, layout, auth context)

```sh
git add frontend/src/app/components/MirrorModeBanner.tsx frontend/src/app/components/Sidebar.tsx frontend/src/app/components/Header.tsx frontend/src/app/components/Layout.tsx frontend/src/app/components/LoginControls.tsx frontend/src/app/context/AuthContext.tsx frontend/src/app/lib/auth-client.ts frontend/src/app/lib/auth-cookie.ts frontend/src/app/lib/route-policy.ts frontend/src/app/routes.tsx
git commit -m "feat(frontend): Mode Cermin (banner + watermark + sidebar panel + auth context)"
```

### Commit 10 — Frontend login surfaces (i18n cleanup)

```sh
git add "frontend/app/login/[role]/page.tsx" frontend/app/login/page.tsx frontend/app/login/select/page.tsx frontend/app/login/forgot-password/page.tsx "frontend/app/accept-invite/[token]/page.tsx" frontend/app/api/auth/me/route.ts
git commit -m "refactor(auth-ui): bersihkan literal ID/EN dari halaman login & accept-invite"
```

### Commit 11 — Frontend lib & service layer

```sh
git add frontend/src/app/lib/api.ts frontend/src/app/lib/charts.ts frontend/src/app/lib/colors.ts frontend/src/app/lib/containers.ts frontend/src/app/lib/data.ts frontend/src/app/lib/layout.ts frontend/src/app/lib/overlays.ts frontend/src/app/lib/status.ts frontend/src/app/lib/demo-mode.ts frontend/src/app/lib/finance-client.ts frontend/src/app/lib/intelligence-client.ts frontend/src/app/lib/inventory-client.ts frontend/src/app/lib/notification-client.ts frontend/src/app/lib/pos-mobile-cart.ts frontend/src/app/lib/reporting-client.ts frontend/src/app/lib/share-providers.ts frontend/src/app/services/
git commit -m "feat(frontend-lib): tokens + domain clients (finance, inventory, reporting, intelligence)"
```

### Commit 12 — Frontend pages & POS components

```sh
git add frontend/src/app/components/pages/ frontend/src/app/components/pos/ frontend/src/app/components/inventory/ frontend/src/app/components/settings/ frontend/src/app/components/Breadcrumbs.tsx frontend/src/app/components/ExplanationCharts.tsx frontend/src/app/components/ExportShareModal.tsx frontend/src/app/components/ForecastChart.tsx frontend/src/app/components/KPICards.tsx frontend/src/app/components/LowStockAlert.tsx
git commit -m "refactor(frontend): pages + POS + inventory + settings (i18n + tokens)"
```

### Commit 13 — Frontend UI primitives

```sh
git add frontend/src/app/components/ui/
git commit -m "refactor(ui): shadcn primitives align dengan a11y + responsive tokens"
```

### Commit 14 — Frontend tests + Playwright e2e + audit guards

```sh
git add frontend/tests/ frontend/playwright.config.ts
git commit -m "test(frontend): node:test integration audits + Playwright e2e Mode Cermin"
```

### Commit 15 — Frontend bootstrap (App, layout, package, tsconfig, env, fonts)

```sh
git add frontend/src/app/App.tsx frontend/app/layout.tsx frontend/app/globals.css frontend/src/styles/fonts.css frontend/next.config.mjs frontend/package.json frontend/package-lock.json frontend/tsconfig.json frontend/.env.local.example frontend/src/app/types/pos.ts frontend/src/app/demo/
git commit -m "chore(frontend): bootstrap + Playwright devDep + tsconfig exclusions"
```

### Commit 16 — Docs (Mode Cermin + Project Health Tracker + audit followups)

```sh
git add "docs/Mirror Mode.md" "Design System/MIRROR_MODE.md" "docs/Project Health Tracker.md" "docs/Working Tree Cleanup Plan.md" "docs/Audit Hardcode Followup.md" "docs/Audit Hardcode Frontend.md" "docs/Frontend Hardcode Remediation Progress.md" "docs/Rencana Integrasi Backend.md" "docs/UI_UX_AUDIT.md" "docs/\360\237\223\220 InsightSphere - Urutan Design Aplikasi.md" docs/superpowers/
git rm "docs/FRONTEND_AUDIT_REPORT.md" "docs/analysis/UI_UX_AUDIT_2026-05-02.md" "docs/analysis/UI_UX_AUDIT_2026-05-04.md" "docs/research/backend_technical_audit.md"
git commit -m "docs: Mode Cermin reference + tracker phase 0-6 + cleanup audit lama"
```

### Commit 17 — CI + git hooks

```sh
git add .github/ .githooks/
git commit -m "ci: GitHub Actions + native git hooks pre-commit gate"
```

### Commit 18 — Top-level profile/demo pages

```sh
git add frontend/app/profil/
git commit -m "feat(profil): halaman profil pengguna"
```

## Verifikasi setelah selesai

```sh
.\.venv\Scripts\python.exe -m pytest backend/tests -q
cd frontend; npm run typecheck; node --experimental-strip-types --test --test-isolation=none tests/integration/*.test.mjs tests/ui/*.test.mjs tests/*.test.mjs
```

## Kalau mau pakai branch khusus

```sh
git checkout -b chore/healing-cleanup
# eksekusi commit 1..18
git push -u origin chore/healing-cleanup
gh pr create --title "Healing Phase 0-6 cleanup" --body-file docs/Working\ Tree\ Cleanup\ Plan.md
```
