'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
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
import {
  getMyOrders,
  MarketplaceApiError,
  type OrderResponse,
  type OrderStatus as MarketplaceStatus,
} from '@/lib/api/marketplace-client';
import { useTranslation } from '@/lib/i18n/useTranslation';
import {
  useMockPurchaseStore,
  type MockPurchaseOrder,
} from '@/lib/stores/mock-purchase-store';
import { useMockSupportStore } from '@/lib/stores/mock-support-store';
import { useCartStore } from '@/lib/stores/cart-store';
import { disputesApi } from '@/lib/api/disputes-client';
import type { DisputeAPI } from '@/types/dispute';
import { OrderCard } from './OrderCard';
import { MarketplaceOrderCard } from './MarketplaceOrderCard';
import { PaymentConfirmModal } from './PaymentConfirmModal';
import { MockPurchaseOrderCard } from './MockPurchaseOrderCard';
import { MockPaymentFormModal } from './MockPaymentFormModal';
import { CartPreviewSection } from './CartPreviewSection';
import { SupportTicketCard } from './SupportTicketCard';

const TABS_LEFT = [
  { id: 'da-pagare', label: 'DA PAGARE' },
  { id: 'pagato', label: 'PAGATO' },
  { id: 'inviato', label: 'INVIATO' },
  { id: 'ricevuto', label: 'RICEVUTO' },
  { id: 'acquisti', label: 'ACQUISTI' },
] as const;

const TABS_RIGHT = [
  { id: 'supporto', label: 'SUPPORTO' },
  { id: 'cancellato', label: 'CANCELLATO' },
] as const;

type TabId =
  | (typeof TABS_LEFT)[number]['id']
  | (typeof TABS_RIGHT)[number]['id'];

const ALL_TABS = [...TABS_LEFT, ...TABS_RIGHT];

const STATUSES_BY_TAB: Record<TabId, OrderStatus[] | undefined> = {
  'da-pagare': ORDER_STATUSES_TO_PAY,
  pagato: ['PAID'],
  inviato: ['SHIPPED'],
  ricevuto: ['DELIVERED'],
  acquisti: undefined,
  supporto: undefined,
  cancellato: ORDER_STATUSES_CANCELLED,
};

const EMPTY_MESSAGE_BY_TAB: Record<TabId, string> = {
  'da-pagare': 'Nessun ordine da pagare al momento.',
  pagato: 'Nessun ordine pagato.',
  inviato: 'Nessun ordine in spedizione.',
  ricevuto: 'Nessun ordine ricevuto.',
  acquisti: 'Non hai ancora effettuato acquisti.',
  supporto: 'Nessuna segnalazione aperta.',
  cancellato: 'Nessun ordine cancellato.',
};

function getTabLabel(tabId: TabId): string {
  return ALL_TABS.find((t) => t.id === tabId)?.label ?? tabId;
}

function isValidTabId(value: string | null): value is TabId {
  return ALL_TABS.some((t) => t.id === value);
}

function mapMarketplaceStatusToTab(status: MarketplaceStatus): TabId | null {
  switch (status) {
    case 'pending':
      return 'da-pagare';
    case 'confirmed':
      return 'pagato';
    case 'shipped':
      return 'inviato';
    case 'completed':
      return 'ricevuto';
    case 'cancelled':
      return 'cancellato';
    default:
      return null;
  }
}

function filterMarketplaceByTab(
  orders: OrderResponse[],
  tab: TabId,
): OrderResponse[] {
  if (tab === 'acquisti') return orders;
  if (tab === 'supporto') return [];
  return orders.filter((o) => mapMarketplaceStatusToTab(o.status) === tab);
}

function filterMockByTab(
  orders: MockPurchaseOrder[],
  tab: TabId,
): MockPurchaseOrder[] {
  if (tab === 'acquisti') return orders;
  if (tab === 'supporto') return [];
  if (tab === 'da-pagare') return orders.filter((o) => o.status === 'payment_pending');
  if (tab === 'pagato') return orders.filter((o) => o.status === 'paid');
  return [];
}

export function AcquistiContent() {
  const { t } = useTranslation();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get('tab');

  const [activeTab, setActiveTab] = useState<TabId>('da-pagare');
  const [orderToPay, setOrderToPay] = useState<OrderAPI | null>(null);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [mockOrderToPay, setMockOrderToPay] = useState<MockPurchaseOrder | null>(null);
  const [mockPaying, setMockPaying] = useState(false);
  const [showCheckoutHint, setShowCheckoutHint] = useState(false);
  const [previewRefreshKey, setPreviewRefreshKey] = useState(0);

  const mockOrders = useMockPurchaseStore((s) => s.orders);
  const markPaid = useMockPurchaseStore((s) => s.markPaid);
  const cartItems = useCartStore((s) => s.items);

  const mockPendingOrders = useMemo(
    () => mockOrders.filter((o) => o.status === 'payment_pending'),
    [mockOrders],
  );
  const mockPaidOrders = useMemo(
    () => mockOrders.filter((o) => o.status === 'paid'),
    [mockOrders],
  );

  useEffect(() => {
    if (isValidTabId(tabParam)) {
      setActiveTab(tabParam);
    }
    if (tabParam === 'da-pagare') {
      setShowCheckoutHint(true);
    }
  }, [tabParam]);

  const isAcquistiTab = activeTab === 'acquisti';
  const isSupportoTab = activeTab === 'supporto';
  const isDaPagareTab = activeTab === 'da-pagare';
  const isPagatoTab = activeTab === 'pagato';
  const statuses = STATUSES_BY_TAB[activeTab];
  const ordersQuery = useBuyerOrders(
    { statuses, limit: 50, offset: 0 },
    { enabled: !isSupportoTab },
  );
  const payMutation = useMarkOrderPaid();

  const [marketplaceOrders, setMarketplaceOrders] = useState<OrderResponse[]>([]);
  const [marketplaceTotal, setMarketplaceTotal] = useState(0);
  const [marketplaceLoading, setMarketplaceLoading] = useState(false);
  const [marketplaceError, setMarketplaceError] = useState<string | null>(null);

  const loadMarketplaceOrders = useCallback(async () => {
    setMarketplaceLoading(true);
    setMarketplaceError(null);
    try {
      const res = await getMyOrders({ page: 1, page_size: 50 });
      setMarketplaceOrders(res.items);
      setMarketplaceTotal(res.total);
    } catch (e) {
      const msg =
        e instanceof MarketplaceApiError
          ? e.detail
          : e instanceof Error
            ? e.message
            : 'Impossibile caricare gli ordini marketplace.';
      setMarketplaceError(msg);
    } finally {
      setMarketplaceLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isSupportoTab) return;
    void loadMarketplaceOrders();
  }, [isSupportoTab, loadMarketplaceOrders]);

  const filteredMarketplaceOrders = useMemo(
    () => filterMarketplaceByTab(marketplaceOrders, activeTab),
    [marketplaceOrders, activeTab],
  );

  const filteredMockOrders = useMemo(
    () => filterMockByTab(mockOrders, activeTab),
    [mockOrders, activeTab],
  );

  const [disputes, setDisputes] = useState<DisputeAPI[]>([]);
  const [disputesLoading, setDisputesLoading] = useState(false);
  const [disputesError, setDisputesError] = useState<string | null>(null);

  const loadDisputes = useCallback(async () => {
    setDisputesLoading(true);
    setDisputesError(null);
    try {
      const res = await disputesApi.listMine(50, 0);
      setDisputes(res.data);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Impossibile caricare le segnalazioni.';
      setDisputesError(msg);
    } finally {
      setDisputesLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isSupportoTab) return;
    void loadDisputes();
  }, [isSupportoTab, loadDisputes]);

  const mockSupportTickets = useMockSupportStore((s) => s.tickets);

  const orders = ordersQuery.data?.data ?? [];
  const total = ordersQuery.data?.total ?? 0;
  const activeLabel = getTabLabel(activeTab);
  const emptyMessage = EMPTY_MESSAGE_BY_TAB[activeTab];

  const hasDaPagareContent =
    isDaPagareTab &&
    (cartItems.length > 0 || filteredMockOrders.length > 0 || orders.length > 0 || filteredMarketplaceOrders.length > 0);

  const hasPagatoContent =
    isPagatoTab && (filteredMockOrders.length > 0 || orders.length > 0 || filteredMarketplaceOrders.length > 0);

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

  const handleConfirmMockPayment = () => {
    if (!mockOrderToPay) return;
    setMockPaying(true);
    markPaid(mockOrderToPay.id);
    setMockOrderToPay(null);
    setMockPaying(false);
  };

  const handlePreviewOrdersCreated = () => {
    setPreviewRefreshKey((k) => k + 1);
    setShowCheckoutHint(true);
  };

  const totalItemsCount =
    orders.length + filteredMarketplaceOrders.length + filteredMockOrders.length;

  const renderOrdersContent = () => {
    const isLoading = ordersQuery.isLoading || marketplaceLoading;
    const isError = ordersQuery.isError || marketplaceError;

    if (isLoading && !isDaPagareTab && !isPagatoTab) {
      return (
        <div className="flex min-h-[280px] items-center justify-center border border-gray-200 bg-white">
          <Loader2 className="h-6 w-6 animate-spin text-[#FF7300]" aria-hidden />
          <span className="sr-only">Caricamento ordini…</span>
        </div>
      );
    }

    if (isError && !isDaPagareTab && !isPagatoTab) {
      return (
        <div className="flex min-h-[280px] flex-col items-center justify-center gap-3 border border-red-200 bg-red-50 px-6 py-12 text-center">
          <p className="text-sm font-semibold text-red-800">
            {ordersQuery.error instanceof Error
              ? ordersQuery.error.message
              : marketplaceError ?? 'Impossibile caricare gli ordini.'}
          </p>
          <button
            type="button"
            onClick={() => {
              ordersQuery.refetch();
              void loadMarketplaceOrders();
            }}
            className="text-sm font-semibold text-[#FF7300] hover:underline"
          >
            Riprova
          </button>
        </div>
      );
    }

    if (isDaPagareTab) {
      if (!hasDaPagareContent && !ordersQuery.isLoading) {
        return (
          <div className="flex min-h-[280px] flex-col items-center justify-center gap-4 border border-gray-200 bg-white px-6 py-12">
            <p className="text-center text-base font-semibold uppercase tracking-wide text-gray-500">
              {emptyMessage}
            </p>
            <Link
              href="/home"
              className="inline-flex items-center gap-1 text-sm font-medium text-[#FF7300] hover:underline"
            >
              Esplora il marketplace
              <ChevronRight className="h-4 w-4" aria-hidden />
            </Link>
          </div>
        );
      }
      return (
        <div className="space-y-6">
          <CartPreviewSection key={previewRefreshKey} onOrdersCreated={handlePreviewOrdersCreated} />
          {filteredMockOrders.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-sm font-bold uppercase tracking-wide text-gray-700">
                {t('mockCheckout.ordersToPayTitle')}
              </h2>
              {filteredMockOrders.map((order) => (
                <MockPurchaseOrderCard
                  key={order.id}
                  order={order}
                  onPay={(o) => setMockOrderToPay(o)}
                  paying={mockPaying && mockOrderToPay?.id === order.id}
                />
              ))}
            </div>
          )}
          {filteredMarketplaceOrders.length > 0 && (
            <div className="space-y-4">
              {filteredMarketplaceOrders.map((order) => (
                <MarketplaceOrderCard key={order.id} order={order} />
              ))}
            </div>
          )}
          {ordersQuery.isLoading ? (
            <div className="flex min-h-[120px] items-center justify-center border border-gray-200 bg-white">
              <Loader2 className="h-6 w-6 animate-spin text-[#FF7300]" aria-hidden />
            </div>
          ) : orders.length > 0 ? (
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
            </div>
          ) : null}
          {totalItemsCount > 0 && (
            <p className="text-center text-xs text-gray-500">
              {totalItemsCount} ordin{totalItemsCount === 1 ? 'e' : 'i'} da pagare
            </p>
          )}
        </div>
      );
    }

    if (isPagatoTab) {
      if (!hasPagatoContent && ordersQuery.isLoading) {
        return (
          <div className="flex min-h-[280px] items-center justify-center border border-gray-200 bg-white">
            <Loader2 className="h-6 w-6 animate-spin text-[#FF7300]" aria-hidden />
          </div>
        );
      }
      if (!hasPagatoContent) {
        return (
          <div className="flex min-h-[280px] flex-col items-center justify-center gap-4 border border-gray-200 bg-white px-6 py-12">
            <p className="text-center text-base font-semibold uppercase tracking-wide text-gray-500">
              {emptyMessage}
            </p>
          </div>
        );
      }
      return (
        <div className="space-y-4">
          {filteredMockOrders.map((order) => (
            <MockPurchaseOrderCard key={order.id} order={order} />
          ))}
          {filteredMarketplaceOrders.map((order) => (
            <MarketplaceOrderCard key={order.id} order={order} />
          ))}
          {ordersQuery.isLoading ? (
            <div className="flex min-h-[120px] items-center justify-center border border-gray-200 bg-white">
              <Loader2 className="h-6 w-6 animate-spin text-[#FF7300]" aria-hidden />
            </div>
          ) : (
            orders.map((order) => (
              <OrderCard key={order.id} order={order} perspective="buyer" />
            ))
          )}
          <p className="text-center text-xs text-gray-500">
            {totalItemsCount} ordin{totalItemsCount === 1 ? 'e' : 'i'} pagati
          </p>
        </div>
      );
    }

    if (totalItemsCount === 0) {
      return (
        <div className="flex min-h-[280px] flex-col items-center justify-center gap-4 border border-gray-200 bg-white px-6 py-12">
          <p className="text-center text-base font-semibold uppercase tracking-wide text-gray-500">
            {emptyMessage}
          </p>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {filteredMockOrders.map((order) => (
          <MockPurchaseOrderCard key={order.id} order={order} />
        ))}
        {filteredMarketplaceOrders.map((order) => (
          <MarketplaceOrderCard key={order.id} order={order} />
        ))}
        {orders.map((order) => (
          <OrderCard key={order.id} order={order} perspective="buyer" />
        ))}
        <p className="text-center text-xs text-gray-500">
          {totalItemsCount} ordin{totalItemsCount === 1 ? 'e' : 'i'} totali
        </p>
      </div>
    );
  };

  const renderSupportContent = () => {
    if (disputesLoading) {
      return (
        <div className="flex min-h-[280px] items-center justify-center border border-gray-200 bg-white">
          <Loader2 className="h-6 w-6 animate-spin text-[#FF7300]" aria-hidden />
          <span className="sr-only">Caricamento segnalazioni…</span>
        </div>
      );
    }
    if (disputesError) {
      return (
        <div className="flex min-h-[280px] flex-col items-center justify-center gap-3 border border-red-200 bg-red-50 px-6 py-12 text-center">
          <p className="text-sm font-semibold text-red-800">{disputesError}</p>
          <button
            type="button"
            onClick={() => void loadDisputes()}
            className="text-sm font-semibold text-[#FF7300] hover:underline"
          >
            Riprova
          </button>
        </div>
      );
    }
    const realTickets = disputes.map((d) => ({ type: 'real' as const, data: d }));
    const mockTickets = mockSupportTickets.map((m) => ({ type: 'mock' as const, data: m }));
    const allTickets = [...realTickets, ...mockTickets];
    if (allTickets.length === 0) {
      return (
        <div className="flex min-h-[280px] flex-col items-center justify-center gap-4 border border-gray-200 bg-white px-6 py-12">
          <p className="text-center text-base font-semibold uppercase tracking-wide text-gray-500">
            {emptyMessage}
          </p>
        </div>
      );
    }
    return (
      <div className="space-y-4">
        {allTickets.map((ticket) => (
          <SupportTicketCard key={`${ticket.type}-${ticket.type === 'real' ? ticket.data.id : ticket.data.id}`} ticket={ticket} />
        ))}
        <p className="text-center text-xs text-gray-500">
          {allTickets.length} segnalazion{allTickets.length === 1 ? 'e' : 'i'} totali
        </p>
      </div>
    );
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

        <h1 className="mb-4 text-2xl font-bold uppercase tracking-wide text-gray-900 sm:text-3xl">
          I MIEI ACQUISTI
        </h1>

        <div
          className="mb-6 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-900"
          role="note"
        >
          <span className="mr-2 inline-flex rounded-full bg-blue-600 px-2 py-0.5 text-[10px] font-bold uppercase text-white">
            DEMO
          </span>
          {t('mockCheckout.banner')}
        </div>

        {showCheckoutHint && isDaPagareTab && mockPendingOrders.length > 0 && (
          <div className="mb-4 rounded-md border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm text-emerald-800">
            {t('mockCheckout.checkoutRedirectHint')}
          </div>
        )}

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

        {isSupportoTab ? renderSupportContent() : renderOrdersContent()}
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

      <MockPaymentFormModal
        order={mockOrderToPay}
        isPaying={mockPaying}
        onClose={() => {
          if (!mockPaying) setMockOrderToPay(null);
        }}
        onConfirm={handleConfirmMockPayment}
      />
    </div>
  );
}
