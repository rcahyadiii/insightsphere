"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ShieldOff, Home, ArrowLeft } from "lucide-react";
import { useTranslation } from "@/app/i18n";
import { cn } from "@/app/lib/utils";
import { T } from "@/app/lib/typography";
import { btn } from "@/app/lib/buttons";
import { R } from "@/app/lib/radii";
import { E } from "@/app/lib/elevation";
import { C } from "@/app/lib/colors";

/**
 * Forbidden — 403 Access Denied page.
 * Ref: PATTERNS.md §9.2
 *
 * Rendered by Next.js App Router when a page throws a forbidden() error,
 * or used directly by RouteGuard for role-based access control.
 */
export default function Forbidden() {
  const { t } = useTranslation();
  const router = useRouter();
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 p-8">
      <div
        className={cn(
          "max-w-md w-full text-center relative overflow-hidden",
          "bg-white dark:bg-slate-900",
          R.xl,
          E.sm,
          C.neutral.border,
          "border p-12"
        )}
      >
        {/* 403 numeral */}
        <p
          className={cn(
            T.kpiHero,
            "text-8xl leading-none mb-2",
            C.destructive.text,
            "opacity-20"
          )}
          aria-hidden="true"
        >
          403
        </p>

        {/* Icon */}
        <div
          className={cn(
            "mx-auto w-16 h-16 flex items-center justify-center mb-6",
            C.destructive.bg,
            R.xl
          )}
        >
          <ShieldOff
            className={cn("size-8", C.destructive.icon)}
            aria-hidden="true"
          />
        </div>

        {/* Heading */}
        <h1 className={cn(T.h2, "text-slate-900 dark:text-slate-100 mb-3")}>
          {t("err.forbidden.title")}
        </h1>

        {/* Description */}
        <p className={cn(T.body, "text-slate-500 dark:text-slate-400 mb-8 leading-relaxed")}>
          {t("err.forbidden.desc")}
        </p>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={() => router.back()}
            className={cn(
              btn("neutral", "md"),
              "inline-flex items-center justify-center gap-2"
            )}
          >
            <ArrowLeft className="size-4" aria-hidden="true" />
            {t("err.forbidden.back")}
          </button>
          <Link
            href="/"
            className={cn(
              btn("primary", "md"),
              "inline-flex items-center justify-center gap-2"
            )}
          >
            <Home className="size-4" aria-hidden="true" />
            {t("err.forbidden.home")}
          </Link>
        </div>

        {/* Footer hint */}
        <p className={cn(T.caption, "text-slate-400 dark:text-slate-600 mt-8")}>
          {t("err.forbidden.footer")}
        </p>
      </div>
    </div>
  );
}
