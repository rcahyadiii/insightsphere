/**
 * Inventory API Client — Fase 3.
 *
 * Semua request lewat catch-all proxy /api/backend/[...path]
 * yang sudah inject Bearer token dari httpOnly cookie.
 *
 * Gunakan `api` dari @/app/lib/api.ts.
 */

import { api, toQuery } from "@/app/lib/api";

// ============================================================
// Backend response types
// ============================================================

export interface BackendProduct {
  id: string;
  sku: string;
  name: string;
  family?: string | null;
  category?: string | null;
  unit?: string | null;
  base_price: number;
  default_price?: number | null;
  cost_price?: number | null;
  supplier?: string | null;
  is_active: boolean;
  image_url?: string | null;
  created_at: string;
  updated_at: string;
}

export interface BackendInventoryItem {
  id: string;           // inventory record ID
  product_id: string;   // product ID
  store_nbr: number;
  current_stock: number;
  min_stock: number;
  max_stock: number;
  reorder_point: number;
  location?: string | null;
  last_restock_date?: string | null;
  version: number;
  created_at: string;
  updated_at: string;

  // Computed by service layer
  status?: string | null;
  days_remaining?: number | null;
  product_name?: string | null;
  product_sku?: string | null;
  product_category?: string | null;
  product_family?: string | null;
  product_unit?: string | null;
  product_price?: number | null;
  product_image_url?: string | null;
}

export interface BackendStockSummary {
  total_products: number;
  safe: number;
  low: number;
  critical: number;
  overstock: number;
  out_of_stock: number;
  total_inventory_value: number;
}

export interface BackendFilterOptions {
  families: string[];
  categories: string[];
}

// ============================================================
// Request types
// ============================================================

export interface ProductCreateRequest {
  sku: string;
  name: string;
  family: string;
  category: string;
  unit: string;
  base_price: number;
  default_price: number;
  cost_price?: number;
  supplier?: string;
}

export interface ProductUpdateRequest {
  name?: string;
  family?: string;
  category?: string;
  unit?: string;
  base_price?: number;
  default_price?: number;
  cost_price?: number;
  supplier?: string;
  is_active?: boolean;
}

export interface InventoryCreateRequest {
  product_id: string;
  store_nbr: number;
  current_stock: number;
  min_stock: number;
  max_stock: number;
  reorder_point: number;
  location?: string;
}

export interface StockMovementRequest {
  inventory_id: string;
  movement_type: "IN" | "OUT" | "ADJUSTMENT" | "WASTE";
  quantity: number;
  reason: string;
  performed_by?: string;
}

// ============================================================
// API helpers
// ============================================================

export const fetchInventoryStock = (params?: { store_nbr?: number; limit?: number; skip?: number }) =>
  api<BackendInventoryItem[]>("/inventory/stock", {
    query: toQuery({
      store_nbr: params?.store_nbr,
      limit: params?.limit ?? 500,
      skip: params?.skip,
    }),
  });

export const fetchStockSummary = (store_nbr?: number) =>
  api<BackendStockSummary>("/inventory/stock/summary", {
    query: toQuery({ store_nbr }),
  });

export const fetchFilterOptions = () =>
  api<BackendFilterOptions>("/inventory/products/filters");

export const createProduct = (data: ProductCreateRequest) =>
  api<BackendProduct>("/inventory/products", {
    method: "POST",
    body: data,
  });

export const updateProduct = (id: string, data: ProductUpdateRequest) =>
  api<BackendProduct>(`/inventory/products/${id}`, {
    method: "PUT",
    body: data,
  });

export const softDeleteProduct = (id: string) =>
  api<{ message: string }>(`/inventory/products/${id}`, {
    method: "DELETE",
  });

export const createInventoryStock = (data: InventoryCreateRequest) =>
  api<BackendInventoryItem>("/inventory/stock", {
    method: "POST",
    body: data,
  });

export const recordStockMovement = (data: StockMovementRequest) =>
  api<{ id: string; inventory_id: string; movement_type: string; quantity: number; created_at: string }>(
    "/inventory/stock/movement",
    {
      method: "POST",
      body: data,
    }
  );