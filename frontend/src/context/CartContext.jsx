import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

const STORAGE_KEY = 'shopCart';

const loadCart = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const [items, setItems] = useState(loadCart);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    window.dispatchEvent(new Event('cart-change'));
  }, [items]);

  const addItem = useCallback((payload) => {
    const {
      productId,
      name,
      image,
      price,
      color,
      size,
      qty = 1,
    } = payload;

    setItems((prev) => {
      const idx = prev.findIndex(
        (i) =>
          i.productId === productId &&
          i.color === color &&
          i.size === size
      );
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = { ...next[idx], qty: next[idx].qty + qty };
        return next;
      }
      return [...prev, { productId, name, image, price, color, size, qty }];
    });
  }, []);

  const removeItem = useCallback((productId, color, size) => {
    setItems((prev) =>
      prev.filter(
        (i) =>
          !(i.productId === productId && i.color === color && i.size === size)
      )
    );
  }, []);

  const updateQty = useCallback((productId, color, size, qty) => {
    const q = Math.max(1, Number(qty) || 1);
    setItems((prev) =>
      prev.map((i) =>
        i.productId === productId && i.color === color && i.size === size
          ? { ...i, qty: q }
          : i
      )
    );
  }, []);

  const clearCart = useCallback(() => setItems([]), []);

  const cartCount = useMemo(
    () => items.reduce((acc, i) => acc + i.qty, 0),
    [items]
  );

  const subtotal = useMemo(
    () => items.reduce((acc, i) => acc + i.price * i.qty, 0),
    [items]
  );

  const value = useMemo(
    () => ({
      items,
      addItem,
      removeItem,
      updateQty,
      clearCart,
      cartCount,
      subtotal,
    }),
    [items, addItem, removeItem, updateQty, clearCart, cartCount, subtotal]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}
