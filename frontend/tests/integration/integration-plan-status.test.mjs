import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const root = fileURLToPath(new URL("../../..", import.meta.url));
const doc = readFileSync(join(root, "docs/Rencana Integrasi Backend.md"), "utf8");

test("integration status table has a single final-status vocabulary", () => {
  assert.doesNotMatch(doc, /\|\s*Prediksi Stok\s*\|[^|]*\|\s*\*\*Hardcoded inline\*\*/);
  assert.doesNotMatch(doc, /\|\s*Riwayat Transaksi\s*\|[^|]*\|\s*Demo \(`transactions`\)/);
  assert.doesNotMatch(doc, /\|\s*MLOps Dashboard\s*\|[^|]*\|\s*Demo \(`mlops-dashboard`\)/);
});
