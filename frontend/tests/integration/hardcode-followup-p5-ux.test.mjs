import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const root = fileURLToPath(new URL("../..", import.meta.url));
const read = (path) => readFileSync(join(root, path), "utf8");

test("Sidebar group separator memilih border lebih solid saat collapsed", () => {
  const sidebar = read("src/app/components/Sidebar.tsx");
  assert.match(
    sidebar,
    /collapsed[\s\S]*?border-t border-slate-200 dark:border-slate-800[\s\S]*?:\s*"mt-2 pt-3 border-t border-slate-200\/70 dark:border-slate-800\/60"/,
  );
});

test("Mirror watermark hidden di mobile dan punya padding kompak di sm+", () => {
  const banner = read("src/app/components/MirrorModeBanner.tsx");
  // <sm: watermark disembunyikan supaya tidak overlap dengan POS mobile cart bar
  // (KasirPage `fixed inset-x-3 bottom-[...]` di breakpoint < xl). Banner top tetap muncul.
  assert.match(banner, /"hidden sm:block"/);
  assert.match(banner, /sm:bottom-4 sm:right-4/);
  assert.match(banner, /px-2 py-0\.5 shadow-sm backdrop-blur-sm/);
  assert.match(banner, /sm:px-3 sm:py-1/);
  assert.doesNotMatch(banner, /pointer-events-none fixed bottom-4 right-4 select-none/);
});

test("Login surfaces tidak meninggalkan literal copy ID/EN diluar i18n", () => {
  const pages = [
    "app/login/page.tsx",
    "app/login/select/page.tsx",
    "app/login/forgot-password/page.tsx",
    "src/app/components/PortalTemplate.tsx",
    "src/app/components/LoginControls.tsx",
  ];
  for (const path of pages) {
    const source = read(path);
    assert.doesNotMatch(source, /Masukkan username/);
    assert.doesNotMatch(source, /Lupa password\?/);
    assert.doesNotMatch(source, /Sign in to InsightSphere/);
  }
});