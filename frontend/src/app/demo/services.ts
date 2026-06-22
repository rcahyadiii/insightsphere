import type { Product } from "@/app/types/pos";

export const DEMO_SERVICES: Product[] = [
  { id: "svc-001", sku: "FC-A4-HB", name: "Fotokopi A4 Hitam Putih", category: "FOTOKOPI", family: "LAYANAN", unit: "lembar", base_price: 200, current_stock: 9999, version: 1, is_service: true },
  { id: "svc-002", sku: "FC-A4-WR", name: "Fotokopi A4 Warna", category: "FOTOKOPI", family: "LAYANAN", unit: "lembar", base_price: 500, current_stock: 9999, version: 1, is_service: true },
  { id: "svc-003", sku: "FC-A3-HB", name: "Fotokopi A3 Hitam Putih", category: "FOTOKOPI", family: "LAYANAN", unit: "lembar", base_price: 500, current_stock: 9999, version: 1, is_service: true },
  { id: "svc-004", sku: "FC-A3-WR", name: "Fotokopi A3 Warna", category: "FOTOKOPI", family: "LAYANAN", unit: "lembar", base_price: 1000, current_stock: 9999, version: 1, is_service: true },
  { id: "svc-005", sku: "PR-A4-HB", name: "Print A4 Hitam Putih", category: "PRINT", family: "LAYANAN", unit: "lembar", base_price: 500, current_stock: 9999, version: 1, is_service: true },
  { id: "svc-006", sku: "PR-A4-WR", name: "Print A4 Warna", category: "PRINT", family: "LAYANAN", unit: "lembar", base_price: 1500, current_stock: 9999, version: 1, is_service: true },
  { id: "svc-007", sku: "PR-A3-HB", name: "Print A3 Hitam Putih", category: "PRINT", family: "LAYANAN", unit: "lembar", base_price: 1000, current_stock: 9999, version: 1, is_service: true },
  { id: "svc-008", sku: "PR-A3-WR", name: "Print A3 Warna", category: "PRINT", family: "LAYANAN", unit: "lembar", base_price: 3000, current_stock: 9999, version: 1, is_service: true },
  { id: "svc-009", sku: "JL-SPRL", name: "Jilid Spiral", category: "JILID", family: "LAYANAN", unit: "dokumen", base_price: 5000, current_stock: 9999, version: 1, is_service: true },
  { id: "svc-010", sku: "JL-LKBN", name: "Jilid Lakban (Softcover)", category: "JILID", family: "LAYANAN", unit: "dokumen", base_price: 3000, current_stock: 9999, version: 1, is_service: true },
  { id: "svc-011", sku: "JL-HARD", name: "Jilid Hard Cover", category: "JILID", family: "LAYANAN", unit: "dokumen", base_price: 25000, current_stock: 9999, version: 1, is_service: true },
  { id: "svc-012", sku: "LM-A4", name: "Laminasi A4", category: "LAMINASI", family: "LAYANAN", unit: "lembar", base_price: 3000, current_stock: 9999, version: 1, is_service: true },
  { id: "svc-013", sku: "LM-A3", name: "Laminasi A3", category: "LAMINASI", family: "LAYANAN", unit: "lembar", base_price: 5000, current_stock: 9999, version: 1, is_service: true },
  { id: "svc-014", sku: "SC-A4", name: "Scan A4", category: "SCAN", family: "LAYANAN", unit: "lembar", base_price: 1000, current_stock: 9999, version: 1, is_service: true },
  { id: "svc-015", sku: "SC-EMAIL", name: "Scan + Kirim Email", category: "SCAN", family: "LAYANAN", unit: "dokumen", base_price: 3000, current_stock: 9999, version: 1, is_service: true },
];
