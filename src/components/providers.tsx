"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { CartLine, MenuItem } from "@/lib/types";

const CART_KEY = "slicewise.cart.v1";

interface CartState {
  lines: CartLine[];
  menu: MenuItem[];
  menuLoaded: boolean;
  count: number;
  subtotal: number;
  add: (itemId: string, qty?: number) => void;
  setQty: (itemId: string, qty: number) => void;
  clear: () => void;
  reloadMenu: () => Promise<void>;
}

const CartContext = createContext<CartState | null>(null);

export function Providers({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [menuLoaded, setMenuLoaded] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  const reloadMenu = useCallback(async () => {
    const res = await fetch("/api/menu", { cache: "no-store" });
    const json = await res.json();
    setMenu(json.menu);
    setMenuLoaded(true);
  }, []);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(CART_KEY);
      // Hydrating from localStorage (an external store) after mount is intentional.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (raw) setLines(JSON.parse(raw));
    } catch {}
    setHydrated(true);
    reloadMenu().catch(() => setMenuLoaded(true));

    if ("serviceWorker" in navigator && process.env.NODE_ENV === "production") {
      navigator.serviceWorker.register("/sw.js", { scope: "/", updateViaCache: "none" });
    }
  }, [reloadMenu]);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(CART_KEY, JSON.stringify(lines));
    } catch {}
  }, [lines, hydrated]);

  const setQty = useCallback((itemId: string, qty: number) => {
    setLines((prev) => {
      const rest = prev.filter((l) => l.itemId !== itemId);
      if (qty <= 0) return rest;
      const existing = prev.find((l) => l.itemId === itemId);
      if (!existing) return [...prev, { itemId, quantity: Math.min(qty, 20) }];
      return prev.map((l) => (l.itemId === itemId ? { ...l, quantity: Math.min(qty, 20) } : l));
    });
  }, []);

  const add = useCallback(
    (itemId: string, qty = 1) => {
      setLines((prev) => {
        const existing = prev.find((l) => l.itemId === itemId);
        if (!existing) return [...prev, { itemId, quantity: qty }];
        return prev.map((l) =>
          l.itemId === itemId ? { ...l, quantity: Math.min(l.quantity + qty, 20) } : l,
        );
      });
    },
    [],
  );

  const clear = useCallback(() => setLines([]), []);

  const value = useMemo<CartState>(() => {
    const count = lines.reduce((s, l) => s + l.quantity, 0);
    const subtotal = lines.reduce((s, l) => {
      const item = menu.find((m) => m.id === l.itemId);
      return s + (item ? item.price * l.quantity : 0);
    }, 0);
    return { lines, menu, menuLoaded, count, subtotal, add, setQty, clear, reloadMenu };
  }, [lines, menu, menuLoaded, add, setQty, clear, reloadMenu]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside <Providers>");
  return ctx;
}
