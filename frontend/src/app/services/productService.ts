import { api } from "../lib/api";
import { isDemoDataEnabled } from "@/app/lib/demo-mode";
import type { Product } from "../types/pos";

interface InventoryStockItem {
  product_id: string;
  product_sku: string;
  product_name: string;
  product_category: string;
  product_family?: string;
  product_unit?: string;
  product_price?: number;
  product_image_url?: string;
  current_stock: number;
  version: number;
  is_service?: boolean;
  min_qty?: number;
  custom_price?: boolean;
  price_hint?: string;
}

/**
 * Product Service — Logic pengambilan data produk & stok untuk Kasir.
 * 
 * Target endpoint: GET /inventory/stock
 * Demo fallback hanya aktif jika NEXT_PUBLIC_ENABLE_DEMO_DATA=true.
 */
export const productService = {
  /**
   * Mengambil daftar produk untuk POS berdasarkan cabang kasir.
   */
  async getPOSProducts(store_nbr?: number): Promise<Product[]> {
    try {
      const params = store_nbr ? { store_nbr } : {};
      const response = await api<InventoryStockItem[]>("/inventory/stock", { query: params });
      return response.map((item) => ({
        id: item.product_id,
        sku: item.product_sku,
        name: item.product_name,
        category: item.product_category,
        family: item.product_family || "umum",
        unit: item.product_unit || "pcs",
        base_price: item.product_price || 0,
        image_url: item.product_image_url,
        current_stock: item.current_stock,
        version: item.version,
        is_service: item.is_service,
        min_qty: item.min_qty,
        custom_price: item.custom_price,
        price_hint: item.price_hint,
      }));
    } catch (error) {
      if (isDemoDataEnabled()) {
        const { DEMO_POS_PRODUCTS } = await import("@/app/demo/pos-products");
        return DEMO_POS_PRODUCTS;
      }

      throw error;
    }
  },

  /**
   * Pencarian produk (lokal atau remote).
   */
  async searchProducts(query: string, store_nbr?: number): Promise<Product[]> {
    const all = await this.getPOSProducts(store_nbr);
    const q = query.toLowerCase();
    return all.filter(p =>
      p.name.toLowerCase().includes(q) ||
      p.sku.toLowerCase().includes(q)
    );
  }
};
