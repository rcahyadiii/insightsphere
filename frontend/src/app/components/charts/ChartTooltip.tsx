"use client";

import { ReactNode } from "react";
import { cn } from "@/app/lib/utils";
import { CHART_TOOLTIP } from "@/app/lib/charts";

/**
 * ChartTooltip — Standardized Recharts custom tooltip component.
 * Ref: CHARTS.md §6.4
 *
 * Usage with Recharts <Tooltip>:
 *   <Tooltip
 *     content={<ChartTooltip />}
 *     cursor={{ fill: CHART_COLORS.cursor.bar }}
 *   />
 *
 * With custom formatter:
 *   <Tooltip
 *     content={
 *       <ChartTooltip
 *         formatter={(value) => formatRupiah(Number(value), { compact: true })}
 *       />
 *     }
 *   />
 *
 * With footer:
 *   <Tooltip
 *     content={
 *       <ChartTooltip
 *         footer={<span className={CHART_TOOLTIP.footerSuccess}>+12% vs bulan lalu</span>}
 *       />
 *     }
 *   />
 */

interface TooltipPayloadEntry {
  name: string;
  value: number | string;
  color: string;
  dataKey: string;
}

interface ChartTooltipProps {
  active?: boolean;
  payload?: TooltipPayloadEntry[];
  label?: string | number;
  /** Override value display. Return a formatted string. */
  formatter?: (value: number | string, name: string) => string;
  /** Override label display. */
  labelFormatter?: (label: string | number) => string;
  /** Optional footer content (delta, trend, note). */
  footer?: ReactNode;
  className?: string;
}

export function ChartTooltip({
  active,
  payload,
  label,
  formatter,
  labelFormatter,
  footer,
  className,
}: ChartTooltipProps) {
  if (!active || !payload?.length) return null;

  const displayLabel = label !== undefined
    ? (labelFormatter ? labelFormatter(label) : String(label))
    : null;

  return (
    <div className={cn(CHART_TOOLTIP.wrapper, className)}>
      {displayLabel && (
        <p className={CHART_TOOLTIP.label}>{displayLabel}</p>
      )}

      <div className="space-y-1.5">
        {payload.map((entry, i) => (
          <div key={i} className={CHART_TOOLTIP.row}>
            <div className="flex items-center gap-1.5 min-w-0">
              <span
                className={CHART_TOOLTIP.dot}
                style={{ backgroundColor: entry.color }}
                aria-hidden="true"
              />
              <span className={cn(CHART_TOOLTIP.name, "truncate")}>
                {entry.name}
              </span>
            </div>
            <span className={CHART_TOOLTIP.value}>
              {formatter
                ? formatter(entry.value, entry.name)
                : entry.value}
            </span>
          </div>
        ))}
      </div>

      {footer && (
        <div className={CHART_TOOLTIP.footer}>{footer}</div>
      )}
    </div>
  );
}
