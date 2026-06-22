"use client";

import { ReactNode } from "react";
import { cn } from "@/app/lib/utils";
import { LIVE_REGION } from "@/app/lib/a11y";

/**
 * LiveRegion — ARIA live region for screen reader announcements.
 * Ref: A11Y.md §16, WCAG 2.1 SC 4.1.3
 *
 * Renders an invisible (sr-only) container that announces content changes
 * to screen readers without interrupting user flow.
 *
 * Variants:
 * - "polite"    — waits for user to finish before announcing (default)
 *                 Use for: success messages, data updated, counts changed
 * - "assertive" — interrupts immediately
 *                 Use for: critical errors, session expiring, destructive confirmations
 *
 * @example
 * // Polite: announce when search results change
 * <LiveRegion>
 *   {results.length > 0
 *     ? `${results.length} produk ditemukan`
 *     : "Tidak ada produk ditemukan"}
 * </LiveRegion>
 *
 * @example
 * // Assertive: announce critical error
 * <LiveRegion variant="assertive">
 *   {errorMsg}
 * </LiveRegion>
 *
 * @example
 * // Visible live region (status bar, not sr-only)
 * <LiveRegion visuallyHidden={false} className="text-sm text-slate-500">
 *   {statusText}
 * </LiveRegion>
 */

interface LiveRegionProps {
  children: ReactNode;
  /** Urgency level. Defaults to "polite". */
  variant?: "polite" | "assertive";
  /** Hide visually (sr-only). Set false to render as visible element. Defaults to true. */
  visuallyHidden?: boolean;
  className?: string;
}

export function LiveRegion({
  children,
  variant = "polite",
  visuallyHidden = true,
  className,
}: LiveRegionProps) {
  const liveProps = LIVE_REGION[variant];

  return (
    <div
      {...liveProps}
      className={cn(visuallyHidden ? "sr-only" : undefined, className)}
    >
      {children}
    </div>
  );
}
