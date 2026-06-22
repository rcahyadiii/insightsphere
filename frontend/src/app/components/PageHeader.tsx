"use client";

import { ReactNode } from "react";
import { cn } from "@/app/lib/utils";
import { T } from "@/app/lib/typography";
import { GAP } from "@/app/lib/spacing";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  className?: string;
}

/**
 * PageHeader — standard top-of-page header.
 * Ref: BREADCRUMBS.md §9.3, PATTERNS.md §2
 *
 * Layout: left = title + optional subtitle | right = optional action buttons.
 * Responds to md breakpoint (stacks on mobile, row on desktop).
 *
 * @example
 * <PageHeader
 *   title="Manajemen Pengguna"
 *   subtitle="Kelola akun, peran, dan akses pengguna"
 *   actions={<Button>Tambah Pengguna</Button>}
 * />
 */
export function PageHeader({ title, subtitle, actions, className }: PageHeaderProps) {
  return (
    <div
      className={cn(
        "flex flex-col md:flex-row md:items-center md:justify-between",
        GAP.default,
        className
      )}
    >
      <div>
        <h1 className={cn(T.h1, "text-slate-900 dark:text-slate-100")}>
          {title}
        </h1>
        {subtitle && (
          <p className={cn(T.body, "text-slate-500 dark:text-slate-400 mt-0.5")}>
            {subtitle}
          </p>
        )}
      </div>

      {actions && (
        <div className="flex items-center gap-2 shrink-0">{actions}</div>
      )}
    </div>
  );
}
