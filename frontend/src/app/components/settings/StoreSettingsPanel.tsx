"use client";

import { useCallback, useEffect, useState } from "react";
import { Edit2, Loader2, Plus, RefreshCcw, Search, Store, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { BranchDeactivateDialog } from "@/app/components/settings/BranchDeactivateDialog";
import { BranchFormModal } from "@/app/components/settings/BranchFormModal";
import { BTN, btn } from "@/app/lib/buttons";
import { C } from "@/app/lib/colors";
import { BADGE, TABLE } from "@/app/lib/data";
import { ERROR_TEXT, INPUT } from "@/app/lib/forms";
import { ICON } from "@/app/lib/spacing";
import { T } from "@/app/lib/typography";
import { cn } from "@/app/lib/utils";
import {
  createBranch,
  deactivateBranch,
  fetchBranches,
  updateBranch,
  type BranchCreateRequest,
  type BranchResponse,
  type BranchStatus,
} from "@/app/lib/branch-client";

type SettingsPanelProps = {
  t: (key: string, params?: Record<string, string | number>) => string;
};

const STATUS_OPTIONS: Array<{ value: BranchStatus; key: string }> = [
  { value: "active", key: "set.store.branches.active" },
  { value: "inactive", key: "set.store.branches.inactive" },
  { value: "all", key: "set.store.branches.all" },
];

function formatTime(value: string | null): string {
  if (!value) return "-";
  return value.slice(0, 5);
}

function formatHours(branch: BranchResponse): string {
  if (!branch.opening_time && !branch.closing_time) return "-";
  return `${formatTime(branch.opening_time)} - ${formatTime(branch.closing_time)}`;
}

function statusBadgeClass(isActive: boolean): string {
  return cn(
    BADGE.base,
    BADGE.size.sm,
    isActive ? BADGE.variant.success : BADGE.variant.neutral,
  );
}

export function StoreSettingsPanel({ t }: SettingsPanelProps) {
  const [status, setStatus] = useState<BranchStatus>("active");
  const [search, setSearch] = useState("");
  const [branches, setBranches] = useState<BranchResponse[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mutationError, setMutationError] = useState<string | null>(null);
  const [editingBranch, setEditingBranch] = useState<BranchResponse | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [deactivateTarget, setDeactivateTarget] = useState<BranchResponse | null>(null);

  const loadBranches = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchBranches({ status, search, limit: 100 });
      setBranches(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("set.store.branches.load_error"));
    } finally {
      setIsLoading(false);
    }
  }, [search, status, t]);

  useEffect(() => {
    void loadBranches();
  }, [loadBranches]);

  const openCreateForm = () => {
    setEditingBranch(null);
    setMutationError(null);
    setFormOpen(true);
  };

  const openEditForm = (branch: BranchResponse) => {
    setEditingBranch(branch);
    setMutationError(null);
    setFormOpen(true);
  };

  const openDeactivateDialog = (branch: BranchResponse) => {
    setDeactivateTarget(branch);
    setMutationError(null);
  };

  const closeForm = () => {
    setFormOpen(false);
    setEditingBranch(null);
    setMutationError(null);
  };

  const handleSubmitBranch = async (values: BranchCreateRequest) => {
    setIsSubmitting(true);
    setMutationError(null);
    try {
      if (editingBranch) {
        await updateBranch(editingBranch.id, values);
        toast.success(t("set.store.branches.updated"));
      } else {
        await createBranch(values);
        toast.success(t("set.store.branches.created"));
      }
      setFormOpen(false);
      setEditingBranch(null);
      await loadBranches();
    } catch (err) {
      setMutationError(err instanceof Error ? err.message : t("set.store.branches.save_error"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeactivateBranch = async () => {
    if (!deactivateTarget) return;
    setIsSubmitting(true);
    setMutationError(null);
    try {
      await deactivateBranch(deactivateTarget.id);
      toast.success(t("set.store.branches.deactivated"));
      setDeactivateTarget(null);
      await loadBranches();
    } catch (err) {
      setMutationError(err instanceof Error ? err.message : t("set.store.branches.blocked"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReactivateBranch = async (branch: BranchResponse) => {
    setIsSubmitting(true);
    setMutationError(null);
    try {
      await updateBranch(branch.id, { is_active: true });
      toast.success(t("set.store.branches.reactivated"));
      await loadBranches();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("set.store.branches.save_error"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderActions = (branch: BranchResponse) => (
    <div className="flex flex-wrap items-center gap-2">
      <button type="button" className={btn("ghost", "sm")} onClick={() => openEditForm(branch)}>
        <Edit2 className={ICON.sm} />
        {t("set.store.branches.edit")}
      </button>
      {branch.is_active ? (
        <button
          type="button"
          className={btn("destructiveSoft", "sm")}
          onClick={() => openDeactivateDialog(branch)}
        >
          <Trash2 className={ICON.sm} />
          {t("set.store.branches.deactivate")}
        </button>
      ) : (
        <button
          type="button"
          className={btn("successSoft", "sm")}
          onClick={() => void handleReactivateBranch(branch)}
          disabled={isSubmitting}
        >
          <RefreshCcw className={ICON.sm} />
          {t("set.store.branches.reactivate")}
        </button>
      )}
    </div>
  );

  return (
    <div className="flex-1 space-y-8 p-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-2">
          <h3 className={cn(T.h3, "flex items-center gap-3 text-slate-900 dark:text-slate-100")}>
            <Store className={cn(ICON.lg, C.primary.icon)} />
            {t("set.store.title")}
          </h3>
          <p className={cn(T.bodySm, "max-w-2xl text-slate-500 dark:text-slate-400")}>
            {t("set.store.desc")}
          </p>
        </div>
        <button type="button" onClick={openCreateForm} className={btn("primary", "md")}>
          <Plus className={ICON.sm} />
          {t("set.store.branches.add")}
        </button>
      </div>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div
          role="tablist"
          aria-label={t("set.store.branches.status")}
          className="inline-flex w-full rounded-xl border border-slate-200 bg-slate-50 p-1 dark:border-slate-700 dark:bg-slate-800/50 sm:w-auto"
        >
          {STATUS_OPTIONS.map((option) => {
            const isSelected = status === option.value;
            return (
              <button
                key={option.value}
                type="button"
                role="tab"
                aria-selected={isSelected}
                className={cn(
                  BTN.base,
                  BTN.size.sm,
                  "flex-1 rounded-lg shadow-none sm:flex-none",
                  isSelected
                    ? "bg-white text-indigo-700 dark:bg-slate-900 dark:text-indigo-300"
                    : "text-slate-500 hover:bg-white/70 dark:text-slate-400 dark:hover:bg-slate-900/50",
                )}
                onClick={() => setStatus(option.value)}
              >
                {t(option.key)}
              </button>
            );
          })}
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="relative min-w-0 sm:w-80">
            <Search className={cn("absolute left-3 top-1/2 -translate-y-1/2 text-slate-400", ICON.sm)} />
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={t("set.store.branches.search")}
              className={cn(INPUT.base, INPUT.size.md, "pl-10")}
            />
          </div>
          <button type="button" className={btn("outline", "md")} onClick={() => void loadBranches()} disabled={isLoading}>
            {isLoading ? <Loader2 className="animate-spin" /> : <RefreshCcw className={ICON.sm} />}
            {t("common.refresh")}
          </button>
        </div>
      </div>

      <div aria-live="polite" className="min-h-[220px] space-y-4">
        {error && (
          <div className="rounded-xl border border-rose-100 bg-rose-50 px-4 py-3 dark:border-rose-800/50 dark:bg-rose-900/20">
            <p role="alert" className={ERROR_TEXT.base}>
              {error}
            </p>
          </div>
        )}

        {isLoading && (
          <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
            <Loader2 className="size-4 animate-spin" />
            <span className={T.bodySm}>{t("common.loading")}</span>
          </div>
        )}

        {!isLoading && branches.length === 0 && (
          <div className="rounded-xl border border-dashed border-slate-300 px-5 py-8 text-center dark:border-slate-700">
            <p className={cn(T.bodySm, "text-slate-500 dark:text-slate-400")}>
              {t("set.store.branches.empty")}
            </p>
          </div>
        )}

        {!isLoading && branches.length > 0 && (
          <>
            <div className="hidden md:block overflow-x-auto rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
              <table className={cn(TABLE.base, TABLE.minWidth.settings)} aria-label={t("set.store.title")}>
                <thead className={TABLE.head}>
                  <tr>
                    <th className={TABLE.headCell}>{t("set.store.branches.store_nbr")}</th>
                    <th className={TABLE.headCell}>{t("set.store.branches.code")}</th>
                    <th className={TABLE.headCell}>{t("set.store.branches.name")}</th>
                    <th className={TABLE.headCell}>{t("set.store.branches.contact")}</th>
                    <th className={TABLE.headCell}>{t("set.store.branches.hours")}</th>
                    <th className={TABLE.headCell}>{t("set.store.branches.status")}</th>
                    <th className={TABLE.headCell}>{t("set.store.branches.actions")}</th>
                  </tr>
                </thead>
                <tbody className={TABLE.body}>
                  {branches.map((branch) => (
                    <tr key={branch.id} className={cn(TABLE.row, TABLE.rowHover)}>
                      <td className={cn(TABLE.cell, "font-bold tabular-nums")}>{branch.store_nbr}</td>
                      <td className={cn(TABLE.cell, "font-bold text-slate-900 dark:text-slate-100")}>
                        {branch.branch_code}
                      </td>
                      <td className={TABLE.cell}>
                        <div className="space-y-1">
                          <p className="font-medium text-slate-900 dark:text-slate-100">{branch.name}</p>
                          <p className={cn(T.caption, "line-clamp-2 text-slate-500 dark:text-slate-400")}>
                            {branch.address}
                          </p>
                        </div>
                      </td>
                      <td className={TABLE.cell}>
                        <div className={cn(T.caption, "space-y-1 text-slate-500 dark:text-slate-400")}>
                          <p>{branch.phone || "-"}</p>
                          <p>{branch.email || "-"}</p>
                        </div>
                      </td>
                      <td className={cn(TABLE.cell, "tabular-nums")}>{formatHours(branch)}</td>
                      <td className={TABLE.cell}>
                        <span className={statusBadgeClass(branch.is_active)}>
                          {branch.is_active ? t("set.store.branches.active") : t("set.store.branches.inactive")}
                        </span>
                      </td>
                      <td className={TABLE.cell}>{renderActions(branch)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="space-y-3 md:hidden">
              {branches.map((branch) => (
                <article
                  key={branch.id}
                  className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={cn(T.micro, "font-bold text-slate-500 dark:text-slate-400")}>
                          #{branch.store_nbr}
                        </span>
                        <span className={statusBadgeClass(branch.is_active)}>
                          {branch.is_active ? t("set.store.branches.active") : t("set.store.branches.inactive")}
                        </span>
                      </div>
                      <h4 className={cn(T.h4, "text-slate-900 dark:text-slate-100")}>{branch.name}</h4>
                      <p className={cn(T.caption, "font-bold text-indigo-600 dark:text-indigo-400")}>
                        {branch.branch_code}
                      </p>
                    </div>
                  </div>

                  <dl className="mt-4 grid grid-cols-1 gap-3 text-sm">
                    <div>
                      <dt className={cn(T.micro, "font-bold text-slate-400")}>{t("set.store.branches.address")}</dt>
                      <dd className={cn(T.bodySm, "text-slate-600 dark:text-slate-300")}>{branch.address}</dd>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <dt className={cn(T.micro, "font-bold text-slate-400")}>{t("set.store.branches.contact")}</dt>
                        <dd className={cn(T.caption, "text-slate-600 dark:text-slate-300")}>
                          {branch.phone || branch.email || "-"}
                        </dd>
                      </div>
                      <div>
                        <dt className={cn(T.micro, "font-bold text-slate-400")}>{t("set.store.branches.hours")}</dt>
                        <dd className={cn(T.caption, "tabular-nums text-slate-600 dark:text-slate-300")}>
                          {formatHours(branch)}
                        </dd>
                      </div>
                    </div>
                  </dl>

                  <div className="mt-4">{renderActions(branch)}</div>
                </article>
              ))}
            </div>
          </>
        )}
      </div>

      {formOpen && (
        <BranchFormModal
          key={editingBranch?.id ?? "create-branch"}
          branch={editingBranch}
          isOpen={formOpen}
          isSubmitting={isSubmitting}
          error={mutationError}
          t={t}
          onClose={closeForm}
          onSubmit={handleSubmitBranch}
        />
      )}
      <BranchDeactivateDialog
        branch={deactivateTarget}
        isSubmitting={isSubmitting}
        error={mutationError}
        t={t}
        onCancel={() => {
          setDeactivateTarget(null);
          setMutationError(null);
        }}
        onConfirm={handleDeactivateBranch}
      />
    </div>
  );
}
