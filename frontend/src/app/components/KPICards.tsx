"use client";

import { useState, useEffect } from "react";
import { 
  ArrowUpRight, 
  ArrowDownRight, 
  Target, 
  ShieldCheck, 
  AlertTriangle, 
  PackageCheck,
  Activity
} from "lucide-react";
import { cn } from "@/app/lib/utils";
import { formatRupiah } from "@/app/lib/format";
import { T } from "@/app/lib/typography";
import { R } from "@/app/lib/radii";
import { E } from "@/app/lib/elevation";
import { useTranslation } from "@/app/i18n";
import { useAuth } from "@/app/context/AuthContext";
import { isDemoDataEnabled } from "@/app/lib/demo-mode";
import { fetchStockSummary, type StockSummaryResponse } from "@/app/lib/dashboard-client";

export function KPICards() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [summary, setSummary] = useState<StockSummaryResponse | null>(null);

  useEffect(() => {
    if (isDemoDataEnabled()) return;
    void fetchStockSummary(user?.storeNbr ?? undefined).then(setSummary).catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.storeNbr]);

  const stockoutCount = summary ? summary.critical + summary.out_of_stock : null;
  const inventoryValue = summary ? summary.total_inventory_value : null;
  const stockHealthPct =
    summary && summary.total_products > 0
      ? Math.round((summary.safe / summary.total_products) * 100)
      : null;

  const cards = [
    {
      title: t("kpi.accuracy.title"),
      value: "94.3%",
      icon: Target,
      description: t("kpi.accuracy.desc"),
      trend: "+1.2%",
      trendUp: true,
      grade: "Grade A+",
      color: "indigo",
      sparkline: "M 0 10 L 10 8 L 20 12 L 30 5 L 40 7 L 50 2"
    },
    {
      title: t("kpi.stock.title"),
      value: stockHealthPct != null ? `${stockHealthPct}%` : "78%",
      icon: ShieldCheck,
      description: t("kpi.stock.desc"),
      trend: "+3.0%",
      trendUp: true,
      grade: "Optimal",
      color: "emerald",
      sparkline: "M 0 12 L 10 10 L 20 8 L 30 9 L 40 4 L 50 6"
    },
    {
      title: t("kpi.stockout.title"),
      value: stockoutCount != null ? `${stockoutCount} Item` : "12 Item",
      icon: AlertTriangle,
      description: t("kpi.stockout.desc"),
      trend: "-2 item",
      trendUp: false,
      grade: "At Risk",
      color: "amber",
      sparkline: "M 0 2 L 10 5 L 20 4 L 30 10 L 40 8 L 50 12"
    },
    {
      title: t("kpi.modal.title"),
      value: inventoryValue != null ? formatRupiah(inventoryValue, { compact: true }) : formatRupiah(14200000, { compact: true }),
      icon: PackageCheck,
      description: t("kpi.modal.desc"),
      trend: "+" + formatRupiah(2100000, { compact: true }),
      trendUp: true,
      grade: "Excellent",
      color: "indigo",
      sparkline: "M 0 10 L 10 7 L 20 9 L 30 4 L 40 2 L 50 5"
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {cards.map((card, idx) => (
        <div
          key={idx}
          className={cn(R.lg, E.sm, "bg-white dark:bg-slate-900 p-6 border border-slate-100 dark:border-slate-800 transition-all duration-200 group relative overflow-hidden")}
        >
          <div className="flex items-center justify-between mb-6">
            <div className={cn(
              cn(R.md, E.sm, "p-3"),
              card.color === "indigo" ? "bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 border border-indigo-100 dark:border-indigo-800/50" : 
              card.color === "emerald" ? "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 border border-emerald-100 dark:border-emerald-800/50" : "bg-amber-50 dark:bg-amber-900/30 text-amber-600 border border-amber-100 dark:border-amber-800/50"
            )}>
              <card.icon className="size-5" />
            </div>
            <div className="flex flex-col items-end">
              <span className={cn(
                cn(T.micro, R.sm, "px-2 py-0.5 shadow-sm"),
                card.color === "indigo" ? "bg-indigo-600 text-white" : 
                card.color === "emerald" ? "bg-emerald-500 text-white" : "bg-amber-500 text-white"
              )}>
                {card.grade}
              </span>
              <div className="flex items-center gap-1 mt-1">
                 <Activity className="size-2 text-slate-300" />
                 <span className={cn(T.caption, "text-slate-300")}>Live Insight</span>
              </div>
            </div>
          </div>
          
          <div className="space-y-1 mb-6">
            <h3 className={cn(T.h4, "text-slate-400")}>{card.title}</h3>
            <div className="flex items-baseline gap-2">
              <p className={cn(T.kpiCard, "text-slate-900 dark:text-slate-100")}>{card.value}</p>
              <div className={cn(
                cn(T.bodySm, "font-semibold flex items-center"),
                card.trendUp ? "text-emerald-500" : "text-amber-500"
              )}>
                {card.trendUp ? <ArrowUpRight className="size-3" /> : <ArrowDownRight className="size-3" />}
                {card.trend}
              </div>
            </div>
          </div>
          
          <div className="pt-5 border-t border-slate-50 dark:border-slate-800 flex items-center justify-between gap-4">
            <p className={cn(T.bodySm, "font-bold text-slate-400 leading-relaxed max-w-[120px]")}>
              {card.description}
            </p>
            
            {/* Mini Sparkline */}
            <div className="shrink-0">
               <svg width="50" height="15" viewBox="0 0 50 15" fill="none" className={cn(
                 "overflow-visible",
                 card.color === "indigo" ? "text-indigo-500" : 
                 card.color === "emerald" ? "text-emerald-500" : "text-amber-500"
               )}>
                  <path 
                    d={card.sparkline} 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="2.5" 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                  />
                  <circle cx="50" cy="2" r="2" fill="currentColor" />
               </svg>
               <p className={cn(T.caption, "text-slate-300 text-right mt-1")}>24h Velocity</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
