# InsightSphere — Product Requirements Document (Frontend)

> **Versi:** 1.0.0  
> **Terakhir Diperbarui:** 18 April 2026  
> **Status:** Draft — Menunggu Validasi Arsitek

---

## 1. ARSITEKTUR APLIKASI

### Tech Stack
| Teknologi | Versi | Peran |
|---|---|---|
| React | 18.3.1 | UI framework utama |
| React Router | 7.13 (Data Mode) | Client-side routing (`createBrowserRouter`) |
| Tailwind CSS | 4.1.12 | Utility-first CSS |
| Recharts | 2.15.2 | Charting (Line, Bar, Pie, Radar) |
| Lucide React | 0.487 | Icon library (100+ ikon) |
| Sonner | 2.0.3 | Toast notification |
| Radix UI | — | 20+ primitive (Dialog, Popover, Select, Tabs, dll.) |
| Vite | 6.3.5 | Build tool |
| Motion (Framer Motion) | 12.23 | Animation library |

### Struktur File
```
/src/app/
├── App.tsx              ← Entry point (I18nProvider + RouterProvider)
├── routes.tsx           ← Definisi 6 route
├── i18n.tsx             ← Sistem terjemahan 300+ key
├── components/
│   ├── Layout.tsx       ← Shell: Sidebar + Header + <Outlet/>
│   ├── Sidebar.tsx      ← Navigasi kiri
│   ├── Header.tsx       ← Header atas
│   ├── KPICards.tsx     ← 4 kartu metrik bisnis
│   ├── ForecastChart.tsx ← Chart prediksi vs aktual
│   ├── PredictionTable.tsx ← Tabel rekomendasi produk
│   ├── NotificationCenter.tsx ← Panel notifikasi real-time
│   ├── ExportShareModal.tsx ← Modal export WhatsApp/PDF/Email
│   ├── pages/
│   │   ├── RingkasanPage.tsx
│   │   ├── PrediksiStokPage.tsx
│   │   ├── XAIPage.tsx
│   │   ├── InventarisPage.tsx
│   │   ├── LaporanPage.tsx
│   │   └── PengaturanPage.tsx
│   └── ui/              ← 47 shadcn/ui components
/src/styles/
├── theme.css            ← CSS variables & design tokens
└── fonts.css            ← Font imports
```

---

## 2. LAYOUT & NAVIGASI

### Layout Utama (`Layout.tsx`)
- Flex horizontal full-screen: **Sidebar** (kiri) + **Content area** (kanan)
- Content area: Header (fixed 64px) + Main (`scrollable`, padding 24px)
- Background: `bg-slate-50`
- Font: **Inter**

### Sidebar (`Sidebar.tsx`)
- Lebar: **252px** (expanded) ↔ **72px** (collapsed) — animasi 300ms
- Warna: `bg-slate-900` (navy gelap)
- Logo: Kotak hijau emerald + ikon `Boxes` + teks "SmartStock"
- **6 Menu Navigasi:**

| Ikon | Label | Route |
|---|---|---|
| `LayoutDashboard` | Ringkasan | `/` |
| `BrainCircuit` | Prediksi Stok | `/prediksi-stok` |
| `Lightbulb` | Penjelasan AI | `/penjelasan-ai` |
| `Package` | Inventaris | `/inventaris` |
| `BarChart3` | Laporan | `/laporan` |
| `Settings` | Pengaturan | `/pengaturan` |

- **Active state:** `bg-slate-700/60 text-white`
- **Hover state:** `text-slate-200 bg-slate-800`
- Collapse toggle: tombol chevron di bagian bawah
- Menggunakan `NavLink` (exact match `/`, prefix match lainnya)
- Semua label diterjemahkan via `t(key)`

### Header (`Header.tsx`)
- Tinggi: 64px, background putih, border bawah
- **Kiri:** Breadcrumb → "SmartStock > [Nama Halaman Aktif]" — dinamis via `location.pathname`
- **Kanan (5 elemen):**
  1. **Global Search** — Input + ikon search, placeholder "Cari produk, kategori..."
  2. **Store Selector** — Dropdown 5 opsi:
     - Semua Cabang
     - Cabang #1 — Pusat Kota
     - Cabang #2 — Barat
     - Cabang #3 — Bandara
     - Cabang #4 — Mall Sentral
     - Close otomatis saat klik luar (`useRef` + `mousedown`)
     - Item aktif berwarna emerald
  3. **Language Toggle** — Globe + "ID"/"EN", klik untuk toggle
  4. **Notification Center** — Ikon bell (lihat Bagian 9)
  5. **User Profile** — Avatar lingkaran + ikon `User` + "Admin"
- `Toaster` dari Sonner di-mount di sini (top-right)

---

## 3. HALAMAN 1: RINGKASAN (`/`)

**File:** `RingkasanPage.tsx`

### Judul & Subtitle
- "Prediksi & Evaluasi Stok"
- Deskripsi: "Pantau kondisi stok, lihat prediksi permintaan, dan ambil keputusan restok dengan lebih percaya diri."

### 4 KPI Cards (`KPICards.tsx`)
Grid 4 kolom (responsive: 1→2→4):

| Metrik | Nilai | Ikon | Deskripsi | Tren | Badge |
|---|---|---|---|---|---|
| Akurasi Prediksi | 94.3% | `Target` | "Dari 100 prediksi, 94 mendekati kenyataan" | +1.2% dari minggu lalu | Baik (hijau) |
| Stok Aman | 78% | `ShieldCheck` | "78 dari 100 produk stoknya sudah sesuai" | +3% dari minggu lalu | Baik (hijau) |
| Perlu Restok | 12 Item | `AlertTriangle` | "12 produk stoknya akan habis dalam 3 hari" | -2 item dari minggu lalu | Perhatian (amber) |
| Potensi Hemat | Rp 14.2 Jt | `PackageCheck` | "Estimasi penghematan dari mengurangi overstock" | +Rp 2.1 Jt dari bulan lalu | Baik (hijau) |

- Setiap kartu: hover shadow effect

### Forecast Chart (`ForecastChart.tsx`)
- Judul: "Perbandingan: Penjualan Aktual vs Prediksi"
- Penjelasan visual: "Garis ungu = penjualan nyata, garis hijau putus-putus = prediksi sistem."
- **4 Tab:** 7 Hari | 1 Bulan | 3 Bulan | Tahun Ini (default: 1 Bulan)
- **LineChart (Recharts):**
  - Line ungu solid (`#6366f1`) = Penjualan Aktual
  - Line hijau dashed (`#10b981`) = Prediksi Permintaan
  - Grid abu-abu, sumbu tanpa garis
- **Custom Tooltip:** label hari, kedua nilai, selisih (amber jika >100, emerald jika ≤100) + pesan "perlu perhatian"
- Data di-generate deterministik via `sin/cos`
- Label hari berubah via bahasa (`Sen/Sel` vs `Mon/Tue`)

### Prediction Table (`PredictionTable.tsx`)
- Judul: "Daftar Produk & Rekomendasi Aksi" + badge merah "5 perlu restok"
- **4 Filter:** Semua | Segera Restok | Stok Aman | Kelebihan Stok
- **Search:** Input pencarian produk
- **6 Kolom Tabel:**

| Kolom | Detail |
|---|---|
| Produk | Nama + SKU ID |
| Kategori | — |
| Stok Saat Ini | Progress bar (merah <50%, amber <80%, emerald ≥80%) |
| Prediksi Permintaan | Angka + "unit" |
| Sisa Hari Stok | Merah + ⚠️ jika ≤2 hari, amber ≤5, normal >5 |
| Rekomendasi | Badge: rose "Segera Restok", emerald "Stok Aman", amber "Kelebihan Stok" |

- **12 Produk Mock Data** — Beras Premium 5kg, Teh Botol Sosro, Indomie Goreng, dll.
- Pagination: 6 item/halaman, prev/next + nomor halaman
- Baris kritis: background rose tipis
- Empty state: ikon search + pesan

---

## 4. HALAMAN 2: PREDIKSI STOK (`/prediksi-stok`)

**File:** `PrediksiStokPage.tsx`

### Header
- Tombol "Info Model" — toggle panel info
- Tombol "Perbarui Prediksi" (hijau emerald)

### Model Info Panel (collapsible)
- Model: **XGBoost v3.2**
- Akurasi: 94.3%
- Data: 128,450 data points
- Terakhir diperbarui: 14 Apr 2026
- Pembaruan berikutnya: 21 Apr 2026
- Penjelasan bisnis tentang metodologi

### Alert Banner (rose)
- "5 produk diprediksi akan kehabisan stok dalam 3 hari"
- Tombol "Lihat Detail"

### 2 Chart Side-by-Side (grid 3:2)
**Chart Kiri — Prediksi Permintaan Mingguan:**
- LineChart, 3 garis: prediksi (indigo), batasAtas (abu dashed), batasBawah (abu dashed)
- 7 data points (Senin–Minggu), pola demand naik di akhir pekan

**Chart Kanan — Permintaan per Kategori:**
- Horizontal BarChart, 8 kategori (Sembako, Minuman, Snack, Dairy, Frozen, Bakery, Buah, Daging)
- 2 bar: Minggu Ini (abu) vs Minggu Depan (indigo)

### Tabel Detail per Produk
- Filter kategori: Semua + 5 kategori
- Toggle horizon: 7 Hari | 14 Hari
- **6 Kolom:** Produk, Stok, Forecast (deficit merah), Kepercayaan (progress bar), Tren (badge), Prioritas (badge + ikon)
- 8 Produk dengan data berbeda per horizon

---

## 5. HALAMAN 3: PENJELASAN AI / XAI (`/penjelasan-ai`)

**File:** `XAIPage.tsx` — *Halaman paling kompleks*

### Header
- Ikon gradient indigo-to-purple
- "Penjelasan AI — Pahami mengapa sistem memberikan rekomendasi tertentu."

### Banner "Cara Membaca"
- Background gradient indigo-to-purple
- Pilih produk → lihat faktor → simulasi "Bagaimana Jika" → bandingkan

### Product Selector Dropdown
- 3 produk: Beras Premium 5kg, Chitato Original 68g, Susu Ultra 1L
- Setiap item: SKU, stok, badge aksi

### 4 Tab Navigasi
1. **Penjelasan** (`Eye`)
2. **Simulasi** (`SlidersHorizontal`)
3. **Perbandingan** (`GitCompare`)
4. **Insight Global** (`Lightbulb`)

#### Tab "Penjelasan"
- **AI Summary Card:** Ringkasan bahasa manusia + badge kepercayaan (92%) + tombol "Bagikan"
- **Metrics bar:** Stok Saat Ini → Prediksi 7 Hari → Keputusan
- **Factor Importance (Bar horizontal + gradient):**
  - *Beras:* Pola Gajian 40%, Musim Hujan 25%, Tren 2 Minggu 20%, Stok Kompetitor 10%, Harga Stabil 5%
  - *Chitato:* Weekend Panjang 35%, Promo Bundling 30%, Tren Musiman 20%, Lokasi Cabang 10%, Persaingan Harga 5%
  - *Susu:* Overstock dari Pembelian Besar 45%, Tren Stabil 25%, Mendekati Kadaluarsa 20%, Musim Tidak Berpengaruh 10%
- **Akurasi Historis:** 3 kartu grid (94% + 2 produk sejenis)
- **Feedback:** ThumbsUp / ThumbsDown

#### Tab "Simulasi" (What-If)
- 3 Toggle: Promo Aktif (+ slider diskon 1-50%), Cuaca Berubah, Kompetitor Restock
- Kalkulasi real-time: adjustedDemand, Prediksi Awal → Disesuaikan + delta
- Status: "Stok CUKUP" (emerald) / "Stok TIDAK CUKUP" (rose)
- Tabel Skenario Pre-built

#### Tab "Perbandingan"
- Radar Chart — profil faktor pengaruh
- Horizontal Bar — Prediksi vs Kenyataan untuk produk serupa

#### Tab "Insight Global"
4 Insight Cards:
- Pola: "Pola Akhir Bulan Terdeteksi" (confidence 96%)
- Anomali: "Snack Naik Diluar Kebiasaan" (confidence 82%)
- Risiko: "3 Produk Dairy mendekati kadaluarsa" (confidence 91%)
- Peluang: "Bundling Beras + Minyak Goreng" (confidence 88%)

---

## 6. HALAMAN 4: INVENTARIS (`/inventaris`)

**File:** `InventarisPage.tsx`

### Header
- 3 Tombol: Import, Export, Tambah Produk (emerald)

### 5 Summary Cards (grid 5 kolom)
| Metrik | Warna |
|---|---|
| Total Produk: 12 | Slate |
| Stok Aman: 4 | Emerald |
| Stok Menipis: 2 | Amber |
| Kritis: 3 | Rose |
| Nilai Inventaris: Rp XX.X Jt | Indigo |

### Tabel Inventaris
- **5 Filter:** Semua | Aman (4) | Menipis (2) | Kritis (3) | Kelebihan (3)
- Search: nama, SKU, kategori
- **9 Kolom:** Produk, SKU (mono), Lokasi, Stok (bar), Min/Max, Supplier, Terakhir Restok, Status (badge), Aksi (mata)
- 12 Produk + supplier nyata
- Pagination: 8 item/halaman

### Detail Slide Panel
- Drawer kanan (max-width 448px) + overlay gelap
- 8 field detail + Stock Level Bar (marker minStock merah)
- 2 Tombol: "Pesan Restok" (emerald) + "Edit"

---

## 7. HALAMAN 5: LAPORAN (`/laporan`)

**File:** `LaporanPage.tsx`

### Header
- Period selector: Minggu Ini | Bulan Ini | 3 Bulan | Tahun Ini
- Tombol "Unduh PDF" (emerald)

### 4 Tab

#### Tab "Ringkasan"
- 4 KPI: Total Penjualan (Rp 177.5 Jt, +14.2%), Item Terjual (14,950), Produk Terbuang (28, -46%), Akurasi (94.3%)
- Bar Chart: Tren Penjualan Bulanan (Jan–Apr), Penjualan (indigo) vs Target (abu)
- Pie/Donut: Kontribusi Kategori (6 kategori)
- Top 5 Produk Terlaris

#### Tab "Penjualan"
- Line Chart: Detail Penjualan Harian (17 data points, sin function)

#### Tab "Inventaris"
- Bar Chart: Pemborosan/Wastage (Jan-Apr, rose bars)
- Tabel Riwayat Restok: 5 records (Diterima ✓ / Dalam Perjalanan 🚚 / Menunggu ⏳)

#### Tab "Unduh"
- 4 Template: Penjualan, Prediksi Stok, Laba Rugi, Pemborosan
- Laporan Otomatis: 3 jadwal (Mingguan, Alert Kritis, Bulanan) + toggle

---

## 8. HALAMAN 6: PENGATURAN (`/pengaturan`)

**File:** `PengaturanPage.tsx`

Layout: Sidebar navigasi kiri (264px) + Content kanan

### 6 Sub-halaman

#### Profil Saya
- Avatar + "Ganti Foto"
- 4 field: Nama, Email, Telepon, Jabatan
- Tombol "Simpan" + toast (auto-dismiss 2 detik)

#### Info Toko
- 4 field: Nama Usaha, Alamat, Telepon, Website
- Daftar 4 Cabang (aktif/nonaktif + jumlah produk)

#### Notifikasi
- **Jenis:** Alert Stok Kritis (ON), Hasil Prediksi Baru (ON), Laporan Otomatis (OFF)
- **Channel:** Email (ON), WhatsApp (OFF)

#### Pengaturan Prediksi
- Auto Retrain Toggle (mingguan)
- Minimum Confidence Slider: 50–99% (default 80%)
- Lead Time Restok Slider: 1–14 hari (default 3)
- Lead Time per Supplier (4 supplier)

#### Pengguna & Akses
- Tombol "Undang Pengguna"
- 4 User: Ahmad Surya (Pemilik), Dewi Lestari (Manajer), Budi Santoso (Gudang), Rina Wati (Kasir, nonaktif)
- Role badge + status badge

#### Keamanan
- Ganti Password (2 field)
- 2FA toggle
- Riwayat Login (3 records)

---

## 9. NOTIFICATION CENTER (`NotificationCenter.tsx`)

- Tombol Bell + badge counter (merah jika anomali)
- Animasi bounce + ping saat notifikasi baru
- Auto-generate anomali setelah 8 detik
- **Panel Dropdown (440px):**
  - Header: "Notifikasi" + badge + toggle suara + "Tandai semua dibaca"
  - **Filter:** Semua | Belum Dibaca | Anomali | Kritis
  - **7 + 1 Notifikasi:**
    - 🟡 Anomali: Chitato naik 45% (5m)
    - 🔴 Kritis: 3 Produk Butuh Restok (12m)
    - 🔵 Prediksi: Model diperbarui 93.1→94.3% (1h)
    - 💡 Peluang: Bundling Beras+Minyak (2h)
    - 🟡 Anomali: Model Drift Dairy (3h)
    - ⚙️ Sistem: Laporan Mingguan Siap (5h)
    - 🔴 Kritis: Overstock Susu mendekati kadaluarsa (6h)
  - Setiap notifikasi: 4 aksi (Share, Navigate, Tandai dibaca, Hapus)
  - Footer: "Atur Notifikasi" + "Anomali dicek setiap 5 menit"

---

## 10. EXPORT/SHARE MODAL (`ExportShareModal.tsx`)

Modal overlay + backdrop blur:

### 3 Tab

#### WhatsApp
- 5 Penerima (Tim Gudang, Manajer Cabang 1–2, Tim Purchasing, Semua Manajer)
- Catatan tambahan + Preview pesan (styled WhatsApp bubble)
- Tombol "Kirim via WhatsApp" → `wa.me`

#### PDF / Cetak
- Daftar isi dokumen (5 item)
- 2 Opsi: "Cetak / Save as PDF" (`window.print()`) | "Unduh File Teks" (`.txt` via Blob)

#### Email
- Field: Penerima, Subjek, Pesan
- Banner amber: "Hubungkan SMTP server di Pengaturan"

### Footer
- "Salin Teks" (clipboard) + "Batal" + tombol aksi utama

---

## 11. SISTEM i18n (`i18n.tsx`)

- React Context + Provider pattern
- State disimpan di `localStorage` key `"smartstock-lang"`
- Default: `"id"` (Indonesia)
- Hook `useTranslation()` → `{ lang, setLang, t }`
- `t(key)` → lookup → fallback ke key
- **Coverage:** 300+ keys (Sidebar, Header, KPI, semua halaman)

---

## 12. DESIGN SYSTEM

### Palet Warna Semantik
| Warna | Hex/Class | Penggunaan |
|---|---|---|
| Slate 900 | `#0f172a` | Sidebar, teks utama |
| Slate 50 | `#f8fafc` | Background canvas |
| White | `#ffffff` | Card, header, tabel |
| Emerald 500/600 | `#10b981` | Positif: stok aman, CTA |
| Rose 500/600 | `#f43f5e` | Negatif: kritis, anomali |
| Amber 400/600 | `#f59e0b` | Warning: menipis |
| Indigo 500/600 | `#6366f1` | Brand/AI: chart, prediksi |
| Blue 400 | `#60a5fa` | Info: overstock, transit |

### Tipografi
- Font: **Inter** (Google Fonts)
- Body: 16px, secondary 13px, labels 12px
- Monospace: `tabular-nums` untuk angka dan SKU

### Komponen Patterns
- **Cards:** `rounded-xl border border-slate-200 p-5/p-6 + hover:shadow-md`
- **Badges:** `px-2.5 py-1 rounded-full border text-xs font-medium`
- **Buttons:** `px-4 py-2.5 rounded-lg transition-colors`
- **Tables:** Full-width, header uppercase 12px, row hover
- **Progress Bars:** `h-2 bg-slate-100 rounded-full`
- **Inputs:** `bg-slate-50 border rounded-lg focus:ring-2 focus:ring-emerald-500/30`
- **47 shadcn/ui components** tersedia

---

## 13. ALUR NAVIGASI

```
┌─────────────────────────────────────────────────────────────┐
│ SIDEBAR                  │ HEADER                           │
│                          │ Breadcrumb | Search | Store |    │
│ ● Ringkasan ──────────► │ Lang | 🔔 Notif | 👤 Profile     │
│ ○ Prediksi Stok          ├──────────────────────────────────│
│ ○ Penjelasan AI          │                                  │
│ ○ Inventaris             │  CONTENT AREA                    │
│ ○ Laporan                │  (scrollable, Outlet)            │
│ ○ Pengaturan             │                                  │
│                          │                                  │
│ [◄ Collapse]             │                                  │
└─────────────────────────────────────────────────────────────┘
```

### Cross-Navigation Links
- Notifikasi → `/penjelasan-ai`, `/inventaris`, `/prediksi-stok`, `/laporan`, `/pengaturan`
- Share button → `ExportShareModal`

### State Management
- Semua state lokal per komponen (`useState`)
- Bahasa via React Context (`I18nProvider`)
- Router via React Router (`useLocation`, `useNavigate`)
- Tidak ada global state manager

---

## 14. DATA MOCK

- **12 Produk:** Beras Premium 5kg, Teh Botol Sosro, Indomie Goreng, Chitato, Aqua, dll.
- **8 Kategori:** Sembako, Minuman, Snack, Dairy, Frozen, Bakery, Buah, Daging
- **Supplier:** PT Beras Nusantara, PT Sinar Sosro, PT Ultra Jaya, PT Indofood, dll.
- **Lokasi:** Rak A1, Rak B3, Freezer F1, dll.
- **Mata uang:** Rupiah (Rp), format "Jt" untuk jutaan
- **Tanggal:** April 2026

---

## 15. FITUR TERSEMBUNYI

- ✅ Chart tooltip cerdas (selisih + peringatan otomatis)
- ✅ Animasi bounce + ping pada bell notifikasi
- ✅ Auto-generate notifikasi baru setelah 8 detik
- ✅ Print template profesional (CSS lengkap)
- ✅ WhatsApp message formatting (`*bold*`, `_italic_`, emoji)
- ✅ Highlight produk kritis (background merah tipis)
- ✅ Progress bar dinamis (rasio stok/demand)
- ✅ Empty state informatif
- ✅ Outside-click handler untuk dropdown/panel
- ✅ Slider interaktif (confidence, lead time)
- ✅ Radar chart (visualisasi faktor AI)
