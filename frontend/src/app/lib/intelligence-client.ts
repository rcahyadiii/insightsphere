/**
 * Intelligence Client — Typed helpers untuk Analytics / AI API.
 *
 * Endpoints yang tersedia di backend (prefix /api/analytics):
 *   GET /api/analytics/predictions  → daftar prediksi AI + reasoning text
 *   GET /api/analytics/metrics      → metrik kesehatan model AI
 *
 * Endpoint yang BELUM ada di backend:
 *   GET /api/analytics/explanations  → XAI reasoning per produk
 *   POST /api/analytics/simulate     → What-If Simulator
 */
import { api } from "@/app/lib/api";
import { toQuery } from "@/app/lib/api";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface AIPredictionLogResponse {
  id: string;
  store_nbr: number | null;
  branch_id: string | null;
  family: string | null;
  predicted_for_date: string;         // "YYYY-MM-DD"
  prediction_type: string;
  predicted_value: number;
  actual_value: number | null;
  recommended_stock: number | null;
  safety_stock_buffer: number | null;
  safety_stock_source: string | null;
  reasoning_text: string;
  model_version: string | null;
  horizon_days: number | null;
  product_id: string | null;
  prediction_level: string | null;   // "product" | "family"
  created_at: string;
}

export interface AIModelMetricResponse {
  id: string;
  store_nbr: number | null;
  model_name: string;
  metric_name: string;               // "accuracy" | "rmse" | "mape" | "r_squared" | ...
  metric_value: number;
  evaluated_at: string;              // ISO datetime
}

// ─── API Calls ───────────────────────────────────────────────────────────────

/**
 * Ambil prediksi AI + reasoning text.
 * GET /api/analytics/predictions
 */
export const fetchPredictions = (params?: {
  store_nbr?: number;
  predicted_for_date?: string;
  limit?: number;
  offset?: number;
}): Promise<AIPredictionLogResponse[]> =>
  api<AIPredictionLogResponse[]>("/api/analytics/predictions", {
    query: toQuery(params ?? {}),
  });

/**
 * Ambil metrik kesehatan model AI.
 * GET /api/analytics/metrics
 */
export const fetchModelMetrics = (params?: {
  model_name?: string;
  store_nbr?: number;
  limit?: number;
}): Promise<AIModelMetricResponse[]> =>
  api<AIModelMetricResponse[]>("/api/analytics/metrics", {
    query: toQuery(params ?? {}),
  });
