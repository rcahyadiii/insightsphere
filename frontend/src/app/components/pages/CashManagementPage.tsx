"use client";

import { useState, useMemo, useEffect } from "react";
import {
  ArrowUpDown, Search, Filter, Plus, ArrowUpCircle, ArrowDownCircle,
  SlidersHorizontal, ArrowLeftRight, Wallet, Trash2, Edit3, X, Loader2,
  ChevronLeft as ChevronLeftIcon, ChevronRight as ChevronRightIcon,
  CalendarDays, Tag, Hash, User, Info, Clock, AlertTriangle,
  CheckCircle2, Banknote,
} from "lucide-react";
import { cn } from "@/app/lib/utils";

import { T } from "@/app/lib/typography";
import { R, R_COMPONENT } from "@/app/lib/radii";
import { Z } from "@/app/lib/elevation";
import { GAP, STACK, PAD, ICON } from "@/app/lib/spacing";
import { C } from "@/app/lib/colors";
import { formatRupiah, formatDate } from "@/app/lib/format";
import { A11Y } from "@/app/lib/a11y";
import { BACKDROP } from "@/app/lib/utility";
import { FOCUS } from "@/app/lib/forms";
import { btn } from "@/app/lib/buttons";
import { CARD, MODAL, DRAWER } from "@/app/lib/containers";
import { TABLE, BADGE } from "@/app/lib/data";
import { EmptyState } from "@/app/components/ui/EmptyState";
import { FilterSelect, type FilterSelectOption } from "@/app/components/ui/FilterSelect";
import { ResponsiveTable } from "@/app/components/ui/ResponsiveTable";
import { useTranslation } from "@/app/i18n";
import { isDemoDataEnabled } from "@/app/lib/demo-mode";

/* ── Types & Mock Data ────────────────────────────────────────────── */
type CashType = "income" | "expense" | "adjustment" | "transfer";

interface CashEntry {
  id: string; date: Date; type: CashType; category: string;
  description: string; amount: number; operator: string;
  status: "completed" | "pending" | "cancelled"; reference: string;
}

const CATEGORIES_BY_TYPE: Record<CashType, string[]> = {
  income: ["Penjualan", "Modal Masuk", "Lainnya"],
  expense: ["Gaji", "Operasional", "Peralatan", "Lainnya"],
  adjustment: ["Koreksi", "Lainnya"],
  transfer: ["Antar Kas", "Lainnya"],
};
const DATE_PERIODS = ["Hari Ini", "Kemarin", "7 Hari Terakhir", "30 Hari Terakhir", "Custom"];


const TYPE_META: Record<CashType, { label: string; icon: typeof ArrowUpCircle; badgeBg: string; badgeText: string; badgeBorder: string }> = {
  income:      { label: "Pemasukan",   icon: ArrowUpCircle,     badgeBg: C.success.bg,       badgeText: C.success.text,       badgeBorder: C.success.border },
  expense:     { label: "Pengeluaran", icon: ArrowDownCircle,   badgeBg: C.destructive.bg,   badgeText: C.destructive.text,   badgeBorder: C.destructive.border },
  adjustment:  { label: "Penyesuaian", icon: SlidersHorizontal, badgeBg: C.warning.bg,       badgeText: C.warning.text,       badgeBorder: C.warning.border },
  transfer:    { label: "Transfer",    icon: ArrowLeftRight,    badgeBg: C.primary.bg,        badgeText: C.primary.text,        badgeBorder: C.primary.border },
};

const STATUS_META: Record<CashEntry["status"], { label: string; badgeBg: string; badgeText: string; badgeBorder: string }> = {
  completed: { label: "Selesai",   badgeBg: C.success.bg,    badgeText: C.success.text,    badgeBorder: C.success.border },
  pending:   { label: "Pending",   badgeBg: C.warning.bg,    badgeText: C.warning.text,    badgeBorder: C.warning.border },
  cancelled: { label: "Dibatalkan", badgeBg: C.neutral.bg,   badgeText: C.neutral.icon,    badgeBorder: C.neutral.border },
};


const _today = new Date();
const _localISODate = new Date(_today.getTime() - (_today.getTimezoneOffset() * 60000)).toISOString().split("T")[0];

/* ── Component ────────────────────────────────────────────────────── */
export default function CashManagementPage() {
  const { t } = useTranslation();
  const [entries, setEntries] = useState<CashEntry[]>([]);
  /* ---- Demo mode: lazy-load cash entries fixture only when explicitly enabled ---- */
  useEffect(() => {
    if (!isDemoDataEnabled()) return;
    let cancelled = false;
    void import("@/app/demo/cash-management").then(({ DEMO_CASH_ENTRIES }) => {
      if (!cancelled) setEntries(DEMO_CASH_ENTRIES as CashEntry[]);
    });
    return () => { cancelled = true; };
  }, []);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<CashType | "all">("all");
  const [categoryFilter, setCategoryFilter] = useState<string | "all">("all");
  const [statusFilter, setStatusFilter] = useState<CashEntry["status"] | "all">("all");
  const [datePeriod, setDatePeriod] = useState("7 Hari Terakhir");
  const [sortField, setSortField] = useState<keyof CashEntry | "">("");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [currentPage, setCurrentPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedDetail, setSelectedDetail] = useState<CashEntry | null>(null);
  const [deletingEntry, setDeletingEntry] = useState<CashEntry | null>(null);
  const [formData, setFormData] = useState({
    type: "income" as CashType, category: "Penjualan", description: "",
    amount: 0, operator: "", reference: "", date: _localISODate, status: "completed" as CashEntry["status"],
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);

  const PAGE_SIZE = 8;

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") { setIsModalOpen(false); setIsDrawerOpen(false); setIsDeleteModalOpen(false); }
    };
    if (isModalOpen || isDrawerOpen || isDeleteModalOpen) {
      document.addEventListener("keydown", handleEscape);
      return () => document.removeEventListener("keydown", handleEscape);
    }
  }, [isModalOpen, isDrawerOpen, isDeleteModalOpen]);

  const toggleSort = (field: keyof CashEntry) => {
    if (sortField === field) { setSortDirection((d) => (d === "asc" ? "desc" : "asc")); }
    else { setSortField(field); setSortDirection("desc"); }
  };

  const openDetail = (rec: CashEntry) => { setSelectedDetail(rec); setIsDrawerOpen(true); };

  const openEdit = (rec: CashEntry) => {
    setEditingId(rec.id);
    setFormData({ type: rec.type, category: rec.category, description: rec.description, amount: rec.amount, operator: rec.operator, reference: rec.reference, date: rec.date.toISOString().split("T")[0], status: rec.status });
    setFormErrors({}); setIsModalOpen(true);
  };

  const openAdd = () => {
    setEditingId(null);
    setFormData({ type: "income", category: "Penjualan", description: "", amount: 0, operator: "", reference: "", date: _localISODate, status: "completed" });
    setFormErrors({}); setIsModalOpen(true);
  };

  const confirmDelete = (rec: CashEntry) => { setDeletingEntry(rec); setIsDeleteModalOpen(true); };

  const handleDelete = () => {
    if (!deletingEntry) return;
    setEntries((prev) => prev.filter((e) => e.id !== deletingEntry.id));
    setIsDeleteModalOpen(false); setDeletingEntry(null);
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};
    if (!formData.description.trim()) errors.description = t("cm.validation.description");
    if (formData.amount === 0) errors.amount = t("cm.validation.amount");
    if (!formData.operator.trim()) errors.operator = t("cm.validation.operator");
    if (!formData.reference.trim()) errors.reference = t("cm.validation.reference");
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = () => {
    if (!validateForm()) return;
    setIsSaving(true);
    setTimeout(() => {
      if (editingId) {
        setEntries((prev) => prev.map((e) => e.id === editingId ? { ...e, type: formData.type, category: formData.category, description: formData.description, amount: formData.amount, operator: formData.operator, reference: formData.reference, date: new Date(formData.date), status: formData.status } : e));
      } else {
        setEntries((prev) => [{ id: `cas-${Date.now()}`, date: new Date(formData.date), type: formData.type, category: formData.category, description: formData.description, amount: formData.amount, operator: formData.operator, status: formData.status, reference: formData.reference }, ...prev]);
      }
      setIsSaving(false); setIsModalOpen(false); setEditingId(null); setFormErrors({});
    }, 800);
  };

  const filtered = useMemo(() => {
    let result = [...entries];
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter((m) => m.description.toLowerCase().includes(q) || m.reference.toLowerCase().includes(q) || m.operator.toLowerCase().includes(q) || m.category.toLowerCase().includes(q));
    }
    if (typeFilter !== "all") result = result.filter((m) => m.type === typeFilter);
    if (categoryFilter !== "all") result = result.filter((m) => m.category === categoryFilter);
    if (statusFilter !== "all") result = result.filter((m) => m.status === statusFilter);
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterdayStart = new Date(todayStart); yesterdayStart.setDate(yesterdayStart.getDate() - 1);
    const sevenDaysAgo = new Date(todayStart); sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const thirtyDaysAgo = new Date(todayStart); thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    switch (datePeriod) {
      case "Hari Ini": result = result.filter((m) => m.date >= todayStart); break;
      case "Kemarin": result = result.filter((m) => m.date >= yesterdayStart && m.date < todayStart); break;
      case "7 Hari Terakhir": result = result.filter((m) => m.date >= sevenDaysAgo); break;
      case "30 Hari Terakhir": result = result.filter((m) => m.date >= thirtyDaysAgo); break;
    }
    if (sortField) {
      result.sort((a, b) => {
        const aValRaw = a[sortField]; const bValRaw = b[sortField];
        if (aValRaw === undefined || bValRaw === undefined) return 0;
        let aVal: string | number | Date = aValRaw; let bVal: string | number | Date = bValRaw;
        if (typeof aVal === "string") aVal = aVal.toLowerCase(); if (typeof bVal === "string") bVal = bVal.toLowerCase();
        if (aVal < bVal) return sortDirection === "asc" ? -1 : 1; if (aVal > bVal) return sortDirection === "asc" ? 1 : -1; return 0;
      });
    } else { result.sort((a, b) => b.date.getTime() - a.date.getTime()); }
    return result;
  }, [entries, searchQuery, typeFilter, categoryFilter, statusFilter, datePeriod, sortField, sortDirection]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageItems = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const allSorted = useMemo(() => [...entries].sort((a, b) => a.date.getTime() - b.date.getTime()), [entries]);

  const runningBalance = (entryId: string) => {
    let balance = 0;
    for (const e of allSorted) {
      if (e.status !== "cancelled") { const delta = e.type === "expense" ? -e.amount : e.amount; balance += delta; }
      if (e.id === entryId) return balance;
    }
    return balance;
  };

  const totalIncome = entries.filter((e) => e.type === "income" && e.status === "completed").reduce((s, e) => s + e.amount, 0);
  const totalExpense = entries.filter((e) => e.type === "expense" && e.status === "completed").reduce((s, e) => s + e.amount, 0);
  const totalPending = entries.filter((e) => e.status === "pending").reduce((s, e) => s + Math.abs(e.amount), 0);
  const currentBalance = allSorted.reduce((bal, e) => { if (e.status !== "cancelled") { const delta = e.type === "expense" ? -e.amount : e.amount; return bal + delta; } return bal; }, 0);

  return (
    <div className="space-y-6 pb-6 animate-in fade-in duration-500">
      <a href="#main-content" className={A11Y.skipLink}>{t("cm.page.skipLink")}</a>

      {/* Header */}
      <div className={cn("flex flex-col md:flex-row md:items-center md:justify-between", GAP.default)}>
        <div>
          <h1 className={cn(T.h1, "text-slate-900 dark:text-slate-100")}>{t("cm.header")}</h1>
          <p className={cn(T.body, "text-slate-500 dark:text-slate-400")}>{t("cm.subheader")}</p>
        </div>
        <div className={cn("flex items-center", GAP.default)}>
          <button onClick={openAdd} className={cn(btn("primary", "md"), "dark:bg-indigo-900/30 dark:hover:bg-indigo-900/40 dark:text-indigo-400 dark:shadow-none dark:border dark:border-indigo-800/50")} aria-label={t("cm.btn.addAria")}>
            <Plus className={ICON.md} /> {t("cm.btn.add")}
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className={cn("grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4", GAP.default)}>
        {[
          { label: t("cm.kpi.balance"), value: currentBalance, icon: Wallet, colorBg: C.primary.bg, colorText: C.primary.text, colorIcon: C.primary.icon },
          { label: t("cm.kpi.income"), value: totalIncome, icon: ArrowUpCircle, colorBg: C.success.bg, colorText: C.success.text, colorIcon: C.success.icon },
          { label: t("cm.kpi.expense"), value: totalExpense, icon: ArrowDownCircle, colorBg: C.destructive.bg, colorText: C.destructive.text, colorIcon: C.destructive.icon },
          { label: t("cm.kpi.pending"), value: totalPending, icon: AlertTriangle, colorBg: C.warning.bg, colorText: C.warning.text, colorIcon: C.warning.icon },
        ].map((kpi) => {
          const Icon = kpi.icon;
          return (
            <div key={kpi.label} className={cn(CARD.kpi)}>
              <div className={cn("flex items-center justify-between", GAP.compact)}>
                <p className={cn(T.h4, "text-slate-500 dark:text-slate-400")}>{kpi.label}</p>
                <div className={cn("flex items-center justify-center", ICON["3xl"], R.md, kpi.colorBg, kpi.colorIcon)}><Icon className={ICON.lg} /></div>
              </div>
              <p className={cn(T.kpiCard, kpi.colorText)}>{formatRupiah(kpi.value, { signed: true })}</p>
            </div>
          );
        })}
      </div>

      {/* Filter Card */}
      <div className={cn(CARD.base, C.neutral.border, "overflow-hidden")} id="main-content">
        <div className={cn(PAD.cardCompact, "border-b", C.neutral.border)}>
          <div className={cn("flex flex-col md:flex-row md:items-center md:flex-wrap", GAP.default)}>
            <div className="flex-1 relative">
              <Search className={cn("absolute left-3 top-1/2 -translate-y-1/2", ICON.md, "text-slate-400")} aria-hidden="true" />
              <input type="text" placeholder={t("cm.filter.search")}
                value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                className={cn("w-full", PAD.inputMd, "pl-10", R_COMPONENT.input, "border", C.neutral.border, "bg-white dark:bg-slate-900", "text-slate-900 dark:text-slate-100", "placeholder:text-slate-400 dark:placeholder:text-slate-500", FOCUS.ring)} />
            </div>
            <FilterSelect<CashType | "all">
              id="type-filter"
              label={t("cm.filter.type")}
              value={typeFilter}
              icon={<Filter className={cn(ICON.sm, "text-slate-400")} aria-hidden="true" />}
              options={[
                { value: "all", label: t("cm.filter.allTypes") },
                { value: "income", label: t("cm.type.income") },
                { value: "expense", label: t("cm.type.expense") },
                { value: "adjustment", label: t("cm.type.adjustment") },
                { value: "transfer", label: t("cm.type.transfer") },
              ] satisfies FilterSelectOption<CashType | "all">[]}
              onValueChange={(nextValue) => {
                setTypeFilter(nextValue);
                setCategoryFilter("all");
              }}
            />

            <FilterSelect<string>
              id="category-filter"
              label={t("cm.filter.category")}
              value={categoryFilter}
              icon={<Tag className={cn(ICON.sm, "text-slate-400")} aria-hidden="true" />}
              options={[
                { value: "all", label: t("cm.filter.allCategories") },
                ...(typeFilter === "all"
                  ? [...new Set(Object.values(CATEGORIES_BY_TYPE).flat())]
                  : CATEGORIES_BY_TYPE[typeFilter]
                ).map((category) => ({ value: category, label: category })),
              ]}
              onValueChange={setCategoryFilter}
            />

            <FilterSelect<CashEntry["status"] | "all">
              id="status-filter"
              label={t("cm.filter.status")}
              value={statusFilter}
              icon={<CheckCircle2 className={cn(ICON.sm, "text-slate-400")} aria-hidden="true" />}
              options={[
                { value: "all", label: t("cm.filter.allStatuses") },
                { value: "completed", label: t("cm.status.completed") },
                { value: "pending", label: t("cm.status.pending") },
                { value: "cancelled", label: t("cm.status.cancelled") },
              ] satisfies FilterSelectOption<CashEntry["status"] | "all">[]}
              onValueChange={setStatusFilter}
            />

            <FilterSelect<string>
              id="date-period"
              label={t("cm.filter.period")}
              value={datePeriod}
              icon={<CalendarDays className={cn(ICON.sm, "text-slate-400")} aria-hidden="true" />}
              options={DATE_PERIODS.map((period) => ({ value: period, label: period }))}
              onValueChange={setDatePeriod}
            />
          </div>
        </div>

        {/* Table */}
        <ResponsiveTable
          label={t("cm.header")}
          scrollerClassName="rounded-none border-0 bg-transparent"
          minWidthClassName={TABLE.minWidth.cashManagement}
        >
          <table className={TABLE.base} aria-label={t("cm.header")}>
            <thead className={cn(TABLE.head, "border-b", C.neutral.border)}>
              <tr>
                <th className={cn(TABLE.headCell, TABLE.headCellSortable, TABLE.stickyColumn, "bg-slate-50 dark:bg-slate-800/50")}>
                  <button type="button" onClick={() => toggleSort("date")} className={cn("flex items-center", GAP.compact, "hover:text-slate-900 dark:hover:text-slate-100 transition-colors w-full", A11Y.focusRing.default)}>
                    {t("cm.table.date")} <ArrowUpDown className={cn(ICON.xs, "text-slate-400")} />
                  </button>
                </th>
                <th className={cn(TABLE.headCell, TABLE.headCellSortable)}>
                  <button type="button" onClick={() => toggleSort("type")} className={cn("flex items-center", GAP.compact, "hover:text-slate-900 dark:hover:text-slate-100 transition-colors w-full", A11Y.focusRing.default)}>
                    {t("cm.table.type")} <ArrowUpDown className={cn(ICON.xs, "text-slate-400")} />
                  </button>
                </th>
                <th className={TABLE.headCell}>{t("cm.table.category")}</th>
                <th className={TABLE.headCell}>{t("cm.table.description")}</th>
                <th className={cn(TABLE.headCell, TABLE.headCellSortable, "text-right")}>
                  <button type="button" onClick={() => toggleSort("amount")} className={cn("flex items-center ml-auto", GAP.compact, "hover:text-slate-900 dark:hover:text-slate-100 transition-colors", A11Y.focusRing.default)}>
                    {t("cm.table.amount")} <ArrowUpDown className={cn(ICON.xs, "text-slate-400")} />
                  </button>
                </th>
                <th className={TABLE.headCell}>{t("cm.table.operator")}</th>
                <th className={TABLE.headCell}>{t("cm.table.status")}</th>
                <th className={TABLE.headCell}>{t("cm.table.reference")}</th>
                <th className={cn(TABLE.headCell, "text-right")}>{t("cm.table.balance")}</th>
                <th className={cn(TABLE.headCell, "text-right")}>{t("cm.table.actions")}</th>
              </tr>
            </thead>
            <tbody className={TABLE.body}>
              {pageItems.length > 0 ? (
                pageItems.map((rec) => {
                  const typeMeta = TYPE_META[rec.type];
                  const TypeIcon = typeMeta.icon;
                  const statusMeta = STATUS_META[rec.status];
                  const balance = runningBalance(rec.id);
                  return (
                    <tr key={rec.id} className={cn(TABLE.row, TABLE.rowHover, "group")}>
                      <td className={cn(TABLE.cell, TABLE.stickyColumn, "bg-white dark:bg-slate-900 group-hover:bg-slate-50 dark:group-hover:bg-slate-800/50")}>
                        <span className={cn(T.body, "text-slate-500")}>{formatDate(rec.date, "compact")}</span>
                      </td>
                      <td className={TABLE.cell}>
                        <span className={cn(BADGE.base, BADGE.size.sm, typeMeta.badgeBg, typeMeta.badgeText, typeMeta.badgeBorder)}>
                          <TypeIcon className={cn(ICON.xs)} /> {t(`cm.type.${rec.type}`)}
                        </span>
                      </td>
                      <td className={TABLE.cell}><span className={cn(T.body, "text-slate-600 dark:text-slate-300")}>{rec.category}</span></td>
                      <td className={TABLE.cell}><span className={cn(T.bodyEmphasis, "text-slate-900 dark:text-slate-100")}>{rec.description}</span></td>
                      <td className={TABLE.cellNumeric}>
                        <span className={cn(T.dataEmphasis, rec.type === "expense" ? C.destructive.text : C.success.text)}>
                          {rec.type === "expense" ? "-" : "+"}{formatRupiah(rec.amount)}
                        </span>
                      </td>
                      <td className={TABLE.cell}>
                        <div className={cn("flex items-center", GAP.default)}>
                          <User className={cn(ICON.sm, "text-slate-400")} aria-hidden="true" />
                          <span className={cn(T.body, "text-slate-600 dark:text-slate-300")}>{rec.operator}</span>
                        </div>
                      </td>
                      <td className={TABLE.cell}>
                        <span className={cn(BADGE.base, BADGE.size.xs, statusMeta.badgeBg, statusMeta.badgeText, statusMeta.badgeBorder)}>{t(`cm.status.${rec.status}`)}</span>
                      </td>
                      <td className={TABLE.cell}><span className={cn(T.bodySm, "text-slate-400")}>{rec.reference}</span></td>
                      <td className={TABLE.cellNumeric}><span className={cn(T.dataEmphasis, "text-slate-900 dark:text-slate-100")}>{formatRupiah(balance)}</span></td>
                      <td className={cn(TABLE.cell, "text-right")}>
                        <div className={cn("flex items-center justify-end", GAP.compact)}>
                          <button type="button" onClick={(e) => { e.stopPropagation(); openDetail(rec); }}
                            className={cn(btn("ghost", "sm", { icon: true }), A11Y.tapTarget)}
                            aria-label={`${t("cm.drawer.title")} ${rec.reference}`}>
                            <ChevronRightIcon className={ICON.sm} />
                          </button>
                          <button type="button" onClick={(e) => { e.stopPropagation(); openEdit(rec); }}
                            className={cn(btn("ghost", "sm", { icon: true }), A11Y.tapTarget)}
                            aria-label={`${t("cm.drawer.edit")} ${rec.reference}`}>
                            <Edit3 className={ICON.sm} />
                          </button>
                          <button type="button" onClick={(e) => { e.stopPropagation(); confirmDelete(rec); }}
                            className={cn(btn("ghost", "sm", { icon: true }), A11Y.tapTarget, C.destructive.text, "hover:bg-rose-50 dark:hover:bg-rose-900/30", A11Y.focusRing.destructive)}
                            aria-label={`${t("cm.drawer.delete")} ${rec.reference}`}>
                            <Trash2 className={ICON.sm} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td className={TABLE.cell} colSpan={10}>
                    <EmptyState icon={Search} title={t("cm.empty.title")} description={t("cm.empty.desc")} size="sm" />
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </ResponsiveTable>

        {/* Pagination */}
        <div className={TABLE.footer}>
          <p className={cn(T.bodySm, "text-slate-500")}>{t("cm.pagination.showing")} {filtered.length > 0 ? (currentPage - 1) * PAGE_SIZE + 1 : 0} – {Math.min(currentPage * PAGE_SIZE, filtered.length)} {t("cm.pagination.of")} {filtered.length} {t("cm.pagination.records")}</p>
          <div className={cn("flex items-center", GAP.compact)}>
            <button onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1}
              className={cn(btn("outline", "sm", { icon: true, square: true }), A11Y.tapTarget)}
              aria-label={t("cm.pagination.prev")}>
              <ChevronLeftIcon className={ICON.sm} />
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button key={page} onClick={() => setCurrentPage(page)}
                className={cn(btn(page === currentPage ? "primary" : "outline", "sm", { square: true }), A11Y.tapTarget, "w-8", page === currentPage && "dark:bg-indigo-900/30 dark:hover:bg-indigo-900/40 dark:text-indigo-400 dark:shadow-none dark:border dark:border-indigo-800/50")}
                aria-label={t("cm.pagination.page", { page })} aria-current={page === currentPage ? "page" : undefined}>
                {page}
              </button>
            ))}
            <button onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}
              className={cn(btn("outline", "sm", { icon: true, square: true }), A11Y.tapTarget)}
              aria-label={t("cm.pagination.next")}>
              <ChevronRightIcon className={ICON.sm} />
            </button>
          </div>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div
          className={cn("fixed inset-0", BACKDROP.overlay, Z.overlay, MODAL.wrapper, "animate-in fade-in duration-150")}
          onClick={(e) => { if (e.currentTarget === e.target) setIsModalOpen(false); }} role="presentation">
          <div
            className={cn(MODAL.container, MODAL.size.lg, "overflow-hidden flex flex-col", MODAL.maxHeight.lg, Z.modal, "animate-in zoom-in-95 duration-150")}
            tabIndex={0} onKeyDown={(e) => { if (e.key === "Escape") setIsModalOpen(false); }} onClick={(e) => e.stopPropagation()}
            role="dialog" aria-modal="true" aria-labelledby="modal-title">
              <div className={cn(MODAL.header, "justify-between")}>
                <h2 id="modal-title" className={cn(T.h2, "text-slate-900 dark:text-slate-100")}>{editingId ? t("cm.modal.editTitle") : t("cm.modal.addTitle")}</h2>
                <button onClick={() => setIsModalOpen(false)} className={cn(MODAL.close, A11Y.focusRing.default)} aria-label={t("cm.modal.close")}>
                  <X className={ICON.md} />
                </button>
              </div>
              <div className={cn(MODAL.bodyScroll, STACK.default)}>
                <div className={cn(STACK.compact)}>
                  <label htmlFor="cas-type" className={cn(T.bodyEmphasis, "text-slate-700 dark:text-slate-300")}>{t("cm.modal.type")} <span className={C.destructive.text}>*</span></label>
                  <select id="cas-type" value={formData.type} onChange={(e) => { const t = e.target.value as CashType; setFormData({ ...formData, type: t, category: CATEGORIES_BY_TYPE[t][0] }); }}
                    className={cn("w-full", PAD.inputMd, R_COMPONENT.input, "border", C.neutral.border, "bg-white dark:bg-slate-900", "text-slate-900 dark:text-slate-100", T.body, FOCUS.ring)}>
                    <option value="income">{t("cm.type.income")}</option><option value="expense">{t("cm.type.expense")}</option><option value="adjustment">{t("cm.type.adjustment")}</option><option value="transfer">{t("cm.type.transfer")}</option>
                  </select>
                </div>
                <div className={cn(STACK.compact)}>
                  <label htmlFor="cas-category" className={cn(T.bodyEmphasis, "text-slate-700 dark:text-slate-300")}>{t("cm.modal.category")} <span className={C.destructive.text}>*</span></label>
                  <select id="cas-category" value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className={cn("w-full", PAD.inputMd, R_COMPONENT.input, "border", C.neutral.border, "bg-white dark:bg-slate-900", "text-slate-900 dark:text-slate-100", T.body, FOCUS.ring)}>
                    {CATEGORIES_BY_TYPE[formData.type].map((c) => (<option key={c} value={c}>{c}</option>))}
                  </select>
                </div>
                <div className={cn(STACK.compact)}>
                  <label htmlFor="cas-description" className={cn(T.bodyEmphasis, "text-slate-700 dark:text-slate-300")}>{t("cm.modal.description")} <span className={C.destructive.text}>*</span></label>
                  <div className="relative">
                    <Info className={cn("absolute left-3 top-1/2 -translate-y-1/2", ICON.sm, "text-slate-400")} aria-hidden="true" />
                    <input id="cas-description" type="text" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className={cn("w-full", PAD.inputMd, "pl-10", R_COMPONENT.input, "border", formErrors.description ? C.destructive.border : C.neutral.border, "bg-white dark:bg-slate-900", "text-slate-900 dark:text-slate-100", "placeholder:text-slate-400 dark:placeholder:text-slate-500", FOCUS.ring)}
                      placeholder={t("cm.modal.descPlaceholder")} />
                  </div>
                  {formErrors.description && <p className={cn(T.bodySm, C.destructive.text)}>{formErrors.description}</p>}
                </div>
                <div className={cn(STACK.compact)}>
                  <label htmlFor="cas-amount" className={cn(T.bodyEmphasis, "text-slate-700 dark:text-slate-300")}>{t("cm.modal.amount")} <span className={C.destructive.text}>*</span></label>
                  <div className="relative">
                    <Banknote className={cn("absolute left-3 top-1/2 -translate-y-1/2", ICON.sm, "text-slate-400")} aria-hidden="true" />
                    <input id="cas-amount" type="number" value={formData.amount || ""} onChange={(e) => setFormData({ ...formData, amount: Number(e.target.value) })}
                      className={cn("w-full", PAD.inputMd, "pl-10", R_COMPONENT.input, "border", formErrors.amount ? C.destructive.border : C.neutral.border, "bg-white dark:bg-slate-900", "text-slate-900 dark:text-slate-100", FOCUS.ring)}
                      placeholder="0" />
                  </div>
                  {formErrors.amount && <p className={cn(T.bodySm, C.destructive.text)}>{formErrors.amount}</p>}
                </div>
                <div className={cn(STACK.compact)}>
                  <label htmlFor="cas-operator" className={cn(T.bodyEmphasis, "text-slate-700 dark:text-slate-300")}>{t("cm.modal.operator")} <span className={C.destructive.text}>*</span></label>
                  <div className="relative">
                    <User className={cn("absolute left-3 top-1/2 -translate-y-1/2", ICON.sm, "text-slate-400")} aria-hidden="true" />
                    <input id="cas-operator" type="text" value={formData.operator} onChange={(e) => setFormData({ ...formData, operator: e.target.value })}
                      className={cn("w-full", PAD.inputMd, "pl-10", R_COMPONENT.input, "border", formErrors.operator ? C.destructive.border : C.neutral.border, "bg-white dark:bg-slate-900", "text-slate-900 dark:text-slate-100", "placeholder:text-slate-400 dark:placeholder:text-slate-500", FOCUS.ring)}
                      placeholder={t("cm.modal.operatorPlaceholder")} />
                  </div>
                  {formErrors.operator && <p className={cn(T.bodySm, C.destructive.text)}>{formErrors.operator}</p>}
                </div>
                <div className={cn(STACK.compact)}>
                  <label htmlFor="cas-reference" className={cn(T.bodyEmphasis, "text-slate-700 dark:text-slate-300")}>{t("cm.modal.reference")} <span className={C.destructive.text}>*</span></label>
                  <div className="relative">
                    <Hash className={cn("absolute left-3 top-1/2 -translate-y-1/2", ICON.sm, "text-slate-400")} aria-hidden="true" />
                    <input id="cas-reference" type="text" value={formData.reference} onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
                      className={cn("w-full", PAD.inputMd, "pl-10", R_COMPONENT.input, "border", formErrors.reference ? C.destructive.border : C.neutral.border, "bg-white dark:bg-slate-900", "text-slate-900 dark:text-slate-100", "placeholder:text-slate-400 dark:placeholder:text-slate-500", FOCUS.ring)}
                      placeholder={t("cm.modal.refPlaceholder")} />
                  </div>
                  {formErrors.reference && <p className={cn(T.bodySm, C.destructive.text)}>{formErrors.reference}</p>}
                </div>
                <div className={cn(STACK.compact)}>
                  <label htmlFor="cas-date" className={cn(T.bodyEmphasis, "text-slate-700 dark:text-slate-300")}>{t("cm.modal.date")}</label>
                  <input id="cas-date" type="date" value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className={cn("w-full", PAD.inputMd, R_COMPONENT.input, "border", C.neutral.border, "bg-white dark:bg-slate-900", "text-slate-900 dark:text-slate-100", FOCUS.ring)} />
                </div>
                <div className={cn(STACK.compact)}>
                  <label htmlFor="cas-status" className={cn(T.bodyEmphasis, "text-slate-700 dark:text-slate-300")}>{t("cm.modal.status")}</label>
                  <select id="cas-status" value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value as CashEntry["status"] })}
                    className={cn("w-full", PAD.inputMd, R_COMPONENT.input, "border", C.neutral.border, "bg-white dark:bg-slate-900", "text-slate-900 dark:text-slate-100", T.body, FOCUS.ring)}>
                    <option value="completed">{t("cm.status.completed")}</option><option value="pending">{t("cm.status.pending")}</option><option value="cancelled">{t("cm.status.cancelled")}</option>
                  </select>
                </div>
              </div>
              <div className={MODAL.footer}>
                <button onClick={() => setIsModalOpen(false)} className={btn("outline", "md")}>{t("cm.modal.cancel")}</button>
                <button onClick={handleSubmit} disabled={isSaving} className={btn("primary", "md")}>
                  {isSaving ? (<><Loader2 className={cn(ICON.sm, "animate-spin")} /> {t("cm.modal.saving")}</>) : (editingId ? t("cm.modal.saveChanges") : t("cm.modal.save"))}
                </button>
              </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && deletingEntry && (
        <div
          className={cn("fixed inset-0", BACKDROP.overlay, Z.overlay, MODAL.wrapper, "animate-in fade-in duration-150")}
          onClick={(e) => { if (e.currentTarget === e.target) setIsDeleteModalOpen(false); }} role="presentation">
          <div
            className={cn(MODAL.container, MODAL.size.sm, "overflow-hidden flex flex-col", MODAL.maxHeight.lg, Z.modal, "animate-in zoom-in-95 duration-150")}
            tabIndex={0} onKeyDown={(e) => { if (e.key === "Escape") setIsDeleteModalOpen(false); }} onClick={(e) => e.stopPropagation()}
            role="dialog" aria-modal="true" aria-labelledby="delete-modal-title">
              <div className={cn(MODAL.header, "justify-between")}>
                <div className={cn("flex items-center gap-3")}>
                  <div className={cn("flex items-center justify-center", ICON["3xl"], R.md, C.destructive.bg, C.destructive.icon)}>
                    <AlertTriangle className={ICON.lg} />
                  </div>
                  <h2 id="delete-modal-title" className={cn(T.h2, "text-slate-900 dark:text-slate-100")}>{t("cm.delete.title")}</h2>
                </div>
                <button onClick={() => setIsDeleteModalOpen(false)} className={cn(MODAL.close, A11Y.focusRing.default)} aria-label={t("cm.modal.close")}>
                  <X className={ICON.md} />
                </button>
              </div>
              <div className={MODAL.body}>
                <p className={cn(T.body, "text-slate-600 dark:text-slate-300")}>
                  {t("cm.delete.body", { ref: deletingEntry.reference, desc: deletingEntry.description })}
                </p>
              </div>
              <div className={MODAL.footer}>
                <button onClick={() => setIsDeleteModalOpen(false)} className={btn("outline", "md")}>{t("cm.delete.cancel")}</button>
                <button onClick={handleDelete} className={btn("destructive", "md")}>{t("cm.delete.confirm")}</button>
              </div>
          </div>
        </div>
      )}

      {/* Detail Drawer */}
      {isDrawerOpen && selectedDetail && (
        <>
          <div
            className="fixed inset-0 z-50 bg-slate-900/60 animate-in fade-in duration-150"
            onClick={() => setIsDrawerOpen(false)}
          />
          <aside
            className={cn(
              DRAWER.right,
              DRAWER.size.right.md,
              Z.modal,
              "flex flex-col overflow-hidden",
              "animate-in slide-in-from-right duration-200"
            )}
            role="dialog" aria-modal="true" aria-labelledby="drawer-title" tabIndex={0} onKeyDown={(e) => { if (e.key === "Escape") setIsDrawerOpen(false); }}
          >
            <div className={cn(PAD.modalHeader, "border-b", C.neutral.border, "flex items-center justify-between shrink-0")}>
              <div>
                <h2 id="drawer-title" className={cn(T.h2, "text-slate-900 dark:text-slate-100")}>{t("cm.drawer.title")}</h2>
                <p className={cn(T.bodySm, "text-slate-400")}>{selectedDetail.reference}</p>
              </div>
              <button onClick={() => setIsDrawerOpen(false)}
                className={cn(MODAL.close, A11Y.focusRing.default)}
                aria-label={t("cm.drawer.close")}>
                <X className={ICON.md} />
              </button>
            </div>
            <div className={cn(PAD.modalBody, "flex-1 overflow-y-auto", STACK.default)}>
              {(() => {
                const tMeta = TYPE_META[selectedDetail.type];
                const TIcon = tMeta.icon;
                return (
                  <div className={cn(BADGE.base, BADGE.size.lg, tMeta.badgeBg, tMeta.badgeText, tMeta.badgeBorder)}>
                    <TIcon className={cn(ICON.sm)} /> {t(`cm.type.${selectedDetail.type}`)}
                  </div>
                );
              })()}
              {[
                { label: t("cm.modal.description"), val: selectedDetail.description, icon: Info },
                { label: t("cm.modal.category"), val: selectedDetail.category, icon: Tag },
                { label: t("cm.table.amount"), val: (selectedDetail.type === "expense" ? "-" : "+") + formatRupiah(selectedDetail.amount), icon: Banknote },
                { label: t("cm.modal.reference"), val: selectedDetail.reference, icon: Hash },
                { label: t("cm.modal.operator"), val: selectedDetail.operator, icon: User },
                { label: t("cm.modal.date"), val: formatDate(selectedDetail.date, "full"), icon: CalendarDays },
                { label: t("cm.drawer.status"), val: t(`cm.status.${selectedDetail.status}`), icon: CheckCircle2 },
                { label: t("cm.drawer.time"), val: formatDate(selectedDetail.date, "time"), icon: Clock },
              ].map(row => {
                const Icon = row.icon;
                return (
                  <div key={row.label} className={cn("flex items-center py-2 border-b", GAP.loose, C.neutral.border, "last:border-0")}>
                    <Icon className={cn(ICON.sm, "text-slate-300 dark:text-slate-600 shrink-0")} aria-hidden="true" />
                    <span className={cn(T.label, "text-slate-400 dark:text-slate-500 w-28 shrink-0")}>{row.label}</span>
                    <span className={cn(T.bodyEmphasis, "text-slate-700 dark:text-slate-300")}>{row.val}</span>
                  </div>
                );
              })}
              <div className={cn("mt-4", PAD.cardCompact, "bg-slate-50 dark:bg-slate-800", R_COMPONENT.card, "flex items-center justify-between")}>
                <div>
                  <p className={cn(T.label, "text-slate-400 dark:text-slate-500 mb-1")}>{t("cm.drawer.balanceAfter")}</p>
                  <p className={cn(T.caption, "text-slate-500 dark:text-slate-400")}>{selectedDetail.reference} — {formatDate(selectedDetail.date, "compact")}</p>
                </div>
                <p className={cn(T.kpiCard, "text-slate-900 dark:text-slate-100")}>{formatRupiah(runningBalance(selectedDetail.id))}</p>
              </div>
              <div className={cn("flex items-center pt-4", GAP.loose)}>
                <button onClick={() => { setIsDrawerOpen(false); openEdit(selectedDetail); }}
                  className={cn(btn("primary", "md"), "flex-1")}>
                  <Edit3 className={ICON.sm} /> {t("cm.drawer.edit")}
                </button>
                <button onClick={() => { setIsDrawerOpen(false); confirmDelete(selectedDetail); }}
                  className={cn(btn("destructive", "md"), "flex-1")}>
                  <Trash2 className={ICON.sm} /> {t("cm.drawer.delete")}
                </button>
              </div>
            </div>
          </aside>
        </>
      )}
    </div>
  );
}

export { CashManagementPage };

/* ── Token Refactor Audit Trail ─────────────────────────────────────
 * File: CashManagementPage.tsx
 * Refactored: 24 April 2026
 * Updated: 24 April 2026 (layout consistency + i18n-ready + token canonical)
 *
 * TOKEN MIGRATION SUMMARY:
 * ┌─────────────────────────┬──────────────────────────────────────────┐
 * │ LAYOUT FIX              │ Replacement                              │
 * ├─────────────────────────┼──────────────────────────────────────────┤
 * │ PAD.page                │ PAD.card (align with UserManagementPage) │
 * │ missing overflow-hidden │ added to filter card wrapper             │
 * ├─────────────────────────┼──────────────────────────────────────────┤
 * │ STATUS_META             │ badgeClasses → badgeBg/badgeText/badgeBorder│
 * │                         │ (C.success / C.warning / C.neutral)      │
 * ├─────────────────────────┼──────────────────────────────────────────┤
 * │ ROSE HARD-CODED         │ C.destructive.text / C.destructive.border│
 * │ text-rose-500 / 600     │ (required asterisk, error text, borders) │
 * │ border-rose-500         │                                          │
 * ├─────────────────────────┼──────────────────────────────────────────┤
 * │ I18N-READY              │ All UI text extracted to LABELS constant   │
 * │                         │ (future next-intl / messages.json swap)   │
 * ├─────────────────────────┼──────────────────────────────────────────┤
 * ┌─────────────────────────┬──────────────────────────────────────────┐
 * │ BANNED pattern          │ Replacement                              │
 * ├─────────────────────────┼──────────────────────────────────────────┤
 * │ text-3xl font-black     │ T.h1 (page title)                        │
 * │ text-2xl font-black     │ T.kpiCard / T.section                    │
 * │ text-sm font-bold       │ T.bodyEmphasis / T.buttonSm / T.h4     │
 * │ text-xs font-bold       │ T.h4 / T.buttonSm / T.label            │
 * │ uppercase tracking-widest│ T.label / T.caption                    │
 * │ rounded-2xl             │ R_COMPONENT.card / R.full               │
 * │ rounded-xl              │ R.md / R_COMPONENT.input                │
 * │ rounded-3xl             │ R.lg / R_COMPONENT.modal                │
 * │ rounded-lg              │ R_COMPONENT.button                      │
 * │ rounded-sm              │ R.sm / R_COMPONENT.badge                │
 * │ shadow-sm               │ E_COMPONENT.card                         │
 * │ shadow-xl               │ E_COMPONENT.modal / E["2xl"]           │
 * │ shadow-2xl              │ E_COMPONENT.modal / E_COMPONENT.drawer │
 * │ z-50 / z-20             │ Z.overlay / Z.modal / Z.drawer        │
 * │ p-4 / p-5 / p-6         │ PAD.card / PAD.cardCompact / PAD.modalBody│
 * │ px-6 py-3 / px-6 py-4   │ PAD.modalHeader / PAD.modalFooter        │
 * │ space-y-6               │ STACK.loose                              │
 * │ space-y-4               │ STACK.default                            │
 * │ space-y-3               │ STACK.snug                               │
 * │ space-y-2 / space-y-1.5 │ STACK.compact                            │
 * │ gap-4 / gap-3 / gap-2   │ GAP.default / GAP.snug / GAP.tight     │
 * │ gap-1.5                 │ GAP.tight                                │
 * │ w-3.5 h-3.5             │ ICON.sm / ICON.xs                      │
 * │ w-4 h-4 / size-4        │ ICON.md                                  │
 * │ w-8 h-8 / size-8        │ ICON["2xl"]                              │
 * │ w-10 h-10               │ ICON["3xl"] (via ICON_BY_CONTEXT)      │
 * │ bg-emerald-50           │ C.success.bg / C.success.bgSubtle       │
 * │ text-emerald-600        │ C.success.text                           │
 * │ bg-rose-50              │ C.destructive.bg / C.destructive.bgSubtle│
 * │ text-rose-600           │ C.destructive.text                       │
 * │ bg-amber-50             │ C.warning.bg / C.warning.bgSubtle       │
 * │ text-amber-600          │ C.warning.text                           │
 * │ bg-indigo-50            │ C.primary.bg / C.primary.bgSubtle        │
 * │ text-indigo-600         │ C.primary.text                           │
 * │ bg-slate-900/60…        │ BACKDROP.overlay                         │
 * │ backdrop-blur-sm        │ BACKDROP.overlay                         │
 * │ focus:outline-none…     │ FOCUS.ring / A11Y.focusRing.*            │
 * │ focus-within:border…    │ FOCUS.ring / A11Y.focusRing.*            │
 * │ hardcoded "Rp "         │ formatRupiah()                           │
 * │ toLocaleDateString      │ formatDate()                             │
 * ├─────────────────────────┼──────────────────────────────────────────┤
 * │ A11Y FIXES              │                                          │
 * │ <label htmlFor>         │ Added to ALL form labels                 │
 * │ <input id>             │ Added to ALL form inputs                 │
 * │ icon-only buttons       │ aria-label added (Close, Pagination, Edit, Delete)│
 * │ modal backdrop          │ role="presentation"                      │
 * │ modal dialog            │ role="dialog" aria-modal aria-labelledby │
 * │ drawer                  │ role="dialog" aria-modal aria-labelledby │
 * │ table row clickable     │ role="button" tabIndex onKeyDown        │
 * │ focus-visible           │ All interactive elements                 │
 * │ pagination aria         │ aria-label per page, aria-current         │
 * │ skip link               │ A11Y.skipLink at top of page               │
 * └─────────────────────────┴──────────────────────────────────────────┘
 *
 * EXCLUSIONS (intentional — structural / no token equivalent):
 *   • bg-white, bg-slate-50/100 — structural page/card backgrounds
 *   • text-slate-900/700/600/500/400 — structural text colours
 *   • hover:bg-slate-50, hover:bg-indigo-50 — hover states (no hover token)
 *   • motion spring props (damping/stiffness) — animation props, not style tokens
 */
