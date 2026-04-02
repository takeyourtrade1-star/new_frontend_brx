'use client';

import { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { auctionDetailPath } from '@/lib/auction/auction-paths';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { MOCK_AUCTIONS, type AuctionMock, isEndingSoon, isAuctionEnded } from './mock-auctions';

/* ─────────────────────────────────────────────────────── */
/*  Constants                                              */
/* ─────────────────────────────────────────────────────── */

const CARD_WIDTH = 170;
const CARD_GAP = 16;
const SCROLL_STEP = (CARD_WIDTH + CARD_GAP) * 1.5;
const AUTOPLAY_MS = 5000;
const ENDING_SOON_H = 48;
const SWIPE_THRESHOLD = 50; // min px for swipe detection
const CARDS_PER_PAGE = 4;

/* Generate additional mock auctions for infinite scroll simulation */
function generateMoreAuctions(startIndex: number, count: number): AuctionMock[] {
  const titles = [
    'Mox Pearl — Alpha', 'Time Walk — Beta', 'Ancestral Recall', 'Tropical Island',
    'Underground Sea', 'Volcanic Island', 'Tundra', 'Badlands', 'Bayou', 'Savannah',
    'Scrubland', 'Taiga', 'Plateau', 'Karplusan Forest', 'Serra Angel — Revised'
  ];
  
  return Array.from({ length: count }, (_, i) => {
    const idx = startIndex + i;
    const seed = `brxscroll${idx}`;
    return {
      id: `scroll-${idx}`,
      title: titles[idx % titles.length] || `Carta Rara #${idx}`,
      image: `https://picsum.photos/seed/${seed}/400/560`,
      hoursFromNow: 24 + (idx * 12) % 336,
      currentBidEur: Math.floor(Math.random() * 500) + 20,
      bidCount: Math.floor(Math.random() * 30) + 1,
      seller: `Seller${idx}`,
      sellerCountry: ['IT', 'US', 'DE', 'FR', 'ES', 'GB'][idx % 6],
      sellerRating: 95 + Math.floor(Math.random() * 5),
      sellerReviewCount: Math.floor(Math.random() * 500) + 10,
      game: ['mtg', 'pokemon', 'lorcana', 'op', 'ygo'][idx % 5] as AuctionMock['game'],
      startingBidEur: Math.floor(Math.random() * 100) + 5,
      reservePriceEur: Math.floor(Math.random() * 400) + 15,
    };
  });
}

/* ─────────────────────────────────────────────────────── */
/*  Image Preloader Hook                                   */
/* ─────────────────────────────────────────────────────── */
function usePrefetchImages(items: typeof MOCK_AUCTIONS, containerRef: React.RefObject<HTMLDivElement | null>) {
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
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const pauseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const [auctions, setAuctions] = useState<AuctionMock[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);

  /* Initial load - get live auctions */
  useEffect(() => {
    const liveAuctions = MOCK_AUCTIONS.filter((a) => !isAuctionEnded(a));
    setAuctions(liveAuctions.slice(0, CARDS_PER_PAGE * 2));
    setPage(2);
  }, []);

  /* Load more auctions simulation */
  const loadMoreAuctions = useCallback(async () => {
    if (isLoading || !hasMore) return;
    setIsLoading(true);
    
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 600));
    
    const newAuctions = generateMoreAuctions(page * CARDS_PER_PAGE, CARDS_PER_PAGE);
    
    if (page > 8) {
      setHasMore(false);
    } else {
      setAuctions((prev) => [...prev, ...newAuctions]);
      setPage((p) => p + 1);
    }
    setIsLoading(false);
  }, [page, isLoading, hasMore]);

  /* Intersection Observer for infinite scroll */
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoading) {
          loadMoreAuctions();
        }
      },
      { threshold: 0.1, rootMargin: '100px' }
    );

    const el = loadMoreRef.current;
    if (el) observer.observe(el);

    return () => {
      if (el) observer.unobserve(el);
    };
  }, [loadMoreAuctions, hasMore, isLoading]);

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
    if (!el || !hasMore) return;

    const id = setInterval(() => {
      const maxScroll = el.scrollWidth - el.clientWidth;
      if (el.scrollLeft < maxScroll - 2) {
        el.scrollBy({ left: CARD_WIDTH + CARD_GAP, behavior: 'smooth' });
      }
    }, AUTOPLAY_MS);

    return () => clearInterval(id);
  }, [isPaused, hasMore]);

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
          <h2 className={cn('text-3xl font-bold uppercase tracking-wider font-display', useLightText ? 'text-slate-100' : 'text-gray-800')}>
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
          className="flex gap-3 overflow-x-auto px-6 pb-3 scrollbar-hide"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {auctions.map((item) => (
            <AuctionCard key={item.id} item={item} locale={locale} />
          ))}
          {/* Loading skeletons - replace simple loader with card placeholders */}
          {isLoading && (
            <>
              <AuctionCardSkeleton />
              <AuctionCardSkeleton />
              <AuctionCardSkeleton />
            </>
          )}
          {/* Invisible load more trigger */}
          <div
            ref={loadMoreRef}
            className="flex w-[1px] shrink-0 opacity-0"
            aria-hidden="true"
          />
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
    <div
      className="relative w-[170px] shrink-0 overflow-hidden rounded-lg aspect-[1/2.4] bg-gray-200"
      aria-hidden="true"
    >
      {/* Image placeholder with shimmer */}
      <div className="absolute inset-0 bg-gradient-to-br from-gray-200 via-gray-300 to-gray-200 animate-pulse" />
      
      {/* Gradient overlay placeholder */}
      <div className="absolute inset-0 bg-gradient-to-t from-gray-400/50 via-gray-300/30 to-transparent" />
      
      {/* Badge placeholder */}
      <div className="absolute right-1.5 top-1.5 z-[1] h-4 w-12 rounded-full bg-gray-300/80 animate-pulse" />
      
      {/* Bottom content placeholders */}
      <div className="absolute inset-x-0 bottom-0 flex flex-col items-center p-2.5 gap-2">
        {/* Title placeholder - 2 lines */}
        <div className="w-full space-y-1">
          <div className="mx-auto h-3 w-[90%] rounded bg-gray-300/80 animate-pulse" />
          <div className="mx-auto h-3 w-[60%] rounded bg-gray-300/80 animate-pulse" />
        </div>
        {/* Price placeholder */}
        <div className="h-3 w-16 rounded bg-primary/30 animate-pulse" />
      </div>
    </div>
  );
}

type AuctionCardProps = {
  item: typeof MOCK_AUCTIONS[number];
  locale: string;
};

function AuctionCard({ item, locale }: AuctionCardProps) {
  const { t } = useTranslation();
  const endingSoon = isEndingSoon(item.hoursFromNow);
  
  return (
    <Link
      href={auctionDetailPath(item.id)}
      data-auction-card
      className="group/card relative w-[170px] shrink-0 overflow-hidden rounded-lg aspect-[1/2.4] transition-transform duration-300 hover:scale-[1.04] focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-offset-2"
      aria-label={t('auctions.auctionAriaLabel', { title: item.title })}
    >
      {/* Background image with prefetch support */}
      <Image
        src={item.image}
        alt=""
        fill
        className="object-cover transition-transform duration-500 group-hover/card:scale-110"
        sizes="170px"
        unoptimized
        priority={false}
        data-src={item.image}
      />

      {/* Gradient overlay */}
      <div
        className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"
        aria-hidden
      />

      {/* Ending soon badge */}
      {endingSoon && (
        <span className="absolute right-1.5 top-1.5 z-[1] rounded-full bg-red-600 px-2 py-0.5 text-[10px] font-bold leading-tight text-white shadow-md">
          {t('auctions.endingSoonBadge')}
        </span>
      )}

      {/* Bottom content */}
      <div className="absolute inset-x-0 bottom-0 flex flex-col items-center p-2.5">
        <p className="text-center text-xs font-bold leading-tight text-white drop-shadow-md line-clamp-2">
          {item.title}
        </p>
        <p className="mt-1 text-[11px] font-semibold text-primary">
          {item.currentBidEur.toLocaleString(locale, {
            style: 'currency',
            currency: 'EUR',
            maximumFractionDigits: 0,
          })}
        </p>
      </div>
    </Link>
  );
}
