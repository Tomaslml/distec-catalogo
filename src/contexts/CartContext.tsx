import React, { createContext, useContext, useState, useCallback } from "react";
import type { Product } from "@/lib/seedData";
import { isProductEligibleForMaryBosquesPromo } from "@/lib/promoUtils";


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
    const isEligible = isProductEligibleForMaryBosquesPromo(i.product);
    
    if (isEligible) {
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
    // Solo aplicamos descuento si el par suma más de 13000
    if (pairSum > 13000) {
      maryBosquesDiscount += (pairSum - 13000);
    }
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
