import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const root = fileURLToPath(new URL("../..", import.meta.url));
const repoRoot = fileURLToPath(new URL("../../..", import.meta.url));
const read = (path) => readFileSync(join(root, path), "utf8");
const readRepo = (path) => readFileSync(join(repoRoot, path), "utf8");

test("P0 backend dev URL literal lives only in the auth-cookie helper", () => {
  const offenders = [];
  const candidatePaths = [
    "src/app/lib/api.ts",
    "src/app/lib/auth-client.ts",
    "src/app/lib/reporting-client.ts",
    "src/app/lib/inventory-client.ts",
    "src/app/lib/finance-client.ts",
    "src/app/lib/dashboard-client.ts",
    "src/app/lib/intelligence-client.ts",
    "src/app/lib/notification-client.ts",
  ];

  for (const path of candidatePaths) {
    const source = read(path);
    if (/http:\/\/(?:127\.0\.0\.1|localhost):8000/.test(source)) {
      offenders.push(path);
    }
  }

  assert.deepEqual(offenders.sort(), []);
});

test("P0 auth-cookie helper exposes dev fallback through a named guard", () => {
  const source = read("src/app/lib/auth-cookie.ts");

  assert.match(source, /export const DEV_BACKEND_URL = "http:\/\/127\.0\.0\.1:8000";/);
  assert.match(source, /function getDevBackendUrl\(\): string \{/);
  assert.match(source, /BACKEND_INTERNAL_URL or NEXT_PUBLIC_API_URL must be configured in production/);
});

test("P0 frontend env example documents production requirement clearly", () => {
  const example = readRepo("frontend/.env.local.example");

  assert.match(example, /BACKEND_INTERNAL_URL/);
  assert.match(example, /NEXT_PUBLIC_API_URL/);
  assert.match(example, /production|Production|PROD/);
  assert.match(example, /required|wajib/);
});
