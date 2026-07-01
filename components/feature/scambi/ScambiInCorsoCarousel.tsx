'use client';

import { useRef, useEffect, useState, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, RefreshCcw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { fetchScambiCatalog } from '@/lib/scambi/scambi-catalog';
import type { ScambioUI } from '@/components/feature/scambi/scambi-types';

/* ─────────────────────────────────────────────────────── */
/*  Constants                                              */
/* ─────────────────────────────────────────────────────── */

const CARD_WIDTH = 160;
const CARD_GAP = 10;
const SCROLL_STEP = (CARD_WIDTH + CARD_GAP) * 1.5;
const AUTOPLAY_MS = 6000;
const SWIPE_THRESHOLD = 50;

/* ─────────────────────────────────────────────────────── */
/*  Main Component                                         */
/* ─────────────────────────────────────────────────────── */

export function ScambiInCorsoCarousel({ useLightText = false, compact = false }: { useLightText?: boolean; compact?: boolean } = {}) {
  const { t } = useTranslation();
  const scrollRef = useRef<HTMLDivElement>(null);
  const pauseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const [scambi, setScambi] = useState<ScambioUI[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  /* ── Load scambi catalog ── */
  useEffect(() => {
    let cancelled = false;
    fetchScambiCatalog(12).then((items) => {
      if (!cancelled) {
        setScambi(items);
        setIsLoading(false);
      }
    }).catch(() => {
      if (!cancelled) setIsLoading(false);
    });
    return () => { cancelled = true; };
  }, []);

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

  /* ── Autoplay ── */
  useEffect(() => {
    if (isPaused) return;
    const el = scrollRef.current;
    if (!el || scambi.length < 2) return;

    const id = setInterval(() => {
      const maxScroll = el.scrollWidth - el.clientWidth;
      if (el.scrollLeft < maxScroll - 2) {
        el.scrollBy({ left: CARD_WIDTH + CARD_GAP, behavior: 'smooth' });
      }
    }, AUTOPLAY_MS);

    return () => clearInterval(id);
  }, [isPaused, scambi.length]);

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
        <div className="flex items-center justify-between px-5 py-2.5">
          <div className="flex items-center gap-2">
            <RefreshCcw className={cn('h-4 w-4', useLightText ? 'text-emerald-300' : 'text-emerald-600')} strokeWidth={2.5} />
            <h3 className={cn(
              'text-lg font-black uppercase tracking-wide font-sans',
              useLightText
                ? 'text-slate-100 drop-shadow-[0_1px_1px_rgba(0,0,0,0.42)]'
                : 'text-slate-800'
            )}>
              {t('home.scambi.title')}
            </h3>
          </div>
          <Link
            href="/scambi"
            className="text-xs font-semibold uppercase tracking-wide text-emerald-500 transition-colors hover:text-emerald-400"
          >
            {t('home.scambi.seeAll')}
          </Link>
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
            'absolute left-0 top-0 z-10 flex h-full w-8 items-center justify-center',
            'bg-gradient-to-r from-black/30 to-transparent',
            'opacity-0 transition-opacity duration-300',
            'group-hover/carousel:opacity-100',
            !canScrollLeft && 'pointer-events-none !opacity-0'
          )}
          aria-label={t('home.scambi.scrollLeft')}
        >
          <ChevronLeft className={cn('h-5 w-5 drop-shadow', useLightText ? 'text-slate-100' : 'text-gray-700')} />
        </button>

        {/* Right arrow overlay */}
        <button
          type="button"
          onClick={() => scroll('right')}
          className={cn(
            'absolute right-0 top-0 z-10 flex h-full w-8 items-center justify-center',
            'bg-gradient-to-l from-black/30 to-transparent',
            'opacity-0 transition-opacity duration-300',
            'group-hover/carousel:opacity-100',
            !canScrollRight && 'pointer-events-none !opacity-0'
          )}
          aria-label={t('home.scambi.scrollRight')}
        >
          <ChevronRight className={cn('h-5 w-5 drop-shadow', useLightText ? 'text-slate-100' : 'text-gray-700')} />
        </button>

        {/* Scrollable row */}
        <div
          ref={scrollRef}
          className="flex items-start gap-2 overflow-x-auto px-5 pb-2.5 scrollbar-hide"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {scambi.map((item) => (
            <div key={item.id} className="w-[120px] shrink-0 md:w-[140px]">
              <ScambiCard item={item} useLightText={useLightText} />
            </div>
          ))}

          {isLoading && (
            <>
              <ScambiCardSkeleton useLightText={useLightText} />
              <ScambiCardSkeleton useLightText={useLightText} />
              <ScambiCardSkeleton useLightText={useLightText} />
            </>
          )}

          {!isLoading && scambi.length === 0 && (
            <div className="mx-2 flex min-h-[80px] w-full items-center justify-center rounded-2xl border border-white/20 bg-slate-900/40 px-4 text-xs font-medium text-white/90">
              {t('home.scambi.empty')}
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

function ScambiCardSkeleton({ useLightText = false }: { useLightText?: boolean }) {
  return (
    <div className="flex w-[120px] shrink-0 flex-col gap-1.5 md:w-[140px]" aria-hidden="true">
      <div className={cn("relative aspect-[63/88] w-full overflow-hidden rounded-lg animate-pulse", useLightText ? "bg-slate-800" : "bg-slate-200")} />
      <div className="flex flex-col gap-1 px-0.5">
        <div className={cn("h-3 w-3/4 rounded animate-pulse", useLightText ? "bg-slate-800" : "bg-slate-200")} />
        <div className={cn("h-2.5 w-1/2 rounded animate-pulse", useLightText ? "bg-slate-800" : "bg-slate-200")} />
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────── */
/*  Scambi Card                                            */
/* ─────────────────────────────────────────────────────── */

function ScambiCard({ item, useLightText = false }: { item: ScambioUI; useLightText?: boolean }) {
  const [imageOk, setImageOk] = useState(true);

  return (
    <Link
      href={`/scambi/${item.id}`}
      className="group flex flex-col gap-1.5"
    >
      {/* Immagine */}
      <div className="relative aspect-[63/88] w-full overflow-hidden rounded-lg bg-slate-100 shadow-[0_2px_8px_rgba(0,0,0,0.08)] transition-all duration-300 group-hover:-translate-y-1 group-hover:shadow-[0_6px_16px_rgba(0,0,0,0.12)]">
        {item.image && imageOk ? (
          <Image
            src={item.image}
            alt={item.title}
            fill
            className="object-cover"
            sizes="(min-width: 768px) 140px, 120px"
            unoptimized
            onError={() => setImageOk(false)}
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-slate-200">
            <RefreshCcw className="h-5 w-5 text-slate-400" />
          </div>
        )}

        {/* Sfumatura in alto */}
        <div className="absolute inset-x-0 top-0 h-8 bg-gradient-to-b from-black/50 to-transparent" />

        {/* Badge scambiabile */}
        <div className="absolute left-1.5 top-1.5 flex items-center gap-0.5 rounded-full border border-orange-400/30 bg-black/50 px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wider text-orange-400 backdrop-blur-sm">
          <RefreshCcw className="h-2 w-2" strokeWidth={2.5} />
          Scambia
        </div>
      </div>

      {/* Testo */}
      <div className="flex flex-col px-0.5">
        <p className={cn(
          "line-clamp-1 text-[11px] font-semibold transition-colors group-hover:text-[#ff7300]",
          useLightText ? "text-white" : "text-slate-800"
        )}>
          {item.title}
        </p>
        <p className={cn(
          "mt-0.5 line-clamp-1 text-[9px]",
          useLightText ? "text-slate-300" : "text-slate-500"
        )}>
          {item.seller} · {item.condition}
        </p>
      </div>
    </Link>
  );
}
