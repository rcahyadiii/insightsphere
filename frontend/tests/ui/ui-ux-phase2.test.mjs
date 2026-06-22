import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join } from "node:path";
import test from "node:test";

const root = fileURLToPath(new URL("../..", import.meta.url));

const read = (path) => readFileSync(join(root, path), "utf8");

test("Phase 2 removes hardcoded aria-label strings from audited app components", () => {
  const auditedFiles = [
    "src/app/components/Breadcrumbs.tsx",
    "src/app/components/Header.tsx",
    "src/app/components/Skeletons.tsx",
    "src/app/components/Stepper.tsx",
    "src/app/components/inventory/ExcelImportModal.tsx",
    "src/app/components/pages/DashboardPage.tsx",
    "src/app/components/pages/LaporanPage.tsx",
    "src/app/components/pages/MLOpsDashboardPage.tsx",
    "src/app/components/pages/PengaturanPage.tsx",
    "src/app/components/pages/TransactionHistoryPage.tsx",
    "src/app/components/pages/UserProfilePage.tsx",
    "src/app/components/pages/XAIPage.tsx",
    "src/app/components/ui/breadcrumb.tsx",
    "src/app/components/ui/dialog.tsx",
    "src/app/components/ui/navigation-menu.tsx",
    "src/app/components/ui/pagination.tsx",
    "src/app/components/ui/sheet.tsx",
    "src/app/components/ui/sidebar.tsx",
  ];

  const offenders = auditedFiles.flatMap((file) => {
    const matches = read(file).match(/aria-label="[^"]+"/g) ?? [];
    return matches.map((match) => `${file}: ${match}`);
  });

  assert.deepEqual(offenders, []);
});

test("Phase 2 uses focus-visible rings instead of focus rings in audited shadcn primitives", () => {
  const auditedFiles = [
    "src/app/components/ui/dialog.tsx",
    "src/app/components/ui/navigation-menu.tsx",
    "src/app/components/ui/sheet.tsx",
  ];

  const offenders = auditedFiles.flatMap((file) => {
    const matches = read(file).match(/\bfocus:ring\b|\bfocus:ring-[^\s"`]+/g) ?? [];
    return matches.map((match) => `${file}: ${match}`);
  });

  assert.deepEqual(offenders, []);
});

test("Phase 2 localizes SkipLink text through i18n", () => {
  const skipLink = read("src/app/components/SkipLink.tsx");

  assert.match(skipLink, /useTranslation/);
  assert.match(skipLink, /t\("common\.skip_to_content"\)/);
  assert.doesNotMatch(skipLink, /Lompat ke konten utama/);
});

test("Phase 2 status indicators include a non-color visual cue", () => {
  const xaiPage = read("src/app/components/pages/XAIPage.tsx");
  const laporanPage = read("src/app/components/pages/LaporanPage.tsx");
  const mlopsPage = read("src/app/components/pages/MLOpsDashboardPage.tsx");

  assert.match(xaiPage, /getStatusIcon/);
  assert.match(laporanPage, /restockStatusConfig/);
  assert.match(mlopsPage, /MODEL_STATUS_CONFIG/);
});
