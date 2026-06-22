"use client";

import { useState } from "react";
import { 
  Trash2, 
  Minus, 
  Plus, 
  ShoppingBag, 
  CreditCard,
  X,
  PauseCircle,
  Percent,
  RotateCcw,
  Wrench,
  Pencil,
  Lock,
} from "lucide-react";
import { cn } from "@/app/lib/utils";
import { T } from "@/app/lib/typography";
import { C } from "@/app/lib/colors";
import { R } from "@/app/lib/radii";
import { E } from "@/app/lib/elevation";
import { formatRupiah } from "@/app/lib/format";
import { useTranslation } from "@/app/i18n";
import { CartItem, CartSummary, Product } from "@/app/types/pos";
import { FOCUS, INPUT } from "@/app/lib/forms";

interface HeldCart {
  items: CartItem[];
  time: string;
  itemCount: number;
}

interface CartController {
  items: CartItem[];
  removeItem: (productId: string) => void;
  addItem: (product: Product) => void;
  deleteItem: (productId: string) => void;
  updatePrice: (productId: string, newPrice: number) => void;
  clearCart: () => void;
  summary: CartSummary;
  isEmpty: boolean;
  itemDiscountPcts: Record<string, number>;
  setItemDiscount: (productId: string, pct: number) => void;
  txnDiscountPct: number;
  setTxnDiscount: (pct: number) => void;
  heldCarts: HeldCart[];
  holdCart: () => void;
  restoreCart: (index: number) => void;
  deleteHeldCart: (index: number) => void;
}

interface CartPanelProps {
  cart: CartController;
  onCheckout: () => void;
}

function cartItemToProduct(item: CartItem): Product {
  return {
    id: item.product_id,
    sku: item.sku,
    name: item.name,
    category: "POS",
    family: item.is_service ? "service" : "retail",
    unit: item.unit,
    base_price: item.price,
    current_stock: Number.MAX_SAFE_INTEGER,
    version: item.version_at_add,
    image_url: item.image_url,
    is_service: item.is_service,
    min_qty: item.min_qty,
    custom_price: item.custom_price,
  };
}

export function CartPanel({ cart, onCheckout }: CartPanelProps) {
  const { t } = useTranslation();
  const rupiahPrefix = t("common.currency.rupiah");
  const {
    items, removeItem, addItem, deleteItem, clearCart, summary, isEmpty,
    itemDiscountPcts, setItemDiscount, txnDiscountPct, setTxnDiscount,
    heldCarts, holdCart, restoreCart, deleteHeldCart,
  } = cart;
  const [activeDiscountId, setActiveDiscountId] = useState<string | null>(null);
  const [editPriceId, setEditPriceId] = useState<string | null>(null);
  const [editPriceValue, setEditPriceValue] = useState("");

  return (
    <aside className="relative flex min-h-[460px] w-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 xl:min-h-0 xl:w-[340px] 2xl:w-96">
      {/* Header */}
      <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={cn(R.md, "size-9 bg-slate-900 dark:bg-indigo-600 flex items-center justify-center text-white")}>
            <ShoppingBag className="size-4" />
          </div>
          <div>
            <h2 className={cn(T.h3, "text-slate-900 dark:text-slate-100")}>{t("pos.cart.title")}</h2>
            <p className={cn(T.bodySm, "text-slate-500 dark:text-slate-400")}>{t("pos.cart.items", { count: summary.itemCount })}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={holdCart}
            disabled={isEmpty}
            title={t("pos.cart.hold")}
            className={cn(
              "relative inline-flex size-11 items-center justify-center rounded-xl transition-all cursor-pointer",
              isEmpty ? "text-slate-300 dark:text-slate-700 cursor-not-allowed" : "text-amber-500 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20"
            )}
          >
            <PauseCircle className="size-4" />
            {heldCarts.length > 0 && (
              <span className={cn(T.micro, R.full, "absolute -top-0.5 -right-0.5 size-3.5 bg-amber-500 text-white flex items-center justify-center")}>
                {heldCarts.length}
              </span>
            )}
          </button>
          <button
            onClick={clearCart}
            className="inline-flex size-11 items-center justify-center text-slate-500 dark:text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-xl transition-all cursor-pointer"
            title={t("pos.cart.clear")}
          >
            <Trash2 className="size-4" />
          </button>
        </div>
      </div>

      {/* Held Carts */}
      {heldCarts.length > 0 && (
        <div className="px-4 py-2.5 bg-amber-50 dark:bg-amber-900/20 border-b border-amber-100 dark:border-amber-800/30">
          <p className={cn(T.caption, "text-amber-600 mb-2")}>
            {t("pos.cart.held_count", { count: heldCarts.length })}
          </p>
          <div className="space-y-1.5">
            {heldCarts.map((h, i) => (
              <div key={i} className="flex items-center justify-between">
                <span className={cn(T.bodySm, "font-bold text-amber-700")}>
                  {t("pos.cart.held_info", { num: i + 1, time: h.time, count: h.itemCount })}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => restoreCart(i)}
                    className={cn(T.buttonSm, C.primary.icon, "hover:underline flex items-center gap-0.5 cursor-pointer")}
                  >
                    <RotateCcw className="size-2.5" /> {t("pos.cart.restore")}
                  </button>
                  <button
                    onClick={() => deleteHeldCart(i)}
                    className={cn(T.buttonSm, C.destructive.icon, "hover:underline cursor-pointer")}
                  >
                    {t("pos.cart.delete")}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Item List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2.5 custom-scrollbar">
        {isEmpty ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-8">
            <div className={cn(R.full, "size-16 bg-slate-50 dark:bg-slate-800 flex items-center justify-center mb-4 border border-dashed border-slate-200 dark:border-slate-700")}>
              <ShoppingBag className="size-6 text-slate-200 dark:text-slate-600" />
            </div>
            <p className={cn(T.bodySm, "leading-relaxed text-slate-500 dark:text-slate-400")}>
              {t("pos.cart.empty")}<br />{t("pos.cart.empty_hint")}
            </p>
          </div>
        ) : (
          items.map((item) => {
            const discPct = itemDiscountPcts?.[item.product_id] ?? 0;
            const lineTotal = item.price * item.quantity * (1 - discPct / 100);
            return (
              <div
                key={item.product_id}
                className={cn(R.lg, "bg-slate-50/80 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 p-3 group hover:border-indigo-200 dark:hover:border-indigo-800 hover:bg-white dark:hover:bg-slate-800 transition-colors animate-in slide-in-from-right duration-200")}
              >
                <div className="flex gap-3">
                  <div className={cn(R.md, "size-12 bg-white dark:bg-slate-700 border border-slate-100 dark:border-slate-600 flex items-center justify-center overflow-hidden flex-shrink-0")}>
                    {item.image_url ? (
                      <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                    ) : item.is_service ? (
                      <Wrench className="size-4 text-indigo-300" />
                    ) : (
                      <div className={cn(T.code, "text-slate-200")}>{t("pos.cart.image_placeholder")}</div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start gap-1">
                      <h4 className={cn(T.body, "font-bold text-slate-900 dark:text-slate-100 truncate leading-tight flex-1")}>
                        {item.name}
                        {item.is_service && (
                          <span className={cn(T.micro, R.xs, "ml-1 px-1 py-0.5 bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-300")}>{t("pos.cart.service_badge")}</span>
                        )}
                      </h4>
                      <button
                        onClick={() => deleteItem(item.product_id)}
                        aria-label={t("pos.cart.delete")}
                        className="inline-flex size-9 flex-shrink-0 items-center justify-center rounded-lg text-slate-500 hover:text-rose-500 hover:bg-rose-50 dark:text-slate-400 dark:hover:bg-rose-900/20 transition-colors cursor-pointer"
                      >
                        <X className="size-4" />
                      </button>
                    </div>
                    <div className="flex items-center justify-between gap-3 mt-2">
                      <div className="min-w-0">
                        {/* Price display / inline editor */}
                        {editPriceId === item.product_id ? (
                          <div className="flex items-center gap-1 animate-in slide-in-from-top-1 duration-150">
                            <span className={cn(T.caption, "text-slate-400")}>{rupiahPrefix}</span>
                            <input
                              type="number" min="0" autoFocus
                              value={editPriceValue}
                              onChange={e => setEditPriceValue(e.target.value)}
                              onKeyDown={e => {
                                if (e.key === "Enter") {
                                  const v = parseInt(editPriceValue) || 0;
                                  cart.updatePrice(item.product_id, v);
                                  setEditPriceId(null);
                                }
                                if (e.key === "Escape") setEditPriceId(null);
                              }}
                              className={cn(INPUT.base, INPUT.size.sm, T.label, "w-20 h-7 px-2 py-0.5 text-amber-700 dark:text-amber-400 border-amber-300 dark:border-amber-700")}
                            />
                            <button
                              onClick={() => {
                                const v = parseInt(editPriceValue) || 0;
                                cart.updatePrice(item.product_id, v);
                                setEditPriceId(null);
                              }}
                              className={cn(T.buttonSm, "min-h-9 px-2 text-emerald-600 hover:underline cursor-pointer")}>{t("common.ok")}</button>
                            <button
                              type="button"
                              onClick={() => setEditPriceId(null)}
                              aria-label={t("common.cancel")}
                              className={cn(R.sm, FOCUS.ring, "size-9 inline-flex items-center justify-center text-slate-500 hover:text-slate-700 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer")}
                            >
                              <X className="size-3.5" aria-hidden="true" />
                            </button>
                          </div>
                        ) : (
                          <p className={cn(T.dataEmphasis, "flex items-center gap-1", C.primary.icon)}>
                            {formatRupiah(item.price)}
                            <span className="text-slate-500 dark:text-slate-400 font-bold">/{item.unit}</span>
                            {item.custom_price && (
                              <button
                                onClick={e => { e.stopPropagation(); setEditPriceValue(item.price.toString()); setEditPriceId(item.product_id); }}
                                className="text-amber-400 hover:text-amber-600 cursor-pointer"
                                title={t("pos.cart.edit_price")}
                              >
                                <Pencil className="size-2.5" />
                              </button>
                            )}
                          </p>
                        )}
                        <p className={cn(T.dataSm, "text-slate-600 dark:text-slate-400")}>
                          = {formatRupiah(Math.round(lineTotal))}
                          {discPct > 0 && <span className="ml-1 text-rose-500">−{discPct}%</span>}
                          {item.min_qty && (
                            <span className="ml-1.5 text-indigo-400 flex items-center gap-0.5 inline-flex"><Lock className="size-2" />{t("pos.cart.min_qty", { count: item.min_qty })}</span>
                          )}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl p-1 shadow-sm">
                        <button
                          onClick={() => removeItem(item.product_id)}
                          disabled={!!(item.min_qty && item.quantity <= item.min_qty)}
                          className={cn(
                            cn(R.sm, "size-10 flex items-center justify-center transition-colors"),
                            item.min_qty && item.quantity <= item.min_qty
                              ? "text-slate-300 dark:text-slate-600 cursor-not-allowed"
                              : "text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 cursor-pointer"
                          )}
                        >
                          <Minus className="size-4" />
                        </button>
                        <span className={cn(T.dataEmphasis, "text-slate-900 dark:text-slate-100 min-w-7 text-center")}>{item.quantity}</span>
                        <button
                          onClick={() => addItem(cartItemToProduct(item))}
                          className={cn(R.sm, "size-10 flex items-center justify-center text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 dark:text-slate-300 dark:hover:bg-indigo-900/30 transition-colors cursor-pointer")}
                        >
                          <Plus className="size-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Per-item discount */}
                <div className="mt-3 flex items-center gap-1.5">
                  {activeDiscountId === item.product_id ? (
                    <div className="flex items-center gap-1.5 animate-in slide-in-from-top-1 duration-150">
                      <input
                        type="number" min="0" max="100"
                        value={discPct || ""}
                        onChange={e => setItemDiscount(item.product_id, parseInt(e.target.value) || 0)}
                        autoFocus
                        placeholder="0"
                        className={cn(INPUT.base, INPUT.size.sm, T.label, "w-16 h-10 px-2 py-1 text-center text-indigo-700 dark:text-indigo-400 border-indigo-300 dark:border-indigo-700")}
                      />
                      <span className={cn(T.bodySm, "text-slate-500 dark:text-slate-400")}>%</span>
                      <button
                        type="button"
                        onClick={() => setActiveDiscountId(null)}
                        aria-label={t("common.cancel")}
                        className={cn(R.sm, FOCUS.ring, "size-10 inline-flex items-center justify-center text-slate-500 hover:text-slate-700 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer")}
                      >
                        <X className="size-3.5" aria-hidden="true" />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setActiveDiscountId(item.product_id)}
                      className={cn(
                        cn(T.buttonSm, R.md, "flex min-h-10 items-center gap-1.5 px-3 transition-all cursor-pointer"),
                        discPct > 0
                          ? "bg-rose-100 dark:bg-rose-900/30 text-rose-600 border border-rose-200 dark:border-rose-800/50"
                          : "text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30"
                      )}
                    >
                      <Percent className="size-3.5" />
                      {discPct > 0 ? t("pos.cart.discount_pct", { pct: discPct }) : t("pos.cart.discount")}
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Summary Footer */}
      <div className="p-4 bg-slate-900 rounded-t-2xl shadow-2xl shadow-slate-900/40 border-t border-slate-800">
        <div className="space-y-2.5 mb-5">
          <div className="flex justify-between items-center text-slate-400">
              <span className={cn(T.bodySm, "text-slate-400")}>{t("pos.cart.subtotal")}</span>
              <span className={cn(T.dataSm, "font-bold text-white")}>{formatRupiah(summary.subtotal)}</span>
          </div>

          {/* Transaction Discount Row */}
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-1.5">
              <Percent className="size-3 text-slate-500" />
              <span className={cn(T.bodySm, "text-slate-400")}>{t("pos.cart.discount")}</span>
              <input
                type="number" min="0" max="100"
                value={txnDiscountPct || ""}
                onChange={e => setTxnDiscount(parseInt(e.target.value) || 0)}
                placeholder="0"
                className={cn(T.dataSm, R.sm, "h-9 w-12 bg-slate-800 border border-slate-700 text-white placeholder:text-slate-500 text-center px-1", FOCUS.ring)}
              />
              <span className={cn(T.bodySm, "text-slate-400")}>%</span>
            </div>
            {summary.discount > 0 && (
              <span className={cn(T.bodySm, "font-bold text-rose-400")}>−{formatRupiah(summary.discount)}</span>
            )}
          </div>

          <div className="h-px bg-slate-800" />
          <div className="flex justify-between items-center pt-1">
            <span className={cn(T.h3, "text-white")}>{t("pos.cart.total")}</span>
            <span className={cn(T.kpiCard, "text-emerald-400")}>{formatRupiah(summary.total)}</span>
          </div>
        </div>

        <button
          disabled={isEmpty}
          onClick={onCheckout}
          className={cn(
            "w-full min-h-12 rounded-xl flex items-center justify-center gap-3 transition-all cursor-pointer shadow-xl", T.buttonSm,
            isEmpty
              ? "bg-slate-800 text-slate-600 border border-slate-700 cursor-not-allowed"
              : "bg-indigo-600 text-white hover:bg-indigo-500 border-b-4 border-indigo-700 active:border-b-0 active:translate-y-1 shadow-indigo-500/20"
          )}
        >
          <CreditCard className="size-4" />
          {t("pos.cart.pay")}
        </button>

        <div className={cn(T.bodySm, "flex items-center justify-center gap-4 mt-4 text-slate-400")}>
          {([{ key: "cash", label: t("pos.cart.method_cash") }, { key: "qris", label: t("pos.cart.method_qris") }, { key: "split", label: t("pos.cart.method_split") }] as const).map(m => (
            <div key={m.key} className="flex items-center gap-1">
              <div className="size-1.5 rounded-full bg-slate-800" />
              <span>{m.label}</span>
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
}
