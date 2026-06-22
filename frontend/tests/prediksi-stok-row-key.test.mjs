import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const root = fileURLToPath(new URL("..", import.meta.url));
const source = readFileSync(
  join(root, "src/app/components/pages/PrediksiStokPage.tsx"),
  "utf8",
);

test("prediction table rows use unique prediction log identity, not display product id", () => {
  assert.match(source, /rowKey:\s*p\.id/);
  assert.match(source, /<tr key=\{p\.rowKey\}/);
  assert.doesNotMatch(source, /<tr key=\{p\.id\}/);
});
