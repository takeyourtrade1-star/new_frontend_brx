'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { MarketplaceCartLine } from '@/types';

export type MockPurchaseOrderStatus = 'payment_pending' | 'paid';
export type MockPurchaseSource = 'cart' | 'buy_now';

export interface MockPurchaseOrder {
  id: string;
  status: MockPurchaseOrderStatus;
  source: MockPurchaseSource;
  title: string;
  quantity: number;
  priceCents: number;
  sellerId: string;
  sellerDisplayName?: string;
  imageUrl: string;
  listingId: string | number;
  cardId?: string;
  lineId?: string;
  createdAt: string;
  paidAt?: string;
}

interface CreateOptions {
  cardId?: string;
}

interface MockPurchaseState {
  orders: MockPurchaseOrder[];
  createFromCartLines: (
    lines: MarketplaceCartLine[],
    source: MockPurchaseSource,
    options?: CreateOptions,
  ) => string[];
  markPaid: (orderId: string) => void;
  markAllPaid: (orderIds: string[]) => void;
  getPendingOrders: () => MockPurchaseOrder[];
  getPaidOrders: () => MockPurchaseOrder[];
}

export const useMockPurchaseStore = create<MockPurchaseState>()(
  persist(
    (set, get) => ({
      orders: [],

      createFromCartLines: (lines, source, options) => {
        const now = new Date().toISOString();
        const newOrders: MockPurchaseOrder[] = lines.map((line) => ({
          id: crypto.randomUUID(),
          status: 'payment_pending',
          source,
          title: line.title,
          quantity: line.quantity,
          priceCents: line.priceCents,
          sellerId: line.sellerId,
          sellerDisplayName: line.sellerDisplayName,
          imageUrl: line.imageUrl,
          listingId: line.listingId,
          cardId: options?.cardId,
          lineId: line.lineId,
          createdAt: now,
        }));
        set((state) => ({ orders: [...newOrders, ...state.orders] }));
        return newOrders.map((o) => o.id);
      },

      markPaid: (orderId) => {
        const paidAt = new Date().toISOString();
        set((state) => ({
          orders: state.orders.map((o) =>
            o.id === orderId ? { ...o, status: 'paid', paidAt } : o,
          ),
        }));
      },

      markAllPaid: (orderIds) => {
        const paidAt = new Date().toISOString();
        const idSet = new Set(orderIds);
        set((state) => ({
          orders: state.orders.map((o) =>
            idSet.has(o.id) ? { ...o, status: 'paid', paidAt } : o,
          ),
        }));
      },

      getPendingOrders: () =>
        get().orders.filter((o) => o.status === 'payment_pending'),

      getPaidOrders: () => get().orders.filter((o) => o.status === 'paid'),
    }),
    {
      name: 'ebartex-mock-purchases',
      version: 1,
    },
  ),
);

export function getMockOrderTotalCents(order: MockPurchaseOrder): number {
  return order.priceCents * order.quantity;
}
