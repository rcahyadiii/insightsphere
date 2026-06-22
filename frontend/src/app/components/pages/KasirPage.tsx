"use client";

import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useState, useMemo, useRef, useEffect } from "react";
import { 
  Search, 
  ShoppingCart, 
  Package, 
  LayoutGrid, 
  LogOut,
  Zap,
  Wrench,
  Printer,
  RotateCcw,
  Pencil,
  X,
  Lightbulb,
  CreditCard,
} from "lucide-react";
import { useTranslation } from "@/app/i18n";
import { useAuth } from "@/app/context/AuthContext";
import { useProducts } from "@/app/hooks/useProducts";
import { useCart } from "@/app/hooks/useCart";
import { useCheckout } from "@/app/hooks/useCheckout";
import { cn } from "@/app/lib/utils";
import { T } from "@/app/lib/typography";
import { C } from "@/app/lib/colors";
import { R } from "@/app/lib/radii";
import { E, Z } from "@/app/lib/elevation";
import { formatRupiah } from "@/app/lib/format";
import { INPUT } from "@/app/lib/forms";
import { getMobileCartBarState } from "@/app/lib/pos-mobile-cart";

// Sub-komponen (akan dipisah ke file sendiri nanti jika sudah stabil)
import { ProductCard } from "@/app/components/pos/ProductCard";
import { StockCheckView } from "@/app/components/pos/StockCheckView";
import { ServicePanel } from "@/app/components/pos/ServicePanel";
import { JobQueuePanel } from "@/app/components/pos/JobQueuePanel";

function PosPanelSkeleton() {
  return (
    <aside className="relative flex min-h-[460px] w-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 xl:min-h-0 xl:w-[340px] 2xl:w-96">
      <div className="border-b border-slate-100 p-4 dark:border-slate-800">
        <div className="h-6 w-32 animate-pulse rounded-lg bg-slate-200 dark:bg-slate-800" />
      </div>
      <div className="flex-1 space-y-3 p-4">
        {[...Array(4)].map((_, index) => (
          <div key={index} className="flex animate-pulse items-center gap-3 rounded-xl border border-slate-100 p-3 dark:border-slate-800">
            <div className="size-11 rounded-lg bg-slate-200 dark:bg-slate-800" />
            <div className="flex-1 space-y-2">
              <div className="h-3 w-3/4 rounded bg-slate-200 dark:bg-slate-800" />
              <div className="h-2 w-1/2 rounded bg-slate-100 dark:bg-slate-700" />
            </div>
          </div>
        ))}
      </div>
      <div className="space-y-3 border-t border-slate-100 p-4 dark:border-slate-800">
        <div className="h-4 w-full animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
        <div className="h-11 w-full animate-pulse rounded-xl bg-slate-900 dark:bg-slate-800" />
      </div>
    </aside>
  );
}

function PosModalSkeleton() {
  return (
    <div className={cn(Z.modal, "fixed inset-0 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm")}>
      <div className="w-full max-w-md space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-700 dark:bg-slate-900">
        <div className="h-6 w-40 animate-pulse rounded-lg bg-slate-200 dark:bg-slate-800" />
        <div className="space-y-3">
          <div className="h-12 w-full animate-pulse rounded-xl bg-slate-100 dark:bg-slate-800" />
          <div className="h-12 w-full animate-pulse rounded-xl bg-slate-100 dark:bg-slate-800" />
          <div className="h-10 w-full animate-pulse rounded-xl bg-indigo-200 dark:bg-indigo-900/40" />
        </div>
      </div>
    </div>
  );
}

const CartPanel = dynamic(
  () => import("@/app/components/pos/CartPanel").then((mod) => mod.CartPanel),
  { ssr: false, loading: () => <PosPanelSkeleton /> }
);
const PaymentModal = dynamic(
  () => import("@/app/components/pos/PaymentModal").then((mod) => mod.PaymentModal),
  { ssr: false, loading: () => <PosModalSkeleton /> }
);
const RefundModal = dynamic(
  () => import("@/app/components/pos/RefundModal").then((mod) => mod.RefundModal),
  { ssr: false, loading: () => <PosModalSkeleton /> }
);

const POS_VERSION = "2.4.0";

/**
 * KasirPage — Halaman Utama POS InsightSphere.
 * 
 * Menggabungkan semua hooks (Produk, Keranjang, Checkout) ke dalam satu 
 * interface Bento-style yang premium.
 */
export function KasirPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const router = useRouter();
  const rupiahPrefix = t("common.currency.rupiah");
  
  // Hooks Logic
  const { products, isInitialLoading, categories, searchInCache } = useProducts(user?.storeNbr || undefined);
  const cart = useCart();
  const checkout = useCheckout();

  // State UI
  const [activeTab, setActiveTab] = useState<"pos" | "stock" | "service" | "queue">("pos");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [refundModalOpen, setRefundModalOpen] = useState(false);
  const [customPriceProduct, setCustomPriceProduct] = useState<typeof products[0] | null>(null);
  const [customPriceInput, setCustomPriceInput] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);

  // F1 barcode shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "F1") {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  // Filtered Products untuk Grid
  const displayProducts = useMemo(() => {
    return searchInCache(searchQuery, selectedCategory);
  }, [searchInCache, searchQuery, selectedCategory]);
  const mobileCartState = getMobileCartBarState(cart.summary);
  const openPaymentModal = () => {
    if (!mobileCartState.disabled) {
      setPaymentModalOpen(true);
    }
  };
  const handleExitPos = () => router.push("/");

  return (
    <div className="flex min-h-[calc(100vh-2rem)] flex-col gap-3 pb-24 animate-in fade-in duration-500 sm:gap-4 xl:h-[calc(100vh-2rem)] xl:flex-row xl:overflow-hidden xl:pb-0">
      {/* Sidebar navigasi kasir */}
      <aside className={cn(R.xl, E.sm, "w-full shrink-0 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden transition-all xl:w-56 2xl:w-60")}>
        <div className="border-b border-slate-100 p-3 dark:border-slate-800 xl:p-4">
          <div className="flex items-center gap-3">
            <div className={cn(R.lg, E.glowPrimary, "size-9 bg-indigo-600 flex items-center justify-center text-white")}>
              <ShoppingCart className="size-4" />
            </div>
            <div className="min-w-0">
              <h2 className={cn(T.h3, "text-slate-900 dark:text-slate-100")}>InsightPOS</h2>
              <p className={cn(T.bodySm, "text-slate-500 dark:text-slate-400 leading-none mt-0.5 hidden sm:block")}>{t("pos.version", { version: POS_VERSION })}</p>
            </div>
          </div>
        </div>

        <nav className="flex flex-wrap gap-2 overflow-hidden p-3 xl:block xl:flex-1 xl:space-y-2 xl:overflow-y-auto xl:p-4 xl:no-scrollbar">
          <button 
            onClick={() => setActiveTab("pos")}
            className={cn(
              "flex h-12 min-w-16 flex-1 items-center justify-center gap-3 rounded-xl p-2 transition-all cursor-pointer group xl:w-full xl:justify-start xl:px-3",
              activeTab === "pos" ? "bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 shadow-sm shadow-indigo-50 dark:shadow-none" : "text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-200"
            )}
          >
            <div className={cn(
              cn(R.md, "size-8 flex items-center justify-center transition-all"),
              activeTab === "pos" ? "bg-indigo-600 text-white shadow-md ring-2 ring-indigo-100 dark:ring-indigo-900/50" : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 group-hover:bg-slate-200 dark:group-hover:bg-slate-700"
            )}>
              <LayoutGrid className="size-4" />
            </div>
            <span className={cn(T.buttonSm, "hidden lg:block")}>{t("pos.nav_pos")}</span>
          </button>

          <button 
            onClick={() => setActiveTab("stock")}
            className={cn(
              "flex h-12 min-w-16 flex-1 items-center justify-center gap-3 rounded-xl p-2 transition-all cursor-pointer group xl:w-full xl:justify-start xl:px-3",
              activeTab === "stock" ? "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 shadow-sm" : "text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-200"
            )}
          >
            <div className={cn(
              cn(R.md, "size-8 flex items-center justify-center transition-all"),
              activeTab === "stock" ? "bg-emerald-600 text-white shadow-md ring-2 ring-emerald-100 dark:ring-emerald-900/50" : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 group-hover:bg-slate-200 dark:group-hover:bg-slate-700"
            )}>
              <Package className="size-4" />
            </div>
            <span className={cn(T.buttonSm, "hidden lg:block")}>{t("pos.nav_stock")}</span>
          </button>

          <button
            onClick={() => setActiveTab("service")}
            className={cn(
              "flex h-12 min-w-16 flex-1 items-center justify-center gap-3 rounded-xl p-2 transition-all cursor-pointer group xl:w-full xl:justify-start xl:px-3",
              activeTab === "service" ? "bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 shadow-sm" : "text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-200"
            )}
          >
            <div className={cn(
              cn(R.md, "size-8 flex items-center justify-center transition-all"),
              activeTab === "service" ? "bg-indigo-600 text-white shadow-md ring-2 ring-indigo-100 dark:ring-indigo-900/50" : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 group-hover:bg-slate-200 dark:group-hover:bg-slate-700"
            )}>
              <Wrench className="size-4" />
            </div>
            <span className={cn(T.buttonSm, "hidden lg:block")}>{t("pos.nav_service")}</span>
          </button>

          <button
            onClick={() => setActiveTab("queue")}
            className={cn(
              "flex h-12 min-w-16 flex-1 items-center justify-center gap-3 rounded-xl p-2 transition-all cursor-pointer group xl:w-full xl:justify-start xl:px-3",
              activeTab === "queue" ? "bg-amber-50 dark:bg-amber-900/30 text-amber-600 shadow-sm" : "text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-200"
            )}
          >
            <div className={cn(
              cn(R.md, "size-8 flex items-center justify-center transition-all"),
              activeTab === "queue" ? "bg-amber-500 text-white shadow-md ring-2 ring-amber-100 dark:ring-amber-900/50" : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 group-hover:bg-slate-200 dark:group-hover:bg-slate-700"
            )}>
              <Printer className="size-4" />
            </div>
            <span className={cn(T.buttonSm, "hidden lg:block")}>{t("pos.nav_queue")}</span>
          </button>

          <div className="hidden w-full py-2 xl:block xl:pt-6 xl:pb-3">
             <div className="h-px bg-slate-100 dark:bg-slate-800 mx-2" />
          </div>

          {activeTab === "pos" && (
            <div className="flex w-full gap-2 overflow-x-auto pb-1 no-scrollbar xl:block xl:space-y-1 xl:overflow-visible xl:pb-0">
               <p className={cn(T.h4, "px-3 text-slate-400 dark:text-slate-500 mb-3 hidden xl:block")}>{t("pos.category_heading")}</p>
                <button 
                  onClick={() => setSelectedCategory("all")}
                  className={cn(
                    cn(T.buttonSm, R.md, "h-10 min-w-max shrink-0 px-4 text-center transition-all cursor-pointer xl:w-full xl:text-left"),
                    selectedCategory === "all" ? "bg-slate-900 dark:bg-indigo-600 text-white shadow-sm" : "bg-slate-50 text-slate-700 hover:bg-slate-100 dark:bg-slate-800/70 dark:text-slate-300 dark:hover:bg-slate-800"
                  )}
                >
                  {t("common.all")}
                </button>
               {categories.map(cat => (
                 <button 
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={cn(
                      cn(T.buttonSm, R.md, "h-10 min-w-max shrink-0 px-4 text-center transition-all cursor-pointer xl:w-full xl:text-left xl:truncate"),
                      selectedCategory === cat ? "bg-slate-900 dark:bg-indigo-600 text-white shadow-sm" : "bg-slate-50 text-slate-700 hover:bg-slate-100 dark:bg-slate-800/70 dark:text-slate-300 dark:hover:bg-slate-800"
                    )}
                 >
                   {cat}
                 </button>
               ))}
            </div>
          )}
        </nav>

        <div className="p-4 mt-auto hidden xl:block">
           <div className="bg-slate-50 dark:bg-slate-800 rounded-2xl p-4 border border-slate-100 dark:border-slate-700 hidden lg:block">
              <p className={cn(T.label, "text-slate-400 mb-1")}>{t("pos.active_cashier")}</p>
              <p className={cn(T.bodySm, "font-bold text-slate-900 dark:text-slate-200 truncate")}>{user?.name || t("pos.cashier_fallback")}</p>
              <div className={cn(T.caption, C.success.icon, "flex items-center gap-1.5 mt-2")}>
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                {t("pos.online_mode")}
              </div>
           </div>
        </div>
      </aside>

      {/* Main Content (Grid Produk) */}
      <main className="flex min-h-[520px] flex-1 flex-col gap-3 overflow-hidden lg:min-h-[620px] xl:min-h-0">
        {/* Top Bar Search */}
        <header className={cn(R.xl, E.sm, "min-h-16 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3 sm:p-4 flex items-center justify-between gap-3")}>
           <div className="relative flex-1 group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
              <input
                ref={searchInputRef}
                type="text"
                aria-label={t("pos.search_placeholder")}
                placeholder={t("pos.search_placeholder")}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={cn(INPUT.base, INPUT.size.lg, R.lg, "pl-12 pr-4 shadow-inner", T.body, "font-semibold")}
              />
           </div>

           <div className="flex items-center gap-3">
              <div className={cn(R.md, "hidden lg:flex items-center gap-1 bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 px-3 py-2 border border-amber-100 dark:border-amber-800/50")}>
                <Zap className="size-3.5" />
                <span className={cn(T.label, "text-amber-700 dark:text-amber-400")}>{t("pos.shift.morning")}</span>
              </div>
              <button
                onClick={() => setRefundModalOpen(true)}
                className={cn(T.buttonSm, R.md, E.sm, "hidden lg:flex items-center gap-1.5 px-3 py-2 bg-white dark:bg-slate-800 border border-rose-200 dark:border-rose-800/50 text-rose-500 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-all cursor-pointer")}
              >
                <RotateCcw className="size-3.5" /> {t("pos.refund")}
              </button>
              <div className="h-10 w-px bg-slate-100 dark:bg-slate-800" />
              <button
                type="button"
                onClick={handleExitPos}
                aria-label={t("pos.logout")}
                title={t("pos.logout")}
                className={cn(R.lg, E.sm, "size-11 shrink-0 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-rose-500 hover:border-rose-200 dark:hover:border-rose-800 transition-all cursor-pointer group")}
              >
                <LogOut className="size-4 transition-transform group-hover:scale-110" aria-hidden="true" />
              </button>
           </div>
        </header>

        {/* Content Area */}
        <section className={cn(R.xl, E.sm, "flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col")}>
          {activeTab === "pos" && (
            <div className="flex-1 overflow-y-auto p-3 scroll-smooth custom-scrollbar sm:p-4 xl:p-5">
              {isInitialLoading ? (
                <div className="grid grid-cols-[repeat(auto-fill,minmax(8.75rem,1fr))] gap-3 xl:gap-4">
                   {[...Array(10)].map((_, i) => (
                     <div key={i} className={cn(R.xl, "aspect-[4/3] bg-slate-50 dark:bg-slate-800 animate-pulse border border-slate-100 dark:border-slate-700")} />
                   ))}
                </div>
              ) : displayProducts.length > 0 ? (
                <div className="grid grid-cols-[repeat(auto-fill,minmax(8.75rem,1fr))] gap-3 xl:gap-4">
                   {displayProducts.map(p => (
                     <ProductCard
                       key={p.id}
                       product={p}
                       onAdd={() => {
                         if (p.custom_price) {
                           setCustomPriceInput(p.base_price > 0 ? p.base_price.toString() : "");
                           setCustomPriceProduct(p);
                         } else {
                           cart.addItem(p);
                         }
                       }}
                     />
                   ))}
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center p-12">
                   <div className={cn(R.full, "size-20 bg-slate-50 dark:bg-slate-800 flex items-center justify-center mb-4 border border-dashed border-slate-200 dark:border-slate-700")}>
                      <LayoutGrid className="size-8 text-slate-200 dark:text-slate-600" />
                   </div>
                   <h3 className={cn(T.h3, "text-slate-900 dark:text-slate-100")}>{t("pos.empty_title")}</h3>
                   <p className={cn(T.bodySm, "text-slate-400 mt-1")}>{t("pos.empty_desc")}</p>
                </div>
              )}
            </div>
          )}
          {activeTab === "stock" && <StockCheckView />}
          {activeTab === "service" && <ServicePanel onAdd={(svc) => cart.addItem(svc)} />}
          {activeTab === "queue" && <JobQueuePanel />}

          {/* Status Bar / Legend */}
          <footer className="hidden px-4 py-3 border-t border-slate-100 dark:border-slate-800 sm:flex items-center justify-between text-slate-500 dark:text-slate-400 bg-slate-50/10 dark:bg-slate-800/20">
             <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
                <div className="flex items-center gap-2">
                   <div className="size-2 rounded-full bg-emerald-500" />
                   <span className={cn(T.bodySm, "text-slate-500 dark:text-slate-400")}>{t("pos.stock.safe")}</span>
                </div>
                <div className="flex items-center gap-2">
                   <div className="size-2 rounded-full bg-amber-500" />
                   <span className={cn(T.bodySm, "text-slate-500 dark:text-slate-400")}>{t("pos.stock.low")}</span>
                </div>
                <div className="flex items-center gap-2">
                   <div className="size-2 rounded-full bg-rose-500 dark:bg-rose-400" />
                   <span className={cn(T.bodySm, "text-slate-500 dark:text-slate-400")}>{t("pos.stock.out")}</span>
                </div>
             </div>
             <p className={cn(T.bodySm, "text-slate-500 dark:text-slate-400")}>{t("pos.product_total", { count: products.length })}</p>
          </footer>
        </section>
      </main>

      {/* Cart Panel (Sisi Kanan) */}
      <CartPanel 
         cart={cart}
         onCheckout={openPaymentModal}
      />

      <div className={cn(Z.header, "fixed inset-x-3 bottom-[calc(env(safe-area-inset-bottom)+0.75rem)] xl:hidden")}>
        <div className={cn(R.xl, E["2xl"], "mx-auto flex min-h-20 w-full max-w-2xl items-center justify-between gap-3 border border-slate-800 bg-slate-950/95 px-3 py-3 text-white backdrop-blur-md")}>
          <div className="min-w-0">
            <p className={cn(T.label, "text-slate-300")}>{t("pos.cart.title")}</p>
            <div className="mt-0.5 flex min-w-0 flex-wrap items-baseline gap-x-2 gap-y-0.5">
              <span className={cn(T.dataEmphasis, "truncate text-emerald-300")}>
                {formatRupiah(mobileCartState.total)}
              </span>
              <span className={cn(T.bodySm, "text-slate-400")}>
                {t("pos.cart.items", { count: mobileCartState.itemCount })}
              </span>
            </div>
          </div>
          <button
            type="button"
            disabled={mobileCartState.disabled}
            onClick={openPaymentModal}
            aria-label={
              mobileCartState.disabled
                ? t("pos.cart.empty")
                : `${t("pos.cart.pay")} ${formatRupiah(mobileCartState.total)}`
            }
            className={cn(
              T.buttonSm,
              R.lg,
              "inline-flex min-h-12 min-w-32 shrink-0 items-center justify-center gap-2 px-4 transition-all",
              mobileCartState.disabled
                ? "cursor-not-allowed border border-slate-700 bg-slate-800 text-slate-500"
                : "cursor-pointer bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-950/40 hover:bg-emerald-400 active:translate-y-0.5"
            )}
          >
            <CreditCard className="size-4" aria-hidden="true" />
            {mobileCartState.disabled ? t("pos.cart.title") : t("pos.cart.pay")}
          </button>
        </div>
      </div>

      {/* Payment Modal */}
      {paymentModalOpen && (
        <PaymentModal
          cart={cart}
          checkout={checkout}
          onClose={() => setPaymentModalOpen(false)}
        />
      )}

      {/* Refund Modal */}
      {refundModalOpen && <RefundModal onClose={() => setRefundModalOpen(false)} />}

      {/* Custom Price Modal */}
      {customPriceProduct && (
        <div className={cn(Z.modal, "fixed inset-0 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200")}>
          <div className={cn(R.xl, E["2xl"], "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 w-80 p-6 animate-in zoom-in-95 slide-in-from-bottom-4 duration-200")}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className={cn(R.md, "size-8 bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center")}>
                  <Pencil className={cn("size-4", C.warning.icon)} />
                </div>
                <div>
                  <p className={cn(T.h3, "text-slate-900 dark:text-slate-100")}>{customPriceProduct.name}</p>
                  <p className={cn(T.caption, "text-slate-400 dark:text-slate-500")}>{t("pos.custom_price.input_title")}</p>
                </div>
              </div>
              <button onClick={() => setCustomPriceProduct(null)} aria-label={t("common.close")} className={cn(R.md, "p-1.5 text-slate-400 dark:text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer")}>
                <X className="size-4" aria-hidden="true" />
              </button>
            </div>

            {customPriceProduct.price_hint && (
              <p className={cn(T.bodySm, R.md, "text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 px-3 py-2 mb-4 border border-amber-100 dark:border-amber-800/30 flex items-start gap-2")}>
                <Lightbulb className="size-3.5 shrink-0 mt-0.5" aria-hidden="true" />
                {customPriceProduct.price_hint}
              </p>
            )}

            <div className="relative mb-4">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 text-sm font-bold">{rupiahPrefix}</span>
              <input
                type="number" min="0" autoFocus
                value={customPriceInput}
                onChange={e => setCustomPriceInput(e.target.value)}
                onKeyDown={e => {
                  if (e.key === "Enter") {
                    const price = parseInt(customPriceInput) || 0;
                    cart.addItem({ ...customPriceProduct, base_price: price });
                    setCustomPriceProduct(null);
                  }
                  if (e.key === "Escape") setCustomPriceProduct(null);
                }}
                placeholder="0"
                className={cn(INPUT.base, R.lg, "h-14 pl-12 pr-4 text-xl font-bold")}
              />
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setCustomPriceProduct(null)}
                className={cn(T.buttonSm, R.md, "flex-1 py-2.5 text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all cursor-pointer")}>
                {t("common.cancel")}
              </button>
              <button
                onClick={() => {
                  const price = parseInt(customPriceInput) || 0;
                  cart.addItem({ ...customPriceProduct, base_price: price });
                  setCustomPriceProduct(null);
                }}
                className={cn(T.buttonSm, R.md, E.glowWarning, "flex-1 py-2.5 text-white bg-amber-500 hover:bg-amber-400 transition-all cursor-pointer")}>
                {parseInt(customPriceInput) === 0 || !customPriceInput ? `${t("common.add")} (${t("pos.free")})` : `${t("common.add")} · ${formatRupiah(parseInt(customPriceInput)||0)}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
