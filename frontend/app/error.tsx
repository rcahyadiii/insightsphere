"use client";

import { useEffect } from "react";
import Link from "next/link";
import { ShieldAlert, RefreshCcw, Home } from "lucide-react";
import { useTranslation } from "@/app/i18n";
import { cn } from "@/app/lib/utils";
import { T } from "@/app/lib/typography";
import { btn } from "@/app/lib/buttons";
import { R } from "@/app/lib/radii";
import { E } from "@/app/lib/elevation";
import { C } from "@/app/lib/colors";

interface ErrorPageProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ErrorPage({ error, reset }: ErrorPageProps) {
  const { t } = useTranslation();
  useEffect(() => {
    console.error("[ErrorPage]", error);
  }, [error]);

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
        {/* Decorative blurs */}
        <div
          className="absolute top-0 right-0 w-48 h-48 bg-rose-500/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"
          aria-hidden="true"
        />
        <div
          className="absolute bottom-0 left-0 w-48 h-48 bg-indigo-500/5 rounded-full blur-3xl -ml-16 -mb-16 pointer-events-none"
          aria-hidden="true"
        />

        {/* Icon */}
        <div
          className={cn(
            "w-16 h-16 mx-auto mb-6 flex items-center justify-center relative",
            R.lg,
            "bg-rose-50 dark:bg-rose-900/20",
            "border border-rose-100 dark:border-rose-800/30"
          )}
        >
          <ShieldAlert className="size-8 text-rose-500" aria-hidden="true" />
        </div>

        <h1 className={cn(T.h2, "text-slate-900 dark:text-slate-100 mb-3")}>
          {t("err.error.title")}
        </h1>
        <p className={cn(T.body, "text-slate-500 dark:text-slate-400 mb-2 leading-relaxed")}>
          {t("err.error.desc")}
        </p>

        {error.digest && (
          <p className={cn(T.caption, "text-slate-400 dark:text-slate-500 mb-6 font-data")}>
            {t("err.error.id")} {error.digest}
          </p>
        )}

        <div className="flex flex-col sm:flex-row gap-3 mt-6 relative">
          <button
            onClick={reset}
            className={cn(
              btn("primary", "md"),
              "flex-1 inline-flex items-center justify-center gap-2"
            )}
          >
            <RefreshCcw className="size-4" aria-hidden="true" />
            {t("err.error.retry")}
          </button>
          <Link
            href="/"
            className={cn(
              btn("neutral", "md"),
              "flex-1 inline-flex items-center justify-center gap-2"
            )}
          >
            <Home className="size-4" aria-hidden="true" />
            {t("err.error.home")}
          </Link>
        </div>

        {/* Footer status bar */}
        <div
          className={cn(
            "mt-10 pt-6 border-t flex items-center justify-center gap-2",
            C.neutral.border
          )}
        >
          <span
            className="size-2 rounded-full bg-amber-400 animate-pulse"
            aria-hidden="true"
          />
          <p
            className={cn(T.caption, "text-slate-400 dark:text-slate-600")}
          >
            {t("err.error.footer")}
          </p>
        </div>
      </div>
    </div>
  );
}
