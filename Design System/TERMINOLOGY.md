# 📖 InsightSphere Terminology Glossary

> **Single source of truth untuk terminologi domain + role + bisnis fotokopian.**
> Versi: 1.0 — 23 April 2026
> Companion: `CONTENT.md` (voice & tone), `I18N.md` (translation mapping)

---

## 1. Overview

Terminologi yang konsisten = pengalaman user yang predictable + translation yang akurat + onboarding yang cepat.

**Audit current codebase:**
- "Transaksi" 45×, "Produk" 78×, "Stok" 154×, "Kasir" 63×, "Owner" 63×, "Shift" 37×, "Pelanggan" 11×
- Backend RBAC: 4 roles (`owner`, `admin`, `inventory_manager`, `cashier`)
- Domain: POS fotokopian dengan AI forecasting

Dokumen ini menetapkan **istilah resmi** untuk setiap konsep, dan **istilah yang dilarang** (sinonim yang harus dihindari).

---

## 2. Role Terminology

### 2.1 Canonical Names

| Role (Code) | Display Name (ID) | Display Name (EN) | Deskripsi |
|---|---|---|---|
| `owner` | **Pemilik** | Owner | Pemilik bisnis, akses penuh ke semua data keuangan + strategis |
| `admin` | **Admin** | Admin | Tangan kanan owner — manage user, transaksi, tidak akses MLOps |
| `inventory_manager` | **Manajer Inventaris** | Inventory Manager | Fokus ke stok — tidak akses keuangan detail |
| `cashier` | **Kasir** | Cashier | Operator POS — checkout transaksi, basic inventory view |

### 2.2 Sinonim yang DILARANG

| ❌ Banned | ✅ Use Instead | Reason |
|---|---|---|
| "Karyawan" untuk `cashier` | "Kasir" | Specific role, bukan general employee |
| "Bos" untuk `owner` | "Pemilik" | Formal business context |
| "Manager" untuk `admin` | "Admin" | Avoid confusion dengan `inventory_manager` |
| "Stok Manajer" | "Manajer Inventaris" | Inventaris > Stok (cakupan lebih luas) |
| "Staff" generic | Specific role name | Clarity |
| "User" di UI display | Role name specific | "User" hanya di technical context |

### 2.3 Role Badge Mapping (per `data.ts`)

| Role | Badge Color | Display |
|---|---|---|
| `owner` | Indigo | "Pemilik" |
| `admin` | Rose | "Admin" |
| `inventory_manager` | Teal | "Inv. Manager" (compact) atau "Manajer Inventaris" (full) |
| `cashier` | Emerald | "Kasir" |

---

## 3. Domain Terminology (POS Fotokopian)

### 3.1 Transaction Concepts

| Canonical (ID) | EN | Deskripsi | ❌ Sinonim Banned |
|---|---|---|---|
| **Transaksi** | Transaction | Record penjualan/refund di POS | Order, Sale, Pesanan |
| **Item Transaksi** | Transaction Item | Baris produk dalam satu transaksi | Line, Baris, Entry |
| **Checkout** | Checkout | Proses finalisasi transaksi di POS | Bayar, Complete |
| **Pembayaran** | Payment | Metode/proses bayar | Bayar, Settlement |
| **Pengembalian** / **Refund** | Refund | Transaksi pengembalian uang | Retur, Return |
| **Batal Transaksi** | Void | Pembatalan transaksi sebelum final | Cancel, Tutup |
| **Struk** | Receipt | Bukti fisik/digital transaksi | Nota, Kuitansi |
| **Nomor Transaksi** | Transaction ID | Unique identifier (TXN-...) | Order number, ID |
| **Metode Bayar** | Payment Method | Tunai/QRIS/Kartu/Transfer | Cara bayar |

### 3.2 Product Concepts

| Canonical (ID) | EN | Deskripsi | ❌ Banned |
|---|---|---|---|
| **Produk** | Product | Item yang bisa dijual | Item, Barang, Goods |
| **SKU** | SKU | Stock Keeping Unit (kode unik produk) | Kode, Code |
| **Kategori** | Category | Grouping produk (Cetak, Print, Laminasi, dst) | Jenis, Type |
| **Harga Jual** | Selling Price | Harga ke customer | Price, Harga |
| **Harga Modal / HPP** | Cost Price | Harga beli dari supplier | Cost, Modal |
| **Margin** | Margin | Harga Jual - HPP | Profit, Untung |
| **Qty / Jumlah** | Quantity | Jumlah unit | Count, Amount |
| **Unit / Satuan** | Unit | Pcs, Lembar, Kg, Roll, dst | — |
| **Min Qty** | Minimum Quantity | Jumlah minimum pembelian (cetak foto min 5) | Min Order |
| **Custom Price** | Custom Price | Harga diskresi (Print HQ, Jasa Edit) | Special price |
| **Produk Custom** | Custom Product | Produk yang harga ditentukan saat checkout | — |

### 3.3 Inventory / Stok Concepts

| Canonical (ID) | EN | Deskripsi | ❌ Banned |
|---|---|---|---|
| **Stok** | Stock / Inventory | Jumlah produk tersedia | Persediaan (formal, rarely used) |
| **Inventaris** | Inventory | Sistem + data keseluruhan stok | Gudang |
| **Restok** | Restock | Tambah stok (pembelian dari supplier) | Refill, Replenish |
| **Stok Opname** | Stock Take / Audit | Penghitungan stok fisik vs sistem | Audit, Count |
| **Mutasi Stok** | Stock Movement | History perubahan stok | Journal, Log |
| **Koreksi Stok** | Stock Adjustment | Manual correction | Fix, Adjust |
| **Stok Masuk** | Stock In | Penambahan (restok, return) | Inbound |
| **Stok Keluar** | Stock Out | Pengurangan (penjualan, rusak) | Outbound |
| **Transfer Stok** | Stock Transfer | Pindah antar cabang/gudang | Move |
| **Stok Rendah** | Low Stock | Di bawah threshold | Hampir habis |
| **Stok Habis** | Out of Stock | Zero stock | Kosong |
| **Stok Aman** | In Stock | Di atas threshold | Tersedia, Available |
| **Threshold** | Threshold | Batas alert low stock | Limit, Ambang |
| **Reorder Point** | Reorder Point | Level untuk trigger restok otomatis | — |

### 3.4 Cash Management

| Canonical (ID) | EN | Deskripsi | ❌ Banned |
|---|---|---|---|
| **Shift** | Shift | Periode kerja kasir (buka-tutup) | Sesi, Session |
| **Buka Shift** | Open Shift | Mulai shift dengan saldo awal | Start shift |
| **Tutup Shift** | Close Shift | Akhiri shift, rekonsiliasi kas | End shift, Close |
| **Saldo Awal** | Opening Balance | Uang kas saat buka shift | Initial cash |
| **Saldo Akhir** | Closing Balance | Uang kas saat tutup shift | Final cash |
| **Selisih Kas** | Cash Discrepancy | Expected vs actual cash | Difference |
| **Kas Kecil / Petty Cash** | Petty Cash | Dana kas kecil untuk pengeluaran operasional | Operational cash |
| **Pengeluaran** | Expense | Transaksi keluar (beli supplies, dll) | Outflow |
| **Pemasukan** | Income | Transaksi masuk (non-penjualan) | Inflow |
| **Top-Up Kas** | Cash Top-Up | Tambah uang ke laci kasir | Add cash |

### 3.5 Reporting & Analytics

| Canonical (ID) | EN | Deskripsi | ❌ Banned |
|---|---|---|---|
| **Laporan** | Report | Dokumen summary data | Report (English leak) |
| **Pendapatan** | Revenue | Total uang masuk dari penjualan | Income (ambiguous) |
| **Keuntungan / Laba** | Profit | Pendapatan - HPP - Biaya | Gain, Earning |
| **Margin Kotor** | Gross Margin | (Revenue - COGS) / Revenue | Net margin |
| **KPI** | KPI | Key Performance Indicator | Metrics |
| **Periode** | Period | Rentang waktu laporan | Time range |
| **Tren** | Trend | Direction of change (up/down) | Direction |
| **Prediksi** | Forecast | AI-generated future estimate | Prediction |
| **Rekomendasi AI** | AI Recommendation | AI-suggested action | AI Suggestion |

### 3.6 Customer / Supplier

| Canonical (ID) | EN | Deskripsi | ❌ Banned |
|---|---|---|---|
| **Pelanggan** | Customer | Pembeli | Customer (English), Pembeli (less formal) |
| **Pemasok / Supplier** | Supplier | Penyedia barang | Vendor |
| **Pelanggan Loyal** | Loyal Customer | Repeat buyer | VIP, Member |

### 3.7 Store / Branch

| Canonical (ID) | EN | Deskripsi | ❌ Banned |
|---|---|---|---|
| **Toko** | Store | Lokasi bisnis | Shop, Outlet |
| **Cabang** | Branch | Lokasi fisik (toko bisa multi-branch) | Location, Site |
| **Kasir (perangkat)** | POS Terminal | Fisik device POS | Register, Terminal |

---

## 4. UI Element Terminology (ID + EN)

| UI Element | ID | EN |
|---|---|---|
| Dashboard | **Dasbor** atau **Dashboard** (both OK) | Dashboard |
| Navigation bar | **Menu Navigasi** | Navigation |
| Sidebar | **Sidebar** | Sidebar |
| Header | **Header** | Header |
| Tombol | **Tombol** | Button |
| Menu dropdown | **Menu** | Menu / Dropdown |
| Modal | **Dialog** | Modal / Dialog |
| Drawer | **Panel Samping** | Drawer / Panel |
| Form | **Formulir** | Form |
| Field / Input | **Kolom** atau **Input** | Field |
| Label | **Label** | Label |
| Placeholder | **Placeholder** atau **Contoh Isian** | Placeholder |
| Checkbox | **Kotak Centang** atau **Checkbox** | Checkbox |
| Radio button | **Pilihan** atau **Radio** | Radio |
| Toggle | **Saklar** | Toggle / Switch |
| Badge / Tag | **Label / Tag** | Badge / Tag |
| Card | **Kartu** | Card |
| Table | **Tabel** | Table |
| Row / Baris | **Baris** | Row |
| Column / Kolom | **Kolom** | Column |
| Search | **Cari** | Search |
| Filter | **Filter** | Filter |
| Sort | **Urutkan** | Sort |
| Pagination | **Halaman** (label), "Halaman 1 dari 5" | Pagination |
| Breadcrumb | **Navigasi** | Breadcrumb |
| Tab | **Tab** | Tab |
| Tooltip | **Tooltip** | Tooltip |
| Notification | **Notifikasi** | Notification |
| Toast | **Toast** atau **Pesan Cepat** | Toast |
| Alert banner | **Peringatan** atau **Notifikasi** | Alert |
| Skeleton | **Skeleton** atau **Pratinjau Muat** | Skeleton |
| Spinner | **Pemuat** (rare, prefer "Memuat...") | Spinner |

---

## 5. Action Verbs (Button Labels)

**Rule:** Indonesian verb + object noun untuk CTA.

### 5.1 CRUD Actions

| Action | ID | EN | Example Button |
|---|---|---|---|
| Create | **Tambah**, **Buat** | Add, Create | "Tambah Produk", "Buat Transaksi" |
| Read / View | **Lihat**, **Tampilkan** | View, Show | "Lihat Detail", "Tampilkan Semua" |
| Update / Edit | **Edit**, **Ubah** | Edit, Update | "Edit Produk", "Ubah Harga" |
| Delete | **Hapus** | Delete, Remove | "Hapus Produk" |
| Save | **Simpan** | Save | "Simpan Perubahan" |
| Cancel | **Batal** | Cancel | "Batal" |
| Confirm | **Konfirmasi** | Confirm | "Konfirmasi Pembayaran" |
| Submit | **Kirim**, **Submit** | Submit | "Kirim Laporan" |
| Reset | **Reset** (OK), **Atur Ulang** | Reset | "Reset Filter" |

### 5.2 Navigation

| Action | ID | EN |
|---|---|---|
| Back | **Kembali** | Back |
| Next | **Lanjut**, **Selanjutnya** | Next, Continue |
| Previous | **Sebelumnya** | Previous |
| Close | **Tutup** | Close |
| Open | **Buka** | Open |
| Go to | **Ke** (prefix), "Ke Dashboard" | Go to |

### 5.3 Business Actions

| Action | ID | EN | Context |
|---|---|---|---|
| Pay | **Bayar** | Pay | POS checkout |
| Refund | **Kembalikan Dana**, **Refund** | Refund | Transaction reversal |
| Void | **Batalkan Transaksi** | Void | Cancel before finalize |
| Restock | **Restok**, **Tambah Stok** | Restock | Inventory inbound |
| Export | **Unduh**, **Ekspor** | Export, Download | Report download |
| Import | **Impor**, **Upload** | Import | File upload |
| Print | **Cetak** | Print | Receipt, report |
| Sync | **Sinkronkan** | Sync | Offline→online data |
| Approve | **Setujui** | Approve | Workflow |
| Reject | **Tolak** | Reject | Workflow |
| Invite | **Undang** | Invite | User management |
| Assign | **Tetapkan** | Assign | Role assignment |

### 5.4 Auth Actions

| Action | ID | EN |
|---|---|---|
| Log in | **Masuk** | Log in / Sign in |
| Log out | **Keluar** | Log out / Sign out |
| Sign up | **Daftar** | Sign up |
| Register | **Daftar** | Register |
| Forgot password | **Lupa Password** | Forgot password |
| Reset password | **Atur Ulang Password** | Reset password |
| Change password | **Ubah Password** | Change password |
| Verify | **Verifikasi** | Verify |

---

## 6. Status / State Vocabulary

### 6.1 Transaction Status

| State | ID Label | EN Label | Badge |
|---|---|---|---|
| `pending` | **Menunggu** | Pending | warning |
| `processing` | **Diproses** | Processing | info |
| `completed` | **Selesai** | Completed | success |
| `cancelled` | **Dibatalkan** | Cancelled | neutral |
| `failed` | **Gagal** | Failed | destructive |
| `refunded` | **Dikembalikan** | Refunded | neutral |
| `partial_refund` | **Refund Sebagian** | Partial Refund | warning |

### 6.2 Product Status

| State | ID Label | EN Label | Badge |
|---|---|---|---|
| `active` | **Aktif** | Active | success |
| `inactive` | **Tidak Aktif** | Inactive | neutral |
| `draft` | **Draf** | Draft | neutral |
| `archived` | **Diarsipkan** | Archived | neutral |

### 6.3 Stock Status

| State | ID Label | EN Label | Badge |
|---|---|---|---|
| `in_stock` | **Tersedia** | In Stock | success |
| `low_stock` | **Stok Rendah** | Low Stock | warning |
| `out_of_stock` | **Habis** | Out of Stock | destructive |
| `discontinued` | **Tidak Dijual Lagi** | Discontinued | neutral |

### 6.4 User Status

| State | ID Label | EN Label | Badge |
|---|---|---|---|
| `active` | **Aktif** | Active | success |
| `invited` | **Diundang** | Invited | info |
| `inactive` | **Tidak Aktif** | Inactive | neutral |
| `suspended` | **Diblokir** | Suspended | destructive |

### 6.5 Shift Status

| State | ID Label | EN Label | Badge |
|---|---|---|---|
| `open` | **Buka** | Open | success |
| `closed` | **Tutup** | Closed | neutral |
| `reconciling` | **Rekonsiliasi** | Reconciling | info |

### 6.6 Sync Status (Offline POS)

| State | ID Label | EN Label | Badge |
|---|---|---|---|
| `synced` | **Tersinkron** | Synced | success |
| `pending_sync` | **Menunggu Sinkronisasi** | Pending Sync | warning |
| `sync_failed` | **Sinkronisasi Gagal** | Sync Failed | destructive |
| `offline` | **Offline** | Offline | warning |

---

## 7. Numerical Abbreviations (Indonesian)

| Number | ID | EN |
|---|---|---|
| 1.000 | **1 rb** | 1K |
| 10.000 | **10 rb** | 10K |
| 100.000 | **100 rb** | 100K |
| 1.000.000 | **1 jt** | 1M |
| 1.500.000 | **1,5 jt** | 1.5M |
| 1.000.000.000 | **1 M** | 1B |
| 1.500.000.000 | **1,5 M** | 1.5B |

**Note:** `M` di Indonesia = Milyar (10^9), di English = Million (10^6). **Jangan campur.** Pakai `rb`/`jt`/`M` untuk ID, `K`/`M`/`B` untuk EN.

---

## 8. Fotokopian-Specific Business Terms

Bisnis fotokopian punya vocabulary unik:

### 8.1 Produk Cetak

| Term | Deskripsi |
|---|---|
| **Cetak Foto** | Print photo dengan ukuran standar (2x3, 3x4, 4x6, 4R, 5R, 8R) |
| **Print** | Cetak dokumen (B&W / Warna) |
| **Fotokopi** | Duplikasi dokumen |
| **Print HQ** | Print kualitas tinggi (harga custom) |
| **Poster** | Print ukuran besar |
| **Stiker** | Print di media stiker |
| **Laminasi** | Lapis plastik dokumen (A4, F4, A3, custom) |
| **Jilid** | Menyatukan halaman (spiral, mika, hard cover) |

### 8.2 Jasa

| Term | Deskripsi |
|---|---|
| **Edit File** | Jasa editing dokumen (harga custom / gratis) |
| **Ketik** | Jasa mengetik dari tulisan tangan |
| **Desain** | Jasa desain grafis |
| **Scan** | Scan dokumen ke digital |

### 8.3 Bahan / Supplies

| Term | Deskripsi |
|---|---|
| **HVS** | Kertas putih standar (70/80gr, A4/F4) |
| **Glossy** | Kertas foto mengkilap |
| **Matte** | Kertas foto doff |
| **Tinta** | Ink untuk printer (warna/hitam) |
| **Toner** | Bubuk untuk laser printer |
| **Plastik Laminasi** | Plastik untuk laminasi |
| **Cover** | Cover jilid |

---

## 9. Acronyms & Abbreviations

| Acronym | Full Form (ID) | Context |
|---|---|---|
| **SKU** | Stock Keeping Unit | Product code |
| **POS** | Point of Sale | Kasir system |
| **KPI** | Key Performance Indicator | Metrics |
| **AI** | Artificial Intelligence / Kecerdasan Buatan | AI features |
| **PPN** | Pajak Pertambahan Nilai | Tax (11% Indonesia) |
| **HPP** | Harga Pokok Produksi | Cost of Goods Sold |
| **TXN** | Transaction | Prefix transaction ID |
| **RBAC** | Role-Based Access Control | Security (dev only) |
| **MLOps** | Machine Learning Operations | MLOps dashboard |
| **XAI** | Explainable AI | XAI page |
| **PIC** | Person In Charge | Shift responsibility |
| **UU PDP** | Undang-Undang Perlindungan Data Pribadi | Legal compliance |

**Rule:** Spell out on first mention if user-facing (non-technical page):
> "Point of Sale (POS) — sistem kasir digital"

---

## 10. Voice-Specific Phrases

### 10.1 Common Phrases (approved)

| Context | Phrase |
|---|---|
| Welcome | "Selamat datang di InsightSphere" |
| Thank you (after action) | "Transaksi berhasil disimpan" (action-focused, not generic thanks) |
| Greeting (time-aware) | "Selamat pagi/siang/sore/malam, [Nama]" |
| Encouragement | "Ayo mulai dengan transaksi pertama Anda" |
| Guidance | "Tip: Gunakan Ctrl+K untuk akses cepat" |
| Success celebration | "Selamat! Target bulan ini tercapai" (sparingly) |

### 10.2 Phrases to Avoid

| ❌ Avoid | Why | ✅ Replace With |
|---|---|---|
| "Silakan tunggu" | Passive | "Memuat data..." |
| "Terima kasih atas kesabaran Anda" | Over-formal, verbose | "Data siap • 2.5 detik" |
| "Data kamu" | Too casual for B2B | "Data Anda" |
| "Bro", "Gan" | Unprofessional | "Anda", "Bapak/Ibu" (if very formal) |
| "Please wait" | English leak | "Mohon tunggu" / "Memuat..." |
| "Cool!" | Meaningless | Specific success message |
| "Oops!" | Casual | "Terjadi kesalahan" |

---

## 11. Role Addressing

**InsightSphere default: formal (Anda).**

| Context | Addressing |
|---|---|
| General user messaging | **Anda** (formal, safe) |
| First-time onboarding | Mix of "Anda" + friendly tone |
| Error messages | Impersonal ("Terjadi kesalahan" tidak "Anda error") |
| Confirmation | "Lanjutkan?" tidak "Mau kamu lanjut?" |
| Help text | "Anda dapat..." tidak "Kamu bisa..." |

**Never:** kamu, lo, aku, gua, bro, gan, ente.

---

## 12. Time Context Phrases

| Phrase | Usage |
|---|---|
| "Baru saja" | < 1 menit |
| "5 menit lalu" | 1-59 menit |
| "1 jam lalu" | 1-23 jam |
| "Kemarin" | 1 day ago |
| "2 hari lalu" | 2-6 days |
| "Minggu lalu" | 7-13 days |
| "2 minggu lalu" | 14-27 days |
| "Bulan lalu" | 28 days - 2 months |
| "[Tanggal lengkap]" | > 2 months |

---

## 13. 🚫 Prohibited Terminology

| ❌ Don't Use | ✅ Use Instead | Context |
|---|---|---|
| "Order" | "Transaksi" atau "Pesanan" | POS context |
| "Item" (generic) | "Produk" atau specific noun | Always specific |
| "Customer" di ID UI | "Pelanggan" | Language consistency |
| "Vendor" | "Pemasok" | Indonesian preferred |
| "Void" (tanpa konteks) | "Batalkan Transaksi" | Clarity |
| "Sync" (ID context) | "Sinkronkan" | Indonesian verb |
| "Delete" (ID context) | "Hapus" | Indonesian verb |
| "Store" = "Toko" | **Consistent:** `Toko` | Don't mix "Store" + "Toko" |
| "Admin" untuk generic user | Specific role | Avoid confusion |
| "Submit" | "Kirim" atau "Simpan" | Context-specific |

---

## 14. Translation Key Convention (i18n)

Refer `I18N.md` untuk detail, tapi terminology di-lock pada keys berikut:

```
{
  "role.owner": "Pemilik",
  "role.admin": "Admin",
  "role.inventory_manager": "Manajer Inventaris",
  "role.cashier": "Kasir",

  "status.transaction.pending": "Menunggu",
  "status.transaction.completed": "Selesai",
  "status.transaction.failed": "Gagal",

  "action.save": "Simpan",
  "action.cancel": "Batal",
  "action.delete": "Hapus",
  ...
}
```

---

## 15. Migration Guide

### 15.1 Codebase Audit Findings

- **"Customer" occurrences** — check for English leaks, replace dengan "Pelanggan"
- **"Order" occurrences** — replace dengan "Transaksi"
- **Inconsistent role display** — verify role names pakai canonical per §2.1
- **"Admin" vs "Administrator"** — standardize to "Admin"
- **"Stock" vs "Stok"** — all ID UI pakai "Stok"

### 15.2 Search & Replace Checklist

- [ ] `"Customer"` in ID context → `"Pelanggan"`
- [ ] `"Order"` → `"Transaksi"` (where POS context)
- [ ] `"Item"` generic → specific noun (`"Produk"` / `"Transaksi"`)
- [ ] `"Vendor"` → `"Pemasok"`
- [ ] `"Karyawan"` untuk cashier → `"Kasir"`
- [ ] `"Bos"` → `"Pemilik"`
- [ ] `"Store"` vs `"Toko"` consistency
- [ ] `"Owner"` display → `"Pemilik"` (code stays `owner`)
- [ ] `"Shift"` vs `"Sesi"` consistency → `"Shift"`
- [ ] `"Refund"` vs `"Pengembalian"` → prefer `"Refund"` (recognized term)

### 15.3 Backend API Alignment

Backend RBAC role names tetap dalam English (code-level):
- `owner`, `admin`, `inventory_manager`, `cashier`

Frontend display wajib pakai ID labels via i18n mapping.

---

## 16. Future Enhancements

- [ ] Auto-generate TypeScript types dari glossary (role enum, status enum)
- [ ] Lint rule: detect banned terms di JSX strings
- [ ] Glossary → Figma shared library (sync dengan design)
- [ ] Translator onboarding doc (untuk multi-language expansion)
- [ ] Customer feedback terminology audit (what terms THEY use)
- [ ] Voice consistency score per-page

---

**Design review oleh:** faiz
**Implementasi spec:** 23 April 2026
