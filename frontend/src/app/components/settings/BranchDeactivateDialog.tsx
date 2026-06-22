"use client";

import { useRef } from "react";
import { AlertTriangle, Loader2, X } from "lucide-react";
import { useModalA11y } from "@/app/hooks/useModalA11y";
import { btn } from "@/app/lib/buttons";
import { MODAL } from "@/app/lib/containers";
import { ERROR_TEXT } from "@/app/lib/forms";
import { ICON } from "@/app/lib/spacing";
import { T } from "@/app/lib/typography";
import { cn } from "@/app/lib/utils";
import type { BranchResponse } from "@/app/lib/branch-client";

type Props = {
  branch: BranchResponse | null;
  isSubmitting: boolean;
  error: string | null;
  t: (key: string, params?: Record<string, string | number>) => string;
  onCancel: () => void;
  onConfirm: () => Promise<void>;
};

export function BranchDeactivateDialog({ branch, isSubmitting, error, t, onCancel, onConfirm }: Props) {
  const modalRef = useRef<HTMLDivElement>(null);
  const isOpen = branch !== null;
  useModalA11y({ isOpen, onClose: onCancel, containerRef: modalRef });

  if (!branch) return null;

  return (
    <div
      className={cn(MODAL.backdrop, MODAL.wrapper)}
      onMouseDown={(event) => {
        if (event.currentTarget === event.target) onCancel();
      }}
    >
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="branch-deactivate-title"
        tabIndex={-1}
        className={cn(MODAL.container, MODAL.size.md)}
      >
        <header className={MODAL.header}>
          <AlertTriangle className={cn(ICON.sm, "text-amber-500")} />
          <div className="min-w-0 flex-1">
            <h4 id="branch-deactivate-title" className={cn(T.h4, "text-slate-900 dark:text-slate-100")}>
              {t("set.store.branches.deactivate_confirm_title")}
            </h4>
            <p className={cn(T.caption, "text-slate-500 dark:text-slate-400")}>
              {branch.branch_code} - {branch.name}
            </p>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className={MODAL.close}
            aria-label={t("set.store.branches.close")}
            disabled={isSubmitting}
          >
            <X className={ICON.sm} />
          </button>
        </header>

        <main className={cn(MODAL.body, "space-y-4")}>
          <p className={cn(T.bodySm, "text-slate-600 dark:text-slate-300")}>
            {t("set.store.branches.deactivate_confirm_body")}
          </p>
          {error && (
            <p role="alert" className={ERROR_TEXT.base}>
              {error}
            </p>
          )}
        </main>

        <footer className={MODAL.footer}>
          <button type="button" onClick={onCancel} className={btn("outline", "md")} disabled={isSubmitting}>
            {t("set.store.branches.cancel")}
          </button>
          <button
            type="button"
            onClick={() => void onConfirm()}
            className={btn("destructive", "md")}
            disabled={isSubmitting}
            aria-busy={isSubmitting}
          >
            {isSubmitting && <Loader2 className="animate-spin" />}
            {t("set.store.branches.deactivate")}
          </button>
        </footer>
      </div>
    </div>
  );
}
