'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { MarketplaceCartLine } from '@/types';

interface CartState {
  items: MarketplaceCartLine[];
  addItem: (line: MarketplaceCartLine) => void;
  removeItem: (lineId: string) => void;
  updateQuantity: (lineId: string, quantity: number) => void;
  clearCart: () => void;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (line) => {
        set((state) => {
          const existing = state.items.find((i) => i.lineId === line.lineId);
          if (existing) {
            const nextQty = Math.min(
              existing.maxQuantity,
              existing.quantity + line.quantity,
            );
            return {
              items: state.items.map((i) =>
                i.lineId === line.lineId
                  ? {
                      ...i,
                      isBrxExpress: line.isBrxExpress,
                      quantity: nextQty,
                    }
                  : i,
              ),
            };
          }
          return { items: [...state.items, line] };
        });
      },
      removeItem: (lineId) => {
        set((state) => ({
          items: state.items.filter((i) => i.lineId !== lineId),
        }));
      },
      updateQuantity: (lineId, quantity) => {
        if (quantity <= 0) {
          get().removeItem(lineId);
          return;
        }
        set((state) => ({
          items: state.items.map((i) =>
            i.lineId === lineId
              ? { ...i, quantity: Math.min(i.maxQuantity, quantity) }
              : i,
          ),
        }));
      },
      clearCart: () => set({ items: [] }),
    }),
    {
      name: 'ebartex-cart',
      version: 1,
      migrate: (persisted) => {
        const state = persisted as Partial<CartState> | undefined;
        if (!state?.items?.length) return { items: [] };
        const first = state.items[0] as MarketplaceCartLine & { productId?: string };
        if ('lineId' in first && first.lineId) {
          return { items: state.items as MarketplaceCartLine[] };
        }
        return { items: [] };
      },
    },
  ),
);
