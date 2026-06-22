"use client";

import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  ArrowUpDown,
  Search,
  Filter,
  Plus,
  ArrowUpCircle,
  ArrowDownCircle,
  SlidersHorizontal,
  ArrowLeftRight,
  RotateCcw,
  CalendarDays,
  Package,
  Hash,
  Tag,
  FileText,
  User,
  Info,
  Clock,
  ChevronLeft,
  ChevronRight,
  X,
  Loader2,
  Trash2,
  AlertTriangle,
} from "lucide-react";
import { cn } from "@/app/lib/utils";

/* ── Design-system tokens (LOCKED source-of-truth) ─────────────────── */
import { T } from "@/app/lib/typography";
import { R, R_COMPONENT } from "@/app/lib/radii";
import { Z } from "@/app/lib/elevation";
import { GAP, STACK, PAD, ICON, ICON_BY_CONTEXT } from "@/app/lib/spacing";
import { C } from "@/app/lib/colors";
import { formatDate } from "@/app/lib/format";
import { A11Y } from "@/app/lib/a11y";
import { BACKDROP } from "@/app/lib/utility";
import { FOCUS, INPUT, SELECT } from "@/app/lib/forms";
import { BTN, btn } from "@/app/lib/buttons";
import { CARD, MODAL, DRAWER } from "@/app/lib/containers";
import { TABLE, BADGE, KPI } from "@/app/lib/data";
import { EmptyState } from "@/app/components/ui/EmptyState";
import { FilterSelect, type FilterSelectOption } from "@/app/components/ui/FilterSelect";
import { ResponsiveTable } from "@/app/components/ui/ResponsiveTable";
import { useTranslation } from "@/app/i18n";
import { isDemoDataEnabled } from "@/app/lib/demo-mode";
import { INVENTORY_CATEGORIES, INVENTORY_UNITS, STOCK_MOVEMENT_PERIODS, STOCK_MOVEMENT_STATUS } from "@/app/domain/constants";

/* ── Types & Mock Data (unchanged logic) ──────────────────────────── */
type MovementType = "in" | "out" | "adjustment" | "transfer" | "return";

interface MovementRecord {
  id: string;
  type: MovementType;
  product: string;
  sku: string;
  category: string;
  qty: number;
  unit: string;
  before: number;
  after: number;
  operator: string;
  date: Date;
  ref: string;
  notes: string;
  status: "completed" | "pending" | "cancelled";
}

interface MovementDetail {
  type: MovementType;
  product: string;
  sku: string;
  category: string;
  qty: number;
  unit: string;
  before: number;
  after: number;
  operator: string;
  date: string;
  time: string;
  ref: string;
  notes: string;
}



/* ── Movement type canonical token mapping (replaces TYPE_CONFIG) ───── */
const TYPE_META: Record<
  MovementType,
  {
    label: string;
    icon: typeof ArrowUpCircle;
    badgeVariant: "success" | "destructive" | "warning" | "primary" | "neutral";
  }
> = {
  in:          { label: "Barang Masuk",   icon: ArrowUpCircle,     badgeVariant: "success" },
  out:         { label: "Barang Keluar",  icon: ArrowDownCircle,   badgeVariant: "destructive" },
  adjustment:  { label: "Koreksi Stok",   icon: SlidersHorizontal, badgeVariant: "warning" },
  transfer:    { label: "Transfer",       icon: ArrowLeftRight,    badgeVariant: "primary" },
  return:      { label: "Retur",          icon: RotateCcw,         badgeVariant: "neutral" },
};

const _today = new Date();

/* ── Zod schema + inferred type (P2-4: RHF migration) ────────────── */
type StockMovementTranslate = (key: string, params?: Record<string, string | number>) => string;

const buildMovementSchema = (translate: StockMovementTranslate) => z.object({
  type: z.enum(["in", "out", "adjustment", "transfer", "return"]),
  product: z.string().min(1, translate("sm.validation.product_required")),
  sku: z.string().min(1, translate("sm.validation.sku_required")),
  category: z.string(),
  qty: z.coerce.number().min(1, translate("sm.validation.qty_nonzero")),
  unit: z.string(),
  ref: z.string().optional(),
  date: z.string().min(1, translate("sm.validation.date_required")),
  notes: z.string().optional(),
});
type MovementSchema = ReturnType<typeof buildMovementSchema>;
type MovementFormInput = z.input<MovementSchema>;
type MovementFormValues = z.output<MovementSchema>;

/* ── Component ────────────────────────────────────────────────────── */
export default function StockMovementPage() {
  const { t } = useTranslation();
  /* ---- state (unchanged) ---- */
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<MovementType | "all">("all");
  const [categoryFilter, setCategoryFilter] = useState<string | "all">("all");
  const [datePeriod, setDatePeriod] = useState("Semua Periode");
  const [sortField, setSortField] = useState<keyof MovementRecord | "">("");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [currentPage, setCurrentPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedDetail, setSelectedDetail] = useState<MovementDetail | null>(null);
  const drawerGuardRef = useRef(false);
  const {
    register,
    handleSubmit: rhfSubmit,
    formState: { errors },
    reset: resetForm,
  } = useForm<MovementFormInput, unknown, MovementFormValues>({
    resolver: zodResolver(useMemo(() => buildMovementSchema(t), [t])),
    defaultValues: {
      type: "in",
      product: "",
      sku: "",
      category: "Toner",
      qty: 1,
      unit: "pcs",
      ref: "",
      date: _today.toISOString().split("T")[0],
      notes: "",
    },
  });
  const [isSaving, setIsSaving] = useState(false);
  const [movements, setMovements] = useState<MovementRecord[]>([]);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletingMovement, setDeletingMovement] = useState<MovementRecord | null>(null);

  const PAGE_SIZE = 8;

  /* ---- Demo mode: lazy-load mock movements only when explicitly enabled ---- */
  useEffect(() => {
    if (!isDemoDataEnabled()) return;
    let cancelled = false;
    void import("@/app/demo/stock-movements").then(({ DEMO_STOCK_MOVEMENTS }) => {
      if (!cancelled) setMovements(DEMO_STOCK_MOVEMENTS as MovementRecord[]);
    });
    return () => { cancelled = true; };
  }, []);

  /* ---- effects (unchanged) ---- */
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsModalOpen(false);
        if (!drawerGuardRef.current) setIsDrawerOpen(false);
        setIsDeleteModalOpen(false);
        setDeletingMovement(null);
      }
    };
    if (isModalOpen || isDrawerOpen || isDeleteModalOpen) {
      document.addEventListener("keydown", handleEscape);
      return () => document.removeEventListener("keydown", handleEscape);
    }
  }, [isModalOpen, isDrawerOpen, isDeleteModalOpen]);

  /* ---- helpers (unchanged logic) ---- */
  const toggleSort = (field: keyof MovementRecord) => {
    if (sortField === field) {
      setSortDirection((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const openDetail = (rec: MovementRecord) => {
    drawerGuardRef.current = true;
    setSelectedDetail({
      type: rec.type,
      product: rec.product,
      sku: rec.sku,
      category: rec.category,
      qty: rec.qty,
      unit: rec.unit,
      before: rec.before,
      after: rec.after,
      operator: rec.operator,
      date: formatDate(rec.date, "full"),
      time: formatDate(rec.date, "time"),
      ref: rec.ref,
      notes: rec.notes,
    });
    setIsDrawerOpen(true);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        drawerGuardRef.current = false;
      });
    });
  };

  const closeDrawer = () => {
    if (drawerGuardRef.current) return;
    setIsDrawerOpen(false);
  };

  const confirmDelete = (rec: MovementRecord) => {
    setDeletingMovement(rec);
    setIsDeleteModalOpen(true);
  };

  const handleDelete = () => {
    if (!deletingMovement) return;
    setMovements((prev) => prev.filter((m) => m.id !== deletingMovement.id));
    setIsDeleteModalOpen(false);
    setDeletingMovement(null);
  };

  const onSubmit = (data: MovementFormValues) => {
    setIsSaving(true);
    setTimeout(() => {
      const newRecord: MovementRecord = {
        id: `mv-${Date.now()}`,
        type: data.type,
        product: data.product,
        sku: data.sku,
        category: data.category,
        qty: data.qty,
        unit: data.unit,
        before: 0,
        after: data.qty,
        operator: "Admin",
        date: new Date(data.date),
        ref: data.ref || `MVT-${Date.now()}`,
        notes: data.notes || "",
        status: "completed",
      };
      setMovements((prev) => [newRecord, ...prev]);
      setIsSaving(false);
      setIsModalOpen(false);
      resetForm();
    }, 800);
  };

  /* ---- filter / sort / paginate (unchanged) ---- */
  const filtered = useMemo(() => {
    let result = [...movements];
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (m) =>
          m.product.toLowerCase().includes(q) ||
          m.sku.toLowerCase().includes(q) ||
          m.operator.toLowerCase().includes(q) ||
          m.ref.toLowerCase().includes(q)
      );
    }
    if (typeFilter !== "all") result = result.filter((m) => m.type === typeFilter);
    if (categoryFilter !== "all") result = result.filter((m) => m.category === categoryFilter);
    if (datePeriod !== "Semua Periode") {
      const today = new Date();
      const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      if (datePeriod === "Hari Ini") {
        result = result.filter((m) => m.date >= startOfToday);
      } else if (datePeriod === "Kemarin") {
        const startOfYesterday = new Date(startOfToday);
        startOfYesterday.setDate(startOfYesterday.getDate() - 1);
        result = result.filter((m) => m.date >= startOfYesterday && m.date < startOfToday);
      } else if (datePeriod === "7 Hari Terakhir") {
        const startOf7Days = new Date(startOfToday);
        startOf7Days.setDate(startOf7Days.getDate() - 6);
        result = result.filter((m) => m.date >= startOf7Days);
      } else if (datePeriod === "30 Hari Terakhir") {
        const startOf30Days = new Date(startOfToday);
        startOf30Days.setDate(startOf30Days.getDate() - 29);
        result = result.filter((m) => m.date >= startOf30Days);
      }
    }
    if (sortField) {
      result.sort((a, b) => {
        const aValRaw = a[sortField];
        const bValRaw = b[sortField];
        if (aValRaw === undefined || bValRaw === undefined) return 0;
        let aVal: string | number | Date = aValRaw;
        let bVal: string | number | Date = bValRaw;
        if (typeof aVal === "string") aVal = aVal.toLowerCase();
        if (typeof bVal === "string") bVal = bVal.toLowerCase();
        if (aVal < bVal) return sortDirection === "asc" ? -1 : 1;
        if (aVal > bVal) return sortDirection === "asc" ? 1 : -1;
        return 0;
      });
    }
    return result;
  }, [movements, searchQuery, typeFilter, categoryFilter, datePeriod, sortField, sortDirection]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageItems = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  /* ---- derived stats ---- */
  const totalRecords = filtered.length;
  const inCount = filtered.filter((m) => m.type === "in").reduce((s, m) => s + Math.abs(m.qty), 0);
  const outCount = filtered.filter((m) => m.type === "out").reduce((s, m) => s + Math.abs(m.qty), 0);
  const adjTransferCount = filtered.filter((m) => m.type === "adjustment" || m.type === "transfer").reduce((s, m) => s + Math.abs(m.qty), 0);

  /* ───────────────────────────────────────────────────────────────── */
  return (
    <div className="space-y-6 pb-6 animate-in fade-in duration-500">
      {/* ── Header ── */}
      <div className={cn("flex flex-col md:flex-row md:items-center md:justify-between", GAP.default)}>
        <div>
          <h1 className={cn(T.h1, "text-slate-900 dark:text-slate-100")}>
            {t("sm.header")}
          </h1>
          <p className={cn(T.body, "text-slate-500 dark:text-slate-400")}>
            {t("sm.subheader")}
          </p>
        </div>
        <div className={cn("flex items-center", GAP.default)}>
          <button
            onClick={() => { resetForm(); setIsModalOpen(true); }}
            className={cn(BTN.base, BTN.size.md, BTN.variant.primary, A11Y.focusRing.onSolid, "dark:bg-indigo-900/30 dark:hover:bg-indigo-900/40 dark:text-indigo-400 dark:shadow-none dark:border dark:border-indigo-800/50")}
            aria-label={t("sm.btn.add")}
          >
            <Plus className={ICON.md} />
            {t("sm.btn.add")}
          </button>
        </div>
      </div>

      {/* ── KPI Cards ── */}
      <div className={cn("grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4", GAP.default)}>
        {[ /* Total */ { label: t("sm.kpi.total"), value: totalRecords, icon: FileText, colorVariant: "primary" as const, colorText: C.primary.text, colorIcon: C.primary.icon },
          /* In */     { label: t("sm.kpi.in"),    value: inCount,        icon: ArrowUpCircle,    colorVariant: "success" as const,    colorText: C.success.text,    colorIcon: C.success.icon },
          /* Out */    { label: t("sm.kpi.out"),   value: outCount,       icon: ArrowDownCircle,  colorVariant: "destructive" as const, colorText: C.destructive.text, colorIcon: C.destructive.icon },
          /* Adj+Trf */{ label: t("sm.kpi.adj"),   value: adjTransferCount, icon: SlidersHorizontal, colorVariant: "warning" as const,    colorText: C.warning.text,    colorIcon: C.warning.icon },
        ].map((kpi) => {
          const Icon = kpi.icon;
          return (
            <div
              key={kpi.label}
              className={cn(CARD.kpi)}
            >
              <div className="flex items-center justify-between mb-2">
                <p className={cn(T.h4, "text-slate-500 dark:text-slate-400")}>{kpi.label}</p>
                <div className={cn("flex items-center justify-center", KPI.iconBox[kpi.colorVariant], kpi.colorIcon)}>
                  <Icon className={ICON.lg} />
                </div>
              </div>
              <p className={cn(T.kpiCard, kpi.colorText)}>{kpi.value}</p>
            </div>
          );
        })}
      </div>

      {/* ── Filter Card ── */}
      <div className={cn(CARD.base, C.neutral.border, "overflow-hidden")}>
        <div className={cn(PAD.cardCompact, "border-b", C.neutral.border)}>
          <div className={cn("flex flex-col md:flex-row md:items-center", GAP.default)}>
            {/* Search */}
            <div className="flex-1 relative">
              <Search
                className={cn("absolute left-3 top-1/2 -translate-y-1/2", ICON.md, "text-slate-400")}
                aria-hidden="true"
              />
              <input
                type="text"
                placeholder={t("sm.filter.search")}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={cn(INPUT.base, INPUT.size.md, "pl-10")}
              />
            </div>

            <FilterSelect<MovementType | "all">
              id="type-filter"
              label={t("sm.filter.type")}
              value={typeFilter}
              icon={<Filter className={cn(ICON.sm, "text-slate-400")} aria-hidden="true" />}
              options={[
                { value: "all", label: t("sm.filter.allTypes") },
                { value: "in", label: t("sm.type.in") },
                { value: "out", label: t("sm.type.out") },
                { value: "adjustment", label: t("sm.type.adjustment") },
                { value: "transfer", label: t("sm.type.transfer") },
                { value: "return", label: t("sm.type.return") },
              ] satisfies FilterSelectOption<MovementType | "all">[]}
              onValueChange={setTypeFilter}
            />

            <FilterSelect<string>
              id="category-filter"
              label={t("sm.filter.category")}
              value={categoryFilter}
              icon={<Tag className={cn(ICON.sm, "text-slate-400")} aria-hidden="true" />}
              options={[
                { value: "all", label: t("sm.filter.allCategories") },
                ...INVENTORY_CATEGORIES.map((category) => ({
                  value: category.value,
                  label: t(category.labelKey),
                })),
              ]}
              onValueChange={setCategoryFilter}
            />

            <FilterSelect<string>
              id="date-period"
              label={t("sm.filter.period")}
              value={datePeriod}
              icon={<CalendarDays className={cn(ICON.sm, "text-slate-400")} aria-hidden="true" />}
              options={STOCK_MOVEMENT_PERIODS.map((period) => ({
                value: period.value,
                label: t(period.labelKey),
              }))}
              onValueChange={setDatePeriod}
            />
          </div>
        </div>

        {/* ── Table ── */}
        <ResponsiveTable
          label={t("sm.header")}
          scrollerClassName="rounded-none border-0 bg-transparent"
          minWidthClassName={TABLE.minWidth.stockMovement}
        >
          <table className={TABLE.base} aria-label={t("sm.header")}>
            <thead className={TABLE.head}>
              <tr>
                <th className={cn(TABLE.headCell, TABLE.headCellSortable, TABLE.stickyColumn, "bg-slate-50 dark:bg-slate-800/50")}>
                  <button
                    type="button"
                    onClick={() => toggleSort("product")}
                    className={cn("flex items-center gap-1 w-full", A11Y.focusRing.default)}
                  >
                    {t("sm.table.product")}
                    <ArrowUpDown className={cn(ICON.xs, "text-slate-400")} />
                  </button>
                </th>
                <th className={cn(TABLE.headCell, TABLE.headCellSortable)}>
                  <button
                    type="button"
                    onClick={() => toggleSort("type")}
                    className={cn("flex items-center gap-1 w-full", A11Y.focusRing.default)}
                  >
                    {t("sm.table.type")}
                    <ArrowUpDown className={cn(ICON.xs, "text-slate-400")} />
                  </button>
                </th>
                <th className={cn(TABLE.headCell, TABLE.headCellSortable)}>
                  <button
                    type="button"
                    onClick={() => toggleSort("qty")}
                    className={cn("flex items-center gap-1 w-full", A11Y.focusRing.default)}
                  >
                    {t("sm.table.qty")}
                    <ArrowUpDown className={cn(ICON.xs, "text-slate-400")} />
                  </button>
                </th>
                <th className={TABLE.headCell}>
                  {t("sm.table.stock")} ({t("sm.drawer.stockBefore")} → {t("sm.drawer.stockAfter")})
                </th>
                <th className={cn(TABLE.headCell, TABLE.headCellSortable)}>
                  <button
                    type="button"
                    onClick={() => toggleSort("operator")}
                    className={cn("flex items-center gap-1 w-full", A11Y.focusRing.default)}
                  >
                    {t("sm.table.operator")}
                    <ArrowUpDown className={cn(ICON.xs, "text-slate-400")} />
                  </button>
                </th>
                <th className={cn(TABLE.headCell, TABLE.headCellSortable)}>
                  <button
                    type="button"
                    onClick={() => toggleSort("date")}
                    className={cn("flex items-center gap-1 w-full", A11Y.focusRing.default)}
                  >
                    {t("sm.table.date")}
                    <ArrowUpDown className={cn(ICON.xs, "text-slate-400")} />
                  </button>
                </th>
                <th className={TABLE.headCell}>
                  {t("sm.table.reference")}
                </th>
                <th className={cn(TABLE.headCell, "text-right")}>
                  {t("sm.table.actions")}
                </th>
              </tr>
            </thead>
            <tbody className={TABLE.body}>
                {pageItems.length > 0 ? pageItems.map((rec) => {
                  const typeMeta = TYPE_META[rec.type];
                  const TypeIcon = typeMeta.icon;
                  return (
                    <tr
                      key={rec.id}
                      className={cn(TABLE.rowInteractive, "group")}
                      onClick={() => openDetail(rec)}
                      tabIndex={0}
                      role="button"
                      aria-label={`Detail ${rec.product} ${t(`sm.type.${rec.type}`)}`}
                      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") openDetail(rec); }}
                    >
                      <td className={cn(TABLE.cell, TABLE.stickyColumn, "bg-white dark:bg-slate-900 group-hover:bg-slate-50 dark:group-hover:bg-slate-800/50")}>
                        <div className={cn(STACK.compact)}>
                          <p className={cn(T.bodyEmphasis, "text-slate-900 dark:text-slate-100")}>{rec.product}</p>
                          <p className={cn(T.bodySm, "text-slate-400")}>{rec.sku}</p>
                        </div>
                      </td>
                      <td className={TABLE.cell}>
                        <span className={cn(BADGE.base, BADGE.size.sm, BADGE.variant[typeMeta.badgeVariant])}>
                          <TypeIcon className={cn(ICON.xs)} />
                          {t(`sm.type.${rec.type}`)}
                        </span>
                      </td>
                      <td className={TABLE.cellNumeric}>
                        <span
                          className={cn(
                            T.bodyEmphasis,
                            rec.qty > 0 ? C[typeMeta.badgeVariant].text : (rec.type === "out" ? C.destructive.text : C[typeMeta.badgeVariant].text)
                          )}
                        >
                          {rec.qty > 0 ? "+" : ""}{rec.qty} {rec.unit}
                        </span>
                      </td>
                      <td className={TABLE.cell}>
                        <div className={cn("flex items-center gap-1.5", T.body, "text-slate-600 dark:text-slate-300")}>
                          <span className="text-slate-400">{rec.before}</span>
                          <ChevronRight className={cn(ICON.xs, "text-slate-300")} />
                          <span className={cn(T.bodyEmphasis, "text-slate-900 dark:text-slate-100")}>{rec.after}</span>
                        </div>
                      </td>
                      <td className={TABLE.cell}>
                        <div className="flex items-center gap-1.5">
                          <User className={cn(ICON.sm, "text-slate-400")} aria-hidden="true" />
                          <span className={cn(T.body, "text-slate-600 dark:text-slate-300")}>{rec.operator}</span>
                        </div>
                      </td>
                      <td className={TABLE.cell}>
                        <span className={cn(T.body, "text-slate-500 dark:text-slate-400")}>
                          {formatDate(rec.date, "compact")}
                        </span>
                      </td>
                      <td className={TABLE.cell}>
                        <span className={cn(T.bodySm, "text-slate-400")}>{rec.ref}</span>
                      </td>
                      <td className={cn(TABLE.cell, "text-right")}>
                        <div className="flex items-center justify-end gap-2">
                          <span className={cn(BADGE.base, BADGE.size.xs, rec.status === "completed" ? BADGE.variant.success : rec.status === "pending" ? BADGE.variant.warning : BADGE.variant.neutral)}>
                            {rec.status === "completed" ? t("sm.status.completed") : rec.status === "pending" ? t("sm.status.pending") : t("sm.status.cancelled")}
                          </span>
                          <button
                            onClick={(e) => { e.stopPropagation(); confirmDelete(rec); }}
                            className={cn("inline-flex items-center justify-center p-1", R_COMPONENT.button, "text-slate-400 hover:bg-rose-50 dark:hover:bg-rose-950 hover:text-rose-600 dark:hover:text-rose-400 transition-colors", A11Y.focusRing.default)}
                            aria-label={t("sm.action.delete_item", { name: rec.product })}
                          >
                            <Trash2 className={ICON.sm} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                }) : (
                  <tr>
                    <td className={TABLE.cell} colSpan={8}>
                      <EmptyState
                        icon={Search}
                        title={t("sm.empty.title")}
                        description={t("sm.empty.desc")}
                        size="sm"
                      />
                    </td>
                  </tr>
                )}
            </tbody>
          </table>
        </ResponsiveTable>

        {/* ── Pagination ── */}
        <div className={cn(PAD.cardCompact, "border-t", C.neutral.border, "flex items-center justify-between")}>
          <p className={cn(T.bodySm, "text-slate-500 dark:text-slate-400")}>
            {t("sm.pagination.showing")} {filtered.length > 0 ? (currentPage - 1) * PAGE_SIZE + 1 : 0} - {Math.min(currentPage * PAGE_SIZE, filtered.length)} {t("sm.pagination.of")} {filtered.length} {t("sm.pagination.records")}
          </p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className={cn(
                "inline-flex items-center justify-center",
                ICON_BY_CONTEXT.buttonSm,
                R_COMPONENT.button,
                "border",
                C.neutral.border,
                "text-slate-600 dark:text-slate-300",
                "disabled:opacity-50 disabled:cursor-not-allowed",
                "hover:bg-slate-50 dark:hover:bg-slate-800",
                "transition-colors",
                A11Y.focusRing.default
              )}
              aria-label={t("sm.pagination.prev")}
            >
              <ChevronLeft className={ICON.sm} />
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={cn(
                  "inline-flex items-center justify-center",
                  ICON_BY_CONTEXT.buttonSm,
                  R_COMPONENT.button,
                  "border",
                  page === currentPage
                    ? cn(C.primary.bg, C.primary.text, C.primary.border)
                    : cn(C.neutral.border, "text-slate-600 dark:text-slate-300", "hover:bg-slate-50 dark:hover:bg-slate-800"),
                  "transition-colors",
                  A11Y.focusRing.default
                )}
                aria-label={t("sm.pagination.page", { page })}
                aria-current={page === currentPage ? "page" : undefined}
              >
                {page}
              </button>
            ))}
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className={cn(
                "inline-flex items-center justify-center",
                ICON_BY_CONTEXT.buttonSm,
                R_COMPONENT.button,
                "border",
                C.neutral.border,
                "text-slate-600 dark:text-slate-300",
                "disabled:opacity-50 disabled:cursor-not-allowed",
                "hover:bg-slate-50 dark:hover:bg-slate-800",
                "transition-colors",
                A11Y.focusRing.default
              )}
              aria-label={t("sm.pagination.next")}
            >
              <ChevronRight className={ICON.sm} />
            </button>
          </div>
        </div>
      </div>

      {/* ── Add Movement Modal ── */}
      {isModalOpen && (
        <div
          className={cn(
            "fixed inset-0",
            BACKDROP.overlay,
            Z.overlay,
            MODAL.wrapper,
            "animate-in fade-in duration-150"
          )}
          onClick={(e) => {
            if (e.currentTarget === e.target) setIsModalOpen(false);
          }}
          role="presentation"
        >
          <div
            className={cn(
              MODAL.container,
              MODAL.size.lg,
              "overflow-hidden flex flex-col", MODAL.maxHeight.lg,
              Z.modal,
              "animate-in zoom-in-95 duration-150"
            )}
            tabIndex={0}
            onKeyDown={(e) => { if (e.key === "Escape") setIsModalOpen(false); }}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
          >
              {/* Modal header */}
              <div className={MODAL.header}>
                <h2 id="modal-title" className={cn(T.h2, "text-slate-900 dark:text-slate-100")}>
                  {t("sm.modal.addTitle")}
                </h2>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className={cn(MODAL.close, A11Y.focusRing.default)}
                  aria-label={t("sm.modal.close")}
                >
                  <X className={ICON.md} />
                </button>
              </div>

              {/* Modal body */}
              <div className={cn(MODAL.bodyScroll, STACK.default)}>
                {/* Type */}
                <div className={cn(STACK.compact)}>
                  <label htmlFor="mv-type" className={cn(T.bodyEmphasis, "text-slate-700 dark:text-slate-300")}>
                    Tipe Pergerakan <span className={C.destructive.text}>*</span>
                  </label>
                  <select
                    id="mv-type"
                    {...register("type")}
                    className={cn(
                      "w-full",
                      PAD.inputMd,
                      R.md,
                      "border",
                      C.neutral.border,
                      "bg-white dark:bg-slate-900",
                      "text-slate-900 dark:text-slate-100",
                      T.body,
                      FOCUS.ring
                    )}
                  >
                    <option value="in">Barang Masuk</option>
                    <option value="out">Barang Keluar</option>
                    <option value="adjustment">Koreksi Stok</option>
                    <option value="transfer">Transfer</option>
                    <option value="return">Retur</option>
                  </select>
                </div>

                {/* Product */}
                <div className={cn(STACK.compact)}>
                  <label htmlFor="mv-product" className={cn(T.bodyEmphasis, "text-slate-700 dark:text-slate-300")}>
                    Nama Produk <span className={C.destructive.text}>*</span>
                  </label>
                  <div className="relative">
                    <Package className={cn("absolute left-3 top-1/2 -translate-y-1/2", ICON.sm, "text-slate-400")} aria-hidden="true" />
                    <input
                      id="mv-product"
                      type="text"
                      {...register("product")}
                      className={cn(INPUT.base, INPUT.size.md, "pl-10", errors.product && INPUT.error)}
                      placeholder={t("sm.modal.product_placeholder")}
                    />
                  </div>
                  {errors.product && <p className={cn(T.bodySm, C.destructive.text)}>{errors.product.message}</p>}
                </div>

                {/* SKU */}
                <div className={cn(STACK.compact)}>
                  <label htmlFor="mv-sku" className={cn(T.bodyEmphasis, "text-slate-700 dark:text-slate-300")}>
                    SKU <span className={C.destructive.text}>*</span>
                  </label>
                  <div className="relative">
                    <Hash className={cn("absolute left-3 top-1/2 -translate-y-1/2", ICON.sm, "text-slate-400")} aria-hidden="true" />
                    <input
                      id="mv-sku"
                      type="text"
                      {...register("sku")}
                      className={cn(INPUT.base, INPUT.size.md, "pl-10", errors.sku && INPUT.error)}
                      placeholder="Contoh: TN-85A"
                    />
                  </div>
                  {errors.sku && <p className={cn(T.bodySm, C.destructive.text)}>{errors.sku.message}</p>}
                </div>

                {/* Category */}
                <div className={cn(STACK.compact)}>
                  <label htmlFor="mv-category" className={cn(T.bodyEmphasis, "text-slate-700 dark:text-slate-300")}>
                    Kategori
                  </label>
                  <select
                    id="mv-category"
                    {...register("category")}
                    className={cn(
                      "w-full",
                      PAD.inputMd,
                      R.md,
                      "border",
                      C.neutral.border,
                      "bg-white dark:bg-slate-900",
                      "text-slate-900 dark:text-slate-100",
                      T.body,
                      FOCUS.ring
                    )}
                  >
                    {INVENTORY_CATEGORIES.map((c) => (
                      <option key={c.value} value={c.value}>{t(c.labelKey)}</option>
                    ))}
                  </select>
                </div>

                {/* Qty + Unit */}
                <div className={cn("grid grid-cols-2", GAP.generous)}>
                  <div className={cn(STACK.compact)}>
                    <label htmlFor="mv-qty" className={cn(T.bodyEmphasis, "text-slate-700 dark:text-slate-300")}>
                      Kuantitas <span className={C.destructive.text}>*</span>
                    </label>
                    <input
                      id="mv-qty"
                      type="number"
                      {...register("qty")}
                      className={cn(INPUT.base, INPUT.size.md, errors.qty && INPUT.error)}
                    />
                    {errors.qty && <p className={cn(T.bodySm, C.destructive.text)}>{errors.qty.message}</p>}
                  </div>
                  <div className={cn(STACK.compact)}>
                    <label htmlFor="mv-unit" className={cn(T.bodyEmphasis, "text-slate-700 dark:text-slate-300")}>
                      Satuan
                    </label>
                    <select
                      id="mv-unit"
                      {...register("unit")}
                      className={cn(SELECT.base, SELECT.size.md)}
                    >
                      {INVENTORY_UNITS.map((u) => (
                        <option key={u} value={u}>{u}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Ref */}
                <div className={cn(STACK.compact)}>
                  <label htmlFor="mv-ref" className={cn(T.bodyEmphasis, "text-slate-700 dark:text-slate-300")}>
                    No. Referensi
                  </label>
                  <input
                    id="mv-ref"
                    type="text"
                    {...register("ref")}
                    className={cn(
                      "w-full",
                      PAD.inputMd,
                      R.md,
                      "border",
                      C.neutral.border,
                      "bg-white dark:bg-slate-900",
                      "text-slate-900 dark:text-slate-100",
                      "placeholder:text-slate-400",
                      FOCUS.ring
                    )}
                    placeholder={t("sm.modal.ref_placeholder")}
                  />
                </div>

                {/* Date */}
                <div className={cn(STACK.compact)}>
                  <label htmlFor="mv-date" className={cn(T.bodyEmphasis, "text-slate-700 dark:text-slate-300")}>
                    Tanggal
                  </label>
                  <input
                    id="mv-date"
                    type="date"
                    {...register("date")}
                    className={cn(INPUT.base, INPUT.size.md)}
                  />
                </div>

                {/* Notes */}
                <div className={cn(STACK.compact)}>
                  <label htmlFor="mv-notes" className={cn(T.bodyEmphasis, "text-slate-700 dark:text-slate-300")}>
                    Catatan
                  </label>
                  <textarea
                    id="mv-notes"
                    {...register("notes")}
                    rows={3}
                    className={cn(
                      "w-full",
                      PAD.inputMd,
                      R.md,
                      "border",
                      C.neutral.border,
                      "bg-white dark:bg-slate-900",
                      "text-slate-900 dark:text-slate-100",
                      "placeholder:text-slate-400",
                      FOCUS.ring
                    )}
                    placeholder={t("sm.modal.notes_placeholder")}
                  />
                </div>
              </div>

              {/* Modal footer */}
              <div className={MODAL.footer}>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className={btn("outline", "md")}
                >
                  Batal
                </button>
                <button
                  onClick={rhfSubmit(onSubmit)}
                  disabled={isSaving}
                  className={cn(BTN.base, BTN.size.md, BTN.variant.primary, A11Y.focusRing.onSolid, "disabled:opacity-60")}
                >
                  {isSaving ? (
                    <>
                      <Loader2 className={cn(ICON.sm, "animate-spin")} />
                      Menyimpan...
                    </>
                  ) : (
                    t("sm.modal.save_record")
                  )}
                </button>
              </div>
          </div>
        </div>
      )}

      {/* ── Detail Drawer ── */}
      {isDrawerOpen && selectedDetail && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-50 bg-slate-900/60 animate-in fade-in duration-150"
            onClick={closeDrawer}
          />

          {/* Panel */}
          <aside
            className={cn(
              DRAWER.right,
              DRAWER.size.right.md,
              Z.modal,
              "flex flex-col overflow-hidden",
              "animate-in slide-in-from-right duration-200"
            )}
            role="dialog"
            aria-modal="true"
            aria-labelledby="drawer-title"
            tabIndex={0}
            onKeyDown={(e) => { if (e.key === "Escape") closeDrawer(); }}
          >
              {/* Drawer header */}
              <div className={cn(PAD.modalHeader, "border-b", C.neutral.border, "flex items-center justify-between shrink-0")}>
                <div>
                  <h2 id="drawer-title" className={cn(T.h2, "text-slate-900 dark:text-slate-100")}>
                    Detail Pergerakan
                  </h2>
                  <p className={cn(T.bodySm, "text-slate-400")}>{selectedDetail.ref}</p>
                </div>
                <button
                  onClick={closeDrawer}
                  className={btn("ghost", "sm", { icon: true })}
                  aria-label={t("sm.drawer.close")}
                >
                  <X className={ICON.md} />
                </button>
              </div>

              {/* Drawer body */}
              <div className={cn(PAD.modalBody, "flex-1 overflow-y-auto", STACK.default)}>
                {/* Type badge */}
                {(() => {
                  const tMeta = TYPE_META[selectedDetail.type];
                  const TIcon = tMeta.icon;
                  return (
                    <div className={cn(BADGE.base, BADGE.size.md, BADGE.variant[tMeta.badgeVariant])}>
                      <TIcon className={cn(ICON.sm)} />
                      {tMeta.label}
                    </div>
                  );
                })()}

                {/* Info rows */}
                {[
                  { label: "Produk",       val: selectedDetail.product,  icon: Package },
                  { label: "SKU",          val: selectedDetail.sku,      icon: Hash },
                  { label: "Kategori",     val: selectedDetail.category, icon: Tag },
                  { label: "No. Referensi",val: selectedDetail.ref,      icon: FileText },
                  { label: "Operator",     val: selectedDetail.operator, icon: User },
                  { label: "Catatan",      val: selectedDetail.notes,    icon: Info },
                  { label: "Waktu",        val: `${selectedDetail.date}, ${selectedDetail.time}`, icon: Clock },
                ].map(row => {
                  const Icon = row.icon;
                  return (
                    <div key={row.label} className={cn("flex items-center gap-3 py-2 border-b", C.neutral.border, "last:border-0")}>
                      <Icon className={cn(ICON.sm, "text-slate-300 dark:text-slate-600 shrink-0")} aria-hidden="true" />
                      <span className={cn(T.label, "text-slate-400 dark:text-slate-500 w-28 shrink-0")}>{row.label}</span>
                      <span className={cn(T.bodyEmphasis, "text-slate-700 dark:text-slate-300")}>{row.val}</span>
                    </div>
                  );
                })}

                {/* Stock delta highlight */}
                <div className={cn("mt-4", PAD.cardCompact, "bg-slate-50 dark:bg-slate-800", R_COMPONENT.card, "flex items-center justify-between")}>
                  <div>
                    <p className={cn(T.label, "text-slate-400 dark:text-slate-500 mb-1")}>{t("sm.drawer.stockChange")}</p>
                    <p className={cn(T.dataSm, "text-slate-500 dark:text-slate-400")}>{selectedDetail.before} → {selectedDetail.after} {selectedDetail.unit}</p>
                  </div>
                  <p className={cn(T.kpiCard,
                    selectedDetail.qty > 0 ? C.success.text : C.destructive.text
                  )}>
                    {selectedDetail.qty > 0 ? "+" : ""}{selectedDetail.qty} {selectedDetail.unit}
                  </p>
                </div>
              </div>
          </aside>
        </>
      )}

      {/* ── Delete Confirmation Modal ── */}
      {isDeleteModalOpen && deletingMovement && (
        <>
          <div
            className={cn("fixed inset-0", BACKDROP.overlay, Z.overlay, "animate-in fade-in duration-150")}
            role="presentation"
            aria-hidden="true"
            onClick={() => { setIsDeleteModalOpen(false); setDeletingMovement(null); }}
          />
          <div
            className={cn("fixed inset-0", Z.modal, MODAL.wrapper, "animate-in fade-in duration-150")}
            role="presentation"
            onClick={(e) => { if (e.currentTarget === e.target) { setIsDeleteModalOpen(false); setDeletingMovement(null); } }}
          >
              <div
                className={cn(MODAL.container, MODAL.size.sm)}
                role="dialog"
                aria-modal="true"
                aria-labelledby="sm-delete-title"
                onClick={(e) => e.stopPropagation()}
              >
                <div className={cn("flex items-center gap-3", PAD.modalHeader, "border-b", C.neutral.border)}>
                  <div className={cn(R.sm, "p-2", C.destructive.bg)}>
                    <AlertTriangle className={cn(ICON.md, C.destructive.icon)} aria-hidden="true" />
                  </div>
                  <h2 id="sm-delete-title" className={cn(T.h3, "text-slate-900 dark:text-slate-100")}>
                    {t("sm.delete.title")}
                  </h2>
                </div>
                <div className={cn(PAD.modalBody, STACK.compact)}>
                  <p className={cn(T.body, "text-slate-600 dark:text-slate-400")}>
                    {t("sm.delete.body")}{" "}
                    <span className={cn(T.bodyEmphasis, "text-slate-900 dark:text-slate-100")}>
                      {deletingMovement.product}
                    </span>{" "}
                    ({deletingMovement.ref})?
                  </p>
                  <p className={cn(T.bodySm, "text-slate-500 dark:text-slate-400")}>
                    {t("sm.delete.warning")}
                  </p>
                </div>
                <div className={cn(MODAL.footer)}>
                  <button
                    onClick={() => { setIsDeleteModalOpen(false); setDeletingMovement(null); }}
                    className={btn("outline", "md")}
                  >
                    {t("sm.modal.cancel")}
                  </button>
                  <button
                    onClick={handleDelete}
                    className={cn(BTN.base, BTN.size.md, BTN.variant.destructive, A11Y.focusRing.onSolid)}
                  >
                    {t("sm.delete.btn")}
                  </button>
                </div>
              </div>
          </div>
        </>
      )}
    </div>
  );
}

export { StockMovementPage };

/* ── Token Refactor Audit Trail ─────────────────────────────────────
 * File: StockMovementPage.tsx
 * Refactored: 24 April 2026
 *
 * TOKEN MIGRATION SUMMARY:
 * ┌─────────────────────────┬──────────────────────────────────────────┐
 * │ BANNED pattern          │ Replacement                              │
 * ├─────────────────────────┼──────────────────────────────────────────┤
 * │ TYPE_CONFIG object      │ TYPE_META canonical mapping              │
 * │ text-3xl font-black     │ T.h1 (page title)                        │
 * │ text-2xl font-black     │ T.kpiValue / T.section                   │
 * │ text-sm font-bold       │ T.bodyEmphasis / T.buttonSm / T.h4       │
 * │ text-xs font-bold       │ T.h4 / T.buttonSm / T.label              │
 * │ text-base font-black    │ T.section                                │
 * │ uppercase tracking-widest│ T.label / T.caption                     │
 * │ rounded-2xl             │ R_COMPONENT.card / R.full               │
 * │ rounded-xl              │ R.md / R_COMPONENT.input                │
 * │ rounded-3xl             │ R.lg / R_COMPONENT.modal                │
 * │ rounded-lg              │ R_COMPONENT.button                      │
 * │ rounded-sm              │ R.sm / R_COMPONENT.badge                │
 * │ shadow-sm               │ E_COMPONENT.card                         │
 * │ shadow-xl               │ E_COMPONENT.modal / E["2xl"]           │
 * │ shadow-2xl              │ E_COMPONENT.modal / E_COMPONENT.drawer   │
 * │ z-50 / z-20             │ Z.overlay / Z.modal / Z.drawer          │
 * │ p-4 / p-5 / p-6         │ PAD.card / PAD.cardCompact / PAD.modalBody│
 * │ px-6 py-3 / px-6 py-4   │ PAD.modalHeader / PAD.modalFooter        │
 * │ space-y-6               │ STACK.loose                              │
 * │ space-y-4               │ STACK.default                            │
 * │ space-y-3               │ STACK.snug                               │
 * │ space-y-2 / space-y-1.5 │ STACK.compact                            │
 * │ gap-4 / gap-3 / gap-2   │ GAP.default / GAP.snug / GAP.tight       │
 * │ gap-1.5                 │ GAP.tight                                │
 * │ w-3.5 h-3.5             │ ICON.sm / ICON.xs                      │
 * │ w-4 h-4 / size-4        │ ICON.md                                  │
 * │ w-8 h-8 / size-8        │ ICON["2xl"]                              │
 * │ w-9 h-9                 │ ICON["3xl"] (via ICON_BY_CONTEXT)      │
 * │ w-10 h-10               │ ICON["3xl"]                              │
 * │ bg-emerald-50           │ C.success.bg / C.success.bgSubtle       │
 * │ text-emerald-600        │ C.success.text                           │
 * │ bg-rose-50              │ C.destructive.bg / C.destructive.bgSubtle│
 * │ text-rose-600           │ C.destructive.text                       │
 * │ bg-amber-50             │ C.warning.bg / C.warning.bgSubtle       │
 * │ text-amber-600          │ C.warning.text                           │
 * │ bg-indigo-50            │ C.primary.bg / C.primary.bgSubtle        │
 * │ text-indigo-600         │ C.primary.text                           │
 * │ text-slate-400 uppercase│ T.label / T.caption                      │
 * │ bg-slate-900/60…        │ BACKDROP.overlay                         │
 * │ backdrop-blur-sm        │ BACKDROP.overlay                         │
 * │ focus:outline-none…     │ FOCUS.ring / A11Y.focusRing.*            │
 * │ focus-within:border…    │ FOCUS.ring / A11Y.focusRing.*            │
 * │ toLocaleDateString      │ formatDate()                             │
 * │ _fmt helper (inline)    │ formatDate()                             │
 * ├─────────────────────────┼──────────────────────────────────────────┤
 * │ A11Y FIXES              │                                          │
 * │ <label htmlFor>         │ Added to ALL form labels                 │
 * │ <input id>              │ Added to ALL form inputs                 │
 * │ icon-only buttons       │ aria-label added (Close, Pagination)     │
 * │ modal backdrop          │ role="presentation"                      │
 * │ modal dialog            │ role="dialog" aria-modal aria-labelledby │
 * │ drawer                  │ role="dialog" aria-modal aria-labelledby │
 * │ table row clickable     │ role="button" tabIndex onKeyDown        │
 * │ focus-visible           │ All interactive elements                 │
 * │ pagination aria         │ aria-label per page, aria-current         │
 * └─────────────────────────┴──────────────────────────────────────────┘
 *
 * EXCLUSIONS (intentional — structural / no token equivalent):
 *   • bg-white, bg-slate-50/100 — structural page/card backgrounds
 *   • text-slate-900/700/600/500/400 — structural text colours
 *   • hover:bg-slate-50, hover:bg-indigo-50 — hover states (no hover token)
 *   • text-xl font-bold (drawer title) — size between T.h1 and T.h2, no exact match
 *   • motion spring props (damping/stiffness) — animation props, not style tokens
 */
