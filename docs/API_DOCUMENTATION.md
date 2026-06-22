# API Documentation - InsightSphere Enterprise

**Version:** 3.0.0  
**Base URL:** `https://api.insightsphere.com/api/v2`  
**Engineer:** Senior Backend Architect  
**Specification:** RESTful with FastAPI & OpenAPI Standard

---

## 1. Authentication & Security

Sistem menggunakan **JWT (JSON Web Token)** untuk autentikasi dan otorisasi. Token harus disertakan dalam header setiap request yang dilindungi.

### Authentication Scheme: Bearer Token
*   **Header Name:** `Authorization`
*   **Value Format:** `Bearer <JWT_TOKEN>`

### Scoping Header: Multi-Branch Architecture
Untuk mendukung arsitektur multi-cabang, sistem memerlukan header khusus untuk menginisialisasi konteks data pada beberapa endpoint (terutama Inventory & Sales).
*   **Header Name:** `X-Branch-ID`
*   **Value:** `UUID` (e.g., `550e8400-e29b-41d4-a716-446655440000`)
*   **Description:** Menentukan cabang mana yang sedang diakses oleh client. Jika tidak disertakan, sistem akan menggunakan *Default Branch* pengguna atau menghasilkan error jika hak akses tidak valid.

---

## 2. Global Error Responses

Semua endpoint mengikuti standar error response berikut.

### `422 Unprocessable Entity` (FastAPI/Pydantic Validation)
Terjadi ketika payload tidak memenuhi kontrak data.
*   **Contoh Response:**
    ```json
    {
      "detail": [
        {
          "loc": ["body", "items", 0, "quantity"],
          "msg": "field required",
          "type": "value_error.missing"
        },
        {
          "loc": ["body", "payment_method"],
          "msg": "value is not a valid enumeration member; permitted: 'tunai', 'qris', 'transfer'",
          "type": "type_error.enum"
        }
      ]
    }
    ```

### `401 Unauthorized`
Terjadi jika token tidak valid, expired, atau tidak disertakan.
```json
{ "detail": "Missing or invalid authentication token" }
```

### `403 Forbidden`
Terjadi jika pengguna tidak memiliki hak akses (Role) yang cukup untuk endpoint tersebut.
```json
{ "detail": "Insufficient permissions to perform this action" }
```

---

## 3. Core API Endpoints

### 3.1 Authentication Module

#### `POST /auth/login`
Mengautentikasi pengguna dan mengembalikan access token.
*   **Request Body:**
    ```json
    {
      "username": "owner_insight",
      "password": "securepassword123"
    }
    ```
*   **Success Response (200 OK):**
    ```json
    {
      "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "token_type": "bearer",
      "user": {
        "id": "uuid-001",
        "role": "owner",
        "name": "Jane Doe"
      }
    }
    ```

---

### 3.2 Inventory Module (Full CRUD)

#### `GET /inventory/products`
Mengambil daftar katalog produk dengan dukungan filtering.
*   **Query Params:** `family` (string), `search` (string), `limit` (int).
*   **Success Response (200 OK):**
    ```json
    [
      {
        "id": "prod-001",
        "sku": "SKU-BEV-001",
        "name": "Mineral Water 600ml",
        "family": "BEVERAGES",
        "base_price": 5000,
        "is_active": true
      }
    ]
    ```

#### `POST /inventory/products`
Menambah produk baru ke katalog pusat.
*   **Auth Required:** Role Admin/Owner.
*   **Request Body:**
    ```json
    {
      "sku": "SKU-GRO-002",
      "name": "Premium Thai Rice 5kg",
      "family": "GROCERY I",
      "base_price": 95000
    }
    ```
*   **Success Response (201 Created):** Objek produk yang baru dibuat.

#### `GET /inventory/products/{product_id}`
Mengambil detail satu produk.
*   **Success Response (200 OK):** Detail produk lengkap.

#### `PATCH /inventory/products/{product_id}`
Memperbarui informasi produk tertentu (Partial Update).
*   **Request Body:**
    ```json
    {
      "base_price": 98000,
      "is_active": false
    }
    ```
*   **Success Response (200 OK):** Objek produk terupdate.

#### `DELETE /inventory/products/{product_id}`
Menghapus produk (Soft Delete).
*   **Success Response (200 OK):** `{ "message": "Product successfully deactivated" }`

#### `GET /inventory/stock`
Melihat status stok real-time di cabang yang dipilih.
*   **Required Header:** `X-Branch-ID`
*   **Success Response (200 OK):**
    ```json
    [
      {
        "product_id": "prod-001",
        "current_stock": 42,
        "status": "SAFE"
      }
    ]
    ```

#### `POST /inventory/stock/movement`
Mencatat mutasi stok (Stok Masuk, Keluar, Rusak).
*   **Request Body:**
    ```json
    {
      "product_id": "prod-001",
      "type": "IN",
      "quantity": 100,
      "reason": "Restock from Central Warehouse"
    }
    ```
*   **Success Response (201 Created):** Log mutasi stok.

---

### 3.3 Sales & Transactions Module

#### `POST /transactions/`
Pencatatan transaksi POS tunggal secara real-time.
*   **Required Header:** `X-Branch-ID`
*   **Request Body:**
    ```json
    {
      "client_txn_id": "local-pos-001-abc",
      "items": [
        { "product_id": "prod-001", "quantity": 2, "price": 5000 }
      ],
      "payment_method": "tunai",
      "total_amount": 10000
    }
    ```
*   **Success Response (201 Created):** Struk transaksi terdaftar dangan `transaction_id` server.

#### `POST /transactions/batch`
Sinkronisasi transaksi massal dari PWA offline cache.
*   **Request Body:** `Array` dari objek `/transactions/`.
*   **Success Response (200 OK):** Ringkasan jumlah transaksi yang berhasil di-sync.

---

### 3.4 AI Analytics & Intelligence

#### `GET /api/analytics/forecast`
Mengambil prediksi kebutuhan stok untuk periode mendatang.
*   **Query Params:** `horizon` (7, 14, 21, 28 hari).
*   **Success Response (200 OK):**
    ```json
    {
      "horizon": 7,
      "predictions": [
        { "product_id": "prod-001", "forecast_qty": 150.5 }
      ]
    }
    ```

#### `GET /api/analytics/explain`
Mendapatkan narasi bisnis berbasis SHAP (XAI).
*   **Success Response (200 OK):**
    ```json
    {
      "narrative": "Penjualan meningkat sebesar 15% pada item Water dikarenakan faktor hari libur nasional dan tren musiman akhir pekan.",
      "contributors": [
        { "feature": "is_holiday", "impact": 0.12 },
        { "feature": "day_of_week", "impact": 0.03 }
      ]
    }
    ```
