export type DemoMovementType = "in" | "out" | "adjustment" | "transfer" | "return";

export interface DemoMovementRecord {
  id: string;
  type: DemoMovementType;
  product: string;
  sku: string;
  category: string;
  qty: number;
  unit: string;
  before: number;
  after: number;
  operator: string;
  date: Date;
  ref: string;
  notes: string;
  status: "completed" | "pending" | "cancelled";
}

export const DEMO_STOCK_MOVEMENTS: DemoMovementRecord[] = [
  { id: "mv-1", type: "in", product: "Toner HP 85A", sku: "TN-85A", category: "Toner", qty: 24, unit: "pcs", before: 12, after: 36, operator: "Budi Hartono", date: new Date(2024, 2, 15, 9, 30), ref: "PO-2024-0324", notes: "Pembelian dari supplier utama", status: "completed" },
  { id: "mv-2", type: "out", product: "Kertas A4 70gr", sku: "KR-A4-70", category: "Kertas", qty: 10, unit: "rim", before: 45, after: 35, operator: "Rini Susanti", date: new Date(2024, 2, 15, 10, 15), ref: "TX-2024-0412", notes: "Transaksi harian kasir 1", status: "completed" },
  { id: "mv-3", type: "adjustment", product: "Tinta Epson L3110", sku: "TI-EPS-L3", category: "Tinta", qty: -2, unit: "set", before: 8, after: 6, operator: "Ahmad Faiz", date: new Date(2024, 2, 14, 16, 0), ref: "ADJ-2024-0007", notes: "Stok rusak ditemukan saat opname", status: "completed" },
  { id: "mv-4", type: "transfer", product: "Lem Stick 40gr", sku: "LM-ST-40", category: "Lem", qty: 15, unit: "pcs", before: 30, after: 45, operator: "Dewi Kusuma", date: new Date(2024, 2, 14, 11, 30), ref: "TRF-JKT-BDG-003", notes: "Transfer dari cabang Jakarta ke Bandung", status: "completed" },
  { id: "mv-5", type: "return", product: "Sparepart Roller", sku: "SP-RL-001", category: "Sparepart", qty: 3, unit: "pcs", before: 7, after: 10, operator: "Budi Hartono", date: new Date(2024, 2, 13, 14, 45), ref: "RET-SUP-009", notes: "Retur barang cacat ke supplier", status: "completed" },
  { id: "mv-6", type: "in", product: "Kertas F4 80gr", sku: "KR-F4-80", category: "Kertas", qty: 5, unit: "rim", before: 8, after: 13, operator: "Budi Hartono", date: new Date(2024, 2, 13, 8, 0), ref: "PO-2024-0321", notes: "Restock rutin mingguan", status: "completed" },
  { id: "mv-7", type: "out", product: "Toner HP 85A", sku: "TN-85A", category: "Toner", qty: 2, unit: "pcs", before: 36, after: 34, operator: "Rini Susanti", date: new Date(2024, 2, 15, 11, 0), ref: "TX-2024-0413", notes: "Penjualan walk-in", status: "completed" },
  { id: "mv-8", type: "adjustment", product: "Kertas A4 70gr", sku: "KR-A4-70", category: "Kertas", qty: 1, unit: "rim", before: 35, after: 36, operator: "Ahmad Faiz", date: new Date(2024, 2, 15, 12, 30), ref: "ADJ-2024-0008", notes: "Koreksi stok setelah penerimaan", status: "pending" },
];
