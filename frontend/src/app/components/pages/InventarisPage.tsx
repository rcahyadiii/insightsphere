"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import { 
  Plus, 
  Upload, 
  Download, 
  Search, 
  Filter, 
  ChevronRight, 
  X, 
  AlertTriangle, 
  CheckCircle2, 
  Package, 
  Warehouse, 
  ShieldAlert, 
  BarChart3, 
  History, 
  ExternalLink,
  Edit2,
  ShoppingCart,
  MapPin,
  TrendingDown,
  TrendingUp,
  Boxes,
  Zap,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  ArrowUpDown,
  Minus,
  Share2,
  ClipboardList,
  ArrowLeftRight,
} from "lucide-react";
import { 
  LineChart, 
  Line, 
  Tooltip as RechartsTooltip,
  AreaChart,
  Area
} from "recharts";
import { CHART_COLORS } from "@/app/lib/charts";
import { StableResponsiveContainer as ResponsiveContainer } from "@/app/components/charts/StableResponsiveContainer";
import { ExportShareModal, ShareData } from "../ExportShareModal";
import { EmptyState } from "../ui/EmptyState";
import { ResponsiveTable } from "../ui/ResponsiveTable";
import { ProductForm } from "../inventory/ProductForm";
import { StockUpdateModal } from "../inventory/StockUpdateModal";
import { StockHistoryTable } from "../inventory/StockHistoryTable";
import { StockOpnameModal } from "../inventory/StockOpnameModal";
import { StockTransferModal } from "../inventory/StockTransferModal";
import { ExcelImportModal, ImportProductRow } from "../inventory/ExcelImportModal";
import { useInventoryDeductions } from "@/app/stores/inventoryStore";
import { useAuth } from "@/app/context/AuthContext";
// api/ApiError/toQuery available via invClient if needed
import * as invClient from "@/app/lib/inventory-client";
import type { BackendInventoryItem, BackendStockSummary } from "@/app/lib/inventory-client";
import type { ProductFormData } from "@/app/components/inventory/ProductForm";
import { cn } from "@/app/lib/utils";
import { C } from "@/app/lib/colors";
import { TABLE } from "@/app/lib/data";
import { T } from "@/app/lib/typography";
import { R, R_COMPONENT } from "@/app/lib/radii";
import { E, E_COMPONENT, Z } from "@/app/lib/elevation";
import { formatRupiah } from "@/app/lib/format";
import { GAP, ICON, STACK } from "@/app/lib/spacing";
import { btn, BTN } from "@/app/lib/buttons";
import { useTranslation } from "@/app/i18n";
import { toast } from "sonner";
import { INPUT } from "@/app/lib/forms";
import { A11Y } from "@/app/lib/a11y";
import { useDebounce } from "@/app/hooks/useDebounce";
import { useModalA11y } from "@/app/hooks/useModalA11y";
import { StatsSkeleton, InventoryTableSkeleton } from "../Skeletons";
import { isDemoDataEnabled } from "@/app/lib/demo-mode";
import {
  INVENTORY_STOCK_STATUS,
  INVENTORY_UNITS,
  type InventoryStockStatus,
} from "@/app/domain/constants";
import { AlertCircle, Loader2 } from "lucide-react";

// --- Types ---

interface Product {
  id: string;                  // product_id from backend
  inventory_id: string | null; // inventory record id (for stock movement)
  sku: string;
  name: string;
  family: string;
  category: string;
  location: string;
  stock: number;
  minStock: number;
  maxStock: number;
  reorderPoint: number;
  supplier: string;
  lastRestock: string;
  price: number;
  avgDailyDemand: number;
  daysRemaining: number;       // from backend or computed
  trend: number[];
}

function mapBackendInventory(inv: BackendInventoryItem): Product {
  const stock = inv.current_stock;
  const days = inv.days_remaining ?? (stock > 0 ? stock : 0);
  return {
    id: inv.product_id,
    inventory_id: inv.id,
    sku: inv.product_sku ?? "",
    name: inv.product_name ?? "",
    family: inv.product_family ?? "",
    category: inv.product_category ?? "",
    location: inv.location ?? "—",
    stock,
    minStock: inv.min_stock,
    maxStock: inv.max_stock,
    reorderPoint: inv.reorder_point,
    supplier: "",
    lastRestock: inv.last_restock_date ?? "",
    price: inv.product_price ?? 0,
    avgDailyDemand: days > 0 && stock > 0 ? Math.ceil(stock / days) : 1,
    daysRemaining: days,
    trend: [],
  };
}

const INVENTORY_STATUS_TABS: InventoryStockStatus[] = [
  INVENTORY_STOCK_STATUS.all,
  INVENTORY_STOCK_STATUS.safe,
  INVENTORY_STOCK_STATUS.thin,
  INVENTORY_STOCK_STATUS.critical,
];

export function InventarisPage() {
  const { t } = useTranslation();
  const { user: currentUser } = useAuth();
  const [isDataLoading, setIsDataLoading] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [apiProducts, setApiProducts] = useState<Product[]>([]);
  const [apiSummary, setApiSummary] = useState<BackendStockSummary | null>(null);
  const [activeTab, setActiveTab] = useState<InventoryStockStatus>(INVENTORY_STOCK_STATUS.all);
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearchQuery = useDebounce(searchQuery, 250);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [productFormOpen, setProductFormOpen] = useState(false);
  const [productFormMode, setProductFormMode] = useState<"add" | "edit">("add");
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [stockUpdateProduct, setStockUpdateProduct] = useState<Product | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [opnameOpen, setOpnameOpen] = useState(false);
  const [transferOpen, setTransferOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [demoProducts, setDemoProducts] = useState<Product[]>([]);
  const [importedProducts, setImportedProducts] = useState<Product[]>([]);
  const stockDeductions = useInventoryDeductions();
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [sortField, setSortField] = useState<"name" | "stock" | "price" | "doi">("name");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  const toggleSort = (field: typeof sortField) => {
    if (sortField === field) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortField(field); setSortDir("asc"); }
  };

  const drawerRef = useRef<HTMLDivElement>(null);
  useModalA11y({
    isOpen: selectedProduct !== null,
    onClose: () => setSelectedProduct(null),
    containerRef: drawerRef,
  });

  useEffect(() => {
    if (isDemoDataEnabled()) {
      let cancelled = false;
      void import("@/app/demo/inventory-products").then(({ DEMO_INVENTORY_PRODUCTS }) => {
        if (!cancelled) setDemoProducts(DEMO_INVENTORY_PRODUCTS.map(p => ({ ...p, inventory_id: null, family: "", daysRemaining: Math.floor(p.stock / (p.avgDailyDemand || 1)) })));
      });
      return () => { cancelled = true; };
    }

    setIsDataLoading(true);
    const storeNbr = currentUser?.storeNbr ?? undefined;
    Promise.all([
      invClient.fetchInventoryStock({ store_nbr: storeNbr, limit: 500 }),
      invClient.fetchStockSummary(storeNbr),
    ])
      .then(([stockItems, summary]) => {
        setApiProducts(stockItems.map(mapBackendInventory));
        setApiSummary(summary);
        setLoadError("");
      })
      .catch(() => setLoadError(t("common.error_loading")))
      .finally(() => setIsDataLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser?.storeNbr]);

  const getDaysLeft = (p: Product) => p.daysRemaining > 0 ? Math.floor(p.daysRemaining) : Math.floor(p.stock / (p.avgDailyDemand || 1));
  
  const getStatus = (p: Product) => {
    const daysLeft = getDaysLeft(p);
    if (daysLeft < 3) return INVENTORY_STOCK_STATUS.critical;
    if (daysLeft < 7) return INVENTORY_STOCK_STATUS.thin;
    return INVENTORY_STOCK_STATUS.safe;
  };

  const getTranslatedStatus = (status: string) => {
    if (status === INVENTORY_STOCK_STATUS.critical) return t("inv.stats.critical");
    if (status === INVENTORY_STOCK_STATUS.thin) return t("inv.stats.thin");
    if (status === INVENTORY_STOCK_STATUS.safe) return t("inv.stats.safe");
    return status;
  };

  const allProducts = useMemo(() => {
    if (!isDemoDataEnabled()) return apiProducts;
    return [...demoProducts, ...importedProducts].map(p => ({
      ...p,
      stock: Math.max(0, p.stock - (stockDeductions[p.sku] ?? 0)),
    }));
  }, [demoProducts, importedProducts, apiProducts, stockDeductions]);

  const filteredProducts = useMemo(() => {
    const q = debouncedSearchQuery.toLowerCase();
    const filtered = allProducts.filter(p => {
      const matchSearch = p.name.toLowerCase().includes(q) || 
                          p.sku.toLowerCase().includes(q);
      const status = getStatus(p);
      const matchTab = activeTab === INVENTORY_STOCK_STATUS.all || status === activeTab;
      return matchSearch && matchTab;
    });
    return [...filtered].sort((a, b) => {
      let valA: number | string;
      let valB: number | string;
      if (sortField === "name") { valA = a.name; valB = b.name; }
      else if (sortField === "stock") { valA = a.stock; valB = b.stock; }
      else if (sortField === "price") { valA = a.price; valB = b.price; }
      else { valA = getDaysLeft(a); valB = getDaysLeft(b); }
      if (valA < valB) return sortDir === "asc" ? -1 : 1;
      if (valA > valB) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
  }, [allProducts, debouncedSearchQuery, activeTab, sortField, sortDir]);

  const stats = useMemo(() => {
    if (!isDemoDataEnabled() && apiSummary) {
      return {
        total: apiSummary.total_products,
        safe: apiSummary.safe,
        thin: apiSummary.low,
        critical: apiSummary.critical,
      };
    }
    const critical = allProducts.filter(p => getStatus(p) === INVENTORY_STOCK_STATUS.critical).length;
    const thin = allProducts.filter(p => getStatus(p) === INVENTORY_STOCK_STATUS.thin).length;
    const safe = allProducts.filter(p => getStatus(p) === INVENTORY_STOCK_STATUS.safe).length;
    return { total: allProducts.length, safe, thin, critical };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allProducts, apiSummary]);

  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const paginatedProducts = filteredProducts.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className="space-y-5 animate-in fade-in duration-500 pb-6">
      {/* Header */}
      <div className={cn("flex flex-col md:flex-row md:items-center justify-between", GAP.default)}>
        <div className={STACK.tight}>
          <h1 className={cn(T.h1, "text-slate-900 dark:text-slate-100")}>{t("inv.header")}</h1>
          <p className={cn(T.body, "text-slate-500 dark:text-slate-400 flex items-center gap-1.5")}>
            <Zap className={cn(ICON.sm, C.warning.icon)} />
            {t("inv.subheader")}
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setImportOpen(true)}
            className={cn(btn("success", "sm"), "dark:bg-emerald-900/30 dark:hover:bg-emerald-900/40 dark:text-emerald-400 dark:shadow-none dark:border dark:border-emerald-800/50")}>
            <Upload className={ICON.sm} /> Import Excel
          </button>
          <button
            onClick={() => toast.success(t("inv.toast.export"))}
            className={btn("neutralSoft", "sm")}>
            <Download className={ICON.sm} /> {t("common.export")}
          </button>
          <button
            onClick={() => setHistoryOpen(true)}
            className={btn("neutralSoft", "sm")}
          >
            <History className={ICON.sm} /> {t("inv.history.title")}
          </button>
          <button
            onClick={() => setTransferOpen(true)}
            className={btn("neutralSoft", "sm")}
          >
            <ArrowLeftRight className={ICON.sm} /> Transfer
          </button>
          <button
            onClick={() => setOpnameOpen(true)}
            className={cn(btn("primary", "sm"), "dark:bg-indigo-900/30 dark:hover:bg-indigo-900/40 dark:text-indigo-400 dark:shadow-none dark:border dark:border-indigo-800/50")}
          >
            <ClipboardList className={ICON.sm} /> Opname
          </button>
          <button
            onClick={() => { setProductFormMode("add"); setEditingProduct(null); setProductFormOpen(true); }}
            className={cn(btn("success", "sm"), "dark:bg-emerald-900/30 dark:hover:bg-emerald-900/40 dark:text-emerald-400 dark:shadow-none dark:border dark:border-emerald-800/50")}
          >
            <Plus className={ICON.sm} /> {t("inv.btn.add")}
          </button>
        </div>
      </div>

      {isDataLoading && (
        <div className={cn(T.bodySm, "flex items-center gap-2 text-slate-400 dark:text-slate-500")}>
          <Loader2 className="size-4 animate-spin" /> {t("common.loading")}
        </div>
      )}
      {!isDataLoading && loadError && (
        <div className={cn(T.bodySm, "flex items-center gap-2 text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-900/20 px-4 py-3 rounded-xl border border-rose-100 dark:border-rose-800/50")}>
          <AlertCircle className="size-4 shrink-0" /> {loadError}
        </div>
      )}

      {/* Summary Cards */}
      {isDataLoading ? (
        <StatsSkeleton />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { label: t("inv.stats.total"), value: stats.total, icon: Package, color: "slate" },
              { label: t("inv.stats.safe"), value: stats.safe, icon: CheckCircle2, color: "emerald", desc: t("inv.stats.safe_desc") },
              { label: t("inv.stats.thin"), value: stats.thin, icon: AlertTriangle, color: "amber", desc: t("inv.stats.thin_desc") },
              { label: t("inv.stats.critical"), value: stats.critical, icon: ShieldAlert, color: "rose", desc: t("inv.stats.critical_desc") },
            ].map((item, idx) => (
              <div key={idx} className={cn(R.sm, E.sm, "bg-white dark:bg-slate-900 px-3 py-2 border border-slate-200 dark:border-slate-800 flex items-center gap-2.5 group hover:shadow-md transition-all")}>
                <div className={cn(
                  R.sm, "size-7 flex items-center justify-center shrink-0 transition-transform group-hover:scale-105",
                  item.color === "emerald" ? "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400" :
                  item.color === "amber" ? "bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400" :
                  item.color === "rose" ? cn(C.destructive.bg, C.destructive.text) :
                  "bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                )}>
                  <item.icon className={ICON.sm} />
                </div>
                <p className={cn(T.label, "text-slate-500 flex-1 truncate")}>{item.label}</p>
                <div className="flex items-baseline gap-1 shrink-0">
                  <h4 className={cn(T.h3, "text-slate-900 dark:text-slate-100 font-data tabular-nums")}>{item.value}</h4>
                  {item.desc && <span className={cn(T.caption, "text-slate-400 italic whitespace-nowrap opacity-70")}>{item.desc}</span>}
                </div>
              </div>
            ))}
        </div>
      )}

      {/* Main Container */}
      <div className={cn(R.md, E.sm, "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col")}>
          <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-800/20 flex flex-col xl:flex-row xl:items-center justify-between gap-4">
            <div className={cn(R.sm, "flex bg-slate-100/50 dark:bg-slate-800 p-1 border border-slate-200 dark:border-slate-700 overflow-x-auto no-scrollbar max-w-fit")}>
                {INVENTORY_STATUS_TABS.map((tab) => (
                  <button 
                    key={tab}
                    onClick={() => { setActiveTab(tab); setCurrentPage(1); }}
                    className={cn(
                      T.buttonSm, R.sm, "px-5 py-2 transition-all whitespace-nowrap cursor-pointer",
                      activeTab === tab ? "bg-white dark:bg-slate-700 text-indigo-600 shadow-sm" : "text-slate-400 hover:text-slate-600"
                    )}
                  >
                    {tab === INVENTORY_STOCK_STATUS.all ? t("app.all") : getTranslatedStatus(tab)}
                  </button>
                ))}
            </div>

            <div className="relative group max-w-xs w-full">
                <Search className={cn("absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors", ICON.sm)} />
                <input 
                  type="text" 
                  placeholder={t("inv.search.placeholder")}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={cn(INPUT.base, INPUT.size.md, R_COMPONENT.input, "pl-9 pr-3", T.body)}
                />
            </div>
          </div>

          {isDataLoading ? (
            <div className="overflow-x-auto">
              <InventoryTableSkeleton />
            </div>
          ) : (
            <ResponsiveTable
              label={t("inv.header")}
              scrollerClassName="rounded-none border-0 bg-transparent"
              minWidthClassName={TABLE.minWidth.inventory}
            >
              <table className={TABLE.base} aria-label={t("inv.header")}>
                <thead className={TABLE.head}>
                  <tr>
                    {([
                      { key: "name", label: t("inv.table.product") },
                      { key: "stock", label: t("inv.table.stock") },
                      { key: "doi", label: t("inv.table.doi") },
                    ] as { key: typeof sortField; label: string }[]).map((col, index) => (
                      <th
                        key={col.key}
                        className={cn(
                          TABLE.headCell,
                          TABLE.headCellSortable,
                          index === 0 && cn(TABLE.stickyColumn, "bg-slate-50 dark:bg-slate-800/50")
                        )}
                      >
                        <button
                          type="button"
                          onClick={() => toggleSort(col.key)}
                          className={cn("inline-flex w-full items-center gap-1", A11Y.focusRing.default)}
                        >
                          {col.label}
                          <ArrowUpDown className={cn("size-3 transition-colors", sortField === col.key ? "text-indigo-500" : "text-slate-300")} />
                        </button>
                      </th>
                    ))}
                    <th className={TABLE.headCell}>{t("inv.table.status")}</th>
                    <th className={cn(TABLE.headCell, "text-right")}>{t("inv.table.detail")}</th>
                  </tr>
                </thead>
                <tbody className={TABLE.body}>
                  {paginatedProducts.length > 0 ? (
                    paginatedProducts.map((p) => {
                      const status = getStatus(p);
                      const daysLeft = getDaysLeft(p);
                      return (
                        <tr key={p.id} className={cn(TABLE.row, TABLE.rowHover, "group")}>
                          <td className={cn(TABLE.cell, TABLE.stickyColumn, "bg-white dark:bg-slate-900 group-hover:bg-slate-50 dark:group-hover:bg-slate-800/50")}>
                            <div className="flex flex-col">
                              <span className={cn(T.bodySm, "font-bold text-slate-900 dark:text-slate-200 leading-tight")}>{p.name}</span>
                              <span className={cn(T.caption, "text-slate-500")}>{p.sku} • {p.category}</span>
                            </div>
                          </td>
                          <td className={TABLE.cell}>
                            <div className="flex flex-col gap-0.5">
                              <span className={cn(T.dataSm, "font-bold text-slate-900 dark:text-slate-200")}>{p.stock} {t("table.unit")}</span>
                              <div className="h-1 w-16 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-700">
                                <div
                                  className={cn(
                                    "h-full rounded-full",
                                    status === INVENTORY_STOCK_STATUS.critical ? "bg-rose-500" :
                                    status === INVENTORY_STOCK_STATUS.thin ? "bg-amber-500" : "bg-emerald-500"
                                  )}
                                  style={{ width: `${Math.min((p.stock / (p.avgDailyDemand * 10)) * 100, 100)}%` }}
                                />
                              </div>
                            </div>
                          </td>
                          <td className={TABLE.cell}>
                            <div className="flex items-center gap-2">
                              <div className={cn(
                                R.sm, T.dataSm, "size-7 flex items-center justify-center font-semibold",
                                status === INVENTORY_STOCK_STATUS.critical ? cn(C.destructive.bg, C.destructive.text) :
                                status === INVENTORY_STOCK_STATUS.thin ? "bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400" : "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400"
                              )}>
                                {daysLeft}
                              </div>
                              <span className={cn(T.caption, "text-slate-500")}>{t("inv.drawer.days_left").substring(0, 2)}</span>
                            </div>
                          </td>
                          <td className={TABLE.cell}>
                            <span className={cn(
                              T.micro, R.xs, "px-2 py-0.5 border",
                              status === INVENTORY_STOCK_STATUS.critical ? cn(C.destructive.bg, C.destructive.text, C.destructive.border) :
                              status === INVENTORY_STOCK_STATUS.thin ? "bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800/50" :
                              "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/50"
                            )}>
                              {getTranslatedStatus(status)}
                            </span>
                          </td>
                          <td className={cn(TABLE.cell, "text-right")}>
                            <button
                              type="button"
                              onClick={() => setSelectedProduct(p)}
                              className={cn(R.sm, "p-1.5 border border-slate-200 dark:border-slate-700 text-slate-400 dark:text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:border-indigo-300 dark:hover:border-indigo-700 transition-all cursor-pointer", A11Y.focusRing.default)}
                              aria-label={`${t("inv.table.detail")} ${p.name}`}
                            >
                              <ChevronRight className={ICON.sm} />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td className={TABLE.cell} colSpan={5}>
                        <EmptyState
                          title={t("app.empty_products")}
                          description={t("app.empty_desc")}
                          action={<button type="button" onClick={() => { setSearchQuery(""); setActiveTab(INVENTORY_STOCK_STATUS.all); }} className={cn(T.buttonSm, C.primary.icon, "underline cursor-pointer", A11Y.focusRing.default)}>{t("app.reset")}</button>}
                        />
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </ResponsiveTable>
          )}

          <div className="px-4 py-3 bg-slate-50 dark:bg-slate-800 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between">
              <span className={cn(T.bodySm, "text-slate-500")}>{t("inv.pagination")} {currentPage} {t("inv.pagination.of")} {Math.max(totalPages, 1)}</span>
              <div className="flex gap-1">
                 {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                    <button 
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={cn(
                        T.buttonSm, R.sm, "size-7 transition-all cursor-pointer",
                        currentPage === page ? "bg-slate-900 text-white" : "bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-400 hover:border-slate-300"
                      )}
                    >
                      {page}
                    </button>
                 ))}
              </div>
          </div>
      </div>

      {/* Drawer */}
      {selectedProduct && (
        <>
          <div
             onClick={() => setSelectedProduct(null)}
             className={cn(Z.overlay, "fixed inset-0 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150")}
          />
          <div
             ref={drawerRef}
             role="dialog"
             aria-modal="true"
             aria-labelledby="product-drawer-title"
             tabIndex={-1}
             className={cn(Z.modal, E["2xl"], "fixed top-0 right-0 h-full w-full max-w-sm bg-white dark:bg-slate-900 p-8 flex flex-col outline-none animate-in fade-in slide-in-from-right-2 duration-150")}
          >
               <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-3">
                     <div className={cn(R.sm, "size-10 bg-slate-900 dark:bg-slate-700 text-white flex items-center justify-center", T.h3)}>
                        {selectedProduct.sku.charAt(0)}
                     </div>
                     <div>
                        <h2 id="product-drawer-title" className={cn(T.h2, "text-slate-900 dark:text-slate-100 leading-tight")}>{selectedProduct.name}</h2>
                        <span className={cn(T.code, "text-slate-400")}>{selectedProduct.sku}</span>
                     </div>
                  </div>
                  <button
                    onClick={() => setSelectedProduct(null)}
                    aria-label={t("common.close")}
                    className={cn(R.md, "p-2 hover:bg-slate-50 dark:hover:bg-slate-800", A11Y.focusRing.default)}
                  >
                    <X className="size-5 text-slate-400" aria-hidden="true" />
                  </button>
               </div>

               <div className="space-y-8 flex-1 overflow-y-auto no-scrollbar">
                  <div className={cn(R.md, E.lg, "p-6 bg-slate-900 text-white relative overflow-hidden")}>
                     <Zap className="absolute top-0 right-0 p-4 opacity-10 w-16 h-16" />
                     <p className={cn(T.label, "text-indigo-400 mb-2")}>{t("inv.drawer.estimation")}</p>
                     <p className={cn(T.kpiHero, "text-white")}>{getDaysLeft(selectedProduct)} <span className={cn(T.h3, "text-slate-500")}>{t("inv.drawer.days_left")}</span></p>
                     <p className={cn(T.caption, "text-slate-400 mt-1")}>{t("common.status")}: {getTranslatedStatus(getStatus(selectedProduct))}</p>
                  </div>

                  <div className="space-y-3">
                     <h4 className={cn(T.h4, "text-slate-500 flex items-center gap-2")}>
                        <TrendingUp className={ICON.sm} /> {t("inv.drawer.trend")}
                     </h4>
                     <div className={cn(R.md, E.sm, "h-32 w-full bg-slate-50 dark:bg-slate-800 p-4 border border-slate-100 dark:border-slate-700")}>
                        <ResponsiveContainer debounce={200} width="100%" height="100%">
                           <AreaChart data={selectedProduct.trend.map((val, i) => ({ day: i, val }))}>
                              <defs>
                                 <linearGradient id="draStock" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor={CHART_COLORS.primary.base} stopOpacity={0.1}/>
                                    <stop offset="95%" stopColor={CHART_COLORS.primary.base} stopOpacity={0}/>
                                 </linearGradient>
                              </defs>
                              <Area type="monotone" dataKey="val" stroke={CHART_COLORS.primary.base} strokeWidth={2} fillOpacity={0.5} fill="url(#draStock)" />
                           </AreaChart>
                        </ResponsiveContainer>
                     </div>
                  </div>

                  <div className="grid grid-cols-2 gap-6 pt-4">
                     {[
                       { l: t("inv.table.stock"), v: `${selectedProduct.stock} U`, f: true },
                       { l: t("inv.detail.demand"), v: `${selectedProduct.avgDailyDemand}/H`, f: true },
                       { l: t("inv.detail.price"), v: formatRupiah(selectedProduct.price), f: true },
                       { l: t("inv.detail.vendor"), v: selectedProduct.supplier, f: false },
                     ].map((it, i) => (
                       <div key={i} className="space-y-0.5">
                          <p className={cn(T.label, "text-slate-500")}>{it.l}</p>
                          <p className={cn(T.dataEmphasis, "text-slate-900 dark:text-slate-200 truncate", !it.f && "font-sans")}>{it.v}</p>
                       </div>
                     ))}
                  </div>
               </div>

               <div className="pt-6 border-t border-slate-100 dark:border-slate-800 flex gap-3">
                  <button
                    onClick={() => setStockUpdateProduct(selectedProduct)}
                    className={cn(T.buttonSm, R.sm, E.glowSuccess, "flex-1 py-3 bg-emerald-500 text-white hover:bg-emerald-600 transition-all cursor-pointer")}
                  >
                    {t("inv.drawer.restock")}
                  </button>
                  <button
                    onClick={() => { setProductFormMode("edit"); setEditingProduct(selectedProduct); setProductFormOpen(true); }}
                    className={cn(R.sm, "px-4 py-3 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-800/50 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-all cursor-pointer")}
                  >
                    <Edit2 className="size-4" />
                  </button>
                  <button onClick={() => setShareModalOpen(true)} className={cn(R.sm, "px-4 py-3 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-700 transition-all cursor-pointer")}>
                    <Share2 className="size-4" />
                  </button>
               </div>
          </div>
        </>
      )}

      {selectedProduct && (
        <ExportShareModal 
          isOpen={shareModalOpen}
          onClose={() => setShareModalOpen(false)}
          data={{
            title: `Log: ${selectedProduct.name}`,
            type: "product",
            content: `Stok: ${selectedProduct.stock}. DOI: ${getDaysLeft(selectedProduct)} Hari. Status: ${getStatus(selectedProduct)}.`,
            productName: selectedProduct.name,
            urgency: getDaysLeft(selectedProduct) < 3 ? "tinggi" : "sedang"
          }}
        />
      )}

      {/* Product Form Modal (Add / Edit) */}
{productFormOpen && (
  <ProductForm
    mode={productFormMode}
    initialData={editingProduct ? {
      name: editingProduct.name,
      category: editingProduct.category,
      price: editingProduct.price,
      stock: editingProduct.stock,
      unit: INVENTORY_UNITS[0],
      minThreshold: editingProduct.minStock,
      description: "",
    } : undefined}
    onClose={() => setProductFormOpen(false)}
    onSubmit={async (data: ProductFormData) => {
      if (isDemoDataEnabled()) {
        setProductFormOpen(false);
        toast.success(productFormMode === "add" ? t("inv.toast.added") : t("inv.toast.updated"));
        return;
      }

      const storeNbr = currentUser?.storeNbr ?? 1;

      if (productFormMode === "add") {
        const createdProduct = await invClient.createProduct({
          sku: data.sku,
          name: data.name,
          family: data.family,
          category: data.category,
          unit: data.unit,
          base_price: data.price,
          default_price: data.price,
          cost_price: data.price * 0.8,
          supplier: data.supplier || undefined,
        });

        await invClient.createInventoryStock({
          product_id: createdProduct.id,
          store_nbr: storeNbr,
          current_stock: data.stock,
          min_stock: data.minThreshold,
          max_stock: data.stock * 3,
          reorder_point: data.minThreshold,
          location: "Gudang Utama",
        });

        toast.success(t("inv.toast.added"));
      } else if (editingProduct) {
        await invClient.updateProduct(editingProduct.id, {
          name: data.name,
          category: data.category,
          unit: data.unit,
          base_price: data.price,
          default_price: data.price,
          cost_price: data.price * 0.8,
          supplier: data.supplier || undefined,
        });

        toast.success(t("inv.toast.updated"));
      }

      const [stockItems, summary] = await Promise.all([
        invClient.fetchInventoryStock({ store_nbr: storeNbr, limit: 500 }),
        invClient.fetchStockSummary(storeNbr),
      ]);

      setApiProducts(stockItems.map(mapBackendInventory));
      setApiSummary(summary);
      setProductFormOpen(false);
    }}
  />
)}

      {/* Stock Update Modal */}
      {stockUpdateProduct && (
        <StockUpdateModal
          product={{
            id: stockUpdateProduct.id,
            name: stockUpdateProduct.name,
            sku: stockUpdateProduct.sku,
            currentStock: stockUpdateProduct.stock,
            unit: INVENTORY_UNITS[0],
          }}
          onClose={() => setStockUpdateProduct(null)}
          onSubmit={async (data) => {
            if (!isDemoDataEnabled() && stockUpdateProduct?.inventory_id) {
              const typeMap: Record<string, "IN" | "OUT" | "ADJUSTMENT"> = { in: "IN", out: "OUT", adjustment: "ADJUSTMENT" };
              const movType = typeMap[data.type] ?? "ADJUSTMENT";
              await invClient.recordStockMovement({
                inventory_id: stockUpdateProduct.inventory_id,
                movement_type: movType,
                quantity: Math.abs(data.quantity),
                reason: data.reason || t("inv.toast.stock_updated"),
                performed_by: currentUser?.id,
              });
              invClient.fetchInventoryStock({ store_nbr: currentUser?.storeNbr ?? undefined, limit: 500 })
                .then(items => setApiProducts(items.map(mapBackendInventory)));
            }
            setStockUpdateProduct(null);
            toast.success(t("inv.toast.stock_updated"));
          }}
        />
      )}

      {/* Stock History Modal */}
      {historyOpen && (
        <StockHistoryTable onClose={() => setHistoryOpen(false)} />
      )}

      {/* Stock Opname Modal */}
      {opnameOpen && (
        <StockOpnameModal
          products={allProducts.map(p => ({
            id: p.id,
            sku: p.sku,
            name: p.name,
            category: p.category,
            systemStock: p.stock,
          }))}
          onClose={() => setOpnameOpen(false)}
          onSubmit={(adjustments) => { void adjustments; setOpnameOpen(false); toast.success(t("inv.toast.opname")); }}
        />
      )}

      {/* Stock Transfer Modal */}
      {transferOpen && (
        <StockTransferModal
          products={allProducts.map(p => ({
            id: p.id,
            sku: p.sku,
            name: p.name,
            stock: p.stock,
          }))}
          onClose={() => setTransferOpen(false)}
          onSubmit={(data) => { void data; setTransferOpen(false); toast.success(t("inv.toast.transfer")); }}
        />
      )}

      <ExcelImportModal
        isOpen={importOpen}
        onClose={() => setImportOpen(false)}
        onImport={(rows: ImportProductRow[]) => {
          const newProducts: Product[] = rows.map((row, i) => ({
            id: `imp-${Date.now()}-${i}`,
            inventory_id: null,
            sku: row.sku,
            name: row.name,
            family: "",
            category: row.category,
            location: "—",
            stock: row.stock,
            minStock: row.minStock || 5,
            maxStock: row.stock * 3,
            reorderPoint: row.minStock || 5,
            supplier: row.supplier || "",
            lastRestock: new Date().toISOString().split("T")[0],
            price: row.price,
            avgDailyDemand: Math.max(1, Math.floor(row.stock / 15)),
            daysRemaining: Math.floor(row.stock / Math.max(1, Math.floor(row.stock / 15))),
            trend: [row.stock, row.stock, row.stock, row.stock, row.stock, row.stock, row.stock],
          }));
          setImportedProducts(prev => [...prev, ...newProducts]);
        }}
      />
    </div>
  );
}
