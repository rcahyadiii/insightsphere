"use client";

import { ElementType, ReactNode } from "react";
import { cn } from "@/app/lib/utils";
import { A11Y } from "@/app/lib/a11y";

/**
 * VisuallyHidden — Renders content visible only to screen readers.
 * Ref: A11Y.md §16
 *
 * Uses `sr-only` Tailwind utility (clip + 1px box). Content is in the
 * accessibility tree but invisible to sighted users.
 *
 * Common usage:
 * - Icon-only button labels
 * - Supplementary context for screen readers
 * - Hidden headings for landmark navigation
 *
 * @example
 * <button onClick={handleDelete}>
 *   <Trash2 aria-hidden="true" />
 *   <VisuallyHidden>Hapus produk {name}</VisuallyHidden>
 * </button>
 *
 * @example
 * <VisuallyHidden as="h2">Daftar produk ({count} item)</VisuallyHidden>
 * <ul>...</ul>
 */

interface VisuallyHiddenProps {
  children: ReactNode;
  /** HTML element to render. Defaults to "span". */
  as?: ElementType;
  className?: string;
}

export function VisuallyHidden({
  children,
  as: Tag = "span",
  className,
}: VisuallyHiddenProps) {
  return (
    <Tag className={cn(A11Y.srOnly, className)}>
      {children}
    </Tag>
  );
}
