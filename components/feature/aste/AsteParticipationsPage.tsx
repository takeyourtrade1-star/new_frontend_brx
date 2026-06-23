'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { useAuthStore } from '@/lib/stores/auth-store';
import { getStoredAsteViewMode, setStoredAsteViewMode, type AsteViewMode } from '@/lib/auction/aste-view-storage';
import {
  AuctionListTable,
  AuctionResultsGrid,
  AuctionViewToggle,
  type EnrichedAuction,
} from '@/components/feature/aste/auctions-browse-shared';
import { useAuctionList } from '@/lib/hooks/use-auctions';
import { apiToAuctionUI, isAuctionEndedUI, type AuctionUI } from '@/lib/auction/auction-adapter';
import { AsteNav } from '@/components/feature/aste/AsteNav';
import { AsteMineViewBar, type MyListingsTab } from '@/components/feature/aste/AsteMineViewBar';
import { AppBreadcrumb, type AppBreadcrumbItem } from '@/components/ui/AppBreadcrumb';
import { useEnrichedAuctions } from '@/lib/hooks/use-enriched-auctions';

const STORAGE_KEY = 'partecipazioni';

export function AsteParticipationsPage() {
  const { t } = useTranslation();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const user = useAuthStore((s) => s.user);
  const userId = user?.id;
  const { data: listData, isLoading } = useAuctionList({ limit: 100 });

  const [viewMode, setViewMode] = useState<AsteViewMode>('grid');
  const [statusTab, setStatusTab] = useState<MyListingsTab>('ongoing');

  useEffect(() => {
    setViewMode(getStoredAsteViewMode(STORAGE_KEY));
  }, []);
  useEffect(() => {
    setStoredAsteViewMode(STORAGE_KEY, viewMode);
  }, [viewMode]);

  const { rowsBase, myBidById } = useMemo(() => {
    if (!listData?.data || !userId) {
      return {
        rowsBase: [] as AuctionUI[],
        myBidById: {} as Record<string, number>,
      };
    }
    const bids: Record<string, number> = {};
    const participated: AuctionUI[] = [];
    for (const a of listData.data) {
      const isCreator = a.created_by_user_id === userId;
      const isBidder = a.highest_bidder_id === userId;
      if (!isCreator && isBidder) {
        const ui = apiToAuctionUI(a);
        participated.push(ui);
        bids[ui.id] = a.current_price;
      }
    }
    return { rowsBase: participated, myBidById: bids };
  }, [listData, userId]);
  const rows = useEnrichedAuctions(rowsBase);

  const { ongoingRows, endedRows } = useMemo(() => {
    const ongoing: AuctionUI[] = [];
    const ended: AuctionUI[] = [];
    for (const auction of rows) {
      if (isAuctionEndedUI(auction)) {
        ended.push(auction);
      } else {
        ongoing.push(auction);
      }
    }
    return { ongoingRows: ongoing, endedRows: ended };
  }, [rows]);

  const visibleRows = statusTab === 'ongoing' ? ongoingRows : endedRows;
  const emptyMessage =
    statusTab === 'ongoing'
      ? t('auctions.emptyParticipationsOngoing')
      : t('auctions.emptyParticipationsEnded');

  const displayName = user?.name ?? user?.email?.split('@')[0] ?? '';
  const breadcrumbItems: AppBreadcrumbItem[] = [
    { href: '/', label: t('auctions.breadcrumbHome'), isCurrent: false },
    { href: '/aste', label: t('pages.auctions.title'), isCurrent: false },
    { label: t('auctions.participationsTitle'), isCurrent: true },
  ];

  if (!isAuthenticated) {
    return (
      <div className="container-content py-16">
        <div className="mx-auto max-w-lg rounded-2xl border border-gray-200 bg-white p-10 text-center shadow-sm">
          <h1 className="text-xl font-bold uppercase tracking-wide text-gray-900">{t('auctions.loginRequiredTitle')}</h1>
          <p className="mt-3 text-sm leading-relaxed text-gray-600">{t('auctions.loginRequiredBody')}</p>
          <Link
            href="/login"
            className="mt-6 inline-flex rounded-full bg-[#FF7300] px-8 py-3 text-sm font-bold uppercase text-white transition hover:bg-[#e86800]"
          >
            {t('auth.login')}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white pb-16 pt-6">
      <AsteNav />
      <div className="container-content">
        <AppBreadcrumb
          items={breadcrumbItems}
          ariaLabel="Breadcrumb"
          variant="default"
          className="mb-4 w-auto text-sm"
        />

        <header className="mb-8 border-b border-gray-200 pb-6">
          <h1 className="text-2xl font-bold uppercase tracking-tight text-gray-900 md:text-3xl">{t('auctions.participationsTitle')}</h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-gray-600">
            {t('auctions.participationsSubtitle', { name: displayName })}
          </p>
        </header>

        <div className="mb-4 flex flex-col gap-3">
          <AsteMineViewBar
            variant="participations"
            statusTab={statusTab}
            onStatusTabChange={setStatusTab}
            ongoingCount={ongoingRows.length}
            endedCount={endedRows.length}
            t={t}
          />
          <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-gray-700">{t('auctions.resultsCount', { count: visibleRows.length })}</p>
          <AuctionViewToggle
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            listLabel={t('auctions.viewList')}
            gridLabel={t('auctions.viewGrid')}
          />
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-white/60 bg-white/70 shadow-[0_8px_32px_rgba(29,49,96,0.08)] backdrop-blur-xl backdrop-saturate-150 ring-1 ring-[#1D3160]/5">
          {visibleRows.length === 0 ? (
            <div className="p-16 text-center text-gray-500">{emptyMessage}</div>
          ) : viewMode === 'grid' ? (
            <AuctionResultsGrid auctions={visibleRows} t={t} />
          ) : (
            <AuctionListTable auctions={visibleRows} t={t} myBidById={myBidById} />
          )}
        </div>
      </div>
    </div>
  );
}
