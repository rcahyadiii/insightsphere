/**
 * Finance Client — Typed helpers untuk Cash Session API.
 *
 * Endpoints yang tersedia di backend:
 *   POST /finance/cash-sessions/open        → buka shift kasir
 *   GET  /finance/cash-sessions             → list histori sesi kas
 *   GET  /finance/cash-sessions/{id}        → detail sesi kas
 *   PUT  /finance/cash-sessions/{id}/close  → tutup shift kasir
 *   POST /finance/cash-sessions/petty-cash  → catat pengeluaran petty cash
 */
import { api, toQuery } from "@/app/lib/api";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface CashSessionResponse {
  id: string;
  cashier_id: string;
  store_id: string;
  start_time: string;      // ISO datetime
  end_time: string | null;
  opening_balance: number;
  expected_closing_balance: number | null;
  actual_closing_balance: number | null;
  difference: number | null;
  status: "open" | "closed";
}

export interface CashSessionListResponse {
  items: CashSessionResponse[];
  total: number;
}

export interface PettyCashResponse {
  id: string;
  cash_session_id: string;
  amount: number;
  description: string;
  type: string;
  created_at: string; // ISO datetime
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Derive a deterministic pseudo-UUID from store_nbr.
 * Backend `store_id` kolom tidak memiliki FK constraint ke tabel stores,
 * sehingga UUID buatan ini diterima oleh database.
 */
export const storeIdFromNbr = (storeNbr: number | null): string =>
  `00000000-0000-0000-0000-${String(storeNbr ?? 1).padStart(12, "0")}`;

// ─── API Calls ───────────────────────────────────────────────────────────────

/**
 * Buka shift baru.
 * POST /finance/cash-sessions/open
 */
export const openShift = (
  cashierId: string,
  storeId: string,
  openingBalance: number
): Promise<CashSessionResponse> =>
  api<CashSessionResponse>("/finance/cash-sessions/open", {
    method: "POST",
    body: { cashier_id: cashierId, store_id: storeId, opening_balance: openingBalance },
  });

/**
 * Ambil histori sesi kas.
 * GET /finance/cash-sessions
 */
export const fetchCashSessions = (params?: {
  limit?: number;
  offset?: number;
}): Promise<CashSessionListResponse> =>
  api<CashSessionListResponse>("/finance/cash-sessions", {
    query: toQuery(params ?? {}),
  });

/**
 * Ambil detail sesi kas.
 * GET /finance/cash-sessions/{sessionId}
 */
export const fetchCashSessionDetail = (sessionId: string): Promise<CashSessionResponse> =>
  api<CashSessionResponse>(`/finance/cash-sessions/${sessionId}`);

/**
 * Tutup shift aktif dengan saldo aktual.
 * PUT /finance/cash-sessions/{sessionId}/close
 */
export const closeShift = (
  sessionId: string,
  actualClosingBalance: number
): Promise<CashSessionResponse> =>
  api<CashSessionResponse>(`/finance/cash-sessions/${sessionId}/close`, {
    method: "PUT",
    body: { actual_closing_balance: actualClosingBalance },
  });

/**
 * Catat pengeluaran petty cash dalam shift aktif.
 * POST /finance/cash-sessions/petty-cash
 */
export const recordPettyCash = (
  sessionId: string,
  amount: number,
  description: string,
  type: "expense" | "income" = "expense"
): Promise<PettyCashResponse> =>
  api<PettyCashResponse>("/finance/cash-sessions/petty-cash", {
    method: "POST",
    body: { cash_session_id: sessionId, amount, description, type },
  });
