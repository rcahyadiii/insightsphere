import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const root = fileURLToPath(new URL("../..", import.meta.url));
const read = (path) => readFileSync(join(root, path), "utf8");

test("P3 Sidebar uses LAYOUT_CLASS.sidebar* tokens instead of arbitrary widths", () => {
  const sidebar = read("src/app/components/Sidebar.tsx");

  assert.match(sidebar, /from "@\/app\/lib\/layout"/);
  assert.match(sidebar, /LAYOUT_CLASS\.sidebarExpanded/);
  assert.match(sidebar, /LAYOUT_CLASS\.sidebarCollapsed/);
  assert.doesNotMatch(sidebar, /\bw-\[240px\]\b/);
  assert.doesNotMatch(sidebar, /\bw-\[68px\]\b/);
});

test("P3 Stepper does not use arbitrary stroke-[3] for icons", () => {
  const stepper = read("src/app/components/Stepper.tsx");
  assert.doesNotMatch(stepper, /stroke-\[3\]/);
  assert.match(stepper, /strokeWidth=\{3\}/);
});

test("P3 chart-height arbitrary classes are replaced by CHART_HEIGHT-driven sizing", () => {
  const auditedFiles = [
    "src/app/components/Skeletons.tsx",
    "src/app/components/TopProductsChart.tsx",
    "src/app/components/ForecastChart.tsx",
    "src/app/components/pages/PrediksiStokPage.tsx",
    "src/app/components/pages/LaporanPage.tsx",
  ];

  const offenders = [];
  for (const file of auditedFiles) {
    const source = read(file);
    if (/h-\[(?:200|220|250|260|280|300|320|360|400|440)px\]/.test(source)) {
      offenders.push(file);
    }
  }
  assert.deepEqual(offenders.sort(), []);
});

test("P3 CHART_HEIGHT defines a 320px mlg tier between md and lg", () => {
  const charts = read("src/app/lib/charts.ts");

  assert.match(charts, /mlg:\s*320,/);
  assert.match(charts, /md:\s*280,/);
  assert.match(charts, /lg:\s*360,/);
});

test("P3 LaporanPage 320px chart wrapper uses CHART_HEIGHT.mlg", () => {
  const laporan = read("src/app/components/pages/LaporanPage.tsx");

  assert.match(laporan, /style=\{\{ height: CHART_HEIGHT\.mlg \}\}/);
  // Tier `lg` (360) is now reserved untuk chart yang memang lebih tinggi.
  assert.doesNotMatch(laporan, /style=\{\{ height: CHART_HEIGHT\.lg \}\}/);
});

test("P3 chart wrappers import CHART_HEIGHT and apply it via style", () => {
  const auditedFiles = [
    "src/app/components/Skeletons.tsx",
    "src/app/components/TopProductsChart.tsx",
    "src/app/components/ForecastChart.tsx",
    "src/app/components/pages/PrediksiStokPage.tsx",
    "src/app/components/pages/LaporanPage.tsx",
  ];

  for (const file of auditedFiles) {
    const source = read(file);
    assert.match(source, /CHART_HEIGHT/, `${file} should reference CHART_HEIGHT token`);
  }
});
