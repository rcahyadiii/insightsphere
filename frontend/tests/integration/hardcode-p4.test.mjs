import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const root = fileURLToPath(new URL("../..", import.meta.url));
const read = (path) => readFileSync(join(root, path), "utf8");

const tablePages = [
  "src/app/components/pages/CashManagementPage.tsx",
  "src/app/components/pages/DashboardPage.tsx",
  "src/app/components/pages/InventarisPage.tsx",
  "src/app/components/pages/LaporanPage.tsx",
  "src/app/components/pages/PrediksiStokPage.tsx",
  "src/app/components/pages/StockMovementPage.tsx",
  "src/app/components/pages/TransactionHistoryPage.tsx",
  "src/app/components/pages/UserManagementPage.tsx",
];

test("P4 routes sticky table columns through TABLE sticky tokens", () => {
  const offenders = tablePages.flatMap((file) => {
    const source = read(file);
    const matches = source.match(/sticky left-0 z-10/g) ?? [];
    return matches.map((match) => `${file}: ${match}`);
  });
  const dataTokens = read("src/app/lib/data.ts");

  assert.deepEqual(offenders, []);
  assert.match(dataTokens, /stickyColumn:\s*`sticky left-0 \$\{Z\.raised\}`/);
});

test("P4 routes responsive table min widths through TABLE min-width tokens", () => {
  const auditedFiles = [
    ...tablePages,
    "src/app/components/Skeletons.tsx",
  ];
  const offenders = auditedFiles.flatMap((file) => {
    const source = read(file);
    const matches = source.match(/minWidthClassName="min-w-\[[^"]+"/g) ?? [];
    return matches.map((match) => `${file}: ${match}`);
  });
  const responsiveTable = read("src/app/components/ui/ResponsiveTable.tsx");
  const dataTokens = read("src/app/lib/data.ts");

  assert.deepEqual(offenders, []);
  assert.match(responsiveTable, /minWidthClassName = TABLE\.minWidth\.default/);
  assert.match(dataTokens, /minWidth:/);
  assert.match(dataTokens, /cashManagement:\s*"min-w-\[1280px\]"/);
});

test("P4 normalizes audited Skeletons radius and fixed width outliers", () => {
  const skeletons = read("src/app/components/Skeletons.tsx");

  assert.doesNotMatch(skeletons, /\brounded-\[[^\]]+\]/);
  assert.doesNotMatch(skeletons, /\bw-\[(?:50|500)px\]/);
  assert.match(skeletons, /SKELETON_DIMENSIONS/);
});

test("P4 tokenizes audited shadcn primitives and loading elevation", () => {
  const dialog = read("src/app/components/ui/dialog.tsx");
  const alertDialog = read("src/app/components/ui/alert-dialog.tsx");
  const loadingBar = read("src/app/components/ui/LoadingBar.tsx");
  const responsiveTable = read("src/app/components/ui/ResponsiveTable.tsx");

  for (const source of [dialog, alertDialog]) {
    assert.doesNotMatch(source, /\bz-50\b/);
    assert.match(source, /Z\.modal/);
    assert.match(source, /R\.sm/);
    assert.match(source, /E\.lg/);
  }

  assert.doesNotMatch(loadingBar, /\bshadow-\[[^\]]+\]/);
  assert.match(loadingBar, /E\.glowPrimary/);
  assert.doesNotMatch(responsiveTable, /\bz-10\b/);
  assert.match(responsiveTable, /Z\.raised/);
});
