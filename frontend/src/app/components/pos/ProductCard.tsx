"use client";

import { Plus, Package, Pencil } from "lucide-react";
import { Product } from "@/app/types/pos";
import { cn } from "@/app/lib/utils";
import { T } from "@/app/lib/typography";
import { R } from "@/app/lib/radii";
import { formatRupiah } from "@/app/lib/format";
import { useTranslation } from "@/app/i18n";

interface ProductCardProps {
  product: Product;
  onAdd: () => void;
}

export function ProductCard({ product, onAdd }: ProductCardProps) {
  const { t } = useTranslation();
  const isLowStock = !product.is_service && product.current_stock > 0 && product.current_stock < 10;
  const isOutOfStock = !product.is_service && product.current_stock <= 0;

  return (
    <button
      type="button"
      onClick={!isOutOfStock ? onAdd : undefined}
      disabled={isOutOfStock}
      className={cn(
        "group relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 transition-colors duration-200 hover:border-indigo-300 dark:hover:border-indigo-700 hover:bg-indigo-50/30 dark:hover:bg-indigo-950/20 cursor-pointer flex flex-col text-left w-full",
        isOutOfStock && "opacity-70 grayscale cursor-not-allowed"
      )}
    >
      {/* Badges top-right */}
      <div className="absolute top-3 right-3 z-10 flex flex-col gap-1 items-end">
        {isOutOfStock ? (
          <span className={cn(T.micro, R.full, "bg-rose-500 text-white px-2 py-0.5 shadow-lg")}>{t("pos.product.out_of_stock")}</span>
        ) : isLowStock ? (
          <span className={cn(T.micro, R.full, "bg-amber-500 text-white px-2 py-0.5 shadow-lg")}>{t("pos.product.low_stock")}</span>
        ) : null}
        {product.min_qty && (
          <span className={cn(T.micro, R.full, "bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 px-2 py-0.5")}>{t("pos.product.min_qty", { qty: product.min_qty })}</span>
        )}
        {product.custom_price && (
          <span className={cn(T.micro, R.full, "bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 px-2 py-0.5 flex items-center gap-0.5")}>
            <Pencil className="size-2" /> {t("pos.product.custom")}
          </span>
        )}
      </div>

      {/* Image / Icon */}
      <div className="relative aspect-[4/3] bg-slate-50 dark:bg-slate-800 rounded-lg overflow-hidden mb-2.5 border border-slate-200/70 dark:border-slate-700 shadow-inner flex items-center justify-center group-hover:bg-indigo-50/50 dark:group-hover:bg-indigo-900/20 transition-colors">
        {product.image_url ? (
          <img src={product.image_url} alt={product.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
        ) : (
          <Package className="size-8 text-slate-200 dark:text-slate-600 group-hover:text-indigo-200 dark:group-hover:text-indigo-400 transition-colors" />
        )}
        {!isOutOfStock && (
          <div className="absolute inset-0 bg-indigo-600/0 group-hover:bg-indigo-600/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300">
            <div className={cn(R.full, "bg-indigo-600 text-white size-11 flex items-center justify-center shadow-xl shadow-indigo-200 dark:shadow-indigo-900/50 scale-75 group-hover:scale-100 transition-all duration-200")}>
              {product.custom_price ? <Pencil className="size-5" /> : <Plus className="size-6" strokeWidth={3} />}
            </div>
          </div>
        )}
      </div>

      {/* Details */}
      <div className="flex-1 space-y-1">
        <h3 className={cn(T.bodySm, "font-bold text-slate-900 dark:text-slate-100 leading-tight line-clamp-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors")}>
          {product.name}
        </h3>
        <p className={cn(T.bodySm, "text-slate-600 dark:text-slate-300 truncate")}>{product.category}</p>
        <span className={cn(T.code, "text-slate-500 dark:text-slate-400")}>{product.sku}</span>
      </div>

      {/* Price footer */}
      <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-800 flex flex-col gap-0.5">
        {product.custom_price ? (
          <span className={cn(T.bodySm, "font-bold text-amber-600 leading-tight line-clamp-1")}>
            {product.price_hint ?? (product.base_price === 0 ? "–" : formatRupiah(product.base_price))}
          </span>
        ) : (
          <span className={cn(T.body, "font-bold text-indigo-600 leading-tight")}>
            {formatRupiah(product.base_price)}
            <span className={cn(T.bodySm, "text-slate-500 dark:text-slate-400 ml-0.5")}>/{product.unit}</span>
          </span>
        )}
        {!product.is_service && (
          <span className={cn(T.bodySm, "text-slate-500 dark:text-slate-400")}>
            {t("pos.product.stock", { count: product.current_stock, unit: product.unit })}
          </span>
        )}
      </div>
    </button>
  );
}
