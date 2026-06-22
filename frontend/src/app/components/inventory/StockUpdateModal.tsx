"use client";

import { useState, useMemo } from "react";
import { X, Loader2, PackagePlus, PackageMinus, RefreshCcw, ArrowRight } from "lucide-react";
import { cn } from "@/app/lib/utils";
import { T } from "@/app/lib/typography";
import { R } from "@/app/lib/radii";
import { E } from "@/app/lib/elevation";
import { useTranslation } from "@/app/i18n";
import { FIELD, INPUT, LABEL } from "@/app/lib/forms";

type StockUpdateType = "in" | "out" | "adjustment";

interface StockUpdateModalProps {
  product: {
    id: string;
    name: string;
    sku: string;
    currentStock: number;
    unit: string;
  };
  onClose: () => void;
  onSubmit: (data: { type: StockUpdateType; quantity: number; reason: string }) => void | Promise<void>;
}

export function StockUpdateModal({ product, onClose, onSubmit }: StockUpdateModalProps) {
  const { t } = useTranslation();
  const [type, setType] = useState<StockUpdateType>("in");
  const [quantity, setQuantity] = useState<string>("");
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const qty = parseInt(quantity) || 0;

  const newStock = useMemo(() => {
    if (type === "in") return product.currentStock + qty;
    if (type === "out") return Math.max(0, product.currentStock - qty);
    return qty; // adjustment = set to exact value
  }, [type, qty, product.currentStock]);

  const isValid = qty > 0 && reason.trim().length > 0;

  const handleSubmit = async () => {
    if (!isValid) return;
    setIsSubmitting(true);
    await new Promise(r => setTimeout(r, 1000));
    onSubmit({ type, quantity: qty, reason: reason.trim() });
    setIsSubmitting(false);
  };

  const typeOptions: { id: StockUpdateType; label: string; icon: typeof PackagePlus; color: string }[] = [
    { id: "in", label: t("inv.stock.type_in"), icon: PackagePlus, color: "emerald" },
    { id: "out", label: t("inv.stock.type_out"), icon: PackageMinus, color: "rose" },
    { id: "adjustment", label: t("inv.stock.type_adjust"), icon: RefreshCcw, color: "amber" },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-200">
      <div className={cn(R.xl, E["2xl"], "bg-white dark:bg-slate-900 w-full max-w-md overflow-hidden border border-slate-200/50 dark:border-slate-700 animate-in slide-in-from-bottom-8 duration-500")}>
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div>
            <h2 className={cn(T.h3, "text-slate-900 dark:text-slate-100")}>{t("inv.stock.title")}</h2>
            <p className={cn(T.caption, "text-slate-400")}>
              {product.name} · {product.sku}
            </p>
          </div>
          <button onClick={onClose} className={cn(R.md, "p-2 text-slate-300 dark:text-slate-600 hover:text-slate-600 dark:hover:text-slate-300 dark:hover:bg-slate-800 transition-colors")}>
            <X className="size-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Current Stock */}
          <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-3 flex items-center justify-between border border-slate-100 dark:border-slate-700">
            <span className={cn(T.label, "text-slate-500 dark:text-slate-400")}>{t("inv.stock.current")}</span>
            <span className={cn(T.h2, "text-slate-900 dark:text-slate-100 font-data tabular-nums")}>{product.currentStock} <span className={cn(T.bodySm, "text-slate-400")}>{product.unit}</span></span>
          </div>

          {/* Type Selector */}
          <div>
            <label id="su-type-label" className={cn(T.label, "text-slate-500 uppercase tracking-widest mb-2 block")}>{t("inv.stock.type")}</label>
            <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-labelledby="su-type-label">
              {typeOptions.map(opt => {
                const Icon = opt.icon;
                const isActive = type === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setType(opt.id)}
                    className={cn(
                      "flex flex-col items-center gap-1.5 py-3 rounded-xl border-2 transition-all cursor-pointer text-center",
                      isActive
                        ? opt.color === "emerald" ? "border-emerald-500 bg-emerald-50/50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400" :
                          opt.color === "rose" ? "border-rose-500 bg-rose-50/50 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400" :
                          "border-amber-500 bg-amber-50/50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400"
                        : "border-slate-100 dark:border-slate-700 text-slate-400 hover:border-slate-200 dark:hover:border-slate-600"
                    )}
                  >
                    <Icon className="size-4" />
                    <span className={cn(T.buttonSm)}>{opt.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Quantity */}
          <div className={FIELD.wrapper}>
            <label htmlFor="su-qty" className={LABEL.base}>{t("inv.stock.quantity")}</label>
            <input
              id="su-qty"
              type="number"
              min="1"
              value={quantity}
              onChange={e => setQuantity(e.target.value)}
              placeholder="0"
              autoFocus
              className={cn(INPUT.base, INPUT.size.lg, "text-lg font-bold tabular-nums text-center")}
            />
          </div>

          {/* Reason */}
          <div className={FIELD.wrapper}>
            <label htmlFor="su-reason" className={LABEL.base}>{t("inv.stock.reason")}</label>
            <input
              id="su-reason"
              type="text"
              value={reason}
              onChange={e => setReason(e.target.value)}
              placeholder={t("inv.stock.reason_placeholder")}
              className={cn(INPUT.base, INPUT.size.md, T.bodySm, "font-bold")}
            />
          </div>

          {/* Preview */}
          {qty > 0 && (
            <div className="bg-slate-900 rounded-xl p-4 flex items-center justify-between animate-in slide-in-from-top-4 duration-300">
              <div className="text-center">
                <p className={cn(T.label, "text-slate-500 mb-1")}>{t("inv.stock.current")}</p>
                <p className={cn(T.h2, "text-white font-data tabular-nums")}>{product.currentStock}</p>
              </div>
              <ArrowRight className="size-5 text-slate-600" />
              <div className="text-center">
                <p className={cn(T.label, "text-slate-500 mb-1")}>{t("inv.stock.new_stock")}</p>
                <p className={cn(
                  "text-lg font-bold font-data",
                  newStock > product.currentStock ? "text-emerald-400" :
                  newStock < product.currentStock ? "text-rose-400" : "text-amber-400"
                )}>
                  {newStock}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-3 bg-slate-50/50 dark:bg-slate-800/50">
          <button type="button" onClick={onClose} className={cn(T.buttonSm, "px-4 py-2.5 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 transition-colors")}>
            {t("inv.stock.cancel")}
          </button>
          <button
            onClick={handleSubmit}
            disabled={!isValid || isSubmitting}
            className={cn(
              T.buttonSm, R.md, "px-5 py-2.5 flex items-center gap-2 transition-all shadow-sm",
              !isValid || isSubmitting
                ? "bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed"
                : "bg-indigo-600 text-white hover:bg-indigo-500 cursor-pointer"
            )}
          >
            {isSubmitting ? (
              <><Loader2 className="size-3.5 animate-spin" /> Processing</>
            ) : (
              t("inv.stock.confirm")
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
