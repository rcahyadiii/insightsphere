import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const root = fileURLToPath(new URL("../..", import.meta.url));
const read = (path) => readFileSync(join(root, path), "utf8");

test("P0 backend URL fallback is development-only and production fails fast", () => {
  const source = read("src/app/lib/auth-cookie.ts");

  assert.doesNotMatch(
    source,
    /process\.env\.BACKEND_INTERNAL_URL\s*\|\|\s*process\.env\.NEXT_PUBLIC_API_URL\s*\|\|\s*"http:\/\/127\.0\.0\.1:8000"/s,
  );
  assert.match(source, /process\.env\.NODE_ENV\s*!==\s*"production"/);
  assert.match(source, /throw new Error\([^)]*(BACKEND_INTERNAL_URL|NEXT_PUBLIC_API_URL)/s);
});
