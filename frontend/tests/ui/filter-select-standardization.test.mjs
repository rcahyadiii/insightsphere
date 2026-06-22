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
