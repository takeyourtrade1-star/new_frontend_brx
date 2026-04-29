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
function usePrefetchImages(items: AuctionUI[], containerRef: React.RefObject<HTMLDivElement | null>) {
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const prefetchNextImages = () => {
      const scrollLeft = container.scrollLeft;
      const containerWidth = container.clientWidth;
      const visibleStart = scrollLeft;
      const visibleEnd = scrollLeft + containerWidth;
      
      const cards = container.querySelectorAll('[data-auction-card]');
      cards.forEach((card, index) => {
        const cardLeft = (CARD_WIDTH + CARD_GAP) * index;
        const isVisible = cardLeft >= visibleStart - CARD_WIDTH && cardLeft <= visibleEnd + CARD_WIDTH * 2;
        
        if (isVisible) {
          const img = card.querySelector('img[data-src]') as HTMLImageElement | null;
          if (img?.dataset.src) {
            const prefetchLink = document.createElement('link');
            prefetchLink.rel = 'prefetch';
            prefetchLink.as = 'image';
            prefetchLink.href = img.dataset.src;
            document.head.appendChild(prefetchLink);
            setTimeout(() => prefetchLink.remove(), 5000);
          }
        }
      });
    };

    prefetchNextImages();
    container.addEventListener('scroll', prefetchNextImages, { passive: true });

    return () => {
      container.removeEventListener('scroll', prefetchNextImages);
    };
  }, [items, containerRef]);
}

/* ─────────────────────────────────────────────────────── */
/*  Main Component                                         */
/* ─────────────────────────────────────────────────────── */

export function AsteInCorsoCarousel({ useLightText = false }: { useLightText?: boolean } = {}) {
  const { t, locale } = useTranslation();
  const scrollRef = useRef<HTMLDivElement>(null);
  const pauseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const { data: listData, isLoading } = useAuctionList({ status: 'ACTIVE', limit: 60, offset: 0 });

  const liveAuctions = useMemo(() => {
    const rows = (listData?.data ?? [])
      .map((a) => apiToAuctionUI(a))
      .filter((a) => !isAuctionEndedUI(a));
    return rows.sort((a, b) => a.hoursFromNow - b.hoursFromNow);
  }, [listData]);

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
      <div className="flex items-center px-6 py-3">
        <div className="flex flex-col">
          <h2 className={cn('text-3xl font-black uppercase tracking-wide font-sans text-slate-100 drop-shadow-[0_2px_2px_rgba(0,0,0,0.42)]')}>
            {t('auctions.liveAuctionsTitle')}
          </h2>
          <div className="mt-2 h-1 w-20 rounded-full bg-gradient-to-r from-primary to-[#ff9900]" />
        </div>
      </div>

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
          className="flex items-start gap-3 overflow-x-auto px-6 pb-4 scrollbar-hide"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {auctions.map((item) => {
            const featured = featuredAuctionIds.includes(item.id);
            return (
              <div key={item.id} className="w-[200px] shrink-0 md:w-[240px]">
                <AuctionCard item={item} locale={locale} featured={featured} />
              </div>
            );
          })}

          {isLoading && (
            <>
              <AuctionCardSkeleton />
              <AuctionCardSkeleton />
              <AuctionCardSkeleton />
            </>
          )}

          {!isLoading && auctions.length === 0 && (
            <div className="mx-2 flex min-h-[200px] w-full items-center justify-center rounded-2xl border border-white/20 bg-slate-900/40 px-4 text-sm font-medium text-white/90">
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

function AuctionCardSkeleton() {
  return (
    <div className="flex w-[200px] shrink-0 flex-col gap-3 md:w-[240px]" aria-hidden="true">
      <div className="relative aspect-[2/3] w-full overflow-hidden rounded-2xl bg-slate-200 animate-pulse">
        <div className="absolute left-2.5 top-2.5 flex gap-2">
          <div className="h-5 w-20 rounded-full bg-slate-300/50" />
        </div>
      </div>
      <div className="flex flex-col px-1">
        <div className="h-4 w-3/4 rounded bg-slate-200 animate-pulse" />
        <div className="mt-2.5 flex items-center justify-between">
          <div className="h-5 w-16 rounded bg-slate-200 animate-pulse" />
          <div className="h-5 w-16 rounded-full bg-slate-200 animate-pulse" />
        </div>
      </div>
    </div>
  );
}

type AuctionCardProps = {
  item: AuctionUI;
  locale: string;
  featured?: boolean;
};

function AuctionCard({ item, locale, featured = false }: AuctionCardProps) {
  const { t } = useTranslation();
  const endingSoon = isEndingSoonUI(item.hoursFromNow);
  const countdownLabel = formatCountdown(item.hoursFromNow);

  return (
    <Link
      href={auctionDetailPath(item.id)}
      data-auction-card
      className="group flex flex-col gap-3"
      aria-label={t('auctions.auctionAriaLabel', { title: item.title })}
    >
      {/* Immagine */}
      <div className="relative aspect-[2/3] w-full overflow-hidden rounded-2xl bg-slate-100 shadow-[0_4px_12px_rgba(0,0,0,0.08)] transition-all duration-300 group-hover:-translate-y-1 group-hover:shadow-[0_12px_24px_rgba(0,0,0,0.12)]">
        <Image
          src={item.image}
          alt=""
          fill
          className="object-cover"
          sizes="(min-width: 768px) 240px, 200px"
          unoptimized
          priority={false}
          data-src={item.image}
        />
        
        {/* Sfumatura in alto per rendere leggibili le pillole */}
        <div className="absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-black/60 to-transparent" />

        {/* Pillole in alto in stile Dark Glassmorphism Premium */}
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
      </div>

      {/* Testo (nient'altro che nome, prezzo, tempo rimanente) */}
      <div className="flex flex-col px-1">
        <p className="line-clamp-1 text-sm font-semibold text-slate-800 transition-colors group-hover:text-[#ff7300]">
          {item.title}
        </p>
        <div className="mt-1.5 flex items-center justify-between">
          <p className="text-lg font-bold text-slate-900">
            {item.currentBidEur.toLocaleString(locale, {
              style: 'currency',
              currency: 'EUR',
              maximumFractionDigits: 0,
            })}
          </p>
          <div className="flex items-center gap-1.5 rounded-full bg-slate-200/60 px-2.5 py-1 text-[11px] font-semibold text-slate-700">
            <Clock3 className="h-3 w-3" />
            <span>{countdownLabel}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
