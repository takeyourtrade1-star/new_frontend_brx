'use client';

import { useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Home, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { AppBreadcrumb, type AppBreadcrumbItem } from '@/components/ui/AppBreadcrumb';
import { useSellerOrders } from '@/lib/hooks/use-orders';
import { useOpenDispute } from '@/lib/hooks/use-disputes';
import {
  ORDER_STATUSES_PAID,
  ORDER_STATUSES_TO_PAY,
  ORDER_STATUSES_CANCELLED,
  type OrderStatus,
} from '@/types/order';
import { OrderCard } from '@/components/feature/acquisti/OrderCard';

const TABS = [
  { id: 'in-attesa', label: 'IN ATTESA DI PAGAMENTO' },
  { id: 'pagati', label: 'PAGATI' },
  { id: 'spediti', label: 'SPEDITI' },
  { id: 'consegnati', label: 'CONSEGNATI' },
  { id: 'cancellati', label: 'CANCELLATI' },
] as const;

type TabId = (typeof TABS)[number]['id'];

const STATUSES_BY_TAB: Record<TabId, OrderStatus[] | undefined> = {
  'in-attesa': ORDER_STATUSES_TO_PAY,
  pagati: ['PAID'],
  spediti: ['SHIPPED'],
  consegnati: ['DELIVERED'],
  cancellati: ORDER_STATUSES_CANCELLED,
};

const EMPTY_BY_TAB: Record<TabId, string> = {
  'in-attesa': 'Nessuna asta in attesa di pagamento.',
  pagati: 'Nessuna vendita pagata.',
  spediti: 'Nessuna vendita ancora spedita.',
  consegnati: 'Nessuna vendita ancora consegnata.',
  cancellati: 'Nessuna vendita cancellata.',
};

function getTabLabel(id: TabId): string {
  return TABS.find((t) => t.id === id)?.label ?? id;
}

export function VenditeContent() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabId>('in-attesa');

  const statuses = STATUSES_BY_TAB[activeTab];
  const ordersQuery = useSellerOrders({ statuses, limit: 50, offset: 0 });
  const openDisputeMutation = useOpenDispute();

  // Track which specific order ID is currently opening a dispute.
  const openingOrderIdRef = useRef<number | null>(null);
  const [openingOrderId, setOpeningOrderId] = useState<number | null>(null);

  const orders = ordersQuery.data?.data ?? [];
  const total = ordersQuery.data?.total ?? 0;
  const activeLabel = getTabLabel(activeTab);
  const emptyMessage = EMPTY_BY_TAB[activeTab];

  const breadcrumbItems: AppBreadcrumbItem[] = useMemo(
    () => [
      {
        href: '/',
        label: 'Home',
        ariaLabel: 'Home',
        icon: <Home className="h-4 w-4" />,
        iconOnly: true,
        isCurrent: false,
      },
      { label: 'ORDINI', isCurrent: false },
      { href: '/ordini/vendite', label: 'LE MIE VENDITE', isCurrent: false },
      { label: activeLabel, isCurrent: true },
    ],
    [activeLabel],
  );

  return (
    <div className="min-h-screen w-full font-sans" style={{ backgroundColor: '#F5F4F0' }}>
      <div className="container-content mx-auto py-8 md:py-10">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <AppBreadcrumb
            items={breadcrumbItems}
            ariaLabel="Breadcrumb"
            variant="default"
            className="w-auto text-sm"
          />
          <Link
            href="/aiuto"
            className="text-sm font-medium text-[#FF7300] hover:underline"
          >
            HAI BISOGNO DI AIUTO?
          </Link>
        </div>

        <h1 className="mb-6 text-2xl font-bold uppercase tracking-wide text-gray-900 sm:text-3xl">
          LE MIE VENDITE
        </h1>

        <div className="mb-6 flex flex-wrap items-center gap-x-1.5 gap-y-1.5 border-b border-gray-200 pb-3">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'rounded-full px-3.5 py-1.5 text-xs font-semibold uppercase tracking-wide transition-colors',
                activeTab === tab.id
                  ? 'bg-[#FF7300] text-white shadow-sm'
                  : 'bg-white text-gray-600 ring-1 ring-gray-200 hover:bg-gray-50 hover:text-gray-900',
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {ordersQuery.isLoading ? (
          <div className="flex min-h-[280px] items-center justify-center border border-gray-200 bg-white">
            <Loader2 className="h-6 w-6 animate-spin text-[#FF7300]" aria-hidden />
            <span className="sr-only">Caricamento vendite…</span>
          </div>
        ) : ordersQuery.isError ? (
          <div className="flex min-h-[280px] flex-col items-center justify-center gap-3 border border-red-200 bg-red-50 px-6 py-12 text-center">
            <p className="text-sm font-semibold text-red-800">
              {ordersQuery.error instanceof Error
                ? ordersQuery.error.message
                : 'Impossibile caricare le vendite.'}
            </p>
            <button
              type="button"
              onClick={() => ordersQuery.refetch()}
              className="text-sm font-semibold text-[#FF7300] hover:underline"
            >
              Riprova
            </button>
          </div>
        ) : orders.length === 0 ? (
          <div className="flex min-h-[280px] flex-col items-center justify-center gap-4 border border-gray-200 bg-white px-6 py-12">
            <p className="text-center text-base font-semibold uppercase tracking-wide text-gray-500">
              {emptyMessage}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <OrderCard
                key={order.id}
                order={order}
                perspective="seller"
                onOpenDispute={(o) => {
                  if (openingOrderIdRef.current !== null) return;
                  openingOrderIdRef.current = o.id;
                  setOpeningOrderId(o.id);
                  void openDisputeMutation
                    .mutateAsync({ orderId: o.id })
                    .then((res) => {
                      const disputeId = (res as { data?: { id?: number } })?.data?.id;
                      if (disputeId) {
                        router.push(`/ordini/contestazioni/${disputeId}`);
                      }
                    })
                    .finally(() => {
                      openingOrderIdRef.current = null;
                      setOpeningOrderId(null);
                    });
                }}
                openingDispute={openingOrderId === order.id}
              />
            ))}
            <p className="text-center text-xs text-gray-500">
              {total} vendit{total === 1 ? 'a' : 'e'} totali
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
