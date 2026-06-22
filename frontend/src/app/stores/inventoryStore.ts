/**
 * inventoryStore — Lightweight module-level reactive store.
 * Tracks stock deductions from POS checkouts so InventarisPage
 * reflects real-time sold quantities without a backend round-trip.
 *
 * Pattern: singleton state + subscriber set (same as Zustand internals).
 * No external dependency required.
 */

import { useEffect, useReducer } from "react";
import { formatDate } from "@/app/lib/format";

// ── Types ────────────────────────────────────────────────────────────────────

export interface SoldTxn {
  id: string;
  time: string;
  total: number;
  itemCount: number;
  items: { sku: string; name: string; qty: number; price: number }[];
}

interface StoreState {
  /** SKU → cumulative units deducted from inventory */
  deductions: Record<string, number>;
  /** Chronological list of completed transactions (newest first) */
  transactions: SoldTxn[];
}

type Listener = () => void;

// ── Singleton ────────────────────────────────────────────────────────────────

const _state: StoreState = {
  deductions: {},
  transactions: [],
};

const _listeners = new Set<Listener>();

function _notify() {
  _listeners.forEach(l => l());
}

// ── Public API ───────────────────────────────────────────────────────────────

export const inventoryStore = {
  getState: (): Readonly<StoreState> => _state,

  /**
   * Record a completed sale.
   * Called by useCheckout after a successful checkout.
   */
  deductStock(txnId: string, items: { sku: string; name: string; qty: number; price: number }[]) {
    const time = formatDate(new Date(), "time");
    items.forEach(i => {
      _state.deductions[i.sku] = (_state.deductions[i.sku] ?? 0) + i.qty;
    });
    _state.transactions.unshift({
      id: txnId,
      time,
      total: items.reduce((s, i) => s + i.price * i.qty, 0),
      itemCount: items.reduce((s, i) => s + i.qty, 0),
      items,
    });
    _notify();
  },

  /** How many units of a SKU have been sold since app load */
  getTotalDeducted(sku: string): number {
    return _state.deductions[sku] ?? 0;
  },

  /** Apply deduction to an original stock value — floor at 0 */
  getAdjustedStock(sku: string, originalStock: number): number {
    return Math.max(0, originalStock - this.getTotalDeducted(sku));
  },

  subscribe(listener: Listener): () => void {
    _listeners.add(listener);
    return () => _listeners.delete(listener);
  },

  reset() {
    _state.deductions = {};
    _state.transactions = [];
    _notify();
  },
};

// ── React Hook ───────────────────────────────────────────────────────────────

/**
 * useInventoryDeductions — Subscribe a component to inventory deduction changes.
 * Returns the current SKU→qty deductions map and re-renders on every update.
 */
export function useInventoryDeductions(): Record<string, number> {
  const [, forceUpdate] = useReducer((x: number) => x + 1, 0);
  useEffect(() => inventoryStore.subscribe(forceUpdate), []);
  return _state.deductions;
}
