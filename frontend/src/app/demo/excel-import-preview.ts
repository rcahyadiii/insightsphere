import type { ImportProductRow } from "@/app/components/inventory/ExcelImportModal";

type DemoPreviewRow = ImportProductRow & {
  errors: string[];
};

export const DEMO_EXCEL_IMPORT_PREVIEW: DemoPreviewRow[] = [
  { sku: "KRT-001", name: "Kertas HVS A4 70gr", category: "Kertas", unit: "Rim", stock: 50, price: 55000, minStock: 10, supplier: "CV Aneka", errors: [] },
  { sku: "KRT-002", name: "Kertas HVS F4 80gr", category: "Kertas", unit: "Rim", stock: 30, price: 62000, minStock: 8, errors: [] },
  { sku: "TNR-001", name: "Toner HP LaserJet 85A", category: "Tinta", unit: "Botol", stock: 3, price: 280000, minStock: 2, supplier: "HP Store", errors: [] },
  { sku: "LMN-001", name: "Plastik Laminasi A4", category: "Laminasi", unit: "Pack", stock: 10, price: 45000, minStock: 3, errors: [] },
  { sku: "SPR-001", name: "Spiral Binding 8mm", category: "Jilid", unit: "Box", stock: 8, price: 35000, minStock: 2, errors: [] },
  { sku: "MAP-001", name: "Map Plastik Bening A4", category: "Lainnya", unit: "Pack", stock: 20, price: 18000, minStock: 5, errors: [] },
  { sku: "", name: "Kertas A3 80gr", category: "Kertas", unit: "Rim", stock: 15, price: 0, minStock: 5, errors: ["SKU kosong", "Harga tidak valid"] },
];
