"use client";

import { useState, useMemo, useEffect, useRef, memo, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Users,
  Plus,
  Search,
  Filter,
  MoreHorizontal,
  Edit,
  Trash2,
  Mail,
  Phone,
  Store,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  X,
  Check,
  ArrowUpDown,
  XCircle,
  AlertTriangle,
} from "lucide-react";
import { cn } from "@/app/lib/utils";

/* ── Design-system tokens (LOCKED source-of-truth) ─────────────────── */
import { T } from "@/app/lib/typography";
import { R, R_COMPONENT } from "@/app/lib/radii";
import { E, E_COMPONENT, Z } from "@/app/lib/elevation";
import { GAP, STACK, PAD, ICON, ICON_BY_CONTEXT } from "@/app/lib/spacing";
import { C } from "@/app/lib/colors";
import { getRoleInfo } from "@/app/lib/status";
import { formatPhoneID, formatDate } from "@/app/lib/format";
import { A11Y } from "@/app/lib/a11y";
import { BACKDROP } from "@/app/lib/utility";
import { CARD, MODAL } from "@/app/lib/containers";
import { TABLE } from "@/app/lib/data";
import { FOCUS } from "@/app/lib/forms";
import { BTN } from "@/app/lib/buttons";
import { EmptyState } from "@/app/components/ui/EmptyState";
import { FilterSelect, type FilterSelectOption } from "@/app/components/ui/FilterSelect";
import { ResponsiveTable } from "@/app/components/ui/ResponsiveTable";
import { useTranslation } from "@/app/i18n";
import { isDemoDataEnabled } from "@/app/lib/demo-mode";
import { USER_ROLE_VALUES, type UserRole as DomainUserRole } from "@/app/domain/constants";

/* ── Types & Mock Data (unchanged logic) ──────────────────────────── */
type UserRole = DomainUserRole;

interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  store: string;
  branch: string;
  status: "active" | "inactive";
  lastActive: Date;
  avatar?: string;
}

let localUserSequence = 0;

function createLocalUserId() {
  localUserSequence += 1;
  return `u-local-${localUserSequence}`;
}


/* ── Token helpers: role colour mapping (replaces ROLE_CONFIG) ───── */
const ROLE_BADGE: Record<UserRole, string> = {
  owner: C.roleOwner.badge,
  admin: C.roleAdmin.badge,
  cashier: C.roleCashier.badge,
  inventory_manager: C.roleInventory.badge,
};

const ROLE_AVATAR: Record<UserRole, string> = {
  owner: C.roleOwner.avatar,
  admin: C.roleAdmin.avatar,
  cashier: C.roleCashier.avatar,
  inventory_manager: C.roleInventory.avatar,
};

const ROLE_ICON_BG: Record<UserRole, string> = {
  owner: C.primary.bg,
  admin: C.destructive.bg,
  cashier: C.success.bg,
  inventory_manager: C.inventoryAccent.bg,
};

const ROLE_ICON_TEXT: Record<UserRole, string> = {
  owner: C.primary.icon,
  admin: C.destructive.icon,
  cashier: C.success.icon,
  inventory_manager: C.inventoryAccent.icon,
};

/* ── UserTableRow — memo'd sub-component ─────────────────────────── */
interface UserTableRowProps {
  user: User;
  isDropdownOpen: boolean;
  dropdownRef: { current: HTMLDivElement | null };
  onToggleDropdown: (userId: string) => void;
  onEdit: (user: User) => void;
  onDelete: (user: User) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
}

const UserTableRow = memo(function UserTableRow({
  user, isDropdownOpen, dropdownRef, onToggleDropdown, onEdit, onDelete, t,
}: UserTableRowProps) {
  const roleInfo = getRoleInfo(user.role);
  return (
    <tr
      className={cn(TABLE.row, TABLE.rowHover, "group")}
    >
      <td className={cn(TABLE.cell, TABLE.stickyColumn, "bg-white dark:bg-slate-900 group-hover:bg-slate-50 dark:group-hover:bg-slate-800/50")}>
        <div className="flex items-center gap-3">
          {user.avatar ? (
            <img src={user.avatar} alt={user.name} className={cn(ICON["3xl"], R.full, "object-cover")} />
          ) : (
            <div className={cn("flex items-center justify-center shrink-0", ICON["3xl"], R.full, "text-sm font-bold text-white", ROLE_AVATAR[user.role])}>
              {user.name.split(" ").map((n) => n[0]).join("").toUpperCase()}
            </div>
          )}
          <div className={cn(STACK.compact)}>
            <p className={cn(T.bodyEmphasis, "text-slate-900 dark:text-slate-100")}>{user.name}</p>
            <p className={cn(T.bodySm, "text-slate-400")}>{user.email}</p>
          </div>
        </div>
      </td>
      <td className={TABLE.cell}>
        <span className={cn("inline-flex items-center", "px-2.5 py-0.5", R.full, T.buttonSm, ROLE_BADGE[user.role])}>
          {roleInfo.labelId}
        </span>
      </td>
      <td className={TABLE.cell}>
        <div className={cn(STACK.compact)}>
          <div className="flex items-center gap-1">
            <Phone className={cn(ICON.xs, "text-slate-400")} aria-hidden="true" />
            <span className={cn(T.body, "text-slate-600 dark:text-slate-300")}>{formatPhoneID(user.phone)}</span>
          </div>
          <div className="flex items-center gap-1">
            <Mail className={cn(ICON.xs, "text-slate-400")} aria-hidden="true" />
            <span className={cn(T.bodySm, "text-slate-400")}>{user.email}</span>
          </div>
        </div>
      </td>
      <td className={TABLE.cell}>
        <div className={cn(STACK.compact)}>
          <div className="flex items-center gap-1">
            <Store className={cn(ICON.xs, "text-slate-400")} aria-hidden="true" />
            <span className={cn(T.body, "text-slate-600 dark:text-slate-300")}>{user.store}</span>
          </div>
          <span className={cn(T.bodySm, "text-slate-400")}>{user.branch}</span>
        </div>
      </td>
      <td className={TABLE.cell}>
        <span className={cn("inline-flex items-center gap-1 px-2.5 py-0.5", R.full, T.buttonSm,
          user.status === "active"
            ? "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/50"
            : "bg-slate-50 dark:bg-slate-800/50 text-slate-500 border border-slate-200 dark:border-slate-700"
        )}>
          {user.status === "active" ? <Check className={cn(ICON.xs)} /> : <XCircle className={cn(ICON.xs)} />}
          {user.status === "active" ? t("um.status.active") : t("um.status.inactive")}
        </span>
      </td>
      <td className={TABLE.cell}>
        <span className={cn(T.body, "text-slate-500")}>{formatDate(user.lastActive, "short")}</span>
      </td>
      <td className={cn(TABLE.cell, "text-right")}>
        <div className="relative inline-block" ref={dropdownRef}>
          <button
            onClick={() => onToggleDropdown(user.id)}
            className={cn("inline-flex items-center justify-center", ICON_BY_CONTEXT.buttonSm, R.md, "text-slate-400 hover:text-slate-600 dark:hover:text-slate-300", "hover:bg-slate-100 dark:hover:bg-slate-800", "transition-colors", A11Y.focusRing.default)}
            aria-label={t("um.action.menu", { name: user.name })}
            aria-haspopup="menu"
            aria-expanded={isDropdownOpen}
          >
            <MoreHorizontal className={ICON.sm} />
          </button>
          {isDropdownOpen && (
            <div
              className={cn("absolute right-0 mt-1 w-48", "bg-white dark:bg-slate-800", R.md, E_COMPONENT.dropdown, C.neutral.border, Z.dropdown, "animate-in fade-in zoom-in-95 duration-100")}
              role="menu"
            >
                <button
                  onClick={() => onEdit(user)}
                  className={cn("w-full flex items-center gap-2 px-4 py-2", T.body, "text-slate-700 dark:text-slate-300", "hover:bg-slate-50 dark:hover:bg-slate-800", "transition-colors", A11Y.focusRing.default)}
                  role="menuitem"
                >
                  <Edit className={cn(ICON.sm, "text-slate-400")} />
                  {t("um.action.edit")}
                </button>
                <button
                  onClick={() => onDelete(user)}
                  className={cn("w-full flex items-center gap-2 px-4 py-2", T.body, C.destructive.text, "hover:bg-rose-50 dark:hover:bg-rose-900/30", "transition-colors", A11Y.focusRing.destructive)}
                  role="menuitem"
                >
                  <Trash2 className={cn(ICON.sm, C.destructive.text)} />
                  {t("um.action.delete")}
                </button>
            </div>
          )}
        </div>
      </td>
    </tr>
  );
});

/* ── Zod schema + inferred type (P2-4: RHF migration) ────────────── */
const userSchema = z.object({
  name: z.string().min(1, "Nama wajib diisi"),
  email: z.string().min(1, "Email wajib diisi").email("Format email tidak valid"),
  phone: z.string().min(1, "No. telepon wajib diisi"),
  role: z.enum(USER_ROLE_VALUES),
  store: z.string().min(1, "Toko wajib diisi"),
  branch: z.string().optional(),
  status: z.enum(["active", "inactive"]),
});
type UserFormValues = z.infer<typeof userSchema>;

/* ── Component ────────────────────────────────────────────────── */
export default function UserManagementPage() {
  const { t } = useTranslation();
  /* ---- state (unchanged) ---- */
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<"all" | UserRole>("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [sortField, setSortField] = useState<keyof User | "">("");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [users, setUsers] = useState<User[]>([]);
  /* ---- Demo mode: lazy-load mock users only when explicitly enabled ---- */
  useEffect(() => {
    if (!isDemoDataEnabled()) return;
    let cancelled = false;
    void import("@/app/demo/users").then(({ DEMO_USERS }) => {
      if (!cancelled) setUsers(DEMO_USERS as unknown as User[]);
    });
    return () => { cancelled = true; };
  }, []);
  const [currentPage, setCurrentPage] = useState(1);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [deleteTargetUser, setDeleteTargetUser] = useState<User | null>(null);
  const {
    register,
    handleSubmit: rhfSubmit,
    formState: { errors },
    reset: resetForm,
  } = useForm<UserFormValues>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      role: "cashier",
      store: "",
      branch: "",
      status: "active",
    },
  });
  const dropdownRef = useRef<HTMLDivElement>(null);
  const PAGE_SIZE = 8;

  /* ---- effects ---- */
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setActiveDropdown(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsModalOpen(false);
        setDeleteTargetUser(null);
        setActiveDropdown(null);
      }
    };
    if (isModalOpen || activeDropdown || deleteTargetUser) {
      document.addEventListener("keydown", handleEscape);
      return () => document.removeEventListener("keydown", handleEscape);
    }
  }, [isModalOpen, activeDropdown, deleteTargetUser]);

  /* ---- filter / sort ---- */
  const filtered = useMemo(() => {
    let result = [...users];
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (u) =>
          u.name.toLowerCase().includes(q) ||
          u.email.toLowerCase().includes(q) ||
          u.phone.includes(q)
      );
    }
    if (roleFilter !== "all") result = result.filter((u) => u.role === roleFilter);
    if (statusFilter !== "all") result = result.filter((u) => u.status === statusFilter);
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
  }, [users, searchQuery, roleFilter, statusFilter, sortField, sortDirection]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const pageItems = filtered.slice((safeCurrentPage - 1) * PAGE_SIZE, safeCurrentPage * PAGE_SIZE);

  /* ---- helpers (unchanged) ---- */
  const toggleSort = (field: keyof User) => {
    setCurrentPage(1);
    if (sortField === field) {
      setSortDirection((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const handleAddUser = () => {
    setEditingUser(null);
    resetForm();
    setIsModalOpen(true);
  };

  const handleEditUser = useCallback((user: User) => {
    setEditingUser(user);
    resetForm({
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      store: user.store,
      branch: user.branch ?? "",
      status: user.status,
    });
    setIsModalOpen(true);
    setActiveDropdown(null);
  }, [resetForm]);

  const handleDeleteUser = useCallback((user: User) => {
    setDeleteTargetUser(user);
    setActiveDropdown(null);
  }, []);

  const handleToggleDropdown = useCallback((userId: string) => {
    setActiveDropdown((prev) => (prev === userId ? null : userId));
  }, []);

  const handleConfirmDelete = () => {
    if (!deleteTargetUser) return;
    setUsers((prev) => prev.filter((u) => u.id !== deleteTargetUser.id));
    setDeleteTargetUser(null);
  };

  const onSubmit = (data: UserFormValues) => {
    if (editingUser) {
      setUsers((prev) =>
        prev.map((u) =>
          u.id === editingUser.id
            ? { ...u, name: data.name, email: data.email, phone: data.phone, role: data.role, store: data.store, branch: data.branch ?? "", status: data.status }
            : u
        )
      );
    } else {
      const newUser: User = {
        id: createLocalUserId(),
        name: data.name,
        email: data.email,
        phone: data.phone,
        role: data.role,
        store: data.store,
        branch: data.branch ?? "",
        status: data.status,
        lastActive: new Date(),
      };
      setUsers((prev) => [newUser, ...prev]);
    }
    setIsModalOpen(false);
    setEditingUser(null);
  };

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.currentTarget === e.target) {
      setIsModalOpen(false);
      setEditingUser(null);
    }
  };

  /* ---- derived stats ---- */
  const totalUsers = users.length;
  const activeUsers = users.filter((u) => u.status === "active").length;
  const adminCount = users.filter((u) => u.role === "admin").length;
  const ownerCount = users.filter((u) => u.role === "owner").length;

  /* ───────────────────────────────────────────────────────────────── */
  return (
    <div className="space-y-6 pb-6 animate-in fade-in duration-500">
      {/* ── Header ── */}
      <div className={cn("flex flex-col md:flex-row md:items-center md:justify-between", GAP.default)}>
        <div>
          <h1 className={cn(T.h1, "text-slate-900 dark:text-slate-100")}>
            {t("um.header")}
          </h1>
          <p className={cn(T.body, "text-slate-500 dark:text-slate-400")}>
            {t("um.subheader")}
          </p>
        </div>
        <button
          onClick={handleAddUser}
          className={cn(BTN.base, BTN.size.md, BTN.variant.primary, A11Y.focusRing.onSolid, "dark:bg-indigo-900/30 dark:hover:bg-indigo-900/40 dark:text-indigo-400 dark:shadow-none dark:border dark:border-indigo-800/50")}
          aria-label={t("um.btn.add")}
        >
          <Plus className={ICON.md} />
          {t("um.btn.add")}
        </button>
      </div>

      {/* ── Stats cards ── */}
      <div className={cn("grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4", GAP.default)}>
        {/* Total */}
        <div
          className={cn(CARD.kpi, "flex items-center", GAP.default)}
        >
          <div
            className={cn(
              "flex items-center justify-center shrink-0",
              ICON["3xl"],
              R.md,
              ROLE_ICON_BG.admin,
              ROLE_ICON_TEXT.admin
            )}
          >
            <Users className={ICON.lg} />
          </div>
          <div className={cn(STACK.compact)}>
            <p className={cn(T.h4, "text-slate-500 dark:text-slate-400")}>{t("um.stats.total")}</p>
            <p className={cn(T.kpiCard, "text-slate-900 dark:text-slate-100")}>
              {totalUsers}
            </p>
          </div>
        </div>

        {/* Active */}
        <div
          className={cn(CARD.kpi, "flex items-center", GAP.default)}
        >
          <div
            className={cn(
              "flex items-center justify-center shrink-0",
              ICON["3xl"],
              R.md,
              C.success.bg,
              C.success.icon
            )}
          >
            <Check className={ICON.lg} />
          </div>
          <div className={cn(STACK.compact)}>
            <p className={cn(T.h4, "text-slate-500 dark:text-slate-400")}>{t("um.stats.active")}</p>
            <p className={cn(T.kpiCard, "text-slate-900 dark:text-slate-100")}>
              {activeUsers}
            </p>
          </div>
        </div>

        {/* Admin */}
        <div
          className={cn(CARD.kpi, "flex items-center", GAP.default)}
        >
          <div
            className={cn(
              "flex items-center justify-center shrink-0",
              ICON["3xl"],
              R.md,
              ROLE_ICON_BG.admin,
              ROLE_ICON_TEXT.admin
            )}
          >
            <Users className={ICON.lg} />
          </div>
          <div className={cn(STACK.compact)}>
            <p className={cn(T.h4, "text-slate-500 dark:text-slate-400")}>{t("um.stats.admin")}</p>
            <p className={cn(T.kpiCard, "text-slate-900 dark:text-slate-100")}>
              {adminCount}
            </p>
          </div>
        </div>

        {/* Owner */}
        <div
          className={cn(CARD.kpi, "flex items-center", GAP.default)}
        >
          <div
            className={cn(
              "flex items-center justify-center shrink-0",
              ICON["3xl"],
              R.md,
              ROLE_ICON_BG.owner,
              ROLE_ICON_TEXT.owner
            )}
          >
            <Store className={ICON.lg} />
          </div>
          <div className={cn(STACK.compact)}>
            <p className={cn(T.h4, "text-slate-500 dark:text-slate-400")}>{t("um.stats.owner")}</p>
            <p className={cn(T.kpiCard, "text-slate-900 dark:text-slate-100")}>
              {ownerCount}
            </p>
          </div>
        </div>
      </div>

      {/* ── Filter card ── */}
      <div
        className={cn(CARD.base, "overflow-hidden")}
      >
        <div className={cn("px-6 py-5 border-b", C.neutral.border)}>
          <div className={cn("flex flex-col md:flex-row md:items-center", GAP.default)}>
            {/* Search */}
            <div className="flex-1 relative">
              <Search
                className={cn(
                  "absolute left-3 top-1/2 -translate-y-1/2",
                  ICON.md,
                  "text-slate-400"
                )}
                aria-hidden="true"
              />
              <input
                type="text"
                placeholder={t("um.filter.search")}
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className={cn(
                  "w-full",
                  PAD.inputMd,
                  "pl-10",
                  R_COMPONENT.input,
                  "border",
                  C.neutral.border,
                  "bg-white dark:bg-slate-900",
                  "text-slate-900 dark:text-slate-100",
                  "placeholder:text-slate-400 dark:placeholder:text-slate-500",
                  FOCUS.ring
                )}
              />
            </div>

            <FilterSelect<"all" | UserRole>
              id="role-filter"
              label={t("um.filter.role")}
              value={roleFilter}
              icon={<Filter className={cn(ICON.sm, "text-slate-400")} aria-hidden="true" />}
              options={[
                { value: "all", label: t("um.filter.allRoles") },
                { value: "owner", label: t("um.role.owner") },
                { value: "admin", label: t("um.role.admin") },
                { value: "cashier", label: t("um.role.cashier") },
                { value: "inventory_manager", label: t("um.role.inventory_manager") },
              ] satisfies FilterSelectOption<"all" | UserRole>[]}
              onValueChange={(nextValue) => {
                setRoleFilter(nextValue);
                setCurrentPage(1);
              }}
            />

            <FilterSelect<"all" | "active" | "inactive">
              id="status-filter"
              label={t("um.filter.status")}
              value={statusFilter}
              icon={<Filter className={cn(ICON.sm, "text-slate-400")} aria-hidden="true" />}
              options={[
                { value: "all", label: t("um.filter.allStatuses") },
                { value: "active", label: t("um.status.active") },
                { value: "inactive", label: t("um.status.inactive") },
              ] satisfies FilterSelectOption<"all" | "active" | "inactive">[]}
              onValueChange={(nextValue) => {
                setStatusFilter(nextValue);
                setCurrentPage(1);
              }}
            />
          </div>
        </div>

        {/* ── Table ── */}
        <ResponsiveTable
          label={t("um.header")}
          scrollerClassName="rounded-none border-0 bg-transparent"
          minWidthClassName={TABLE.minWidth.userManagement}
        >
          <table className={TABLE.base} aria-label={t("um.header")}>
            <thead className={TABLE.head}>
              <tr>
                <th className={cn(TABLE.headCell, TABLE.headCellSortable, TABLE.stickyColumn, "bg-slate-50 dark:bg-slate-800/50")}>
                  <button
                    type="button"
                    onClick={() => toggleSort("name")}
                    className={cn("flex w-full items-center gap-1", A11Y.focusRing.default)}
                  >
                    {t("um.table.name")}
                    <ArrowUpDown className={cn(ICON.xs, "text-slate-400")} />
                  </button>
                </th>
                <th className={cn(TABLE.headCell, TABLE.headCellSortable)}>
                  <button
                    type="button"
                    onClick={() => toggleSort("role")}
                    className={cn("flex w-full items-center gap-1", A11Y.focusRing.default)}
                  >
                    {t("um.table.role")}
                    <ArrowUpDown className={cn(ICON.xs, "text-slate-400")} />
                  </button>
                </th>
                <th className={TABLE.headCell}>
                  {t("um.table.contact")}
                </th>
                <th className={cn(TABLE.headCell, TABLE.headCellSortable)}>
                  <button
                    type="button"
                    onClick={() => toggleSort("store")}
                    className={cn("flex w-full items-center gap-1", A11Y.focusRing.default)}
                  >
                    {t("um.table.store")}
                    <ArrowUpDown className={cn(ICON.xs, "text-slate-400")} />
                  </button>
                </th>
                <th className={cn(TABLE.headCell, TABLE.headCellSortable)}>
                  <button
                    type="button"
                    onClick={() => toggleSort("status")}
                    className={cn("flex w-full items-center gap-1", A11Y.focusRing.default)}
                  >
                    {t("um.table.status")}
                    <ArrowUpDown className={cn(ICON.xs, "text-slate-400")} />
                  </button>
                </th>
                <th className={TABLE.headCell}>
                  {t("um.table.lastActive")}
                </th>
                <th className={cn(TABLE.headCell, "text-right")}>
                  {t("um.table.actions")}
                </th>
              </tr>
            </thead>
            <tbody className={TABLE.body}>
              {pageItems.length > 0 ? (
                pageItems.map((user) => (
                  <UserTableRow
                    key={user.id}
                    user={user}
                    isDropdownOpen={activeDropdown === user.id}
                    dropdownRef={dropdownRef}
                    onToggleDropdown={handleToggleDropdown}
                    onEdit={handleEditUser}
                    onDelete={handleDeleteUser}
                    t={t}
                  />
                ))
              ) : (
                <tr>
                  <td className={TABLE.cell} colSpan={7}>
                    <EmptyState
                      icon={Search}
                      title={t("um.empty.title")}
                      description={t("um.empty.desc")}
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
          <p className={cn(T.bodySm, "text-slate-500")}>
            {t("um.pagination.showing")} {filtered.length > 0 ? (safeCurrentPage - 1) * PAGE_SIZE + 1 : 0}–{Math.min(safeCurrentPage * PAGE_SIZE, filtered.length)} {t("um.pagination.of")} {filtered.length} {t("um.pagination.users")}
          </p>
          <div className={cn("flex items-center", GAP.compact)}>
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={safeCurrentPage === 1}
              className={cn("inline-flex items-center justify-center", ICON_BY_CONTEXT.buttonSm, R_COMPONENT.button, "border", C.neutral.border, "text-slate-600 dark:text-slate-300", "disabled:opacity-50 disabled:cursor-not-allowed", "hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors", A11Y.focusRing.default)}
              aria-label={t("um.pagination.prev")}
            >
              <ChevronLeft className={ICON.sm} />
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={cn("inline-flex items-center justify-center", ICON_BY_CONTEXT.buttonSm, R_COMPONENT.button, "border", "transition-colors", A11Y.focusRing.default, page === safeCurrentPage ? cn(C.primary.bg, C.primary.text, C.primary.border) : cn(C.neutral.border, "text-slate-600 dark:text-slate-300", "hover:bg-slate-50 dark:hover:bg-slate-800"))}
                aria-label={t("um.pagination.page", { page })}
                aria-current={page === safeCurrentPage ? "page" : undefined}
              >
                {page}
              </button>
            ))}
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={safeCurrentPage === totalPages}
              className={cn("inline-flex items-center justify-center", ICON_BY_CONTEXT.buttonSm, R_COMPONENT.button, "border", C.neutral.border, "text-slate-600 dark:text-slate-300", "disabled:opacity-50 disabled:cursor-not-allowed", "hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors", A11Y.focusRing.default)}
              aria-label={t("um.pagination.next")}
            >
              <ChevronRight className={ICON.sm} />
            </button>
          </div>
        </div>
      </div>

      {/* ── Add/Edit Modal ── */}
      {isModalOpen && (
        <div
          className={cn(
            "fixed inset-0",
            BACKDROP.overlay,
            Z.overlay,
            "flex items-center justify-center",
            "animate-in fade-in duration-150"
          )}
          onClick={handleBackdropClick}
          role="presentation"
        >
          <div
            className={cn(
              "bg-white dark:bg-slate-800",
              R_COMPONENT.modal,
              E_COMPONENT.modal,
              "w-full max-w-2xl overflow-hidden flex flex-col", MODAL.maxHeight.lg,
              Z.modal,
              "animate-in zoom-in-95 duration-150"
            )}
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Escape") setIsModalOpen(false);
            }}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
          >
              {/* Modal header */}
              <div
                className={cn(
                  "flex items-center justify-between",
                  PAD.modalHeader,
                  "border-b",
                  C.neutral.border
                )}
              >
                <h2
                  id="modal-title"
                  className={cn("text-xl font-bold", "text-slate-900 dark:text-slate-100")}
                >
                  {editingUser ? t("um.modal.editTitle") : t("um.modal.addTitle")}
                </h2>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className={cn(
                    "inline-flex items-center justify-center",
                    ICON_BY_CONTEXT.buttonSm,
                    R.md,
                    "text-slate-400 hover:text-slate-600 dark:hover:text-slate-300",
                    "hover:bg-slate-100 dark:hover:bg-slate-800",
                    "transition-colors",
                    A11Y.focusRing.default
                  )}
                  aria-label={t("um.modal.close")}
                >
                  <X className={ICON.md} />
                </button>
              </div>

              {/* Modal body */}
              <div className={cn(PAD.modalBody, "overflow-y-auto", STACK.default)}>
                {/* Name */}
                <div className={cn(STACK.compact)}>
                  <label htmlFor="user-name" className={cn(T.bodyEmphasis, "text-slate-700 dark:text-slate-300")}>
                    {t("um.modal.name")} <span className={C.destructive.text}>*</span>
                  </label>
                  <input
                    id="user-name"
                    type="text"
                    {...register("name")}
                    className={cn(
                      "w-full",
                      PAD.inputMd,
                      R_COMPONENT.input,
                      "border",
                      errors.name ? C.destructive.border : C.neutral.border,
                      "bg-white dark:bg-slate-900",
                      "text-slate-900 dark:text-slate-100",
                      "placeholder:text-slate-400 dark:placeholder:text-slate-500",
                      FOCUS.ring
                    )}
                    placeholder={t("um.modal.namePlaceholder")}
                  />
                  {errors.name && (
                    <p className={cn(T.bodySm, C.destructive.text)}>{errors.name.message}</p>
                  )}
                </div>

                {/* Email */}
                <div className={cn(STACK.compact)}>
                  <label htmlFor="user-email" className={cn(T.bodyEmphasis, "text-slate-700 dark:text-slate-300")}>
                    {t("um.modal.email")} <span className={C.destructive.text}>*</span>
                  </label>
                  <input
                    id="user-email"
                    type="email"
                    {...register("email")}
                    className={cn(
                      "w-full",
                      PAD.inputMd,
                      R_COMPONENT.input,
                      "border",
                      errors.email ? C.destructive.border : C.neutral.border,
                      "bg-white dark:bg-slate-900",
                      "text-slate-900 dark:text-slate-100",
                      "placeholder:text-slate-400 dark:placeholder:text-slate-500",
                      FOCUS.ring
                    )}
                    placeholder="email@contoh.com"
                  />
                  {errors.email && (
                    <p className={cn(T.bodySm, C.destructive.text)}>{errors.email.message}</p>
                  )}
                </div>

                {/* Phone */}
                <div className={cn(STACK.compact)}>
                  <label htmlFor="user-phone" className={cn(T.bodyEmphasis, "text-slate-700 dark:text-slate-300")}>
                    {t("um.modal.phone")} <span className={C.destructive.text}>*</span>
                  </label>
                  <input
                    id="user-phone"
                    type="tel"
                    {...register("phone")}
                    className={cn(
                      "w-full",
                      PAD.inputMd,
                      R_COMPONENT.input,
                      "border",
                      errors.phone ? C.destructive.border : C.neutral.border,
                      "bg-white dark:bg-slate-900",
                      "text-slate-900 dark:text-slate-100",
                      "placeholder:text-slate-400 dark:placeholder:text-slate-500",
                      FOCUS.ring
                    )}
                    placeholder="081234567890"
                  />
                  {errors.phone && (
                    <p className={cn(T.bodySm, C.destructive.text)}>{errors.phone.message}</p>
                  )}
                </div>

                {/* Role */}
                <div className={cn(STACK.compact)}>
                  <label htmlFor="user-role" className={cn(T.bodyEmphasis, "text-slate-700 dark:text-slate-300")}>
                    {t("um.modal.role")} <span className={C.destructive.text}>*</span>
                  </label>
                  <select
                    id="user-role"
                    {...register("role")}
                    className={cn(
                      "w-full",
                      PAD.inputMd,
                      R_COMPONENT.input,
                      "border",
                      C.neutral.border,
                      "bg-white dark:bg-slate-900",
                      "text-slate-900 dark:text-slate-100",
                      T.body,
                      FOCUS.ring
                    )}
                  >
                    <option value="owner">{t("um.role.owner")}</option>
                    <option value="admin">{t("um.role.admin")}</option>
                    <option value="cashier">{t("um.role.cashier")}</option>
                    <option value="inventory_manager">{t("um.role.inventory_manager")}</option>
                  </select>
                </div>

                {/* Store */}
                <div className={cn(STACK.compact)}>
                  <label htmlFor="user-store" className={cn(T.bodyEmphasis, "text-slate-700 dark:text-slate-300")}>
                    {t("um.modal.store")} <span className={C.destructive.text}>*</span>
                  </label>
                  <input
                    id="user-store"
                    type="text"
                    {...register("store")}
                    className={cn(
                      "w-full",
                      PAD.inputMd,
                      R_COMPONENT.input,
                      "border",
                      errors.store ? C.destructive.border : C.neutral.border,
                      "bg-white dark:bg-slate-900",
                      "text-slate-900 dark:text-slate-100",
                      "placeholder:text-slate-400 dark:placeholder:text-slate-500",
                      FOCUS.ring
                    )}
                    placeholder={t("um.modal.storePlaceholder")}
                  />
                  {errors.store && (
                    <p className={cn(T.bodySm, C.destructive.text)}>{errors.store.message}</p>
                  )}
                </div>

                {/* Branch */}
                <div className={cn(STACK.compact)}>
                  <label htmlFor="user-branch" className={cn(T.bodyEmphasis, "text-slate-700 dark:text-slate-300")}>
                    {t("um.modal.branch")}
                  </label>
                  <input
                    id="user-branch"
                    type="text"
                    {...register("branch")}
                    className={cn(
                      "w-full",
                      PAD.inputMd,
                      R_COMPONENT.input,
                      "border",
                      C.neutral.border,
                      "bg-white dark:bg-slate-900",
                      "text-slate-900 dark:text-slate-100",
                      "placeholder:text-slate-400 dark:placeholder:text-slate-500",
                      FOCUS.ring
                    )}
                    placeholder={t("um.modal.branchPlaceholder")}
                  />
                </div>

                {/* Status */}
                <div className={cn(STACK.compact)}>
                  <label htmlFor="user-status" className={cn(T.bodyEmphasis, "text-slate-700 dark:text-slate-300")}>
                    {t("um.modal.status")}
                  </label>
                  <select
                    id="user-status"
                    {...register("status")}
                    className={cn(
                      "w-full",
                      PAD.inputMd,
                      R_COMPONENT.input,
                      "border",
                      C.neutral.border,
                      "bg-white dark:bg-slate-900",
                      "text-slate-900 dark:text-slate-100",
                      T.body,
                      FOCUS.ring
                    )}
                  >
                    <option value="active">{t("um.status.active")}</option>
                    <option value="inactive">{t("um.status.inactive")}</option>
                  </select>
                </div>
              </div>

              {/* Modal footer */}
              <div
                className={cn(
                  "flex items-center justify-end gap-3",
                  PAD.modalFooter,
                  "border-t",
                  C.neutral.border
                )}
              >
                <button
                  onClick={() => setIsModalOpen(false)}
                  className={cn(
                    BTN.base,
                    BTN.size.md,
                    "bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700",
                    "text-slate-700 dark:text-slate-300",
                    A11Y.focusRing.default
                  )}
                >
                  {t("um.modal.cancel")}
                </button>
                <button
                  onClick={rhfSubmit(onSubmit)}
                  className={cn(BTN.base, BTN.size.md, BTN.variant.primary, A11Y.focusRing.onSolid)}
                >
                  {editingUser ? t("um.modal.saveChanges") : t("um.modal.save")}
                </button>
              </div>
          </div>
        </div>
      )}

      {/* ── Delete Confirmation Modal ───────────────────────────────────── */}
      {deleteTargetUser && (
        <div
          className={cn("fixed inset-0", BACKDROP.overlay, Z.overlay, MODAL.wrapper, "animate-in fade-in duration-150")}
          role="presentation"
          onClick={(e) => { if (e.currentTarget === e.target) setDeleteTargetUser(null); }}
        >
          <div
            className={cn(MODAL.container, MODAL.size.sm, Z.modal, E_COMPONENT.modal, "animate-in zoom-in-95 duration-150")}
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-modal-title"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className={cn("flex items-center gap-3", PAD.modalHeader, "border-b", C.neutral.border)}>
              <div className={cn(R.sm, "p-2", C.destructive.bg)}>
                <AlertTriangle className={cn(ICON.md, C.destructive.icon)} aria-hidden="true" />
              </div>
              <h2 id="delete-modal-title" className={cn(T.h3, "font-bold text-slate-900 dark:text-slate-100")}>
                {t("um.delete.title")}
              </h2>
            </div>

            {/* Body */}
            <div className={cn(PAD.modalBody)}>
              <p className={cn(T.body, "text-slate-600 dark:text-slate-400")}>
                {t("um.delete.confirm")}{" "}
                <span className="font-bold text-slate-900 dark:text-slate-100">{deleteTargetUser.name}</span>?
              </p>
              <p className={cn(T.bodySm, "text-slate-500 dark:text-slate-500 mt-1")}>
                {t("um.delete.warning")}
              </p>
            </div>

            {/* Footer */}
            <div className={cn("flex items-center justify-end", GAP.default, PAD.modalFooter, "border-t", C.neutral.border)}>
              <button
                onClick={() => setDeleteTargetUser(null)}
                className={cn(BTN.base, BTN.size.md, "bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300", A11Y.focusRing.default)}
              >
                {t("um.modal.cancel")}
              </button>
              <button
                onClick={handleConfirmDelete}
                className={cn(BTN.base, BTN.size.md, BTN.variant.destructive, A11Y.focusRing.onSolid)}
              >
                {t("um.delete.confirm_btn")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export { UserManagementPage };

/* ── Token Refactor Audit Trail ─────────────────────────────────────
 * File: UserManagementPage.tsx
 * Refactored: 24 April 2026
 *
 * TOKEN MIGRATION SUMMARY:
 * ┌─────────────────────┬──────────────────────────────────────────┐
 * │ BANNED pattern      │ Replacement                              │
 * ├─────────────────────┼──────────────────────────────────────────┤
 * │ ROLE_CONFIG object  │ getRoleInfo() + ROLE_BADGE/AVATAR maps   │
 * │ text-2xl font-black │ T.h1 (page title)                        │
 * │ text-xl font-bold   │ text-xl font-bold (no exact token — kept) │
 * │ text-sm font-bold   │ T.bodyEmphasis / T.buttonLg / T.h4     │
 * │ text-xs font-bold   │ T.h4 / T.buttonSm                        │
 * │ text-sm text-slate… │ T.body / T.bodyEmphasis / T.bodySm       │
 * │ rounded-2xl         │ R_COMPONENT.card / R_COMPONENT.modal     │
 * │ rounded-xl          │ R.md / R_COMPONENT                       │
 * │ rounded-full        │ R.full                                   │
 * │ shadow-sm           │ E_COMPONENT.card                         │
 * │ shadow-xl           │ E_COMPONENT.modal                        │
 * │ z-50                │ Z.overlay / Z.modal                      │
 * │ p-6 / px-6 py-4     │ PAD.card / PAD.modalHeader/Footer        │
 * │ space-y-6           │ STACK.loose                              │
 * │ space-y-4           │ STACK.default                            │
 * │ space-y-2           │ STACK.compact                            │
 * │ gap-4               │ GAP.default                              │
 * │ w-4 h-4             │ ICON.md / ICON.lg / ICON.sm             │
 * │ w-10 h-10           │ ICON["3xl"]                              │
 * │ bg-indigo-50        │ C.primary.bg                             │
 * │ text-indigo-600     │ C.primary.text                           │
 * │ bg-emerald-50       │ C.success.bg                             │
 * │ bg-rose-50          │ C.destructive.bg                         │
 * │ border-slate-200    │ C.neutral.border                         │
 * │ bg-slate-900/60…    │ BACKDROP.overlay                         │
 * │ focus:outline-none… │ FOCUS.ring / A11Y.focusRing.*            │
 * │ 081234567890 raw    │ formatPhoneID()                          │
 * │ lastActive raw      │ formatDate(..., "short")                 │
 * ├─────────────────────┼──────────────────────────────────────────┤
 * │ A11Y FIXES          │                                          │
 * │ <label htmlFor>     │ Added to ALL form labels                 │
 * │ <input id>          │ Added to ALL form inputs                 │
 * │ icon-only buttons   │ aria-label added (MoreHoriz, Close)      │
 * │ modal backdrop      │ role="presentation"                      │
 * │ modal dialog        │ role="dialog" aria-modal aria-labelledby │
 * │ dropdown menu       │ role="menu" role="menuitem"              │
 * │ focus-visible       │ All interactive elements                 │
 * └─────────────────────┴──────────────────────────────────────────┘
 *
 * EXCLUSIONS (intentional — structural / no token equivalent):
 *   • bg-white, bg-slate-50/100 — structural page/card backgrounds
 *   • text-slate-900/700/600/500/400 — structural text colours
 *   • hover:bg-slate-50, hover:bg-indigo-50 — hover states (no hover token)
 *   • text-xl font-bold (modal title) — size between T.h1 and T.h2, no exact match
 */
