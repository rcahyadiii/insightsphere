# Audit Hardcode Frontend

Saya sudah cek hardcode di `frontend/src/app/components` dengan kategori:

- **Text literal JSX**
- **Literal `Rp` / currency**
- **Hardcoded icon/size**
- **Hardcoded radius**
- **Hardcoded z-index**
- **Arbitrary Tailwind**
- **Raw CSS color / chart style**

## Ringkasan Temuan

| Kategori | App files | App hits | UI primitive hits | Catatan |
|---|---:|---:|---:|---|
| JSX text literal | 26 files | 86 | 6 | Banyak yang perlu i18n |
| `Rp` literal | 5 files | 6 | 0 | Masih ada prefix currency manual |
| Icon/size hardcode | 55 files | 696 | 128 | Banyak `w-4 h-4`, `size-*` bukan `ICON` token |
| Radius hardcode | 43 files | 405 | 40 | Banyak `rounded-xl`, `rounded-2xl`, dll belum token `R.*` |
| z-index hardcode | 29 files | 73 | 27 | Banyak `z-10`, `z-50`, dll belum `Z.*` |
| Arbitrary Tailwind | 41 files | 98 | 32 | `shadow-[...]`, `rounded-[...]`, `h-[...]`, dll |
| Raw CSS color | 5 files | 19 | 3 | `#hex`, `rgba`, `hsl()` inline |

> Catatan: angka ini termasuk skeleton/mock/demo UI. Jadi prioritas terbaik adalah fix dulu file user-facing utama.

# Temuan Prioritas Tinggi

## 1. Hardcoded i18n text

**File utama:**
- [pages/XAIPage.tsx](cci:7://file:///c:/Portfolio/InsightSphere/frontend/src/app/components/pages/XAIPage.tsx:0:0-0:0)
- [pages/UserProfilePage.tsx](cci:7://file:///c:/Portfolio/InsightSphere/frontend/src/app/components/pages/UserProfilePage.tsx:0:0-0:0)
- [pos/PaymentModal.tsx](cci:7://file:///c:/Portfolio/InsightSphere/frontend/src/app/components/pos/PaymentModal.tsx:0:0-0:0)
- [settings/ProfileSettingsPanel.tsx](cci:7://file:///c:/Portfolio/InsightSphere/frontend/src/app/components/settings/ProfileSettingsPanel.tsx:0:0-0:0)
- [settings/LogoutSettingsPanel.tsx](cci:7://file:///c:/Portfolio/InsightSphere/frontend/src/app/components/settings/LogoutSettingsPanel.tsx:0:0-0:0)
- [settings/AccessSettingsPanel.tsx](cci:7://file:///c:/Portfolio/InsightSphere/frontend/src/app/components/settings/AccessSettingsPanel.tsx:0:0-0:0)
- [inventory/StockTransferModal.tsx](cci:7://file:///c:/Portfolio/InsightSphere/frontend/src/app/components/inventory/StockTransferModal.tsx:0:0-0:0)
- [inventory/StockOpnameModal.tsx](cci:7://file:///c:/Portfolio/InsightSphere/frontend/src/app/components/inventory/StockOpnameModal.tsx:0:0-0:0)

**Contoh:**
- [XAIPage.tsx](cci:7://file:///c:/Portfolio/InsightSphere/frontend/src/app/components/pages/XAIPage.tsx:0:0-0:0)
  - `AI Summary`
  - `Keyakinan AI: Sangat Tinggi / Tinggi / Sedang`
  - `Dampak kampanye diskon.`
  - `Level Diskon`
  - `Analisis Dampak`

- [UserProfilePage.tsx](cci:7://file:///c:/Portfolio/InsightSphere/frontend/src/app/components/pages/UserProfilePage.tsx:0:0-0:0)
  - `Keluar`
  - `Mode tampilan ringkas`
  - `JPG, PNG, WebP · maks. 2 MB`
  - `Hapus foto`
  - `Menyimpan...`

- [settings/ProfileSettingsPanel.tsx](cci:7://file:///c:/Portfolio/InsightSphere/frontend/src/app/components/settings/ProfileSettingsPanel.tsx:0:0-0:0)
  - `Faiz Admin`
  - `Superuser Access • Jakarta HQ`

- [settings/LogoutSettingsPanel.tsx](cci:7://file:///c:/Portfolio/InsightSphere/frontend/src/app/components/settings/LogoutSettingsPanel.tsx:0:0-0:0)
  - `Baru saja`

- [settings/AccessSettingsPanel.tsx](cci:7://file:///c:/Portfolio/InsightSphere/frontend/src/app/components/settings/AccessSettingsPanel.tsx:0:0-0:0)
  - `Admin`
  - `Owner`
  - `Cashier`

**Rekomendasi:**
- Tambahkan key ke [i18n.tsx](cci:7://file:///c:/Portfolio/InsightSphere/frontend/src/app/i18n.tsx:0:0-0:0)
- Ganti literal JSX dengan [t("...")](cci:1://file:///c:/Portfolio/InsightSphere/frontend/src/app/i18n.tsx:2721:2-2737:4)
- Untuk role label seperti `Admin`, `Owner`, `Cashier`, bisa pakai helper role label atau i18n key.

# 2. Hardcoded `Rp`

**File:**
- [pos/PaymentModal.tsx](cci:7://file:///c:/Portfolio/InsightSphere/frontend/src/app/components/pos/PaymentModal.tsx:0:0-0:0)
- [pos/CartPanel.tsx](cci:7://file:///c:/Portfolio/InsightSphere/frontend/src/app/components/pos/CartPanel.tsx:0:0-0:0)
- [pages/KasirPage.tsx](cci:7://file:///c:/Portfolio/InsightSphere/frontend/src/app/components/pages/KasirPage.tsx:0:0-0:0)
- [pages/TransactionHistoryPage.tsx](cci:7://file:///c:/Portfolio/InsightSphere/frontend/src/app/components/pages/TransactionHistoryPage.tsx:0:0-0:0)

**Contoh:**
- [PaymentModal.tsx](cci:7://file:///c:/Portfolio/InsightSphere/frontend/src/app/components/pos/PaymentModal.tsx:0:0-0:0)
  - Prefix input manual: `Rp`
  - Receipt HTML hardcoded text `Tunai`, `Kembalian`, `Lunas`
- [CartPanel.tsx](cci:7://file:///c:/Portfolio/InsightSphere/frontend/src/app/components/pos/CartPanel.tsx:0:0-0:0)
  - Inline price editor prefix `Rp`
- [KasirPage.tsx](cci:7://file:///c:/Portfolio/InsightSphere/frontend/src/app/components/pages/KasirPage.tsx:0:0-0:0)
  - Custom price modal prefix `Rp`
- [TransactionHistoryPage.tsx](cci:7://file:///c:/Portfolio/InsightSphere/frontend/src/app/components/pages/TransactionHistoryPage.tsx:0:0-0:0)
  - CSV headers: `"Total (Rp)"`

**Rekomendasi:**
- Untuk display angka pakai `formatRupiah()`
- Untuk prefix input currency, buat token/helper seperti `CURRENCY.rupiahPrefix = "Rp"` atau key i18n `common.currency.rupiah`
- Untuk CSV header pakai [t()](cci:1://file:///c:/Portfolio/InsightSphere/frontend/src/app/i18n.tsx:2721:2-2737:4) atau header builder berbasis i18n.

# 3. POS receipt masih hardcoded HTML/text

**File:**
- [pos/PaymentModal.tsx](cci:7://file:///c:/Portfolio/InsightSphere/frontend/src/app/components/pos/PaymentModal.tsx:0:0-0:0)

**Contoh hardcoded:**
- `Struk InsightSphere`
- `Produk`
- `Qty`
- `Harga`
- `Sub`
- `TOTAL`
- `Tunai`
- `Kembalian`
- `Lunas`
- `Terima kasih atas kunjungan Anda!`
- Inline CSS dengan `#000`

**Rekomendasi:**
- Extract receipt builder ke helper:
  - `buildReceiptHtml({ t, transaction, summary })`
- Semua label receipt pakai [t()](cci:1://file:///c:/Portfolio/InsightSphere/frontend/src/app/i18n.tsx:2721:2-2737:4)
- Inline CSS receipt boleh tetap minimal, tapi warna bisa distandarkan sebagai constant khusus receipt print.

# 4. Hardcoded icon / size classes

**Jumlah besar:** 696 hits di app files.

**File paling banyak:**
- [Skeletons.tsx](cci:7://file:///c:/Portfolio/InsightSphere/frontend/src/app/components/Skeletons.tsx:0:0-0:0)
- [pages/KasirPage.tsx](cci:7://file:///c:/Portfolio/InsightSphere/frontend/src/app/components/pages/KasirPage.tsx:0:0-0:0)
- [pos/CartPanel.tsx](cci:7://file:///c:/Portfolio/InsightSphere/frontend/src/app/components/pos/CartPanel.tsx:0:0-0:0)
- [settings/SecuritySettingsPanel.tsx](cci:7://file:///c:/Portfolio/InsightSphere/frontend/src/app/components/settings/SecuritySettingsPanel.tsx:0:0-0:0)
- [ExportShareModal.tsx](cci:7://file:///c:/Portfolio/InsightSphere/frontend/src/app/components/ExportShareModal.tsx:0:0-0:0)
- [pages/UserProfilePage.tsx](cci:7://file:///c:/Portfolio/InsightSphere/frontend/src/app/components/pages/UserProfilePage.tsx:0:0-0:0)
- [inventory/ExcelImportModal.tsx](cci:7://file:///c:/Portfolio/InsightSphere/frontend/src/app/components/inventory/ExcelImportModal.tsx:0:0-0:0)
- [NotificationCenter.tsx](cci:7://file:///c:/Portfolio/InsightSphere/frontend/src/app/components/NotificationCenter.tsx:0:0-0:0)
- [pages/DashboardPage.tsx](cci:7://file:///c:/Portfolio/InsightSphere/frontend/src/app/components/pages/DashboardPage.tsx:0:0-0:0)
- [pos/PaymentModal.tsx](cci:7://file:///c:/Portfolio/InsightSphere/frontend/src/app/components/pos/PaymentModal.tsx:0:0-0:0)

**Contoh pola:**
- `w-4 h-4`
- `w-5 h-5`
- `size-4`
- `size-8`
- `w-12 h-12`

**Rekomendasi:**
- Lucide icon:
  - `ICON.xs`
  - `ICON.sm`
  - `ICON.md`
  - `ICON.lg`
  - `ICON.xl`
- Icon container:
  - bisa tambah token baru jika belum ada, misalnya `BOX.iconSm`, `BOX.iconMd`, `BOX.iconLg`
- Skeleton boleh dikecualikan sebagian, tapi komponen user-facing sebaiknya tokenized.

# 5. Hardcoded radius

**Jumlah:** 405 hits di app files.

**File paling banyak:**
- [Skeletons.tsx](cci:7://file:///c:/Portfolio/InsightSphere/frontend/src/app/components/Skeletons.tsx:0:0-0:0)
- [pages/XAIPage.tsx](cci:7://file:///c:/Portfolio/InsightSphere/frontend/src/app/components/pages/XAIPage.tsx:0:0-0:0)
- [pages/UserProfilePage.tsx](cci:7://file:///c:/Portfolio/InsightSphere/frontend/src/app/components/pages/UserProfilePage.tsx:0:0-0:0)
- [WhatIfSimulator.tsx](cci:7://file:///c:/Portfolio/InsightSphere/frontend/src/app/components/WhatIfSimulator.tsx:0:0-0:0)
- [pages/KasirPage.tsx](cci:7://file:///c:/Portfolio/InsightSphere/frontend/src/app/components/pages/KasirPage.tsx:0:0-0:0)
- [NotificationCenter.tsx](cci:7://file:///c:/Portfolio/InsightSphere/frontend/src/app/components/NotificationCenter.tsx:0:0-0:0)
- [XAIComponents.tsx](cci:7://file:///c:/Portfolio/InsightSphere/frontend/src/app/components/XAIComponents.tsx:0:0-0:0)
- [pos/PaymentModal.tsx](cci:7://file:///c:/Portfolio/InsightSphere/frontend/src/app/components/pos/PaymentModal.tsx:0:0-0:0)

**Contoh pola:**
- `rounded-xl`
- `rounded-2xl`
- `rounded-3xl`
- `rounded-full`
- `rounded-[40px]`

**Rekomendasi:**
- Ganti bertahap ke:
  - `R.sm`
  - `R.md`
  - `R.lg`
  - `R.xl`
  - `R.full`
  - `R_COMPONENT.card`
  - `R_COMPONENT.button`
  - `R_COMPONENT.modal`

**Prioritas khusus:**
- `rounded-[40px]` di [PaymentModal.tsx](cci:7://file:///c:/Portfolio/InsightSphere/frontend/src/app/components/pos/PaymentModal.tsx:0:0-0:0)
- `rounded-[2.5rem]` di [ExportShareModal.tsx](cci:7://file:///c:/Portfolio/InsightSphere/frontend/src/app/components/ExportShareModal.tsx:0:0-0:0)
- Komponen XAI karena masih banyak hardcoded radius.

# 6. Hardcoded z-index

**Jumlah:** 73 hits app files.

**File:**
- [pages\UserProfilePage.tsx](cci:7://file:///c:/Portfolio/InsightSphere/frontend/src/app/components/pages/UserProfilePage.tsx:0:0-0:0)
- [inventory\StockOpnameModal.tsx](cci:7://file:///c:/Portfolio/InsightSphere/frontend/src/app/components/inventory/StockOpnameModal.tsx:0:0-0:0)
- [inventory\StockTransferModal.tsx](cci:7://file:///c:/Portfolio/InsightSphere/frontend/src/app/components/inventory/StockTransferModal.tsx:0:0-0:0)
- [pages\CashManagementPage.tsx](cci:7://file:///c:/Portfolio/InsightSphere/frontend/src/app/components/pages/CashManagementPage.tsx:0:0-0:0)
- [pages\LaporanPage.tsx](cci:7://file:///c:/Portfolio/InsightSphere/frontend/src/app/components/pages/LaporanPage.tsx:0:0-0:0)
- [pages\StockMovementPage.tsx](cci:7://file:///c:/Portfolio/InsightSphere/frontend/src/app/components/pages/StockMovementPage.tsx:0:0-0:0)
- [pages\XAIPage.tsx](cci:7://file:///c:/Portfolio/InsightSphere/frontend/src/app/components/pages/XAIPage.tsx:0:0-0:0)
- [settings\AccessSettingsPanel.tsx](cci:7://file:///c:/Portfolio/InsightSphere/frontend/src/app/components/settings/AccessSettingsPanel.tsx:0:0-0:0)

**Contoh:**
- `z-10`
- `z-50`

**Rekomendasi:**
- Ganti ke `Z.*`:
  - `Z.raised`
  - `Z.sticky`
  - `Z.overlay`
  - `Z.modal`
  - `Z.popover`
  - `Z.tooltip`

**Catatan:**
- `z-10` untuk sticky table cells masih bisa valid, tapi tetap lebih konsisten jika pakai `Z.raised`.

# 7. Arbitrary Tailwind / raw CSS colors

## Arbitrary Tailwind

**Jumlah:** 98 hits app files.

**Contoh:**
- `shadow-[0_0_20px_rgba(...)]`
- `rounded-[40px]`
- `h-[300px]`
- `max-w-[200px]`
- `translate-y-[-2px]`

**Prioritas:**
- [WhatIfSimulator.tsx](cci:7://file:///c:/Portfolio/InsightSphere/frontend/src/app/components/WhatIfSimulator.tsx:0:0-0:0)
- [ExportShareModal.tsx](cci:7://file:///c:/Portfolio/InsightSphere/frontend/src/app/components/ExportShareModal.tsx:0:0-0:0)
- [PaymentModal.tsx](cci:7://file:///c:/Portfolio/InsightSphere/frontend/src/app/components/pos/PaymentModal.tsx:0:0-0:0)
- [XAIPage.tsx](cci:7://file:///c:/Portfolio/InsightSphere/frontend/src/app/components/pages/XAIPage.tsx:0:0-0:0)

## Raw CSS colors

**Jumlah:** 19 hits app files.

**File utama:**
- [ExplanationCharts.tsx](cci:7://file:///c:/Portfolio/InsightSphere/frontend/src/app/components/ExplanationCharts.tsx:0:0-0:0)
- [WhatIfSimulator.tsx](cci:7://file:///c:/Portfolio/InsightSphere/frontend/src/app/components/WhatIfSimulator.tsx:0:0-0:0)
- [PaymentModal.tsx](cci:7://file:///c:/Portfolio/InsightSphere/frontend/src/app/components/pos/PaymentModal.tsx:0:0-0:0)
- [ExportShareModal.tsx](cci:7://file:///c:/Portfolio/InsightSphere/frontend/src/app/components/ExportShareModal.tsx:0:0-0:0)
- [UserProfilePage.tsx](cci:7://file:///c:/Portfolio/InsightSphere/frontend/src/app/components/pages/UserProfilePage.tsx:0:0-0:0)

**Contoh:**
- `#e5ddd5`
- `#dcf8c6`
- `rgba(...)`
- `hsl(var(...))`
- `#000` di receipt print

**Rekomendasi:**
- Chart raw styles pakai `CHART_COLORS` / `getChartColors`
- UI colors pakai `C.*` atau semantic Tailwind classes
- WhatsApp preview color boleh dibuat token lokal seperti `SHARE_PREVIEW.whatsappBg`

# Prioritas Fix yang Saya Sarankan

## P1 — i18n & visible text

**Status:** Selesai — 2026-05-10

- [UserProfilePage.tsx](cci:7://file:///c:/Portfolio/InsightSphere/frontend/src/app/components/pages/UserProfilePage.tsx:0:0-0:0)
- [XAIPage.tsx](cci:7://file:///c:/Portfolio/InsightSphere/frontend/src/app/components/pages/XAIPage.tsx:0:0-0:0)
- [PaymentModal.tsx](cci:7://file:///c:/Portfolio/InsightSphere/frontend/src/app/components/pos/PaymentModal.tsx:0:0-0:0)
- [ProfileSettingsPanel.tsx](cci:7://file:///c:/Portfolio/InsightSphere/frontend/src/app/components/settings/ProfileSettingsPanel.tsx:0:0-0:0)
- [LogoutSettingsPanel.tsx](cci:7://file:///c:/Portfolio/InsightSphere/frontend/src/app/components/settings/LogoutSettingsPanel.tsx:0:0-0:0)
- [AccessSettingsPanel.tsx](cci:7://file:///c:/Portfolio/InsightSphere/frontend/src/app/components/settings/AccessSettingsPanel.tsx:0:0-0:0)

**Catatan penyelesaian:**
- Menambahkan regression test `frontend/tests/hardcode-p1.test.mjs`.
- Melokalkan sisa visible copy pada User Profile, XAI, POS receipt, Profile Settings, dan Access Settings.
- Menambahkan key ID/EN baru di `frontend/src/app/i18n.tsx`.
- `LogoutSettingsPanel.tsx` sudah memakai key `set.logout.*` untuk teks audit P1.

## P2 — currency hardcode

**Status:** Selesai — 2026-05-10

- [PaymentModal.tsx](cci:7://file:///c:/Portfolio/InsightSphere/frontend/src/app/components/pos/PaymentModal.tsx:0:0-0:0)
- [CartPanel.tsx](cci:7://file:///c:/Portfolio/InsightSphere/frontend/src/app/components/pos/CartPanel.tsx:0:0-0:0)
- [KasirPage.tsx](cci:7://file:///c:/Portfolio/InsightSphere/frontend/src/app/components/pages/KasirPage.tsx:0:0-0:0)
- [TransactionHistoryPage.tsx](cci:7://file:///c:/Portfolio/InsightSphere/frontend/src/app/components/pages/TransactionHistoryPage.tsx:0:0-0:0)

**Catatan penyelesaian:**
- Menambahkan regression test `frontend/tests/hardcode-p2.test.mjs`.
- Prefix input currency di Kasir memakai `common.currency.rupiah`.
- Header CSV riwayat transaksi dibangun dari key `txn.export.headers.*` dan parameter `{currency}`.
- `PaymentModal.tsx` dan `CartPanel.tsx` sudah memakai `common.currency.rupiah`/`formatRupiah()` untuk kebutuhan currency yang diaudit.

## P3 — token polish

**Status:** Selesai — 2026-05-10

- [XAIComponents.tsx](cci:7://file:///c:/Portfolio/InsightSphere/frontend/src/app/components/XAIComponents.tsx:0:0-0:0)
- [WhatIfSimulator.tsx](cci:7://file:///c:/Portfolio/InsightSphere/frontend/src/app/components/WhatIfSimulator.tsx:0:0-0:0)
- [PaymentModal.tsx](cci:7://file:///c:/Portfolio/InsightSphere/frontend/src/app/components/pos/PaymentModal.tsx:0:0-0:0)
- [ExportShareModal.tsx](cci:7://file:///c:/Portfolio/InsightSphere/frontend/src/app/components/ExportShareModal.tsx:0:0-0:0)
- [NotificationCenter.tsx](cci:7://file:///c:/Portfolio/InsightSphere/frontend/src/app/components/NotificationCenter.tsx:0:0-0:0)

**Catatan penyelesaian:**
- Menambahkan regression test `frontend/tests/hardcode-p3.test.mjs`.
- Mengganti arbitrary radius P3 dengan token `R.*` pada Payment dan Export Share.
- Mengganti arbitrary glow shadow di What-If Simulator dengan token `E.glow*`.
- Menghapus raw hex preview share dan warna print receipt hardcode dari modal prioritas.
- Membersihkan one-off layout tweak XAI yang diaudit (`max-w-[200px]`, `translate-y-[-2px]`).

## P4 — mass cleanup, lower risk

**Status:** Selesai — 2026-05-10

- [Skeletons.tsx](cci:7://file:///c:/Portfolio/InsightSphere/frontend/src/app/components/Skeletons.tsx:0:0-0:0)
- shadcn `components/ui/*`
- table sticky `z-10`
- fixed sizing for intentional layout/skeleton dimensions

**Catatan penyelesaian:**
- Menambahkan regression test `frontend/tests/hardcode-p4.test.mjs`.
- Menambahkan token `TABLE.stickyColumn` dan `TABLE.minWidth.*` untuk sticky table serta min-width table.
- Mengganti sticky table `z-10` di halaman data prioritas menjadi `TABLE.stickyColumn`.
- Memusatkan min-width `ResponsiveTable` pada token `TABLE.minWidth.*`.
- Membersihkan arbitrary radius/fixed width outlier di `Skeletons.tsx`.
- Mengarahkan primitive dialog/alert-dialog/loading bar yang diaudit ke token `R`, `E`, dan `Z`.

# Kesimpulan

Hardcode prioritas P1-P4 sudah dibersihkan pada area utama yang diaudit. Sisa temuan yang lebih kecil masih bisa ditangani sebagai cleanup lanjutan, terutama di:

- **XAI-related components**
- **POS payment/cart**
- **User profile/settings**
- **Export/share modal**
- **Skeletons**

**Catatan:** Dokumen ini adalah acuan utama (living document) untuk perbaikan Hardcode InsightSphere.  
> Setiap kali selesai mengerjakan task dari dokumen ini, update status item terkait dan tambahkan entry di Changelog.

# Changelog

- 2026-05-10 — P1 selesai: visible text di UserProfile, XAI, POS Payment receipt, Profile Settings, Logout Settings, dan Access Settings sudah diarahkan ke i18n; ditambahkan regression test `hardcode-p1.test.mjs`.
- 2026-05-10 — P2 selesai: currency hardcode di POS Payment/Cart, Kasir, dan Transaction History sudah diarahkan ke `common.currency.rupiah`, `formatRupiah()`, dan header CSV i18n; ditambahkan regression test `hardcode-p2.test.mjs`.
- 2026-05-10 — P3 selesai: arbitrary radius, arbitrary glow shadow, raw preview color, receipt print color, dan one-off XAI layout tweak pada komponen prioritas sudah diarahkan ke token/design scale; ditambahkan regression test `hardcode-p3.test.mjs`.
- 2026-05-10 — P4 selesai: sticky table z-index, responsive table min-width, skeleton outlier sizing/radius, dan primitive UI modal/loading yang diaudit sudah diarahkan ke token; ditambahkan regression test `hardcode-p4.test.mjs`.
