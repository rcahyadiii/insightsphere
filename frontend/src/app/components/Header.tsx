"use client";

import { useState, useRef, useEffect } from "react";
import { useToggle } from "@/app/hooks/useToggle";
import {
  ChevronDown,
  Store,
  Globe,
  Menu,
  Sun,
  Moon,
} from "lucide-react";
import { useTheme } from "next-themes";
import { Toaster } from "sonner";
import { CommandPalette } from "./CommandPalette";
import { NotificationCenter } from "./NotificationCenter";
import { Breadcrumbs } from "./Breadcrumbs";
import { useTranslation } from "@/app/i18n";
import { useAuth } from "@/app/context/AuthContext";
import { cn } from "@/app/lib/utils";
import { T } from "@/app/lib/typography";
import { C } from "@/app/lib/colors";
import { Z } from "@/app/lib/elevation";
import { DROPDOWN } from "@/app/lib/overlays";
import { ICON } from "@/app/lib/spacing";
import { A11Y } from "@/app/lib/a11y";
import { ROLE_CODES } from "@/app/domain/constants";

export function Header({ onMenuToggle }: { onMenuToggle?: () => void }) {
  const { lang, setLang, t } = useTranslation();
  const { role, actualRole } = useAuth();
  const { resolvedTheme, setTheme } = useTheme();
  const [storeOpen, toggleStoreOpen, setStoreOpen] = useToggle(false);
  const [selectedStoreIdx, setSelectedStoreIdx] = useState(0);
  const [activeStoreIdx, setActiveStoreIdx] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const listboxRef = useRef<HTMLDivElement>(null);

  const stores = [
    t("header.store.all"),
    t("header.store.branch1"),
    t("header.store.branch2"),
    t("header.store.branch3"),
    t("header.store.branch4"),
  ];

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setStoreOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [setStoreOpen]);

  const handleStoreTriggerClick = () => {
    if (!storeOpen) {
      setActiveStoreIdx(selectedStoreIdx);
    }
    toggleStoreOpen();
  };

  // Keyboard nav handler for dropdown
  const handleDropdownKeyDown = (e: React.KeyboardEvent) => {
    if (!storeOpen) {
      // Opening keys while focus on trigger
      if (e.key === "ArrowDown" || e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        setActiveStoreIdx(selectedStoreIdx);
        setStoreOpen(true);
      }
      return;
    }
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setActiveStoreIdx((i) => Math.min(i + 1, stores.length - 1));
        break;
      case "ArrowUp":
        e.preventDefault();
        setActiveStoreIdx((i) => Math.max(i - 1, 0));
        break;
      case "Home":
        e.preventDefault();
        setActiveStoreIdx(0);
        break;
      case "End":
        e.preventDefault();
        setActiveStoreIdx(stores.length - 1);
        break;
      case "Enter":
      case " ":
        e.preventDefault();
        setSelectedStoreIdx(activeStoreIdx);
        setStoreOpen(false);
        triggerRef.current?.focus();
        break;
      case "Escape":
      case "Tab":
        setStoreOpen(false);
        if (e.key === "Escape") {
          e.preventDefault();
          triggerRef.current?.focus();
        }
        break;
    }
  };

  return (
    <>
      <header data-mirroring={actualRole === ROLE_CODES.admin && role !== ROLE_CODES.admin ? role : undefined} className={cn("h-14 bg-white dark:bg-slate-900 border-b border-slate-300 dark:border-slate-800 flex items-center justify-between gap-2 px-3 sm:px-4 lg:px-6 shrink-0 sticky top-0 shadow-sm dark:shadow-slate-900", Z.header)}>
        {/* Left side: Breadcrumb */}
        <div className="flex min-w-0 items-center gap-2 sm:gap-3">
          <button
            onClick={onMenuToggle}
            aria-label={t("common.menu")}
            className="lg:hidden flex size-10 shrink-0 items-center justify-center -ml-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/40 transition-colors"
          >
            <Menu className={cn(ICON.lg, "text-slate-500")} aria-hidden="true" />
          </button>
          
          <Breadcrumbs />
        </div>

        {/* Right side: Tools */}
        <div className="flex shrink-0 items-center gap-2 lg:gap-3">
          {/* Command Palette Trigger (opens on click or Ctrl/Cmd+K) */}
          <CommandPalette />

          {/* Store Selector */}
          <div className="relative" ref={dropdownRef} onKeyDown={handleDropdownKeyDown}>
            <button
              ref={triggerRef}
              onClick={handleStoreTriggerClick}
              aria-haspopup="listbox"
              aria-expanded={storeOpen}
              aria-label={t("header.store.title")}
              className="flex min-w-10 items-center justify-center gap-2 h-10 px-2 sm:px-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40 focus-visible:border-emerald-500 transition-colors group"
            >
              <Store className="w-4 h-4 text-slate-500 dark:text-slate-400 group-hover:text-emerald-500 transition-colors" />
              <span className={cn(T.bodySm, DROPDOWN.triggerText.headerStore, "font-bold text-slate-700 dark:text-slate-200")}>
                {stores[selectedStoreIdx]}
              </span>
              <ChevronDown className={cn("w-4 h-4 text-slate-400 dark:text-slate-500 transition-transform duration-200", storeOpen && "rotate-180")} />
            </button>

            {storeOpen && (
              <div
                ref={listboxRef}
                role="listbox"
                aria-label={t("header.store.title")}
                aria-activedescendant={`store-option-${activeStoreIdx}`}
                tabIndex={-1}
                className={cn(DROPDOWN.size.headerStore, Z.dropdown, "absolute right-0 top-full mt-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl py-2 animate-in fade-in zoom-in-95 duration-200")}
              >
                <div className="px-4 py-2 mb-1">
                  <p className={cn(T.label, "text-slate-400")}>{t("header.store.title")}</p>
                </div>
                {stores.map((s, i) => (
                  <button
                    key={i}
                    id={`store-option-${i}`}
                    role="option"
                    aria-selected={i === selectedStoreIdx}
                    onClick={() => { setSelectedStoreIdx(i); setStoreOpen(false); triggerRef.current?.focus(); }}
                    onMouseEnter={() => setActiveStoreIdx(i)}
                    className={cn(
                      "w-full text-left px-4 py-3 transition-colors flex flex-col gap-0.5",
                      i === activeStoreIdx ? "bg-emerald-50 dark:bg-emerald-900/20" :
                      i === selectedStoreIdx ? "bg-emerald-50/50 dark:bg-emerald-900/10" : "hover:bg-slate-50 dark:hover:bg-slate-800"
                    )}
                  >
                    <span className={cn(
                      T.buttonSm,
                      i === selectedStoreIdx ? "text-emerald-600" : i === activeStoreIdx ? "text-emerald-700" : "text-slate-700 dark:text-slate-200"
                    )}>
                      {s}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Dark Mode Toggle */}
          <button
            onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
            aria-label={t("common.toggle_dark_mode")}
            className={cn(A11Y.tapTarget, "flex items-center justify-center bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/40 transition-colors cursor-pointer")}
          >
            {resolvedTheme === "dark"
              ? <Sun className="w-4 h-4 text-amber-400" />
              : <Moon className="w-4 h-4 text-slate-500" />}
          </button>

          {/* Language Toggle */}
          <button
            onClick={() => setLang(lang === "ID" ? "EN" : "ID")}
            aria-label={`${t("common.language")}: ${lang === "ID" ? t("common.indonesian") : t("common.english")}`}
            className={cn(A11Y.tapTarget, "flex items-center justify-center gap-0 sm:gap-2 px-2 sm:px-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/40 transition-colors cursor-pointer")}
          >
            <Globe className="w-4 h-4 text-slate-500 dark:text-slate-400" aria-hidden="true" />
            <span className={cn("hidden text-slate-700 dark:text-slate-200 tracking-widest leading-none sm:inline", T.label)}>{lang}</span>
          </button>


          <NotificationCenter />
        </div>
      </header>

      <Toaster position="top-right" richColors />
    </>
  );
}
