"use client";

import { useMemo, useState } from "react";
import { 
  Package, 
  Search, 
  ArrowUpRight, 
  ArrowDownRight, 
  History,
  AlertTriangle,
  RotateCcw
} from "lucide-react";
import { useAuth } from "@/app/context/AuthContext";
import { useProducts } from "@/app/hooks/useProducts";
import { cn } from "@/app/lib/utils";
import { T } from "@/app/lib/typography";
import { R } from "@/app/lib/radii";
import { E } from "@/app/lib/elevation";
import { useTranslation } from "@/app/i18n";
import { INPUT } from "@/app/lib/forms";

/**
 * StockCheckView — Interface untuk pengecekan stok cepat di Kasir.
 * 
 * Sesuai [HARDENED] plan:
 * - Menampilkan status stok dengan indikator warna.
 * - Memisahkan pencarian dari filter transaksi utama.
 * - Memberi info visual tentang item "Slow Moving" vs "Fast Moving" (Pseudo data).
 */
export function StockCheckView() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { products, isLoading, refetch } = useProducts(user?.storeNbr || undefined);
  const [searchTerm, setSearchTerm] = useState("");

  const filtered = useMemo(() => {
    return products.filter(p => 
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      p.sku.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [products, searchTerm]);

  return (
    <div className="flex flex-col h-full bg-slate-50/50 dark:bg-slate-800/20">
       <div className="p-6 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div>
             <h3 className={cn(T.h3, "text-slate-900 dark:text-slate-100")}>{t("pos.stock.title")}</h3>
             <p className={cn(T.caption, "text-slate-400 mt-0.5")}>{t("pos.stock.subtitle", { branch: user?.storeNbr || 'HEAD' })}</p>
          </div>
          <button 
            onClick={() => refetch()}
            className={cn(T.buttonSm, R.md, "flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 transition-all cursor-pointer")}
          >
            <RotateCcw className="size-3.5" />
            {t("pos.stock.refresh")}
          </button>
       </div>

       <div className="p-6">
          <div className="relative mb-6">
             <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
             <input 
               type="text"
               placeholder={t("pos.stock.search")}
               value={searchTerm}
               onChange={(e) => setSearchTerm(e.target.value)}
               className={cn(INPUT.base, INPUT.size.lg, R.lg, "pl-12 pr-4 shadow-sm", T.bodySm, "font-bold")}
             />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
             {isLoading ? (
                [...Array(6)].map((_, i) => (
                   <div key={i} className={cn(R.xl, "h-40 bg-white dark:bg-slate-800 animate-pulse border border-slate-100 dark:border-slate-700")} />
                ))
             ) : filtered.length > 0 ? (
                filtered.map(product => {
                   const isLow = product.current_stock > 0 && product.current_stock < 10;
                   const isEmpty = product.current_stock <= 0;
                   
                   return (
                      <div key={product.id} className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-xl dark:hover:shadow-slate-900/50 transition-all group">
                         <div className="flex justify-between items-start mb-4">
                            <div className={cn(R.lg, "size-12 bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-300 dark:text-slate-600 group-hover:bg-indigo-50 dark:group-hover:bg-indigo-900/30 group-hover:text-indigo-400 transition-colors")}>
                               <Package className="size-6" />
                            </div>
                            {isLow || isEmpty ? (
                               <div className={cn(
                                 cn(T.micro, R.full, "flex items-center gap-1.5 px-3 py-1.5 border"),
                                 isEmpty ? "bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 border-rose-100 dark:border-rose-800/50" : "bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 border-amber-100 dark:border-amber-800/50"
                               )}>
                                  <AlertTriangle className="size-3" />
                                  {isEmpty ? t("pos.stock.urgent") : t("pos.stock.critical")}
                               </div>
                            ) : (
                               <div className={cn(T.micro, R.full, "px-3 py-1.5 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-800/50")}>
                                  {t("pos.stock.available")}
                               </div>
                            )}
                         </div>

                         <div className="mb-4">
                            <h4 className={cn(T.bodyEmphasis, "text-slate-900 dark:text-slate-100 truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors")}>{product.name}</h4>
                            <p className={cn(T.caption, "text-slate-400")}>{product.sku} • {product.category}</p>
                         </div>

                         <div className="pt-4 border-t border-slate-50 dark:border-slate-800 flex items-center justify-between">
                            <div>
                               <p className={cn(T.label, "text-slate-300 mb-1")}>{t("pos.stock.current")}</p>
                               <p className={cn(T.kpiCard, isEmpty ? "text-rose-500" : isLow ? "text-amber-500" : "text-slate-900 dark:text-slate-100")}>
                                 {product.current_stock} <span className={cn(T.label, "text-slate-300 ml-1")}>{product.unit}</span>
                               </p>
                            </div>
                            <div className="text-right">
                               <p className={cn(T.label, "text-slate-300 mb-1")}>{t("pos.stock.velocity")}</p>
                               <div className={cn(T.caption, "flex items-center gap-1 text-emerald-500")}>
                                  <ArrowUpRight className="size-3" />
                                  {t("pos.stock.fast_moving")}
                               </div>
                            </div>
                         </div>
                      </div>
                   );
                })
             ) : (
               <div className="col-span-full py-20 text-center">
                  <div className={cn(R.full, "size-16 bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-4 border border-dashed border-slate-200 dark:border-slate-700")}>
                     <Package className="size-6 text-slate-300" />
                  </div>
                  <h4 className={cn(T.bodyEmphasis, "text-slate-400")}>{t("pos.stock.not_found")}</h4>
               </div>
             )}
          </div>
       </div>
    </div>
  );
}
