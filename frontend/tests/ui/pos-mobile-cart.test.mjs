import assert from "node:assert/strict";
import test from "node:test";

const mobileCart = await import("../../src/app/lib/pos-mobile-cart.ts");

test("mobile cart bar is disabled but visible for an empty cart", () => {
  const state = mobileCart.getMobileCartBarState({
    subtotal: 0,
    discount: 0,
    tax: 0,
    total: 0,
    itemCount: 0,
  });

  assert.equal(state.hasItems, false);
  assert.equal(state.disabled, true);
  assert.equal(state.total, 0);
});

test("mobile cart bar enables checkout when cart has items", () => {
  const state = mobileCart.getMobileCartBarState({
    subtotal: 120_000,
    discount: 20_000,
    tax: 0,
    total: 100_000,
    itemCount: 3,
  });

  assert.equal(state.hasItems, true);
  assert.equal(state.disabled, false);
  assert.equal(state.total, 100_000);
  assert.equal(state.itemCount, 3);
});
