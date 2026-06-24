'use client';

import { useMemo, useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Home, History, Hourglass, PackageOpen, Truck, BadgeCheck, AlertTriangle } from 'lucide-react';
import { OrderTabs, type OrderTab } from '@/components/feature/ordini/OrderTabs';
import { ordersWrapperClass } from '@/components/feature/ordini/OrderItemCard';
import { AuctionViewToggle } from '@/components/feature/aste/auctions-browse-shared';
import { getStoredAsteViewMode, setStoredAsteViewMode, type AsteViewMode } from '@/lib/auction/aste-view-storage';
import { AppBreadcrumb, type AppBreadcrumbItem } from '@/components/ui/AppBreadcrumb';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { useMockSupportStore } from '@/lib/stores/mock-support-store';
import { SupportTicketCard } from '@/components/feature/acquisti/SupportTicketCard';
import {
  countByStato,
  filterVendite,
  MOCK_VENDITE,
  VENDITA_TAB_META,
  type VenditaStato,
} from './venditeMockData';
import { VenditeSaleCard } from './VenditeSaleCard';

type TabId = VenditaStato | 'tutte' | 'supporto';

const TABS_LEFT: OrderTab<TabId>[] = [
  { id: 'in-attesa-pagamento', label: 'IN ATTESA', icon: Hourglass },
  { id: 'da-spedire', label: 'DA SPEDIRE', icon: PackageOpen },
  { id: 'spedito', label: 'SPEDITO', icon: Truck },
  { id: 'completato', label: 'COMPLETATO', icon: BadgeCheck },
  { id: 'supporto', label: 'PROBLEMATICHE', icon: AlertTriangle },
];

const TABS_RIGHT: OrderTab<TabId>[] = [
  { id: 'tutte', label: 'STORICO', icon: History },
];

const ALL_TABS = [...TABS_LEFT, ...TABS_RIGHT];

const EMPTY_MESSAGE_BY_TAB: Record<TabId, string> = {
  'tutte': 'Nessuna vendita al momento.',
  'in-attesa-pagamento': 'Nessuna vendita in attesa di pagamento.',
  'da-spedire': 'Nessuna vendita da spedire.',
  'spedito': 'Nessuna vendita spedita.',
  'completato': 'Nessuna vendita completata.',
  'supporto': 'Nessuna segnalazione aperta.',
};

function getTabLabel(tabId: TabId): string {
  return ALL_TABS.find((t) => t.id === tabId)?.label ?? tabId;
}

function isValidTabId(value: string | null): value is TabId {
  return ALL_TABS.some((t) => t.id === value);
}

export function VenditeContent() {
  const { t } = useTranslation();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get('tab');

  const [activeTab, setActiveTab] = useState<TabId>('tutte');
  const [viewMode, setViewMode] = useState<AsteViewMode>('list');

  useEffect(() => {
    setViewMode(getStoredAsteViewMode('vendite', 'list'));
  }, []);
  useEffect(() => {
    setStoredAsteViewMode('vendite', viewMode);
  }, [viewMode]);

  useEffect(() => {
    if (isValidTabId(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [tabParam]);

  const isSupportoTab = activeTab === 'supporto';
  const activeLabel = getTabLabel(activeTab);
  const emptyMessage = EMPTY_MESSAGE_BY_TAB[activeTab];

  const filtered = useMemo(() => filterVendite(activeTab as VenditaStato | 'tutte'), [activeTab]);
  const tabMeta = useMemo(() => VENDITA_TAB_META.find((t) => t.id === activeTab) ?? VENDITA_TAB_META[0], [activeTab]);

  const mockSupportTickets = useMockSupportStore((s) => s.tickets);

  const leftTabs = useMemo(
    () =>
      TABS_LEFT.map((tab) => ({
        ...tab,
        count: tab.id === 'tutte' ? MOCK_VENDITE.length : countByStato(tab.id as VenditaStato),
      })),
    [],
  );

  const rightTabs = useMemo(
    () =>
      TABS_RIGHT.map((tab) => ({
        ...tab,
        count: mockSupportTickets.length,
      })),
    [mockSupportTickets],
  );

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

  const renderOrdersContent = () => {
    if (filtered.length === 0) {
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
        <div className={ordersWrapperClass(viewMode)}>
          {filtered.map((vendita) => (
            <VenditeSaleCard key={vendita.id} vendita={vendita} layout={viewMode} />
          ))}
        </div>
        <p className="text-center text-xs text-gray-500">
          {filtered.length} vendit{filtered.length === 1 ? 'a' : 'e'} mostrate
          {activeTab !== 'tutte' ? ` · ${tabMeta.label}` : ''}
        </p>
      </div>
    );
  };

  const renderSupportContent = () => {
    const mockTickets = mockSupportTickets.map((m) => ({ type: 'mock' as const, data: m }));
    if (mockTickets.length === 0) {
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
        {mockTickets.map((ticket) => (
          <SupportTicketCard key={`mock-${ticket.data.id}`} ticket={ticket} />
        ))}
        <p className="text-center text-xs text-gray-500">
          {mockTickets.length} segnalazion{mockTickets.length === 1 ? 'e' : 'i'} totali
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
          LE MIE VENDITE
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

        <OrderTabs
          leftTabs={leftTabs}
          rightTabs={rightTabs}
          activeTab={activeTab}
          onChange={setActiveTab}
        />

        {!isSupportoTab && (
          <div className="mb-3 mt-4 flex items-center justify-end">
            <AuctionViewToggle
              viewMode={viewMode}
              onViewModeChange={setViewMode}
              listLabel="Lista"
              gridLabel="Griglia"
              variant="compact"
            />
          </div>
        )}

        {isSupportoTab ? renderSupportContent() : renderOrdersContent()}
      </div>
    </div>
  );
}
