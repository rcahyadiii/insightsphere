type DemoStockHistoryEntry = {
  id: string;
  date: string;
  productName: string;
  sku: string;
  type: "in" | "out" | "adjustment";
  quantity: number;
  finalStock: number;
  reason: string;
  user: string;
};

export const DEMO_STOCK_HISTORY: DemoStockHistoryEntry[] = [
  { id: "sh001", date: "2026-04-21 14:30", productName: "Beras Premium 5kg", sku: "B001", type: "in", quantity: 200, finalStock: 350, reason: "Restok dari supplier", user: "Admin" },
  { id: "sh002", date: "2026-04-21 10:15", productName: "Minyak SunCo 2L", sku: "M019", type: "out", quantity: 5, finalStock: 15, reason: "Produk rusak/expired", user: "Kasir-02" },
  { id: "sh003", date: "2026-04-20 16:45", productName: "Indomie Goreng", sku: "I003", type: "in", quantity: 50, finalStock: 65, reason: "Restok dari supplier", user: "Admin" },
  { id: "sh004", date: "2026-04-20 09:00", productName: "Susu Ultra 1L", sku: "S004", type: "adjustment", quantity: 45, finalStock: 45, reason: "Penyesuaian stock opname", user: "Admin" },
  { id: "sh005", date: "2026-04-19 17:20", productName: "Teh Botol Sosro", sku: "T002", type: "in", quantity: 100, finalStock: 180, reason: "Pengiriman rutin", user: "Admin" },
  { id: "sh006", date: "2026-04-19 11:30", productName: "Gula Pasir 1kg", sku: "G005", type: "out", quantity: 3, finalStock: 42, reason: "Retur customer", user: "Kasir-01" },
  { id: "sh007", date: "2026-04-18 14:00", productName: "Minuman Isotonik Mizone", sku: "M006", type: "in", quantity: 60, finalStock: 72, reason: "Restok", user: "Admin" },
  { id: "sh008", date: "2026-04-18 08:45", productName: "Beras Premium 5kg", sku: "B001", type: "adjustment", quantity: 150, finalStock: 150, reason: "Stock opname akhir minggu", user: "Admin" },
];
