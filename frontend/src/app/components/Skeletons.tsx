"use client";

import { Skeleton } from "@/app/components/ui/skeleton";
import { ResponsiveTable } from "@/app/components/ui/ResponsiveTable";
import { TABLE } from "@/app/lib/data";
import { R } from "@/app/lib/radii";
import { CHART_HEIGHT } from "@/app/lib/charts";
import { cn } from "@/app/lib/utils";
import { useTranslation } from "@/app/i18n";

const BAR_HEIGHTS = ["36%", "58%", "44%", "72%", "64%", "84%", "52%", "70%"];
const HORIZONTAL_BAR_WIDTHS = ["78%", "62%", "88%", "54%", "72%", "66%"];
const SKELETON_DIMENSIONS = {
  /**
   * Chart skeleton heights mirror the CHART_HEIGHT tiers (sm/md/lg).
   * Pakai sebagai `style={{ height: SKELETON_DIMENSIONS.chartHeight.* }}`
   * agar tinggi tetap konsisten dengan chart sungguhan.
   */
  chartHeight: {
    compact: CHART_HEIGHT.sm,
    bento: CHART_HEIGHT.lg,
    default: CHART_HEIGHT.md,
  },
  sparklineLabel: "w-12",
  overviewSubtitle: "w-full max-w-lg",
} as const;

/**
 * StatsSkeleton - Placeholder for summary dashboard cards.
 * - variant="icon" (default): InventarisPage style (icon left + label + value + desc)
 * - variant="kpi": LaporanPage style (no icon, label top + value row + change badge)
 */
export function StatsSkeleton({
  variant = "icon",
  className,
}: {
  variant?: "icon" | "kpi";
  className?: string;
}) {
  if (variant === "kpi") {
    return (
      <div className={cn("grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3", className)}>
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 shadow-sm">
            <Skeleton className="h-2 w-16 rounded-full opacity-50 mb-2" />
            <div className="flex items-end justify-between">
               <Skeleton className="h-5 w-20 rounded" />
               <Skeleton className="h-4 w-12 rounded opacity-40" />
            </div>
          </div>
        ))}
      </div>
    );
  }
  return (
    <div className={cn("grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3", className)}>
      {[...Array(4)].map((_, i) => (
        <div key={i} className="bg-white dark:bg-slate-900 px-3 py-2 rounded-lg border border-slate-200 shadow-sm flex items-center gap-2.5">
          <Skeleton className="w-7 h-7 rounded-lg shrink-0 opacity-60" />
          <Skeleton className="h-2 w-20 rounded-full opacity-50 flex-1" />
          <div className="flex items-baseline gap-1 shrink-0">
             <Skeleton className="h-3 w-6 rounded" />
             <Skeleton className="h-2 w-10 rounded-full opacity-30" />
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * ChartSkeleton - Compact card placeholder for analytics charts.
 * Matches LaporanPage chart cards: bg-white dark:bg-slate-900 rounded-xl p-5 border shadow-sm.
 * - type='bar' (default): vertical bars with header
 * - type='pie': donut + legend grid (used for Category Impact)
 * - type='bar-horizontal': horizontal bars (Top SKU style)
 * - minimal: compact version with smaller header (same card though)
 */
export function ChartSkeleton({
  className,
  minimal,
  bento,
  type = 'bar',
}: {
  className?: string;
  minimal?: boolean;
  bento?: boolean;
  type?: 'bar' | 'pie' | 'bar-horizontal';
}) {
  const chartHeight = minimal
    ? SKELETON_DIMENSIONS.chartHeight.compact
    : bento
      ? SKELETON_DIMENSIONS.chartHeight.bento
      : SKELETON_DIMENSIONS.chartHeight.default;
  const wrapperClass = bento
    ? cn(R.xl, "bg-white dark:bg-slate-900 p-8 border border-slate-100 shadow-sm flex flex-col space-y-6 h-full")
    : "bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-200 shadow-sm flex flex-col space-y-5 h-full";

  return (
    <div className={cn(wrapperClass, className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
         <div className="space-y-1.5">
            <Skeleton className="h-2.5 w-36 rounded-full" />
            {!minimal && <Skeleton className="h-2 w-48 rounded-full opacity-40" />}
         </div>
         {!minimal && <Skeleton className="h-6 w-24 rounded-lg opacity-50" />}
      </div>

      {/* Chart body */}
      {type === 'bar' ? (
        <div className="flex items-end gap-2 w-full pt-2" style={{ height: chartHeight }}>
          {[...Array(8)].map((_, i) => (
            <Skeleton
              key={i}
              className="flex-1 rounded-t-md opacity-60"
              style={{ height: BAR_HEIGHTS[i % BAR_HEIGHTS.length] }}
            />
          ))}
        </div>
      ) : type === 'bar-horizontal' ? (
        <div className="flex flex-col gap-3 w-full">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="flex flex-col gap-1.5 w-full">
               <Skeleton className="h-2 w-24 rounded-full opacity-50" />
               <Skeleton
                 className="h-2 rounded-full opacity-60"
                 style={{ width: HORIZONTAL_BAR_WIDTHS[i % HORIZONTAL_BAR_WIDTHS.length] }}
               />
            </div>
          ))}
        </div>
      ) : (
        /* pie */
        <div className="flex flex-col items-center justify-center gap-4 flex-1">
          <Skeleton className="w-32 h-32 rounded-full border-[16px] border-slate-100/60 opacity-60" />
          <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 w-full">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Skeleton className="w-1.5 h-1.5 rounded-full" />
                  <Skeleton className="h-2 w-12 rounded-full opacity-50" />
                </div>
                <Skeleton className="h-2 w-6 rounded-full opacity-40" />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * MLOpsDashboardSkeleton - Full-page placeholder for MLOpsDashboardPage.
 * Mirrors service status cards, active model KPIs, tabs, and overview chart area.
 */
export function MLOpsDashboardSkeleton() {
  return (
    <>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-8 w-72 rounded-xl" />
          <Skeleton className="h-3 w-96 max-w-full rounded-full opacity-50" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-10 w-28 rounded-xl opacity-50" />
          <Skeleton className="h-10 w-36 rounded-xl opacity-60" />
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 p-4 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
              <Skeleton className="h-9 w-9 rounded-xl opacity-60" />
              <Skeleton className="h-5 w-20 rounded-full opacity-40" />
            </div>
            <Skeleton className="h-3 w-28 rounded-full" />
            <Skeleton className="mt-2 h-2 w-full rounded-full opacity-40" />
            <Skeleton className="mt-3 h-2 w-20 rounded-full opacity-50" />
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 p-4 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
              <Skeleton className="h-2.5 w-20 rounded-full opacity-50" />
              <Skeleton className="h-4 w-4 rounded opacity-40" />
            </div>
            <Skeleton className="h-8 w-20 rounded-lg" />
            <Skeleton className="mt-2 h-2 w-14 rounded-full opacity-40" />
          </div>
        ))}
      </div>

      <Skeleton className="h-11 w-72 rounded-xl opacity-50" />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartSkeleton minimal />
        <ChartSkeleton minimal type="bar-horizontal" />
        <div className="lg:col-span-2 rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:bg-slate-900">
          <Skeleton className="mb-6 h-3 w-40 rounded-full opacity-50" />
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <Skeleton className="h-3 w-28 rounded-full" />
                <Skeleton className="h-2 flex-1 rounded-full opacity-50" />
                <Skeleton className="h-3 w-16 rounded-full opacity-40" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

/**
 * ProductGridSkeleton - Compact placeholder for "Top Performing SKU" 5-column grid.
 * Matches LaporanPage: bg-white dark:bg-slate-900 rounded-xl p-5 with inner slate-50 rounded-xl p-4 cards.
 */
export function ProductGridSkeleton() {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-200 shadow-sm">
      <Skeleton className="h-2.5 w-32 rounded-full mb-4 opacity-60" />
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="bg-slate-50 rounded-xl p-4 border border-slate-100 flex flex-col gap-2 relative overflow-hidden">
            <Skeleton className="h-2.5 w-full rounded opacity-60" />
            <Skeleton className="h-2 w-2/3 rounded-full opacity-40" />
            <div className="flex items-center justify-between mt-auto pt-2">
              <Skeleton className="h-2 w-10 rounded-full opacity-50" />
              <Skeleton className="h-3 w-8 rounded opacity-40" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * TableSkeleton - Simplified data rows for inventory or reports.
 */
export function TableSkeleton() {
  return (
    <div className={cn(R.xl, "bg-white dark:bg-slate-900 border border-slate-100 overflow-hidden shadow-sm")}>
      <div className="p-8 border-b border-slate-50 flex items-center justify-between">
         <Skeleton className="h-6 w-40 rounded-lg" />
         <div className="flex gap-3">
             <Skeleton className="h-10 w-10 rounded-xl" />
             <Skeleton className="h-10 w-32 rounded-xl" />
         </div>
      </div>
      <div className="p-0">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="flex items-center gap-6 p-6 border-b border-slate-50 last:border-none">
            <Skeleton className="h-12 w-12 rounded-2xl shrink-0" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-48 rounded-lg" />
              <Skeleton className="h-3 w-32 rounded-full" />
            </div>
            <div className="hidden md:flex flex-col items-end gap-2 pr-10">
              <Skeleton className="h-4 w-20 rounded-lg" />
              <Skeleton className="h-3 w-12 rounded-full" />
            </div>
            <Skeleton className="h-8 w-20 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * SettingsShellSkeleton - Content-area placeholder for PengaturanPage.
 * Rendered INSIDE the page's existing content card, so no outer wrapper here.
 * Matches the profile tab layout: avatar row + 2 input fields + 2FA card + footer.
 */
export function SettingsShellSkeleton() {
  return (
    <div className="p-8 space-y-8 flex-1">
       {/* Avatar row */}
       <div className="flex items-center gap-6 pb-6 border-b border-slate-100">
          <Skeleton className="w-20 h-20 rounded-2xl shrink-0 opacity-60" />
          <div className="space-y-2 flex-1">
             <Skeleton className="h-5 w-40 rounded" />
             <Skeleton className="h-2 w-56 rounded-full opacity-40" />
          </div>
       </div>

       {/* Input fields grid */}
       <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="space-y-2">
               <Skeleton className="h-2 w-20 rounded-full opacity-50" />
               <Skeleton className="h-10 w-full rounded-xl opacity-60" />
            </div>
          ))}
       </div>

       {/* 2FA callout card */}
       <div className="flex items-center gap-4 p-4 bg-indigo-50/40 rounded-2xl border border-indigo-100/50">
          <Skeleton className="w-11 h-11 rounded-xl shrink-0 opacity-60" />
          <div className="flex-1 space-y-1.5">
             <Skeleton className="h-2.5 w-40 rounded-full opacity-60" />
             <Skeleton className="h-2 w-52 rounded-full opacity-40" />
          </div>
          <Skeleton className="h-6 w-20 rounded-lg opacity-50" />
       </div>
    </div>
  );
}

/**
 * UserProfileSkeleton - Full-page placeholder for UserProfilePage.
 * Matches the banner + 3-column grid layout (metrics/activity + achievements/security).
 */
export function UserProfileSkeleton() {
  return (
    <>
      {/* Banner header card */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 shadow-sm overflow-hidden">
         <Skeleton className="h-32 w-full rounded-none opacity-60" />
         <div className="px-6 pb-6">
            <div className="flex flex-col lg:flex-row lg:items-end justify-between -mt-10 gap-6 relative z-10">
               <div className="flex flex-col lg:flex-row lg:items-end gap-6">
                  <Skeleton className="w-28 h-28 rounded-2xl border-4 border-white shrink-0" />
                  <div className="mb-1 space-y-2">
                     <Skeleton className="h-6 w-40 rounded" />
                     <div className="flex flex-wrap items-center gap-4">
                        <Skeleton className="h-2 w-28 rounded-full opacity-40" />
                        <Skeleton className="h-2 w-20 rounded-full opacity-40" />
                     </div>
                  </div>
               </div>
               <div className="flex gap-2 mb-1">
                  <Skeleton className="h-8 w-24 rounded-lg opacity-50" />
                  <Skeleton className="h-8 w-8 rounded-lg opacity-40" />
               </div>
            </div>
         </div>
      </div>

      {/* Main content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
         {/* Left column: metrics + activity */}
         <div className="lg:col-span-2 space-y-6">
            {/* Performance metrics card */}
            <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 shadow-sm">
               <div className="flex items-center justify-between mb-6">
                  <Skeleton className="h-2.5 w-32 rounded-full" />
                  <Skeleton className="h-2 w-16 rounded-full opacity-40" />
               </div>
               <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {[...Array(3)].map((_, i) => (
                     <div key={i} className="bg-slate-50/50 p-4 rounded-xl border border-slate-200 space-y-2">
                        <Skeleton className="h-2 w-20 rounded-full opacity-50" />
                        <Skeleton className="h-5 w-14 rounded" />
                     </div>
                  ))}
               </div>
            </div>

            {/* Activity log card */}
            <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 shadow-sm">
               <div className="flex items-center justify-between mb-6">
                  <Skeleton className="h-2.5 w-28 rounded-full" />
                  <Skeleton className="h-2 w-16 rounded-full opacity-40" />
               </div>
               <div className="space-y-2">
                  {[...Array(4)].map((_, i) => (
                     <div key={i} className="flex items-center justify-between p-3 border border-slate-100 rounded-xl">
                        <div className="flex items-center gap-3">
                           <Skeleton className="w-8 h-8 rounded-lg shrink-0 opacity-50" />
                           <div className="space-y-1.5">
                              <Skeleton className="h-2.5 w-32 rounded" />
                              <Skeleton className="h-2 w-24 rounded-full opacity-40" />
                           </div>
                        </div>
                        <Skeleton className="h-2 w-16 rounded-full opacity-30" />
                     </div>
                  ))}
               </div>
            </div>
         </div>

         {/* Right column: achievements + security */}
         <div className="space-y-6">
            {/* Badges */}
            <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 shadow-sm">
               <Skeleton className="h-2.5 w-28 rounded-full mb-6" />
               <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                     <div key={i} className="flex gap-3">
                        <Skeleton className="w-9 h-9 rounded-xl shrink-0 opacity-50" />
                        <div className="space-y-1.5 flex-1">
                           <Skeleton className="h-2.5 w-28 rounded" />
                           <Skeleton className="h-2 w-40 rounded-full opacity-40" />
                        </div>
                     </div>
                  ))}
               </div>
            </div>

            {/* Security card (dark) */}
            <div className="bg-slate-900 rounded-xl p-5 space-y-5 overflow-hidden">
               <Skeleton className="h-2.5 w-24 rounded-full opacity-20" />
               <div className="space-y-2">
                  {[...Array(2)].map((_, i) => (
                     <div key={i} className="flex items-center justify-between p-2 bg-white/5 rounded-lg border border-white/5">
                        <Skeleton className="h-2 w-20 rounded-full opacity-20" />
                        <Skeleton className="w-7 h-3.5 rounded-full opacity-20" />
                     </div>
                  ))}
               </div>
               <Skeleton className="h-8 w-full rounded-lg opacity-10" />
            </div>
         </div>
      </div>
    </>
  );
}

/**
 * InventoryTableSkeleton - Compact 5-column table placeholder for InventarisPage.
 * Rendered inside the page's own white card container, so no outer wrapper here.
 * Matches the real table structure: Product | Stock | DOI | Status | Detail.
 */
export function InventoryTableSkeleton() {
  const { t } = useTranslation();
  const label = t("a11y.loading.inventory_table");

  return (
    <ResponsiveTable
      label={label}
      scrollerClassName="rounded-none border-0 bg-transparent"
      minWidthClassName={TABLE.minWidth.inventory}
    >
    <table className={TABLE.base} aria-label={label}>
       <thead>
          <tr className="bg-slate-50/50">
             {[...Array(5)].map((_, i) => (
                <th key={i} className={cn("px-4 py-3", i === 4 && "text-right")}>
                   <Skeleton className={cn("h-2 w-14 rounded-full opacity-40", i === 4 && "ml-auto")} />
                </th>
             ))}
          </tr>
       </thead>
       <tbody className="divide-y divide-slate-100">
          {[...Array(6)].map((_, i) => (
             <tr key={i}>
                {/* Product: name + sku */}
                <td className="px-4 py-3">
                   <div className="flex flex-col gap-1">
                      <Skeleton className="h-2.5 w-32 rounded" />
                      <Skeleton className="h-2 w-20 rounded-full opacity-50" />
                   </div>
                </td>
                {/* Stock: value + bar */}
                <td className="px-4 py-3">
                   <div className="flex flex-col gap-1">
                      <Skeleton className="h-2.5 w-12 rounded" />
                      <Skeleton className="h-1 w-16 rounded-full opacity-40" />
                   </div>
                </td>
                {/* DOI: pill + label */}
                <td className="px-4 py-3">
                   <div className="flex items-center gap-2">
                      <Skeleton className="w-7 h-7 rounded-lg opacity-50" />
                      <Skeleton className="h-2 w-6 rounded-full opacity-50" />
                   </div>
                </td>
                {/* Status: badge */}
                <td className="px-4 py-3">
                   <Skeleton className="h-4 w-16 rounded opacity-50" />
                </td>
                {/* Detail: button */}
                <td className="px-4 py-3 text-right">
                   <Skeleton className="w-6 h-6 rounded-lg opacity-40 ml-auto" />
                </td>
             </tr>
          ))}
       </tbody>
    </table>
    </ResponsiveTable>
  );
}

/**
 * PredictionTableSkeleton - Specialized layout for the Stock Forecasting table.
 * Matches the 6-column predicting structure exactly.
 */
export function PredictionTableSkeleton() {
  const { t } = useTranslation();
  const label = t("a11y.loading.prediction_table");

  return (
    <ResponsiveTable
      label={label}
      scrollerClassName="rounded-none border-0 bg-transparent"
      minWidthClassName={TABLE.minWidth.prediction}
    >
       <table className={TABLE.base} aria-label={label}>
          <thead>
             <tr className="bg-slate-50/50">
                {[...Array(6)].map((_, i) => (
                   <th key={i} className="px-10 py-6">
                      <Skeleton className="h-3 w-24 rounded-full opacity-40" />
                   </th>
                ))}
             </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
             {[...Array(8)].map((_, i) => (
                <tr key={i}>
                   {/* Produk */}
                   <td className="px-10 py-8">
                      <div className="flex flex-col space-y-2">
                         <Skeleton className="h-4 w-40 rounded-lg" />
                         <Skeleton className="h-3 w-28 rounded-full opacity-50" />
                      </div>
                   </td>
                   {/* Stok Saat Ini */}
                   <td className="px-10 py-8">
                      <div className="w-40 space-y-3">
                         <div className="flex justify-between">
                            <Skeleton className="h-3 w-8 rounded-full" />
                            <Skeleton className="h-3 w-10 rounded-full" />
                         </div>
                         <Skeleton className="h-2 w-full rounded-full opacity-40" />
                      </div>
                   </td>
                   {/* Forecast */}
                   <td className="px-10 py-8">
                      <div className="flex flex-col space-y-2">
                         <Skeleton className="h-6 w-24 rounded-lg" />
                         <Skeleton className="h-3 w-16 rounded-full opacity-40" />
                      </div>
                   </td>
                   {/* Confidence */}
                   <td className="px-10 py-8">
                      <div className="space-y-2">
                         <Skeleton className="h-3 w-10 rounded-full" />
                         <Skeleton className="h-1.5 w-24 rounded-full opacity-40" />
                      </div>
                   </td>
                   {/* Tren & Deadline */}
                   <td className="px-10 py-8">
                      <div className="space-y-3">
                         <div className="flex items-center gap-2">
                            <Skeleton className="w-4 h-4 rounded-full opacity-40" />
                            <Skeleton className="h-3 w-16 rounded-full opacity-50" />
                         </div>
                         <div className="flex items-center gap-2">
                            <Skeleton className="w-4 h-4 rounded-full opacity-40" />
                            <Skeleton className="h-3 w-20 rounded-full opacity-30" />
                         </div>
                      </div>
                   </td>
                   {/* Prioritas */}
                   <td className="px-10 py-8">
                      <Skeleton className="h-7 w-20 rounded-xl opacity-40" />
                   </td>
                </tr>
             ))}
          </tbody>
       </table>
    </ResponsiveTable>
  );
}

/**
 * KPICardsSkeleton - Placeholder matching the real KPICards layout exactly.
 * Each card: p-6 rounded-2xl with icon+badge row, title+value+trend, description+sparkline row.
 */
export function KPICardsSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 shadow-sm">
           {/* Header: icon + grade badge */}
           <div className="flex items-center justify-between mb-6">
              <Skeleton className="w-11 h-11 rounded-xl opacity-50 shrink-0" />
              <div className="flex flex-col items-end gap-1">
                 <Skeleton className="h-3.5 w-16 rounded-lg opacity-50" />
                 <Skeleton className="h-2 w-14 rounded-full opacity-30" />
              </div>
           </div>
           {/* Title + value + trend */}
           <div className="space-y-1 mb-6">
              <Skeleton className="h-2 w-28 rounded-full opacity-40" />
              <div className="flex items-baseline gap-2">
                 <Skeleton className="h-8 w-24 rounded" />
                 <Skeleton className="h-2.5 w-10 rounded-full opacity-40" />
              </div>
           </div>
           {/* Description + sparkline */}
           <div className="pt-5 border-t border-slate-50 flex items-center justify-between gap-4">
              <div className="space-y-1 flex-1">
                 <Skeleton className="h-2 w-full rounded-full opacity-30" />
                 <Skeleton className="h-2 w-20 rounded-full opacity-30" />
              </div>
              <div className="shrink-0 space-y-1">
                 <Skeleton className={cn("h-4 rounded opacity-40", SKELETON_DIMENSIONS.sparklineLabel)} />
                 <Skeleton className="h-1.5 w-12 rounded-full opacity-20 ml-auto" />
              </div>
           </div>
        </div>
      ))}
    </div>
  );
}

/**
 * OverviewTableSkeleton - Balanced 6-column layout for the PredictionTable component.
 */
export function OverviewTableSkeleton() {
  const { t } = useTranslation();
  const label = t("a11y.loading.overview_table");

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex flex-col">
       <div className="p-8 border-b border-slate-50 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
             <div className="flex items-center gap-3">
                <Skeleton className="h-7 w-64 rounded-xl" />
                <Skeleton className="h-6 w-24 rounded-full opacity-40" />
             </div>
             <Skeleton className={cn("h-4 rounded-full opacity-30", SKELETON_DIMENSIONS.overviewSubtitle)} />
          </div>
          <div className="flex gap-4">
             <Skeleton className="h-12 w-64 rounded-2xl opacity-40" />
             <Skeleton className="h-12 w-80 rounded-2xl opacity-40" />
          </div>
       </div>

       <ResponsiveTable
          label={label}
          scrollerClassName="rounded-none border-0 bg-transparent"
          minWidthClassName={TABLE.minWidth.prediction}
       >
          <table className={TABLE.base} aria-label={label}>
             <thead>
                <tr className="bg-slate-50/50">
                   {[...Array(6)].map((_, i) => (
                      <th key={i} className="px-8 py-5">
                         <Skeleton className="h-3 w-24 rounded-full opacity-30" />
                      </th>
                   ))}
                </tr>
             </thead>
             <tbody className="divide-y divide-slate-50">
                {[...Array(6)].map((_, i) => (
                   <tr key={i}>
                      {/* Produk */}
                      <td className="px-8 py-6">
                         <div className="flex flex-col space-y-2">
                            <Skeleton className="h-4 w-40 rounded-lg" />
                            <Skeleton className="h-3 w-16 rounded-full opacity-50" />
                         </div>
                      </td>
                      {/* Kategori */}
                      <td className="px-8 py-6 text-center">
                         <Skeleton className="h-5 w-24 rounded-lg opacity-40" />
                      </td>
                      {/* Stok Saat Ini */}
                      <td className="px-8 py-6">
                         <div className="w-32 space-y-2">
                            <div className="flex justify-between">
                               <Skeleton className="h-2.5 w-6 rounded-full" />
                               <Skeleton className="h-2.5 w-8 rounded-full opacity-50" />
                            </div>
                            <Skeleton className="h-1.5 w-full rounded-full opacity-30" />
                         </div>
                      </td>
                      {/* Prediksi */}
                      <td className="px-8 py-6">
                         <div className="flex items-center gap-2">
                            <Skeleton className="h-4 w-20 rounded-lg" />
                            <Skeleton className="w-3.5 h-3.5 rounded-full opacity-40" />
                         </div>
                      </td>
                      {/* Sisa Hari */}
                      <td className="px-8 py-6">
                         <Skeleton className="h-4 w-16 rounded-full opacity-50" />
                      </td>
                      {/* Rekomendasi */}
                      <td className="px-8 py-6">
                         <Skeleton className="h-8 w-32 rounded-xl opacity-40" />
                      </td>
                   </tr>
                ))}
             </tbody>
          </table>
       </ResponsiveTable>
    </div>
  );
}

