'use client';

/**
 * Homepage aste — hero, ricerca, filtri, lista/griglia come SearchResults (Meilisearch).
 */

import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { PlusCircle, Search, List, Users, Truck, ChevronLeft, ChevronRight, ChevronDown, ChevronUp, X } from 'lucide-react';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { useAuthStore } from '@/lib/stores/auth-store';
import { countryFlagEmoji } from '@/lib/auction/country-flag';
import { auctionDetailPath } from '@/lib/auction/auction-paths';
import { getStoredAsteViewMode, setStoredAsteViewMode, type AsteViewMode } from '@/lib/auction/aste-view-storage';
import {
  AuctionListTable,
  AuctionResultsGrid,
  AuctionViewToggle,
  formatHMS,
  type EnrichedAuction,
} from '@/components/feature/aste/auctions-browse-shared';
import { AsteFloatingNav } from '@/components/feature/aste/AsteFloatingNav';
import {
  MOCK_AUCTIONS,
  isAuctionEnded,
  isEndingSoon,
  type AuctionGame,
} from '@/components/feature/aste/mock-auctions';

function useScrollPast(ref: React.RefObject<HTMLElement | null>, offset = 100): boolean {
  const [past, setPast] = useState(false);
  useEffect(() => {
    const onScroll = () => {
      const el = ref.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      setPast(rect.bottom < offset);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [ref, offset]);
  return past;
}

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

export function AsteHubPage() {
  const { t } = useTranslation();
  const now = useNowTick();
  const enriched = useEnrichedAuctions();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  const [viewMode, setViewMode] = useState<AsteViewMode>('grid');
  const [sort, setSort] = useState<SortMode>('ending');
  const [q, setQ] = useState('');

  const [filterGame, setFilterGame] = useState<'all' | AuctionGame>('all');
  const [filterPriceMax, setFilterPriceMax] = useState('');
  const [filterEndingOnly, setFilterEndingOnly] = useState(false);
  const [filterMinBids, setFilterMinBids] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [carouselIndex, setCarouselIndex] = useState(0);
  const carouselRef = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLDivElement>(null);
  const showFloating = useScrollPast(heroRef, 100);

  useEffect(() => {
    setViewMode(getStoredAsteViewMode(VIEW_STORAGE_KEY));
  }, []);

  useEffect(() => {
    setStoredAsteViewMode(VIEW_STORAGE_KEY, viewMode);
  }, [viewMode]);

  const endingSoon = useMemo(() => {
    return enriched
      .filter((a) => !isAuctionEnded(a) && isEndingSoon(a.hoursFromNow))
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
      if (filterEndingOnly && !isEndingSoon(a.hoursFromNow)) return false;
      if (!Number.isNaN(minB) && a.bidCount < minB) return false;
      return true;
    });

    const copy = [...rows];
    if (sort === 'ending') {
      copy.sort((a, b) => {
        const ae = isAuctionEnded(a);
        const be = isAuctionEnded(b);
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

  const scrollToCard = (index: number) => {
    if (!carouselRef.current) return;
    const cardWidth = 280;
    const gap = 16;
    const scrollPosition = index * (cardWidth + gap);
    carouselRef.current.scrollTo({ left: scrollPosition, behavior: 'smooth' });
    setCarouselIndex(index);
  };

  const handlePrev = () => {
    const newIndex = Math.max(0, carouselIndex - 1);
    scrollToCard(newIndex);
  };

  const handleNext = () => {
    const maxIndex = Math.max(0, endingSoon.length - 4);
    const newIndex = Math.min(maxIndex, carouselIndex + 1);
    scrollToCard(newIndex);
  };

  return (
    <div className="min-h-screen bg-white">
      <div
        ref={heroRef}
        className="relative overflow-hidden border-b border-[#0f172a]/20"
        style={{ background: 'linear-gradient(135deg, #1A2B45 0%, #1D3160 55%, #152238 100%)' }}
      >
        <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-[#FF7300]/10 blur-3xl" />
        <div className="container-content relative py-4 md:py-5">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-2xl">
              <h1 className="text-3xl font-bold uppercase tracking-tight text-white whitespace-nowrap md:text-4xl lg:text-5xl">
                {t('auctions.heroTitle')}
              </h1>
              <p className="mt-3 text-sm leading-relaxed text-white/80 md:text-base">{t('auctions.heroSubtitle')}</p>
              <p className="mt-4 text-sm font-medium text-[#FF7300]">
                {t('auctions.heroStat', { count: MOCK_AUCTIONS.length })}
              </p>
            </div>
            <div className="flex w-full shrink-0 flex-col gap-3 sm:items-end lg:w-auto">
              {isAuthenticated && (
                <>
                  <div className="flex w-full flex-col gap-2 lg:w-auto">
                    <Link
                      href="/aste/nuova"
                      className="group inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#FF7300] px-4 py-1.5 text-xs font-semibold uppercase tracking-wide text-white shadow-[0_0_20px_rgba(255,115,0,0.5)] transition hover:bg-[#e86800] hover:shadow-[0_0_30px_rgba(255,115,0,0.7)] focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
                      aria-label={t('auctions.createAuctionAria')}
                    >
                      <PlusCircle className="h-3.5 w-3.5 transition-transform group-hover:scale-110" aria-hidden />
                      <span>{t('auctions.createAuction')}</span>
                    </Link>
                    <Link
                      href="/aste/mie"
                      className="inline-flex w-full items-center justify-center gap-1.5 rounded-full border border-white/30 bg-white/10 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-white/20"
                      title={t('auctions.navMyListings')}
                    >
                      <List className="h-3.5 w-3.5" aria-hidden />
                      <span>{t('auctions.navMyListings')}</span>
                    </Link>
                    <Link
                      href="/aste/partecipazioni"
                      className="inline-flex w-full items-center justify-center gap-1.5 rounded-full border border-white/30 bg-white/10 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-white/20"
                      title={t('auctions.navParticipations')}
                    >
                      <Users className="h-3.5 w-3.5" aria-hidden />
                      <span>{t('auctions.navParticipations')}</span>
                    </Link>
                    <Link
                      href="/aste/spedizioni"
                      className="inline-flex w-full items-center justify-center gap-1.5 rounded-full border border-white/30 bg-white/10 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-white/20"
                      title={t('auctions.navShipping')}
                    >
                      <Truck className="h-3.5 w-3.5" aria-hidden />
                      <span>{t('auctions.navShipping')}</span>
                    </Link>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <section className="pb-16 pt-6">
        <div className="container-content">
          <nav className="mb-4 flex flex-wrap gap-2 text-sm text-gray-500">
            <Link href="/" className="hover:text-gray-900">
              {t('auctions.breadcrumbHome')}
            </Link>
            <span>/</span>
            <span className="text-gray-900">{t('pages.auctions.title')}</span>
          </nav>

          <div className="mb-6 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            {/* Search bar */}
            <div className="flex items-center rounded-full bg-gray-100 px-2 py-1.5">
              <div className="flex flex-1 items-center gap-3 px-3">
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
                className="shrink-0 rounded-full bg-[#FF7300] px-4 py-1.5 text-sm font-semibold text-white transition hover:bg-[#e86800]"
              >
                Cerca
              </button>
            </div>

            {/* Freccia toggle filtri - centrale, senza sfondo */}
            <button
              type="button"
              onClick={() => setShowFilters(!showFilters)}
              className="mx-auto mt-2 flex items-center justify-center p-1 text-gray-500 transition hover:text-[#FF7300]"
              aria-label={showFilters ? 'Nascondi filtri' : 'Mostra filtri'}
            >
              {showFilters ? (
                <ChevronUp className="h-5 w-5" />
              ) : (
                <ChevronDown className="h-5 w-5" />
              )}
            </button>

            {/* Filtri espandibili */}
            <div
              className={`overflow-hidden transition-all duration-300 ${showFilters ? 'mt-4 max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}
            >
              <div className="flex flex-col gap-3 border-t border-gray-200 pt-4 sm:flex-row sm:flex-wrap sm:items-end">
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
                <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm font-medium text-gray-800 w-full sm:w-auto">
                  <input
                    type="checkbox"
                    checked={filterEndingOnly}
                    onChange={(e) => setFilterEndingOnly(e.target.checked)}
                    className="h-4 w-4 rounded border-gray-400 text-[#FF7300] focus:ring-[#FF7300]"
                  />
                  {t('auctions.filterEndingOnly')}
                </label>
              </div>
            </div>
          </div>

          {endingSoon.length > 0 && (
            <div className="mb-8 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-lg font-bold uppercase tracking-wide text-gray-900">
                  {t('auctions.sectionEndingSoon')}
                </h2>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handlePrev}
                    disabled={carouselIndex === 0}
                    className="flex h-8 w-8 items-center justify-center rounded-full border border-gray-300 bg-white text-gray-600 transition hover:border-[#FF7300] hover:text-[#FF7300] disabled:opacity-40 disabled:cursor-not-allowed"
                    aria-label="Scorri indietro"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={handleNext}
                    disabled={carouselIndex >= Math.max(0, endingSoon.length - 4)}
                    className="flex h-8 w-8 items-center justify-center rounded-full border border-gray-300 bg-white text-gray-600 transition hover:border-[#FF7300] hover:text-[#FF7300] disabled:opacity-40 disabled:cursor-not-allowed"
                    aria-label="Scorri avanti"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <div
                ref={carouselRef}
                className="flex gap-4 overflow-x-auto scroll-smooth pb-2 scrollbar-hide"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
              >
                {endingSoon.map((a) => (
                  <EndingSoonCard key={a.id} auction={a} now={now} t={t} />
                ))}
              </div>
            </div>
          )}

          <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border border-gray-300 bg-white px-4 py-3">
            <p className="text-sm text-gray-700">{t('auctions.resultsCount', { count: filtered.length })}</p>
            <div className="flex flex-wrap items-center gap-4">
              <label className="flex items-center gap-2 text-sm text-gray-600">
                <span className="whitespace-nowrap">{t('search.sortBy')}</span>
                <select
                  value={sort}
                  onChange={(e) => setSort(e.target.value as SortMode)}
                  className="min-w-[11rem] rounded-none border border-gray-300 px-3 py-2 text-sm font-medium bg-white text-gray-900 [color-scheme:light] focus:outline-none focus:ring-2 focus:ring-[#FF7300]/40"
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

          <div className="overflow-hidden border border-gray-300 bg-white">
            {filtered.length === 0 ? (
              <div className="p-16 text-center text-gray-500">{t('auctions.noResults')}</div>
            ) : viewMode === 'grid' ? (
              <AuctionResultsGrid auctions={filtered} now={now} t={t} />
            ) : (
              <AuctionListTable auctions={filtered} now={now} t={t} />
            )}
          </div>
        </div>
      </section>

      <AsteFloatingNav visible={showFloating} />
    </div>
  );
}

function EndingSoonCard({
  auction,
  now,
  t,
}: {
  auction: EnrichedAuction;
  now: number;
  t: ReturnType<typeof useTranslation>['t'];
}) {
  const ms = new Date(auction.endsAt).getTime() - now;
  return (
    <Link
      href={auctionDetailPath(auction.id)}
      scroll
      prefetch
      className="group relative flex h-[380px] w-[260px] shrink-0 flex-col overflow-hidden rounded-[4px] border border-gray-200 bg-white shadow-md transition hover:border-[#FF7300] hover:shadow-lg"
    >
      {/* Full card image with dark blur overlay */}
      <div className="relative h-full w-full">
        <Image 
          src={auction.image} 
          alt="" 
          fill 
          className="object-cover transition duration-500 group-hover:scale-105" 
          sizes="260px" 
          unoptimized 
        />
        {/* Dark blur overlay for readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/10" />
        
        {/* Content overlay */}
        <div className="absolute inset-0 flex flex-col justify-between p-4">
          {/* Top: Game badge */}
          <div className="flex justify-end">
            <span className="rounded-[4px] bg-[#FF7300]/90 px-2 py-1 text-[10px] font-bold uppercase text-white">
              {auction.game.toUpperCase()}
            </span>
          </div>
          
          {/* Bottom: All auction data */}
          <div className="space-y-2">
            {/* Countdown */}
            <div className="rounded-[4px] bg-black/60 p-2 text-center backdrop-blur-sm">
              <p className="font-mono text-xl font-bold tabular-nums text-[#FF7300]">{formatHMS(ms)}</p>
              <p className="text-[10px] font-semibold uppercase text-white/80">{t('auctions.countdownTitle')}</p>
            </div>
            
            {/* Title */}
            <p className="line-clamp-2 text-sm font-bold text-white drop-shadow-md">{auction.title}</p>
            
            {/* Seller info */}
            <div className="flex items-center gap-2 text-xs text-white/90">
              <span className="text-base">{countryFlagEmoji(auction.sellerCountry)}</span>
              <span className="truncate">{auction.seller}</span>
              <span className="text-amber-400">★{auction.sellerRating}%</span>
            </div>
            
            {/* Price and Bids */}
            <div className="flex items-end justify-between">
              <div>
                <p className="text-[10px] font-semibold uppercase text-white/70">{t('auctions.currentBid')}</p>
                <p className="text-lg font-bold text-[#FF7300]">
                  {auction.currentBidEur.toLocaleString('it-IT', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })}
                </p>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-semibold uppercase text-white/70">{t('auctions.colBids')}</p>
                <p className="text-base font-bold text-white">{auction.bidCount}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
