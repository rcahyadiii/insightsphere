import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const root = fileURLToPath(new URL("../..", import.meta.url));
const read = (path) => readFileSync(join(root, path), "utf8");

test("P3 centralizes external share provider URLs outside ExportShareModal", () => {
  const providerPath = join(root, "src/app/lib/share-providers.ts");
  assert.equal(existsSync(providerPath), true, "missing share provider helper");

  const provider = read("src/app/lib/share-providers.ts");
  assert.match(provider, /SHARE_PROVIDERS/);
  assert.match(provider, /buildShareUrl/);
  assert.match(provider, /normalizePhoneNumber/);
  assert.match(provider, /URLSearchParams/);

  const modal = read("src/app/components/ExportShareModal.tsx");
  assert.match(modal, /@\/app\/lib\/share-providers/);
  assert.match(modal, /buildShareUrl/);
  assert.doesNotMatch(modal, /wa\.me/);
  assert.doesNotMatch(modal, /https?:\/\//);
});
