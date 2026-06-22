import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const root = fileURLToPath(new URL("../..", import.meta.url));
const read = (path) => readFileSync(join(root, path), "utf8");

const PAGE_MODAL_FILES = [
  "src/app/components/pages/CashManagementPage.tsx",
  "src/app/components/pages/StockMovementPage.tsx",
  "src/app/components/pages/TransactionHistoryPage.tsx",
  "src/app/components/pages/UserManagementPage.tsx",
];

test("P4 page modals route max-h literals through MODAL.maxHeight tokens", () => {
  const offenders = [];
  for (const file of PAGE_MODAL_FILES) {
    const source = read(file);
    if (/max-h-\[(?:85|90)vh\]/.test(source)) offenders.push(file);
    if (!/MODAL\.maxHeight\.(?:md|lg)/.test(source)) {
      offenders.push(`${file} (missing MODAL.maxHeight reference)`);
    }
  }
  assert.deepEqual(offenders.sort(), []);
});

const XAI_FILE = "src/app/components/pages/XAIPage.tsx";

test("P4 XAIPage chart wrappers stop using arbitrary chart heights", () => {
  const xai = read(XAI_FILE);
  assert.doesNotMatch(xai, /h-\[(?:180|300|320)px\]/);
  assert.match(xai, /CHART_HEIGHT/);
  assert.match(xai, /from "@\/app\/lib\/charts"/);
});

test("P4 ExplanationCharts uses CHART_HEIGHT.md instead of min-h-[260px]", () => {
  const ec = read("src/app/components/ExplanationCharts.tsx");
  assert.doesNotMatch(ec, /min-h-\[260px\]/);
  assert.match(ec, /CHART_HEIGHT\.md/);
  assert.match(ec, /from "@\/app\/lib\/charts"/);
});

test("P4 ProductForm body scroll reuses MODAL.bodyScroll", () => {
  const form = read("src/app/components/inventory/ProductForm.tsx");
  assert.doesNotMatch(form, /max-h-\[70vh\]/);
  assert.match(form, /MODAL\.bodyScroll/);
});
