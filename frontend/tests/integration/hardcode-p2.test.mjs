import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const root = fileURLToPath(new URL("../..", import.meta.url));
const read = (path) => readFileSync(join(root, path), "utf8");

test("P2 removes manual Rupiah literals from audited POS components", () => {
  const auditedFiles = [
    "src/app/components/pos/PaymentModal.tsx",
    "src/app/components/pos/CartPanel.tsx",
    "src/app/components/pages/KasirPage.tsx",
    "src/app/components/pages/TransactionHistoryPage.tsx",
  ];

  const offenders = auditedFiles.flatMap((file) => {
    const source = read(file);
    const matches = source.match(/["'`>]Rp(?:\b|\)|<| )/g) ?? [];
    return matches.map((match) => `${file}: ${match}`);
  });

  assert.deepEqual(offenders, []);
});

test("P2 builds transaction CSV headers through i18n", () => {
  const transactionHistory = read("src/app/components/pages/TransactionHistoryPage.tsx");

  assert.doesNotMatch(transactionHistory, /"Total \(Rp\)"/);
  assert.match(transactionHistory, /exportToCSV\(filtered, `transaksi-\$\{new Date\(\)\.toISOString\(\)\.slice\(0,10\)\}\.csv`, t\)/);
  assert.match(transactionHistory, /t\("txn\.export\.headers\.total", \{ currency: t\("common\.currency\.rupiah"\) \}\)/);
});
