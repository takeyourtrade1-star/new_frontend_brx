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
} from '@/components/feature/aste/auctions-browse-shared';
import { useAuctionList } from '@/lib/hooks/use-auctions';
import { apiToAuctionUI, isAuctionEndedUI, type AuctionUI } from '@/lib/auction/auction-adapter';
import { AsteNav } from '@/components/feature/aste/AsteNav';
import { AppBreadcrumb, type AppBreadcrumbItem } from '@/components/ui/AppBreadcrumb';
import { useEnrichedAuctions } from '@/lib/hooks/use-enriched-auctions';

const STORAGE_KEY = 'storico';

export function AsteHistoryPage() {
  const { t } = useTranslation();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const user = useAuthStore((s) => s.user);
  const userId = user?.id;
  const auctionQueriesEnabled = Boolean(userId);
  const { data: publishedListData } = useAuctionList(
    { created_by_user_id: userId ?? '', limit: 100 },
    { enabled: auctionQueriesEnabled },
  );
  const { data: participationListData } = useAuctionList(
    { limit: 100 },
    { enabled: auctionQueriesEnabled },
  );

  const [viewMode, setViewMode] = useState<AsteViewMode>('grid');

  useEffect(() => {
    setViewMode(getStoredAsteViewMode(STORAGE_KEY));
  }, []);
  useEffect(() => {
    setStoredAsteViewMode(STORAGE_KEY, viewMode);
  }, [viewMode]);

  const { publishedRows, participatedRows, myBidById } = useMemo(() => {
    if (!userId) {
      return {
        publishedRows: [] as AuctionUI[],
        participatedRows: [] as AuctionUI[],
        myBidById: {} as Record<string, number>,
      };
    }
    const bids: Record<string, number> = {};
    const published: AuctionUI[] = [];
    const participated: AuctionUI[] = [];

    for (const a of publishedListData?.data ?? []) {
      if (a.created_by_user_id === userId) {
        const ui = apiToAuctionUI(a);
        if (isAuctionEndedUI(ui)) published.push(ui);
      }
    }

    for (const a of participationListData?.data ?? []) {
      const isCreator = a.created_by_user_id === userId;
      const isBidder = a.highest_bidder_id === userId;

      if (!isCreator && isBidder) {
        const ui = apiToAuctionUI(a);
        if (isAuctionEndedUI(ui)) {
          participated.push(ui);
          bids[ui.id] = a.current_price;
        }
      }
    }

    return { publishedRows: published, participatedRows: participated, myBidById: bids };
  }, [participationListData, publishedListData, userId]);

  const published = useEnrichedAuctions(publishedRows);
  const participated = useEnrichedAuctions(participatedRows);
  const allRows = useMemo(() => [...published, ...participated], [published, participated]);

  const displayName = user?.name ?? user?.email?.split('@')[0] ?? '';
  const breadcrumbItems: AppBreadcrumbItem[] = [
    { href: '/', label: t('auctions.breadcrumbHome'), isCurrent: false },
    { href: '/aste', label: t('pages.auctions.title'), isCurrent: false },
    { label: t('auctions.historyTitle'), isCurrent: true },
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

  const renderAuctions = (auctions: AuctionUI[], emptyMessage: string, withMyBid?: boolean) => {
    if (auctions.length === 0) {
      return <div className="p-12 text-center text-sm text-gray-500">{emptyMessage}</div>;
    }
    return viewMode === 'grid' ? (
      <AuctionResultsGrid auctions={auctions} t={t} />
    ) : (
      <AuctionListTable auctions={auctions} t={t} myBidById={withMyBid ? myBidById : undefined} />
    );
  };

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
          <h1 className="text-2xl font-bold uppercase tracking-tight text-gray-900 md:text-3xl">{t('auctions.historyTitle')}</h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-gray-600">
            {t('auctions.historySubtitle', { name: displayName })}
          </p>
        </header>

        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-gray-700">{t('auctions.resultsCount', { count: allRows.length })}</p>
          <AuctionViewToggle
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            listLabel={t('auctions.viewList')}
            gridLabel={t('auctions.viewGrid')}
          />
        </div>

        <div className="space-y-8">
          <section className="overflow-hidden rounded-2xl border border-white/60 bg-white/70 shadow-[0_8px_32px_rgba(29,49,96,0.08)] backdrop-blur-xl backdrop-saturate-150 ring-1 ring-[#1D3160]/5">
            <div className="border-b border-gray-100 bg-gray-50/70 px-4 py-3">
              <h2 className="text-sm font-bold uppercase tracking-wide text-gray-800">
                {t('auctions.historySectionPublished')}
              </h2>
            </div>
            {renderAuctions(published, t('auctions.emptyHistoryPublished'))}
          </section>

          <section className="overflow-hidden rounded-2xl border border-white/60 bg-white/70 shadow-[0_8px_32px_rgba(29,49,96,0.08)] backdrop-blur-xl backdrop-saturate-150 ring-1 ring-[#1D3160]/5">
            <div className="border-b border-gray-100 bg-gray-50/70 px-4 py-3">
              <h2 className="text-sm font-bold uppercase tracking-wide text-gray-800">
                {t('auctions.historySectionParticipated')}
              </h2>
            </div>
            {renderAuctions(participated, t('auctions.emptyHistoryParticipated'), true)}
          </section>
        </div>
      </div>
    </div>
  );
}
