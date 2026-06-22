export interface MobileCartSummary {
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  itemCount: number;
}

export interface MobileCartBarState {
  hasItems: boolean;
  disabled: boolean;
  itemCount: number;
  total: number;
}

function nonNegativeFinite(value: number): number {
  return Number.isFinite(value) ? Math.max(0, value) : 0;
}

export function getMobileCartBarState(summary: MobileCartSummary): MobileCartBarState {
  const itemCount = Math.trunc(nonNegativeFinite(summary.itemCount));
  const total = nonNegativeFinite(summary.total);

  return {
    hasItems: itemCount > 0,
    disabled: itemCount === 0,
    itemCount,
    total,
  };
}
