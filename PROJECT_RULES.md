# POS CERDAS - CORE RULES & ARCHITECTURE

## 1. Konteks Proyek
- **Tujuan:** Membangun sistem Point of Sale (POS) backend-heavy untuk UMKM yang berfokus pada Keamanan Kas (Cash Management) dan Inteligensi Stok (XAI).
- **Pendekatan:** Fungsionalitas data pipeline diutamakan sebelum UI.

## 2. Tech Stack & Arsitektur
- **Backend:** Python + FastAPI (Gunakan pola Repository/MVC agar logic database tidak menumpuk di routing).
- **Database:** PostgreSQL via SQLAlchemy.
- **Frontend:** Next.js (Jangan sentuh frontend sebelum backend API selesai dan diuji).

## 3. Aturan Emas Database (Mitigasi Risiko)
- WAJIB menyertakan `branch_id` di tabel transaksional (`transactions`, `sessions`, `inventory`) untuk mendukung multi-cabang.
- WAJIB menggunakan Database Transactions (`session.commit()` / `session.rollback()`) saat insert data transaksi untuk mencegah *Race Conditions*.

## 4. Struktur Database Tahap 1
1. `branches`: id, name
2. `products`: id, name, category, default_price
3. `transactions`: id, branch_id, date, time, total_amount, payment_method
4. `transaction_items`: id, transaction_id, product_id, quantity, unit_price

## 6. Data Engineering & Quality Standards
- **ETL Pipeline:** Wajib Idempoten (Upsert), terapkan Slowly Changing Dimensions (SCD Type 2) untuk harga, dan gunakan Incremental Loading (Watermarking).
- **Data Contracts:** Validasi ketat menggunakan Pydantic sebelum insert DB. Baris yang error/kotor HARUS masuk ke tabel `dead_letter_queue`, jangan dibuang dan jangan buat program crash.

## 7. Database & MLOps Architecture
- **Anti N+1:** Wajib menggunakan `selectinload` atau `joinedload` di SQLAlchemy untuk query relasional.
- **Soft Delete & Timestamp:** Gunakan `created_at`, `updated_at`, dan `deleted_at` (timezone aware). Jangan pernah lakukan Hard Delete pada master data.
- **MLOps:** Pisahkan fitur Machine Learning dari proses transaksional. Gunakan endpoint Background Tasks untuk kalkulasi XGBoost/SHAP. Hasil ML disimpan di tabel `ai_prediction_logs` dan `ml_feature_store`.

## 8. Frontend & UI/UX (Data Storytelling)
- **Anti Data-Dump:** Jangan penuhi dashboard dengan grafik statis.
- **Narrative First:** Gunakan pola 'The Problem-Solution Story'. Sajikan insight AI dalam bentuk kalimat yang bisa dibaca manusia, bukan sekadar angka probabilitas.