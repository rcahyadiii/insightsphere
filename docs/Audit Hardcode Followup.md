# Audit Hardcode Follow-up

Tanggal audit: 2026-05-10  
Status: P0 selesai pada 2026-05-10, P1 mock-data runtime selesai pada 2026-05-10, P1 i18n priority batch selesai pada 2026-05-10, P2 styling token debt selesai pada 2026-05-10, P2 domain constants selesai pada 2026-05-10, dan P3 masih backlog lanjutan setelah P1-P4 di `docs/Audit Hardcode Frontend.md`

Dokumen ini mencatat temuan hardcode yang masih tersisa atau perlu dipastikan lagi. Tujuannya menjadi acuan kerja jika pembersihan belum selesai hari ini.

## Scope Scan

Area yang discan:

- `frontend/src/app`
- `frontend/app`
- `backend`

Area yang sengaja tidak dijadikan prioritas utama:

- `node_modules`, `.next`, cache build, dan output generated.
- File test, kecuali jika test menyimpan fixture produksi yang bocor ke runtime.
- `frontend/src/app/i18n.tsx` sebagai lokasi translation value yang memang diharapkan berisi teks.
- Token primitive seperti `frontend/src/app/lib/elevation.ts`, `radii.ts`, `spacing.ts`, dan `z-index.ts`, karena file tersebut memang menjadi sumber konstanta.

Ringkasan hasil scan:

| Kategori | Jumlah indikasi | Catatan |
| --- | ---: | --- |
| URL, host, port, secret, config literal | 27 | Termasuk backend config, scratch script, auth cookie fallback, dan external share URL. |
| Mock, demo, sample, fixture runtime | 177 | Termasuk false positive dari `i18n.tsx`; masih ada banyak mock data di halaman runtime. |
| Literal UI visible di JSX | 105 | Masih banyak di inventory, POS, dan beberapa helper UI. |
| Styling arbitrary value atau token bypass | 212 | Sebagian valid di chart/UI library, tetapi beberapa table/modal belum ikut token P4. |

## Baseline Test Cleanup

Status implementasi 2026-05-10:

- Backend automated suite yang sebelumnya merah sudah dibersihkan sebelum lanjut P1.
- Finance repository sekarang meng-coerce UUID query value sebelum masuk filter SQLAlchemy `UUID(as_uuid=True)`.
- Sales checkout tidak lagi melakukan commit repository di dalam `db.begin_nested()` service context.
- Test identity dirapikan dari blok duplikat dan disesuaikan dengan kontrak response saat ini.
- Test finance, notification, reporting, dan sales diperbaiki agar mengirim payload JSON yang valid.
- Manual offline sync test sekarang skip secara default dan hanya jalan jika `OFFLINE_SYNC_BASE_URL` diset.

Verifikasi terakhir:

- `python -m pytest backend\tests -q --tb=short -p no:cacheprovider` -> 49 passed, 4 skipped, 4 warnings.

## Prioritas Temuan

### P0 - Runtime config dan secret masih punya default literal

Status implementasi 2026-05-10:

- `backend/core/config.py` sekarang punya `APP_ENV` dan fail-fast guardrail untuk production.
- Production menolak config kosong dan development default untuk `DATABASE_URL`, `SECRET_KEY`, `REDIS_URL`, dan `FRONTEND_URL`.
- Development `SECRET_KEY` fallback dibuat ephemeral per proses, bukan literal secret statis di source.
- `frontend/src/app/lib/auth-cookie.ts` hanya fallback ke backend dev URL saat `NODE_ENV !== "production"`.
- `backend/migrate_inventory_version.py` wajib membaca `DATABASE_URL` dari env runtime.
- `backend/core/email.py` tidak lagi fallback ke sender placeholder.
- `.env.example` dan `frontend/.env.local.example` diperbarui agar env wajib lebih jelas.

Risiko:

- Aplikasi bisa berjalan di environment non-dev dengan credential, secret, URL, atau expiry default.
- Secret default di source membuat deployment mudah salah konfigurasi.
- URL localhost default bisa menyembunyikan salah konfigurasi production sampai runtime.

File target:

| File | Temuan | Rekomendasi |
| --- | --- | --- |
| `backend/core/config.py` | `DATABASE_URL`, `SECRET_KEY`, `REDIS_URL`, `FRONTEND_URL`, expiry token, dan SMTP default masih literal. | Pisahkan default dev vs production. Untuk production, `SECRET_KEY` dan koneksi eksternal harus required dan fail-fast. |
| `frontend/src/app/lib/auth-cookie.ts` | Backend fallback ke `http://127.0.0.1:8000`. | Ganti menjadi env required untuk server runtime atau helper config yang eksplisit `devOnlyFallback`. |
| `backend/migrate_inventory_version.py` | URL database hardcoded. | Ambil dari env atau reuse config backend. |
| `backend/core/email.py` | Sender fallback `noreply@example.com`. | Jadikan env/config dan validasi saat fitur email aktif. |

Checklist lanjutan:

- [x] Tambahkan validasi config berbasis environment (`development`, `test`, `production`).
- [x] Fail-fast jika `SECRET_KEY`, `DATABASE_URL`, atau `FRONTEND_URL` kosong di production.
- [x] Buat atau update `.env.example` tanpa credential nyata.
- [ ] Pastikan tidak ada secret default yang dipakai di CI atau deployment.

### P1 - Mock data masih dipakai di halaman runtime

Status implementasi 2026-05-10:

- `frontend/src/app/services/productService.ts` tidak lagi fallback diam-diam ke produk POS demo saat API gagal.
- Fallback produk POS demo hanya aktif jika `NEXT_PUBLIC_ENABLE_DEMO_DATA=true`.
- Fixture demo untuk POS product, stock movement, transaction history, dan MLOps dashboard dipindahkan ke `frontend/src/app/demo`.
- KPI model aktif, periode chart, training jobs, model versions, dan service health MLOps tidak lagi inline di runtime page.
- `StockMovementPage`, `TransactionHistoryPage`, dan `MLOpsDashboardPage` memulai dari state kosong dan lazy-load fixture demo hanya melalui `isDemoDataEnabled()`.
- Batch kedua memindahkan fixture demo untuk Dashboard, Inventaris, User Management, User Profile, Stock Transfer, Stock History, Low Stock Alert, Notification Center, dan Refund Modal ke `frontend/src/app/demo`.
- Child component terkait juga dibersihkan: `TopProductsChart` untuk Dashboard dan `ExcelImportModal` untuk preview import inventory.
- Cleanup tambahan menghilangkan simbol `MOCK_` eksplisit terakhir di `CashManagementPage` dan `ServicePanel`.
- Target-target batch kedua juga memulai dari state kosong dan hanya lazy-load fixture demo saat `NEXT_PUBLIC_ENABLE_DEMO_DATA=true`.
- Regression test ditambahkan di `frontend/tests/hardcode-followup-p1.test.mjs`.

Catatan scope:

- Bagian P1 mock-data runtime sudah ditutup untuk target di tabel ini.
- Bagian P1 literal UI/i18n masih backlog terpisah di seksi berikutnya.

Risiko:

- User bisa melihat data palsu sebagai data bisnis.
- Flow produksi terlihat berhasil walau API gagal.
- Data mock sulit dibedakan dari fallback yang disengaja untuk demo.

File target utama:

| File | Temuan | Rekomendasi |
| --- | --- | --- |
| `frontend/src/app/services/productService.ts` | `MOCK_POS_PRODUCTS` dipakai sebagai fallback saat API gagal. | Jangan fallback diam-diam. Tampilkan error state, atau gate mock dengan flag demo. |
| `frontend/src/app/components/pages/StockMovementPage.tsx` | `CATEGORIES`, `UNITS`, `DATE_PERIODS`, dan `MOCK_MOVEMENTS` masih local. | Ambil kategori/unit/periode dari API atau config domain. Pindahkan fixture ke file demo bila masih dibutuhkan. |
| `frontend/src/app/components/pages/MLOpsDashboardPage.tsx` | Training jobs, model versions, service health, ID model, tanggal, metrik, dan threshold hardcoded. | Buat service/hook data MLOps atau fixture demo yang jelas. |
| `frontend/src/app/components/pages/DashboardPage.tsx` | KPI period, branch list, dan branch comparison masih static. | Ganti ke API summary atau fixture demo terpisah. |
| `frontend/src/app/components/pages/InventarisPage.tsx` | `MOCK_PRODUCTS` masih runtime. | Konsolidasi dengan product service atau inventory API. |
| `frontend/src/app/components/pages/UserManagementPage.tsx` | `MOCK_USERS`. | Hubungkan ke user/admin API atau fixture demo. |
| `frontend/src/app/components/pages/TransactionHistoryPage.tsx` | `MOCK_TRANSACTIONS`. | Hubungkan ke transaction API dan error/loading state. |
| `frontend/src/app/components/pages/UserProfilePage.tsx` | `MOCK_EXTENDED` termasuk email, telepon, lokasi, dan join date. | Ambil dari profile API atau gunakan fixture demo gated. |
| `frontend/src/app/components/inventory/StockTransferModal.tsx` | `MOCK_BRANCHES` dan `MOCK_TRANSFER_HISTORY`. | Ambil cabang dan history transfer dari API. |
| `frontend/src/app/components/inventory/StockHistoryTable.tsx` | `MOCK_HISTORY`. | Ganti dengan data history dari inventory API. |
| `frontend/src/app/components/LowStockAlert.tsx` | `MOCK_LOW_STOCK`. | Ambil dari endpoint stok rendah. |
| `frontend/src/app/components/NotificationCenter.tsx` | `INITIAL_NOTIFICATIONS`, polling interval, dan notifikasi sample. | Buat notification service atau gate demo data. |
| `frontend/src/app/components/pos/RefundModal.tsx` | `MOCK_TRANSACTIONS`. | Ganti dengan lookup transaksi nyata. |

Checklist lanjutan:

- [x] Tentukan strategi: API nyata, fixture demo gated, atau explicit empty state.
- [x] Jangan fallback ke mock saat API error tanpa indikator untuk target runtime.
- [x] Pindahkan data demo target runtime ke `frontend/src/app/demo`.
- [x] Tambahkan test agar production path target runtime tidak mengimpor fixture demo.
- [x] Lanjutkan target P1 lain: Dashboard, Inventaris, User Management, User Profile, inventory modal/table, notification, dan refund.
- [x] Tutup `LowStockAlert` yang juga masih memakai mock runtime di tabel P1.
- [x] Bersihkan simbol `MOCK_`, `INITIAL_NOTIFICATIONS`, dan `POLL_NOTIFICATIONS` eksplisit dari `frontend/src/app`.

### P1 - Literal UI dan copy belum seluruhnya masuk i18n

Status implementasi 2026-05-10:

- Priority batch i18n untuk inventory transfer, stock opname, Excel import, Stock Movement, POS shell, dan POS cart sudah dipindahkan ke `frontend/src/app/i18n.tsx` dengan key ID/EN.
- Pesan validasi Zod Stock Movement sekarang dibuat lewat factory schema berbasis `t(...)`, bukan literal inline.
- Label kategori/periode/status Stock Movement menggunakan key i18n dan value internal stabil.
- Guard test baru ditambahkan di `frontend/tests/hardcode-followup-p1-i18n.test.mjs`.
- `PageHeader` tidak punya runtime fallback copy; contoh literal hanya ada di komentar JSDoc.

Risiko:

- Copy visible tidak konsisten dengan sistem i18n.
- Translasi dan review copy sulit dilakukan karena teks tersebar.
- Validasi form dan toast bisa berbeda antar halaman.

File target utama:

| File | Temuan | Rekomendasi |
| --- | --- | --- |
| `frontend/src/app/components/inventory/StockTransferModal.tsx` | Banyak label modal/table masih literal. | Pindahkan ke `i18n.tsx`, gunakan key modal inventory. |
| `frontend/src/app/components/pages/StockMovementPage.tsx` | Label tipe movement, kategori, satuan, periode, dan validasi Zod masih literal. | Pindahkan copy dan enum display label ke i18n/domain config. |
| `frontend/src/app/components/pages/KasirPage.tsx` | Masih ada beberapa text node dan aria/placeholder literal. | Pakai `useI18n` atau konstanta copy terpusat. |
| `frontend/src/app/components/inventory/StockOpnameModal.tsx` | Copy modal masih literal. | Pindahkan ke i18n inventory opname. |
| `frontend/src/app/components/inventory/ExcelImportModal.tsx` | Label kolom, status import, dan copy preview literal. | Pindahkan ke i18n/import config. |
| `frontend/src/app/components/PageHeader.tsx` | Fallback label/header literal. | Pastikan semua caller memberi label i18n atau fallback terpusat. |
| `frontend/src/app/components/pos/PaymentModal.tsx` | Beberapa label/action masih literal. | Pindahkan ke i18n POS/payment. |
| `frontend/src/app/components/pos/CartPanel.tsx` | Copy empty/action masih literal. | Pindahkan ke i18n POS/cart. |

Checklist lanjutan:

- [x] Buat grup key untuk inventory transfer, stock movement, import, POS payment, dan POS cart.
- [x] Pindahkan pesan validasi Zod ke helper i18n atau factory schema.
- [x] Tambahkan test ringan yang mencari literal JSX di file prioritas.

### P2 - Styling token debt tersisa setelah P4

Status implementasi 2026-05-10:

- Target table/modal P2 memakai `TABLE.minWidth.*` dan `TABLE.stickyColumn` untuk min-width serta sticky first-column.
- Token min-width baru ditambahkan untuk `topProducts`, `settings`, dan `stockHistory`; ukuran lama 760/860/980 direuse lewat token semantik.
- Modal inventory target memakai `BACKDROP.overlay`, `Z.overlay`, dan `MODAL.wrapper`; dropdown/header notification memakai token `DROPDOWN.*` dan `Z.*`.
- Ornamen besar `PortalTemplate` dipindahkan ke `LAYOUT_DECORATION.portalOrnament`.
- Regression test baru ditambahkan di `frontend/tests/hardcode-followup-p2-token.test.mjs`.

Risiko:

- Table sticky, z-index, modal overlay, dan arbitrary sizing kembali tidak konsisten.
- Perubahan design token tidak otomatis menyentuh komponen yang masih memakai literal Tailwind.

File target utama:

| File | Temuan | Rekomendasi |
| --- | --- | --- |
| `frontend/src/app/components/PredictionTable.tsx` | `min-w-[980px]`, sticky `z-10`. | Pakai `TABLE.minWidth` dan `TABLE.stickyColumn`. |
| `frontend/src/app/components/TopProductsChart.tsx` | Table min-width dan sticky z-index literal. | Pakai token table yang sama. |
| `frontend/src/app/components/inventory/StockTransferModal.tsx` | `z-50`, `min-w-[760px]`, sticky `z-10`. | Pakai token dialog/table. |
| `frontend/src/app/components/inventory/StockHistoryTable.tsx` | `z-50`, `min-w-[860px]`, sticky `z-10`/`z-20`. | Pakai token dialog/table. |
| `frontend/src/app/components/inventory/StockOpnameModal.tsx` | Overlay z-index dan min-width literal. | Pakai token dialog/table. |
| `frontend/src/app/components/settings/AccessSettingsPanel.tsx` | Table min-width dan sticky z-index literal. | Pakai token table. |
| `frontend/src/app/components/settings/SecuritySettingsPanel.tsx` | Table min-width dan sticky z-index literal. | Pakai token table. |
| `frontend/src/app/components/NotificationCenter.tsx` | Width, max-height, min badge size, sticky z-index literal. | Tambahkan token notification panel atau layout primitive. |
| `frontend/src/app/components/Header.tsx` | Dropdown `z-50`, max-width arbitrary. | Pakai token dropdown/popover dan responsive text token. |
| `frontend/src/app/components/PortalTemplate.tsx` | Decorative size/blur arbitrary besar. | Pertimbangkan token decorative layer atau sederhanakan style. |

Checklist lanjutan:

- [x] Perluas `TABLE.minWidth` untuk ukuran 760, 860, 980 jika memang dipakai berulang.
- [x] Tambahkan token `DIALOG.overlayZ`, `POPOVER.zIndex`, atau reuse token existing jika sudah ada.
- [x] Audit ulang `z-50`, `z-20`, `z-10`, `min-w-[...]`, `max-w-[...]`, `rounded-[...]` pada target P2 styling.
- [x] Tambahkan regression test seperti pola P4 untuk komponen table/modal yang belum tercakup.

### P2 - Magic number dan business rule tersebar

Status implementasi 2026-05-10:

- Frontend role, role set, auth expiry mirror, inventory category/unit/status/period, dan what-if simulator rule dipusatkan di `frontend/src/app/domain/constants.ts`.
- `routes.tsx`, `AuthContext`, `auth-client`, `auth-cookie`, `Header`, `Sidebar`, dan `UserManagementPage` memakai role/auth constants yang sama.
- `StockMovementPage`, `InventarisPage`, dan `WhatIfSimulator` tidak lagi menyimpan opsi domain dan angka rule bisnis utama secara lokal.
- Backend auth expiry default dipindahkan ke `backend/core/runtime_constants.py`.
- Backend role contract dipusatkan di `backend/domains/identity/constants.py` dan dipakai oleh security, identity, inventory, reporting, dan notification layer.
- Konfigurasi StockPredictor, termasuk horizon, feature columns, hyperparameter, split ratio, clipping quantile, dan error-buffer minimum, dipindahkan ke `backend/domains/intelligence/stock_predictor_config.py`.
- Regression test ditambahkan di `frontend/tests/hardcode-followup-p2-domain.test.mjs` dan `backend/tests/test_p2_domain_constants.py`.

Risiko:

- Rule bisnis berbeda antar frontend dan backend.
- Perubahan threshold atau expiry harus dicari manual.
- Angka demo bisa terbawa ke keputusan produk.

File target:

| File | Temuan | Rekomendasi |
| --- | --- | --- |
| `frontend/src/app/components/WhatIfSimulator.tsx` | Default discount, demand multiplier, dan adjustment rule hardcoded. | Buat config simulator atau ambil dari model/API. |
| `backend/domains/intelligence/stock_predictor.py` | Threshold, horizon, feature defaults, dan fallback statistik tersebar. | Pusatkan di config model atau domain constants. |
| `backend/core/config.py` dan `frontend/src/app/lib/auth-cookie.ts` | Expiry auth 7 hari didefinisikan di dua tempat. | Satukan di config contract atau dokumentasikan sebagai shared runtime setting. |
| Frontend role usage | Role string seperti `owner`, `admin`, `cashier`, `inventory_manager` muncul di banyak file. | Buat enum/constant frontend yang sinkron dengan backend. |
| Inventory/POS pages | Kategori, unit, periode filter, dan status label lokal. | Pindahkan ke domain config atau API metadata. |

Checklist lanjutan:

- [x] Inventarisasi role string frontend/backend.
- [x] Buat `domain/constants` untuk status, role, kategori, unit, dan periode.
- [x] Hindari angka rule bisnis inline di JSX atau handler event.
- [x] Tambahkan regression test untuk domain constants frontend/backend.

### P3 - Script dev dan scratch masih hardcoded

Status implementasi 2026-05-10:

- Root `backend/scratch_*.py` dikosongkan; script scratch dipindahkan ke `backend/scripts/dev`.
- `backend/scripts/dev/dev_script_guard.py` menjadi guard bersama untuk script dev-only.
- Script API/stress sekarang wajib memakai `APP_ENV=development` dan `API_BASE_URL`; tidak ada host localhost/127.0.0.1 inline.
- Script database destructive (`recreate_prediction_log_table.py`, `seed_mock_product.py`) wajib `APP_ENV=development` dan memakai config DB runtime.
- `backend/alembic.ini` tidak lagi menyimpan placeholder database URL; runtime URL tetap diinjeksi dari `core.config.Settings.DATABASE_URL` di `backend/alembic/env.py`.
- Cara menjalankan script dev didokumentasikan di `backend/scripts/dev/README.md`.
- Regression test ditambahkan di `backend/tests/test_p3_dev_scripts.py`.

Risiko:

- Developer menjalankan script ke database atau host yang salah.
- Script scratch terlihat seperti tooling resmi.

File target:

| File | Temuan | Rekomendasi |
| --- | --- | --- |
| `backend/scripts/dev/test_transactions_api.py` | Sebelumnya `backend/scratch_test_api.py` memakai endpoint inline. | Sudah pindah ke `scripts/dev`, memakai env `API_BASE_URL`, dan guard dev-only. |
| `backend/scripts/dev/stress_transactions_summary.py` | Sebelumnya `backend/scratch_stress_test.py` memakai endpoint localhost hardcoded. | Sudah memakai `API_BASE_URL`, opsi stress via env, dan guard dev-only. |
| `backend/migrate_inventory_version.py` | Database URL literal. | Reuse config atau env. |
| `backend/alembic.ini` | Placeholder `driver://user:pass@localhost/dbname`. | Sudah dihapus; Alembic runtime memakai env/config melalui `env.py`. |

Checklist lanjutan:

- [x] Pisahkan script scratch dari script operasional.
- [x] Tambahkan guard `if ENV != development` untuk script yang berbahaya.
- [x] Dokumentasikan cara menjalankan script dengan env.

### P3 - External channel dan provider URL masih inline

Status implementasi 2026-05-10:

- WhatsApp provider URL dipusatkan di `frontend/src/app/lib/share-providers.ts`.
- `ExportShareModal` memakai `buildShareUrl("whatsapp", ...)` dan tidak lagi membangun `wa.me` inline.
- Helper share melakukan normalisasi nomor telepon dan encoding query melalui `URLSearchParams`.
- Email sender backend tetap dibaca dari `SMTP_FROM_EMAIL` / `SMTP_USER` dan `SMTP_FROM_NAME` / `APP_NAME`, tanpa fallback placeholder.
- Regression test ditambahkan di `frontend/tests/hardcode-followup-p3-provider.test.mjs` dan `backend/tests/test_p3_provider_config.py`.

Risiko:

- Sulit mengganti provider share atau behavior per environment.
- URL channel tidak bisa dikontrol dari config.

File target:

| File | Temuan | Rekomendasi |
| --- | --- | --- |
| `frontend/src/app/components/ExportShareModal.tsx` | WhatsApp share memakai `https://wa.me/...` inline. | Sudah memakai helper/provider share URL terpusat. |
| `backend/core/email.py` | Email sender fallback inline. | Sudah memakai config email dan regression guard. |

Checklist lanjutan:

- [x] Buat `shareProviders` atau `buildShareUrl(provider, payload)`.
- [x] Tambahkan validasi format nomor/URL sebelum membuka tab baru.

## Urutan Kerja Disarankan

1. **HC-P0-CONFIG**: hardening `backend/core/config.py`, `auth-cookie.ts`, dan script DB agar production tidak memakai default literal.
2. **HC-P1-MOCK-DATA**: bersihkan fallback mock dari service dan halaman runtime yang user-facing.
3. **HC-P1-I18N-LEFTOVERS**: pindahkan literal copy prioritas inventory dan POS ke i18n.
4. **HC-P2-TOKEN-LEFTOVERS**: lanjutkan pola P4 untuk table/modal yang belum tersentuh.
5. **HC-P2-DOMAIN-CONSTANTS**: selesai pada 2026-05-10.
6. **HC-P3-SCRIPTS**: selesai pada 2026-05-10.
7. **HC-P3-PROVIDERS**: rapikan external share/email provider.

## Query Audit yang Dipakai

Command ini bisa dipakai ulang untuk audit berikutnya:

```powershell
rg -n --hidden --glob '!**/node_modules/**' --glob '!**/.next/**' --glob '!**/tests/**' "(localhost|127\.0\.0\.1|0\.0\.0\.0|https?://|:8000|:3000|wa\.me)" frontend\src frontend\app backend
```

```powershell
rg -n --hidden --glob '!**/node_modules/**' --glob '!**/.next/**' --glob '!**/tests/**' "(MOCK_|mock|Mock|demo|Demo|dummy|Sample|sample|INITIAL_|const [A-Z0-9_]+\s*=\s*\[)" frontend\src\app backend
```

```powershell
rg -n --hidden --glob '!**/node_modules/**' --glob '!**/.next/**' --glob '!frontend/src/app/i18n.tsx' ">\s*[A-Za-z][^<>{}]{2,}<|aria-label=\"[A-Za-z][^\"]+\"|placeholder=\"[A-Za-z][^\"]+\"|title=\"[A-Za-z][^\"]+\"" frontend\src\app frontend\app
```

```powershell
rg -n --hidden --glob '!**/node_modules/**' --glob '!**/.next/**' "(rounded-\[[^\]]+\]|shadow-\[[^\]]+\]|z-\[[^\]]+\]|\bz-(?:10|20|30|40|50)\b|#[0-9a-fA-F]{3,8}|rgba\(|hsl\(|min-w-\[[^\]]+\]|max-w-\[[^\]]+\]|w-\[[^\]]+\]|h-\[[^\]]+\])" frontend\src\app\components frontend\app
```

## Definition of Done

Sebuah item dianggap selesai jika:

- Tidak ada literal runtime baru yang menggantikan config, token, i18n, atau API.
- Jika mock masih dibutuhkan, mock berada di fixture/demo path dan digate secara eksplisit.
- Production path tidak fallback diam-diam ke localhost, credential default, atau mock data.
- Ada test atau scan regression untuk mencegah pola yang sama kembali.
- Dokumentasi config/env diperbarui bila behavior runtime berubah.
