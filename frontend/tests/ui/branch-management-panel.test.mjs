import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const root = fileURLToPath(new URL("../..", import.meta.url));
const read = (path) => readFileSync(join(root, path), "utf8");

test("store settings panel is backed by branch API client and no longer static sample data", () => {
  const source = read("src/app/components/settings/StoreSettingsPanel.tsx");

  assert.match(source, /fetchBranches/);
  assert.match(source, /createBranch/);
  assert.match(source, /updateBranch/);
  assert.match(source, /deactivateBranch/);
  assert.match(source, /BranchFormModal/);
  assert.match(source, /BranchDeactivateDialog/);
  assert.match(source, /role="tablist"/);
  assert.match(source, /aria-live="polite"/);
  assert.match(source, /hidden md:block/);
  assert.match(source, /md:hidden/);
  assert.doesNotMatch(source, /defaultValue="Fotokopi Jaya/);
  assert.doesNotMatch(source, /defaultValue="info@fotokopijaya/);
});

test("branch form modal and deactivate dialog include expected accessibility hooks", () => {
  const formPath = "src/app/components/settings/BranchFormModal.tsx";
  const deactivatePath = "src/app/components/settings/BranchDeactivateDialog.tsx";
  assert.equal(existsSync(join(root, formPath)), true, "missing BranchFormModal");
  assert.equal(existsSync(join(root, deactivatePath)), true, "missing BranchDeactivateDialog");

  const form = read(formPath);
  const deactivate = read(deactivatePath);

  assert.match(form, /role="dialog"/);
  assert.match(form, /aria-modal="true"/);
  assert.match(form, /htmlFor="branch-store-nbr"/);
  assert.match(form, /htmlFor="branch-code"/);
  assert.match(form, /htmlFor="branch-name"/);
  assert.match(form, /htmlFor="branch-address"/);
  assert.match(form, /role="alert"/);
  assert.match(form, /aria-busy/);

  assert.match(deactivate, /role="dialog"/);
  assert.match(deactivate, /aria-modal="true"/);
  assert.match(deactivate, /deactivate_confirm_title/);
  assert.match(deactivate, /deactivate_confirm_body/);
  assert.match(deactivate, /role="alert"/);
  assert.match(deactivate, /aria-busy/);
});

test("branch management copy exists in Indonesian and English dictionaries", () => {
  const source = read("src/app/i18n.tsx");
  const keys = [
    "set.store.branches.add",
    "set.store.branches.active",
    "set.store.branches.inactive",
    "set.store.branches.search",
    "set.store.branches.empty",
    "set.store.branches.load_error",
    "set.store.branches.save_error",
    "set.store.branches.created",
    "set.store.branches.updated",
    "set.store.branches.deactivated",
    "set.store.branches.reactivated",
    "set.store.branches.blocked",
    "set.store.branches.edit",
    "set.store.branches.deactivate",
    "set.store.branches.reactivate",
    "set.store.branches.code",
    "set.store.branches.name",
    "set.store.branches.store_nbr",
    "set.store.branches.address",
    "set.store.branches.phone",
    "set.store.branches.email",
    "set.store.branches.opening_time",
    "set.store.branches.closing_time",
    "set.store.branches.status",
    "set.store.branches.actions",
    "set.store.branches.contact",
    "set.store.branches.hours",
    "set.store.branches.add_title",
    "set.store.branches.edit_title",
    "set.store.branches.form_desc",
    "set.store.branches.cancel",
    "set.store.branches.create",
    "set.store.branches.save",
    "set.store.branches.close",
    "set.store.branches.deactivate_confirm_title",
    "set.store.branches.deactivate_confirm_body",
    "set.store.branches.error_store_nbr",
    "set.store.branches.error_code",
    "set.store.branches.error_name",
    "set.store.branches.error_address",
    "set.store.branches.error_hours",
  ];

  for (const key of keys) {
    const count = source.match(new RegExp(`"${key}"`, "g"))?.length ?? 0;
    assert.equal(count, 2, `${key} should exist once in each locale`);
  }
});
