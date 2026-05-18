"use client";

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import { useSession } from "next-auth/react";

interface CartProduct {
  id: string;
  name: string;
  slug: string;
  price: number;
  images: string[];
  stock: number;
}

interface CartItem {
  id: string;
  productId: string;
  quantity: number;
  product: CartProduct;
}

interface CartContextType {
  items: CartItem[];
  loading: boolean;
  addItem: (productId: string, quantity: number) => Promise<void>;
  updateQuantity: (id: string, quantity: number) => Promise<void>;
  removeItem: (id: string) => Promise<void>;
  clearCart: () => Promise<void>;
  totalCount: number;
  totalPrice: number;
  mergeCart: () => Promise<void>;
}

const CartContext = createContext<CartContextType | null>(null);

const STORAGE_KEY = "yueling_cart";

function loadGuestCart(): { productId: string; quantity: number }[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  } catch {
    return [];
  }
}

function saveGuestCart(items: { productId: string; quantity: number }[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

export function CartProvider({ children }: { children: ReactNode }) {
  const { data: session } = useSession();
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Initialize
  useEffect(() => {
    async function init() {
      setLoading(true);
      if (session?.user?.id) {
        // Logged in: merge guest data first, then load
        const guestItems = loadGuestCart();
        if (guestItems.length > 0) {
          const mergeRes = await fetch("/api/cart/merge", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ items: guestItems }),
          });
          const mergeData = await mergeRes.json();
          if (mergeData.success) {
            setItems(mergeData.data);
            saveGuestCart([]);
            setLoading(false);
            return;
          }
        }
        // No guest data, load from server
        const res = await fetch("/api/cart");
        const data = await res.json();
        if (data.success) setItems(data.data);
      } else {
        // Guest: resolve localStorage items via API
        const guestItems = loadGuestCart();
        if (guestItems.length > 0) {
          const res = await fetch("/api/cart/resolve", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ items: guestItems }),
          });
          const data = await res.json();
          if (data.success) setItems(data.data);
        } else {
          setItems([]);
        }
      }
      setLoading(false);
    }
    init();
  }, [session?.user?.id]);

  const addItem = useCallback(async (productId: string, quantity: number) => {
    // Optimistic update
    setItems((prev) => {
      const existing = prev.find((i) => i.productId === productId);
      if (existing) {
        return prev.map((i) =>
          i.productId === productId ? { ...i, quantity: i.quantity + quantity } : i
        );
      }
      return [...prev, { id: `temp-${productId}`, productId, quantity, product: {} as CartProduct }];
    });

    const res = await fetch("/api/cart", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId, quantity }),
    });
    const data = await res.json();

    if (data.success && !session?.user?.id) {
      // Guest: save to localStorage
      const guestItems = loadGuestCart();
      const idx = guestItems.findIndex((i) => i.productId === productId);
      if (idx >= 0) {
        guestItems[idx].quantity += quantity;
      } else {
        guestItems.push({ productId, quantity });
      }
      saveGuestCart(guestItems);
      // Re-resolve product data
      const refreshRes = await fetch("/api/cart/resolve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: guestItems }),
      });
      const refreshData = await refreshRes.json();
      if (refreshData.success) setItems(refreshData.data);
    } else if (data.success && session?.user?.id) {
      setItems(data.data);
    }
  }, [session?.user?.id]);

  const updateQuantity = useCallback(async (id: string, quantity: number) => {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, quantity } : i)));

    await fetch(`/api/cart/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ quantity }),
    });

    if (!session?.user?.id) {
      const target = items.find((i) => i.id === id);
      if (target) {
        const guestItems = loadGuestCart();
        const idx = guestItems.findIndex((i) => i.productId === target.productId);
        if (idx >= 0) guestItems[idx].quantity = quantity;
        saveGuestCart(guestItems);
      }
    }
  }, [session?.user?.id, items]);

  const removeItem = useCallback(async (id: string) => {
    const target = items.find((i) => i.id === id);
    setItems((prev) => prev.filter((i) => i.id !== id));

    await fetch(`/api/cart/${id}`, { method: "DELETE" });

    if (!session?.user?.id && target) {
      const guestItems = loadGuestCart().filter((i) => i.productId !== target.productId);
      saveGuestCart(guestItems);
    }
  }, [session?.user?.id, items]);

  const clearCart = useCallback(async () => {
    setItems([]);
    await fetch("/api/cart", { method: "DELETE" });
    if (!session?.user?.id) saveGuestCart([]);
  }, [session?.user?.id]);

  const mergeCart = useCallback(async () => {
    if (!session?.user?.id) return;
    const guestItems = loadGuestCart();
    if (guestItems.length === 0) {
      const res = await fetch("/api/cart");
      const data = await res.json();
      if (data.success) setItems(data.data);
      return;
    }

    const res = await fetch("/api/cart/merge", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items: guestItems }),
    });
    const data = await res.json();
    if (data.success) {
      setItems(data.data);
      saveGuestCart([]);
    }
  }, [session?.user?.id]);

  const totalCount = items.reduce((sum, i) => sum + i.quantity, 0);
  const totalPrice = items.reduce((sum, i) => sum + Number(i.product?.price || 0) * i.quantity, 0);

  return (
    <CartContext.Provider value={{ items, loading, addItem, updateQuantity, removeItem, clearCart, totalCount, totalPrice, mergeCart }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
