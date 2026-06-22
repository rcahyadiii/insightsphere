import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const root = fileURLToPath(new URL("..", import.meta.url));
const source = readFileSync(join(root, "src/app/lib/dashboard-client.ts"), "utf8");

test("dashboard client exposes dashboard overview API", () => {
  assert.match(source, /export interface DashboardOverviewResponse/);
  assert.match(source, /export const fetchDashboardOverview/);
  assert.match(source, /api<DashboardOverviewResponse>\("\/dashboard\/overview"/);
});
