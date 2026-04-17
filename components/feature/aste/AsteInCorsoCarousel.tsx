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
              <div key={item.id} className="w-[186px] shrink-0 md:w-[210px]">
                <AuctionCard item={item} locale={locale} featured={featured} />
                <AuctionCardMeta item={item} locale={locale} featured={featured} />
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
    <div className="w-[186px] shrink-0 md:w-[210px]" aria-hidden="true">
      <div className="relative overflow-hidden rounded-2xl border border-white/20 aspect-[1/1.95] bg-slate-800/40">
        {/* Image placeholder with shimmer */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-700 via-slate-600 to-slate-700 animate-pulse" />

        {/* Gradient overlay placeholder */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/70 via-slate-900/20 to-transparent" />

        {/* Top chips placeholder */}
        <div className="absolute left-2 right-2 top-2 z-[1] flex flex-wrap gap-1.5">
          <div className="h-4 w-14 rounded-full bg-slate-300/30 animate-pulse" />
          <div className="h-4 w-10 rounded-full bg-slate-300/30 animate-pulse" />
          <div className="h-4 w-12 rounded-full bg-slate-300/30 animate-pulse" />
        </div>

        {/* Timer badge placeholder */}
        <div className="absolute inset-x-2 bottom-2 z-[1] h-9 rounded-xl border border-slate-200/20 bg-slate-300/25 px-2">
          <div className="mt-[9px] flex items-center justify-between gap-2">
            <div className="h-4 w-4 rounded-md bg-slate-200/45 animate-pulse" />
            <div className="h-3 w-12 rounded bg-slate-200/45 animate-pulse" />
            <div className="h-4 w-11 rounded-md bg-slate-200/45 animate-pulse" />
          </div>
        </div>
      </div>

      <div className="relative mt-2 overflow-hidden rounded-2xl border border-white/55 bg-[linear-gradient(160deg,rgba(255,255,255,0.88),rgba(243,248,255,0.68)_56%,rgba(224,233,247,0.5))] px-3 py-3 shadow-[0_10px_22px_rgba(15,23,42,0.18)]">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-10 bg-gradient-to-b from-white/45 to-transparent" />
        <div className="w-full space-y-1.5">
          <div className="h-3 w-[96%] rounded bg-slate-300/45 animate-pulse" />
          <div className="h-3 w-[70%] rounded bg-slate-300/35 animate-pulse" />
        </div>
        <div className="mt-2 flex items-center justify-between">
          <div className="h-4 w-14 rounded bg-orange-300/45 animate-pulse" />
          <div className="h-4 w-12 rounded-full bg-slate-300/40 animate-pulse" />
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
  const roundedHoursLeft = Math.max(1, Math.round(item.hoursFromNow));
  const timeLeftLabel = roundedHoursLeft >= 24 ? `${Math.ceil(roundedHoursLeft / 24)}g` : `${roundedHoursLeft}h`;
  const countdownLabel = formatCountdown(item.hoursFromNow);
  const gameLabel =
    item.game === 'mtg'
      ? 'MTG'
      : item.game === 'pokemon'
        ? 'Pokemon'
        : item.game === 'op'
          ? 'One Piece'
          : item.game === 'ygo'
            ? 'Yu-Gi-Oh'
            : item.game === 'lorcana'
              ? 'Lorcana'
              : String(item.game).toUpperCase();

  const topPillBaseClass =
    'inline-flex h-5 items-center justify-center rounded-full border px-2.5 text-[9px] font-black uppercase tracking-[0.08em] backdrop-blur-md shadow-[0_3px_10px_rgba(15,23,42,0.25)]';

  const gameChipClass = cn(
    topPillBaseClass,
    item.game === 'mtg' && 'border-blue-200/65 bg-blue-500/35 text-blue-50',
    item.game === 'pokemon' && 'border-amber-200/65 bg-amber-500/35 text-amber-50',
    item.game === 'op' && 'border-rose-200/65 bg-rose-500/35 text-rose-50',
    item.game === 'ygo' && 'border-violet-200/65 bg-violet-500/35 text-violet-50',
    item.game === 'lorcana' && 'border-cyan-200/65 bg-cyan-500/35 text-cyan-50'
  );
  
  return (
    <Link
      href={auctionDetailPath(item.id)}
      data-auction-card
      className="group/card relative block overflow-hidden rounded-2xl border border-white/20 aspect-[1/1.95] bg-slate-950/35 shadow-[0_8px_24px_rgba(15,23,42,0.24)] transition-all duration-500 hover:-translate-y-1 hover:border-white/35 hover:shadow-[0_14px_36px_rgba(15,23,42,0.34)] focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-offset-2"
      aria-label={t('auctions.auctionAriaLabel', { title: item.title })}
    >
      {/* Background image with prefetch support */}
      <Image
        src={item.image}
        alt=""
        fill
        className="object-cover saturate-[1.08]"
        sizes="(min-width: 768px) 210px, 186px"
        unoptimized
        priority={false}
        data-src={item.image}
      />

      {/* Layered overlays for cinematic contrast */}
      <div className="absolute inset-0 bg-gradient-to-b from-slate-950/20 via-slate-900/8 to-slate-950/10" aria-hidden />
      <div className="absolute inset-0 bg-gradient-to-t from-black/88 via-black/28 to-transparent" aria-hidden />
      <div className="absolute inset-0 bg-gradient-to-br from-orange-300/10 via-transparent to-cyan-300/10" aria-hidden />
      <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover/card:opacity-100" aria-hidden>
        <div className="h-full w-full bg-[linear-gradient(120deg,transparent_20%,rgba(255,255,255,0.13)_50%,transparent_80%)] bg-[length:200%_100%] animate-[flowBeam_2.6s_linear_infinite]" />
      </div>

      {/* Top meta pills */}
      <div className="absolute left-2 right-2 top-2 z-[2]">
        <div className="flex flex-wrap items-start gap-1.5">
          {featured && (
            <span className={cn(topPillBaseClass, 'border-amber-200/75 bg-amber-500/45 text-amber-50')}>
              In evidenza
            </span>
          )}
          <span className={gameChipClass}>{gameLabel}</span>
          {endingSoon ? (
            <span className={cn(topPillBaseClass, 'border-red-200/75 bg-red-500/80 text-white')}>
              {t('auctions.endingSoonBadge')}
            </span>
          ) : (
            <span className={cn(topPillBaseClass, 'border-white/45 bg-black/45 text-white/95')}>
              {timeLeftLabel}
            </span>
          )}
        </div>
      </div>

      {/* Prominent expiration timer */}
      <div className="absolute inset-x-2 bottom-2 z-[2]">
        <div
          className={cn(
            'flex h-9 items-center rounded-xl border pl-1.5 pr-2 shadow-[0_10px_22px_rgba(2,6,23,0.48)] ring-1 ring-black/20 backdrop-blur-md',
            endingSoon
              ? 'border-red-200/80 bg-[linear-gradient(135deg,rgba(239,68,68,0.96),rgba(185,28,28,0.93))] text-white'
              : 'border-cyan-100/35 bg-[linear-gradient(135deg,rgba(15,23,42,0.92),rgba(30,41,59,0.9))] text-slate-50'
          )}
        >
          <span
            className={cn(
              'inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md border shadow-[0_3px_8px_rgba(0,0,0,0.25)]',
              endingSoon ? 'border-white/45 bg-white/18' : 'border-cyan-100/35 bg-cyan-300/18'
            )}
          >
            <Clock3 className="h-3.5 w-3.5" />
          </span>
          <div className="ml-2 flex min-w-0 flex-col leading-none">
            <span className="text-[8px] font-bold uppercase tracking-[0.11em] text-white/78">Scadenza</span>
            <span className="text-[11px] font-black uppercase tracking-[0.07em] text-white">Scade tra</span>
          </div>
          <span
            className={cn(
              'ml-auto rounded-md border px-2 py-1 text-[12px] font-black tracking-[0.08em] tabular-nums',
              endingSoon ? 'border-white/40 bg-white/16 text-white' : 'border-cyan-100/35 bg-black/28 text-cyan-50'
            )}
          >
            {countdownLabel}
          </span>
        </div>
      </div>
    </Link>
  );
}

function AuctionCardMeta({ item, locale, featured = false }: AuctionCardProps) {
  return (
    <Link
      href={auctionDetailPath(item.id)}
      className={cn(
        'relative mt-2 block overflow-hidden rounded-2xl border px-3 py-3 backdrop-blur-[10px] shadow-[0_10px_22px_rgba(15,23,42,0.18)] transition-all duration-300 hover:-translate-y-0.5',
        featured
          ? 'border-amber-300/55 bg-[linear-gradient(160deg,rgba(255,247,220,0.94),rgba(255,233,190,0.72)_60%,rgba(255,206,127,0.5))] hover:border-amber-300/75'
          : 'border-white/55 bg-[linear-gradient(160deg,rgba(255,255,255,0.9),rgba(243,248,255,0.7)_56%,rgba(224,233,247,0.52))] hover:border-white/75'
      )}
      aria-label={`Dettagli asta ${item.title}`}
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-10 bg-gradient-to-b from-white/50 to-transparent" />
      <p className="line-clamp-2 text-[13px] font-extrabold leading-tight text-slate-900">
        {item.title}
      </p>
      <div className="mt-2 flex items-end justify-between gap-2">
        <p className="text-[14px] font-black tracking-tight text-[#FF8A00]">
          {item.currentBidEur.toLocaleString(locale, {
            style: 'currency',
            currency: 'EUR',
            maximumFractionDigits: 0,
          })}
        </p>
        <span className="inline-flex min-w-[86px] items-center justify-center rounded-full border border-slate-500/45 bg-white/62 px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-[0.07em] text-slate-700">
          {item.bidCount} offerte
        </span>
      </div>
    </Link>
  );
}
