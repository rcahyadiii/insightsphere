import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const root = fileURLToPath(new URL("../..", import.meta.url));
const read = (path) => readFileSync(join(root, path), "utf8");

test("P2 centralizes frontend domain constants for roles, inventory, auth, and simulator rules", () => {
  const constantsPath = join(root, "src/app/domain/constants.ts");
  assert.equal(existsSync(constantsPath), true, "missing frontend domain constants module");

  const constants = read("src/app/domain/constants.ts");
  [
    "ROLE_CODES",
    "ROLE_SETS",
    "DEFAULT_ROLE",
    "INVENTORY_CATEGORIES",
    "INVENTORY_UNITS",
    "STOCK_MOVEMENT_PERIODS",
    "STOCK_MOVEMENT_STATUS",
    "AUTH_SESSION_DAYS",
    "AUTH_COOKIE_MAX_AGE_SECONDS",
    "WHAT_IF_SIMULATOR_RULES",
  ].forEach((name) => assert.match(constants, new RegExp(`\\b${name}\\b`), `missing ${name}`));
});

test("P2 routes simulator business numbers through domain constants", () => {
  const simulator = read("src/app/components/WhatIfSimulator.tsx");

  assert.match(simulator, /WHAT_IF_SIMULATOR_RULES/);
  assert.doesNotMatch(simulator, /useState\(10\)/);
  assert.doesNotMatch(simulator, /\*\s*1\.5\b/);
  assert.doesNotMatch(simulator, /\*\s*0\.85\b/);
  assert.doesNotMatch(simulator, /\*\s*0\.80\b/);
  assert.doesNotMatch(simulator, /\bmin=\{5\}|\bmax=\{50\}|\bstep=\{5\}/);
});

test("P2 routes inventory filter domains through shared constants", () => {
  const stockMovement = read("src/app/components/pages/StockMovementPage.tsx");
  const inventory = read("src/app/components/pages/InventarisPage.tsx");

  assert.match(stockMovement, /INVENTORY_CATEGORIES/);
  assert.match(stockMovement, /INVENTORY_UNITS/);
  assert.match(stockMovement, /STOCK_MOVEMENT_PERIODS/);
  assert.match(stockMovement, /STOCK_MOVEMENT_STATUS/);
  assert.doesNotMatch(stockMovement, /const CATEGORY_OPTIONS\s*=/);
  assert.doesNotMatch(stockMovement, /const UNITS\s*=/);
  assert.doesNotMatch(stockMovement, /const DATE_PERIODS\s*=/);

  assert.match(inventory, /INVENTORY_UNITS/);
  assert.doesNotMatch(inventory, /unit:\s*"pcs"/);
});

test("P2 routes frontend role and auth expiry contracts through shared constants", () => {
  const auditedFiles = [
    "src/app/routes.tsx",
    "src/app/context/AuthContext.tsx",
    "src/app/lib/auth-client.ts",
    "src/app/lib/auth-cookie.ts",
    "src/app/components/pages/UserManagementPage.tsx",
    "src/app/components/Sidebar.tsx",
    "src/app/components/Header.tsx",
  ];

  for (const file of auditedFiles) {
    const source = read(file);
    assert.match(source, /@\/app\/domain\/constants/, `${file} should import domain constants`);
  }

  assert.doesNotMatch(read("src/app/routes.tsx"), /allowedRoles:\s*\[/);
  assert.doesNotMatch(read("src/app/lib/auth-cookie.ts"), /60\s*\*\s*60\s*\*\s*24\s*\*\s*7/);
  assert.doesNotMatch(read("src/app/context/AuthContext.tsx"), /export type UserRole = "admin" \| "owner" \| "inventory_manager" \| "cashier"/);
  assert.doesNotMatch(read("src/app/lib/auth-client.ts"), /export type BackendRole = "admin" \| "owner" \| "inventory_manager" \| "cashier"/);
  assert.doesNotMatch(read("src/app/components/pages/UserManagementPage.tsx"), /z\.enum\(\["owner", "admin", "inventory_manager", "cashier"\]\)/);
  assert.doesNotMatch(read("src/app/components/Sidebar.tsx"), /\(\["owner", "inventory_manager", "cashier"\] as const\)/);
});
