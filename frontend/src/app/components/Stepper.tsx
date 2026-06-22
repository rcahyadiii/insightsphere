"use client";

import { Check } from "lucide-react";
import { cn } from "@/app/lib/utils";
import { T } from "@/app/lib/typography";
import { STEPPER, type StepperState, type StepperSize } from "@/app/lib/nav";
import { useTranslation } from "@/app/i18n";

/**
 * Stepper — Multi-step progress indicator.
 * Ref: TABS.md §3, NAVIGATION.md §4
 *
 * Supports horizontal (default) and vertical orientation.
 * Completed steps show a checkmark; active step has ring highlight.
 *
 * @example
 * // Horizontal (3-step wizard)
 * <Stepper
 *   steps={[
 *     { label: "Informasi Produk" },
 *     { label: "Harga & Stok" },
 *     { label: "Konfirmasi" },
 *   ]}
 *   currentStep={1}
 * />
 *
 * @example
 * // Vertical with descriptions
 * <Stepper
 *   orientation="vertical"
 *   steps={[
 *     { label: "Buat Pesanan", description: "Pilih produk dan jumlah" },
 *     { label: "Pembayaran", description: "Pilih metode pembayaran" },
 *     { label: "Selesai", description: "Pesanan dikonfirmasi" },
 *   ]}
 *   currentStep={0}
 *   size="lg"
 * />
 */

interface Step {
  label: string;
  description?: string;
}

interface StepperProps {
  steps: Step[];
  /** 0-indexed current active step. */
  currentStep: number;
  orientation?: "horizontal" | "vertical";
  size?: StepperSize;
  className?: string;
}

function getState(index: number, currentStep: number): StepperState {
  if (index < currentStep) return "completed";
  if (index === currentStep) return "active";
  return "upcoming";
}

export function Stepper({
  steps,
  currentStep,
  orientation = "horizontal",
  size = "md",
  className,
}: StepperProps) {
  const { t } = useTranslation();
  const isVertical = orientation === "vertical";
  const sizeTokens = STEPPER.size[size];

  return (
    <nav
      aria-label={t("common.progress")}
      className={cn(
        isVertical ? STEPPER.wrapperVertical : STEPPER.wrapperHorizontal,
        className
      )}
    >
      <ol
        className={cn(
          isVertical ? "flex flex-col gap-0" : "flex items-center w-full"
        )}
      >
        {steps.map((step, index) => {
          const state = getState(index, currentStep);
          const isLast = index === steps.length - 1;

          return (
            <li
              key={index}
              className={cn(
                isVertical ? STEPPER.stepVertical : STEPPER.stepHorizontal,
                !isVertical && !isLast && "flex-1"
              )}
            >
              {isVertical ? (
                <VerticalStep
                  step={step}
                  index={index}
                  state={state}
                  isLast={isLast}
                  sizeTokens={sizeTokens}
                />
              ) : (
                <HorizontalStep
                  step={step}
                  index={index}
                  state={state}
                  isLast={isLast}
                  sizeTokens={sizeTokens}
                  totalSteps={steps.length}
                />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

/* ── Sub-components ─────────────────────────────────────────────────────── */

interface StepSubProps {
  step: Step;
  index: number;
  state: StepperState;
  isLast: boolean;
  sizeTokens: { circle: string; label: string };
  totalSteps?: number;
}

function HorizontalStep({ step, index, state, isLast, sizeTokens }: StepSubProps) {
  return (
    <div className="flex items-center w-full">
      <div className={STEPPER.stepHorizontal}>
        <StepCircle index={index} state={state} sizeTokens={sizeTokens} />
        <span
          className={cn(
            STEPPER.label.base,
            sizeTokens.label,
            STEPPER.label[state]
          )}
          aria-current={state === "active" ? "step" : undefined}
        >
          {step.label}
        </span>
      </div>

      {!isLast && (
        <div
          className={cn(
            STEPPER.connector.base,
            "mx-2 mb-5",
            state === "completed" ? STEPPER.connector.done : STEPPER.connector.todo
          )}
          aria-hidden="true"
        />
      )}
    </div>
  );
}

function VerticalStep({ step, index, state, isLast, sizeTokens }: StepSubProps) {
  return (
    <div className="flex gap-4">
      {/* Left: circle + vertical connector */}
      <div className="flex flex-col items-center">
        <StepCircle index={index} state={state} sizeTokens={sizeTokens} />
        {!isLast && (
          <div
            className={cn(
              STEPPER.connector.vertical,
              state === "completed" ? STEPPER.connector.done : STEPPER.connector.todo
            )}
            aria-hidden="true"
          />
        )}
      </div>

      {/* Right: label + description */}
      <div className={cn("pb-8", isLast && "pb-0")}>
        <span
          className={cn(
            STEPPER.label.base,
            sizeTokens.label,
            STEPPER.label[state],
            "mt-1 block"
          )}
          aria-current={state === "active" ? "step" : undefined}
        >
          {step.label}
        </span>
        {step.description && (
          <p className={cn(T.bodySm, "font-medium text-slate-500 dark:text-slate-400 mt-0.5")}>
            {step.description}
          </p>
        )}
      </div>
    </div>
  );
}

interface StepCircleProps {
  index: number;
  state: StepperState;
  sizeTokens: { circle: string; label: string };
}

function StepCircle({ index, state, sizeTokens }: StepCircleProps) {
  return (
    <div
      className={cn(
        STEPPER.circle.base,
        sizeTokens.circle,
        STEPPER.circle[state]
      )}
      aria-hidden="true"
    >
      {state === "completed" ? (
        <Check className="size-4" strokeWidth={3} />
      ) : (
        <span className="tabular-nums">{index + 1}</span>
      )}
    </div>
  );
}
