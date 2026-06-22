"use client";

/**
 * EmptyState — Shared empty state component.
 * Spec: Design System/EMPTY_STATES.md
 * Tokens: frontend/src/app/lib/feedback.ts → EMPTY.*
 *
 * Usage:
 *   <EmptyState icon={Package} title="..." description="..." action={<Button />} />
 */

import { LucideIcon, SearchX } from "lucide-react";
import { cn } from "@/app/lib/utils";

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description: string;
  action?: React.ReactNode;
  className?: string;
  /** Sizing per placement: `sm` (table row) | `md` (card) | `lg` (page, default). */
  size?: "sm" | "md" | "lg";
}

const SIZE_MAP = {
  sm: { wrapper: "p-6", icon: "w-12 h-12", inner: "w-6 h-6", title: "text-base", mb: "mb-4" },
  md: { wrapper: "p-8", icon: "w-14 h-14", inner: "w-7 h-7", title: "text-base", mb: "mb-5" },
  lg: { wrapper: "p-12", icon: "w-16 h-16", inner: "w-8 h-8", title: "text-lg", mb: "mb-6" },
} as const;

export function EmptyState({
  icon: Icon = SearchX,
  title,
  description,
  action,
  className,
  size = "lg",
}: EmptyStateProps) {
  const s = SIZE_MAP[size];

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center",
        "animate-in fade-in zoom-in duration-300",
        s.wrapper,
        className
      )}
    >
      <div
        className={cn(
          s.icon,
          s.mb,
          "rounded-2xl flex items-center justify-center group transition-colors",
          "bg-slate-100 dark:bg-slate-800",
          "text-slate-400 dark:text-slate-500"
        )}
      >
        <Icon className={cn(s.inner, "group-hover:scale-110 transition-transform duration-300")} />
      </div>
      <h3
        className={cn(
          s.title,
          "font-bold mb-2",
          "text-slate-900 dark:text-slate-100"
        )}
      >
        {title}
      </h3>
      <p
        className={cn(
          "text-sm max-w-[280px] leading-relaxed mb-8",
          "text-slate-500 dark:text-slate-400"
        )}
      >
        {description}
      </p>
      {action && (
        <div className="flex items-center justify-center gap-3">
          {action}
        </div>
      )}
    </div>
  );
}
