'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Home, ChevronRight, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { AppBreadcrumb, type AppBreadcrumbItem } from '@/components/ui/AppBreadcrumb';
import { useBuyerOrders, useMarkOrderPaid } from '@/lib/hooks/use-orders';
import {
  ORDER_STATUSES_PAID,
  ORDER_STATUSES_TO_PAY,
  ORDER_STATUSES_CANCELLED,
  type OrderAPI,
  type OrderStatus,
} from '@/types/order';
import { OrderCard } from './OrderCard';
import { PaymentConfirmModal } from './PaymentConfirmModal';

const TABS_LEFT = [
  { id: 'da-pagare', label: 'DA PAGARE' },
  { id: 'pagato', label: 'PAGATO' },
  { id: 'inviato', label: 'INVIATO' },
  { id: 'ricevuto', label: 'RICEVUTO' },
  { id: 'acquisti-asta', label: 'ACQUISTI ASTA' },
] as const;

const TABS_RIGHT = [
  { id: 'cancellato', label: 'CANCELLATO' },
] as const;

type TabId =
  | (typeof TABS_LEFT)[number]['id']
  | (typeof TABS_RIGHT)[number]['id'];

const ALL_TABS = [...TABS_LEFT, ...TABS_RIGHT];

/**
 * Mapping tab -> backend statuses.
 *
 * Each tab is a different "view" of the same orders endpoint with a status
 * filter; the UI never invents statuses, it just shows the slice the user
 * cares about.
 */
const STATUSES_BY_TAB: Record<TabId, OrderStatus[] | undefined> = {
  'da-pagare': ORDER_STATUSES_TO_PAY,
  pagato: ['PAID'],
  inviato: ['SHIPPED'],
  ricevuto: ['DELIVERED'],
  // "Acquisti asta" surfaces every successful (paid) order; for slice 1 the
  // marketplace is auction-only so this is just an alias for "pagato + dopo".
  'acquisti-asta': ORDER_STATUSES_PAID,
  cancellato: ORDER_STATUSES_CANCELLED,
};

const EMPTY_MESSAGE_BY_TAB: Record<TabId, string> = {
  'da-pagare': 'Nessun ordine da pagare al momento.',
  pagato: 'Nessun ordine pagato.',
  inviato: 'Nessun ordine in spedizione.',
  ricevuto: 'Nessun ordine ricevuto.',
  'acquisti-asta': 'Non hai ancora vinto nessuna asta.',
  cancellato: 'Nessun ordine cancellato.',
};

function getTabLabel(tabId: TabId): string {
  return ALL_TABS.find((t) => t.id === tabId)?.label ?? tabId;
}

export function AcquistiContent() {
  const [activeTab, setActiveTab] = useState<TabId>('da-pagare');
  const [orderToPay, setOrderToPay] = useState<OrderAPI | null>(null);
  const [paymentError, setPaymentError] = useState<string | null>(null);

  const statuses = STATUSES_BY_TAB[activeTab];
  const ordersQuery = useBuyerOrders({ statuses, limit: 50, offset: 0 });
  const payMutation = useMarkOrderPaid();

  const orders = ordersQuery.data?.data ?? [];
  const total = ordersQuery.data?.total ?? 0;
  const activeLabel = getTabLabel(activeTab);
  const emptyMessage = EMPTY_MESSAGE_BY_TAB[activeTab];

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
      { href: '/ordini/acquisti', label: 'I MIEI ACQUISTI', isCurrent: false },
      { label: activeLabel, isCurrent: true },
    ],
    [activeLabel],
  );

  const handleConfirmPayment = async () => {
    if (!orderToPay) return;
    setPaymentError(null);
    try {
      await payMutation.mutateAsync({ orderId: orderToPay.id });
      setOrderToPay(null);
    } catch (err) {
      setPaymentError(err instanceof Error ? err.message : 'Pagamento non riuscito.');
    }
  };

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
          I MIEI ACQUISTI
        </h1>

        <div className="mb-6 flex flex-wrap items-center justify-between gap-x-2 gap-y-2 border-b border-gray-200 pb-3">
          <div className="flex flex-wrap items-center gap-x-1.5 gap-y-1.5">
            {TABS_LEFT.map((tab) => (
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
          <div className="ml-auto flex shrink-0 flex-wrap items-center gap-x-1.5 gap-y-1.5">
            {TABS_RIGHT.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'rounded-full px-3.5 py-1.5 text-xs font-semibold uppercase tracking-wide transition-colors',
                  activeTab === tab.id
                    ? 'bg-gray-700 text-white shadow-sm'
                    : 'bg-white text-gray-500 ring-1 ring-gray-200 hover:bg-gray-50 hover:text-gray-700',
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {ordersQuery.isLoading ? (
          <div className="flex min-h-[280px] items-center justify-center border border-gray-200 bg-white">
            <Loader2 className="h-6 w-6 animate-spin text-[#FF7300]" aria-hidden />
            <span className="sr-only">Caricamento ordini…</span>
          </div>
        ) : ordersQuery.isError ? (
          <div className="flex min-h-[280px] flex-col items-center justify-center gap-3 border border-red-200 bg-red-50 px-6 py-12 text-center">
            <p className="text-sm font-semibold text-red-800">
              {ordersQuery.error instanceof Error
                ? ordersQuery.error.message
                : 'Impossibile caricare gli ordini.'}
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
            {activeTab === 'da-pagare' && (
              <Link
                href="/aste"
                className="inline-flex items-center gap-1 text-sm font-medium text-[#FF7300] hover:underline"
              >
                Scopri le aste in corso
                <ChevronRight className="h-4 w-4" aria-hidden />
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <OrderCard
                key={order.id}
                order={order}
                perspective="buyer"
                onPay={(o) => {
                  setPaymentError(null);
                  setOrderToPay(o);
                }}
                paying={payMutation.isPending && orderToPay?.id === order.id}
              />
            ))}
            <p className="text-center text-xs text-gray-500">
              {total} ordin{total === 1 ? 'e' : 'i'} totali
            </p>
          </div>
        )}
      </div>

      <PaymentConfirmModal
        order={orderToPay}
        isPaying={payMutation.isPending}
        errorMessage={paymentError}
        onClose={() => {
          if (!payMutation.isPending) {
            setOrderToPay(null);
            setPaymentError(null);
          }
        }}
        onConfirm={handleConfirmPayment}
      />
    </div>
  );
}
