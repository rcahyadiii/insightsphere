# Software Requirements Specification (SRS) - InsightSphere

**Version:** 1.0.0  
**Project:** InsightSphere (Smart POS & XAI)  
**Status:** Draft

---

## 1. Introduction
Dokumen ini merinci spesifikasi teknis dan fungsional untuk perangkat lunak InsightSphere. Fokus utama adalah pada integrasi sistem POS dengan modul kecerdasan buatan (Explainable AI) untuk mendukung operasional UMKM yang cerdas.

## 2. Product Perspective
InsightSphere adalah sistem ERP berbasis web dengan arsitektur **Client-Server**.
*   **Backend:** FastAPI (Python) yang mengelola domain bisnis dan MLOps pipeline.
*   **Frontend:** Next.js (React) yang menyajikan dashboard interaktif dan terminal kasir.
*   **Database:** PostgreSQL sebagai penyimpanan data persisten.
*   **Worker:** Celery/APScheduler untuk tugas latar belakang (batch training AI).

## 3. Functional Requirements

### 3.1 Domain: Identity & Access Management (IAM)
*   **FR-IAM-01:** Sistem harus mendukung pendaftaran pengguna dengan verifikasi email.
*   **FR-IAM-02:** Sistem harus mendukung login dengan Multi-Factor Authentication (MFA).
*   **FR-IAM-03:** Sistem harus mengimplementasikan Role-Based Access Control (RBAC) untuk Admin, Manajer, dan Kasir.

### 3.2 Domain: Sales & POS
*   **FR-SAL-01:** Kasir harus dapat membuka sesi (session) sebelum melakukan transaksi.
*   **FR-SAL-02:** Sistem harus mendukung pemindaian barcode produk (EAN-13/UPC).
*   **FR-SAL-03:** Sistem harus menghitung total harga, diskon, dan pajak secara otomatis.
*   **FR-SAL-04:** Sistem harus mencatat metode pembayaran (Tunai, QRIS, Kartu).

### 3.3 Domain: Inventory & Branch Management
*   **FR-INV-01:** Pengalokasian stok harus berbasis `branch_id`.
*   **FR-INV-02:** Sistem harus melakukan sinkronisasi stok secara real-time setelah transaksi berhasil.
*   **FR-INV-03:** Sistem harus mendukung modul inventarisasi (stock opname) manual dengan log perubahan.

### 3.4 Domain: Intelligence & XAI
*   **FR-INT-01:** Sistem harus menjalankan batch training harian menggunakan XGBoost untuk prediksi stok.
*   **FR-INT-02:** Dashboard harus menampilkan interpretasi model (SHAP values) dalam bahasa manusia.
*   **FR-INT-03:** Sistem harus menyediakan simulator "What-If" untuk memprediksi dampak perubahan harga.

## 4. Non-Functional Requirements

### 4.1 Performance (NFR-PERF)
*   **NFR-PERF-01:** API Endpoints harus merespon dalam < 200 milidetik (95th percentile).
*   **NFR-PERF-02:** Pengolahan narasi AI (Natural Language Generation) harus selesai dalam < 2 detik.

### 4.2 Security (NFR-SEC)
*   **NFR-SEC-01:** Semua password wajib di-hash menggunakan algoritma Bcrypt/Argon2.
*   **NFR-SEC-02:** Data sensitif dalam database harus dienkripsi at-rest.
*   **NFR-SEC-03:** Semua komunikasi data wajib menggunakan protokol HTTPS/TLS 1.3.

### 4.3 Reliability (NFR-REL)
*   **NFR-REL-01:** Mengimplementasikan *Idempotency Keys* pada API transaksi untuk mencegah duplikasi order.
*   **NFR-REL-02:** Data yang gagal diproses oleh ML pipeline harus masuk ke *Dead Letter Queue* (DLQ).

## 5. User Stories

| ID | User Story |
| :--- | :--- |
| **US-01** | **Sebagai Kasir**, saya ingin sistem merespons cepat saat scan barcode agar antrean pelanggan tidak menumpuk. |
| **US-02** | **Sebagai Pemilik**, saya ingin tahu *mengapa* produk tertentu laku keras (XAI) agar saya bisa memutuskan apakah harus menambah stok atau menaikkan harga. |
| **US-03** | **Sebagai Manajer**, saya ingin menerima notifikasi saat stok kritis agar saya bisa melakukan *ordering* ke supplier tepat waktu. |
| **US-04** | **Sebagai Admin**, saya ingin memantau kesehatan sistem dan database (Observability) untuk memastikan tidak ada kendala operasional cabang. |

## 6. System Constraints & Assumptions

### 6.1 Constraints (Batasan)
*   **Arsitektur:** Harus mengikuti pola Domain-Driven Design (DDD) sesuai struktur folder yang sudah ada.
*   **Bahasa:** Aplikasi harus mendukung Bilingual (Indonesia & Inggris) secara penuh (i18n).
*   **Soft Delete:** Tidak diperbolehkan melakukan *Hard Delete* pada data master (menggunakan `deleted_at`).

### 6.2 Assumptions (Asumsi)
*   Pengguna memiliki koneksi internet yang stabil (meskipun modul POS dirancang untuk mendukung operasional dasar saat offline).
*   Hardware kasir mendukung minimal resolusi layar 1024x768 (Optimasi Tablet/Desktop).
