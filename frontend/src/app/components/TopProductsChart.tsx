"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
} from "recharts";
import { TrendingUp, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { cn } from "@/app/lib/utils";
import { T } from "@/app/lib/typography";
import { TABLE } from "@/app/lib/data";
import { C } from "@/app/lib/colors";
import { R, R_COMPONENT } from "@/app/lib/radii";
import { E } from "@/app/lib/elevation";
import { A11Y } from "@/app/lib/a11y";
import { formatRupiah } from "@/app/lib/format";
import { ResponsiveTable } from "@/app/components/ui/ResponsiveTable";
import { useTranslation } from "@/app/i18n";
import { CHART_COLORS, CHART_HEIGHT, getAxisProps, getTooltipContentStyle } from "@/app/lib/charts";
import { StableResponsiveContainer as ResponsiveContainer } from "@/app/components/charts/StableResponsiveContainer";
import { isDemoDataEnabled } from "@/app/lib/demo-mode";

type Period = "daily" | "weekly" | "monthly";

type TopProduct = {
  name: string;
  qtySold: number;
  revenue: number;
  pct: number;
  change: number;
};

const EMPTY_TOP_PRODUCTS: Record<Period, TopProduct[]> = {
  daily: [],
  weekly: [],
  monthly: [],
};

export function TopProductsChart() {
  const { t } = useTranslation();
  const { resolvedTheme } = useTheme();
  const [period, setPeriod] = useState<Period>("weekly");
  const [topProductsData, setTopProductsData] = useState<Record<Period, TopProduct[]>>(EMPTY_TOP_PRODUCTS);
  const barColors = CHART_COLORS.series;
  const chartTheme = resolvedTheme === "dark" ? "dark" : "light";
  const axisProps = getAxisProps(chartTheme);
  const tooltipStyle = getTooltipContentStyle(chartTheme);

  useEffect(() => {
    if (!isDemoDataEnabled()) return;

    let cancelled = false;
    void import("@/app/demo/top-products").then(({ DEMO_TOP_PRODUCTS }) => {
      if (!cancelled) setTopProductsData(DEMO_TOP_PRODUCTS);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  const data = topProductsData[period];

  return (
    <div className={cn(R_COMPONENT.card, E.sm, "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 overflow-hidden")}>
      <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
        <h3 className={cn(T.h4, "text-slate-900 dark:text-slate-100 flex items-center gap-2 shrink-0")}>
          <TrendingUp className={cn("size-3.5", C.primary.icon)} />
          {t("dash.section.top_products")}
        </h3>
        <div className={cn(R.sm, "flex bg-slate-100/70 dark:bg-slate-800/70 p-0.5 border border-slate-200 dark:border-slate-700")}>
          {(["daily", "weekly", "monthly"] as Period[]).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setPeriod(p)}
              className={cn(
                T.buttonSm, R.sm, A11Y.tapTarget, "px-3 py-1 transition-all cursor-pointer",
                A11Y.focusRing.default,
                period === p
                  ? "bg-white dark:bg-slate-900 text-indigo-600 shadow-sm"
                  : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
              )}
            >
              {t(`dash.period.${p}`)}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-5 gap-0">
        {/* Chart */}
        <div className="xl:col-span-2 p-4 border-r border-slate-50 dark:border-slate-800">
          <div style={{ height: CHART_HEIGHT.sm }}>
            <ResponsiveContainer debounce={200} width="100%" height="100%">
              <BarChart data={data} layout="vertical" margin={{ left: 0 }}>
                <XAxis type="number" hide />
                <YAxis
                  dataKey="name"
                  type="category"
                  {...axisProps}
                  tick={{ ...axisProps.tick, fontSize: 9, fontWeight: 800 }}
                  width={100}
                />
                <Tooltip
                  cursor={{ fill: "transparent" }}
                  contentStyle={{
                    ...tooltipStyle,
                    borderRadius: "0.5rem",
                    fontSize: "9px",
                  }}
                  formatter={(value) => [`${value} unit`, t("dash.top.qty_sold")]}
                />
                <Bar dataKey="qtySold" radius={[0, 6, 6, 0]} barSize={16}>
                  {data.map((_: unknown, i: number) => (
                    <Cell key={i} fill={barColors[i]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Detail List */}
        <div className="xl:col-span-3 p-0">
          <ResponsiveTable
            label={t("dash.section.top_products")}
            scrollerClassName="rounded-none border-0 bg-transparent"
            minWidthClassName={TABLE.minWidth.topProducts}
          >
            <table className={TABLE.base} aria-label={t("dash.section.top_products")}>
              <thead className={TABLE.head}>
                <tr>
                  <th className={cn(TABLE.headCell, TABLE.stickyColumn, "bg-slate-50 dark:bg-slate-800/50 py-2.5")}>{t("pred.table.product")}</th>
                  <th className={cn(TABLE.headCellNumeric, "py-2.5")}>{t("dash.top.qty_sold")}</th>
                  <th className={cn(TABLE.headCellNumeric, "py-2.5")}>{t("dash.top.revenue")}</th>
                  <th className={cn(TABLE.headCellNumeric, "py-2.5")}>{t("dash.top.pct")}</th>
                </tr>
              </thead>
              <tbody className={TABLE.body}>
                {data.map((p: typeof data[0], i: number) => (
                  <tr key={p.name} className={cn(TABLE.row, TABLE.rowHover, "group")}>
                    <td className={cn(TABLE.cell, TABLE.stickyColumn, "bg-white py-2.5 dark:bg-slate-900 group-hover:bg-slate-50 dark:group-hover:bg-slate-800/50")}>
                      <div className="flex items-center gap-2">
                        <span className={cn(T.dataSm, R.xs, "size-5 flex items-center justify-center font-semibold text-white shrink-0")} style={{ backgroundColor: barColors[i] }}>
                          {i + 1}
                        </span>
                        <span className={cn(T.bodySm, "font-bold text-slate-900 dark:text-slate-100")}>{p.name}</span>
                      </div>
                    </td>
                    <td className={cn(TABLE.cellNumeric, T.dataSm, "py-2.5 font-bold text-slate-600 dark:text-slate-300")}>{p.qtySold}</td>
                    <td className={cn(TABLE.cellNumeric, T.dataSm, "py-2.5 font-bold text-slate-600 dark:text-slate-300")}>{formatRupiah(p.revenue, { compact: true })}</td>
                    <td className={cn(TABLE.cellNumeric, "py-2.5")}>
                      <div className="flex items-center justify-end gap-1.5">
                        <span className={cn(T.bodySm, "text-slate-900 dark:text-slate-100 font-data")}>{p.pct}%</span>
                        {p.change !== 0 && (
                          <span className={cn(
                            T.caption, "flex items-center",
                            p.change > 0 ? "text-emerald-500" : "text-rose-500"
                          )}>
                            {p.change > 0 ? <ArrowUpRight className="size-3" /> : <ArrowDownRight className="size-3" />}
                            {p.change > 0 ? "+" : ""}{p.change}%
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </ResponsiveTable>
        </div>
      </div>
    </div>
  );
}
