import { api, ApiError, toQuery } from "../lib/api";
import { StoreTransactionCreate, TransactionCreate, TransactionResponse } from "../types/pos";

export interface TransactionSummaryResponse {
  total_revenue: number;
  total_transactions: number;
  total_items: number;
  payment_methods: Array<{ method: string; count: number; total: number }>;
  series: Array<{ date: string; revenue: number; transactions: number }>;
}

export const fetchTransactionSummary = (params: {
  date_from: string;
  date_to: string;
  store_nbr?: number;
  group_by?: "day" | "week" | "month";
}): Promise<TransactionSummaryResponse> =>
  api<TransactionSummaryResponse>("/transactions/summary", {
    query: toQuery(params),
  });

/**
 * Transaction Service — Menangani pengiriman data transaksi Kasir ke Backend.
 * 
 * Sesuai [HARDENED] plan:
 * 1. Mendukung Idempotency via client_txn_id.
 * 2. Menampung logika filter error 409 (Conflict/Race Condition).
 */
export const transactionService = {
  /**
   * Mengirim satu transaksi tunggal ke backend.
   * 
   * @throws {ApiError} Jika status 409, berarti ada race condition pada stok.
   */
  async createTransaction(payload: TransactionCreate | StoreTransactionCreate): Promise<TransactionResponse> {
    try {
      return await api<TransactionResponse>("/transactions/", {
        method: "POST",
        body: payload,
      });
    } catch (error) {
      if (error instanceof ApiError && error.status === 409) {
        // Normalisasi pesan error untuk race condition agar mudah ditangkap UI
        console.error("Race condition detected: Stock version mismatch.");
        throw new Error("STOK_CONFLICT");
      }
      throw error;
    }
  },

  /**
   * Sinkronisasi tumpukan transaksi offline (Batch Sync).
   * Digunakan oleh fitur PWA offline-first di Phase selanjutnya.
   */
  async syncBatch(transactions: Array<TransactionCreate | StoreTransactionCreate>): Promise<TransactionResponse[]> {
    return await api<TransactionResponse[]>("/transactions/batch", {
      method: "POST",
      body: { transactions },
    });
  },

  /**
   * Mengambil semua transaksi (admin / owner).
   * GET /transactions/?skip=&limit=&date_from=&date_to=&cashier_id=
   */
  async fetchTransactions(params?: {
    skip?: number;
    limit?: number;
    date_from?: string;
    date_to?: string;
    cashier_id?: string;
  }): Promise<TransactionResponse[]> {
    return await api<TransactionResponse[]>("/transactions/", {
      query: toQuery(params ?? {}),
    });
  },

  /**
   * Mengambil transaksi milik kasir yang sedang login.
   * GET /transactions/mine?skip=&limit=&date_from=&date_to=
   */
  async fetchMyTransactions(params?: {
    skip?: number;
    limit?: number;
    date_from?: string;
    date_to?: string;
  }): Promise<TransactionResponse[]> {
    return await api<TransactionResponse[]>("/transactions/mine", {
      query: toQuery(params ?? {}),
    });
  },
};
