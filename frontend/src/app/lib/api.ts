/**
 * API Client — Phase 0.1 (ADR-002: cookie-based auth).
 *
 * Semua request frontend ke backend FastAPI lewat instance `api` ini.
 * Auth ditangani via httpOnly cookie yang di-set oleh Next.js API proxy
 * routes (/api/auth/login, /api/auth/refresh) — browser attach cookie
 * otomatis via `credentials: "include"`. TIDAK ADA manual Bearer token.
 *
 * Error handling:
 * - Backend FastAPI umumnya return `{ detail: string }` atau Pydantic
 *   validation errors `{ detail: [{msg, type, loc}] }`.
 * - Response error dilempar sebagai `ApiError` dengan status + message
 *   yang sudah dinormalisasi.
 * - 401 unauthorized memancarkan event `auth:unauthorized` ke window
 *   supaya AuthContext (Phase 0.3) bisa trigger refresh atau logout.
 */

import { ofetch, type FetchOptions } from "ofetch";

/**
 * Base URL = Next.js proxy path, BUKAN backend langsung.
 * Architecture:
 *   FE (api client) → /api/backend/* (Next route) → backend FastAPI
 *
 * Kenapa proxy? ADR-002 pakai httpOnly cookie yang tidak bisa dibaca JS,
 * jadi Bearer header di-inject server-side oleh Next route handler
 * (lihat `frontend/app/api/backend/[...path]/route.ts`).
 *
 * Auth endpoints (login/logout/refresh/me) punya route khusus di
 * `/api/auth/*` yang handle Set-Cookie — panggil via helper di `lib/auth-client.ts`,
 * bukan via `api` instance ini.
 */
const API_URL = "/api/backend";

// ============================================================
// Error types
// ============================================================

interface PydanticErrorItem {
  msg: string;
  type: string;
  loc?: (string | number)[];
}

interface StructuredErrorDetail {
  message?: string;
  code?: string;
  [key: string]: unknown;
}

interface BackendErrorBody {
  detail?: string | PydanticErrorItem[] | StructuredErrorDetail;
  traceback?: string;
  code?: string;
  target_role?: string;
}

/**
 * Normalized API error.
 * Gunakan `error.status` untuk cek kode HTTP,
 * `error.message` untuk text yang siap tampil,
 * `error.raw` untuk payload mentah kalau butuh detail per-field.
 */
export class ApiError extends Error {
  public readonly status: number;
  public readonly raw: BackendErrorBody | undefined;
  public readonly fieldErrors: Record<string, string> | undefined;

  constructor(status: number, message: string, raw?: BackendErrorBody) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.raw = raw;
    this.fieldErrors = extractFieldErrors(raw);
  }
}

function extractFieldErrors(body: BackendErrorBody | undefined): Record<string, string> | undefined {
  if (!body || typeof body.detail === "string" || !Array.isArray(body.detail)) {
    return undefined;
  }
  const out: Record<string, string> = {};
  for (const item of body.detail) {
    const field = item.loc?.filter((x) => x !== "body").join(".") ?? "_";
    out[field] = item.msg;
  }
  return out;
}

function normalizeErrorMessage(body: BackendErrorBody | undefined, fallback: string): string {
  if (!body) return fallback;
  if (typeof body.detail === "string") return body.detail;
  if (Array.isArray(body.detail) && body.detail.length > 0) {
    return body.detail[0].msg;
  }
  if (
    body.detail &&
    typeof body.detail === "object" &&
    !Array.isArray(body.detail) &&
    typeof body.detail.message === "string"
  ) {
    return body.detail.message;
  }
  return fallback;
}

// ============================================================
// Event bus untuk cross-module signals
// ============================================================

/**
 * Event names yang di-emit oleh api client ke window.
 * Konsumen (AuthContext, UI toast, dll) pasang listener via
 * `window.addEventListener("auth:unauthorized", handler)`.
 */
export const API_EVENTS = {
  UNAUTHORIZED: "auth:unauthorized",
  FORBIDDEN: "auth:forbidden",
  MIRROR_READ_ONLY: "auth:mirror_read_only",
} as const;

function emitApiEvent(name: string, detail?: unknown) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(name, { detail }));
}

// ============================================================
// Main API instance
// ============================================================

export const api = ofetch.create({
  baseURL: API_URL,
  // ADR-002: cookie-based auth. credentials:"include" wajib supaya
  // browser ikut kirim httpOnly cookie cross-origin (FE di :3000, BE di :8000).
  credentials: "include",
  // Retry di level client = 0. Retry logic yang context-aware (misal
  // auto-refresh-then-retry saat 401) dikerjakan di Phase 0.3 auth layer.
  retry: 0,
  // Default timeout 30 detik — cocok untuk endpoint non-ML.
  // Endpoint ML/export besar override via per-call `{ timeout: ... }`.
  timeout: 30_000,

  onResponseError({ response }) {
    const body = response._data as BackendErrorBody | undefined;
    const message = normalizeErrorMessage(body, response.statusText || "Request failed");

    // Emit global signals untuk 401/403 sebelum throw, supaya layer
    // auth (Phase 0.3) bisa react tanpa harus intercept setiap call site.
    if (response.status === 401) {
      emitApiEvent(API_EVENTS.UNAUTHORIZED, { path: response.url });
    } else if (response.status === 403) {
      if (body?.code === "MIRROR_READ_ONLY") {
        emitApiEvent(API_EVENTS.MIRROR_READ_ONLY, {
          path: response.url,
          target_role: body.target_role,
          message,
        });
      }
      emitApiEvent(API_EVENTS.FORBIDDEN, { path: response.url });
    }

    throw new ApiError(response.status, message, body);
  },
});

// ============================================================
// Public types
// ============================================================

export type ApiRequestOptions = FetchOptions;

/**
 * Helper untuk query string builder yang skip undefined/null values.
 * Cocok untuk GET endpoint dengan banyak filter optional.
 *
 * @example
 *   api("/auth/users", { query: toQuery({ role: "cashier", is_active: true, empty: undefined }) })
 *   // → GET /auth/users?role=cashier&is_active=true
 */
export function toQuery(params: Record<string, unknown>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === "") continue;
    out[key] = String(value);
  }
  return out;
}
