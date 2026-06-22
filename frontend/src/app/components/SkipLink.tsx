"use client";

import { A11Y } from "@/app/lib/a11y";
import { useTranslation } from "@/app/i18n";

/**
 * SkipLink — Keyboard accessibility skip-to-content link.
 * Ref: A11Y.md §4.7, WCAG 2.1 SC 2.4.1
 *
 * Visually hidden by default; becomes visible on keyboard focus.
 * Must be the FIRST focusable element inside the layout wrapper.
 * The target <main> must have id="main-content".
 *
 * @example
 * // In Layout.tsx (first child):
 * <SkipLink />
 * ...
 * <main id="main-content">...</main>
 */
export function SkipLink() {
  const { t } = useTranslation();

  return (
    <a href="#main-content" className={A11Y.skipLink}>
      {t("common.skip_to_content")}
    </a>
  );
}
