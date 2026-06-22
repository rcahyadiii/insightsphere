type DemoLowStockItem = {
  id: string;
  name: string;
  sku: string;
  currentStock: number;
  minThreshold: number;
  unit: string;
  restockRecommendation: number;
};

export const DEMO_LOW_STOCK: DemoLowStockItem[] = [
  { id: "1", name: "Minyak SunCo 2L", sku: "M019", currentStock: 5, minThreshold: 40, unit: "botol", restockRecommendation: 80 },
  { id: "2", name: "Minuman Isotonik Mizone", sku: "M006", currentStock: 12, minThreshold: 40, unit: "botol", restockRecommendation: 60 },
  { id: "3", name: "Indomie Goreng (Karton)", sku: "I003", currentStock: 15, minThreshold: 20, unit: "karton", restockRecommendation: 40 },
  { id: "4", name: "Susu Ultra 1L", sku: "S004", currentStock: 45, minThreshold: 40, unit: "pcs", restockRecommendation: 80 },
];
