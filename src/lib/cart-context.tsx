import React, { createContext, useContext, useState, useCallback } from 'react';
import type { CartItem, VendorProduct } from './mock-data';

interface CartContextType {
  items: CartItem[];
  addItem: (vp: VendorProduct) => void;
  removeItem: (vpId: string) => void;
  updateQuantity: (vpId: string, qty: number) => void;
  clearCart: () => void;
  totalItems: number;
  totalPrice: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);

  const addItem = useCallback((vp: VendorProduct) => {
    setItems(prev => {
      const existing = prev.find(i => i.vendorProduct.id === vp.id);
      if (existing) {
        return prev.map(i =>
          i.vendorProduct.id === vp.id ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [...prev, { vendorProduct: vp, quantity: 1 }];
    });
  }, []);

  const removeItem = useCallback((vpId: string) => {
    setItems(prev => prev.filter(i => i.vendorProduct.id !== vpId));
  }, []);

  const updateQuantity = useCallback((vpId: string, qty: number) => {
    if (qty <= 0) {
      setItems(prev => prev.filter(i => i.vendorProduct.id !== vpId));
    } else {
      setItems(prev =>
        prev.map(i => (i.vendorProduct.id === vpId ? { ...i, quantity: qty } : i))
      );
    }
  }, []);

  const clearCart = useCallback(() => setItems([]), []);

  const totalItems = items.reduce((s, i) => s + i.quantity, 0);
  const totalPrice = items.reduce((s, i) => s + i.vendorProduct.price * i.quantity, 0);

  return (
    <CartContext.Provider value={{ items, addItem, removeItem, updateQuantity, clearCart, totalItems, totalPrice }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}
