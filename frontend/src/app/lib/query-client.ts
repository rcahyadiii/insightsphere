/**
 * QueryClient factory — Phase 0.2.
 *
 * Konfigurasi default TanStack Query yang dipakai di seluruh app.
 * Dipisah ke modul ini supaya:
 *   1. Bisa di-reuse di test setup (override `retry: 0` untuk test).
 *   2. Next.js API routes bisa pakai client yang sama kalau perlu prefetch SSR.
 *   3. Satu sumber kebenaran untuk staleTime / retry / refetch behavior.
 *
 * Integrasi dengan `lib/api.ts`:
 * - Query/mutation melempar `ApiError` dari ofetch — `retry` logic di bawah
 *   skip retry untuk 4xx (client error = tidak akan sukses dengan retry).
 */

import { QueryClient, type DefaultOptions } from "@tanstack/react-query";
import { ApiError } from "./api";

const defaultOptions: DefaultOptions = {
  queries: {
    // 60 detik = balance antara "data fresh" dan "jangan spam request".
    // Page yang butuh real-time (POS cart, notif) override via `staleTime: 0`.
    staleTime: 60_000,

    // Garbage collect cache setelah 5 menit unmount — cukup untuk tab switch
    // tanpa kehilangan data, tapi tidak bloat memory.
    gcTime: 5 * 60_000,

    // Retry 2x untuk network/5xx error. SKIP retry untuk 4xx (ADR-002:
    // 401 akan di-handle oleh event bus `auth:unauthorized`, retry tidak membantu).
    retry: (failureCount, error) => {
      if (error instanceof ApiError && error.status >= 400 && error.status < 500) {
        return false;
      }
      return failureCount < 2;
    },

    // Exponential backoff: 1s, 2s, 4s (cap 30s).
    retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 30_000),

    // Refetch on focus OFF — retail use case: user klik tab lain lalu balik,
    // tidak perlu auto-refresh. Eksplisit via `refetch()` kalau butuh.
    refetchOnWindowFocus: false,

    // Refetch saat reconnect ON — penting untuk offline-first PWA (Phase 4):
    // saat koneksi balik, data stale di-refresh otomatis.
    refetchOnReconnect: true,
  },
  mutations: {
    // Mutation tidak di-retry — sisi user harus eksplisit klik ulang supaya
    // tidak ada double-submit untuk POST /transactions, PATCH /users, dll.
    retry: false,
  },
};

/**
 * Factory — dipanggil sekali di App.tsx via useState lazy init.
 * Test setup bisa override: `createQueryClient({ queries: { retry: 0 } })`.
 */
export function createQueryClient(overrides?: Partial<DefaultOptions>): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: { ...defaultOptions.queries, ...overrides?.queries },
      mutations: { ...defaultOptions.mutations, ...overrides?.mutations },
    },
  });
}
