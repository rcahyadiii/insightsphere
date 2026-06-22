"use client";

import { useEffect, useState, useMemo } from "react";
import {
  X,
  Loader2,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  ArrowLeftRight,
  History,
  Building2,
  Package,
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
import { FIELD, INPUT, LABEL, SELECT } from "@/app/lib/forms";
import { isDemoDataEnabled } from "@/app/lib/demo-mode";

interface TransferProduct {
  id: string;
  sku: string;
  name: string;
  stock: number;
}

interface Branch {
  id: string;
  name: string;
}

interface TransferHistoryItem {
  id: string;
  date: string;
  from: string;
  to: string;
  product: string;
  qty: number;
  status: "done" | "pending";
}

interface StockTransferModalProps {
  products: TransferProduct[];
  onClose: () => void;
  onSubmit: (data: { fromBranch: string; toBranch: string; productId: string; qty: number; notes: string }) => void;
}

type TabView = "form" | "history";

function getBranchDisplayName(name: string) {
  return name.split(" - ")[1]?.trim() ?? name.split("—")[1]?.trim() ?? name;
}

export function StockTransferModal({ products, onClose, onSubmit }: StockTransferModalProps) {
  const { t } = useTranslation();
  const [branches, setBranches] = useState<Branch[]>([]);
  const [transferHistory, setTransferHistory] = useState<TransferHistoryItem[]>([]);
  const [tab, setTab] = useState<TabView>("form");
  const [fromBranch, setFromBranch] = useState("");
  const [toBranch, setToBranch] = useState("");
  const [productId, setProductId] = useState("");
  const [qty, setQty] = useState("");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const selectedProduct = useMemo(
    () => products.find(p => p.id === productId) ?? null,
    [products, productId]
  );

  useEffect(() => {
    if (!isDemoDataEnabled()) return;

    let cancelled = false;
    void import("@/app/demo/inventory-transfer").then(({ DEMO_INVENTORY_TRANSFER }) => {
      if (!cancelled) {
        setBranches(DEMO_INVENTORY_TRANSFER.branches);
        setTransferHistory(DEMO_INVENTORY_TRANSFER.history);
      }
    });

    return () => {
      cancelled = true;
    };
  }, []);

  const qtyNum = parseInt(qty) || 0;

  const validationError = useMemo(() => {
    if (!fromBranch || !toBranch || !productId || qtyNum <= 0) return null;
    if (fromBranch === toBranch) return t("inv.transfer.same_branch");
    if (selectedProduct && qtyNum > selectedProduct.stock) return t("inv.transfer.insufficient");
    return null;
  }, [fromBranch, toBranch, productId, qtyNum, selectedProduct, t]);

  const isValid =
    fromBranch &&
    toBranch &&
    productId &&
    qtyNum > 0 &&
    notes.trim().length > 0 &&
    !validationError;

  const handleSubmit = async () => {
    if (!isValid) return;
    setIsSubmitting(true);
    await new Promise(r => setTimeout(r, 1100));
    onSubmit({ fromBranch, toBranch, productId, qty: qtyNum, notes: notes.trim() });
    setIsSubmitting(false);
    setSubmitted(true);
  };

  const fromBranchName = branches.find(b => b.id === fromBranch)?.name ?? "";
  const toBranchName = branches.find(b => b.id === toBranch)?.name ?? "";

  if (submitted) {
    return (
      <div className={cn(BACKDROP.overlay, Z.overlay, MODAL.wrapper, "animate-in fade-in duration-200")}>
        <div className={cn(R.lg, E["2xl"], "bg-white dark:bg-slate-900 w-full max-w-sm overflow-hidden border border-slate-200/50 dark:border-slate-700 animate-in zoom-in-95 duration-300 p-8 flex flex-col items-center text-center gap-5")}>
          <div className={cn(R.lg, "size-14 bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center")}>
            <CheckCircle2 className={cn("size-7", C.primary.icon)} />
          </div>
          <div>
            <h3 className={cn(T.h3, "text-slate-900 dark:text-slate-100")}>{t("inv.transfer.success_title")}</h3>
            <p className={cn(T.label, "text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed")}>
              {t("inv.transfer.success_desc", {
                qty: qtyNum,
                unit: t("table.unit"),
                product: selectedProduct?.name ?? "",
                from: getBranchDisplayName(fromBranchName),
                to: getBranchDisplayName(toBranchName),
              })}
            </p>
          </div>
          <div className={cn(R.md, "w-full bg-slate-50 dark:bg-slate-800 p-4 border border-slate-100 dark:border-slate-700 space-y-2 text-left")}>
            <div className="flex justify-between">
              <span className={cn(T.label, "text-slate-400")}>{t("inv.transfer.product")}</span>
              <span className="font-bold text-slate-700 dark:text-slate-300">{selectedProduct?.name}</span>
            </div>
            <div className="flex justify-between">
              <span className={cn(T.label, "text-slate-400")}>{t("inv.transfer.qty")}</span>
              <span className="font-bold text-slate-700 dark:text-slate-300">{qtyNum} {t("table.unit")}</span>
            </div>
            <div className="flex justify-between">
              <span className={cn(T.label, "text-slate-400")}>{t("common.status")}</span>
              <span className={cn(T.micro, R.full, "px-2 py-0.5 bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 border border-amber-100 dark:border-amber-800/50")}>
                {t("inv.transfer.status_pending")}
              </span>
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
      <div className={cn(R.lg, E["2xl"], "bg-white dark:bg-slate-900 w-full max-w-lg overflow-hidden border border-slate-200/50 dark:border-slate-700 animate-in slide-in-from-bottom-8 duration-300 flex flex-col", MODAL.maxHeight.lg)}>

        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className={cn(R.md, "size-9 bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center")}>
              <ArrowLeftRight className={cn("size-4", C.primary.icon)} />
            </div>
            <div>
              <h2 className={cn(T.h3, "text-slate-900 dark:text-slate-100")}>{t("inv.transfer.title")}</h2>
              <p className={cn(T.caption, "text-slate-400")}>{t("inv.transfer.desc")}</p>
            </div>
          </div>
          <button onClick={onClose} className={cn(R.md, "p-2 text-slate-300 dark:text-slate-600 hover:text-slate-600 dark:hover:text-slate-300 dark:hover:bg-slate-800 transition-colors cursor-pointer")}>
            <X className="size-5" />
          </button>
        </div>

        {/* Tab Switch */}
        <div className="flex border-b border-slate-100 dark:border-slate-800 shrink-0">
          {(["form", "history"] as TabView[]).map(v => (
            <button
              key={v}
              onClick={() => setTab(v)}
              className={cn(
                cn(T.buttonSm, "flex-1 py-3 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"),
                tab === v
                  ? "text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600"
                  : "text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300"
              )}
            >
              {v === "form" ? <ArrowLeftRight className="size-3.5" /> : <History className="size-3.5" />}
              {v === "form" ? t("inv.transfer.new") : t("inv.transfer.history")}
            </button>
          ))}
        </div>

        {tab === "form" ? (
          <>
            <div className="p-6 space-y-5 overflow-y-auto flex-1">

              {/* Branch Selector */}
              <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
                <div className={FIELD.wrapper}>
                  <label htmlFor="tf-from" className={cn(LABEL.base, "flex items-center gap-1")}>
                    <Building2 className="size-3" /> {t("inv.transfer.from")}
                  </label>
                  <select
                    id="tf-from"
                    value={fromBranch}
                    onChange={e => setFromBranch(e.target.value)}
                    className={cn(SELECT.base, SELECT.size.md, T.label, "font-bold cursor-pointer")}
                  >
                    <option value="">{t("inv.transfer.select_branch")}</option>
                    {branches.map(b => (
                      <option key={b.id} value={b.id}>{getBranchDisplayName(b.name)}</option>
                    ))}
                  </select>
                </div>
                <div className="mt-5">
                  <ArrowRight className="size-4 text-slate-400" />
                </div>
                <div className={FIELD.wrapper}>
                  <label htmlFor="tf-to" className={cn(LABEL.base, "flex items-center gap-1")}>
                    <Building2 className="size-3" /> {t("inv.transfer.to")}
                  </label>
                  <select
                    id="tf-to"
                    value={toBranch}
                    onChange={e => setToBranch(e.target.value)}
                    className={cn(SELECT.base, SELECT.size.md, T.label, "font-bold cursor-pointer")}
                  >
                    <option value="">{t("inv.transfer.select_branch")}</option>
                    {branches.filter(b => b.id !== fromBranch).map(b => (
                      <option key={b.id} value={b.id}>{getBranchDisplayName(b.name)}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Product */}
              <div className={FIELD.wrapper}>
                <label htmlFor="tf-product" className={cn(LABEL.base, "flex items-center gap-1")}>
                  <Package className="size-3" /> {t("inv.transfer.product")}
                </label>
                <select
                  id="tf-product"
                  value={productId}
                  onChange={e => setProductId(e.target.value)}
                  className={cn(SELECT.base, SELECT.size.md, T.label, "font-bold cursor-pointer")}
                >
                  <option value="">{t("inv.transfer.select_product")}</option>
                  {products.map(p => (
                    <option key={p.id} value={p.id}>{t("inv.transfer.stock_option", { product: p.name, stock: p.stock })}</option>
                  ))}
                </select>
              </div>

              {/* Stock info */}
              {selectedProduct && (
                <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-3 border border-slate-100 dark:border-slate-700 flex items-center justify-between">
                  <span className={cn(T.label, "text-slate-500 dark:text-slate-400")}>{t("inv.transfer.available_at_source")}</span>
                  <span className={cn(T.body, "font-bold text-slate-900 dark:text-slate-100 tabular-nums")}>{selectedProduct.stock} {t("table.unit")}</span>
                </div>
              )}

              {/* Quantity */}
              <div className={FIELD.wrapper}>
                <label htmlFor="tf-qty" className={LABEL.base}>{t("inv.transfer.qty")}</label>
                <input
                  id="tf-qty"
                  type="number"
                  min="1"
                  max={selectedProduct?.stock ?? undefined}
                  value={qty}
                  onChange={e => setQty(e.target.value)}
                  placeholder="0"
                  className={cn(INPUT.base, INPUT.size.lg, "text-lg font-bold text-center tabular-nums")}
                />
              </div>

              {/* Notes */}
              <div className={FIELD.wrapper}>
                <label htmlFor="tf-notes" className={LABEL.base}>{t("inv.transfer.notes")}</label>
                <input
                  id="tf-notes"
                  type="text"
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder={t("inv.transfer.notes_placeholder")}
                  className={cn(INPUT.base, INPUT.size.md, T.bodySm, "font-bold")}
                />
              </div>

              {/* Preview */}
              {fromBranch && toBranch && selectedProduct && qtyNum > 0 && !validationError && (
                <div className="bg-slate-900 rounded-xl p-4 animate-in slide-in-from-top-4 duration-300">
                  <p className={cn(T.h4, "text-slate-500 mb-3")}>{t("inv.transfer.preview")}</p>
                  <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 text-center">
                    <div>
                      <p className={cn(T.label, "text-slate-500 mb-1")}>{t("inv.transfer.origin")}</p>
                      <p className={cn(T.label, "font-bold text-white leading-tight")}>{getBranchDisplayName(fromBranchName)}</p>
                      <p className={cn(T.bodySm, "font-bold text-rose-400 mt-1 tabular-nums")}>−{qtyNum}</p>
                    </div>
                    <ArrowRight className="size-4 text-slate-600" />
                    <div>
                      <p className={cn(T.label, "text-slate-500 mb-1")}>{t("inv.transfer.destination")}</p>
                      <p className={cn(T.label, "font-bold text-white leading-tight")}>{getBranchDisplayName(toBranchName)}</p>
                      <p className={cn(T.bodySm, "font-bold text-emerald-400 mt-1 tabular-nums")}>+{qtyNum}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Validation error */}
              {validationError && (
                <div className={cn("flex items-center gap-2 text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 p-3 rounded-xl border border-amber-100 dark:border-amber-800/50", T.label, "font-bold")}>
                  <AlertTriangle className="size-3.5 shrink-0" />
                  {validationError}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-3 bg-slate-50/50 dark:bg-slate-800/50 shrink-0">
              <button onClick={onClose} className={cn(T.buttonSm, "px-4 py-2.5 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 transition-colors cursor-pointer")}>
                {t("inv.transfer.cancel")}
              </button>
              <button
                onClick={handleSubmit}
                disabled={!isValid || isSubmitting}
                className={cn(
                  cn(T.buttonSm, R.md, "px-5 py-2.5 flex items-center gap-2 transition-all shadow-sm"),
                  !isValid || isSubmitting
                    ? "bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed"
                    : "bg-indigo-600 text-white hover:bg-indigo-500 cursor-pointer"
                )}
              >
                {isSubmitting ? (
                  <><Loader2 className="size-3.5 animate-spin" /> {t("common.processing")}</>
                ) : (
                  <><ArrowLeftRight className="size-3.5" />{t("inv.transfer.submit")}</>
                )}
              </button>
            </div>
          </>
        ) : (
          /* History Tab */
          <div className="overflow-y-auto flex-1">
            <ResponsiveTable
              label={t("inv.transfer.history")}
              scrollerClassName="rounded-none border-0 bg-transparent"
              minWidthClassName={TABLE.minWidth.inventory}
            >
              <table className={TABLE.base} aria-label={t("inv.transfer.history")}>
                <thead className={cn(TABLE.head, "border-b border-slate-100 dark:border-slate-800")}>
                  <tr>
                    <th className={cn(TABLE.headCell, TABLE.stickyColumn, "bg-slate-50 dark:bg-slate-800/50 px-5")}>{t("common.id")}</th>
                    <th className={TABLE.headCell}>{t("inv.transfer.date")}</th>
                    <th className={TABLE.headCell}>{t("inv.transfer.route")}</th>
                    <th className={TABLE.headCell}>{t("inv.transfer.product")}</th>
                    <th className={cn(TABLE.headCellNumeric, "text-center")}>{t("common.qty")}</th>
                    <th className={cn(TABLE.headCell, "text-center")}>{t("common.status")}</th>
                  </tr>
                </thead>
                <tbody className={TABLE.body}>
                  {transferHistory.map(item => (
                    <tr key={item.id} className={cn(TABLE.row, TABLE.rowHover, "group")}>
                      <td className={cn(TABLE.cell, T.bodySm, TABLE.stickyColumn, "bg-white px-5 py-3 font-bold text-indigo-600 dark:bg-slate-900 dark:text-indigo-400 group-hover:bg-slate-50 dark:group-hover:bg-slate-800/50")}>{item.id}</td>
                      <td className={cn(TABLE.cell, T.bodySm, "py-3 font-bold text-slate-500 dark:text-slate-400")}>{item.date}</td>
                      <td className={TABLE.cell}>
                        <div className={cn("flex items-center gap-1.5 text-slate-700 dark:text-slate-300", T.label, "font-bold")}>
                          <span>{item.from}</span>
                          <ArrowRight className="size-3 text-slate-400" />
                          <span>{item.to}</span>
                        </div>
                      </td>
                      <td className={cn(TABLE.cell, T.bodySm, "font-bold text-slate-800 dark:text-slate-200")}>{item.product}</td>
                      <td className={cn(TABLE.cellNumeric, T.dataSm, "text-center font-bold text-slate-700 dark:text-slate-300")}>{item.qty}</td>
                      <td className={cn(TABLE.cell, "text-center")}>
                        <span className={cn(
                          cn(T.micro, R.full, "px-2 py-0.5 border"),
                          item.status === "done"
                            ? "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-800/50"
                            : "bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 border-amber-100 dark:border-amber-800/50"
                        )}>
                          {item.status === "done" ? t("inv.transfer.status_done") : t("inv.transfer.status_pending")}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </ResponsiveTable>
          </div>
        )}
      </div>
    </div>
  );
}
