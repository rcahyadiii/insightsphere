"use client";

import Link from "next/link";
import { MapPin, Home } from "lucide-react";
import { cn } from "@/app/lib/utils";
import { T } from "@/app/lib/typography";
import { btn } from "@/app/lib/buttons";
import { R } from "@/app/lib/radii";
import { E } from "@/app/lib/elevation";
import { C } from "@/app/lib/colors";
import { useTranslation } from "@/app/i18n";

export default function NotFound() {
  const { t } = useTranslation();
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
        {/* Decorative background blur */}
        <div
          className="absolute top-0 right-0 w-48 h-48 bg-indigo-500/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"
          aria-hidden="true"
        />

        {/* Large 404 numeral */}
        <p
          className="text-9xl font-bold text-slate-100 dark:text-slate-800 leading-none select-none mb-4"
          aria-hidden="true"
        >
          404
        </p>

        {/* Icon */}
        <div
          className={cn(
            "w-16 h-16 mx-auto mb-6 flex items-center justify-center",
            R.lg,
            "bg-indigo-50 dark:bg-indigo-900/20",
            "border border-indigo-100 dark:border-indigo-800/30"
          )}
        >
          <MapPin className="size-8 text-indigo-500" aria-hidden="true" />
        </div>

        <h1 className={cn(T.h2, "text-slate-900 dark:text-slate-100 mb-3")}>
          {t("err.not_found.title")}
        </h1>
        <p className={cn(T.body, "text-slate-500 dark:text-slate-400 mb-8 leading-relaxed")}>
          {t("err.not_found.desc")}
        </p>

        <Link
          href="/"
          className={cn(btn("primary", "md"), "inline-flex items-center gap-2")}
        >
          <Home className="size-4" aria-hidden="true" />
          {t("err.not_found.cta")}
        </Link>

        {/* Footer status bar */}
        <div
          className={cn(
            "mt-10 pt-6 border-t flex items-center justify-center gap-2",
            C.neutral.border
          )}
        >
          <span
            className="size-2 rounded-full bg-emerald-500 animate-pulse"
            aria-hidden="true"
          />
          <p className={cn(T.caption, "text-slate-400 dark:text-slate-600")}>
            {t("err.not_found.footer")}
          </p>
        </div>
      </div>
    </div>
  );
}
