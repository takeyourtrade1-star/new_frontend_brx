'use client';

/**
 * Homepage aste — hero, ricerca, filtri, lista/griglia.
 */

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Search, X } from 'lucide-react';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { useLanguage } from '@/lib/contexts/LanguageContext';
import { cn } from '@/lib/utils';
import { auctionDetailPath } from '@/lib/auction/auction-paths';
import { getStoredAsteViewMode, setStoredAsteViewMode, type AsteViewMode } from '@/lib/auction/aste-view-storage';
import {
  AuctionListTable,
  AuctionResultsGrid,
  AuctionViewToggle,
  formatHMS,
} from '@/components/feature/aste/auctions-browse-shared';
import { AsteNav } from '@/components/feature/aste/AsteNav';
import { MascotteLoader } from '@/components/dev/MascotteLoader';
import { useAuctionList } from '@/lib/hooks/use-auctions';
import {
  apiToAuctionUI,
  isAuctionEndedUI,
  isEndingSoonUI,
  isEndingWithin24h,
  type AuctionUI,
} from '@/lib/auction/auction-adapter';
import { AppBreadcrumb, type AppBreadcrumbItem } from '@/components/ui/AppBreadcrumb';
import { enrichAuctionsWithPublicUsers } from '@/lib/auction/public-user-enrichment';
import { CustomSelect } from '@/components/ui/CustomSelect';
import {
  auctionMatchesSearchTerms,
  resolveAuctionSearchQuery,
} from '@/lib/auction/resolve-auction-search-query';
import type { MessageKey } from '@/lib/i18n/messages/en';

type BrowseTab = 'ending_soon' | 'recent' | 'ended';

const VIEW_STORAGE_KEY = 'hub';
const BATCH_SIZE = 20;
const SEARCH_DEBOUNCE_MS = 300;

const BROWSE_TABS: BrowseTab[] = ['ending_soon', 'recent', 'ended'];

const BROWSE_TAB_KEYS: Record<BrowseTab, MessageKey> = {
  ending_soon: 'auctions.browseEndingSoon',
  recent: 'auctions.browseRecent',
  ended: 'auctions.browseEnded',
};

function useNowTick(intervalMs = 1000): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return now;
}

function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(id);
  }, [value, delayMs]);
  return debounced;
}

type AsteHubToolbarProps = {
  q: string;
  onQChange: (value: string) => void;
  filterPriceMax: string;
  onFilterPriceMaxChange: (value: string) => void;
  filterMinBids: string;
  onFilterMinBidsChange: (value: string) => void;
  browseTab: BrowseTab | null;
  onBrowseTabChange: (tab: BrowseTab | null) => void;
  viewMode: AsteViewMode;
  onViewModeChange: (mode: AsteViewMode) => void;
  compact?: boolean;
  t: (key: MessageKey) => string;
};

function AsteHubToolbar({
  q,
  onQChange,
  filterPriceMax,
  onFilterPriceMaxChange,
  filterMinBids,
  onFilterMinBidsChange,
  browseTab,
  onBrowseTabChange,
  viewMode,
  onViewModeChange,
  compact = false,
  t,
}: AsteHubToolbarProps) {
  return (
    <div
      className={cn(
        'space-y-3',
        compact
          ? 'space-y-1.5'
          : 'mb-6 rounded-2xl border border-slate-200/50 bg-slate-50/70 px-4 py-3.5 sm:px-5 sm:py-4',
      )}
    >
      <div className="flex w-full min-w-0 items-center overflow-hidden rounded-full bg-white px-2 py-1.5 shadow-sm ring-1 ring-slate-200/60">
        <div className="flex min-w-0 flex-1 items-center gap-2 px-3">
          <Search className="h-4 w-4 shrink-0 text-gray-500" aria-hidden />
          <input
            id={compact ? 'aste-hub-search-sticky' : 'aste-hub-search'}
            type="search"
            value={q}
            onChange={(e) => onQChange(e.target.value)}
            placeholder={t('auctions.searchPlaceholder')}
            className="min-w-0 flex-1 bg-transparent text-sm text-gray-900 placeholder:text-gray-500 focus:outline-none"
            aria-label={t('auctions.searchPlaceholder')}
          />
          {q && (
            <button
              type="button"
              onClick={() => onQChange('')}
              className="text-gray-400 transition-colors hover:text-gray-600 focus:outline-none"
              aria-label="Cancella ricerca"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <button
          type="button"
          className="btn-orange-glow shrink-0 whitespace-nowrap rounded-full px-3 py-1.5 text-xs sm:px-4 sm:text-sm"
        >
          {t('auctions.searchLabel')}
        </button>
      </div>

      <div
        className={cn(
          'flex flex-wrap items-end gap-2',
          compact ? 'pt-1' : 'border-t border-slate-200/45 pt-3',
        )}
      >
        {!compact && (
          <div className="flex flex-col gap-0.5">
            <span className="text-[10px] font-semibold uppercase tracking-wide text-gray-500">
              {t('auctions.filterGame')}
            </span>
            <CustomSelect
              options={[{ value: 'mtg', label: t('auctions.gameMtg') }]}
              value="mtg"
              onChange={() => {}}
              disabled
              className="min-w-[7rem] [&_button]:rounded-lg [&_button]:border-gray-200 [&_button]:bg-gray-50 [&_button]:px-2.5 [&_button]:py-1.5 [&_button]:text-xs [&_button]:text-gray-600"
            />
          </div>
        )}

        {!compact && (
          <>
            <label className="flex flex-col gap-0.5">
              <span className="text-[10px] font-semibold uppercase tracking-wide text-gray-500">
                {t('auctions.filterPriceMax')}
              </span>
              <input
                type="number"
                min={0}
                inputMode="numeric"
                placeholder="€ max"
                value={filterPriceMax}
                onChange={(e) => onFilterPriceMaxChange(e.target.value)}
                className="w-[5.5rem] rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs text-gray-900 focus:border-[#FF7300]/40 focus:outline-none focus:ring-1 focus:ring-[#FF7300]/25"
              />
            </label>
            <label className="flex flex-col gap-0.5">
              <span className="text-[10px] font-semibold uppercase tracking-wide text-gray-500">
                {t('auctions.filterMinBids')}
              </span>
              <input
                type="number"
                min={0}
                inputMode="numeric"
                placeholder="Min"
                value={filterMinBids}
                onChange={(e) => onFilterMinBidsChange(e.target.value)}
                className="w-[4.5rem] rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs text-gray-900 focus:border-[#FF7300]/40 focus:outline-none focus:ring-1 focus:ring-[#FF7300]/25"
              />
            </label>
          </>
        )}

        <div
          className={cn('flex flex-wrap items-center gap-1', !compact && 'ml-auto')}
          role="tablist"
          aria-label={t('auctions.browseTabListLabel')}
        >
          {BROWSE_TABS.map((tab) => {
            const active = browseTab === tab;
            return (
              <button
                key={tab}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => onBrowseTabChange(active ? null : tab)}
                className={cn(
                  'inline-flex items-center rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide transition-colors sm:px-3 sm:text-[11px]',
                  active
                    ? 'border-[#FF7300]/40 bg-[#FF7300]/85 text-white shadow-sm'
                    : 'border-gray-200 bg-white text-gray-600 hover:border-[#FF7300]/30 hover:text-gray-900'
                )}
              >
                {t(BROWSE_TAB_KEYS[tab])}
              </button>
            );
          })}
        </div>

        {!compact && (
          <AuctionViewToggle
            viewMode={viewMode}
            onViewModeChange={onViewModeChange}
            listLabel={t('auctions.viewList')}
            gridLabel={t('auctions.viewGrid')}
            variant="compact"
          />
        )}
      </div>
    </div>
  );
}

export function AsteHubPage() {
  const { t } = useTranslation();
  const { selectedLang } = useLanguage();
  const now = useNowTick();

  const [visibleCount, setVisibleCount] = useState(BATCH_SIZE);
  const [apiBatchCount, setApiBatchCount] = useState(1);
  const [viewMode, setViewMode] = useState<AsteViewMode>('list');
  const [browseTab, setBrowseTab] = useState<BrowseTab | null>(null);
  const [q, setQ] = useState('');
  const debouncedQ = useDebouncedValue(q, SEARCH_DEBOUNCE_MS);
  const [filterPriceMax, setFilterPriceMax] = useState('');
  const [filterMinBids, setFilterMinBids] = useState('');
  const [searchMatchTerms, setSearchMatchTerms] = useState<string[]>([]);
  const [resolvedApiQ, setResolvedApiQ] = useState<string | undefined>(undefined);
  const [searchResolving, setSearchResolving] = useState(false);

  const apiStatus = browseTab === 'ended' ? 'CLOSED' : 'ACTIVE';
  const apiLimit = apiBatchCount * BATCH_SIZE;

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      const trimmed = debouncedQ.trim();
      if (trimmed.length < 2) {
        setResolvedApiQ(undefined);
        setSearchMatchTerms([]);
        setSearchResolving(false);
        return;
      }
      setSearchResolving(true);
      const resolved = await resolveAuctionSearchQuery(trimmed, selectedLang);
      if (!cancelled) {
        setResolvedApiQ(resolved.apiQ);
        setSearchMatchTerms(resolved.matchTerms);
        setSearchResolving(false);
      }
    };
    void run();
    return () => {
      cancelled = true;
    };
  }, [debouncedQ, selectedLang]);

  const { data: listData, isLoading, isFetching } = useAuctionList(
    {
      q: resolvedApiQ,
      status: apiStatus,
      limit: apiLimit,
      offset: 0,
    },
    {
      staleTime: 5_000,
      refetchInterval: 10_000,
      refetchIntervalInBackground: false,
      refetchOnWindowFocus: true,
      refetchOnMount: 'always',
    }
  );

  const baseAuctions: AuctionUI[] = useMemo(
    () => (listData?.data ?? []).map((a) => apiToAuctionUI(a)),
    [listData]
  );
  const [enriched, setEnriched] = useState<AuctionUI[]>([]);
  const [showStickyBar, setShowStickyBar] = useState(false);

  const breadcrumbItems: AppBreadcrumbItem[] = [
    { href: '/', label: t('auctions.breadcrumbHome'), isCurrent: false },
    { label: t('pages.auctions.title'), isCurrent: true },
  ];

  useEffect(() => {
    setVisibleCount(BATCH_SIZE);
    setApiBatchCount(1);
  }, [q, filterPriceMax, filterMinBids, browseTab, resolvedApiQ]);

  useEffect(() => {
    let isCancelled = false;
    const resolveSellerNames = async () => {
      if (baseAuctions.length === 0) {
        setEnriched([]);
        return;
      }
      const next = await enrichAuctionsWithPublicUsers(baseAuctions);
      if (!isCancelled) {
        setEnriched(next);
      }
    };
    resolveSellerNames();
    return () => {
      isCancelled = true;
    };
  }, [baseAuctions]);

  useEffect(() => {
    setViewMode(getStoredAsteViewMode(VIEW_STORAGE_KEY, 'list'));
  }, []);

  useEffect(() => {
    setStoredAsteViewMode(VIEW_STORAGE_KEY, viewMode);
  }, [viewMode]);

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY || document.documentElement.scrollTop;
      const isVisible = scrollY > 300;
      setShowStickyBar(isVisible);
      window.dispatchEvent(new CustomEvent('stickyBarVisibilityChange', { detail: { visible: isVisible } }));
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.dispatchEvent(new CustomEvent('stickyBarVisibilityChange', { detail: { visible: false } }));
    };
  }, []);

  const endingSoon = useMemo(() => {
    return enriched
      .filter((a) => !isAuctionEndedUI(a) && isEndingSoonUI(a.hoursFromNow))
      .sort((a, b) => a.hoursFromNow - b.hoursFromNow);
  }, [enriched]);

  const filtered = useMemo(() => {
    const maxP = filterPriceMax.trim() ? Number(filterPriceMax) : NaN;
    const minB = filterMinBids.trim() ? Number(filterMinBids) : NaN;
    const rawQ = q.trim();

    let rows = enriched.filter((a) => {
      if (a.game !== 'mtg') return false;
      if (rawQ && !auctionMatchesSearchTerms(a, searchMatchTerms, rawQ)) return false;
      if (!Number.isNaN(maxP) && a.currentBidEur > maxP) return false;
      if (!Number.isNaN(minB) && a.bidCount < minB) return false;

      if (browseTab === 'ended') {
        if (!isAuctionEndedUI(a)) return false;
      } else if (browseTab === 'ending_soon') {
        if (isAuctionEndedUI(a) || !isEndingWithin24h(a.hoursFromNow)) return false;
      } else if (isAuctionEndedUI(a)) {
        return false;
      }
      return true;
    });

    const copy = [...rows];
    if (browseTab === 'ended') {
      copy.sort((a, b) => new Date(b.endsAt).getTime() - new Date(a.endsAt).getTime());
    } else if (browseTab === 'ending_soon') {
      copy.sort((a, b) => a.hoursFromNow - b.hoursFromNow);
    } else if (browseTab === 'recent') {
      copy.sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());
    } else {
      copy.sort((a, b) => a.hoursFromNow - b.hoursFromNow);
    }
    return copy;
  }, [enriched, q, searchMatchTerms, browseTab, filterPriceMax, filterMinBids]);

  const displayed = useMemo(
    () => filtered.slice(0, visibleCount),
    [filtered, visibleCount]
  );

  const total = listData?.total ?? 0;
  const fetchedFromApi = listData?.data?.length ?? 0;
  const hasMore =
    filtered.length > visibleCount || fetchedFromApi < total;

  const handleLoadMore = () => {
    const nextVisible = visibleCount + BATCH_SIZE;
    if (filtered.length < nextVisible && fetchedFromApi < total) {
      setApiBatchCount((c) => c + 1);
    }
    setVisibleCount(nextVisible);
  };

  if (isLoading && enriched.length === 0) {
    return (
      <div className="min-h-screen bg-white">
        <AsteNav />
        <div className="flex min-h-[40vh] items-center justify-center">
          <MascotteLoader size="md" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen overflow-x-clip bg-white">
      <AsteNav />

      <section className="pb-28 pt-6 md:pb-16">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            {endingSoon.length > 0 && (
              <div className="mb-8">
                <div className="flex flex-col gap-6 sm:flex-row sm:items-stretch">
                  <div className="flex-1">
                    <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-700">
                      In evidenza
                    </h3>
                    <div className="scrollbar-hide flex gap-3 overflow-x-auto pb-2">
                      {endingSoon.slice(0, 3).map((a) => (
                        <EndingSoonCard key={a.id} auction={a} now={now} featured />
                      ))}
                    </div>
                  </div>
                  <div className="hidden w-px self-stretch bg-gray-300 sm:block" />
                  <div className="flex-1">
                    <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-700">
                      Terminano presto
                    </h3>
                    <div className="scrollbar-hide flex gap-3 overflow-x-auto pb-2">
                      {endingSoon.slice(3, 6).map((a) => (
                        <EndingSoonCard key={a.id} auction={a} now={now} />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            <AppBreadcrumb
              items={breadcrumbItems}
              ariaLabel="Breadcrumb"
              variant="default"
              className="mb-2 w-auto text-sm"
            />

            <AsteHubToolbar
              q={q}
              onQChange={setQ}
              filterPriceMax={filterPriceMax}
              onFilterPriceMaxChange={setFilterPriceMax}
              filterMinBids={filterMinBids}
              onFilterMinBidsChange={setFilterMinBids}
              browseTab={browseTab}
              onBrowseTabChange={setBrowseTab}
              viewMode={viewMode}
              onViewModeChange={setViewMode}
              t={t}
            />

            <div className="mb-3 flex items-end justify-between gap-3">
              <h2 className="flex min-w-0 flex-wrap items-baseline gap-2 sm:gap-3">
                <span className="text-xl font-bold tracking-tight text-gray-900 sm:text-2xl">
                  {browseTab === 'ended' ? t('auctions.hubEndedTitle') : t('auctions.hubOngoingTitle')}
                </span>
                <span className="text-base font-black tabular-nums leading-none text-[#1D3160] sm:text-lg">
                  {displayed.length}
                  {searchResolving && q.trim().length >= 2 && (
                    <span className="ml-0.5 text-sm font-normal text-gray-400">…</span>
                  )}
                </span>
              </h2>
              <p className="shrink-0 pb-0.5 text-xs text-gray-500">
                ({filtered.length}
                {total > filtered.length ? ` / ${total}` : ''} totali)
              </p>
            </div>

            <div className="overflow-hidden border border-gray-300 bg-gray-50">
              {displayed.length === 0 ? (
                <div className="p-8 text-center text-gray-500 sm:p-16">{t('auctions.noResults')}</div>
              ) : viewMode === 'grid' ? (
                <AuctionResultsGrid auctions={displayed} now={now} t={t} />
              ) : (
                <div className="overflow-x-auto">
                  <AuctionListTable auctions={displayed} now={now} t={t} />
                </div>
              )}
            </div>

            {hasMore && displayed.length > 0 && (
              <div className="mt-4 flex justify-center">
                <button
                  type="button"
                  onClick={handleLoadMore}
                  disabled={isFetching}
                  className="inline-flex min-w-[10rem] items-center justify-center rounded-full border-2 border-[#FF7300]/30 bg-white px-6 py-2.5 text-xs font-bold uppercase tracking-wide text-[#FF7300] transition hover:border-[#FF7300] hover:bg-[#FFF4EC] disabled:cursor-wait disabled:opacity-60"
                >
                  {isFetching ? '…' : t('auctions.loadMore')}
                </button>
              </div>
            )}
          </div>
        </div>
      </section>

      {showStickyBar && (
        <div className="animate-slide-up-bounce fixed bottom-0 left-0 right-0 z-40 overflow-x-clip border-t border-gray-200 bg-white/95 backdrop-blur-md">
          <div className="px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3">
            <AsteHubToolbar
              q={q}
              onQChange={setQ}
              filterPriceMax={filterPriceMax}
              onFilterPriceMaxChange={setFilterPriceMax}
              filterMinBids={filterMinBids}
              onFilterMinBidsChange={setFilterMinBids}
              browseTab={browseTab}
              onBrowseTabChange={setBrowseTab}
              viewMode={viewMode}
              onViewModeChange={setViewMode}
              compact
              t={t}
            />
          </div>
        </div>
      )}
    </div>
  );
}

function EndingSoonCard({
  auction,
  now,
  featured = false,
}: {
  auction: AuctionUI;
  now: number;
  featured?: boolean;
}) {
  const ms = new Date(auction.endsAt).getTime() - now;
  return (
    <Link
      href={auctionDetailPath(auction.id)}
      scroll
      prefetch
      className={`group relative flex h-[180px] w-[160px] shrink-0 flex-col overflow-hidden rounded-[16px] border bg-white shadow-md transition hover:shadow-lg sm:h-[200px] sm:w-[200px] ${featured ? 'border-amber-400/60 hover:border-amber-500' : 'border-gray-200 hover:border-[#FF7300]'}`}
    >
      <div className="relative h-full w-full">
        <Image
          src={auction.image}
          alt=""
          fill
          className="object-cover transition duration-500 group-hover:scale-105"
          sizes="200px"
          unoptimized
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
        <div className="absolute inset-0 flex flex-col justify-end p-3">
          <div
            className={`mb-2 rounded-full border bg-white/20 p-1.5 text-center shadow-lg backdrop-blur-md ${featured ? 'border-amber-400/60' : 'animate-pulse border-red-400/60'}`}
          >
            <p className="font-mono text-sm font-bold tabular-nums text-white" suppressHydrationWarning>
              {formatHMS(ms)}
            </p>
          </div>
          <p className="line-clamp-2 text-xs font-bold text-white drop-shadow-md">{auction.title}</p>
        </div>
      </div>
    </Link>
  );
}
