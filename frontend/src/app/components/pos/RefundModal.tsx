"use client";

import { useEffect, useState, useMemo } from "react";
import { X, RotateCcw, CheckCircle2, Loader2, AlertTriangle, Search } from "lucide-react";
import { cn } from "@/app/lib/utils";
import { T } from "@/app/lib/typography";
import { C } from "@/app/lib/colors";
import { R } from "@/app/lib/radii";
import { MODAL } from "@/app/lib/containers";
import { E } from "@/app/lib/elevation";
import { formatRupiah } from "@/app/lib/format";
import { useTranslation } from "@/app/i18n";
import { INPUT } from "@/app/lib/forms";
import { isDemoDataEnabled } from "@/app/lib/demo-mode";

interface RefundItem {
  id: string;
  name: string;
  qty: number;
  price: number;
  selected: boolean;
  refundQty: number;
}

interface RefundTransaction {
  id: string;
  date: string;
  time: string;
  total: number;
  method: string;
  items: { id: string; name: string; qty: number; price: number }[];
}

interface RefundModalProps {
  onClose: () => void;
}

type Step = "select_txn" | "select_items" | "confirm" | "success";

export function RefundModal({ onClose }: RefundModalProps) {
  const { t } = useTranslation();
  const [step, setStep] = useState<Step>("select_txn");
  const [search, setSearch] = useState("");
  const [transactions, setTransactions] = useState<RefundTransaction[]>([]);
  const [selectedTxn, setSelectedTxn] = useState<RefundTransaction | null>(null);
  const [refundItems, setRefundItems] = useState<RefundItem[]>([]);
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const filteredTxns = useMemo(() => {
    const q = search.toLowerCase();
    return transactions.filter(t =>
      t.id.toLowerCase().includes(q) || t.date.toLowerCase().includes(q)
    );
  }, [transactions, search]);

  useEffect(() => {
    if (!isDemoDataEnabled()) return;

    let cancelled = false;
    void import("@/app/demo/refund-transactions").then(({ DEMO_REFUND_TRANSACTIONS }) => {
      if (!cancelled) setTransactions(DEMO_REFUND_TRANSACTIONS);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  const selectTxn = (txn: RefundTransaction) => {
    setSelectedTxn(txn);
    setRefundItems(txn.items.map(i => ({
      id: i.id, name: i.name, qty: i.qty, price: i.price,
      selected: false, refundQty: i.qty,
    })));
    setStep("select_items");
  };

  const toggleItem = (id: string) => {
    setRefundItems(prev => prev.map(i => i.id === id ? { ...i, selected: !i.selected } : i));
  };

  const setQty = (id: string, qty: number) => {
    setRefundItems(prev => prev.map(i => i.id === id ? { ...i, refundQty: Math.max(1, Math.min(qty, i.qty)) } : i));
  };

  const refundTotal = refundItems
    .filter(i => i.selected)
    .reduce((sum, i) => sum + i.price * i.refundQty, 0);

  const selectedCount = refundItems.filter(i => i.selected).length;

  const handleSubmit = async () => {
    setIsSubmitting(true);
    await new Promise(r => setTimeout(r, 1200));
    setIsSubmitting(false);
    setStep("success");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className={cn(R.xl, E["2xl"], "bg-white dark:bg-slate-900 w-full max-w-lg overflow-hidden border border-slate-200 dark:border-slate-700 animate-in zoom-in-95 slide-in-from-bottom-4 duration-200 flex flex-col", MODAL.maxHeight.md)}>

        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className={cn(R.md, "size-8 bg-rose-50 dark:bg-rose-900/40 flex items-center justify-center")}>
              <RotateCcw className={cn("size-4", C.destructive.icon)} />
            </div>
            <div>
              <h2 className={cn(T.h3, "text-slate-900 dark:text-slate-100")}>{t("pos.refund.title")}</h2>
              <p className={cn(T.caption, "text-slate-400 dark:text-slate-500")}>
                {step === "select_txn" ? t("pos.refund.step.select_txn") : step === "select_items" ? t("pos.refund.step.select_items") : step === "confirm" ? t("pos.refund.step.confirm") : t("pos.refund.step.success")}
              </p>
            </div>
          </div>
          <button onClick={onClose} className={cn(R.md, "p-2 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer")}>
            <X className="size-4 text-slate-500" />
          </button>
        </div>

        {/* Step: Select Transaction */}
        {step === "select_txn" && (
          <>
            <div className="px-6 pt-4 shrink-0">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-slate-400" />
                <input
                  type="text"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder={t("pos.refund.search")}
                  autoFocus
                  className={cn(INPUT.base, INPUT.size.md, T.bodySm, "pl-9 pr-3 font-bold")}
                />
              </div>
            </div>
            <div className="overflow-y-auto flex-1 px-6 pb-6 mt-3 space-y-2">
              {filteredTxns.map(txn => (
                <button
                  key={txn.id}
                  onClick={() => selectTxn(txn)}
                  className={cn(R.md, "w-full text-left bg-slate-50 dark:bg-slate-800/50 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 border border-slate-100 dark:border-slate-700 hover:border-indigo-200 dark:hover:border-indigo-800 p-4 transition-all cursor-pointer group")}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className={cn(T.bodyEmphasis, "font-bold", C.primary.icon)}>{txn.id}</p>
                      <p className={cn(T.bodySm, "font-bold text-slate-500 mt-0.5")}>{txn.date} · {txn.time} · {txn.method}</p>
                      <p className={cn(T.caption, "text-slate-400 mt-0.5")}>{txn.items.length} item</p>
                    </div>
                    <div className="text-right">
                      <p className={cn(T.bodyEmphasis, "font-bold text-slate-900 dark:text-slate-100")}>{formatRupiah(txn.total)}</p>
                      <p className={cn(T.caption, "font-bold text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity mt-1")}>{t("pos.refund.click_hint")}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </>
        )}

        {/* Step: Select Items */}
        {step === "select_items" && selectedTxn && (
          <>
            <div className="px-6 py-3 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800 shrink-0">
              <p className={cn(T.code, C.primary.icon)}>{selectedTxn.id}</p>
              <p className={cn(T.caption, "text-slate-500")}>{selectedTxn.date} · {selectedTxn.time} · {formatRupiah(selectedTxn.total)}</p>
            </div>
            <div className="overflow-y-auto flex-1 p-6 space-y-2">
              {refundItems.map(item => (
                <button
                  type="button"
                  key={item.id}
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer w-full text-left",
                    item.selected ? "bg-rose-50 dark:bg-rose-900/20 border-rose-200 dark:border-rose-800/50" : "bg-slate-50 dark:bg-slate-800/50 border-slate-100 dark:border-slate-700 hover:border-slate-200 dark:hover:border-slate-600"
                  )}
                  onClick={() => toggleItem(item.id)}
                >
                  <div className={cn(
                    "w-5 h-5 rounded flex items-center justify-center border-2 flex-shrink-0 transition-all",
                    item.selected ? "bg-rose-500 border-rose-500" : "border-slate-300"
                  )}>
                    {item.selected && <CheckCircle2 className="size-3 text-white" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={cn(T.bodySm, "font-bold text-slate-900 dark:text-slate-100")}>{item.name}</p>
                    <p className={cn(T.dataSm, "text-slate-500")}>{formatRupiah(item.price)} × {item.qty}</p>
                  </div>
                  {item.selected && (
                    <div
                      className="flex items-center gap-1 bg-white dark:bg-slate-800 border border-rose-200 dark:border-rose-800 rounded-lg px-2 py-1"
                      onClick={e => e.stopPropagation()}
                    >
                      <button onClick={() => setQty(item.id, item.refundQty - 1)} className={cn(T.bodySm, "text-slate-500 hover:text-rose-600 cursor-pointer font-bold")}>−</button>
                      <span className={cn(T.bodyEmphasis, "font-bold text-rose-600", MODAL.counterValue)}>{item.refundQty}</span>
                      <button onClick={() => setQty(item.id, item.refundQty + 1)} className={cn(T.bodySm, "text-slate-500 hover:text-rose-600 cursor-pointer font-bold")}>+</button>
                    </div>
                  )}
                </button>
              ))}
            </div>
            <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0 bg-slate-50/50 dark:bg-slate-800/30">
              <div>
                <p className={cn(T.label, "text-slate-400")}>{t("pos.refund.items_selected", { count: selectedCount })}</p>
                {refundTotal > 0 && <p className={cn(T.h3, "text-rose-600")}>−{formatRupiah(refundTotal)}</p>}
              </div>
              <div className="flex gap-2">
                <button onClick={() => setStep("select_txn")} className={cn(T.buttonSm, R.md, "px-4 py-2 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer")}>{t("pos.refund.back")}</button>
                <button
                  onClick={() => setStep("confirm")}
                  disabled={selectedCount === 0}
                  className={cn(T.buttonSm, R.md, "px-5 py-2 bg-rose-500 text-white disabled:opacity-40 cursor-pointer hover:bg-rose-600 transition-all")}
                >
                  {t("pos.refund.next")}
                </button>
              </div>
            </div>
          </>
        )}

        {/* Step: Confirm */}
        {step === "confirm" && selectedTxn && (
          <>
            <div className="overflow-y-auto flex-1 p-6 space-y-4">
              <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 flex gap-3">
                <AlertTriangle className={cn("size-4 flex-shrink-0 mt-0.5", C.warning.icon)} />
                <p className={cn(T.label, "font-bold", C.warning.text)}>{t("pos.refund.warning")}</p>
              </div>
              <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-4 border border-slate-100 dark:border-slate-700 space-y-2">
                {refundItems.filter(i => i.selected).map(item => (
                  <div key={item.id} className={cn("flex justify-between", T.label)}>
                    <span className="font-bold text-slate-700 dark:text-slate-300">{item.name} ×{item.refundQty}</span>
                    <span className="font-bold text-rose-600">−{formatRupiah(item.price * item.refundQty)}</span>
                  </div>
                ))}
                <div className="pt-2 border-t border-slate-200 flex justify-between">
                  <span className={cn(T.bodyEmphasis, "font-bold text-slate-900 dark:text-slate-100 uppercase")}>{t("pos.refund.total")}</span>
                  <span className={cn(T.bodyEmphasis, "font-bold text-rose-600")}>−{formatRupiah(refundTotal)}</span>
                </div>
              </div>
              <div>
                <label htmlFor="rf-reason" className={cn(T.label, "text-slate-400 block mb-1.5")}>{t("pos.refund.reason")}</label>
                <input
                  id="rf-reason"
                  type="text"
                  value={reason}
                  onChange={e => setReason(e.target.value)}
                  placeholder={t("pos.refund.reason_placeholder")}
                  className={cn(T.bodySm, "w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-2.5 px-4 font-bold text-slate-900 dark:text-slate-100 focus:outline-none focus:border-rose-400 transition-all")}
                />
              </div>
            </div>
            <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-3 shrink-0">
              <button onClick={() => setStep("select_items")} className={cn(T.buttonSm, R.md, "px-4 py-2 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer")}>{t("pos.refund.back")}</button>
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className={cn(T.buttonSm, R.md, "px-5 py-2.5 bg-rose-500 hover:bg-rose-600 text-white flex items-center gap-2 cursor-pointer transition-all")}
              >
                {isSubmitting ? <><Loader2 className="size-3.5 animate-spin" /> {t("pos.pay.processing")}</> : <><RotateCcw className="size-3.5" /> {t("pos.refund.submit")}</>}
              </button>
            </div>
          </>
        )}

        {/* Step: Success */}
        {step === "success" && (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center gap-4">
            <div className={cn(R.lg, C.success.bg, "size-14 flex items-center justify-center")}>
              <CheckCircle2 className={cn("size-7", C.success.icon)} />
            </div>
            <div>
              <h3 className={cn(T.h3, "text-slate-900 dark:text-slate-100")}>{t("pos.refund.success_title")}</h3>
              <p className={cn(T.bodySm, "text-slate-500 mt-1")}>{t("pos.refund.success_desc", { amount: formatRupiah(refundTotal) })}</p>
            </div>
            <button onClick={onClose} className={cn(T.buttonSm, R.md, "px-6 py-2.5 bg-indigo-600 text-white cursor-pointer hover:bg-indigo-500 transition-all")}>
              {t("pos.refund.close")}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
