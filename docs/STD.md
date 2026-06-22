# Software Testing Document (STD) - InsightSphere

**Version:** 3.0.0  
**Project:** InsightSphere Enterprise POS  
**Lead QA:** QA Automation Lead  
**Status:** Under Implementation

---

## 1. Introduction
Dokumen ini mendefinisikan strategi pengujian komprehensif untuk proyek InsightSphere. Mengingat sistem ini mengelola data transaksi dan kecerdasan buatan secara end-to-end, pengujian difokuskan pada integritas data, ketahanan sistem (*resilience*), dan akurasi model prediktif.

## 2. Test Environment
*   **Backend:** FastAPI (Python 3.10)
*   **Database:** PostgreSQL 15, Redis (Cache/Broker)
*   **Workers:** Celery 5.x
*   **Frontend:** Next.js 14
*   **Tools:** Pytest (Unit/Intro), Playwright (E2E), Postman (API)

---

## 3. Comprehensive Test Case Matrix (20+ Scenarios)

| Test ID | Kategori | Skenario | Pre-condition | Langkah Pengujian | Expected Result |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **TS-01** | **Auth** | Login dengan kredensial valid | User sudah terdaftar | Input username & password benar | Token JWT dikembalikan (200 OK) |
| **TS-02** | **Auth** | Akses endpoint tanpa token | Endpoint terproteksi | Request GET/POST tanpa header Auth | Error 401 Unauthorized |
| **TS-03** | **Auth** | Penggunaan token expired | Token sudah melewati masa berlaku | Request menggunakan token lama | Error 401 Unauthorized |
| **TS-04** | **Inv** | Tambah produk dengan SKU duplikat | SKU "PROD-1" sudah ada | Submit produk baru dengan SKU "PROD-1" | Error 400 Bad Request / SKU Conflict |
| **TS-05** | **Inv** | Input produk dengan harga negatif | - | Submit produk harga -5000 | Error 422 Unprocessable Entity (Pydantic) |
| **TS-06** | **Inv** | Soft delete produk | Produk aktif tersedia | Trigger DELETE /inventory/products/{id} | `deleted_at` terisi, data tidak muncul di list publik |
| **TS-07** | **Inv** | Update stok dengan kuantitas non-integer | - | Submit kuantitas produk "2.5" | Error 422 (Validasi tipe data) |
| **TS-08** | **Sales** | Transaksi POS tunggal secara real-time | Stok tersedia cukup | Submit transaksi POS | Stok berkurang otomatis & invoice dibuat |
| **TS-09** | **Sales** | **Idempotency Key Check** | Request transaksi pertama sukses | Kirim request ulang dengan `client_txn_id` yang sama | Server mengembalikan data transaksi lama (200 OK), tidak membuat record baru |
| **TS-10** | **Sales** | Transaksi saat stok kosong | `current_stock` = 0 | Submit transaksi produk tersebut | Error 400 Insufficient Stock |
| **TS-11** | **Sales** | PWA Batch Sync (Offline Mode) | Ada 10 transaksi tertunda di PWA | Submit /transactions/batch dengan 10 item | Semua 10 transaksi terdaftar di DB pusat |
| **TS-12** | **Neg** | **PostgreSQL Connection Timeout** | DB beban tinggi / Down | Lakukan transaksi saat koneksi DB diputus sementara | Sistem melempar 503 Service Unavailable, transaksi masuk antrian retry/log |
| **TS-13** | **Neg** | **Celery Worker Crash** | Proses Training XGBoost berjalan | Matikan process Celery manual saat training 50% | Job ditandai FAILED di ETL Log, data mentah aman di DB, sistem tidak crash |
| **TS-14** | **Neg** | Redis Broker Down | Celery mengandalkan Redis | Kirim tugas asinkron saat Redis mati | Backend memberikan respons error graceful, tidak membekukan process API |
| **TS-15** | **Neg** | Invalid Header Scope | Header `X-Branch-ID` salah format | Kirim request dengan `X-Branch-ID: invalid-uuid` | Error 422 (Validasi UUID) |
| **TS-16** | **AI** | Verifikasi Forecast Horizon | Horizon 7, 14, 21, 28 hari | Request forecast parameter `horizon=45` | Error 422 (Constraint: out of permitted range) |
| **TS-17** | **AI** | **XAI Narrative Accuracy** | Data SHAP tersedia | Cek narasi di UI dashboard | Pesan teks sesuai dengan nilai kontributor (misal: "Trend naik" jika impact pos) |
| **TS-18** | **AI** | Inkonsistensi data input ML | Ada data NULL di kolom fitur | Jalankan pipeline ETL | Baris bermasalah masuk ke **Dead Letter Queue (DLQ)** |
| **TS-19** | **UI** | Responsi Dashboard Next.js | Layar Mobile (360px) | Buka grafik AI di smartphone | Grafik bersifat responsif, tidak terpotong (Layout Bento-Grid) |
| **TS-20** | **UI** | Render XAI Cards | Data XAI sedang loading | Pantau komponen InsightCard | Tampilan Skeleton / Loading Spinner muncul dengan rapi |

---

## 4. Advanced Negative Testing Strategy

### 4.1 Database Resilience
Jika PostgreSQL mengalami *timeout* melebihi 5 detik, FastAPI *middleware* akan menangkap `SQLAlchemyError` dan mengembalikan respons JSON standar agar frontend tidak *hang*. Transaksi kritis harus dibungkus dalam *Atomic Transaction* untuk mencegah *partial commit*.

### 4.2 Intelligence Pipeline Recovery
Jika *Celery worker* mati saat proses *training*, sistem akan mengandalkan model lama (`.joblib` versi sebelumnya) hingga proses *retraining* berhasil dijalankan ulang secara otomatis oleh *Celery Beat*.

## 5. Security & Idempotency Validation
*   **Double Order Prevention:** Validasi `client_txn_id` dilakukan di layer Service sebelum eksekusi SQL. Jika ID sudah ada, respons dikembalikan dari cache unik/index DB.
*   **JWT Integrity:** Uji coba manipulasi payload JWT (Signature tampering) harus menghasilkan penolakan instan oleh backend.

## 6. Manual Verification for AI Narrative
Lakukan "Logic Audit" secara berkala: Bandingkan *raw SHAP values* dari database dengan kalimat narasi yang muncul di UI untuk memastikan tidak ada kesalahan interpretasi bahasa oleh sistem.
