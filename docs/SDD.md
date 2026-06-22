# Software Design Document (SDD) - InsightSphere

**Version:** 1.1.0  
**Project:** InsightSphere (POS Intelligence)  
**Status:** Refined

---

## 1. System Architecture

InsightSphere menggunakan arsitektur modern yang memisahkan tanggung jawab antara antarmuka pengguna, logika bisnis, dan pemrosesan kecerdasan buatan.

### 1.1 High-Level Overview
*   **Layer Frontend:** Next.js (SPA/SSR) berkomunikasi dengan Backend melalui Rest API.
*   **Layer Backend:** FastAPI mengelola validasi, logika bisnis (Repository Pattern), dan integritas data.
*   **Layer Intelligence:** Celery worker menjalankan model XGBoost secara asinkron untuk menghindari beban pada proses utama.

### 1.2 Technology Stack
*   **Language:** Python 3.9+ (Backend), TypeScript (Frontend).
*   **API Framework:** FastAPI (Asynchronous support).
*   **Database:** PostgreSQL (Relational).
*   **Task Queue:** Celery with Redis for ML batches.

## 2. Database Design (Schema)

### 2.1 Core Entities
*   **`users`**: Identitas pengguna dengan RBAC dan audit login.
*   **`products`**: Master katalog dengan field `family` sebagai jembatan ke ML.
*   **`transactions`**: Kernel POS untuk pencatatan keranjang belanja.
*   **`inventory`**: Pelacakan stok real-time per cabang (`store_nbr`).
*   **`stock_movements`**: Log audit setiap perubahan stok (append-only).

### 2.2 Fault Tolerance Design (Dead Letter Queue)
Untuk menjaga keandalan data pipeline, sistem mengimplementasikan mekanisme **Dead Letter Queue (DLQ)**:
*   **`etl_job_logs`**: Setiap job data (seperti sinkronisasi transaksi offline atau impor produk) mencatat status, jumlah record yang sukses, dan yang gagal.
*   **`dead_letter_queue`**: Jika baris data gagal divalidasi oleh skema Pydantic atau melanggar *constraint* database, baris mentah (raw data) disimpan ke tabel ini dalam format JSONB bersama dengan alasan errornya.
*   **Manfaat:** Mencegah satu baris data kotor mencederai seluruh proses batch, mempermudah debug bagi tim operasional tanpa menghentikan arus bisnis.

## 3. Machine Learning Pipeline

Sistem menggunakan pipeline 4-tahap yang dijalankan secara otomatis via **Celery Scheduler** atau secara manual melalui API MLOps.

### 3.1 Pipeline Stages
1.  **Data Load (Extraction):** Pipeline menarik data dari PostgreSQL (transaksi historis, level stok, profil toko) dan data eksternal (harga minyak bumi/oil prices dan hari libur nasional).
2.  **Feature Engineering (ETL):**
    *   **Calendar Features:** Menentukan akhir pekan, hari gajian, dan jarak ke hari libur.
    *   **Lags & Rolling:** Menghitung rata-rata penjualan 7 hari terakhir dan lag historis (H-1, H-7) untuk menangkap musiman.
    *   **Encoding:** Mengonversi data kategorikal (city, state, product family) menjadi nilai numerik yang dapat dibaca model.
3.  **Model Training (Multi-Horizon):**
    *   Menggunakan algoritma **XGBoost Regressor** dengan objektif *Tweedie Variance* untuk menangani data penjualan yang sering nol.
    *   Melatih 4 varian model untuk horizon berbeda (H+7, H+14, H+21, H+28).
    *   Evaluasi menggunakan metrik MAE, RMSE, dan WAPE.
4.  **Inference & XAI Serving:**
    *   Hasil prediksi disimpan ke tabel `ai_prediction_logs`.
    *   **SHAP (SHapley Additive exPlanations):** Dijalankan untuk mengekstraksi kontribusi setiap fitur (misal: "Promo memberikan dampak +15%"). Hasilnya dikonversi menjadi narasi teks manusiawi untuk dashboard.

## 4. Design Principles
*   **Idempotency:** Menjamin transaksi tidak diproses dua kali via `client_txn_id`.
*   **Soft Deletion:** Semua tabel master menggunakan `deleted_at`.
*   **Append-Only Segments:** Log aktivitas dan pergerakan stok tidak pernah di-update, hanya ditambah.
