"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, ChevronRight, Package, TrendingUp } from "lucide-react";
import { cn } from "@/app/lib/utils";
import { T } from "@/app/lib/typography";
import { C } from "@/app/lib/colors";
import { R } from "@/app/lib/radii";
import { E } from "@/app/lib/elevation";
import { useTranslation } from "@/app/i18n";
import Link from "next/link";
import { isDemoDataEnabled } from "@/app/lib/demo-mode";
import { useAuth } from "@/app/context/AuthContext";
import { fetchLowStockAlerts, type InventoryStockItem } from "@/app/lib/dashboard-client";

interface LowStockItem {
  id: string;
  name: string;
  sku: string;
  currentStock: number;
  minThreshold: number;
  unit: string;
  restockRecommendation: number;
}

const mapApiItem = (i: InventoryStockItem): LowStockItem => ({
  id: i.id,
  name: i.product_name ?? `Product ${i.product_id.slice(0, 8)}`,
  sku: i.product_sku ?? i.id.slice(0, 8),
  currentStock: i.current_stock,
  minThreshold: i.min_stock,
  unit: i.product_unit ?? "unit",
  restockRecommendation: Math.max(0, i.reorder_point - i.current_stock),
});

export function LowStockAlert() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [lowStockItems, setLowStockItems] = useState<LowStockItem[]>([]);

  useEffect(() => {
    if (!isDemoDataEnabled()) return;

    let cancelled = false;
    void import("@/app/demo/low-stock").then(({ DEMO_LOW_STOCK }) => {
      if (!cancelled) setLowStockItems(DEMO_LOW_STOCK);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (isDemoDataEnabled()) return;
    void fetchLowStockAlerts(user?.storeNbr ?? undefined, 100)
      .then((items) => setLowStockItems(items.map(mapApiItem)))
      .catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.storeNbr]);

  return (
    <div className={cn(R.md, E.sm, "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 overflow-hidden")}>
      <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
        <h3 className={cn(T.h4, "text-slate-900 dark:text-slate-100 flex items-center gap-2")}>
          <AlertTriangle className={cn("size-3.5", C.warning.icon)} />
          {t("dash.section.low_stock")}
        </h3>
        <span className={cn(T.caption, "text-slate-400")}>
          {lowStockItems.length} item
        </span>
      </div>

      <div className="divide-y divide-slate-50 dark:divide-slate-800">
        {lowStockItems.map((item) => {
          const pct = Math.round((item.currentStock / item.minThreshold) * 100);
          const isUrgent = pct < 30;

          return (
            <div key={item.id} className="px-4 py-3 flex items-center gap-4 hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors group">
              {/* Icon */}
              <div className={cn(
                R.sm, "size-9 flex items-center justify-center shrink-0",
                isUrgent ? "bg-rose-50 dark:bg-rose-900/30 text-rose-500" : "bg-amber-50 dark:bg-amber-900/30 text-amber-500"
              )}>
                <Package className="size-4" />
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className={cn(T.bodySm, "font-bold text-slate-900 dark:text-slate-100 truncate")}>{item.name}</p>
                  {isUrgent && (
                    <span className={cn(T.micro, R.xs, "px-1.5 py-0.5 bg-rose-50 dark:bg-rose-900/30 text-rose-600 border border-rose-100 dark:border-rose-800/50 shrink-0")}>
                      Urgent
                    </span>
                  )}
                </div>
                <p className={cn(T.caption, "text-slate-400")}>
                  {t("inv.table.stock")}: <span className={cn("font-data", isUrgent ? "text-rose-500" : "text-amber-500")}>{item.currentStock} {item.unit}</span>
                  {" · "}
                  {t("dash.low_stock.threshold", { min: `${item.minThreshold} ${item.unit}` })}
                </p>
                <p className={cn(T.caption, "text-slate-300 dark:text-slate-600 italic mt-0.5")}>
                  {t("dash.low_stock.recommend", { qty: item.restockRecommendation })}
                </p>
              </div>

              {/* Stock bar */}
              <div className="w-16 shrink-0">
                <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className={cn("h-full rounded-full", isUrgent ? "bg-rose-500" : "bg-amber-500")}
                    style={{ width: `${Math.min(pct, 100)}%` }}
                  />
                </div>
                <p className={cn(T.dataSm, "text-slate-400 text-center mt-1")}>{pct}%</p>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                <Link
                  href="/prediksi-stok"
                  className={cn(T.buttonSm, R.xs, "px-2 py-1 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-all")}
                >
                  {t("dash.low_stock.view_forecast")}
                </Link>
                <Link
                  href="/inventaris"
                  className={cn(T.buttonSm, R.xs, "px-2 py-1 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 transition-all")}
                >
                  {t("dash.low_stock.update_stock")}
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
