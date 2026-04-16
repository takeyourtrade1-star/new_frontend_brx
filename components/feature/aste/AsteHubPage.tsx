'use client';

/**
 * Homepage aste — hero, ricerca, filtri, lista/griglia come SearchResults (Meilisearch).
 */

import { useEffect, useMemo, useState, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { PlusCircle, Search, List, Users, Truck, ChevronDown, ChevronUp, X, LucideIcon, Filter, SlidersHorizontal } from 'lucide-react';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { useAuthStore } from '@/lib/stores/auth-store';
import { cn } from '@/lib/utils';
import { auctionDetailPath } from '@/lib/auction/auction-paths';
import { getStoredAsteViewMode, setStoredAsteViewMode, type AsteViewMode } from '@/lib/auction/aste-view-storage';
import {
  AuctionListTable,
  AuctionResultsGrid,
  AuctionViewToggle,
  formatHMS,
  type EnrichedAuction,
} from '@/components/feature/aste/auctions-browse-shared';
import { AsteNav } from '@/components/feature/aste/AsteNav';
import { MascotteLoader } from '@/components/dev/MascotteLoader';
import { useAuctionList } from '@/lib/hooks/use-auctions';
import { apiToAuctionUI, isAuctionEndedUI, isEndingSoonUI, type AuctionGame, type AuctionUI } from '@/lib/auction/auction-adapter';
import { AppBreadcrumb, type AppBreadcrumbItem } from '@/components/ui/AppBreadcrumb';

type SortMode = 'ending' | 'new' | 'bid';

const VIEW_STORAGE_KEY = 'hub';

function useNowTick(intervalMs = 1000): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return now;
}

export function AsteHubPage() {
  const { t } = useTranslation();
  const now = useNowTick();
  const { data: listData, isLoading, error } = useAuctionList({ limit: 100 });
  const enriched: AuctionUI[] = useMemo(
    () => (listData?.data ?? []).map((a) => apiToAuctionUI(a)),
    [listData]
  );
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const breadcrumbItems: AppBreadcrumbItem[] = [
    { href: '/', label: t('auctions.breadcrumbHome'), isCurrent: false },
    { label: t('pages.auctions.title'), isCurrent: true },
  ];

  const [viewMode, setViewMode] = useState<AsteViewMode>('grid');
  const [sort, setSort] = useState<SortMode>('ending');
  const [q, setQ] = useState('');

  const [filterGame, setFilterGame] = useState<'all' | AuctionGame>('all');
  const [filterPriceMax, setFilterPriceMax] = useState('');
  const [filterEndingOnly, setFilterEndingOnly] = useState(false);
  const [filterMinBids, setFilterMinBids] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // Sticky bottom bar states
  const [showStickyBar, setShowStickyBar] = useState(false);
  const [bottomBarExpanded, setBottomBarExpanded] = useState(false);

  useEffect(() => {
    setViewMode(getStoredAsteViewMode(VIEW_STORAGE_KEY));
  }, []);

  useEffect(() => {
    setStoredAsteViewMode(VIEW_STORAGE_KEY, viewMode);
  }, [viewMode]);

  // Detect scroll to show sticky bar
  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY || document.documentElement.scrollTop;
      const isVisible = scrollY > 300;
      // Show sticky bar after scrolling past the filter section (approx 300px)
      setShowStickyBar(isVisible);
      // Notify mascotte to move up
      window.dispatchEvent(new CustomEvent('stickyBarVisibilityChange', { detail: { visible: isVisible } }));
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // Check initial position
    
    // Cleanup: reset mascot position when leaving page
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
    const needle = q.trim().toLowerCase();
    const maxP = filterPriceMax.trim() ? Number(filterPriceMax) : NaN;
    const minB = filterMinBids.trim() ? Number(filterMinBids) : NaN;

    let rows = enriched.filter((a) => {
      if (needle && !a.title.toLowerCase().includes(needle) && !a.seller.toLowerCase().includes(needle)) {
        return false;
      }
      if (filterGame !== 'all' && a.game !== filterGame) return false;
      if (!Number.isNaN(maxP) && a.currentBidEur > maxP) return false;
      if (filterEndingOnly && !isEndingSoonUI(a.hoursFromNow)) return false;
      if (!Number.isNaN(minB) && a.bidCount < minB) return false;
      return true;
    });

    const copy = [...rows];
    if (sort === 'ending') {
      copy.sort((a, b) => {
        const ae = isAuctionEndedUI(a);
        const be = isAuctionEndedUI(b);
        if (ae !== be) return ae ? 1 : -1;
        return a.hoursFromNow - b.hoursFromNow;
      });
    } else if (sort === 'new') {
      copy.reverse();
    } else {
      copy.sort((a, b) => b.currentBidEur - a.currentBidEur);
    }
    return copy;
  }, [enriched, q, sort, filterGame, filterPriceMax, filterEndingOnly, filterMinBids]);

  if (isLoading) {
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
              {/* Mobile: stack verticale, Desktop: flex orizzontale */}
              <div className="flex flex-col gap-6 sm:flex-row sm:items-stretch">
                {/* Sezione In evidenza - 3 card */}
                <div className="flex-1">
                  <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-700">
                    In evidenza
                  </h3>
                  <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                    {endingSoon.slice(0, 3).map((a) => (
                      <EndingSoonCard key={a.id} auction={a} now={now} featured />
                    ))}
                  </div>
                </div>

                {/* Separatore verticale - solo desktop */}
                <div className="hidden w-px self-stretch bg-gray-300 sm:block" />

                {/* Sezione Terminano presto - 3 card */}
                <div className="flex-1">
                  <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-700">
                    Terminano presto
                  </h3>
                  <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
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
            className="mb-4 w-auto text-sm"
          />

          {/* Sezione filtri unificata */}
          <div className="mb-6 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            {/* Riga superiore: ricerca + toggle filtri */}
            <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center">
              {/* Search bar */}
              <div className="flex w-full min-w-0 items-center overflow-hidden rounded-full bg-gray-100 px-2 py-1.5">
                <div className="flex min-w-0 flex-1 items-center gap-2 px-3">
                  <Search className="h-4 w-4 shrink-0 text-gray-500" aria-hidden />
                  <input
                    id="aste-hub-search"
                    type="search"
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    placeholder={t('auctions.searchPlaceholder')}
                    className="min-w-0 flex-1 bg-transparent text-sm text-gray-900 placeholder:text-gray-500 focus:outline-none"
                    aria-label={t('auctions.searchPlaceholder')}
                  />
                  {q && (
                    <button
                      type="button"
                      onClick={() => setQ('')}
                      className="text-gray-400 hover:text-gray-600 transition-colors focus:outline-none"
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
                  Cerca
                </button>
              </div>
              {/* Toggle filtri accanto alla search */}
              <button
                type="button"
                onClick={() => setShowFilters(!showFilters)}
                className={cn(
                  'self-center sm:self-auto flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-primary/30 bg-primary/50 text-white shadow ring-1 ring-white/10 backdrop-blur-xl backdrop-saturate-150 transition-all hover:scale-105 hover:bg-primary/60 active:scale-95',
                  showFilters && 'bg-primary/70 ring-white/20'
                )}
                aria-label={showFilters ? 'Nascondi filtri' : 'Mostra filtri'}
              >
                {showFilters ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </button>
            </div>

            {/* Filtri espandibili + risultati */}
            <div
              className={`overflow-hidden transition-all duration-300 ${showFilters ? 'mt-4 max-h-[75vh] overflow-y-auto pr-1 opacity-100' : 'max-h-0 opacity-0'}`}
            >
              {/* Riga unica: filtri + ordinamento + vista */}
              <div className="flex flex-wrap items-end gap-3 border-b border-gray-200 pb-4">
                <label className="flex flex-col gap-1 w-full sm:w-auto">
                  <span className="text-xs font-semibold uppercase text-gray-600">{t('auctions.filterGame')}</span>
                  <select
                    value={filterGame}
                    onChange={(e) => setFilterGame(e.target.value as 'all' | AuctionGame)}
                    className="w-full sm:min-w-[140px] sm:w-auto rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 [color-scheme:light]"
                  >
                    <option value="all">{t('auctions.gameAll')}</option>
                    <option value="mtg">{t('auctions.gameMtg')}</option>
                    <option value="lorcana">{t('auctions.gameLorcana')}</option>
                    <option value="pokemon">{t('auctions.gamePokemon')}</option>
                    <option value="op">{t('auctions.gameOp')}</option>
                    <option value="ygo">{t('auctions.gameYgo')}</option>
                  </select>
                </label>
                <label className="flex flex-col gap-1 w-full sm:w-auto">
                  <span className="text-xs font-semibold uppercase text-gray-600">{t('auctions.filterPriceMax')}</span>
                  <input
                    type="number"
                    min={0}
                    inputMode="numeric"
                    placeholder="€ max"
                    value={filterPriceMax}
                    onChange={(e) => setFilterPriceMax(e.target.value)}
                    className="w-full sm:w-[120px] rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900"
                  />
                </label>
                <label className="flex flex-col gap-1 w-full sm:w-auto">
                  <span className="text-xs font-semibold uppercase text-gray-600">{t('auctions.filterMinBids')}</span>
                  <input
                    type="number"
                    min={0}
                    inputMode="numeric"
                    placeholder="Min offerte"
                    value={filterMinBids}
                    onChange={(e) => setFilterMinBids(e.target.value)}
                    className="w-full sm:w-[120px] rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900"
                  />
                </label>
                <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm font-medium text-gray-800 w-full sm:w-auto h-[38px]">
                  <input
                    type="checkbox"
                    checked={filterEndingOnly}
                    onChange={(e) => setFilterEndingOnly(e.target.checked)}
                    className="h-4 w-4 rounded border-gray-400 text-[#FF7300] focus:ring-[#FF7300]"
                  />
                  {t('auctions.filterEndingOnly')}
                </label>
                
                {/* Spacer per spingere Ordina per e vista a destra */}
                <div className="hidden lg:block flex-1" />
                
                {/* Ordina per + vista */}
                <label className="flex items-center gap-2 text-sm text-gray-600 w-full sm:w-auto">
                  <span className="whitespace-nowrap text-xs font-semibold uppercase text-gray-600">{t('search.sortBy')}</span>
                  <select
                    value={sort}
                    onChange={(e) => setSort(e.target.value as SortMode)}
                    className="min-w-[11rem] rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium bg-white text-gray-900 [color-scheme:light] focus:outline-none focus:ring-2 focus:ring-[#FF7300]/40"
                  >
                    <option value="ending">{t('auctions.sortEndingSoon')}</option>
                    <option value="new">{t('auctions.sortNewest')}</option>
                    <option value="bid">{t('auctions.sortHighestBid')}</option>
                  </select>
                </label>
                <AuctionViewToggle
                  viewMode={viewMode}
                  onViewModeChange={setViewMode}
                  listLabel={t('auctions.viewList')}
                  gridLabel={t('auctions.viewGrid')}
                />
              </div>
            </div>
          </div>

          {/* Risultati aste */}
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm font-medium text-gray-700">{t('auctions.resultsCount', { count: filtered.length })}</p>
          </div>
          <div className="overflow-hidden border border-gray-300 bg-gray-50">
            {filtered.length === 0 ? (
              <div className="p-8 text-center text-gray-500 sm:p-16">{t('auctions.noResults')}</div>
            ) : viewMode === 'grid' ? (
              <AuctionResultsGrid auctions={filtered} now={now} t={t} />
            ) : (
              <div className="overflow-x-auto">
                <AuctionListTable auctions={filtered} now={now} t={t} />
              </div>
            )}
          </div>
        </div>
        </div>
      </section>

      {/* Sticky Bottom Bar - Search + Expandable Filters */}
      {showStickyBar && (
        <div
          className="fixed bottom-0 left-0 right-0 z-40 overflow-x-clip border-t border-gray-200 bg-white/95 backdrop-blur-md animate-slide-up-bounce"
        >
          <div className="px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3">
            {/* Stessa UI della search bar originale */}
            <div className="flex min-w-0 items-center gap-2">
              {/* Search bar pillola */}
              <div className="flex min-w-0 flex-1 items-center overflow-hidden rounded-full bg-gray-100 px-2 py-1.5">
                <div className="flex min-w-0 flex-1 items-center gap-2 px-3">
                  <Search className="h-4 w-4 shrink-0 text-gray-500" aria-hidden />
                  <input
                    type="search"
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    placeholder={t('auctions.searchPlaceholder')}
                    className="min-w-0 flex-1 bg-transparent text-sm text-gray-900 placeholder:text-gray-500 focus:outline-none"
                    aria-label={t('auctions.searchPlaceholder')}
                  />
                  {q && (
                    <button
                      type="button"
                      onClick={() => setQ('')}
                      className="text-gray-400 hover:text-gray-600 transition-colors focus:outline-none"
                      aria-label="Cancella ricerca"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
                <button
                  type="button"
                  className="shrink-0 whitespace-nowrap rounded-full bg-[#FF7300] px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-[#e86800] sm:px-4 sm:text-sm"
                >
                  Cerca
                </button>
              </div>
              {/* Toggle filtri */}
              <button
                type="button"
                onClick={() => setBottomBarExpanded(!bottomBarExpanded)}
                className={cn(
                  'flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-primary/30 bg-primary/50 text-white shadow ring-1 ring-white/10 backdrop-blur-xl backdrop-saturate-150 transition-all hover:scale-105 hover:bg-primary/60 active:scale-95',
                  bottomBarExpanded && 'bg-primary/70 ring-white/20'
                )}
                aria-label={bottomBarExpanded ? 'Comprimi filtri' : 'Espandi filtri'}
              >
                {bottomBarExpanded ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronUp className="h-4 w-4" />
                )}
              </button>
            </div>

            {/* Filtri espandibili */}
            {bottomBarExpanded && (
              <div className="mt-3 overflow-hidden transition-all duration-300">
                <div className="flex flex-wrap items-end gap-3 border-b border-gray-200 pb-3">
                  {/* Game Filter */}
                  <label className="flex flex-col gap-1 w-full sm:w-auto">
                    <span className="text-xs font-semibold uppercase text-gray-600">{t('auctions.filterGame')}</span>
                    <select
                      value={filterGame}
                      onChange={(e) => setFilterGame(e.target.value as 'all' | AuctionGame)}
                      className="w-full sm:min-w-[140px] sm:w-auto rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 [color-scheme:light]"
                    >
                      <option value="all">{t('auctions.gameAll')}</option>
                      <option value="mtg">{t('auctions.gameMtg')}</option>
                      <option value="lorcana">{t('auctions.gameLorcana')}</option>
                      <option value="pokemon">{t('auctions.gamePokemon')}</option>
                      <option value="op">{t('auctions.gameOp')}</option>
                      <option value="ygo">{t('auctions.gameYgo')}</option>
                    </select>
                  </label>

                  {/* Price Max */}
                  <label className="flex flex-col gap-1 w-full sm:w-auto">
                    <span className="text-xs font-semibold uppercase text-gray-600">{t('auctions.filterPriceMax')}</span>
                    <input
                      type="number"
                      min={0}
                      inputMode="numeric"
                      placeholder="€ max"
                      value={filterPriceMax}
                      onChange={(e) => setFilterPriceMax(e.target.value)}
                      className="w-full sm:w-[120px] rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900"
                    />
                  </label>

                  {/* Min Bids */}
                  <label className="flex flex-col gap-1 w-full sm:w-auto">
                    <span className="text-xs font-semibold uppercase text-gray-600">{t('auctions.filterMinBids')}</span>
                    <input
                      type="number"
                      min={0}
                      inputMode="numeric"
                      placeholder="Min offerte"
                      value={filterMinBids}
                      onChange={(e) => setFilterMinBids(e.target.value)}
                      className="w-full sm:w-[120px] rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900"
                    />
                  </label>

                  {/* Ending Only */}
                  <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm font-medium text-gray-800 w-full sm:w-auto h-[38px]">
                    <input
                      type="checkbox"
                      checked={filterEndingOnly}
                      onChange={(e) => setFilterEndingOnly(e.target.checked)}
                      className="h-4 w-4 rounded border-gray-400 text-[#FF7300] focus:ring-[#FF7300]"
                    />
                    {t('auctions.filterEndingOnly')}
                  </label>

                  {/* Spacer */}
                  <div className="hidden lg:block flex-1" />

                  {/* Sort */}
                  <label className="flex items-center gap-2 text-sm text-gray-600 w-full sm:w-auto">
                    <span className="whitespace-nowrap text-xs font-semibold uppercase text-gray-600">{t('search.sortBy')}</span>
                    <select
                      value={sort}
                      onChange={(e) => setSort(e.target.value as SortMode)}
                      className="min-w-[11rem] rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium bg-white text-gray-900 [color-scheme:light] focus:outline-none focus:ring-2 focus:ring-[#FF7300]/40"
                    >
                      <option value="ending">{t('auctions.sortEndingSoon')}</option>
                      <option value="new">{t('auctions.sortNewest')}</option>
                      <option value="bid">{t('auctions.sortHighestBid')}</option>
                    </select>
                  </label>

                  {/* View Toggle */}
                  <AuctionViewToggle
                    viewMode={viewMode}
                    onViewModeChange={setViewMode}
                    listLabel={t('auctions.viewList')}
                    gridLabel={t('auctions.viewGrid')}
                  />
                </div>
              </div>
            )}
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
      {/* Card image with overlay */}
      <div className="relative h-full w-full">
        <Image 
          src={auction.image} 
          alt="" 
          fill 
          className="object-cover transition duration-500 group-hover:scale-105" 
          sizes="200px" 
          unoptimized 
        />
        {/* Dark blur overlay for readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
        
        {/* Content overlay - timer e nome prodotto */}
        <div className="absolute inset-0 flex flex-col justify-end p-3">
          {/* Countdown - scadenza con bordo condizionale */}
          <div className={`mb-2 rounded-full border bg-white/20 p-1.5 text-center backdrop-blur-md shadow-lg ${featured ? 'border-amber-400/60' : 'border-red-400/60 animate-pulse'}`}>
            <p className="font-mono text-sm font-bold tabular-nums text-white" suppressHydrationWarning>{formatHMS(ms)}</p>
          </div>
          
          {/* Title - nome prodotto */}
          <p className="line-clamp-2 text-xs font-bold text-white drop-shadow-md">{auction.title}</p>
        </div>
      </div>
    </Link>
  );
}
