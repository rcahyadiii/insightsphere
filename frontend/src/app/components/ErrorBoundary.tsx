"use client";

import React, { Component, ErrorInfo, ReactNode } from "react";
import Link from "next/link";
import { ShieldAlert, RefreshCcw, Home, ChevronDown } from "lucide-react";
import { cn } from "@/app/lib/utils";
import { T } from "@/app/lib/typography";
import { C } from "@/app/lib/colors";
import { R } from "@/app/lib/radii";
import { I18nContext, type I18nContextType } from "@/app/i18n";

interface Props {
  children: ReactNode;
  /**
   * Optional label shown in compact fallback to identify which section failed.
   * Example: "Forecast Chart", "Prediction Table".
   */
  sectionName?: string;
  /**
   * Use a compact inline fallback instead of the full-page fallback.
   * Useful for wrapping individual charts/tables inside a page so one
   * widget crashing doesn't take down the whole page.
   */
  compact?: boolean;
  /**
   * Custom fallback node. Takes precedence over `compact` and default.
   */
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  showDetails: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  static contextType = I18nContext;
  declare context: I18nContextType | undefined;

  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
    showDetails: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null, showDetails: false };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo });
    // You could also log the error to an error reporting service here
    console.error("Uncaught error:", error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.reload();
  };

  private handleRetrySection = () => {
    // Soft reset — clear error without reload, letting the subtree re-mount
    this.setState({ hasError: false, error: null, errorInfo: null, showDetails: false });
  };

  public render() {
    if (this.state.hasError) {
      // 1. Explicit fallback wins
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // 2. Compact inline fallback for nested boundaries around widgets
      if (this.props.compact) {
        return (
          <div className={cn("w-full p-6 border flex items-start gap-3", R.lg, C.destructive.bg, C.destructive.border)}>
            <ShieldAlert className={cn("w-5 h-5 shrink-0 mt-0.5", C.destructive.icon)} aria-hidden="true" />
            <div className="flex-1 min-w-0">
              <p className={cn(T.caption, "font-semibold", C.destructive.text)}>
                {this.props.sectionName ? this.context?.t("eb.section_failed", { name: this.props.sectionName }) ?? `${this.props.sectionName} failed to load` : this.context?.t("eb.widget_failed") ?? "Widget failed to load"}
              </p>
              <p className={cn("mt-1 font-medium truncate opacity-80", T.caption, C.destructive.text)}>
                {this.state.error?.message || (this.context?.t("eb.unknown_error") ?? "Unknown error")}
              </p>
            </div>
            <button
              onClick={this.handleRetrySection}
              className={cn(T.buttonSm, "px-3 py-1.5 bg-white dark:bg-slate-800 border hover:opacity-80 focus:outline-none focus-visible:ring-2 transition-colors shrink-0", R.sm, C.destructive.border, C.destructive.text)}
            >
              <RefreshCcw className="w-3 h-3 inline mr-1" aria-hidden="true" />
              {this.context?.t("eb.retry") ?? "Retry"}
            </button>
          </div>
        );
      }

      // 3. Default full-page fallback
      return (
        <div className="min-h-[600px] w-full flex flex-col items-center justify-center p-10 animate-in fade-in duration-500">
          <div className={cn("max-w-xl w-full bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-2xl overflow-hidden relative", R.xl)}>
            <div className="p-12 relative z-10 flex flex-col items-center text-center">
              <div className={cn("w-20 h-20 flex items-center justify-center mb-8 shadow-inner", R.xl, C.destructive.bg)}>
                <ShieldAlert className={cn("w-10 h-10", C.destructive.icon)} />
              </div>

              <h2 className={cn(T.h1, "text-slate-900 mb-4")}>{this.context?.t("eb.title") ?? "Pusat Keamanan Aktif"}</h2>
              <p className={cn(T.body, "font-medium text-slate-500 leading-relaxed mb-10")}>
                {this.context?.t("eb.desc") ?? "Sistem InsightSphere mendeteksi anomali pada visualisasi data. Jangan khawatir, operasional gudang Anda tetap aman. Kami menyarankan untuk memuat ulang halaman."}
              </p>

              <div className="flex flex-col sm:flex-row items-center gap-4 w-full">
                <button
                  onClick={this.handleReset}
                  className={cn(T.buttonSm, "flex-1 w-full flex items-center justify-center gap-2 px-6 py-4 bg-slate-900 text-white rounded-2xl hover:bg-slate-800 transition-all shadow-xl shadow-slate-200 active:scale-95")}
                >
                  <RefreshCcw className="w-4 h-4" /> {this.context?.t("eb.refresh") ?? "Refresh Smart Hub"}
                </button>
                <Link
                  href="/"
                  className={cn(T.buttonSm, "flex-1 w-full flex items-center justify-center gap-2 px-6 py-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-all active:scale-95")}
                >
                  <Home className="w-4 h-4" /> {this.context?.t("eb.home") ?? "Kembali ke Dashboard"}
                </Link>
              </div>

              {/* Error Details (Expandable) */}
              <div className="mt-12 w-full border-t border-slate-50 pt-8">
                <button 
                  onClick={() => this.setState({ showDetails: !this.state.showDetails })}
                  className={cn(T.buttonSm, "text-slate-300 hover:text-slate-500 flex items-center justify-center gap-1.5 mx-auto transition-colors")}
                >
                  {this.state.showDetails ? (this.context?.t("eb.hide_log") ?? "Sembunyikan Log") : (this.context?.t("eb.show_log") ?? "Lihat Detail Teknis")} 
                  <ChevronDown className={cn("w-3 h-3 transition-transform", this.state.showDetails && "rotate-180")} />
                </button>
                
                {this.state.showDetails && (
                  <div className="mt-6 text-left bg-slate-50 rounded-2xl p-6 border border-slate-100 animate-in slide-in-from-top-2 duration-300">
                    <p className={cn(T.code, "mb-2", C.destructive.text)}>{this.context?.t("eb.diagnostic") ?? "Error Diagnostic:"}</p>
                    <code className={cn("font-data text-slate-600 break-all", T.caption)}>
                      {this.state.error?.toString()}
                    </code>
                    {this.state.errorInfo && (
                      <div className="mt-4 pt-4 border-t border-slate-200">
                        <p className={cn(T.code, "text-slate-400 mb-2")}>{this.context?.t("eb.stack") ?? "Component Stack:"}</p>
                        <pre className={cn(T.caption, "text-slate-500 overflow-x-auto whitespace-pre-wrap leading-relaxed max-h-40 no-scrollbar font-data")}>
                           {this.state.errorInfo.componentStack}
                        </pre>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
            
            <div className="bg-slate-50 p-6 flex items-center justify-center gap-3">
               <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
               <p className={cn(T.caption, "text-slate-400")}>{this.context?.t("eb.status") ?? "Engine Status: Protected Mode"}</p>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
