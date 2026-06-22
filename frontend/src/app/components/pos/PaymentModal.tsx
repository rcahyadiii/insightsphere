"use client";

import { useState } from "react";
import { 
  X, 
  CreditCard, 
  Banknote, 
  QrCode, 
  CheckCircle2, 
  Loader2, 
  ArrowRight,
  Receipt,
  Ticket
} from "lucide-react";
import { cn } from "@/app/lib/utils";
import { T } from "@/app/lib/typography";
import { C } from "@/app/lib/colors";
import { R } from "@/app/lib/radii";
import { E, Z } from "@/app/lib/elevation";
import { formatRupiah } from "@/app/lib/format";
import { useTranslation } from "@/app/i18n";
import { CartItem, CartSummary, TransactionResponse } from "@/app/types/pos";

interface PaymentCart {
  summary: CartSummary;
  items: CartItem[];
  clearCart: () => void;
}

interface CheckoutResult {
  success: boolean;
  data?: TransactionResponse;
  error?: string;
}

interface CheckoutController {
  processCheckout: (
    items: CartItem[],
    paymentMethod: "CASH" | "QRIS",
    clearCart: () => void
  ) => Promise<CheckoutResult | void>;
  isSubmitting: boolean;
  lastTransaction: TransactionResponse | null;
}

interface PaymentModalProps {
  cart: PaymentCart;
  checkout: CheckoutController;
  onClose: () => void;
}

const RECEIPT_PRINT = {
  borderColor: "black",
} as const;

/**
 * PaymentModal — Dialog Pemilihan Pembayaran & Konfirmasi.
 * 
 * Sesuai [HARDENED] plan:
 * - Menangani visual feedback saat proses (Loading/Success/Error).
 * - Mendukung input nominal tunai (Cash) dan QRIS.
 * - Menampilkan kembalian.
 */
export function PaymentModal({ cart, checkout, onClose }: PaymentModalProps) {
  const { t, lang } = useTranslation();
  const { summary, items, clearCart } = cart;
  const { processCheckout, isSubmitting, lastTransaction } = checkout;

  const [method, setMethod] = useState<"CASH" | "QRIS" | "SPLIT">("CASH");
  const [cashReceived, setCashReceived] = useState<string>("");
  const [splitCash, setSplitCash] = useState<string>("");
  const [isSuccess, setIsSuccess] = useState(false);
  const rupiahPrefix = t("common.currency.rupiah");

  const cashAmount = parseFloat(cashReceived) || 0;
  const change = cashAmount - summary.total;
  const splitCashAmt = parseFloat(splitCash) || 0;
  const splitQrisAmt = Math.max(0, summary.total - splitCashAmt);

  const printReceipt = () => {
    const now = new Date();
    const receiptLocale = lang === "ID" ? "id-ID" : "en-US";
    const dateStr = now.toLocaleDateString(receiptLocale, { day: "2-digit", month: "long", year: "numeric" });
    const timeStr = now.toLocaleTimeString(receiptLocale, { hour: "2-digit", minute: "2-digit" });
    const itemRows = items.map((item) =>
      `<tr>
        <td style="padding:4px 8px">${item.name}</td>
        <td style="padding:4px 8px;text-align:center">${item.quantity}</td>
        <td style="padding:4px 8px;text-align:right">${formatRupiah(item.price)}</td>
        <td style="padding:4px 8px;text-align:right">${formatRupiah(item.price * item.quantity)}</td>
      </tr>`
    ).join("");
    const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>${t("pos.receipt.title")}</title>
      <style>
        body { font-family: 'Courier New', monospace; font-size: 12px; max-width: 300px; margin: 0 auto; padding: 16px; }
        h2 { text-align: center; font-size: 14px; margin: 0 0 4px; }
        .center { text-align: center; }
        .divider { border-top: 1px dashed ${RECEIPT_PRINT.borderColor}; margin: 8px 0; }
        table { width: 100%; border-collapse: collapse; }
        th { border-bottom: 1px solid ${RECEIPT_PRINT.borderColor}; padding: 4px 8px; font-size: 11px; }
        .total-row td { font-weight: bold; border-top: 1px dashed ${RECEIPT_PRINT.borderColor}; padding-top: 6px; }
        .footer { text-align: center; margin-top: 12px; font-size: 11px; }
      </style></head><body>
      <h2>${t("pos.receipt.title")}</h2>
      <p class="center" style="font-size:11px;margin:2px 0">${dateStr} &mdash; ${timeStr}</p>
      <p class="center" style="font-size:10px;margin:2px 0">${t("pos.receipt.id")}: ${lastTransaction?.id ?? "-"}</p>
      <div class="divider"></div>
      <table style="width:100%;border-collapse:collapse">
        <thead><tr><th style="text-align:left">${t("pos.receipt.product")}</th><th>${t("pos.receipt.qty")}</th><th style="text-align:right">${t("pos.receipt.price")}</th><th style="text-align:right">${t("pos.receipt.subtotal_short")}</th></tr></thead>
        <tbody>${itemRows}</tbody>
        <tfoot>
          <tr class="total-row"><td colspan="3">${t("pos.cart.total")}</td><td style="text-align:right">${formatRupiah(summary.total)}</td></tr>
          ${method === "CASH" ? `<tr><td colspan="3">${t("pos.receipt.cash")}</td><td style="text-align:right">${formatRupiah(cashAmount)}</td></tr><tr><td colspan="3">${t("pos.receipt.change")}</td><td style="text-align:right">${formatRupiah(cashAmount - summary.total)}</td></tr>` : `<tr><td colspan="3">QRIS</td><td style="text-align:right">${t("pos.receipt.paid")}</td></tr>`}
        </tfoot>
      </table>
      <div class="footer"><div class="divider"></div><p>${t("pos.receipt.thanks")}</p><p>InsightSphere &mdash; ${t("pos.receipt.brand_tagline")}</p></div>
      </body></html>`;
    const w = window.open("", "_blank", "width=400,height=600");
    if (w) { w.document.write(html); w.document.close(); w.focus(); w.print(); w.close(); }
  };

  const handlePay = async () => {
    if (method === "CASH" && cashAmount < summary.total) return;
    if (method === "SPLIT" && (splitCashAmt <= 0 || splitCashAmt >= summary.total)) return;

    const result = await processCheckout(items, method === "SPLIT" ? "CASH" : method, clearCart);
    if (result && result.success) {
      setIsSuccess(true);
    }
  };

  if (isSuccess) {
    return (
      <div className={cn(Z.modal, "fixed inset-0 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-xl animate-in fade-in duration-300")}>
        <div className={cn(R.xl, E["2xl"], "bg-white dark:bg-slate-900 w-full max-w-md p-10 text-center border border-slate-200 dark:border-slate-700 animate-in zoom-in-95 slide-in-from-bottom-4 duration-200")}>
           <div className={cn(R.full, "size-24 bg-emerald-50 flex items-center justify-center mx-auto mb-6 border-4 border-emerald-100")}>
              <CheckCircle2 className={cn("size-12", C.success.icon)} />
           </div>
           <h2 className={cn(T.h1, "text-slate-900 dark:text-slate-100")}>{t("pos.pay.success")}</h2>
           <p className={cn(T.bodySm, "text-slate-400 mt-2 mb-8")}>{t("pos.pay.success_desc")}</p>
           
           <div className="bg-slate-50 dark:bg-slate-800 rounded-3xl p-6 mb-8 text-left border border-slate-100 dark:border-slate-700 italic">
              <div className="flex justify-between items-center mb-1">
                 <span className={cn(T.label, "text-slate-400")}>{t("pos.pay.txn_id")}</span>
                 <span className={cn(T.code, "text-slate-900 dark:text-slate-100")}>{lastTransaction?.id.slice(0,8)}...</span>
              </div>
              <div className="flex justify-between items-center">
                 <span className={cn(T.label, "text-slate-400")}>{t("pos.pay.total")}</span>
                 <span className={cn(T.h2, "text-slate-900 dark:text-slate-100 font-data")}>{formatRupiah(summary.total)}</span>
              </div>
           </div>

           <div className="flex gap-4">
              <button 
                onClick={onClose}
                className={cn(T.buttonLg, R.lg, E.glowNeutral, "flex-1 py-4 px-6 bg-slate-900 text-white hover:bg-slate-800 transition-all cursor-pointer")}
              >
                {t("pos.pay.close_f5")}
              </button>
              <button
                onClick={printReceipt}
                className={cn(T.buttonLg, R.lg, "flex-1 py-4 px-6 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition-all flex items-center justify-center gap-2 cursor-pointer")}
              >
                <Receipt className="size-4" />
                {t("pos.pay.print")}
              </button>
           </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn(Z.modal, "fixed inset-0 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200")}>
      <div className={cn(R.xl, E["2xl"], "bg-white dark:bg-slate-900 w-full max-w-4xl overflow-hidden flex flex-col md:flex-row border border-slate-100 dark:border-slate-800 animate-in zoom-in-95 slide-in-from-bottom-4 duration-200")}>
        
        {/* Left Panel: Summary */}
        <div className="md:w-5/12 bg-slate-50 dark:bg-slate-800/50 p-10 h-full border-r border-slate-100 dark:border-slate-800">
           <button onClick={onClose} className="mb-10 text-slate-400 hover:text-slate-900 transition-colors p-2 -ml-2">
              <X className="size-6" />
           </button>
           
           <p className={cn(T.label, C.primary.icon, "mb-2 px-1")}>{t("pos.pay.confirm_title")}</p>
           <h2 className={cn(T.h1, "text-slate-900 dark:text-slate-100 leading-none mb-10 px-1")}>{t("pos.pay.confirm_subtitle")}</h2>

           <div className="space-y-4 pr-4">
              <div className="flex justify-between items-center">
                 <span className={cn(T.label, "text-slate-400")}>{t("pos.pay.total_purchase")}</span>
                 <span className={cn(T.kpiCard, "text-slate-900 dark:text-slate-100")}>{formatRupiah(summary.total)}</span>
              </div>
              <div className="flex justify-between items-center text-slate-400">
                 <span className={cn(T.label, "text-slate-400")}>{t("pos.pay.item_count")}</span>
                 <span className={cn(T.dataSm, "font-bold")}>{summary.itemCount} {t("pos.pay.pcs")}</span>
              </div>
              <div className="h-px bg-slate-200 my-4" />
              {summary.discount > 0 ? (
             <div className="flex items-center justify-between bg-rose-50 text-rose-700 p-4 rounded-2xl border border-rose-100">
               <div className="flex items-center gap-2">
                 <Ticket className="size-4" />
                 <span className={cn(T.label)}>{t("pos.pay.discount_applied")}</span>
               </div>
               <span className={cn(T.bodySm, "font-bold")}>−{formatRupiah(summary.discount)}</span>
             </div>
           ) : (
             <div className="flex items-center gap-2 bg-indigo-50 text-indigo-700 p-4 rounded-2xl border border-indigo-100">
               <Ticket className="size-4" />
               <span className={cn(T.label)}>{t("pos.pay.promo_default")}</span>
             </div>
           )}
           </div>

           <div className="mt-12 opacity-50">
              <div className="bg-white dark:bg-slate-800 p-4 rounded-3xl border border-slate-100 dark:border-slate-700 flex items-center gap-4">
                 <div className={cn(R.md, "size-10 bg-slate-50 flex items-center justify-center")}>
                    <Receipt className="size-5 text-slate-300" />
                 </div>
                 <div>
                    <p className={cn(T.bodySm, "font-bold text-slate-900 dark:text-slate-100")}>{t("pos.pay.e_receipt")}</p>
                    <p className={cn(T.caption, "text-slate-400")}>{t("pos.pay.e_receipt_desc")}</p>
                 </div>
              </div>
           </div>
        </div>

        {/* Right Panel: Methods */}
        <div className="md:w-7/12 p-10 bg-white dark:bg-slate-900 relative">
           <div className="mb-8">
              <h3 className={cn(T.h4, "text-slate-400 mb-4 text-center")}>{t("pos.pay.select_method")}</h3>
              <div className="grid grid-cols-3 gap-3 text-center">
                 {([
                   { id: "CASH", label: t("pos.pay.cash"), icon: Banknote, rotate: "rotate-12" },
                   { id: "QRIS", label: t("pos.pay.qris"), icon: QrCode, rotate: "-rotate-12" },
                   { id: "SPLIT", label: t("pos.pay.split"), icon: CreditCard, rotate: "rotate-6" },
                 ] as const).map(({ id, label, icon: Icon, rotate }) => (
                   <button
                     key={id}
                     onClick={() => { setMethod(id); setCashReceived(""); setSplitCash(""); }}
                     className={cn(
                       R.xl,
                       "relative p-4 border-2 transition-all flex flex-col items-center gap-2 cursor-pointer",
                       method === id ? "border-indigo-600 bg-indigo-50/30 dark:bg-indigo-900/20 ring-4 ring-indigo-50 dark:ring-indigo-900/30" : "border-slate-100 dark:border-slate-700 hover:border-slate-200 dark:hover:border-slate-600"
                     )}
                   >
                     <div className={cn(
                       cn(R.md, "size-10 flex items-center justify-center transition-all"),
                       method === id ? `bg-indigo-600 text-white shadow-xl ${rotate}` : "bg-slate-100 text-slate-400"
                     )}>
                       <Icon className="size-5" />
                     </div>
                     <span className={cn(T.buttonSm, method === id ? "text-indigo-900 dark:text-indigo-300" : "text-slate-400")}>{label}</span>
                     {method === id && <div className="absolute top-2 right-2 size-2 rounded-full bg-indigo-600" />}
                   </button>
                 ))}
              </div>
           </div>

           <div className="space-y-5">
              {method === "CASH" && (
                <div className="animate-in slide-in-from-top-4 duration-300">
                   <p className={cn(T.label, "text-slate-400 mb-3")}>{t("pos.pay.cash_received")}</p>
                   <div className="relative group">
                      <div className="absolute left-6 top-1/2 -translate-y-1/2 text-2xl font-bold text-slate-300 group-focus-within:text-indigo-600 transition-colors">{rupiahPrefix}</div>
                      <input
                        type="number"
                        value={cashReceived}
                        onChange={(e) => setCashReceived(e.target.value)}
                        placeholder={t("pos.pay.cash_placeholder")}
                        autoFocus
                        className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-3xl py-6 pl-20 pr-6 text-3xl font-bold text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-600 focus:bg-white dark:focus:bg-slate-700 transition-all shadow-inner tracking-tighter"
                      />
                   </div>
                   <div className="grid grid-cols-3 gap-2 mt-4">
                      {[20000, 50000, 100000].map(val => (
                        <button
                          key={val}
                          onClick={() => setCashReceived(val.toString())}
                          className={cn(T.buttonSm, R.md, "py-3 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 hover:border-indigo-100 dark:hover:border-indigo-800 transition-all cursor-pointer")}
                        >
                          +{formatRupiah(val)}
                        </button>
                      ))}
                   </div>
                   {cashAmount > 0 && (
                     <div className="mt-6 p-5 bg-slate-900 rounded-2xl flex items-center justify-between border-b-4 border-slate-950">
                        <p className={cn(T.label, "text-slate-400")}>{t("pos.pay.change")}</p>
                        <p className={cn(T.kpiCard, change < 0 ? "text-rose-400" : "text-emerald-400")}>
                          {formatRupiah(change)}
                        </p>
                     </div>
                   )}
                </div>
              )}

              {method === "QRIS" && (
                <div className={cn(R.xl, "flex flex-col items-center justify-center p-8 bg-slate-50 border border-dashed border-slate-200 animate-in slide-in-from-top-4 duration-300")}>
                   <div className="w-48 h-48 bg-white dark:bg-slate-800 p-4 rounded-3xl shadow-sm mb-4 border border-slate-100 dark:border-slate-700">
                      <div className="w-full h-full bg-slate-100 flex items-center justify-center relative group">
                        <QrCode className="w-20 h-20 text-slate-200 group-hover:text-indigo-600 transition-all" />
                        <div className={cn("absolute inset-x-0 bottom-0 bg-indigo-600 text-white uppercase py-1.5 text-center translate-y-full group-hover:translate-y-0 transition-transform", T.micro)}>{t("pos.pay.auto_generated")}</div>
                      </div>
                   </div>
                   <p className={cn(T.caption, "text-slate-400")}>{t("pos.pay.scan_qris")}</p>
                </div>
              )}

              {method === "SPLIT" && (
                <div className="space-y-4 animate-in slide-in-from-top-4 duration-300">
                   <p className={cn(T.caption, "text-slate-400")}>{t("pos.pay.split_cash")}</p>
                   <div className="relative group">
                      <div className="absolute left-6 top-1/2 -translate-y-1/2 text-2xl font-bold text-slate-300 group-focus-within:text-indigo-600 transition-colors">{rupiahPrefix}</div>
                      <input
                        type="number"
                        value={splitCash}
                        onChange={(e) => setSplitCash(e.target.value)}
                        placeholder="0"
                        autoFocus
                        className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-3xl py-5 pl-20 pr-6 text-3xl font-bold text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-600 focus:bg-white dark:focus:bg-slate-700 transition-all shadow-inner tracking-tighter"
                      />
                   </div>
                   {splitCashAmt > 0 && splitCashAmt < summary.total && (
                     <div className="grid grid-cols-2 gap-3 p-4 bg-slate-900 rounded-2xl animate-in slide-in-from-top-2 duration-200">
                       <div className="text-center">
                         <p className={cn(T.label, "text-slate-500 mb-1")}>{t("pos.pay.cash")}</p>
                         <p className={cn(T.h2, "text-white font-data")}>{formatRupiah(splitCashAmt)}</p>
                       </div>
                       <div className="text-center">
                         <p className={cn(T.label, "text-slate-500 mb-1")}>{t("pos.pay.qris")}</p>
                         <p className={cn(T.h2, "text-indigo-400 font-data")}>{formatRupiah(splitQrisAmt)}</p>
                       </div>
                     </div>
                   )}
                </div>
              )}
           </div>

           <div className="mt-10">
              <button
                onClick={handlePay}
                disabled={
                  isSubmitting ||
                  (method === "CASH" && cashAmount < summary.total) ||
                  (method === "SPLIT" && (splitCashAmt <= 0 || splitCashAmt >= summary.total))
                }
                className={cn(
                  T.buttonLg,
                  R.xl,
                  "w-full py-6 flex items-center justify-center gap-4 transition-all cursor-pointer",
                  isSubmitting || (method === "CASH" && cashAmount < summary.total) || (method === "SPLIT" && (splitCashAmt <= 0 || splitCashAmt >= summary.total))
                    ? "bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed"
                    : cn(E.glowPrimary, "bg-indigo-600 text-white hover:bg-slate-900 active:scale-95")
                )}
              >
                {isSubmitting ? (
                  <><Loader2 className="size-5 animate-spin" /> {t("pos.pay.processing")}</>
                ) : (
                  <>
                    {method === "CASH" ? t("pos.pay.confirm_cash") : method === "QRIS" ? t("pos.pay.confirm_qris") : t("pos.pay.confirm_split")}
                    <ArrowRight className="size-5" />
                  </>
                )}
              </button>
           </div>
        </div>
      </div>
    </div>
  );
}
