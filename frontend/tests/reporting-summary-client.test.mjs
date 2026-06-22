import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const root = fileURLToPath(new URL("..", import.meta.url));
const reporting = readFileSync(join(root, "src/app/lib/reporting-client.ts"), "utf8");
const transactions = readFileSync(join(root, "src/app/services/transactionService.ts"), "utf8");

test("reporting and transaction summary clients exist", () => {
  assert.match(reporting, /fetchReportingDashboardStats/);
  assert.match(transactions, /fetchTransactionSummary/);
});
