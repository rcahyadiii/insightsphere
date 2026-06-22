# Git Hooks (InsightSphere)

Native git hooks (tanpa husky) untuk pre-commit gate. Aktivasi opt-in supaya
tidak memaksa kontributor lain menerima hook tanpa konsensus.

## Aktivasi

Sekali per clone:

```sh
git config core.hooksPath .githooks
```

Cek aktif:

```sh
git config --get core.hooksPath
# harus mencetak: .githooks
```

Nonaktifkan (revert ke `.git/hooks` default):

```sh
git config --unset core.hooksPath
```

## Apa yang dijalankan `pre-commit`

Hook membaca file staged (`git diff --cached --name-only`) lalu hanya
menjalankan check yang relevan supaya commit kecil tetap cepat.

| Trigger (path staged) | Aksi |
| --- | --- |
| `frontend/**/*.{ts,tsx,mts,cts}` | `npm --prefix frontend run typecheck` (`tsc --noEmit`). |
| `frontend/{src,app,tests}/**/*.{ts,tsx,mjs}` | `node --test tests/integration/*.test.mjs` (audit hardcode/i18n). |
| `backend/**/*.py` | `.venv/Scripts/ruff.exe check backend` (kalau ada) + pytest smoke (`test_p0_config_hardening`, `test_p2_logging_and_migrations`, `test_p6_redis_dev_guard`, `domains/test_identity_mirror`). |

Hook tidak melakukan auto-format. Filosofi: gate, bukan fixer.

## Skip darurat

```sh
git commit --no-verify -m "WIP: ..."
```

Skip jangan jadi default. Kalau hook bikin loop merah berulang, fix root cause-nya.

## Kenapa native git hooks (bukan husky)

- Repo ini multi-runtime (Python + Node). Husky hanya alami untuk Node-only repo.
- Tanpa husky, tidak perlu menambah devDependency atau `prepare` script di `frontend/package.json`.
- Aktivasi opt-in via `core.hooksPath` (per clone) jadi explicit, bukan implicit.
- Sandbox tooling kami saat ini tidak punya akses npm registry / pypi untuk
  install husky/lint-staged + ruff secara fresh; native shell hook bekerja
  tanpa dependency baru.

## Troubleshooting

- **`ruff not installed` di output:** jalankan `& .venv/Scripts/python.exe -m pip install -r backend/requirements-dev.txt` (sudah include `ruff>=0.6.9`).
- **`tsc --noEmit` lambat di laptop kecil:** sementara skip dengan `--no-verify`,
  tapi rapikan dependency tsconfig di follow-up commit.
- **Hook tidak jalan di Windows non-Git Bash:** pastikan `git --version` ≥ 2.30 dan
  shebang `#!/usr/bin/env sh` aktif. Git for Windows membundle bash di `usr/bin`.
