import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const root = fileURLToPath(new URL("../..", import.meta.url));
const read = (path) => readFileSync(join(root, path), "utf8");

const POS_INVENTORY_FILES = [
  "src/app/components/inventory/StockTransferModal.tsx",
  "src/app/components/inventory/StockHistoryTable.tsx",
  "src/app/components/inventory/StockOpnameModal.tsx",
  "src/app/components/inventory/ExcelImportModal.tsx",
  "src/app/components/pos/RefundModal.tsx",
  "src/app/components/pos/StockCheckView.tsx",
  "src/app/components/pos/ProductCard.tsx",
  "src/app/components/pos/ServicePanel.tsx",
];

test("P2 POS/inventory components avoid arbitrary modal max-height literals", () => {
  const offenders = [];
  for (const file of POS_INVENTORY_FILES) {
    const source = read(file);
    if (/max-h-\[(?:85|90)vh\]/.test(source)) {
      offenders.push(file);
    }
  }
  assert.deepEqual(offenders.sort(), []);
});

test("P2 POS/inventory components do not bypass radius tokens with rounded-[32px]", () => {
  const offenders = [];
  for (const file of POS_INVENTORY_FILES) {
    const source = read(file);
    if (/rounded-\[32px\]/.test(source)) {
      offenders.push(file);
    }
  }
  assert.deepEqual(offenders.sort(), []);
});

test("P2 POS components stop using arbitrary stroke widths", () => {
  const offenders = [];
  for (const file of POS_INVENTORY_FILES) {
    if (!/components\/pos\//.test(file)) continue;
    const source = read(file);
    if (/stroke-\[3\]/.test(source)) {
      offenders.push(file);
    }
  }
  assert.deepEqual(offenders.sort(), []);
});

test("P2 RefundModal counters use a reusable counter token instead of min-w-[16px]", () => {
  const refund = read("src/app/components/pos/RefundModal.tsx");
  assert.doesNotMatch(refund, /min-w-\[16px\]/);
});
