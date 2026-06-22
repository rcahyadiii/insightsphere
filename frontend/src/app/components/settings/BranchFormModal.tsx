"use client";

import { useRef, useState, type FormEvent } from "react";
import { Loader2, Store, X } from "lucide-react";
import { useModalA11y } from "@/app/hooks/useModalA11y";
import { btn } from "@/app/lib/buttons";
import { MODAL } from "@/app/lib/containers";
import { ERROR_TEXT, FIELD, INPUT, LABEL, TEXTAREA } from "@/app/lib/forms";
import { ICON } from "@/app/lib/spacing";
import { T } from "@/app/lib/typography";
import { cn } from "@/app/lib/utils";
import type { BranchCreateRequest, BranchResponse } from "@/app/lib/branch-client";

type BranchFormValues = BranchCreateRequest;

type BranchFormErrors = Partial<Record<keyof BranchFormValues | "form", string>>;

type Props = {
  branch: BranchResponse | null;
  isOpen: boolean;
  isSubmitting: boolean;
  error: string | null;
  t: (key: string, params?: Record<string, string | number>) => string;
  onClose: () => void;
  onSubmit: (values: BranchFormValues) => Promise<void>;
};

const EMPTY_FORM: BranchFormValues = {
  store_nbr: 0,
  branch_code: "",
  name: "",
  address: "",
  phone: null,
  email: null,
  opening_time: null,
  closing_time: null,
};

function toInputTime(value: string | null | undefined): string {
  if (!value) return "";
  return value.slice(0, 5);
}

function toApiTime(value: string | null | undefined): string | null {
  const trimmed = value?.trim();
  if (!trimmed) return null;
  return trimmed.length === 5 ? `${trimmed}:00` : trimmed;
}

function branchToFormValues(branch: BranchResponse | null): BranchFormValues {
  if (!branch) return EMPTY_FORM;
  return {
    store_nbr: branch.store_nbr,
    branch_code: branch.branch_code,
    name: branch.name,
    address: branch.address,
    phone: branch.phone,
    email: branch.email,
    opening_time: toInputTime(branch.opening_time),
    closing_time: toInputTime(branch.closing_time),
  };
}

export function BranchFormModal({
  branch,
  isOpen,
  isSubmitting,
  error,
  t,
  onClose,
  onSubmit,
}: Props) {
  const modalRef = useRef<HTMLDivElement>(null);
  const [values, setValues] = useState<BranchFormValues>(() => branchToFormValues(branch));
  const [errors, setErrors] = useState<BranchFormErrors>({});

  useModalA11y({ isOpen, onClose, containerRef: modalRef });

  if (!isOpen) return null;

  const setField = <K extends keyof BranchFormValues>(key: K, value: BranchFormValues[K]) => {
    setValues((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: undefined, form: undefined }));
  };

  const validate = (): BranchFormErrors => {
    const next: BranchFormErrors = {};
    if (!values.store_nbr || values.store_nbr < 1) {
      next.store_nbr = t("set.store.branches.error_store_nbr");
    }
    if (!values.branch_code.trim()) {
      next.branch_code = t("set.store.branches.error_code");
    }
    if (!values.name.trim()) {
      next.name = t("set.store.branches.error_name");
    }
    if (!values.address.trim()) {
      next.address = t("set.store.branches.error_address");
    }
    if (values.opening_time && values.closing_time && values.opening_time === values.closing_time) {
      next.closing_time = t("set.store.branches.error_hours");
    }
    return next;
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextErrors = validate();
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    await onSubmit({
      store_nbr: Number(values.store_nbr),
      branch_code: values.branch_code.trim(),
      name: values.name.trim(),
      address: values.address.trim(),
      phone: values.phone?.trim() || null,
      email: values.email?.trim() || null,
      opening_time: toApiTime(values.opening_time),
      closing_time: toApiTime(values.closing_time),
    });
  };

  const title = branch ? t("set.store.branches.edit_title") : t("set.store.branches.add_title");

  return (
    <div
      className={cn(MODAL.backdrop, MODAL.wrapper)}
      onMouseDown={(event) => {
        if (event.currentTarget === event.target) onClose();
      }}
    >
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="branch-form-title"
        tabIndex={-1}
        className={cn(MODAL.container, MODAL.size.lg, MODAL.maxHeight.lg, "flex flex-col")}
      >
        <header className={MODAL.header}>
          <Store className={cn(ICON.sm, "text-indigo-500")} />
          <div className="min-w-0 flex-1">
            <h4 id="branch-form-title" className={cn(T.h4, "text-slate-900 dark:text-slate-100")}>
              {title}
            </h4>
            <p className={cn(T.caption, "text-slate-500 dark:text-slate-400")}>
              {t("set.store.branches.form_desc")}
            </p>
          </div>
          <button type="button" onClick={onClose} className={MODAL.close} aria-label={t("set.store.branches.close")}>
            <X className={ICON.sm} />
          </button>
        </header>

        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
          <main className={cn(MODAL.bodyScroll, "space-y-5")}>
            {(error || errors.form) && (
              <p role="alert" className={ERROR_TEXT.base}>
                {error ?? errors.form}
              </p>
            )}

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className={FIELD.wrapper}>
                <label htmlFor="branch-store-nbr" className={cn(LABEL.base, LABEL.required)}>
                  {t("set.store.branches.store_nbr")}
                </label>
                <input
                  id="branch-store-nbr"
                  type="number"
                  min={1}
                  className={cn(INPUT.base, INPUT.size.md, errors.store_nbr && INPUT.error)}
                  value={values.store_nbr || ""}
                  onChange={(event) => setField("store_nbr", Number(event.target.value))}
                  disabled={isSubmitting}
                />
                {errors.store_nbr && (
                  <p role="alert" className={ERROR_TEXT.base}>
                    {errors.store_nbr}
                  </p>
                )}
              </div>

              <div className={FIELD.wrapper}>
                <label htmlFor="branch-code" className={cn(LABEL.base, LABEL.required)}>
                  {t("set.store.branches.code")}
                </label>
                <input
                  id="branch-code"
                  className={cn(INPUT.base, INPUT.size.md, errors.branch_code && INPUT.error)}
                  value={values.branch_code}
                  onChange={(event) => setField("branch_code", event.target.value)}
                  disabled={isSubmitting}
                  placeholder="JKT-PST-01"
                />
                {errors.branch_code && (
                  <p role="alert" className={ERROR_TEXT.base}>
                    {errors.branch_code}
                  </p>
                )}
              </div>
            </div>

            <div className={FIELD.wrapper}>
              <label htmlFor="branch-name" className={cn(LABEL.base, LABEL.required)}>
                {t("set.store.branches.name")}
              </label>
              <input
                id="branch-name"
                className={cn(INPUT.base, INPUT.size.md, errors.name && INPUT.error)}
                value={values.name}
                onChange={(event) => setField("name", event.target.value)}
                disabled={isSubmitting}
              />
              {errors.name && (
                <p role="alert" className={ERROR_TEXT.base}>
                  {errors.name}
                </p>
              )}
            </div>

            <div className={FIELD.wrapper}>
              <label htmlFor="branch-address" className={cn(LABEL.base, LABEL.required)}>
                {t("set.store.branches.address")}
              </label>
              <textarea
                id="branch-address"
                rows={3}
                className={cn(TEXTAREA.base, TEXTAREA.size.md, errors.address && INPUT.error)}
                value={values.address}
                onChange={(event) => setField("address", event.target.value)}
                disabled={isSubmitting}
              />
              {errors.address && (
                <p role="alert" className={ERROR_TEXT.base}>
                  {errors.address}
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className={FIELD.wrapper}>
                <label htmlFor="branch-phone" className={LABEL.base}>
                  {t("set.store.branches.phone")}
                </label>
                <input
                  id="branch-phone"
                  type="tel"
                  className={cn(INPUT.base, INPUT.size.md)}
                  value={values.phone ?? ""}
                  onChange={(event) => setField("phone", event.target.value)}
                  disabled={isSubmitting}
                />
              </div>

              <div className={FIELD.wrapper}>
                <label htmlFor="branch-email" className={LABEL.base}>
                  {t("set.store.branches.email")}
                </label>
                <input
                  id="branch-email"
                  type="email"
                  className={cn(INPUT.base, INPUT.size.md)}
                  value={values.email ?? ""}
                  onChange={(event) => setField("email", event.target.value)}
                  disabled={isSubmitting}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className={FIELD.wrapper}>
                <label htmlFor="branch-opening-time" className={LABEL.base}>
                  {t("set.store.branches.opening_time")}
                </label>
                <input
                  id="branch-opening-time"
                  type="time"
                  className={cn(INPUT.base, INPUT.size.md)}
                  value={values.opening_time ?? ""}
                  onChange={(event) => setField("opening_time", event.target.value)}
                  disabled={isSubmitting}
                />
              </div>

              <div className={FIELD.wrapper}>
                <label htmlFor="branch-closing-time" className={LABEL.base}>
                  {t("set.store.branches.closing_time")}
                </label>
                <input
                  id="branch-closing-time"
                  type="time"
                  className={cn(INPUT.base, INPUT.size.md, errors.closing_time && INPUT.error)}
                  value={values.closing_time ?? ""}
                  onChange={(event) => setField("closing_time", event.target.value)}
                  disabled={isSubmitting}
                />
                {errors.closing_time && (
                  <p role="alert" className={ERROR_TEXT.base}>
                    {errors.closing_time}
                  </p>
                )}
              </div>
            </div>
          </main>

          <footer className={MODAL.footer}>
            <button type="button" onClick={onClose} className={btn("outline", "md")} disabled={isSubmitting}>
              {t("set.store.branches.cancel")}
            </button>
            <button type="submit" className={btn("primary", "md")} disabled={isSubmitting} aria-busy={isSubmitting}>
              {isSubmitting && <Loader2 className="animate-spin" />}
              {branch ? t("set.store.branches.save") : t("set.store.branches.create")}
            </button>
          </footer>
        </form>
      </div>
    </div>
  );
}
