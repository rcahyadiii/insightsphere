/**
 * POS Domain Types — InsightSphere.
 * 
 * Mendefinisikan kontrak data antara frontend Kasir dan backend Sales/Inventory.
 */

/**
 * Representasi Produk di sisi Kasir.
 * Menggabungkan data Katalog dan data Stok (Inventory).
 */
export interface Product {
  id: string;
  sku: string;
  name: string;
  category: string;
  family: string;
  unit: string;
  base_price: number;
  image_url?: string;
  current_stock: number;
  version: number; // Optimistic Locking
  is_service?: boolean;   // Flag untuk service item (layanan fotokopi, print, dll)
  min_qty?: number;       // Minimum order qty (e.g. 5 untuk Cetak Foto)
  custom_price?: boolean; // Kasir menentukan harga saat transaksi (Print HQ, Jasa Edit)
  price_hint?: string;    // Panduan harga untuk custom_price (e.g. "Rp 3.000 – 5.000")
}

/**
 * Item yang sedang ada di dalam Keranjang Belanja.
 */
export interface CartItem {
  product_id: string;
  sku: string;
  name: string;
  price: number;
  quantity: number;
  unit: string;
  image_url?: string;
  version_at_add: number;
  discount_pct?: number;  // Diskon per item (%)
  is_service?: boolean;   // Flag service item
  min_qty?: number;       // Carried from Product — enforced in cart
  custom_price?: boolean; // Kasir bisa edit harga langsung di cart
}

/**
 * Payload untuk membuat transaksi baru (POST /sales/transactions).
 */
export interface TransactionCreate {
  branch_id: string;
  date: string; // Format: YYYY-MM-DD
  time: string; // Format: HH:mm:ss
  payment_method: "CASH" | "QRIS";
  cashier_id?: string;
  client_txn_id?: string; // Untuk Idempotency/Offline Sync
  items: TransactionItemCreate[];
}

export interface StoreTransactionCreate extends Omit<TransactionCreate, "branch_id"> {
  store_nbr: number;
  cashier_id: string;
  client_txn_id: string;
}

export interface TransactionItemCreate {
  product_id: string;
  quantity: number;
  unit_price_at_time: number;
  version_at_transaction: number; // Untuk validation Optimistic Locking di backend
}

export interface TransactionResponse {
  id: string;
  branch_id?: string | null;
  date?: string | null;        // "YYYY-MM-DD"
  time?: string | null;        // "HH:mm:ss"
  total_amount: number;
  payment_method?: string | null;
  cashier_id?: string | null;
  cash_session_id?: string | null;
  client_txn_id?: string | null;
  _mock?: boolean;
}

/**
 * Ringkasan Kalkulasi Keranjang.
 */
export interface CartSummary {
  subtotal: number;
  discount: number; // Total diskon (item + transaksi)
  tax: number;
  total: number;
  itemCount: number;
}
