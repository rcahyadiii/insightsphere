"use client";

import { useState, useMemo } from "react";
import {
  X,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  ClipboardList,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { cn } from "@/app/lib/utils";
import { T } from "@/app/lib/typography";
import { TABLE } from "@/app/lib/data";
import { C } from "@/app/lib/colors";
import { R } from "@/app/lib/radii";
import { E, Z } from "@/app/lib/elevation";
import { MODAL } from "@/app/lib/containers";
import { BACKDROP } from "@/app/lib/utility";
import { ResponsiveTable } from "@/app/components/ui/ResponsiveTable";
import { useTranslation } from "@/app/i18n";
import { FIELD, INPUT, LABEL } from "@/app/lib/forms";

interface OpnameProduct {
  id: string;
  sku: string;
  name: string;
  category: string;
  systemStock: number;
}

interface StockOpnameModalProps {
  products: OpnameProduct[];
  onClose: () => void;
  onSubmit: (adjustments: { id: string; physicalCount: number; discrepancy: number }[]) => void;
}

type OpnameStatus = "match" | "surplus" | "shortage";

function getStatus(system: number, physical: number): OpnameStatus {
  if (physical === system) return "match";
  if (physical > system) return "surplus";
  return "shortage";
}

export function StockOpnameModal({ products, onClose, onSubmit }: StockOpnameModalProps) {
  const { t } = useTranslation();
  const [physicalCounts, setPhysicalCounts] = useState<Record<string, string>>({});
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

  const setCount = (id: string, val: string) => {
    setPhysicalCounts(prev => ({ ...prev, [id]: val }));
  };

  const rows = useMemo(() => {
    return products.map(p => {
      const raw = physicalCounts[p.id];
      const physical = raw !== undefined && raw !== "" ? parseInt(raw) : null;
      const discrepancy = physical !== null ? physical - p.systemStock : null;
      const status: OpnameStatus | null = physical !== null ? getStatus(p.systemStock, physical) : null;
      return { ...p, physical, discrepancy, status };
    });
  }, [products, physicalCounts]);

  const categories = useMemo(() => {
    const cats = Array.from(new Set(products.map(p => p.category)));
    return cats;
  }, [products]);

  const summary = useMemo(() => {
    const filled = rows.filter(r => r.physical !== null);
    const adjusted = filled.filter(r => r.status !== "match");
    const shortage = filled.filter(r => r.status === "shortage").length;
    const surplus = filled.filter(r => r.status === "surplus").length;
    return { checked: filled.length, adjusted: adjusted.length, shortage, surplus, total: rows.length };
  }, [rows]);

  const allFilled = summary.checked === summary.total;

  const handleSubmit = async () => {
    if (!allFilled) return;
    setIsSubmitting(true);
    await new Promise(r => setTimeout(r, 1200));
    const adjustments = rows
      .filter(r => r.physical !== null && r.status !== "match")
      .map(r => ({ id: r.id, physicalCount: r.physical!, discrepancy: r.discrepancy! }));
    onSubmit(adjustments);
    setIsSubmitting(false);
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className={cn(BACKDROP.overlay, Z.overlay, MODAL.wrapper, "animate-in fade-in duration-200")}>
        <div className={cn(R.lg, E["2xl"], "bg-white dark:bg-slate-900 w-full max-w-sm overflow-hidden border border-slate-200/50 dark:border-slate-700 animate-in zoom-in-95 duration-300 p-8 flex flex-col items-center text-center gap-4")}>
          <div className={cn(R.lg, C.success.bg, "size-14 flex items-center justify-center")}>
            <CheckCircle2 className={cn("size-7", C.success.icon)} />
          </div>
          <div>
            <h3 className={cn(T.h3, "text-slate-900 dark:text-slate-100")}>{t("inv.opname.success_title")}</h3>
            <p className={cn(T.bodySm, "text-slate-500 dark:text-slate-400 mt-1")}>
              {t("inv.opname.success_desc", { adjusted: summary.adjusted, total: summary.total })}
            </p>
          </div>
          <div className="flex gap-3 w-full">
            <div className="flex-1 bg-rose-50 dark:bg-rose-900/30 rounded-xl p-3 text-center border border-rose-100 dark:border-rose-800/50">
              <p className={cn(T.label, "text-rose-400")}>{t("inv.opname.shortage")}</p>
              <p className={cn(T.kpiCard, "text-rose-600 dark:text-rose-400")}>{summary.shortage}</p>
            </div>
            <div className={cn(R.md, "flex-1 bg-amber-50 dark:bg-amber-900/30 p-3 text-center border border-amber-100 dark:border-amber-800/50")}>
              <p className={cn(T.label, "text-amber-400")}>{t("inv.opname.surplus")}</p>
              <p className={cn(T.kpiCard, "text-amber-600 dark:text-amber-400")}>{summary.surplus}</p>
            </div>
            <div className={cn(R.md, "flex-1 bg-emerald-50 dark:bg-emerald-900/30 p-3 text-center border border-emerald-100 dark:border-emerald-800/50")}>
              <p className={cn(T.label, "text-emerald-400")}>{t("inv.opname.match")}</p>
              <p className={cn(T.kpiCard, "text-emerald-600 dark:text-emerald-400")}>{summary.checked - summary.adjusted}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className={cn(T.buttonSm, R.md, "w-full h-11 bg-indigo-600 hover:bg-indigo-500 text-white transition-all cursor-pointer")}
          >
            {t("common.close")}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={cn(BACKDROP.overlay, Z.overlay, MODAL.wrapper, "animate-in fade-in duration-200")}>
      <div className={cn(R.lg, E["2xl"], "bg-white dark:bg-slate-900 w-full max-w-2xl overflow-hidden border border-slate-200/50 dark:border-slate-700 animate-in slide-in-from-bottom-8 duration-300 flex flex-col", MODAL.maxHeight.lg)}>

        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className={cn(R.md, C.primary.bg, "size-9 flex items-center justify-center")}>
              <ClipboardList className={cn("size-5", C.primary.icon)} />
            </div>
            <div>
              <h2 className={cn(T.h3, "text-slate-900 dark:text-slate-100")}>{t("inv.opname.title")}</h2>
              <p className={cn(T.caption, "text-slate-400")}>{t("inv.opname.desc")}</p>
            </div>
          </div>
          <button onClick={onClose} className={cn(R.md, "p-2 text-slate-300 dark:text-slate-600 hover:text-slate-600 dark:hover:text-slate-300 dark:hover:bg-slate-800 transition-colors cursor-pointer")}>
            <X className="size-5" />
          </button>
        </div>

        {/* Summary Bar */}
        <div className="px-6 py-3 bg-slate-50/70 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800 flex items-center gap-6 shrink-0">
          <div className="flex items-center gap-1.5">
            <span className={cn(T.label, "text-slate-400")}>{t("inv.opname.items_checked")}:</span>
            <span className={cn(T.dataSm, "text-slate-700 dark:text-slate-300")}>{summary.checked}/{summary.total}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className={cn(T.label, "text-rose-400")}>{t("inv.opname.shortage")}:</span>
            <span className={cn(T.dataSm, "text-rose-600")}>{summary.shortage}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className={cn(T.label, "text-amber-400")}>{t("inv.opname.surplus")}:</span>
            <span className={cn(T.dataSm, "text-amber-600")}>{summary.surplus}</span>
          </div>
          <div className="ml-auto">
            <div className="w-32 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-indigo-500 rounded-full transition-all duration-300"
                style={{ width: `${(summary.checked / summary.total) * 100}%` }}
              />
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-y-auto flex-1">
          {categories.map(cat => {
            const catRows = rows.filter(r => r.category === cat);
            const isExpanded = expandedCategory === null || expandedCategory === cat;
            return (
              <div key={cat}>
                <button
                  onClick={() => setExpandedCategory(isExpanded && expandedCategory === cat ? null : cat)}
                  className="w-full px-6 py-2.5 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800 hover:bg-slate-100/70 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  <span className={cn(T.buttonSm, "text-slate-500")}>{cat}</span>
                  <div className="flex items-center gap-2">
                    <span className={cn(T.dataSm, "text-slate-400")}>{catRows.filter(r => r.physical !== null).length}/{catRows.length}</span>
                    {isExpanded && expandedCategory === cat
                      ? <ChevronUp className="size-3.5 text-slate-400" />
                      : <ChevronDown className="size-3.5 text-slate-400" />
                    }
                  </div>
                </button>
                {(expandedCategory === null || expandedCategory === cat) && (
                  <ResponsiveTable
                    label={`${t("inv.opname.title")} - ${cat}`}
                    scrollerClassName="rounded-none border-0 bg-transparent"
                    minWidthClassName={TABLE.minWidth.inventory}
                  >
                    <table className={TABLE.base} aria-label={`${t("inv.opname.title")} - ${cat}`}>
                      <thead className={cn(TABLE.head, "border-b border-slate-50 dark:border-slate-800")}>
                        <tr>
                          <th className={cn(TABLE.headCell, TABLE.stickyColumn, "bg-slate-50 dark:bg-slate-800/50 px-6 py-2")}>{t("inv.opname.product")}</th>
                          <th className={cn(TABLE.headCellNumeric, "px-4 py-2 text-center")}>{t("inv.opname.system_stock")}</th>
                          <th className={cn(TABLE.headCellNumeric, "px-4 py-2 text-center")}>{t("inv.opname.physical_count")}</th>
                          <th className={cn(TABLE.headCellNumeric, "px-4 py-2 text-center")}>{t("inv.opname.discrepancy")}</th>
                          <th className={cn(TABLE.headCell, "px-4 py-2 text-center")}>{t("inv.opname.status")}</th>
                        </tr>
                      </thead>
                      <tbody className={TABLE.body}>
                        {catRows.map(row => (
                          <tr key={row.id} className={cn(TABLE.row, TABLE.rowHover, "group")}>
                            <td className={cn(TABLE.cell, TABLE.stickyColumn, "bg-white px-6 py-3 dark:bg-slate-900 group-hover:bg-slate-50 dark:group-hover:bg-slate-800/50")}>
                              <p className={cn(T.bodySm, "font-bold text-slate-900 dark:text-slate-100")}>{row.name}</p>
                              <p className={cn(T.code, "text-slate-400")}>{row.sku}</p>
                            </td>
                            <td className={cn(TABLE.cellNumeric, "px-4 py-3 text-center")}>
                              <span className={cn(T.dataSm, "text-slate-700 dark:text-slate-300")}>{row.systemStock}</span>
                            </td>
                            <td className={cn(TABLE.cell, "px-4 py-3 text-center")}>
                              <input
                                type="number"
                                min="0"
                                value={physicalCounts[row.id] ?? ""}
                                onChange={e => setCount(row.id, e.target.value)}
                                placeholder="—"
                                className={cn(INPUT.base, INPUT.size.sm, T.dataSm, "w-20 px-2 text-center tabular-nums")}
                              />
                            </td>
                            <td className={cn(TABLE.cell, "px-4 py-3 text-center")}>
                              {row.discrepancy !== null ? (
                                <span className={cn(
                                  T.dataSm, "flex items-center justify-center gap-1",
                                  row.status === "match" ? "text-emerald-600" :
                                  row.status === "surplus" ? "text-amber-600" : "text-rose-600"
                                )}>
                                  {row.status === "surplus" && <TrendingUp className="size-3" />}
                                  {row.status === "shortage" && <TrendingDown className="size-3" />}
                                  {row.discrepancy > 0 ? "+" : ""}{row.discrepancy}
                                </span>
                              ) : (
                                <span className={cn(T.bodySm, "text-slate-300")}>—</span>
                              )}
                            </td>
                            <td className={cn(TABLE.cell, "px-4 py-3 text-center")}>
                              {row.status ? (
                                <span className={cn(
                                  T.micro, R.full, "px-2 py-0.5 border",
                                  row.status === "match" ? "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-800/50" :
                                  row.status === "surplus" ? "bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 border-amber-100 dark:border-amber-800/50" :
                                  "bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 border-rose-100 dark:border-rose-800/50"
                                )}>
                                  {t(`inv.opname.${row.status}`)}
                                </span>
                              ) : (
                                <span className={cn(T.bodySm, "text-slate-300")}>—</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </ResponsiveTable>
                )}
              </div>
            );
          })}
        </div>

        {/* Notes + Footer */}
        <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 space-y-3 shrink-0 bg-slate-50/50 dark:bg-slate-800/50">
          <div className={FIELD.wrapper}>
            <label htmlFor="so-notes" className={LABEL.base}>{t("inv.opname.notes")}</label>
            <input
              id="so-notes"
              type="text"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder={t("inv.opname.notes_placeholder")}
              className={cn(INPUT.base, INPUT.size.md, T.bodySm, "font-bold")}
            />
          </div>
          <div className="flex items-center justify-between">
            {!allFilled && (
              <p className={cn(T.caption, C.warning.icon, "flex items-center gap-1")}>
                <AlertTriangle className="size-3" />
                {t("inv.opname.fill_all")}
              </p>
            )}
            <div className={cn("flex items-center gap-3", allFilled ? "ml-auto" : "")}>
              <button onClick={onClose} className={cn(T.buttonSm, "px-4 py-2.5 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 transition-colors cursor-pointer")}>
                {t("inv.opname.cancel")}
              </button>
              <button
                onClick={handleSubmit}
                disabled={!allFilled || isSubmitting}
                className={cn(
                  cn(T.buttonSm, R.md, "px-5 py-2.5 flex items-center gap-2 transition-all shadow-sm"),
                  !allFilled || isSubmitting
                    ? "bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed"
                    : "bg-indigo-600 text-white hover:bg-indigo-500 cursor-pointer"
                )}
              >
                {isSubmitting ? (
                  <><Loader2 className="size-3.5 animate-spin" /> {t("inv.opname.processing")}</>
                ) : (
                  <><CheckCircle2 className="size-3.5" />{t("inv.opname.submit")}</>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
