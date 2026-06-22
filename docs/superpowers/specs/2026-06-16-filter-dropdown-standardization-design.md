# Filter Dropdown Standardization Design

## Context

InsightSphere currently mixes two dropdown patterns in the frontend:

- Native HTML `<select>` fields in page filters and forms.
- Custom/Radix dropdown components in parts of the UI and in `frontend/src/app/components/ui/select.tsx`.

Native `<select>` controls can be styled while closed, but their opened option list is rendered by the browser/operating system. This causes inconsistent visuals such as the default Windows blue highlighted option, default spacing, and popup styling that does not match the application design system.

## Goal

Standardize the first visible layer of dropdown controls by migrating page-level filter dropdowns from native `<select>` to the existing Radix-based `Select` component.

## Non-goals

- Do not migrate form or modal dropdowns in this phase.
- Do not change backend APIs, filter behavior, or data contracts.
- Do not add a new frontend dependency.
- Do not redesign the surrounding pages.
- Do not replace all dropdown-like menus in the app.

## Scope

Phase 1 covers page-level filter dropdowns only:

- `frontend/src/app/components/pages/UserManagementPage.tsx`
  - Role filter.
  - Status filter.
- `frontend/src/app/components/pages/CashManagementPage.tsx`
  - Type filter.
  - Category filter.
  - Status filter.
  - Date period filter.
- `frontend/src/app/components/pages/StockMovementPage.tsx`
  - Type filter.
  - Category filter.
  - Period filter.

Dropdowns in add/edit forms, product forms, transfer modals, and other modal workflows remain native in this phase and should be handled in a follow-up migration.

## Design direction

The dropdowns should follow an industrial/utilitarian dashboard control style:

- Compact enough for dense operational pages.
- Clear enough for quick scanning.
- Consistent across light and dark modes.
- Accessible through keyboard and visible focus states.
- Restrained, without decorative effects that distract from dashboard work.

## Architecture

Use the existing Radix wrapper in `frontend/src/app/components/ui/select.tsx`:

- `Select`
- `SelectTrigger`
- `SelectValue`
- `SelectContent`
- `SelectItem`

Each page should keep ownership of its filter state. The migration should replace only the native UI element, not the state model.

Example state flow:

1. Page owns the selected filter value in `useState`.
2. `Select` receives the current value through `value`.
3. `Select` updates the page state through `onValueChange`.
4. Existing filter logic consumes the same state as before.

## Component behavior

For each migrated filter:

- Preserve the current option values exactly.
- Preserve current translation keys and visible labels.
- Preserve existing reset behavior when one filter affects another.
- Use the existing label text beside or above the control.
- Use a clear placeholder only when the current filter has an empty or unset state.
- Ensure the dropdown popup width aligns with the trigger width.
- Ensure popup z-index is high enough to display above cards, tables, and page surfaces.

## Accessibility

The migrated filters must satisfy these rules:

- Keyboard users can focus the trigger, open the menu, move between options, select an option, and close the menu.
- Focus state is visible.
- Text contrast remains readable in light and dark mode.
- Trigger size remains suitable for pointer and touch interaction.
- Screen reader text remains meaningful through visible label plus selected value.

## Testing strategy

Add or update frontend UI tests for the migrated filters:

- Verify a migrated Radix select can be opened.
- Verify selecting an option updates the visible selected value.
- Prefer a small, focused test that renders the target page/component with existing mocks.

Run relevant frontend verification:

```powershell
cd frontend
npm run typecheck
npm run lint
node --experimental-strip-types --test --test-isolation=none tests/ui/*.test.mjs tests/integration/*.test.mjs tests/*.test.mjs
```

If full frontend tests are too broad for the change, run the specific new/changed test file and state that narrower verification was used.

## Rollout plan

1. Update filter dropdowns in `UserManagementPage`.
2. Update filter dropdowns in `CashManagementPage`.
3. Update filter dropdowns in `StockMovementPage`.
4. Add or update UI tests for at least one migrated page pattern.
5. Run relevant lint/typecheck/test commands.

## Follow-up work

After Phase 1 is stable, migrate form and modal dropdowns through a reusable form-aware wrapper. That follow-up should cover:

- `UserManagementPage` add/edit user role and status fields.
- `CashManagementPage` add/edit cash entry dropdowns.
- `StockMovementPage` form dropdowns.
- `ProductForm` category/unit dropdowns.
- `StockTransferModal` branch/product dropdowns.

The form/modal phase may need integration with `react-hook-form`, likely through `Controller` or a small `FormSelect` wrapper.
