import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const root = fileURLToPath(new URL("../..", import.meta.url));
const read = (path) => readFileSync(join(root, path), "utf8");

test("Phase 3 localizes audited Dashboard copy", () => {
  const dashboard = read("src/app/components/pages/DashboardPage.tsx");

  const hardcodedCopy = [
    "Ringkasan Penjualan",
    "Filter Cabang:",
    "Laporan Konsolidasi Multi-Cabang",
    "Live AI Engine",
    "Menampilkan:",
  ];

  for (const copy of hardcodedCopy) {
    assert.doesNotMatch(dashboard, new RegExp(copy));
  }

  assert.match(dashboard, /t\("dash\.ai_engine_live"\)/);
  assert.match(dashboard, /t\("dash\.toast\.showing_branch"/);
});

test("Phase 3 keeps multi-branch Dashboard table headers translated", () => {
  const dashboard = read("src/app/components/pages/DashboardPage.tsx");

  const expectedKeys = [
    "dash.table.branch",
    "dash.table.revenue",
    "dash.table.transactions",
    "dash.table.growth",
    "dash.table.critical_stock",
    "dash.table.staff",
  ];

  for (const key of expectedKeys) {
    assert.match(dashboard, new RegExp(`t\\("${key.replaceAll(".", "\\.")}"\\)`));
  }
});

test("Phase 3 makes the Header language toggle available on mobile", () => {
  const header = read("src/app/components/Header.tsx");

  assert.doesNotMatch(header, /hidden sm:flex items-center gap-2 h-10 px-3/);
  assert.match(header, /flex min-w-10 items-center justify-center/);
  assert.match(header, /aria-label=\{`\$\{t\("common\.language"\)\}/);
});
