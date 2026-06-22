"use client";

import { ReactNode, useId } from "react";
import { cn } from "@/app/lib/utils";
import { FIELD, LABEL, HELPER, ERROR_TEXT } from "@/app/lib/forms";
import { AlertCircle, Info } from "lucide-react";

/**
 * FormField — Standard form field wrapper.
 * Ref: PATTERNS.md §6.4, FORMS.md §2
 *
 * Provides: label (with required/optional indicator) + control slot +
 * helper text + validation error — all wired with correct ARIA ids.
 *
 * The child control must accept an `id` prop (all native inputs + shadcn do).
 * Use the exported `useFormFieldId()` hook or pass `id` manually to wire
 * the control to the label.
 *
 * @example
 * <FormField id="email" label="Email" required helper="Email kantor untuk notifikasi">
 *   <input
 *     id="email"
 *     type="email"
 *     aria-describedby="email-helper"
 *     className={cn(INPUT.base, INPUT.size.md)}
 *   />
 * </FormField>
 *
 * @example
 * // With validation error
 * <FormField id="phone" label="Nomor HP" error={errors.phone?.message}>
 *   <input id="phone" type="tel" aria-describedby="phone-error"
 *     aria-invalid={!!errors.phone} className={...} />
 * </FormField>
 *
 * @example
 * // Optional field
 * <FormField id="notes" label="Catatan" optional>
 *   <textarea id="notes" className={...} />
 * </FormField>
 */

interface FormFieldProps {
  /** ID shared between <label htmlFor> and the control's id. */
  id: string;
  /** Label text. */
  label: string;
  /** Adds red asterisk (* required indicator). */
  required?: boolean;
  /** Adds muted "(opsional)" indicator. */
  optional?: boolean;
  /** Helper / hint text below the control. ID: `{id}-helper`. */
  helper?: string;
  /** Validation error message. Replaces helper when present. ID: `{id}-error`. */
  error?: string;
  /** Dims the label (use when the control is disabled). */
  disabled?: boolean;
  /** The control (input, select, textarea, etc.). */
  children: ReactNode;
  className?: string;
}

export function FormField({
  id,
  label,
  required,
  optional,
  helper,
  error,
  disabled,
  children,
  className,
}: FormFieldProps) {
  const helperId = `${id}-helper`;
  const errorId = `${id}-error`;

  return (
    <div className={cn(FIELD.wrapper, className)}>
      {/* Label */}
      <label
        htmlFor={id}
        className={cn(
          LABEL.base,
          required && LABEL.required,
          optional && LABEL.optional,
          disabled && LABEL.disabled
        )}
      >
        {label}
      </label>

      {/* Control slot */}
      {children}

      {/* Error (priority over helper) */}
      {error ? (
        <p id={errorId} role="alert" className={cn(ERROR_TEXT.base, "flex items-center gap-1")}>
          <AlertCircle className="size-3 shrink-0" aria-hidden="true" />
          {error}
        </p>
      ) : helper ? (
        <p id={helperId} className={cn(HELPER.base, "flex items-center gap-1")}>
          <Info className="size-3 shrink-0 opacity-60" aria-hidden="true" />
          {helper}
        </p>
      ) : null}
    </div>
  );
}

/**
 * Inline variant — for checkbox/radio/switch where label follows the control.
 * Ref: FORMS.md §4 (inline layout)
 *
 * @example
 * <FormFieldInline id="remember" label="Ingat saya">
 *   <input id="remember" type="checkbox" className={CHECKBOX.base} />
 * </FormFieldInline>
 */
interface FormFieldInlineProps {
  id: string;
  label: string;
  disabled?: boolean;
  helper?: string;
  error?: string;
  children: ReactNode;
  className?: string;
}

export function FormFieldInline({
  id,
  label,
  disabled,
  helper,
  error,
  children,
  className,
}: FormFieldInlineProps) {
  const helperId = `${id}-helper`;
  const errorId = `${id}-error`;

  return (
    <div className={cn("space-y-1", className)}>
      <div className={FIELD.inline}>
        {children}
        <label
          htmlFor={id}
          className={cn(LABEL.base, "!block-inline", disabled && LABEL.disabled)}
        >
          {label}
        </label>
      </div>
      {error ? (
        <p id={errorId} role="alert" className={cn(ERROR_TEXT.base, "flex items-center gap-1 pl-5")}>
          <AlertCircle className="size-3 shrink-0" aria-hidden="true" />
          {error}
        </p>
      ) : helper ? (
        <p id={helperId} className={cn(HELPER.base, "pl-5")}>
          {helper}
        </p>
      ) : null}
    </div>
  );
}
