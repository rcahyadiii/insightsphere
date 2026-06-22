import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const root = fileURLToPath(new URL("../..", import.meta.url));
const read = (path) => readFileSync(join(root, path), "utf8");

const p2TableFiles = [
  "src/app/components/PredictionTable.tsx",
  "src/app/components/TopProductsChart.tsx",
  "src/app/components/inventory/StockTransferModal.tsx",
  "src/app/components/inventory/StockHistoryTable.tsx",
  "src/app/components/inventory/StockOpnameModal.tsx",
  "src/app/components/settings/AccessSettingsPanel.tsx",
  "src/app/components/settings/SecuritySettingsPanel.tsx",
];

test("P2 routes leftover table min widths through TABLE tokens", () => {
  const offenders = p2TableFiles.flatMap((file) => {
    const matches = read(file).match(/minWidthClassName="min-w-\[[^"]+"/g) ?? [];
    return matches.map((match) => `${file}: ${match}`);
  });
  const dataTokens = read("src/app/lib/data.ts");

  assert.deepEqual(offenders, []);
  assert.match(dataTokens, /topProducts:\s*"min-w-\[620px\]"/);
  assert.match(dataTokens, /settings:\s*"min-w-\[760px\]"/);
  assert.match(dataTokens, /stockHistory:\s*"min-w-\[860px\]"/);
});

test("P2 routes leftover sticky table columns through TABLE.stickyColumn", () => {
  const offenders = p2TableFiles.flatMap((file) => {
    const matches = read(file).match(/sticky left-0 z-(?:10|20)\b/g) ?? [];
    return matches.map((match) => `${file}: ${match}`);
  });

  assert.deepEqual(offenders, []);
});

test("P2 routes modal, dropdown, and notification layering through tokens", () => {
  const auditedFiles = [
    "src/app/components/inventory/StockTransferModal.tsx",
    "src/app/components/inventory/StockHistoryTable.tsx",
    "src/app/components/inventory/StockOpnameModal.tsx",
    "src/app/components/Header.tsx",
    "src/app/components/NotificationCenter.tsx",
  ];
  const offenders = auditedFiles.flatMap((file) => {
    const matches = read(file).match(/\bz-50\b|sticky (?:top|bottom)-0 z-10/g) ?? [];
    return matches.map((match) => `${file}: ${match}`);
  });

  assert.deepEqual(offenders, []);
});

test("P2 moves header, notification, and portal sizing out of arbitrary local classes", () => {
  const header = read("src/app/components/Header.tsx");
  const notifications = read("src/app/components/NotificationCenter.tsx");
  const portal = read("src/app/components/PortalTemplate.tsx");
  const overlays = read("src/app/lib/overlays.ts");
  const layout = read("src/app/lib/layout.ts");

  assert.doesNotMatch(header, /max-w-\[(?:100|140)px\]|w-72/);
  assert.doesNotMatch(notifications, /min-w-\[18px\]|w-\[18px\]|h-\[18px\]|w-\[440px\]|max-h-\[(?:700px|calc\(100dvh-5rem\))\]/);
  assert.doesNotMatch(portal, /w-\[(?:400|500)px\]|h-\[(?:400|500)px\]|blur-\[(?:100|120)px\]/);

  assert.match(overlays, /notificationPanel:/);
  assert.match(overlays, /notificationBadge:/);
  assert.match(overlays, /headerStore:/);
  assert.match(layout, /portalOrnament:/);
});
