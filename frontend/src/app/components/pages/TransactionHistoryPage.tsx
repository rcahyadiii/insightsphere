"use client";

import { useState, useMemo, useEffect } from "react";
import {
  Search,
  Download,
  FileText,
  Calendar,
  Eye,
  X,
  ChevronLeft,
  ChevronRight,
  Receipt,
  Banknote,
  QrCode,
  Printer,
  ShoppingBag,
  Filter,
  ArrowUpDown,
} from "lucide-react";
import { cn } from "@/app/lib/utils";
import { T } from "@/app/lib/typography";
import { C } from "@/app/lib/colors";
import { R } from "@/app/lib/radii";
import { E } from "@/app/lib/elevation";
import { TABLE } from "@/app/lib/data";
import { MODAL } from "@/app/lib/containers";
import { formatRupiah } from "@/app/lib/format";
import { useTranslation } from "@/app/i18n";
import { isDemoDataEnabled } from "@/app/lib/demo-mode";
import { TRANSACTION_PAGE_SIZE } from "@/app/domain/constants";
import { toast } from "sonner";
import { INPUT } from "@/app/lib/forms";
import { GAP, ICON } from "@/app/lib/spacing";
import { btn } from "@/app/lib/buttons";
import { ResponsiveTable } from "@/app/components/ui/ResponsiveTable";

// ─── Types ───────────────────────────────────────────────────────────

interface TransactionItem {
  productName: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

interface Transaction {
  id: string;
  date: string;
  time: string;
  items: TransactionItem[];
  totalItems: number;
  total: number;
  paymentMethod: "CASH" | "QRIS";
  cashReceived: number;
  change: number;
  cashierName: string;
  branchName: string;
}

type DateRange = "today" | "week" | "month" | "custom";
type PaymentFilter = "all" | "CASH" | "QRIS";


// ─── Component ───────────────────────────────────────────────────────

const ITEMS_PER_PAGE = TRANSACTION_PAGE_SIZE;

function exportToCSV(
  data: Transaction[],
  filename: string,
  t: (key: string, params?: Record<string, string | number>) => string,
) {
  const headers = [
    t("txn.export.headers.id"),
    t("txn.export.headers.date"),
    t("txn.export.headers.time"),
    t("txn.export.headers.items"),
    t("txn.export.headers.total", { currency: t("common.currency.rupiah") }),
    t("txn.export.headers.method"),
    t("txn.export.headers.cashier"),
    t("txn.export.headers.branch"),
  ];
  const rows = data.map(t => [
    t.id, t.date, t.time, t.totalItems, t.total, t.paymentMethod, t.cashierName, t.branchName
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

export function TransactionHistoryPage() {
  const { t } = useTranslation();

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [dateRange, setDateRange] = useState<DateRange>("month");
  const [paymentFilter, setPaymentFilter] = useState<PaymentFilter>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  /* ---- Demo mode: lazy-load transactions fixture only when explicitly enabled ---- */
  useEffect(() => {
    if (!isDemoDataEnabled()) return;
    let cancelled = false;
    void import("@/app/demo/transactions").then(({ DEMO_TRANSACTIONS }) => {
      if (!cancelled) setTransactions(DEMO_TRANSACTIONS as unknown as Transaction[]);
    });
    return () => { cancelled = true; };
  }, []);

  // Detail modal
  const [selectedTxn, setSelectedTxn] = useState<Transaction | null>(null);

  // Filtered data
  const filtered = useMemo(() => {
    return transactions.filter((txn) => {
      const matchSearch = txn.id.toLowerCase().includes(searchQuery.toLowerCase());
      const matchPayment = paymentFilter === "all" || txn.paymentMethod === paymentFilter;
      return matchSearch && matchPayment;
    });
  }, [searchQuery, paymentFilter, dateRange]);

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginated = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  // Summary stats
  const summaryStats = useMemo(() => {
    const totalRevenue = filtered.reduce((s, t) => s + t.total, 0);
    const totalTxn = filtered.length;
    const cashCount = filtered.filter((t) => t.paymentMethod === "CASH").length;
    const qrisCount = filtered.filter((t) => t.paymentMethod === "QRIS").length;
    return { totalRevenue, totalTxn, cashCount, qrisCount };
  }, [filtered]);

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-6">
      {/* Header */}
      <div className={cn("flex flex-col md:flex-row md:items-center justify-between", GAP.default)}>
        <div>
          <h1 className={cn(T.h1, "text-slate-900 dark:text-slate-100")}>{t("txn.header")}</h1>
          <p className={cn(T.body, "text-slate-500 dark:text-slate-400")}>{t("txn.subheader")}</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => { exportToCSV(filtered, `transaksi-${new Date().toISOString().slice(0,10)}.csv`, t); toast.success(t("txn.toast.csv")); }}
            className={btn("neutralSoft", "md")}
          >
            <Download className={ICON.sm} /> {t("txn.export.csv")}
          </button>
          <button
            onClick={() => { window.print(); toast.info(t("txn.toast.print")); }}
            className={btn("neutralSoft", "md")}
          >
            <FileText className={ICON.sm} /> {t("txn.export.pdf")}
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: t("dash.kpi.revenue"), value: formatRupiah(summaryStats.totalRevenue, { compact: true }), color: "indigo" },
          { label: t("dash.kpi.transactions"), value: summaryStats.totalTxn.toString(), color: "emerald" },
          { label: t("txn.filter.cash"), value: summaryStats.cashCount.toString(), color: "slate" },
          { label: "QRIS", value: summaryStats.qrisCount.toString(), color: "slate" },
        ].map((stat, i) => (
          <div key={i} className={cn(R.lg, E.sm, "bg-white dark:bg-slate-900 px-4 py-3 border border-slate-200 dark:border-slate-800 hover:shadow-md transition-shadow")}>
            <p className={cn(T.label, "text-slate-400 dark:text-slate-500 mb-1")}>{stat.label}</p>
            <p className={cn(
              T.h2, "font-data tabular-nums",
              stat.color === "indigo" ? "text-indigo-600" :
              stat.color === "emerald" ? "text-emerald-600" : "text-slate-900 dark:text-slate-100"
            )}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Filters Bar */}
      <div className={cn(R.lg, E.sm, "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden")}>
        <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-800/30 flex flex-col xl:flex-row xl:items-center justify-between gap-3">
          {/* Date Range Tabs */}
          <div className={cn(R.sm, "flex bg-slate-100/50 dark:bg-slate-800 p-1 border border-slate-200 dark:border-slate-700 overflow-x-auto no-scrollbar max-w-fit")}>
            {(["today", "week", "month", "custom"] as DateRange[]).map((range) => (
              <button
                key={range}
                onClick={() => { setDateRange(range); setCurrentPage(1); }}
                className={cn(
                  cn(T.buttonSm, R.sm, "px-4 py-2 transition-all whitespace-nowrap cursor-pointer"),
                  dateRange === range
                    ? "bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm"
                    : "text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300"
                )}
              >
                {t(`txn.date_range.${range}`)}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3">
            {/* Payment Filter */}
            <div className={cn(R.sm, "flex bg-slate-100/50 dark:bg-slate-800 p-1 border border-slate-200 dark:border-slate-700")}>
              {(["all", "CASH", "QRIS"] as PaymentFilter[]).map((method) => (
                <button
                  key={method}
                  onClick={() => { setPaymentFilter(method); setCurrentPage(1); }}
                  className={cn(
                    cn(T.buttonSm, R.sm, "px-3 py-1.5 transition-all cursor-pointer"),
                    paymentFilter === method
                      ? "bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm"
                      : "text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300"
                  )}
                >
                  {method === "all" ? t("txn.filter.all_methods") : method}
                </button>
              ))}
            </div>

            {/* Search */}
            <div className="relative group max-w-xs w-full">
              <Search className={cn("absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors", ICON.sm)} />
              <input
                type="text"
                aria-label={t("txn.search.placeholder")}
                placeholder={t("txn.search.placeholder")}
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                className={cn(INPUT.base, INPUT.size.md, "pl-9 pr-3 font-bold", T.label)}
              />
            </div>
          </div>
        </div>

        {/* Transaction Table */}
        {paginated.length > 0 ? (
          <ResponsiveTable
            label={t("txn.header")}
            scrollerClassName="rounded-none border-0 bg-transparent"
            minWidthClassName={TABLE.minWidth.transaction}
          >
            <table className={TABLE.base} aria-label={t("txn.header")}>
              <thead className={TABLE.head}>
                <tr>
                  <th className={cn(TABLE.headCell, TABLE.stickyColumn, "bg-slate-50 dark:bg-slate-800/50")}>{t("txn.table.id")}</th>
                  <th className={TABLE.headCell}>{t("txn.table.date")}</th>
                  <th className={TABLE.headCellNumeric}>{t("txn.table.items")}</th>
                  <th className={TABLE.headCellNumeric}>{t("txn.table.total")}</th>
                  <th className={TABLE.headCell}>{t("txn.table.method")}</th>
                  <th className={TABLE.headCell}>{t("txn.table.cashier")}</th>
                  <th className={cn(TABLE.headCell, "text-center")}>{t("txn.table.actions")}</th>
                </tr>
              </thead>
              <tbody className={TABLE.body}>
                {paginated.map((txn) => (
                  <tr key={txn.id} className={cn(TABLE.row, TABLE.rowHover, "group")}>
                    <td className={cn(TABLE.cell, TABLE.stickyColumn, "bg-white dark:bg-slate-900 group-hover:bg-slate-50 dark:group-hover:bg-slate-800/50")}>
                      <span className={cn(T.code, C.primary.icon)}>{txn.id}</span>
                    </td>
                    <td className={TABLE.cell}>
                      <p className={cn(T.dataSm, "font-bold text-slate-900 dark:text-slate-100")}>{txn.date}</p>
                      <p className={cn(T.dataSm, "text-slate-400 dark:text-slate-500")}>{txn.time}</p>
                    </td>
                    <td className={cn(TABLE.cellNumeric, T.dataSm, "font-bold text-slate-600 dark:text-slate-400")}>
                      {txn.totalItems} item
                    </td>
                    <td className={cn(TABLE.cellNumeric, T.dataSm, "font-bold text-slate-900 dark:text-slate-100")}>
                      {formatRupiah(txn.total)}
                    </td>
                    <td className={TABLE.cell}>
                      <span className={cn(
                        cn(T.micro, R.sm, "inline-flex items-center gap-1.5 px-2 py-1 border"),
                        txn.paymentMethod === "CASH"
                          ? "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-800/50"
                          : "bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 border-indigo-100 dark:border-indigo-800/50"
                      )}>
                        {txn.paymentMethod === "CASH" ? <Banknote className="size-3" /> : <QrCode className="size-3" />}
                        {txn.paymentMethod}
                      </span>
                    </td>
                    <td className={cn(TABLE.cell, T.bodySm, "font-bold text-slate-500 dark:text-slate-400")}>{txn.cashierName}</td>
                    <td className={cn(TABLE.cell, "text-center")}>
                      <button
                        onClick={() => setSelectedTxn(txn)}
                        className={cn(R.sm, "p-2 text-slate-300 dark:text-slate-600 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-all cursor-pointer")}
                        aria-label={`${t("txn.detail.title")} ${txn.id}`}
                      >
                        <Eye className="size-4" aria-hidden="true" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </ResponsiveTable>
        ) : (
          <div className="py-20 text-center">
            <div className={cn(R.full, "size-16 bg-slate-50 dark:bg-slate-800 flex items-center justify-center mx-auto mb-4 border border-dashed border-slate-200 dark:border-slate-700")}>
              <ShoppingBag className="size-6 text-slate-200 dark:text-slate-600" />
            </div>
            <h4 className={cn(T.bodyEmphasis, "text-slate-400 dark:text-slate-500 mb-1")}>{t("txn.empty.title")}</h4>
            <p className={cn(T.caption, "text-slate-300 dark:text-slate-600")}>{t("txn.empty.desc")}</p>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-4 py-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/30 dark:bg-slate-800/30">
            <p className={cn(T.caption, "text-slate-400 dark:text-slate-500")}>
              {t("txn.pagination")} {currentPage} {t("txn.pagination.of")} {totalPages}
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                aria-label={t("common.prev_page")}
                className={cn(R.sm, "p-1.5 border border-slate-200 dark:border-slate-700 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed transition-all")}
              >
                <ChevronLeft className={ICON.sm} aria-hidden="true" />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => setCurrentPage(p)}
                  className={cn(
                    T.buttonSm, R.sm, "size-7 transition-all",
                    p === currentPage
                      ? "bg-indigo-600 text-white shadow-sm"
                      : "text-slate-400 dark:text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                  )}
                >
                  {p}
                </button>
              ))}
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                aria-label={t("common.next_page")}
                className={cn(R.sm, "p-1.5 border border-slate-200 dark:border-slate-700 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed transition-all")}
              >
                <ChevronRight className={ICON.sm} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ─── Transaction Detail Modal ─── */}
      {selectedTxn && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200"
          role="presentation"
          onClick={(e) => { if (e.currentTarget === e.target) setSelectedTxn(null); }}
        >
          <div
            className={cn(R.xl, E["2xl"], "bg-white dark:bg-slate-900 w-full max-w-lg overflow-hidden border border-slate-200 dark:border-slate-700 animate-in zoom-in-95 slide-in-from-bottom-4 duration-200 flex flex-col", MODAL.maxHeight.md)}
            role="dialog"
            aria-modal="true"
            aria-labelledby="txn-detail-title"
          >
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className={cn(R.md, "size-8 bg-indigo-50 dark:bg-indigo-900/40 flex items-center justify-center")}>
                  <Receipt className={cn("size-4", C.primary.icon)} />
                </div>
                <div>
                  <h2 id="txn-detail-title" className={cn(T.h3, "text-slate-900 dark:text-slate-100")}>{t("txn.detail.title")}</h2>
                  <p className={cn(T.code, C.primary.icon, "mt-0.5")}>{selectedTxn.id}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedTxn(null)}
                aria-label={t("txn.detail.close")}
                className={cn(R.md, "p-2 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer")}
              >
                <X className="size-4 text-slate-500 dark:text-slate-400" aria-hidden="true" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-5">
              {/* Meta */}
              <div className="grid grid-cols-2 gap-4">
                <div className={cn(R.md, "bg-slate-50 dark:bg-slate-800 p-3 border border-slate-100 dark:border-slate-700")}>
                  <p className={cn(T.label, "text-slate-400 dark:text-slate-500 mb-1")}>{t("txn.table.date")}</p>
                  <p className={cn(T.dataSm, "font-bold text-slate-900 dark:text-slate-100")}>{selectedTxn.date} · {selectedTxn.time}</p>
                </div>
                <div className={cn(R.md, "bg-slate-50 dark:bg-slate-800 p-3 border border-slate-100 dark:border-slate-700")}>
                  <p className={cn(T.label, "text-slate-400 dark:text-slate-500 mb-1")}>{t("txn.table.cashier")}</p>
                  <p className={cn(T.bodySm, "font-bold text-slate-900 dark:text-slate-100")}>{selectedTxn.cashierName}</p>
                </div>
              </div>

              {/* Items Table */}
              <div>
                <p className={cn(T.label, "text-slate-400 dark:text-slate-500 mb-2")}>{t("txn.table.items")}: {selectedTxn.totalItems}</p>
                <div className={cn(R.md, "bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 overflow-hidden")}>
                  <ResponsiveTable
                    label={`${t("txn.detail.title")} ${selectedTxn.id}`}
                    scrollerClassName="rounded-none border-0 bg-transparent"
                    minWidthClassName={TABLE.minWidth.detailCompact}
                  >
                    <table className={TABLE.base} aria-label={`${t("txn.detail.title")} ${selectedTxn.id}`}>
                    <thead className="bg-slate-100/50 dark:bg-slate-700/50">
                      <tr>
                        <th className={cn(TABLE.headCell, "px-3 py-2")}>{t("txn.detail.product")}</th>
                        <th className={cn(TABLE.headCellNumeric, "px-3 py-2")}>{t("txn.detail.qty")}</th>
                        <th className={cn(TABLE.headCellNumeric, "px-3 py-2")}>{t("txn.detail.unit_price")}</th>
                        <th className={cn(TABLE.headCellNumeric, "px-3 py-2")}>{t("txn.detail.subtotal")}</th>
                      </tr>
                    </thead>
                    <tbody className={TABLE.body}>
                      {selectedTxn.items.map((item, i) => (
                        <tr key={i}>
                          <td className={TABLE.cellCompact}>
                            <p className={cn(T.bodySm, "font-bold text-slate-900 dark:text-slate-100")}>{item.productName}</p>
                            <p className={cn(T.code, "text-slate-400 dark:text-slate-500")}>{item.sku}</p>
                          </td>
                          <td className={cn(TABLE.cellNumeric, T.dataSm, "px-3 py-2 font-bold text-slate-600 dark:text-slate-400")}>{item.quantity}</td>
                          <td className={cn(TABLE.cellNumeric, T.dataSm, "px-3 py-2 font-bold text-slate-600 dark:text-slate-400")}>{formatRupiah(item.unitPrice)}</td>
                          <td className={cn(TABLE.cellNumeric, T.dataSm, "px-3 py-2 font-bold text-slate-900 dark:text-slate-100")}>{formatRupiah(item.subtotal)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  </ResponsiveTable>
                </div>
              </div>

              {/* Payment Summary */}
              <div className={cn(R.md, "bg-slate-900 p-4 space-y-3")}>
                <div className="flex justify-between items-center">
                  <span className={cn(T.label, "text-slate-400")}>{t("txn.detail.method")}</span>
                  <span className={cn(
                    T.micro, R.sm, "inline-flex items-center gap-1.5 px-2 py-1",
                    selectedTxn.paymentMethod === "CASH"
                      ? "bg-emerald-500/10 text-emerald-400"
                      : "bg-indigo-500/10 text-indigo-400"
                  )}>
                    {selectedTxn.paymentMethod === "CASH" ? <Banknote className="size-3" /> : <QrCode className="size-3" />}
                    {selectedTxn.paymentMethod}
                  </span>
                </div>
                <div className="h-px bg-slate-800" />
                <div className="flex justify-between items-center">
                  <span className={cn(T.label, "text-slate-500")}>{t("txn.detail.total")}</span>
                  <span className={cn(T.h2, "text-white font-data tabular-nums")}>{formatRupiah(selectedTxn.total)}</span>
                </div>
                {selectedTxn.paymentMethod === "CASH" && (
                  <>
                    <div className="flex justify-between items-center">
                      <span className={cn(T.label, "text-slate-500")}>{t("txn.detail.received")}</span>
                      <span className={cn(T.bodySm, "font-bold text-slate-300 font-data tabular-nums")}>{formatRupiah(selectedTxn.cashReceived)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className={cn(T.label, "text-slate-500")}>{t("txn.detail.change")}</span>
                      <span className={cn(T.bodySm, "font-bold text-emerald-400 font-data tabular-nums")}>{formatRupiah(selectedTxn.change)}</span>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-3 shrink-0 bg-slate-50/50 dark:bg-slate-800/30">
              <button
                onClick={() => setSelectedTxn(null)}
                className={cn(T.buttonSm, R.md, "px-4 py-2 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer")}
              >
                {t("txn.detail.close")}
              </button>
              <button className={btn("primary", "sm")}>
                <Printer className={ICON.sm} /> {t("txn.detail.print")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
