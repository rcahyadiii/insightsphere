#!/bin/sh
# Entrypoint produksi (Render). Dijalankan oleh Dockerfile CMD.
# Urutan: migrasi DB -> pastikan admin awal -> start server.
# Semua langkah idempotent, jadi aman dipanggil tiap restart (Render free
# tier sering tidur lalu restart saat ada request masuk).
set -e

echo "==> [start] alembic upgrade head ..."
alembic upgrade head

echo "==> [start] memastikan user admin awal (faiz) ..."
python -m scripts.create_admin

echo "==> [start] memastikan akun test tiap role (owner/kasir/inventaris) ..."
python -m scripts.seed_test_users

echo "==> [start] menjalankan uvicorn di port ${PORT:-8000} ..."
exec uvicorn main:app --host 0.0.0.0 --port "${PORT:-8000}"
