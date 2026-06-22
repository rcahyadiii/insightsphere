import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const root = fileURLToPath(new URL("../..", import.meta.url));
const read = (path) => readFileSync(join(root, path), "utf8");

function listSourceFiles(dir, options = {}) {
  const entries = readdirSync(join(root, dir));
  return entries.flatMap((entry) => {
    const relativePath = `${dir}/${entry}`;
    const absolutePath = join(root, relativePath);
    const stats = statSync(absolutePath);

    if (stats.isDirectory()) {
      if (!options.includeDemo && relativePath.includes("/demo")) return [];
      return listSourceFiles(relativePath, options);
    }

    if (!/\.(ts|tsx)$/.test(entry)) return [];
    return [relativePath];
  });
}

function hasDemoGuardBeforeImport(source, importIndex) {
  const previousSource = source.slice(0, importIndex);
  const guardIndex = previousSource.lastIndexOf("isDemoDataEnabled()");
  if (guardIndex === -1) return false;

  const previousImportIndex = previousSource.lastIndexOf('import("@/app/demo/');
  return guardIndex > previousImportIndex;
}

test("P1 product service does not silently fall back to POS demo products", () => {
  const source = read("src/app/services/productService.ts");

  assert.doesNotMatch(source, /MOCK_POS_PRODUCTS/);
  assert.doesNotMatch(source, /catch\s*\{\s*return\s+[^;]*PRODUCTS\s*;/s);
  assert.match(source, /isDemoDataEnabled\(\)/);
  assert.match(source, /await import\("@\/app\/demo\/pos-products"\)/);
  assert.match(source, /throw error/);
});

test("P1 audited runtime pages load demo fixtures only through the demo gate", () => {
  const auditedFiles = [
    "src/app/components/pages/StockMovementPage.tsx",
    "src/app/components/pages/TransactionHistoryPage.tsx",
    "src/app/components/pages/MLOpsDashboardPage.tsx",
  ];

  for (const file of auditedFiles) {
    const source = read(file);

    assert.doesNotMatch(source, /\bMOCK_[A-Z0-9_]+\b/);
    assert.doesNotMatch(source, /\/\/\s*[-─]*\s*Mock Data/i);
    assert.match(source, /isDemoDataEnabled\(\)/, `${file} should check demo flag`);
    assert.match(source, /import\("@\/app\/demo\//, `${file} should lazy-load demo fixtures`);
  }
});

test("P1 remaining runtime targets load demo fixtures only through the demo gate", () => {
  const auditedFiles = [
    "src/app/components/pages/DashboardPage.tsx",
    "src/app/components/pages/InventarisPage.tsx",
    "src/app/components/pages/UserManagementPage.tsx",
    "src/app/components/pages/UserProfilePage.tsx",
    "src/app/components/pages/CashManagementPage.tsx",
    "src/app/components/TopProductsChart.tsx",
    "src/app/components/inventory/StockTransferModal.tsx",
    "src/app/components/inventory/StockHistoryTable.tsx",
    "src/app/components/inventory/ExcelImportModal.tsx",
    "src/app/components/LowStockAlert.tsx",
    "src/app/components/NotificationCenter.tsx",
    "src/app/components/pos/ServicePanel.tsx",
    "src/app/components/pos/RefundModal.tsx",
  ];

  for (const file of auditedFiles) {
    const source = read(file);

    assert.doesNotMatch(source, /\bMOCK_[A-Z0-9_]+\b/);
    assert.doesNotMatch(source, /\bINITIAL_NOTIFICATIONS\b/);
    assert.doesNotMatch(source, /\bPOLL_NOTIFICATIONS\b/);
    assert.doesNotMatch(source, /\/\/\s*[-─]*\s*(Mock|Initial) Data/i);
    assert.match(source, /isDemoDataEnabled\(\)/, `${file} should check demo flag`);
    assert.match(source, /import\("@\/app\/demo\//, `${file} should lazy-load demo fixtures`);
  }
});

test("P1 every runtime demo import is preceded by the demo mode guard", () => {
  const offenders = [];
  const runtimeFiles = listSourceFiles("src/app");

  for (const file of runtimeFiles) {
    const source = read(file);
    const demoImportRegex = /import\("@\/app\/demo\//g;
    const demoImports = source.matchAll(demoImportRegex);

    for (const match of demoImports) {
      if (!hasDemoGuardBeforeImport(source, match.index ?? 0)) {
        offenders.push(file);
      }
    }
  }

  assert.deepEqual([...new Set(offenders)].sort(), []);
});

test("P1 remaining runtime targets do not keep obvious demo business rows inline", () => {
  const runtimeSources = [
    "src/app/components/pages/DashboardPage.tsx",
    "src/app/components/pages/InventarisPage.tsx",
    "src/app/components/pages/UserManagementPage.tsx",
    "src/app/components/pages/UserProfilePage.tsx",
    "src/app/components/pages/CashManagementPage.tsx",
    "src/app/components/TopProductsChart.tsx",
    "src/app/components/inventory/StockTransferModal.tsx",
    "src/app/components/inventory/StockHistoryTable.tsx",
    "src/app/components/inventory/ExcelImportModal.tsx",
    "src/app/components/LowStockAlert.tsx",
    "src/app/components/NotificationCenter.tsx",
    "src/app/components/pos/ServicePanel.tsx",
    "src/app/components/pos/RefundModal.tsx",
  ].map(read).join("\n");

  assert.doesNotMatch(runtimeSources, /Beras Premium 5kg/);
  assert.doesNotMatch(runtimeSources, /HQ [—-] Jakarta Pusat/);
  assert.doesNotMatch(runtimeSources, /faiz@insightsphere\.id/);
  assert.doesNotMatch(runtimeSources, /user@insightsphere\.id/);
  assert.doesNotMatch(runtimeSources, /Lisna Fotocopy Digital/);
  assert.doesNotMatch(runtimeSources, /TXN-20260422-001/);
  assert.doesNotMatch(runtimeSources, /Anomali Baru:/);
});

test("P1 MLOps runtime page does not keep demo metrics inline", () => {
  const source = read("src/app/components/pages/MLOpsDashboardPage.tsx");

  assert.doesNotMatch(source, /94\.8%/);
  assert.doesNotMatch(source, /124\.5K/);
  assert.doesNotMatch(source, /April 2026/);
  assert.doesNotMatch(source, /retail-v3\.2\.1/);
});

test("P1 demo fixtures are isolated outside runtime pages and service modules", () => {
  const demoMode = read("src/app/lib/demo-mode.ts");
  const posFixtures = read("src/app/demo/pos-products.ts");
  const stockFixtures = read("src/app/demo/stock-movements.ts");
  const transactionFixtures = read("src/app/demo/transactions.ts");
  const mlopsFixtures = read("src/app/demo/mlops-dashboard.ts");
  const dashboardFixtures = read("src/app/demo/dashboard.ts");
  const inventoryFixtures = read("src/app/demo/inventory-products.ts");
  const usersFixtures = read("src/app/demo/users.ts");
  const profileFixtures = read("src/app/demo/user-profile.ts");
  const cashFixtures = read("src/app/demo/cash-management.ts");
  const transferFixtures = read("src/app/demo/inventory-transfer.ts");
  const stockHistoryFixtures = read("src/app/demo/stock-history.ts");
  const topProductsFixtures = read("src/app/demo/top-products.ts");
  const excelPreviewFixtures = read("src/app/demo/excel-import-preview.ts");
  const lowStockFixtures = read("src/app/demo/low-stock.ts");
  const notificationFixtures = read("src/app/demo/notifications.ts");
  const servicesFixtures = read("src/app/demo/services.ts");
  const refundFixtures = read("src/app/demo/refund-transactions.ts");

  assert.match(demoMode, /NEXT_PUBLIC_ENABLE_DEMO_DATA/);
  assert.match(posFixtures, /DEMO_POS_PRODUCTS/);
  assert.match(stockFixtures, /DEMO_STOCK_MOVEMENTS/);
  assert.match(transactionFixtures, /DEMO_TRANSACTIONS/);
  assert.match(mlopsFixtures, /DEMO_MLOPS_DASHBOARD/);
  assert.match(dashboardFixtures, /DEMO_DASHBOARD/);
  assert.match(inventoryFixtures, /DEMO_INVENTORY_PRODUCTS/);
  assert.match(usersFixtures, /DEMO_USERS/);
  assert.match(profileFixtures, /DEMO_USER_PROFILE/);
  assert.match(cashFixtures, /DEMO_CASH_ENTRIES/);
  assert.match(transferFixtures, /DEMO_INVENTORY_TRANSFER/);
  assert.match(stockHistoryFixtures, /DEMO_STOCK_HISTORY/);
  assert.match(topProductsFixtures, /DEMO_TOP_PRODUCTS/);
  assert.match(excelPreviewFixtures, /DEMO_EXCEL_IMPORT_PREVIEW/);
  assert.match(lowStockFixtures, /DEMO_LOW_STOCK/);
  assert.match(notificationFixtures, /DEMO_NOTIFICATIONS/);
  assert.match(servicesFixtures, /DEMO_SERVICES/);
  assert.match(refundFixtures, /DEMO_REFUND_TRANSACTIONS/);
});

test("P1 demo user profile fixture uses reserved test identity values", () => {
  const profileFixtures = read("src/app/demo/user-profile.ts");

  assert.doesNotMatch(profileFixtures, /@insightsphere\.id/);
  assert.match(profileFixtures, /@example\.test/);
});

test("P1 frontend does not expose product-domain demo email addresses", () => {
  const offenders = [];

  for (const file of listSourceFiles("src/app", { includeDemo: true })) {
    const source = read(file);
    if (/@insightsphere\.id/.test(source)) {
      offenders.push(file);
    }
  }

  assert.deepEqual(offenders.sort(), []);
});

test("P2 auth-client consolidates JSON helpers behind a single requestJson core", () => {
  const authClient = read("src/app/lib/auth-client.ts");

  assert.match(authClient, /async function requestJson<T>\(/);
  assert.match(authClient, /method: "GET" \| "POST" \| "PATCH" \| "DELETE"/);
  // Each verb-specific helper must delegate to requestJson, not re-implement fetch.
  assert.match(authClient, /async function postJson<T>\([^)]*\)[^\{]*\{\s*return requestJson<T>/);
  assert.match(authClient, /async function getJson<T>\([^)]*\)[^\{]*\{\s*return requestJson<T>/);
  assert.match(authClient, /async function patchJson<T>\([^)]*\)[^\{]*\{\s*return requestJson<T>/);
  assert.match(authClient, /async function deleteJson<T>\([^)]*\)[^\{]*\{\s*return requestJson<T>/);

  // Only one call site of `fetch(` should remain (inside requestJson itself).
  const fetchCallCount = (authClient.match(/\bfetch\(/g) ?? []).length;
  assert.equal(fetchCallCount, 1, "expected only one fetch() call inside requestJson");
});

test("P2 API clients route requests through shared helpers instead of one-off fetch calls", () => {
  const authClient = read("src/app/lib/auth-client.ts");
  const reportingClient = read("src/app/lib/reporting-client.ts");

  assert.match(authClient, /async function deleteJson<T>\(path: string\): Promise<T>/);
  assert.match(authClient, /return deleteJson<BackendUserListItem>\(`\/api\/auth\/users\/\$\{userId\}`\)/);
  assert.doesNotMatch(reportingClient, /await fetch\(/);
  assert.match(reportingClient, /api\.raw<Blob, "blob">\("\/reporting\/export"/);
});
