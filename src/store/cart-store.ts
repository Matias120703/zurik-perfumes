import { create } from "zustand";

import type { Product } from "@/config/products";

export type CartLineItem = {
  product: Product;
  quantity: number;
};

type CartState = {
  items: CartLineItem[];
  addProduct: (product: Product) => void;
  removeProduct: (productId: string) => void;
  incrementQuantity: (productId: string) => void;
  decrementQuantity: (productId: string) => void;
  clearCart: () => void;
  getSubtotal: () => number;
  getTotalItems: () => number;
};

/**
 * Única fuente de verdad del carrito. Sin persistencia todavía: vive
 * solo en memoria y se reinicia al recargar la página (a propósito,
 * fuera de alcance de este sprint).
 */
export const useCartStore = create<CartState>((set, get) => ({
  items: [],

  addProduct: (product) =>
    set((state) => {
      const existing = state.items.find((item) => item.product.id === product.id);

      if (existing) {
        return {
          items: state.items.map((item) =>
            item.product.id === product.id
              ? { ...item, quantity: item.quantity + 1 }
              : item
          ),
        };
      }

      return { items: [...state.items, { product, quantity: 1 }] };
    }),

  removeProduct: (productId) =>
    set((state) => ({
      items: state.items.filter((item) => item.product.id !== productId),
    })),

  incrementQuantity: (productId) =>
    set((state) => ({
      items: state.items.map((item) =>
        item.product.id === productId ? { ...item, quantity: item.quantity + 1 } : item
      ),
    })),

  decrementQuantity: (productId) =>
    set((state) => ({
      items: state.items.map((item) =>
        item.product.id === productId
          ? { ...item, quantity: Math.max(1, item.quantity - 1) }
          : item
      ),
    })),

  clearCart: () => set({ items: [] }),

  getSubtotal: () =>
    get().items.reduce((sum, item) => sum + item.product.price * item.quantity, 0),

  getTotalItems: () => get().items.reduce((sum, item) => sum + item.quantity, 0),
}));
