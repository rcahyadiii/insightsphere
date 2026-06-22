import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const root = fileURLToPath(new URL("..", import.meta.url));
const source = readFileSync(join(root, "src/app/lib/finance-client.ts"), "utf8");

test("finance client exposes list and detail cash-session APIs", () => {
  assert.match(source, /export interface CashSessionListResponse/);
  assert.match(source, /export const fetchCashSessions/);
  assert.match(source, /export const fetchCashSessionDetail/);
});
