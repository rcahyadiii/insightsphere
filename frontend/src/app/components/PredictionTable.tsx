"use client";

import { useState } from "react";
import { Search, ChevronLeft, ChevronRight, AlertCircle, CheckCircle2, Package, TrendingUp, AlertTriangle, Clock } from "lucide-react";
import { cn } from "@/app/lib/utils";
import { T } from "@/app/lib/typography";
import { TABLE } from "@/app/lib/data";
import { C } from "@/app/lib/colors";
import { R } from "@/app/lib/radii";
import { E } from "@/app/lib/elevation";
import { formatNumber } from "@/app/lib/format";
import { A11Y } from "@/app/lib/a11y";
import { ResponsiveTable } from "@/app/components/ui/ResponsiveTable";
import { useTranslation } from "@/app/i18n";
import { INPUT } from "@/app/lib/forms";

const PRODUCTS = [
  { id: "BR123", name: "Beras Premium 5kg", category: "Kebutuhan Pokok", stock: 120, predicted: 450, daysLeft: 2, status: "Segera Restok" },
  { id: "ID456", name: "Indomie Goreng Spc 85g", category: "Mie Instan", stock: 1560, predicted: 1200, daysLeft: 12, status: "Stok Aman" },
  { id: "TS789", name: "Teh Botol Sosro 450ml", category: "Minuman", stock: 850, predicted: 400, daysLeft: 21, status: "Kelebihan Stok" },
  { id: "SU012", name: "Susu Ultra 1L Full Cream", category: "Dairy", stock: 45, predicted: 180, daysLeft: 1, status: "Segera Restok" },
  { id: "CP345", name: "Chitato Original 68g", category: "Snack", stock: 320, predicted: 310, daysLeft: 7, status: "Stok Aman" },
  { id: "GG678", name: "Gudang Garam Filter 16", category: "Rokok", stock: 110, predicted: 500, daysLeft: 1, status: "Segera Restok" },
  { id: "MS910", name: "Minyak Goreng SunCo 2L", category: "Kebutuhan Pokok", stock: 15, predicted: 120, daysLeft: 0, status: "Segera Restok" },
  { id: "KK112", name: "Kopi Kenangan 220ml", category: "Minuman", stock: 240, predicted: 220, daysLeft: 8, status: "Stok Aman" },
  { id: "YB134", name: "Yakult Multipack 5s", category: "Dairy", stock: 1200, predicted: 400, daysLeft: 30, status: "Kelebihan Stok" },
  { id: "PA156", name: "Pepsodent White 190g", category: "Kebutuhan Pokok", stock: 450, predicted: 420, daysLeft: 10, status: "Stok Aman" },
  { id: "ST178", name: "Sari Roti Tawar Spc", category: "Snack", stock: 12, predicted: 85, daysLeft: 1, status: "Segera Restok" },
  { id: "AL190", name: "Aqua 600ml Karton", category: "Minuman", stock: 15, predicted: 10, daysLeft: 15, status: "Stok Aman" },
];

export function PredictionTable() {
  const { t } = useTranslation();
  const [filter, setFilter] = useState("Semua");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const itemsPerPage = 6;

  const getTranslatedStatus = (status: string) => {
    switch (status) {
      case "Segera Restok": return t("table.status.restock");
      case "Stok Aman": return t("table.status.safe");
      case "Kelebihan Stok": return t("table.status.overstock");
      default: return status;
    }
  };

  const filteredData = PRODUCTS.filter(p => {
    const matchesFilter = filter === "Semua" || p.status === filter;
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) || p.id.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const currentData = filteredData.slice((page - 1) * itemsPerPage, page * itemsPerPage);
  const startItem = filteredData.length > 0 ? (page - 1) * itemsPerPage + 1 : 0;
  const endItem = Math.min(page * itemsPerPage, filteredData.length);

  const getDaysUI = (days: number) => {
    if (days <= 2) return { text: `${days} ${t("inv.drawer.days_left")}`, color: "text-rose-600", icon: <AlertTriangle className="size-3.5" aria-hidden="true" /> };
    if (days <= 5) return { text: `${days} ${t("inv.drawer.days_left")}`, color: "text-amber-600", icon: <Clock className="size-3.5" aria-hidden="true" /> };
    return { text: `${days} ${t("inv.drawer.days_left")}`, color: "text-slate-600 dark:text-slate-400", icon: null };
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Segera Restok": return "bg-rose-100 dark:bg-rose-900/30 text-rose-600";
      case "Stok Aman": return "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600";
      case "Kelebihan Stok": return "bg-amber-100 dark:bg-amber-900/30 text-amber-600";
      default: return "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400";
    }
  };

  return (
    <div className={cn(R.lg, E.sm, "bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 overflow-hidden flex flex-col")}>
      <div className="p-8 border-b border-slate-50 dark:border-slate-800 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
           <div className="flex items-center gap-3 mb-1">
             <h3 className={cn(T.h2, "text-slate-900 dark:text-slate-100")}>{t("pred.table.title")}</h3>
             <span className={cn(T.micro, R.full, "bg-rose-500 text-white px-3 py-1 flex items-center gap-1.5 shadow-lg shadow-rose-100 dark:shadow-rose-900/50")}>
               <AlertCircle className="size-3" />
               {PRODUCTS.filter(p => p.status === "Segera Restok").length} {t("table.status.need_restock")}
             </span>
           </div>
           <p className={cn(T.body, "font-medium text-slate-400")}>{t("pred.table.desc")}</p>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
            <input 
              type="text" 
              placeholder={t("table.search")} 
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className={cn(INPUT.base, INPUT.size.lg, T.body, "pl-12 pr-6 font-bold w-full sm:w-64")}
            />
          </div>
          <div className={cn(R.md, "flex p-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-100/50 dark:border-slate-700 overflow-x-auto no-scrollbar")}>
            {["Semua", "Segera Restok", "Stok Aman", "Kelebihan Stok"].map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => { setFilter(f); setPage(1); }}
                className={cn(
                  cn(T.buttonSm, R.md, "px-4 py-2 transition-all whitespace-nowrap", A11Y.focusRing.default),
                  filter === f ? "bg-white dark:bg-slate-900 text-indigo-600 shadow-sm" : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                )}
              >
                {f === "Semua" ? t("app.all") : getTranslatedStatus(f)}
              </button>
            ))}
          </div>
        </div>
      </div>

      <ResponsiveTable
        label={t("pred.table.title")}
        scrollerClassName="rounded-none border-0 bg-transparent"
        minWidthClassName={TABLE.minWidth.prediction}
      >
        <table className={TABLE.base} aria-label={t("pred.table.title")}>
          <thead className={TABLE.head}>
            <tr>
              <th className={cn(TABLE.headCell, TABLE.stickyColumn, "bg-slate-50 dark:bg-slate-800/50 px-8 py-5")}>{t("table.product")}</th>
              <th className={cn(TABLE.headCell, "px-8 py-5")}>{t("table.category")}</th>
              <th className={cn(TABLE.headCellNumeric, "px-8 py-5")}>{t("table.stock")}</th>
              <th className={cn(TABLE.headCellNumeric, "px-8 py-5")}>{t("table.forecast")}</th>
              <th className={cn(TABLE.headCell, "px-8 py-5")}>{t("table.remaining")}</th>
              <th className={cn(TABLE.headCell, "px-8 py-5")}>{t("table.recommendation")}</th>
            </tr>
          </thead>
          <tbody className={TABLE.body}>
            {currentData.length > 0 ? (
              currentData.map((item) => {
                const days = getDaysUI(item.daysLeft);
                const progress = Math.min((item.stock / (item.predicted || 1)) * 100, 100);
                const isUrgent = item.status === "Segera Restok";

                return (
                  <tr
                    key={item.id}
                    className={cn(
                      TABLE.row,
                      TABLE.rowHover,
                      "group",
                      isUrgent && "bg-rose-50/30 dark:bg-rose-900/10"
                    )}
                  >
                    <td className={cn(
                      TABLE.cell,
                      TABLE.stickyColumn,
                      "px-8 py-6",
                      isUrgent
                        ? "bg-rose-50 dark:bg-rose-950/30 group-hover:bg-rose-50 dark:group-hover:bg-rose-900/20"
                        : "bg-white dark:bg-slate-900 group-hover:bg-slate-50 dark:group-hover:bg-slate-800/50"
                    )}>
                      <div className="flex flex-col">
                        <span className={cn(T.bodyEmphasis, "text-slate-900 dark:text-slate-100 leading-none mb-1 group-hover:text-indigo-600 transition-colors")}>{item.name}</span>
                        <span className={cn(T.code, "text-slate-400")}>{item.id}</span>
                      </div>
                    </td>
                    <td className={cn(TABLE.cell, "px-8 py-6")}>
                      <span className={cn(T.caption, R.xs, "px-2 py-1 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400")}>{item.category}</span>
                    </td>
                    <td className={cn(TABLE.cell, "px-8 py-6")}>
                      <div className="w-32 space-y-2">
                         <div className={cn(T.dataSm, "flex items-center justify-between")}>
                            <span className="text-slate-900 dark:text-slate-100">{item.stock}</span>
                            <span className="text-slate-400">{progress.toFixed(0)}%</span>
                         </div>
                         <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                            <div
                              className={cn(
                                "h-full rounded-full transition-all duration-1000",
                                progress < 50 ? "bg-rose-500" : progress < 80 ? "bg-amber-500" : "bg-emerald-500"
                              )}
                              style={{ width: `${progress}%` }}
                            />
                         </div>
                      </div>
                    </td>
                    <td className={cn(TABLE.cell, "px-8 py-6")}>
                      <div className="flex items-center gap-2">
                        <span className={cn(T.dataEmphasis, "text-slate-900 dark:text-slate-100")}>{formatNumber(item.predicted)} {t("table.unit")}</span>
                        <TrendingUp className={cn("size-3.5", C.success.icon)} />
                      </div>
                    </td>
                    <td className={cn(TABLE.cell, "px-8 py-6")}>
                      <div className={cn(T.bodySm, "font-semibold flex items-center gap-1.5", days.color)}>
                        {days.icon}
                        {days.text}
                      </div>
                    </td>
                    <td className={cn(TABLE.cell, "px-8 py-6")}>
                      <span className={cn(
                        cn(T.micro, R.md, "px-3 py-1.5 inline-flex items-center gap-2"),
                        getStatusBadge(item.status)
                      )}>
                        {item.status === "Segera Restok" ? <AlertCircle className="size-3" /> :
                         item.status === "Stok Aman" ? <CheckCircle2 className="size-3" /> : <Package className="size-3" />}
                        {getTranslatedStatus(item.status)}
                      </span>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td className={cn(TABLE.cell, "px-8 py-8 text-center text-slate-400")} colSpan={6}>
                  {t("app.empty_products")}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </ResponsiveTable>

      <div className="p-8 bg-slate-50/50 dark:bg-slate-800/50 flex items-center justify-between">
         <p className={cn(T.caption, "text-slate-400")}>
           {t("table.footer.showing")} {startItem} - {endItem} {t("table.footer.of")} {filteredData.length} {t("table.product")}
         </p>
         <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={page === 1}
              onClick={() => setPage(page - 1)}
              className={cn(R.md, "p-2 border border-slate-200 dark:border-slate-700 disabled:opacity-30 hover:bg-white dark:hover:bg-slate-800 transition-all shadow-sm", A11Y.focusRing.default)}
            >
              <ChevronLeft className="size-5" />
            </button>
            {[...Array(totalPages)].map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setPage(i + 1)}
                className={cn(
                  cn(T.buttonSm, R.md, "size-10 transition-all", A11Y.focusRing.default),
                  page === i + 1 ? "bg-slate-900 dark:bg-indigo-600 text-white shadow-xl shadow-slate-200 dark:shadow-indigo-900/30 scale-110" : "text-slate-400 hover:bg-white dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100 border border-transparent hover:border-slate-200 dark:hover:border-slate-700"
                )}
              >
                {i + 1}
              </button>
            ))}
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => setPage(page + 1)}
              className={cn(R.md, "p-2 border border-slate-200 dark:border-slate-700 disabled:opacity-30 hover:bg-white dark:hover:bg-slate-800 transition-all shadow-sm", A11Y.focusRing.default)}
            >
              <ChevronRight className="size-5" />
            </button>
         </div>
      </div>
    </div>
  );
}
