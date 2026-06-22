import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const root = fileURLToPath(new URL("../..", import.meta.url));
const read = (path) => readFileSync(join(root, path), "utf8");

test("Phase 4 lazy-loads heavy POS panels", () => {
  const kasir = read("src/app/components/pages/KasirPage.tsx");

  assert.match(kasir, /import dynamic from "next\/dynamic"/);
  for (const component of ["CartPanel", "PaymentModal", "RefundModal"]) {
    assert.doesNotMatch(
      kasir,
      new RegExp(`import\\s+\\{\\s*${component}\\s*\\}\\s+from\\s+["']@/app/components/pos/${component}["']`)
    );
    assert.match(
      kasir,
      new RegExp(`dynamic\\(\\s*\\(\\)\\s*=>\\s*import\\(["']@/app/components/pos/${component}["']\\)`, "s")
    );
  }

  assert.match(kasir, /PosPanelSkeleton/);
  assert.match(kasir, /PosModalSkeleton/);
});

test("Phase 4 code-splits Pengaturan tab panels into dynamic chunks", () => {
  const settings = read("src/app/components/pages/PengaturanPage.tsx");
  const panelFiles = [
    "src/app/components/settings/ProfileSettingsPanel.tsx",
    "src/app/components/settings/StoreSettingsPanel.tsx",
    "src/app/components/settings/NotificationsSettingsPanel.tsx",
    "src/app/components/settings/AISettingsPanel.tsx",
    "src/app/components/settings/AccessSettingsPanel.tsx",
    "src/app/components/settings/SecuritySettingsPanel.tsx",
    "src/app/components/settings/LogoutSettingsPanel.tsx",
  ];

  assert.match(settings, /import dynamic from "next\/dynamic"/);
  for (const file of panelFiles) {
    assert.equal(existsSync(join(root, file)), true, `${file} should exist`);
    const componentName = file.split("/").at(-1).replace(".tsx", "");
    assert.match(
      settings,
      new RegExp(`dynamic\\(\\s*\\(\\)\\s*=>\\s*import\\(["']@/app/components/settings/${componentName}["']\\)`, "s")
    );
  }

  assert.match(settings, /SettingsShellSkeleton/);
});

test("Phase 4 adds page skeleton loading states to audited pages", () => {
  const mlops = read("src/app/components/pages/MLOpsDashboardPage.tsx");
  const profile = read("src/app/components/pages/UserProfilePage.tsx");
  const skeletons = read("src/app/components/Skeletons.tsx");

  assert.match(mlops, /isDataLoading/);
  assert.match(mlops, /MLOpsDashboardSkeleton/);
  assert.match(skeletons, /export function MLOpsDashboardSkeleton/);

  assert.match(profile, /isDataLoading/);
  assert.match(profile, /UserProfileSkeleton/);
});
