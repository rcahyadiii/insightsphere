type DemoInventoryProduct = {
  id: string;
  sku: string;
  name: string;
  category: string;
  location: string;
  stock: number;
  minStock: number;
  maxStock: number;
  reorderPoint: number;
  supplier: string;
  lastRestock: string;
  price: number;
  avgDailyDemand: number;
  trend: number[];
};

export const DEMO_INVENTORY_PRODUCTS: DemoInventoryProduct[] = [
  { id: "1", sku: "B001", name: "Beras Premium 5kg", category: "SEMBAKO", location: "Rak A1", stock: 120, minStock: 50, maxStock: 500, reorderPoint: 80, supplier: "PT Beras Nusantara", lastRestock: "2026-04-10", price: 65000, avgDailyDemand: 45, trend: [240, 210, 190, 160, 140, 130, 120] },
  { id: "2", sku: "T002", name: "Teh Botol Sosro 450ml", category: "MINUMAN", location: "Rak B2", stock: 180, minStock: 50, maxStock: 300, reorderPoint: 100, supplier: "PT Sinar Sosro", lastRestock: "2026-04-12", price: 5500, avgDailyDemand: 12, trend: [200, 195, 190, 188, 185, 182, 180] },
  { id: "3", sku: "I003", name: "Indomie Goreng (Karton)", category: "MIE INSTAN", location: "Rak A3", stock: 15, minStock: 20, maxStock: 100, reorderPoint: 40, supplier: "PT Indofood", lastRestock: "2026-04-05", price: 115000, avgDailyDemand: 8, trend: [50, 42, 35, 28, 22, 18, 15] },
  { id: "4", sku: "S004", name: "Susu Ultra 1L", category: "DAIRY", location: "Freezer F1", stock: 240, minStock: 40, maxStock: 1000, reorderPoint: 80, supplier: "PT Ultra Jaya", lastRestock: "2026-04-14", price: 18500, avgDailyDemand: 40, trend: [350, 320, 300, 280, 265, 250, 240] },
  { id: "5", sku: "C005", name: "Chitato Original 68g", category: "SNACK", location: "Rak C1", stock: 68, minStock: 30, maxStock: 200, reorderPoint: 60, supplier: "PT Indofood CBP", lastRestock: "2026-04-11", price: 12000, avgDailyDemand: 15, trend: [120, 110, 100, 90, 82, 75, 68] },
  { id: "6", sku: "M006", name: "Minuman Isotonik Mizone", category: "MINUMAN", location: "Rak B2", stock: 12, minStock: 40, maxStock: 200, reorderPoint: 70, supplier: "PT Danone Indonesia", lastRestock: "2026-03-28", price: 6000, avgDailyDemand: 10, trend: [45, 40, 35, 30, 22, 15, 12] },
  { id: "19", sku: "M019", name: "Minyak SunCo 2L", category: "SEMBAKO", location: "Rak A2", stock: 5, minStock: 40, maxStock: 200, reorderPoint: 80, supplier: "PT Musim Mas", lastRestock: "2026-03-25", price: 38000, avgDailyDemand: 30, trend: [60, 50, 42, 35, 20, 10, 5] },
  { id: "20", sku: "N020", name: "Nestle Koko Krunch", category: "CEREAL", location: "Rak C3", stock: 85, minStock: 15, maxStock: 100, reorderPoint: 30, supplier: "PT Nestle Indonesia", lastRestock: "2026-04-04", price: 42000, avgDailyDemand: 2, trend: [95, 93, 91, 90, 88, 87, 85] },
];
