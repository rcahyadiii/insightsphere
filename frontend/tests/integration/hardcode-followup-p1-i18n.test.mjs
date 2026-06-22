import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const root = fileURLToPath(new URL("../..", import.meta.url));
const read = (path) => readFileSync(join(root, path), "utf8");
const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

function assertNoLiteral(source, literal, file) {
  assert.doesNotMatch(source, new RegExp(escapeRegExp(literal)), `${file} still contains "${literal}"`);
}

test("P1 localizes priority inventory transfer, opname, and import modal copy", () => {
  const transferFile = "src/app/components/inventory/StockTransferModal.tsx";
  const opnameFile = "src/app/components/inventory/StockOpnameModal.tsx";
  const excelFile = "src/app/components/inventory/ExcelImportModal.tsx";
  const transfer = read(transferFile);
  const opname = read(opnameFile);
  const excel = read(excelFile);
  const i18n = read("src/app/i18n.tsx");

  [
    "Transfer Terkirim",
    "Transfer Baru",
    "Pilih cabang...",
    "Pilih produk...",
    "Stok tersedia di asal",
    "Preview Transfer",
    "Memproses...",
  ].forEach((literal) => assertNoLiteral(transfer, literal, transferFile));

  [
    "Opname Selesai",
    "item yang diperiksa",
    "Memproses...",
    "Tutup",
  ].forEach((literal) => assertNoLiteral(opname, literal, opnameFile));

  [
    "Import Produk dari Excel",
    "Upload File",
    "Preview & Validasi",
    "Membaca file...",
    "Drag & drop file, atau klik untuk pilih",
    "Download Template Excel",
    "Kolom yang dikenali:",
    "wajib diisi",
    "baris akan dilewati",
    "Menyimpan data ke inventaris",
    "← Kembali",
  ].forEach((literal) => assertNoLiteral(excel, literal, excelFile));

  [
    "inv.transfer.success_title",
    "inv.transfer.new",
    "inv.opname.success_title",
    "inv.excel.title",
    "inv.excel.column.product_name",
    "inv.excel.warning",
    "inv.excel.import_button",
  ].forEach((key) => assert.match(i18n, new RegExp(`"${escapeRegExp(key)}"`), `missing i18n key ${key}`));
});

test("P1 localizes priority stock movement and POS shell copy", () => {
  const stockMovementFile = "src/app/components/pages/StockMovementPage.tsx";
  const kasirFile = "src/app/components/pages/KasirPage.tsx";
  const cartFile = "src/app/components/pos/CartPanel.tsx";
  const stockMovement = read(stockMovementFile);
  const kasir = read(kasirFile);
  const cart = read(cartFile);
  const i18n = read("src/app/i18n.tsx");

  [
    "Nama produk wajib diisi",
    "SKU wajib diisi",
    "Kuantitas tidak boleh nol",
    "Tanggal wajib diisi",
    "Catat Pergerakan Stok Baru",
    "Contoh: Toner HP 85A",
    "Contoh: PO-2024-0001",
    "Tambahkan catatan jika diperlukan...",
    "Simpan Catatan",
    "Perubahan Stok",
    "Dibatalkan",
  ].forEach((literal) => assertNoLiteral(stockMovement, literal, stockMovementFile));

  [
    "Versi 2.4.0",
    "Kategori",
    "Kasir Aktif",
    "Online Mode",
    "Shift Pagi",
    "Stok Aman",
    "Stok Menipis",
    "Stok Habis",
    "Total Produk:",
    "Masukkan Harga",
  ].forEach((literal) => assertNoLiteral(kasir, literal, kasirFile));

  [
    ">POS<",
    ">SVC<",
    "Min {item.min_qty}",
  ].forEach((literal) => assertNoLiteral(cart, literal, cartFile));

  [
    "sm.validation.product_required",
    "sm.modal.product_placeholder",
    "sm.drawer.stockChange",
    "sm.status.cancelled",
    "pos.version",
    "pos.category_heading",
    "pos.cart.min_qty",
    "pos.cart.service_badge",
  ].forEach((key) => assert.match(i18n, new RegExp(`"${escapeRegExp(key)}"`), `missing i18n key ${key}`));
});
