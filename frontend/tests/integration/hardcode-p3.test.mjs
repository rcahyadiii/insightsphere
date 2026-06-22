import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const root = fileURLToPath(new URL("../..", import.meta.url));
const read = (path) => readFileSync(join(root, path), "utf8");

const p3Files = [
  "src/app/components/XAIComponents.tsx",
  "src/app/components/WhatIfSimulator.tsx",
  "src/app/components/pos/PaymentModal.tsx",
  "src/app/components/ExportShareModal.tsx",
  "src/app/components/NotificationCenter.tsx",
];

test("P3 removes arbitrary radius classes from audited components", () => {
  const offenders = p3Files.flatMap((file) => {
    const source = read(file);
    const matches = source.match(/\brounded-\[[^\]]+\]/g) ?? [];
    return matches.map((match) => `${file}: ${match}`);
  });

  assert.deepEqual(offenders, []);
});

test("P3 replaces arbitrary glow shadows with elevation tokens", () => {
  const whatIfSimulator = read("src/app/components/WhatIfSimulator.tsx");

  assert.doesNotMatch(whatIfSimulator, /\bshadow-\[[^\]]+\]/);
  assert.match(whatIfSimulator, /E\.glowPrimary/);
  assert.match(whatIfSimulator, /E\.glowDestructive/);
  assert.match(whatIfSimulator, /E\.glowSuccess/);
});

test("P3 removes one-off XAI layout tweaks covered by tokens", () => {
  const xaiComponents = read("src/app/components/XAIComponents.tsx");

  assert.doesNotMatch(xaiComponents, /max-w-\[200px\]/);
  assert.doesNotMatch(xaiComponents, /translate-y-\[-2px\]/);
  assert.match(xaiComponents, /max-w-48/);
  assert.match(xaiComponents, /hover:-translate-y-0\.5/);
});

test("P3 removes raw preview and receipt colors from audited modals", () => {
  const exportShare = read("src/app/components/ExportShareModal.tsx");
  const paymentModal = read("src/app/components/pos/PaymentModal.tsx");

  assert.doesNotMatch(exportShare, /#(?:[0-9a-fA-F]{3,8})\b/);
  assert.doesNotMatch(paymentModal, /#000\b/);
  assert.match(paymentModal, /RECEIPT_PRINT/);
});
