import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const root = fileURLToPath(new URL("../..", import.meta.url));
const read = (path) => readFileSync(join(root, path), "utf8");

test("P1 localizes remaining visible UserProfile and settings copy", () => {
  const userProfile = read("src/app/components/pages/UserProfilePage.tsx");
  const profileSettings = read("src/app/components/settings/ProfileSettingsPanel.tsx");

  assert.doesNotMatch(userProfile, /"vs bulan lalu"/);
  assert.doesNotMatch(userProfile, /alt="Avatar"|alt="Preview"/);
  assert.match(userProfile, /t\("prof\.metric\.vs_last"\)/);
  assert.match(userProfile, /t\("prof\.avatar\.alt"\)/);
  assert.match(userProfile, /t\("prof\.avatar\.preview_alt"\)/);

  assert.doesNotMatch(profileSettings, /defaultValue="Faiz Admin"/);
  assert.match(profileSettings, /defaultValue=\{t\("set\.profile\.display_name_mock"\)\}/);
});

test("P1 localizes XAI page narrative copy and labels", () => {
  const xaiPage = read("src/app/components/pages/XAIPage.tsx");

  const hardcodedCopy = [
    "Musim wisuda & akhir semester mendorong permintaan cetak foto naik tajam.",
    "Harga kompetitif dibanding toko foto terdekat.",
    "Stok:",
    "Pola Musim Wisuda",
    "Lonjakan Print Warna",
    "Stok Kertas Menipis",
    "Bundling Print + Jilid",
    "Graduation season pattern",
    "Color print surge",
    "Paper stock low",
    "Bundling opportunity",
  ];

  for (const copy of hardcodedCopy) {
    assert.doesNotMatch(xaiPage, new RegExp(copy.replaceAll("+", "\\+")));
  }

  assert.match(xaiPage, /t\("xai\.stock_label"/);
  assert.match(xaiPage, /t\("xai\.factor_desc\.foto4x6\.holiday"\)/);
  assert.match(xaiPage, /t\("xai\.insight\.pattern_graduation\.title"\)/);
});

test("P1 localizes POS receipt footer and date locale", () => {
  const paymentModal = read("src/app/components/pos/PaymentModal.tsx");

  assert.doesNotMatch(paymentModal, /Smart Retail POS/);
  assert.doesNotMatch(paymentModal, /toLocaleDateString\("id-ID"/);
  assert.match(paymentModal, /t\("pos\.receipt\.brand_tagline"\)/);
  assert.match(paymentModal, /const receiptLocale = lang === "ID" \? "id-ID" : "en-US"/);
});
