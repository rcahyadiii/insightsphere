import { useState, useEffect, useMemo } from "react";
import { Product, CartItem, CartSummary } from "../types/pos";

const STORAGE_KEY = "pos_cart_v1";

interface HeldCart {
  items: CartItem[];
  time: string;
  itemCount: number;
}

function loadSavedCartItems(): CartItem[] {
  if (typeof window === "undefined") return [];
  const saved = window.localStorage.getItem(STORAGE_KEY);
  if (!saved) return [];
  try {
    return JSON.parse(saved) as CartItem[];
  } catch {
    return [];
  }
}

export function useCart() {
  const [items, setItems] = useState<CartItem[]>(loadSavedCartItems);
  const [itemDiscountPcts, setItemDiscountPcts] = useState<Record<string, number>>({});
  const [txnDiscountPct, setTxnDiscountPct] = useState(0);
  const [heldCarts, setHeldCarts] = useState<HeldCart[]>([]);

  // Save to LocalStorage on change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  const addItem = (product: Product) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.product_id === product.id);
      if (existing) {
        return prev.map((i) =>
          i.product_id === product.id ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [...prev, {
        product_id: product.id,
        sku: product.sku,
        name: product.name,
        price: product.base_price,
        quantity: product.min_qty ?? 1,
        unit: product.unit,
        image_url: product.image_url,
        version_at_add: product.version,
        is_service: product.is_service,
        min_qty: product.min_qty,
        custom_price: product.custom_price,
      }];
    });
  };

  const removeItem = (productId: string) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.product_id === productId);
      if (!existing) return prev;
      const floor = existing.min_qty ?? 1;
      if (existing.quantity > floor) {
        return prev.map((i) =>
          i.product_id === productId ? { ...i, quantity: i.quantity - 1 } : i
        );
      }
      if (floor === 1) return prev.filter((i) => i.product_id !== productId);
      return prev; // at min_qty — blocked; user must delete via X
    });
  };

  const deleteItem = (productId: string) => {
    setItems((prev) => prev.filter((i) => i.product_id !== productId));
  };

  const updatePrice = (productId: string, newPrice: number) => {
    setItems((prev) =>
      prev.map((i) => i.product_id === productId ? { ...i, price: Math.max(0, newPrice) } : i)
    );
  };

  const clearCart = () => {
    setItems([]);
    setItemDiscountPcts({});
    setTxnDiscountPct(0);
    localStorage.removeItem(STORAGE_KEY);
  };

  // --- Discount ---
  const setItemDiscount = (productId: string, pct: number) => {
    setItemDiscountPcts((prev) => ({
      ...prev,
      [productId]: Math.min(100, Math.max(0, pct)),
    }));
  };

  const setTxnDiscount = (pct: number) => {
    setTxnDiscountPct(Math.min(100, Math.max(0, pct)));
  };

  // --- Hold / Restore ---
  const holdCart = () => {
    if (items.length === 0) return;
    const time = new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
    setHeldCarts((prev) => [
      ...prev,
      { items: [...items], time, itemCount: items.reduce((s, i) => s + i.quantity, 0) },
    ]);
    clearCart();
  };

  const restoreCart = (index: number) => {
    const held = heldCarts[index];
    if (!held) return;
    setItems(held.items);
    setHeldCarts((prev) => prev.filter((_, i) => i !== index));
  };

  const deleteHeldCart = (index: number) => {
    setHeldCarts((prev) => prev.filter((_, i) => i !== index));
  };

  // --- Summary ---
  const summary = useMemo<CartSummary>(() => {
    const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
    const itemDiscountAmt = items.reduce((sum, i) => {
      const pct = itemDiscountPcts[i.product_id] ?? 0;
      return sum + i.price * i.quantity * (pct / 100);
    }, 0);
    const afterItemDiscount = subtotal - itemDiscountAmt;
    const txnDiscountAmt = afterItemDiscount * (txnDiscountPct / 100);
    const discount = Math.round(itemDiscountAmt + txnDiscountAmt);
    const tax = 0;
    return {
      subtotal,
      discount,
      tax,
      total: subtotal - discount + tax,
      itemCount: items.reduce((sum, i) => sum + i.quantity, 0),
    };
  }, [items, itemDiscountPcts, txnDiscountPct]);

  return {
    items,
    addItem,
    removeItem,
    deleteItem,
    updatePrice,
    clearCart,
    itemDiscountPcts,
    setItemDiscount,
    txnDiscountPct,
    setTxnDiscount,
    heldCarts,
    holdCart,
    restoreCart,
    deleteHeldCart,
    summary,
    isEmpty: items.length === 0,
  };
}
