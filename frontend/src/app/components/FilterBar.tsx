"use client";

import { ReactNode } from "react";
import { Search } from "lucide-react";
import { cn } from "@/app/lib/utils";
import { GAP, ICON, PAD } from "@/app/lib/spacing";
import { INPUT } from "@/app/lib/forms";
import { A11Y } from "@/app/lib/a11y";
import { R } from "@/app/lib/radii";
import { C } from "@/app/lib/colors";
import { E } from "@/app/lib/elevation";

interface FilterBarProps {
  /** Controlled search value. Omit to hide the search input. */
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  searchPlaceholder?: string;
  /** Filter selects / dropdowns — rendered to the right of search. */
  filters?: ReactNode;
  /** Action buttons — pinned to the far right (e.g. "Tambah"). */
  actions?: ReactNode;
  className?: string;
}

/**
 * FilterBar — standard page-level filter + search + action bar.
 * Ref: PATTERNS.md §4.4
 *
 * Anatomy:
 *   [Search input] [filter slots...] ... [action buttons]
 *
 * @example
 * <FilterBar
 *   searchValue={query}
 *   onSearchChange={setQuery}
 *   searchPlaceholder="Cari nama atau email..."
 *   filters={
 *     <select value={role} onChange={...}>...</select>
 *   }
 *   actions={<Button onClick={openModal}>Tambah</Button>}
 * />
 */
export function FilterBar({
  searchValue,
  onSearchChange,
  searchPlaceholder = "Cari...",
  filters,
  actions,
  className,
}: FilterBarProps) {
  return (
    <div
      className={cn(
        "bg-white dark:bg-slate-800",
        R.lg,
        E.xs,
        "border",
        C.neutral.border,
        "px-4 py-3",
        className
      )}
    >
      <div
        className={cn(
          "flex flex-col md:flex-row md:items-center",
          GAP.default
        )}
      >
        {/* Search input */}
        {onSearchChange !== undefined && (
          <div className="flex-1 relative">
            <Search
              className={cn(
                "absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none",
                ICON.md,
                "text-slate-400"
              )}
              aria-hidden="true"
            />
            <input
              type="search"
              value={searchValue ?? ""}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder={searchPlaceholder}
              className={cn(
                INPUT.base,
                PAD.inputMd,
                "pl-9 w-full",
                A11Y.focusRing.default
              )}
              aria-label={searchPlaceholder}
            />
          </div>
        )}

        {/* Filter slots */}
        {filters && (
          <div className="flex items-center flex-wrap gap-2">{filters}</div>
        )}

        {/* Right-pinned actions */}
        {actions && (
          <div className="flex items-center gap-2 md:ml-auto shrink-0">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
}
