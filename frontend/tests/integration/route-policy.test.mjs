import assert from "node:assert/strict";
import test from "node:test";

const routePolicy = await import("../../src/app/lib/route-policy.ts");

test("classifies login and invite URLs as public routes", () => {
  assert.equal(routePolicy.isPublicPath("/login/select"), true);
  assert.equal(routePolicy.isPublicPath("/login/admin"), true);
  assert.equal(routePolicy.isPublicPath("/accept-invite/dev-token"), true);
});

test("does not classify path substrings as public routes", () => {
  assert.equal(routePolicy.isPublicPath("/catalog-login"), false);
  assert.equal(routePolicy.isPublicPath("/accept-invitee/dev-token"), false);
});

test("classifies POS as fullscreen and regular dashboard pages as app shell", () => {
  assert.equal(routePolicy.getShellMode("/kasir"), "fullscreen");
  assert.equal(routePolicy.getShellMode("/kasir/refund"), "fullscreen");
  assert.equal(routePolicy.getShellMode("/inventaris"), "app");
});

test("skips auth hydration and unauthorized redirects on public routes", () => {
  assert.equal(routePolicy.shouldHydrateAuth("/login/select"), false);
  assert.equal(routePolicy.shouldHydrateAuth("/accept-invite/dev-token"), false);
  assert.equal(routePolicy.shouldHandleUnauthorizedRedirect("/accept-invite/dev-token"), false);
});

test("keeps auth hydration and unauthorized redirects on protected routes", () => {
  assert.equal(routePolicy.shouldHydrateAuth("/"), true);
  assert.equal(routePolicy.shouldHydrateAuth("/kasir"), true);
  assert.equal(routePolicy.shouldHandleUnauthorizedRedirect("/inventaris"), true);
});
