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
import { MOCK_AUCTIONS } from '@/components/feature/aste/mock-auctions';
import { MY_AUCTION_LISTING_IDS } from '@/components/feature/aste/mock-user-auctions';

const STORAGE_KEY = 'mie';

function useEnrichedAuctions(): EnrichedAuction[] {
  const pageLoadMs = useState(() => Date.now())[0];
  return useMemo(
    () =>
      MOCK_AUCTIONS.map((a) => ({
        ...a,
        endsAt: new Date(pageLoadMs + a.hoursFromNow * 3600000).toISOString(),
      })),
    [pageLoadMs]
  );
}

function useNowTick(intervalMs = 1000): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return now;
}

export function AsteMyListingsPage() {
  const { t } = useTranslation();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const user = useAuthStore((s) => s.user);
  const now = useNowTick();
  const enriched = useEnrichedAuctions();

  const [viewMode, setViewMode] = useState<AsteViewMode>('grid');

  useEffect(() => {
    setViewMode(getStoredAsteViewMode(STORAGE_KEY));
  }, []);
  useEffect(() => {
    setStoredAsteViewMode(STORAGE_KEY, viewMode);
  }, [viewMode]);

  const mine = useMemo(() => {
    const setIds = new Set<string>(MY_AUCTION_LISTING_IDS);
    return enriched.filter((a) => setIds.has(a.id));
  }, [enriched]);

  const displayName = user?.name ?? user?.email?.split('@')[0] ?? '';

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
      <div className="container-content">
        <nav className="mb-4 flex flex-wrap gap-2 text-sm text-gray-500">
          <Link href="/" className="hover:text-gray-900">
            {t('auctions.breadcrumbHome')}
          </Link>
          <span>/</span>
          <Link href="/aste" className="hover:text-gray-900">
            {t('pages.auctions.title')}
          </Link>
          <span>/</span>
          <span className="text-gray-900">{t('auctions.myListingsTitle')}</span>
        </nav>

        <header className="mb-8 border-b border-gray-200 pb-6">
          <h1 className="text-2xl font-bold uppercase tracking-tight text-gray-900 md:text-3xl">{t('auctions.myListingsTitle')}</h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-gray-600">
            {t('auctions.myListingsSubtitle', { name: displayName })}
          </p>
        </header>

        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border border-gray-300 bg-white px-4 py-3">
          <p className="text-sm text-gray-700">{t('auctions.resultsCount', { count: mine.length })}</p>
          <AuctionViewToggle
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            listLabel={t('auctions.viewList')}
            gridLabel={t('auctions.viewGrid')}
          />
        </div>

        <div className="overflow-hidden border border-gray-300 bg-white">
          {mine.length === 0 ? (
            <div className="p-16 text-center text-gray-500">{t('auctions.emptyMyListings')}</div>
          ) : viewMode === 'grid' ? (
            <AuctionResultsGrid auctions={mine} now={now} t={t} />
          ) : (
            <AuctionListTable auctions={mine} now={now} t={t} />
          )}
        </div>
      </div>
    </div>
  );
}
