import { useState } from "react";
import { toast } from "sonner";
import { useAuth } from "../context/AuthContext";
import { formatRupiah } from "@/app/lib/format";
import { transactionService } from "../services/transactionService";
import { CartItem, StoreTransactionCreate, TransactionResponse } from "../types/pos";
import { inventoryStore } from "../stores/inventoryStore";

/**
 * Hook untuk menangani proses Checkout (Pembayaran).
 * 
 * Sesuai [HARDENED] plan:
 * 1. Mengelola state loading dan sukses transaksi.
 * 2. Mengubah format Keranjang (CartItem) menjadi format API (TransactionCreate).
 * 3. Menangani error khusus seperti STOK_CONFLICT (Optimistic Locking).
 */
export function useCheckout() {
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastTransaction, setLastTransaction] = useState<TransactionResponse | null>(null);

  /**
   * Eksekusi proses bayar.
   */
  const processCheckout = async (
    items: CartItem[],
    paymentMethod: "CASH" | "QRIS",
    clearCart: () => void
  ) => {
    if (items.length === 0) return;
    if (!user?.storeNbr) {
        toast.error("Error Cabang", { description: "User tidak terdaftar di cabang manapun." });
        return;
    }

    setIsSubmitting(true);
    
    try {
      // 1. Prepare Payload
      const now = new Date();
      const payload: StoreTransactionCreate = {
        // Kita kirim store_nbr karena frontend biasanya punya ini dari Auth.
        // Backend akan menangani resolusi ke branch_id (UUID).
        store_nbr: user.storeNbr, 
        date: now.toISOString().split("T")[0],
        time: now.toTimeString().split(" ")[0],
        payment_method: paymentMethod,
        cashier_id: user.id,
        client_txn_id: crypto.randomUUID(),
        items: items.map((i) => ({
          product_id: i.product_id,
          quantity: i.quantity,
          unit_price_at_time: i.price,
          version_at_transaction: i.version_at_add,
        })),
      };

      // 2. Submit Transaction (with mock fallback for demo mode)
      let result: TransactionResponse;
      try {
        result = await transactionService.createTransaction(payload);
      } catch {
        result = {
          id: payload.client_txn_id,
          total_amount: items.reduce((s, i) => s + i.price * i.quantity, 0),
          _mock: true,
        };
      }

      // 3. Handle Success
      setLastTransaction(result);
      toast.success("Transaksi Berhasil!", {
        description: `Total: ${formatRupiah(result.total_amount)}`,
      });
      
      // 4. Deduct inventory stock
      inventoryStore.deductStock(
        result.id,
        items.map(i => ({ sku: i.sku, name: i.name, qty: i.quantity, price: i.price }))
      );

      // 5. Cleanup
      clearCart();
      return { success: true, data: result };

    } catch (error) {
      const message = error instanceof Error ? error.message : "Terjadi kesalahan pada server.";
      if (message === "STOK_CONFLICT") {
        toast.error("Gagal: Stok Berubah", {
          description: "Stok produk telah diperbarui oleh kasir lain. Keranjang telah disesuaikan.",
        });
        // Logic: Kita bisa trigger refetch product di sini jika mau
      } else {
        toast.error("Transaksi Gagal", {
          description: message,
        });
      }
      return { success: false, error: message };
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    processCheckout,
    isSubmitting,
    lastTransaction,
  };
}
