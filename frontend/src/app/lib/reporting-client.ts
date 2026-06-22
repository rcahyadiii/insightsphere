/**
 * Reporting Client — typed helpers untuk Reporting / Export API.
 *
 * Backend endpoints:
 *   GET  /reporting/templates
 *   GET  /reporting/dashboard-stats
 *   POST /reporting/export
 *   GET  /reporting/history
 */
import { api, toQuery } from "@/app/lib/api";

export type ExportType = "SALES" | "PREDICTION" | "PROFIT_LOSS" | "WASTAGE";
export type ExportFormat = "CSV" | "XLSX";
export type ExportPeriod = "week" | "month" | "quarter" | "year";

export interface TemplateInfo {
  export_type: ExportType;
  label: string;
  description: string;
  columns: string[];
}

export interface ExportHistoryItem {
  id: string;
  requested_by: string | null;
  export_type: ExportType;
  export_format: ExportFormat;
  period: ExportPeriod;
  store_nbr: number | null;
  row_count: number;
  filename: string;
  created_at: string;
}

export interface ExportRequestPayload {
  export_type: ExportType;
  period: ExportPeriod;
  export_format: ExportFormat;
  store_nbr?: number;
}

export interface ExportDownloadResult {
  blob: Blob;
  filename: string;
  rowCount: number;
}

export interface ReportingDashboardStatsResponse {
  revenue: number;
  transactions: number;
  average_order_value: number;
  gross_margin: number;
  inventory_value: number;
  low_stock_count: number;
}

const parseFilename = (contentDisposition: string | null, fallback: string) => {
  if (!contentDisposition) return fallback;

  const match = /filename="?([^";]+)"?/i.exec(contentDisposition);
  return match?.[1] ?? fallback;
};

export const fetchReportTemplates = (): Promise<TemplateInfo[]> =>
  api<TemplateInfo[]>("/reporting/templates");

export const fetchExportHistory = (limit = 20): Promise<ExportHistoryItem[]> =>
  api<ExportHistoryItem[]>("/reporting/history", {
    query: toQuery({ limit }),
  });

export const fetchReportingDashboardStats = (params?: {
  period?: ExportPeriod;
  store_nbr?: number;
}): Promise<ReportingDashboardStatsResponse> =>
  api<ReportingDashboardStatsResponse>("/reporting/dashboard-stats", {
    query: toQuery(params ?? {}),
  });

export const exportReport = async (payload: ExportRequestPayload): Promise<ExportDownloadResult> => {
  const response = await api.raw<Blob, "blob">("/reporting/export", {
    method: "POST",
    headers: {
      Accept: "*/*",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
    responseType: "blob",
    timeout: 60_000,
  });

  const blob = response._data;
  if (!blob) throw new Error("Export failed: empty response body");
  const filename = parseFilename(
    response.headers.get("Content-Disposition"),
    `${payload.export_type.toLowerCase()}_${payload.period}.${payload.export_format.toLowerCase()}`,
  );
  const rowCount = Number(response.headers.get("X-Row-Count") ?? 0);

  return { blob, filename, rowCount };
};

export const saveBlobAsFile = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.style.display = "none";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
};
