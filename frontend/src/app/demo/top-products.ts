type DemoTopProduct = {
  name: string;
  qtySold: number;
  revenue: number;
  pct: number;
  change: number;
};

type DemoTopProductPeriod = "daily" | "weekly" | "monthly";

export const DEMO_TOP_PRODUCTS: Record<DemoTopProductPeriod, DemoTopProduct[]> = {
  daily: [
    { name: "Beras Premium 5kg", qtySold: 45, revenue: 2925000, pct: 30.1, change: 8.3 },
    { name: "Teh Botol Sosro", qtySold: 38, revenue: 209000, pct: 22.4, change: 5.1 },
    { name: "Indomie Goreng", qtySold: 24, revenue: 2760000, pct: 14.2, change: 18.5 },
    { name: "Susu Ultra 1L", qtySold: 21, revenue: 388500, pct: 12.6, change: -1.2 },
    { name: "Minyak SunCo 2L", qtySold: 18, revenue: 684000, pct: 10.8, change: 0 },
  ],
  weekly: [
    { name: "Beras Premium 5kg", qtySold: 320, revenue: 20800000, pct: 28.5, change: 12.5 },
    { name: "Teh Botol Sosro", qtySold: 280, revenue: 1540000, pct: 21.2, change: 8.2 },
    { name: "Susu Ultra 1L", qtySold: 195, revenue: 3607500, pct: 14.9, change: -2.4 },
    { name: "Indomie Goreng", qtySold: 170, revenue: 19550000, pct: 13.1, change: 15 },
    { name: "Minyak SunCo 2L", qtySold: 148, revenue: 5624000, pct: 11.3, change: 0 },
  ],
  monthly: [
    { name: "Beras Premium 5kg", qtySold: 1280, revenue: 83200000, pct: 27.8, change: 6.4 },
    { name: "Susu Ultra 1L", qtySold: 960, revenue: 17760000, pct: 20.8, change: 11.2 },
    { name: "Teh Botol Sosro", qtySold: 870, revenue: 4785000, pct: 18.9, change: 3.7 },
    { name: "Indomie Goreng", qtySold: 620, revenue: 71300000, pct: 13.5, change: -4.1 },
    { name: "Chitato Original", qtySold: 510, revenue: 6120000, pct: 11.1, change: 22.3 },
  ],
};
