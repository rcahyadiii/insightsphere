import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const root = fileURLToPath(new URL("../..", import.meta.url));
const middleware = readFileSync(join(root, "middleware.ts"), "utf8");

test("CSRF middleware enforces write methods on /api/*", () => {
  assert.match(middleware, /matcher:\s*\["\/api\/:path\*"\]/);
  assert.match(middleware, /WRITE_METHODS/);
  assert.match(middleware, /CSRF_ORIGIN_BLOCKED/);
});

test("CSRF middleware allows requests without Origin/Referer (server-to-server)", () => {
  assert.match(
    middleware,
    /if \(!origin && !referer\) \{[\s\S]*?return NextResponse\.next\(\);/
  );
});

test("CSRF middleware accepts NEXT_PUBLIC_ALLOWED_ORIGINS configuration", () => {
  assert.match(middleware, /NEXT_PUBLIC_ALLOWED_ORIGINS/);
});