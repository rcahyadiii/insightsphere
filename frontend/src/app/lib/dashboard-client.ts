/**
 * Dashboard Client — typed helpers untuk Dashboard Aggregat API.
 *
 * Backend endpoints:
 *   GET /dashboard/overview           →  DashboardOverviewResponse
 *   GET /inventory/stock/summary       →  StockSummaryResponse
 *   GET /inventory/stock               →  InventoryStockItem[] (filter LOW/CRITICAL client-side)
 *   GET /transactions/summary/today    →  TodaySummaryResponse
 */
import { api, toQuery } from "@/app/lib/api";

export interface StockSummaryResponse {
  total_products: number;
  safe: number;
  low: number;
  critical: number;
  overstock: number;
  out_of_stock: number;
  total_inventory_value: number;
}

export interface TodaySummaryResponse {
  date: string;
  branch_id: string;
  total_transactions: number;
  total_revenue: number;
}

export interface DashboardOverviewResponse {
  today: {
    revenue: number;
    transactions: number;
    items_sold: number;
  };
  inventory: StockSummaryResponse;
  model: {
    accuracy: number | null;
    metric_source: string | null;
  };
  branch_comparison: Array<{
    store_nbr: number;
    name: string;
    revenue: number;
    transactions: number;
    stock_health: number;
  }>;
  period_kpis: Array<{
    period: "today" | "week" | "month" | string;
    revenue: number;
    transactions: number;
  }>;
}

export interface InventoryStockItem {
  id: string;
  product_id: string;
  store_nbr: number;
  current_stock: number;
  min_stock: number;
  max_stock: number;
  reorder_point: number;
  location: string | null;
  status: string | null;
  product_name: string | null;
  product_sku: string | null;
  product_unit: string | null;
}

export const fetchStockSummary = (storeNbr?: number): Promise<StockSummaryResponse> =>
  api<StockSummaryResponse>("/inventory/stock/summary", {
    query: toQuery({ store_nbr: storeNbr }),
  });

export const fetchTodaySummary = (): Promise<TodaySummaryResponse> =>
  api<TodaySummaryResponse>("/transactions/summary/today");

export const fetchDashboardOverview = (params?: { store_nbr?: number }): Promise<DashboardOverviewResponse> =>
  api<DashboardOverviewResponse>("/dashboard/overview", {
    query: toQuery(params ?? {}),
  });

export const fetchLowStockAlerts = async (
  storeNbr?: number,
  limit = 100,
): Promise<InventoryStockItem[]> => {
  const items = await api<InventoryStockItem[]>("/inventory/stock", {
    query: toQuery({ store_nbr: storeNbr, limit }),
  });
  return items.filter((i) => i.status === "LOW" || i.status === "CRITICAL");
};
