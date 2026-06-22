import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const root = fileURLToPath(new URL("../..", import.meta.url));
const read = (path) => readFileSync(join(root, path), "utf8");

test("login surfaces expose theme and language controls", () => {
  const controlsPath = join(root, "src/app/components/LoginControls.tsx");
  assert.equal(existsSync(controlsPath), true, "missing shared LoginControls component");

  const controls = read("src/app/components/LoginControls.tsx");
  assert.match(controls, /useTheme/);
  assert.match(controls, /setTheme/);
  assert.match(controls, /useTranslation/);
  assert.match(controls, /setLang/);
  assert.match(controls, /common\.toggle_dark_mode/);
  assert.match(controls, /common\.language/);

  for (const path of [
    "app/login/select/page.tsx",
    "src/app/components/PortalTemplate.tsx",
    "app/login/forgot-password/page.tsx",
  ]) {
    const source = read(path);
    assert.match(source, /LoginControls/, `${path} should render LoginControls`);
  }
});

test("login dark mode avoids oversized colored button glow", () => {
  const portalTemplate = read("src/app/components/PortalTemplate.tsx");

  assert.doesNotMatch(portalTemplate, /shadow-lg shadow-(indigo|emerald|teal|rose)-100"(?![^"]*dark:shadow-none)/);
  assert.match(portalTemplate, /dark:shadow-none/);
  assert.match(portalTemplate, /dark:bg-slate-950/);

  const selectPage = read("app/login/select/page.tsx");
  assert.match(selectPage, /dark:bg-slate-950/);
  assert.match(selectPage, /dark:bg-slate-900/);
  assert.match(selectPage, /dark:text-slate-100/);
});
