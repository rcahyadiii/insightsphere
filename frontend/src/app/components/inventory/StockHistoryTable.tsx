"use client";

import { useEffect, useState } from "react";
import { History, PackagePlus, PackageMinus, RefreshCcw, Download, X, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/app/lib/utils";
import { T } from "@/app/lib/typography";
import { R } from "@/app/lib/radii";
import { E, Z } from "@/app/lib/elevation";
import { TABLE } from "@/app/lib/data";
import { MODAL } from "@/app/lib/containers";
import { BACKDROP } from "@/app/lib/utility";
import { useTranslation } from "@/app/i18n";
import { ResponsiveTable } from "@/app/components/ui/ResponsiveTable";
import { isDemoDataEnabled } from "@/app/lib/demo-mode";

interface StockHistoryEntry {
  id: string;
  date: string;
  productName: string;
  sku: string;
  type: "in" | "out" | "adjustment";
  quantity: number;
  finalStock: number;
  reason: string;
  user: string;
}

interface StockHistoryTableProps {
  onClose: () => void;
}

const ITEMS_PER_PAGE = 6;

function exportHistoryToCSV(data: StockHistoryEntry[], filename: string) {
  const headers = ["Tanggal", "Produk", "SKU", "Tipe", "Qty", "Stok Akhir", "Alasan", "User"];
  const rows = data.map(e => [
    e.date, e.productName, e.sku, e.type, e.quantity, e.finalStock, e.reason, e.user
  ]);
  const csv = [headers, ...rows].map(row => row.map(v => `"${v}"`).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function StockHistoryTable({ onClose }: StockHistoryTableProps) {
  const { t } = useTranslation();
  const [history, setHistory] = useState<StockHistoryEntry[]>([]);
  const [page, setPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(history.length / ITEMS_PER_PAGE));
  const paginatedData = history.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  useEffect(() => {
    if (!isDemoDataEnabled()) return;

    let cancelled = false;
    void import("@/app/demo/stock-history").then(({ DEMO_STOCK_HISTORY }) => {
      if (!cancelled) setHistory(DEMO_STOCK_HISTORY);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  const typeConfig = {
    in: { label: t("inv.history.in"), icon: PackagePlus, color: "emerald" },
    out: { label: t("inv.history.out"), icon: PackageMinus, color: "rose" },
    adjustment: { label: t("inv.history.adjustment"), icon: RefreshCcw, color: "amber" },
  };

  return (
    <div className={cn(BACKDROP.overlay, Z.overlay, MODAL.wrapper, "animate-in fade-in duration-200")}>
      <div className={cn(R.xl, E["2xl"], "bg-white dark:bg-slate-900 w-full max-w-4xl overflow-hidden border border-slate-200/50 dark:border-slate-700 animate-in slide-in-from-bottom-8 duration-500 flex flex-col", MODAL.maxHeight.md)}>
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className={cn(R.md, "size-10 bg-slate-100 dark:bg-slate-800 flex items-center justify-center")}>
              <History className="size-5 text-slate-600 dark:text-slate-400" />
            </div>
            <div>
              <h2 className={cn(T.h3, "text-slate-900 dark:text-slate-100")}>{t("inv.history.title")}</h2>
              <p className={cn(T.caption, "text-slate-400")}>
                {history.length} entries
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => exportHistoryToCSV(history, `riwayat-stok-${new Date().toISOString().slice(0,10)}.csv`)}
              className={cn(T.buttonSm, R.sm, "px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all flex items-center gap-1.5 cursor-pointer")}
            >
              <Download className="size-3" /> {t("inv.history.export_csv")}
            </button>
            <button onClick={onClose} className={cn(R.sm, "p-2 text-slate-300 hover:text-slate-600 transition-colors")}>
              <X className="size-5" />
            </button>
          </div>
        </div>

        {/* Table */}
        <ResponsiveTable
          label={t("inv.history.title")}
          className="flex-1 min-h-0"
          scrollerClassName="h-full rounded-none border-0 bg-transparent overflow-auto"
          minWidthClassName={TABLE.minWidth.stockHistory}
        >
          <table className={TABLE.base} aria-label={t("inv.history.title")}>
            <thead className={cn(TABLE.head, TABLE.stickyHead, "bg-slate-50 dark:bg-slate-800")}>
              <tr>
                <th className={cn(TABLE.headCell, TABLE.stickyColumn, "bg-slate-50 dark:bg-slate-800")}>{t("inv.history.date")}</th>
                <th className={TABLE.headCell}>{t("inv.history.product")}</th>
                <th className={TABLE.headCell}>{t("inv.history.type")}</th>
                <th className={TABLE.headCellNumeric}>{t("inv.history.qty")}</th>
                <th className={TABLE.headCellNumeric}>{t("inv.history.final_stock")}</th>
                <th className={TABLE.headCell}>{t("inv.history.reason")}</th>
                <th className={TABLE.headCell}>{t("inv.history.user")}</th>
              </tr>
            </thead>
            <tbody className={TABLE.body}>
              {paginatedData.map(entry => {
                const cfg = typeConfig[entry.type];
                const TypeIcon = cfg.icon;
                return (
                  <tr key={entry.id} className={cn(TABLE.row, TABLE.rowHover, "group")}>
                    <td className={cn(TABLE.cell, T.dataSm, TABLE.stickyColumn, "bg-white dark:bg-slate-900 group-hover:bg-slate-50 dark:group-hover:bg-slate-800/50 font-bold text-slate-500 dark:text-slate-400 whitespace-nowrap")}>{entry.date}</td>
                    <td className={TABLE.cell}>
                      <p className={cn(T.bodySm, "font-bold text-slate-900 dark:text-slate-100")}>{entry.productName}</p>
                      <p className={cn(T.code, "text-slate-400")}>{entry.sku}</p>
                    </td>
                    <td className={TABLE.cell}>
                      <span className={cn(
                        cn(T.micro, R.sm, "inline-flex items-center gap-1 px-2 py-1 border"),
                        cfg.color === "emerald" ? "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-800/50" :
                        cfg.color === "rose" ? "bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 border-rose-100 dark:border-rose-800/50" :
                        "bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 border-amber-100 dark:border-amber-800/50"
                      )}>
                        <TypeIcon className="size-3" />
                        {cfg.label}
                      </span>
                    </td>
                    <td className={TABLE.cellNumeric}>
                      <span className={cn(
                        T.dataSm, "font-bold",
                        entry.type === "in" ? "text-emerald-600" :
                        entry.type === "out" ? "text-rose-600" : "text-amber-600"
                      )}>
                        {entry.type === "in" ? "+" : entry.type === "out" ? "-" : "="}{entry.quantity}
                      </span>
                    </td>
                    <td className={cn(TABLE.cellNumeric, T.dataSm, "font-bold text-slate-900 dark:text-slate-100")}>{entry.finalStock}</td>
                    <td className={cn(TABLE.cell, T.bodySm, "font-bold text-slate-500 dark:text-slate-400 max-w-[160px] truncate")}>{entry.reason}</td>
                    <td className={cn(TABLE.cell, T.bodySm, "font-bold text-slate-400")}>{entry.user}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </ResponsiveTable>

        {/* Pagination */}
        <div className="px-6 py-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0 bg-slate-50/50 dark:bg-slate-800/50">
          <p className={cn(T.caption, "text-slate-400 dark:text-slate-500")}>
            {t("inv.pagination")} {page} {t("inv.pagination.of")} {totalPages}
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className={cn(R.sm, "p-1.5 border border-slate-200 dark:border-slate-700 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed transition-all")}
            >
              <ChevronLeft className="size-3.5" />
            </button>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className={cn(R.sm, "p-1.5 border border-slate-200 dark:border-slate-700 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed transition-all")}
            >
              <ChevronRight className="size-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
