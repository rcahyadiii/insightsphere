"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Search, LayoutDashboard, Package, BarChart3,
  Settings, BrainCircuit, Lightbulb, ShoppingCart, Receipt,
  Wallet, ArrowLeftRight, Users, FlaskConical, Command,
  Hash, ChevronRight, Zap,
} from "lucide-react";
import { cn } from "@/app/lib/utils";
import { T } from "@/app/lib/typography";
import { Z } from "@/app/lib/elevation";
import { useAuth } from "@/app/context/AuthContext";
import { routes } from "@/app/routes";
import { useTranslation } from "@/app/i18n";

// ---- Types ----

interface PaletteItem {
  id: string;
  label: string;
  description?: string;
  icon: React.ElementType;
  action: () => void;
  group: "pages" | "actions" | "settings";
  keywords?: string;
}

// ---- Helpers ----

function fuzzyMatch(query: string, target: string): boolean {
  const q = query.toLowerCase();
  const t = target.toLowerCase();
  if (!q) return true;
  if (t.includes(q)) return true;
  let qi = 0;
  for (let i = 0; i < t.length && qi < q.length; i++) {
    if (t[i] === q[qi]) qi++;
  }
  return qi === q.length;
}

const ROUTE_ICONS: Record<string, React.ElementType> = {
  dashboard: LayoutDashboard,
  kasir: ShoppingCart,
  inventory: Package,
  predictions: BrainCircuit,
  xai: Lightbulb,
  transactions: Receipt,
  reports: BarChart3,
  mlops: FlaskConical,
  cash_management: Wallet,
  stock_movement: ArrowLeftRight,
  user_management: Users,
  settings: Settings,
};


// ---- Main Component ----

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIdx, setActiveIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const { role } = useAuth();
  const { t } = useTranslation();

  const openPalette = useCallback(() => {
    setQuery("");
    setActiveIdx(0);
    setOpen(true);
    setTimeout(() => inputRef.current?.focus(), 50);
  }, []);

  // Build items list
  const items: PaletteItem[] = [
    // Pages from routes
    ...routes
      .filter(r => !r.allowedRoles || (r.allowedRoles as readonly string[]).includes(role))
      .map(r => ({
        id: r.id,
        label: t(`nav.${r.id}`),
        icon: ROUTE_ICONS[r.id] ?? Hash,
        group: "pages" as const,
        keywords: r.path,
        action: () => { router.push(r.path); setOpen(false); },
      })),
    // Quick Actions
    {
      id: "add-product",
      label: t("cmd.action.add_product"),
      description: t("cmd.action.add_product_desc"),
      icon: Package,
      group: "actions",
      keywords: "tambah produk baru inventaris add product",
      action: () => { router.push("/inventaris"); setOpen(false); },
    },
    {
      id: "new-sale",
      label: t("cmd.action.new_sale"),
      description: t("cmd.action.new_sale_desc"),
      icon: ShoppingCart,
      group: "actions",
      keywords: "kasir pos transaksi jual sale cashier",
      action: () => { router.push("/kasir"); setOpen(false); },
    },
    {
      id: "view-report",
      label: t("cmd.action.view_report"),
      description: t("cmd.action.view_report_desc"),
      icon: BarChart3,
      group: "actions",
      keywords: "laporan harian mingguan bulanan report analytics",
      action: () => { router.push("/laporan"); setOpen(false); },
    },
    {
      id: "forecast",
      label: t("cmd.action.forecast"),
      description: t("cmd.action.forecast_desc"),
      icon: BrainCircuit,
      group: "actions",
      keywords: "prediksi stok ai forecast restock",
      action: () => { router.push("/prediksi-stok"); setOpen(false); },
    },
    // Settings
    {
      id: "settings-profile",
      label: t("cmd.settings.profile"),
      description: t("cmd.settings.profile_desc"),
      icon: Settings,
      group: "settings",
      keywords: "profil edit nama email avatar profile",
      action: () => { router.push("/pengaturan"); setOpen(false); },
    },
    {
      id: "settings-security",
      label: t("cmd.settings.security"),
      description: t("cmd.settings.security_desc"),
      icon: Settings,
      group: "settings",
      keywords: "keamanan password pin 2fa security login history",
      action: () => { router.push("/pengaturan"); setOpen(false); },
    },
  ];

  const filtered = items.filter(item =>
    fuzzyMatch(query, item.label + " " + (item.keywords ?? "") + " " + (item.description ?? ""))
  );

  const grouped = (["pages", "actions", "settings"] as const)
    .map(g => ({ group: g, items: filtered.filter(i => i.group === g) }))
    .filter(g => g.items.length > 0);

  const flatList = grouped.flatMap(g => g.items);

  // Keyboard shortcut Cmd/Ctrl+K
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        if (open) {
          setOpen(false);
        } else {
          openPalette();
        }
      }
      if (e.key === "Escape" && open) {
        setOpen(false);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, openPalette]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIdx(i => Math.min(i + 1, flatList.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIdx(i => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      flatList[activeIdx]?.action();
    }
  };

  // Scroll active item into view
  useEffect(() => {
    const activeEl = listRef.current?.querySelector(`[data-idx="${activeIdx}"]`);
    activeEl?.scrollIntoView({ block: "nearest" });
  }, [activeIdx]);

  if (!open) {
    return (
      <button
        aria-label={t("cmd.open")}
        onClick={openPalette}
        className={cn(
          "hidden md:flex items-center gap-2 h-9 pl-3 pr-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-400 dark:text-slate-500 hover:border-slate-300 transition-all cursor-pointer",
          T.bodySm
        )}
      >
        <Search className="w-3.5 h-3.5" />
        <span className="hidden lg:inline">{t("cmd.placeholder_short")}</span>
        <kbd className={cn("hidden lg:flex items-center gap-0.5 ml-1 px-1.5 py-0.5 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded", T.label, "text-slate-400 dark:text-slate-400")}>
          <Command className="w-2.5 h-2.5" />K
        </kbd>
      </button>
    );
  }

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className={cn(Z.modal, "fixed inset-0 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-150")}
        onClick={() => setOpen(false)}
      />

      {/* Palette */}
      <div
        className={cn(Z.popover, "fixed left-1/2 top-[15vh] -translate-x-1/2 w-full max-w-lg mx-4 animate-in fade-in zoom-in-95 slide-in-from-top-2 duration-150")}
      >
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
              {/* Search input */}
              <div className="flex items-center gap-3 px-4 border-b border-slate-100 dark:border-slate-800 h-14">
                <Search className="w-4 h-4 text-slate-400 dark:text-slate-500 shrink-0" />
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={e => { setQuery(e.target.value); setActiveIdx(0); }}
                  onKeyDown={handleKeyDown}
                  placeholder={t("cmd.placeholder")}
                  className={cn("flex-1 bg-transparent border-none outline-none text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500", T.body, "font-medium")}
                />
                <kbd className={cn("shrink-0 px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded", T.label, "text-slate-400 dark:text-slate-500")}>
                  ESC
                </kbd>
              </div>

              {/* Results */}
              <div ref={listRef} className="overflow-y-auto max-h-[340px] py-2">
                {filtered.length === 0 ? (
                  <div className="px-4 py-10 text-center space-y-2">
                    <Zap className="w-6 h-6 text-slate-300 dark:text-slate-600 mx-auto" />
                    <p className={cn(T.body, "font-bold text-slate-400 dark:text-slate-500")}>{t("cmd.empty", { query })}</p>
                  </div>
                ) : (
                  grouped.map(({ group, items: groupItems }) => (
                      <div key={group}>
                        <p className={cn(T.h4, "px-4 py-1.5 text-slate-400 dark:text-slate-600")}>
                          {t(`cmd.group.${group}`)}
                        </p>
                        {groupItems.map((item) => {
                          const flatIdx = flatList.indexOf(item);
                          const isActive = flatIdx === activeIdx;
                          const Icon = item.icon;
                          return (
                            <button
                              key={item.id}
                              data-idx={flatIdx}
                              onClick={item.action}
                              onMouseEnter={() => setActiveIdx(flatIdx)}
                              className={cn(
                                "w-full flex items-center gap-3 px-4 py-2.5 transition-colors text-left cursor-pointer",
                                isActive
                                  ? "bg-indigo-50 dark:bg-indigo-950/50"
                                  : "hover:bg-slate-50 dark:hover:bg-slate-800/50"
                              )}
                            >
                              <div className={cn(
                                "w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors",
                                isActive ? "bg-indigo-100 dark:bg-indigo-900/60" : "bg-slate-100 dark:bg-slate-800"
                              )}>
                                <Icon className={cn(
                                  "w-4 h-4 transition-colors",
                                  isActive ? "text-indigo-600 dark:text-indigo-400" : "text-slate-500 dark:text-slate-400"
                                )} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className={cn(
                                  T.body, "font-bold truncate",
                                  isActive ? "text-indigo-900 dark:text-indigo-100" : "text-slate-700 dark:text-slate-300"
                                )}>
                                  {item.label}
                                </p>
                                {item.description && (
                                  <p className={cn("text-slate-400 dark:text-slate-500 truncate mt-0.5", T.label, "font-medium")}>
                                    {item.description}
                                  </p>
                                )}
                              </div>
                              {isActive && (
                                <ChevronRight className="w-4 h-4 text-indigo-400 dark:text-indigo-500 shrink-0" />
                              )}
                            </button>
                          );
                        })}
                      </div>
                    ))
                )}
              </div>

              {/* Footer */}
              <div className="px-4 py-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div className={cn(T.caption, "flex items-center gap-3 text-slate-400 dark:text-slate-600")}>
                  <span className="flex items-center gap-1"><kbd className={cn("px-1 py-0.5 bg-slate-100 dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700", T.caption)}>↑↓</kbd> {t("cmd.hint.nav")}</span>
                  <span className="flex items-center gap-1"><kbd className={cn("px-1 py-0.5 bg-slate-100 dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700", T.caption)}>↵</kbd> {t("cmd.hint.open")}</span>
                </div>
                <div className={cn("flex items-center gap-1 text-slate-400 dark:text-slate-600", T.label)}>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  {t("cmd.results", { count: flatList.length })}
                </div>
              </div>
            </div>
        </div>
    </>
  );
}
