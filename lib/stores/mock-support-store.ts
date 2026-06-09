'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type MockSupportTicketStatus = 'OPEN' | 'RESOLVED';

export interface MockSupportTicket {
  id: string;
  orderId: string;
  status: MockSupportTicketStatus;
  title: string;
  description: string;
  category: 'contestazione' | 'reso' | 'domanda';
  createdAt: string;
  resolvedAt?: string;
}

interface MockSupportState {
  tickets: MockSupportTicket[];
  addTicket: (ticket: Omit<MockSupportTicket, 'id' | 'createdAt'>) => void;
  resolveTicket: (id: string) => void;
  getOpenTickets: () => MockSupportTicket[];
  getResolvedTickets: () => MockSupportTicket[];
}

export const useMockSupportStore = create<MockSupportState>()(
  persist(
    (set, get) => ({
      tickets: [
        {
          id: 'mock-support-1',
          orderId: 'demo-ord-1234',
          status: 'OPEN',
          title: 'Problema con spedizione',
          description: 'Il pacco non è ancora arrivato dopo 2 settimane.',
          category: 'contestazione',
          createdAt: new Date(Date.now() - 86400000 * 14).toISOString(),
        },
        {
          id: 'mock-support-2',
          orderId: 'demo-ord-5678',
          status: 'RESOLVED',
          title: 'Domanda su metodo di pagamento',
          description: 'Vorrei sapere se posso pagare con bonifico.',
          category: 'domanda',
          createdAt: new Date(Date.now() - 86400000 * 30).toISOString(),
          resolvedAt: new Date(Date.now() - 86400000 * 28).toISOString(),
        },
      ],

      addTicket: (payload) => {
        const now = new Date().toISOString();
        const ticket: MockSupportTicket = {
          id: crypto.randomUUID(),
          createdAt: now,
          ...payload,
        };
        set((state) => ({ tickets: [ticket, ...state.tickets] }));
      },

      resolveTicket: (id) => {
        const resolvedAt = new Date().toISOString();
        set((state) => ({
          tickets: state.tickets.map((t) =>
            t.id === id ? { ...t, status: 'RESOLVED' as const, resolvedAt } : t,
          ),
        }));
      },

      getOpenTickets: () => get().tickets.filter((t) => t.status === 'OPEN'),

      getResolvedTickets: () =>
        get().tickets.filter((t) => t.status === 'RESOLVED'),
    }),
    {
      name: 'ebartex-mock-support',
      version: 1,
    },
  ),
);
