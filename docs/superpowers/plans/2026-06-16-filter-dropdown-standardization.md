# Filter Dropdown Standardization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrate page-level filter dropdowns from native `<select>` controls to the existing Radix-based select pattern so opened dropdowns look consistent across the app.

**Architecture:** Add a small `FilterSelect` wrapper around `frontend/src/app/components/ui/select.tsx`, then use it in the three page filter bars covered by the spec. Each page keeps its current state, option values, translation keys, and filter behavior; only the UI control changes.

**Tech Stack:** Next.js App Router, React, TypeScript strict mode, Tailwind CSS tokens, Radix Select wrapper, Node `node:test` static UI tests.

---

## Reference Documents

- Spec: `docs/superpowers/specs/2026-06-16-filter-dropdown-standardization-design.md`
- Root rules: `AGENTS.md`
- Frontend rules: `frontend/AGENTS.md`
- Existing Radix wrapper: `frontend/src/app/components/ui/select.tsx`

## Commit Policy

Do not commit during execution unless the user explicitly authorizes commits. Use the checkpoint steps below to review `git diff` instead of committing.

## File Structure

- Create `frontend/src/app/components/ui/FilterSelect.tsx`
  - Reusable page-filter wrapper for Radix select.
  - Owns label association, trigger styling, option rendering, and common filter layout.
- Modify `frontend/src/app/components/pages/UserManagementPage.tsx`
  - Replace role/status filter native selects only.
  - Leave add/edit user modal selects unchanged.
- Modify `frontend/src/app/components/pages/CashManagementPage.tsx`
  - Replace type/category/status/date period filter native selects only.
  - Leave cash entry form selects unchanged.
- Modify `frontend/src/app/components/pages/StockMovementPage.tsx`
  - Replace type/category/date period filter native selects only.
  - Leave stock movement form selects unchanged.
- Create `frontend/tests/ui/filter-select-standardization.test.mjs`
  - Static UI regression test proving target filter controls use `FilterSelect` and the wrapper uses Radix primitives.

## Task 1: Add FilterSelect Wrapper

**Files:**
- Create: `frontend/src/app/components/ui/FilterSelect.tsx`
- Test: `frontend/tests/ui/filter-select-standardization.test.mjs` in Task 5

- [x] **Step 1: Create the wrapper file**

Create `frontend/src/app/components/ui/FilterSelect.tsx` with this content:

```tsx
"use client";

import * as React from "react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/components/ui/select";
import { C } from "@/app/lib/colors";
import { FOCUS } from "@/app/lib/forms";
import { R_COMPONENT } from "@/app/lib/radii";
import { T } from "@/app/lib/typography";
import { cn } from "@/app/lib/utils";

export type FilterSelectOption<TValue extends string = string> = {
  value: TValue;
  label: React.ReactNode;
  disabled?: boolean;
};

type FilterSelectProps<TValue extends string = string> = {
  id: string;
  label: React.ReactNode;
  value: TValue;
  options: readonly FilterSelectOption<TValue>[];
  onValueChange: (value: TValue) => void;
  icon?: React.ReactNode;
  className?: string;
  triggerClassName?: string;
};

export function FilterSelect<TValue extends string = string>({
  id,
  label,
  value,
  options,
  onValueChange,
  icon,
  className,
  triggerClassName,
}: FilterSelectProps<TValue>) {
  const labelId = `${id}-label`;

  return (
    <div className={cn("flex items-center gap-2", className)}>
      {icon}
      <span
        id={labelId}
        className={cn(T.bodyEmphasis, "text-slate-700 dark:text-slate-300")}
      >
        {label}
      </span>
      <Select
        value={value}
        onValueChange={(nextValue) => onValueChange(nextValue as TValue)}
      >
        <SelectTrigger
          id={id}
          aria-labelledby={labelId}
          className={cn(
            "h-10 min-w-[10rem] border",
            C.neutral.border,
            R_COMPONENT.input,
            "bg-white dark:bg-slate-900",
            "text-slate-900 dark:text-slate-100",
            T.body,
            FOCUS.ring,
            triggerClassName,
          )}
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent align="start" className="z-50">
          {options.map((option) => (
            <SelectItem
              key={option.value}
              value={option.value}
              disabled={option.disabled}
            >
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
```

- [x] **Step 2: Run typecheck for the new component**

Run:

```powershell
cd frontend
npm run typecheck
```

Expected: this may fail before page migration if no file imports the component, but it must not report syntax/type errors inside `FilterSelect.tsx`.

- [x] **Step 3: Checkpoint**

Run:

```powershell
git --no-optional-locks diff -- frontend/src/app/components/ui/FilterSelect.tsx
```

Expected: diff shows only the new wrapper file.

## Task 2: Migrate UserManagementPage Filters

**Files:**
- Modify: `frontend/src/app/components/pages/UserManagementPage.tsx`
- Test: `frontend/tests/ui/filter-select-standardization.test.mjs` in Task 5

- [x] **Step 1: Add the wrapper import**

Add this import near the other UI component imports:

```tsx
import { FilterSelect, type FilterSelectOption } from "@/app/components/ui/FilterSelect";
```

- [x] **Step 2: Replace the role and status filter controls**

Replace the existing role/status filter `<div>` blocks around `id="role-filter"` and `id="status-filter"` with:

```tsx
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
```

- [x] **Step 3: Verify non-goal selects remain untouched**

Run:

```powershell
rg -n "<select|id=\"role-filter\"|id=\"status-filter\"" frontend/src/app/components/pages/UserManagementPage.tsx
```

Expected:

- No `<select>` remains for `role-filter`.
- No `<select>` remains for `status-filter`.
- Native `<select>` controls may still exist later in the add/edit user modal.

- [x] **Step 4: Run typecheck**

Run:

```powershell
cd frontend
npm run typecheck
```

Expected: PASS, or fail only on pre-existing unrelated errors. If it fails, inspect the exact errors before continuing.

- [x] **Step 5: Checkpoint**

Run:

```powershell
git --no-optional-locks diff -- frontend/src/app/components/pages/UserManagementPage.tsx
```

Expected: diff shows only imports and the two filter controls changed.

## Task 3: Migrate CashManagementPage Filters

**Files:**
- Modify: `frontend/src/app/components/pages/CashManagementPage.tsx`
- Test: `frontend/tests/ui/filter-select-standardization.test.mjs` in Task 5

- [x] **Step 1: Add the wrapper import**

Add this import near the other UI component imports:

```tsx
import { FilterSelect, type FilterSelectOption } from "@/app/components/ui/FilterSelect";
```

- [x] **Step 2: Replace the four filter controls**

Replace the native filter controls for `type-filter`, `category-filter`, `status-filter`, and `date-period` with:

```tsx
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
```

- [x] **Step 3: Verify non-goal selects remain untouched**

Run:

```powershell
rg -n "<select|id=\"type-filter\"|id=\"category-filter\"|id=\"status-filter\"|id=\"date-period\"" frontend/src/app/components/pages/CashManagementPage.tsx
```

Expected:

- No `<select>` remains for the four filter IDs.
- Native `<select>` controls may still exist later in the cash entry form with IDs like `cas-type`, `cas-category`, and `cas-status`.

- [x] **Step 4: Run typecheck**

Run:

```powershell
cd frontend
npm run typecheck
```

Expected: PASS, or fail only on pre-existing unrelated errors. Fix any errors introduced by the migrated filter code before moving on.

- [x] **Step 5: Checkpoint**

Run:

```powershell
git --no-optional-locks diff -- frontend/src/app/components/pages/CashManagementPage.tsx
```

Expected: diff shows imports and the four filter controls changed; form dropdowns remain native.

## Task 4: Migrate StockMovementPage Filters

**Files:**
- Modify: `frontend/src/app/components/pages/StockMovementPage.tsx`
- Test: `frontend/tests/ui/filter-select-standardization.test.mjs` in Task 5

- [x] **Step 1: Add the wrapper import**

Add this import near the other UI component imports:

```tsx
import { FilterSelect, type FilterSelectOption } from "@/app/components/ui/FilterSelect";
```

- [x] **Step 2: Replace the three filter controls**

Replace the native filter controls for `type-filter`, `category-filter`, and `date-period` with:

```tsx
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
```

- [x] **Step 3: Verify non-goal selects remain untouched**

Run:

```powershell
rg -n "<select|id=\"type-filter\"|id=\"category-filter\"|id=\"date-period\"" frontend/src/app/components/pages/StockMovementPage.tsx
```

Expected:

- No `<select>` remains for the three filter IDs.
- Native `<select>` controls may still exist later in the stock movement form.

- [x] **Step 4: Run typecheck**

Run:

```powershell
cd frontend
npm run typecheck
```

Expected: PASS, or fail only on pre-existing unrelated errors. Fix any errors introduced by the migrated filter code before moving on.

- [x] **Step 5: Checkpoint**

Run:

```powershell
git --no-optional-locks diff -- frontend/src/app/components/pages/StockMovementPage.tsx
```

Expected: diff shows imports and the three filter controls changed; form dropdowns remain native.

## Task 5: Add Static UI Regression Test

**Files:**
- Create: `frontend/tests/ui/filter-select-standardization.test.mjs`

- [x] **Step 1: Create the test file**

Create `frontend/tests/ui/filter-select-standardization.test.mjs` with this content:

```js
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const root = fileURLToPath(new URL("../..", import.meta.url));
const read = (path) => readFileSync(join(root, path), "utf8");

test("FilterSelect wraps Radix select primitives for page filters", () => {
  const path = "src/app/components/ui/FilterSelect.tsx";
  assert.equal(existsSync(join(root, path)), true, "missing FilterSelect wrapper");

  const source = read(path);
  assert.match(source, /SelectTrigger/);
  assert.match(source, /SelectContent/);
  assert.match(source, /SelectItem/);
  assert.match(source, /aria-labelledby/);
  assert.match(source, /onValueChange/);
  assert.match(source, /min-w-\[10rem\]/);
});

test("user management page filters use FilterSelect instead of native selects", () => {
  const source = read("src/app/components/pages/UserManagementPage.tsx");

  assert.match(source, /FilterSelect<"all" \| UserRole>/);
  assert.match(source, /FilterSelect<"all" \| "active" \| "inactive">/);
  assert.doesNotMatch(source, /<select[\s\S]*id="role-filter"/);
  assert.doesNotMatch(source, /<select[\s\S]*id="status-filter"/);
  assert.match(source, /id="role-filter"/);
  assert.match(source, /id="status-filter"/);
});

test("cash management page filters use FilterSelect instead of native selects", () => {
  const source = read("src/app/components/pages/CashManagementPage.tsx");

  assert.match(source, /FilterSelect<CashType \| "all">/);
  assert.match(source, /FilterSelect<CashEntry\["status"\] \| "all">/);
  assert.doesNotMatch(source, /<select[\s\S]*id="type-filter"/);
  assert.doesNotMatch(source, /<select[\s\S]*id="category-filter"/);
  assert.doesNotMatch(source, /<select[\s\S]*id="status-filter"/);
  assert.doesNotMatch(source, /<select[\s\S]*id="date-period"/);
  assert.match(source, /id="type-filter"/);
  assert.match(source, /id="category-filter"/);
  assert.match(source, /id="status-filter"/);
  assert.match(source, /id="date-period"/);
});

test("stock movement page filters use FilterSelect instead of native selects", () => {
  const source = read("src/app/components/pages/StockMovementPage.tsx");

  assert.match(source, /FilterSelect<MovementType \| "all">/);
  assert.doesNotMatch(source, /<select[\s\S]*id="type-filter"/);
  assert.doesNotMatch(source, /<select[\s\S]*id="category-filter"/);
  assert.doesNotMatch(source, /<select[\s\S]*id="date-period"/);
  assert.match(source, /id="type-filter"/);
  assert.match(source, /id="category-filter"/);
  assert.match(source, /id="date-period"/);
});
```

- [x] **Step 2: Run the new test**

Run:

```powershell
cd frontend
node --experimental-strip-types --test --test-isolation=none tests/ui/filter-select-standardization.test.mjs
```

Expected: PASS.

- [x] **Step 3: Run the existing UI test slice**

Run:

```powershell
cd frontend
node --experimental-strip-types --test --test-isolation=none tests/ui/*.test.mjs
```

Expected: PASS.

- [x] **Step 4: Checkpoint**

Run:

```powershell
git --no-optional-locks diff -- frontend/tests/ui/filter-select-standardization.test.mjs
```

Expected: diff shows only the new static UI regression test.

## Task 6: Final Verification

**Files:**
- Verify: all files changed by Tasks 1-5

- [x] **Step 1: Run frontend typecheck**

Run:

```powershell
cd frontend
npm run typecheck
```

Expected: PASS.

- [x] **Step 2: Run frontend lint**

Run:

```powershell
cd frontend
npm run lint
```

Expected: PASS, or only pre-existing unrelated lint failures. Fix any lint failure introduced by this work.

- [x] **Step 3: Run the focused UI test**

Run:

```powershell
cd frontend
node --experimental-strip-types --test --test-isolation=none tests/ui/filter-select-standardization.test.mjs
```

Expected: PASS.

- [x] **Step 4: Run the full static frontend test command if time allows**

Run:

```powershell
cd frontend
node --experimental-strip-types --test --test-isolation=none tests/integration/*.test.mjs tests/ui/*.test.mjs tests/*.test.mjs
```

Expected: PASS. If this command is too broad or blocked by pre-existing failures, record the exact failing test names and keep the focused UI test result.

- [x] **Step 5: Inspect remaining native select usage**

Run:

```powershell
rg -n "<select" frontend/src/app/components/pages/UserManagementPage.tsx frontend/src/app/components/pages/CashManagementPage.tsx frontend/src/app/components/pages/StockMovementPage.tsx
```

Expected:

- Remaining `<select>` usages are only in forms/modals excluded by the spec.
- No page-level filter native `<select>` remains in the three target pages.

- [x] **Step 6: Review the full diff**

Run:

```powershell
git --no-optional-locks diff -- frontend/src/app/components/ui/FilterSelect.tsx frontend/src/app/components/pages/UserManagementPage.tsx frontend/src/app/components/pages/CashManagementPage.tsx frontend/src/app/components/pages/StockMovementPage.tsx frontend/tests/ui/filter-select-standardization.test.mjs
```

Expected:

- New wrapper file.
- Page filter control migrations only.
- New static UI test.
- No form/modal dropdown migrations.
- No dependency or lockfile changes.

## Self-Review Checklist

- Spec coverage: Tasks 1-4 cover all phase-1 dropdowns named in the spec; Task 5 covers regression tests; Task 6 covers verification.
- Non-goals preserved: no backend/API changes, no dependency changes, no form/modal dropdown migration.
- Type consistency: `FilterSelectOption`, `FilterSelect`, `onValueChange`, and page state types are defined before use and used consistently.
- Accessibility: `FilterSelect` uses `aria-labelledby`, visible text label, existing Radix keyboard behavior, and existing focus tokens.
- Commit policy: plan uses checkpoints instead of commits because repo instructions require explicit user approval before commit.

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-06-16-filter-dropdown-standardization.md`. Two execution options:

**1. Subagent-Driven (recommended by the skill)** - Dispatch a fresh subagent per task and review between tasks.

**2. Inline Execution** - Execute tasks in this session using `superpowers:executing-plans`, with checkpoints after each task.

For this repository and scope, Inline Execution is practical because the change is a single consistent UI decision across three files plus one wrapper.
