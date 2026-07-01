'use client';

import { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, Clock3 } from 'lucide-react';
import { auctionDetailPath } from '@/lib/auction/auction-paths';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { useAuctionList } from '@/lib/hooks/use-auctions';
import { apiToAuctionUI, isAuctionEndedUI, isEndingSoonUI, type AuctionUI } from '@/lib/auction/auction-adapter';
import { MoneyWithSmallCents } from '@/components/feature/aste/auctions-browse-shared';
import { useEnrichedAuctions } from '@/lib/hooks/use-enriched-auctions';

/* ─────────────────────────────────────────────────────── */
/*  Constants                                              */
/* ─────────────────────────────────────────────────────── */

const CARD_WIDTH = 186;
const CARD_GAP = 12;
const SCROLL_STEP = (CARD_WIDTH + CARD_GAP) * 1.5;
const AUTOPLAY_MS = 5000;
const SWIPE_THRESHOLD = 50; // min px for swipe detection

function formatCountdown(hoursFromNow: number): string {
  const totalMinutes = Math.max(1, Math.round(hoursFromNow * 60));
  const days = Math.floor(totalMinutes / 1440);
  const hours = Math.floor((totalMinutes % 1440) / 60);
  const minutes = totalMinutes % 60;

  if (days > 0) {
    return hours > 0 ? `${days}g ${hours}h` : `${days}g`;
  }

  if (hours > 0) {
    return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
  }

  return `${minutes}m`;
}

/* ─────────────────────────────────────────────────────── */
/*  Image Preloader Hook                                   */
/* ─────────────────────────────────────────────────────── */

const PREFETCH_THROTTLE_MS = 150;
const PREFETCH_MAX_LINKS = 10;

type IdleHandle = number;
type IdleScheduler = (cb: () => void) => IdleHandle;
type IdleCanceller = (handle: IdleHandle) => void;

const scheduleIdle: IdleScheduler = (cb) => {
  if (typeof window === 'undefined') return 0 as IdleHandle;
  const w = window as Window & {
    requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number;
  };
  if (typeof w.requestIdleCallback === 'function') {
    return w.requestIdleCallback(cb, { timeout: 500 }) as IdleHandle;
  }
  return window.setTimeout(cb, 1) as unknown as IdleHandle;
};

const cancelIdle: IdleCanceller = (handle) => {
  if (typeof window === 'undefined' || !handle) return;
  const w = window as Window & { cancelIdleCallback?: (h: number) => void };
  if (typeof w.cancelIdleCallback === 'function') {
    w.cancelIdleCallback(handle as number);
    return;
  }
  window.clearTimeout(handle as unknown as number);
};

function usePrefetchImages(items: AuctionUI[], containerRef: React.RefObject<HTMLDivElement | null>) {
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const prefetchedUrls = new Set<string>();
    const insertedLinks: HTMLLinkElement[] = [];
    let lastRunAt = 0;
    let trailingTimer: ReturnType<typeof setTimeout> | null = null;
    let pendingIdle: IdleHandle = 0 as IdleHandle;

    const doPrefetch = () => {
      pendingIdle = 0 as IdleHandle;
      lastRunAt = Date.now();

      if (prefetchedUrls.size >= PREFETCH_MAX_LINKS) return;

      const scrollLeft = container.scrollLeft;
      const containerWidth = container.clientWidth;
      const visibleStart = scrollLeft;
      const visibleEnd = scrollLeft + containerWidth;

      const cards = container.querySelectorAll('[data-auction-card]');
      for (let index = 0; index < cards.length; index++) {
        if (prefetchedUrls.size >= PREFETCH_MAX_LINKS) break;

        const cardLeft = (CARD_WIDTH + CARD_GAP) * index;
        const isVisible =
          cardLeft >= visibleStart - CARD_WIDTH && cardLeft <= visibleEnd + CARD_WIDTH * 2;
        if (!isVisible) continue;

        const img = cards[index].querySelector('img[data-src]') as HTMLImageElement | null;
        const url = img?.dataset.src;
        if (!url || prefetchedUrls.has(url)) continue;

        const prefetchLink = document.createElement('link');
        prefetchLink.rel = 'prefetch';
        prefetchLink.as = 'image';
        prefetchLink.href = url;
        document.head.appendChild(prefetchLink);
        prefetchedUrls.add(url);
        insertedLinks.push(prefetchLink);
      }
    };

    const scheduleRun = () => {
      if (pendingIdle) return;
      pendingIdle = scheduleIdle(doPrefetch);
    };

    const onScroll = () => {
      if (prefetchedUrls.size >= PREFETCH_MAX_LINKS) return;
      const now = Date.now();
      const elapsed = now - lastRunAt;

      if (elapsed >= PREFETCH_THROTTLE_MS) {
        scheduleRun();
        return;
      }
      if (trailingTimer) return;
      trailingTimer = setTimeout(() => {
        trailingTimer = null;
        scheduleRun();
      }, PREFETCH_THROTTLE_MS - elapsed);
    };

    scheduleRun();
    container.addEventListener('scroll', onScroll, { passive: true });

    return () => {
      container.removeEventListener('scroll', onScroll);
      if (trailingTimer) clearTimeout(trailingTimer);
      if (pendingIdle) cancelIdle(pendingIdle);
      for (const link of insertedLinks) {
        if (link.parentNode) link.parentNode.removeChild(link);
      }
      insertedLinks.length = 0;
      prefetchedUrls.clear();
    };
  }, [items, containerRef]);
}

/* ─────────────────────────────────────────────────────── */
/*  Main Component                                         */
/* ─────────────────────────────────────────────────────── */

export function AsteInCorsoCarousel({ useLightText = false, compact = false }: { useLightText?: boolean; compact?: boolean } = {}) {
  const { t } = useTranslation();
  const scrollRef = useRef<HTMLDivElement>(null);
  const pauseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const { data: listData, isLoading } = useAuctionList({ status: 'ACTIVE', limit: 60, offset: 0 });

  const liveAuctionsBase = useMemo(() => {
    const rows = (listData?.data ?? [])
      .map((a) => apiToAuctionUI(a))
      .filter((a) => !isAuctionEndedUI(a));
    return rows.sort((a, b) => a.hoursFromNow - b.hoursFromNow);
  }, [listData]);
  const liveAuctions = useEnrichedAuctions(liveAuctionsBase);

  const featuredAuctionIds = useMemo(() => {
    return liveAuctions
      .filter((a) => isEndingSoonUI(a.hoursFromNow))
      .slice(0, 3)
      .map((a) => a.id);
  }, [liveAuctions]);

  const auctions = useMemo(() => {
    const featuredSet = new Set(featuredAuctionIds);
    const featuredRows = liveAuctions.filter((a) => featuredSet.has(a.id));
    const otherRows = liveAuctions.filter((a) => !featuredSet.has(a.id));
    return [...featuredRows, ...otherRows];
  }, [liveAuctions, featuredAuctionIds]);

  /* ── Scroll-state check ── */
  const updateScrollState = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 2);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 2);
  }, []);

  /* ── Manual scroll ── */
  const scroll = useCallback(
    (direction: 'left' | 'right') => {
      const el = scrollRef.current;
      if (!el) return;
      const amount = direction === 'left' ? -SCROLL_STEP : SCROLL_STEP;
      el.scrollBy({ left: amount, behavior: 'smooth' });

      setIsPaused(true);
      if (pauseTimerRef.current) {
        clearTimeout(pauseTimerRef.current);
      }
      pauseTimerRef.current = setTimeout(() => setIsPaused(false), 6000);
    },
    []
  );

  /* ── Autoplay (no loop, stops at end) ── */
  useEffect(() => {
    if (isPaused) return;
    const el = scrollRef.current;
    if (!el || auctions.length < 2) return;

    const id = setInterval(() => {
      const maxScroll = el.scrollWidth - el.clientWidth;
      if (el.scrollLeft < maxScroll - 2) {
        el.scrollBy({ left: CARD_WIDTH + CARD_GAP, behavior: 'smooth' });
      }
    }, AUTOPLAY_MS);

    return () => clearInterval(id);
  }, [isPaused, auctions.length]);

  /* ── Listen to scroll position ── */
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.addEventListener('scroll', updateScrollState, { passive: true });
    updateScrollState();
    return () => el.removeEventListener('scroll', updateScrollState);
  }, [updateScrollState]);

  /* ── Cleanup pause timer on unmount ── */
  useEffect(() => {
    return () => {
      if (pauseTimerRef.current) {
        clearTimeout(pauseTimerRef.current);
      }
    };
  }, []);

  /* ── Image Preloader ── */
  usePrefetchImages(auctions, scrollRef);

  /* ── Touch gesture handlers for mobile swipe ── */
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.targetTouches[0].clientX;
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    touchEndX.current = e.targetTouches[0].clientX;
  }, []);

  const handleTouchEnd = useCallback(() => {
    const diff = touchStartX.current - touchEndX.current;
    const absDiff = Math.abs(diff);
    
    if (absDiff > SWIPE_THRESHOLD) {
      if (diff > 0 && canScrollRight) {
        scroll('right');
      } else if (diff < 0 && canScrollLeft) {
        scroll('left');
      }
    }
  }, [canScrollLeft, canScrollRight, scroll]);

  return (
    <div className="flex flex-col justify-between">
      {/* ── Header ── */}
      {!compact && (
        <div className="flex items-center px-6 py-3">
          <div className="flex flex-col">
            <h2 className="text-3xl font-black uppercase tracking-wide font-sans text-slate-100 drop-shadow-[0_2px_2px_rgba(0,0,0,0.42)]">
              {t('auctions.liveAuctionsTitle')}
            </h2>
            <div className="mt-2 h-1 w-20 rounded-full bg-gradient-to-r from-primary to-[#ff9900]" />
          </div>
        </div>
      )}

      {/* ── Carousel wrapper ── */}
      <div
        className="group/carousel relative flex-1"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        {/* Left arrow overlay */}
        <button
          type="button"
          onClick={() => scroll('left')}
          className={cn(
            'absolute left-0 top-0 z-10 flex h-full w-10 items-center justify-center',
            'bg-gradient-to-r from-white/55 via-white/20 to-transparent',
            'opacity-0 transition-opacity duration-300',
            'group-hover/carousel:opacity-100',
            !canScrollLeft && 'pointer-events-none !opacity-0'
          )}
          aria-label={t('auctions.scrollLeft')}
        >
          <ChevronLeft className={cn('h-6 w-6 drop-shadow', useLightText ? 'text-slate-100' : 'text-gray-700')} />
        </button>

        {/* Right arrow overlay */}
        <button
          type="button"
          onClick={() => scroll('right')}
          className={cn(
            'absolute right-0 top-0 z-10 flex h-full w-10 items-center justify-center',
            'bg-gradient-to-l from-white/55 via-white/20 to-transparent',
            'opacity-0 transition-opacity duration-300',
            'group-hover/carousel:opacity-100',
            !canScrollRight && 'pointer-events-none !opacity-0'
          )}
          aria-label={t('auctions.scrollRight')}
        >
          <ChevronRight className={cn('h-6 w-6 drop-shadow', useLightText ? 'text-slate-100' : 'text-gray-700')} />
        </button>

        {/* Scrollable row */}
        <div
          ref={scrollRef}
          className={cn('flex items-start overflow-x-auto scrollbar-hide', compact ? 'gap-2 px-5 pb-2.5' : 'gap-3 px-6 pb-4')}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {auctions.map((item) => {
            const featured = featuredAuctionIds.includes(item.id);
            return (
              <div key={item.id} className={compact ? 'w-[120px] shrink-0 md:w-[140px]' : 'w-[200px] shrink-0 md:w-[240px]'}>
                <AuctionCard item={item} featured={featured} compact={compact} useLightText={useLightText} />
              </div>
            );
          })}

          {isLoading && (
            <>
              <AuctionCardSkeleton compact={compact} useLightText={useLightText} />
              <AuctionCardSkeleton compact={compact} useLightText={useLightText} />
              <AuctionCardSkeleton compact={compact} useLightText={useLightText} />
            </>
          )}

          {!isLoading && auctions.length === 0 && (
            <div className={cn('mx-2 flex w-full items-center justify-center rounded-2xl border border-white/20 bg-slate-900/40 px-4 font-medium text-white/90', compact ? 'min-h-[80px] text-xs' : 'min-h-[200px] text-sm')}>
              Nessuna asta attiva al momento
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────── */
/*  Skeleton Card                                          */
/* ─────────────────────────────────────────────────────── */

function AuctionCardSkeleton({ compact = false, useLightText = false }: { compact?: boolean; useLightText?: boolean }) {
  return (
    <div className={cn('flex shrink-0 flex-col gap-2', compact ? 'w-[120px] md:w-[140px]' : 'w-[200px] gap-3 md:w-[240px]')} aria-hidden="true">
      <div className={cn(
        'relative aspect-[63/88] w-full overflow-hidden animate-pulse',
        compact ? 'rounded-lg' : 'rounded-2xl',
        useLightText ? 'bg-slate-800' : 'bg-slate-200'
      )}>
        {!compact && (
          <div className="absolute left-2.5 top-2.5 flex gap-2">
            <div className={cn('h-5 w-20 rounded-full', useLightText ? 'bg-slate-700/50' : 'bg-slate-300/50')} />
          </div>
        )}
      </div>
      <div className="flex flex-col px-0.5">
        <div className={cn('rounded animate-pulse', compact ? 'h-3 w-3/4' : 'h-4 w-3/4', useLightText ? 'bg-slate-800' : 'bg-slate-200')} />
        {!compact && (
          <div className="mt-2.5 flex items-center justify-between">
            <div className={cn('h-5 w-16 rounded animate-pulse', useLightText ? 'bg-slate-800' : 'bg-slate-200')} />
            <div className={cn('h-5 w-16 rounded-full animate-pulse', useLightText ? 'bg-slate-800' : 'bg-slate-200')} />
          </div>
        )}
      </div>
    </div>
  );
}

type AuctionCardProps = {
  item: AuctionUI;
  featured?: boolean;
  compact?: boolean;
  useLightText?: boolean;
};

function AuctionCard({ item, featured = false, compact = false, useLightText = false }: AuctionCardProps) {
  const { t } = useTranslation();
  const endingSoon = isEndingSoonUI(item.hoursFromNow);
  const countdownLabel = formatCountdown(item.hoursFromNow);

  return (
    <Link
      href={auctionDetailPath(item.id)}
      data-auction-card
      className={cn('group flex flex-col', compact ? 'gap-1.5' : 'gap-3')}
      aria-label={t('auctions.auctionAriaLabel', { title: item.title })}
    >
      {/* Immagine */}
      <div className={cn(
        'relative aspect-[63/88] w-full overflow-hidden bg-slate-100 transition-all duration-300 group-hover:-translate-y-1',
        compact
          ? 'rounded-lg shadow-[0_2px_8px_rgba(0,0,0,0.08)] group-hover:shadow-[0_6px_16px_rgba(0,0,0,0.12)]'
          : 'rounded-2xl shadow-[0_4px_12px_rgba(0,0,0,0.08)] group-hover:shadow-[0_12px_24px_rgba(0,0,0,0.12)]'
      )}>
        <Image
          src={item.image}
          alt=""
          fill
          className="object-cover"
          sizes={compact ? '(min-width: 768px) 140px, 120px' : '(min-width: 768px) 240px, 200px'}
          unoptimized
          priority={false}
          data-src={item.image}
        />
        
        {/* Sfumatura in alto per rendere leggibili le pillole */}
        {!compact && <div className="absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-black/60 to-transparent" />}

        {/* Pillole in alto in stile Dark Glassmorphism Premium */}
        {!compact && (
          <div className="absolute left-2.5 right-2.5 top-2.5 flex flex-col items-start gap-1.5">
            {featured && (
              <span className="flex items-center gap-1.5 rounded-full border border-amber-300/30 bg-black/40 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-400 shadow-sm backdrop-blur-md">
                <span aria-hidden="true" className="text-[10px]">✨</span>
                In evidenza
              </span>
            )}
            {endingSoon && (
              <span className="flex items-center gap-1.5 rounded-full border border-red-400/30 bg-black/40 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-red-400 shadow-sm backdrop-blur-md">
                <span className="relative flex h-1.5 w-1.5 shrink-0">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-red-500" />
                </span>
                {t('auctions.endingSoonBadge')}
              </span>
            )}
          </div>
        )}

        {/* Sfumatura in basso per rendere leggibile il timer */}
        <div className="absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-black/50 to-transparent" />

        {/* Timer di scadenza dentro la carta, in basso centrata */}
        <div className={cn(
          "absolute bottom-2 left-1/2 -translate-x-1/2 z-10 flex items-center justify-center whitespace-nowrap rounded-full border bg-black/60 shadow-md backdrop-blur-md",
          compact
            ? "gap-1 px-1.5 py-0.5 text-[8px] border-white/20 text-white"
            : "gap-1.5 px-2.5 py-1 text-[10px] border-white/25 text-white",
          endingSoon && "border-red-500/40 text-red-400"
        )}>
          <Clock3 className={cn("shrink-0", compact ? "h-2.5 w-2.5" : "h-3 w-3")} />
          <span className="font-bold">{countdownLabel}</span>
        </div>
      </div>

      {/* Testo */}
      <div className={cn('flex flex-col', compact ? 'px-0.5' : 'px-1')}>
        <p className={cn(
          'line-clamp-1 font-semibold transition-colors group-hover:text-[#ff7300]',
          compact ? 'text-[11px]' : 'text-sm',
          useLightText ? 'text-white' : 'text-slate-800'
        )}>
          {item.title}
        </p>
        <div className={cn("flex items-center", compact ? "mt-0.5" : "mt-1.5")}>
          <MoneyWithSmallCents value={item.currentBidEur} className={cn("font-bold", compact ? "text-xs" : "text-lg", useLightText ? "text-slate-100" : "text-slate-900")} />
        </div>
      </div>
    </Link>
  );
}
