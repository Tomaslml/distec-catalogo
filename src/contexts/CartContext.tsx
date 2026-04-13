import React, { createContext, useContext, useState, useCallback } from "react";
import type { Product } from "@/lib/seedData";

export interface CartItem {
  product: Product;
  qty: number;
}

interface CartContextType {
  items: CartItem[];
  addItem: (product: Product) => void;
  removeItem: (productId: string) => void;
  updateQty: (productId: string, qty: number) => void;
  clearCart: () => void;
  totalItems: number;
  subtotal: number;
  maryBosquesDiscount: number;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

const CartContext = createContext<CartContextType | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  const addItem = useCallback((product: Product) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.product.id === product.id);
      if (existing) {
        return prev.map((i) =>
          i.product.id === product.id ? { ...i, qty: i.qty + 1 } : i
        );
      }
      return [...prev, { product, qty: 1 }];
    });
  }, []);

  const removeItem = useCallback((productId: string) => {
    setItems((prev) => prev.filter((i) => i.product.id !== productId));
  }, []);

  const updateQty = useCallback((productId: string, qty: number) => {
    if (qty < 1) return;
    setItems((prev) =>
      prev.map((i) => (i.product.id === productId ? { ...i, qty } : i))
    );
  }, []);

  const clearCart = useCallback(() => setItems([]), []);

  const totalItems = items.reduce((sum, i) => sum + i.qty, 0);
  const baseTotal = items.reduce((sum, i) => {
    const price = i.product.discountPrice ?? i.product.price;
    return sum + price * i.qty;
  }, 0);

  const eligibleMaryBosquesPrices: number[] = [];
  items.forEach((i) => {
    const isMaryBosques = i.product.brand.toLowerCase().includes("mary bosques");
    // Tomamos como elegibles los productos que estén en el rango de precio mencionado (~7499)
    // O simplemente cualquier Mary Bosques que el usuario esté intentando sumar.
    // Usaremos un rango amplio para capturar los de 7000, 7500, etc.
    if (isMaryBosques && i.product.price >= 6000 && i.product.price <= 9000) {
      for (let n = 0; n < i.qty; n++) {
        eligibleMaryBosquesPrices.push(i.product.discountPrice ?? i.product.price);
      }
    }
  });

  // Ordenamos de mayor a menor para emparejar consistentemente
  eligibleMaryBosquesPrices.sort((a, b) => b - a);

  let maryBosquesDiscount = 0;
  for (let i = 0; i + 1 < eligibleMaryBosquesPrices.length; i += 2) {
    const pairSum = eligibleMaryBosquesPrices[i] + eligibleMaryBosquesPrices[i + 1];
    maryBosquesDiscount += (pairSum - 13000);
  }

  const subtotal = baseTotal - maryBosquesDiscount;

  return (
    <CartContext.Provider
      value={{ items, addItem, removeItem, updateQty, clearCart, totalItems, subtotal, maryBosquesDiscount, isOpen, setIsOpen }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
