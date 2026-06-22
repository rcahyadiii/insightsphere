import { useQuery } from "@tanstack/react-query";
import { productService } from "../services/productService";
import { Product } from "../types/pos";

/**
 * Hook untuk mengelola data produk & stok untuk UI Kasir.
 * 
 * Menggunakan React Query untuk:
 * 1. Caching data produk agar perpindahan antar tab (Transaksi <-> Cek Stok) instan.
 * 2. Background refetching agar data stok tetap segar.
 * 3. Local filtering & searching untuk performa maksimal.
 */
export function useProducts(store_nbr?: number) {
  // Query utama untuk fetch semua produk & stok
  const query = useQuery<Product[]>({
    queryKey: ["pos", "products", store_nbr],
    queryFn: () => productService.getPOSProducts(store_nbr),
    // Stale time pendek (30s) karena stok berubah cepat di lingkungan Kasir
    staleTime: 30_000,
    refetchOnWindowFocus: true,
  });

  /**
   * Helper untuk mencari produk dari cache secara sinkron.
   * Dipakai di UI search bar untuk hasil instan tanpa loading state.
   */
  const searchInCache = (searchQuery: string, category: string = "all"): Product[] => {
    if (!query.data) return [];
    
    const q = searchQuery.toLowerCase();
    return query.data.filter(p => {
      const matchSearch = p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q);
      const matchCategory = category === "all" || p.category === category;
      return matchSearch && matchCategory;
    });
  };

  /**
   * Mengambil daftar kategori unik untuk filter tab sidebar.
   */
  const categories = Array.from(new Set(query.data?.map(p => p.category) || []));

  return {
    ...query,
    products: query.data || [],
    searchInCache,
    categories,
    // Shortcut flags
    isInitialLoading: query.isPending,
  };
}
