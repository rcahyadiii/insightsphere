# Development Scripts

Script di folder ini hanya untuk lingkungan development dan wajib dijalankan
dengan guard env eksplisit.

Contoh pola eksekusi:

```powershell
$env:APP_ENV = "development"
$env:API_BASE_URL = "<backend-api-base-url>"
python -m scripts.dev.test_transactions_api
python -m scripts.dev.stress_transactions_summary
```

Script database destructive juga wajib memakai `APP_ENV=development`:

```powershell
$env:APP_ENV = "development"
$env:DATABASE_URL = "<development-database-url>"
python -m scripts.dev.recreate_prediction_log_table
python -m scripts.dev.seed_mock_product
```

Jangan jalankan script ini di production. Untuk migration resmi, gunakan Alembic
atau script migration operasional yang membaca `DATABASE_URL` dari runtime env.
