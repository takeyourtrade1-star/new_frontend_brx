'use client';

/**
 * Dettaglio asta — light mode (sfondo bianco) come Figma: card bianca, testi scuri, accenti arancioni.
 */

import { useMemo, useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Eye, Package, Settings, Shield, TrendingUp, Users, Bookmark, Crown, Zap, ArrowLeft, Trophy, Check, ChevronDown, Clock, PlusCircle } from 'lucide-react';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { FlagIcon } from '@/components/ui/FlagIcon';
import { auctionDetailPath } from '@/lib/auction/auction-paths';
import { roundMoney, minNextBidEur } from '@/lib/auction/bid-math';
import { AuctionBidModal } from '@/components/feature/aste/AuctionBidModal';
import { AuctionShareButton } from '@/components/feature/aste/AuctionShareButton';
import { AuctionQrButton } from '@/components/feature/aste/AuctionQrButton';
import { AsteNav } from '@/components/feature/aste/AsteNav';
import type { MessageKey } from '@/lib/i18n/messages/en';
import { useAuctionDetail, useAuctionBids, useAuctionList, useAuctionWebSocket } from '@/lib/hooks/use-auctions';
import { apiToAuctionUI, apiBidToBidRow, type AuctionUI, type BidRowUI } from '@/lib/auction/auction-adapter';
import { useAuthStore } from '@/lib/stores/auth-store';
import { MascotteLoader } from '@/components/dev/MascotteLoader';

const PASTEL_GRADIENTS = [
  { gradient: 'from-rose-300/20 via-rose-200/10 to-transparent', border: 'border-rose-300/60', shadow: 'shadow-rose-200/30' },
  { gradient: 'from-sky-300/20 via-sky-200/10 to-transparent', border: 'border-sky-300/60', shadow: 'shadow-sky-200/30' },
  { gradient: 'from-violet-300/20 via-violet-200/10 to-transparent', border: 'border-violet-300/60', shadow: 'shadow-violet-200/30' },
  { gradient: 'from-emerald-300/20 via-emerald-200/10 to-transparent', border: 'border-emerald-300/60', shadow: 'shadow-emerald-200/30' },
  { gradient: 'from-amber-300/20 via-amber-200/10 to-transparent', border: 'border-amber-300/60', shadow: 'shadow-amber-200/30' },
] as const;
const ORANGE = '#FF7300';
const HEADER_OFFSET = 80;

function formatHMS(ms: number): string {
  if (ms <= 0) return '00:00:00';
  const s = Math.floor(ms / 1000);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return [h, m, sec].map((n) => String(n).padStart(2, '0')).join(':');
}

/** Countdown compatto in stile Figma (es. 29 MIN, 22 H, 7 G). */
function formatBannerCountdown(hours: number): string {
  if (hours < 1) return `${Math.max(1, Math.round(hours * 60))} MIN`;
  if (hours < 72) return `${Math.round(hours)} H`;
  return `${Math.round(hours / 24)} G`;
}

function sellerBannerHandle(seller: string): string {
  const raw = (seller.split(/[\s_]+/)[0] ?? seller).replace(/[^a-zA-Z0-9]/g, '');
  if (!raw) return '?';
  return (raw.length <= 5 ? raw : raw.slice(0, 4)).toUpperCase();
}

function sameUserId(a: string | null | undefined, b: string | null | undefined): boolean {
  if (!a || !b) return false;
  return a.trim().toLowerCase() === b.trim().toLowerCase();
}


function useNowTick(): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  return now;
}

function SellerMetaRow({ country, rating, reviews }: { country: string; rating: number; reviews: number }) {
  const stars = Math.min(5, Math.max(0, Math.round((rating / 100) * 5)));
  return (
    <div className="flex flex-wrap items-center gap-2 text-sm text-gray-800">
      <FlagIcon country={country} size="md" />
      <Shield className="h-4 w-4 shrink-0 text-amber-500" aria-hidden />
      <span className="text-amber-500">
        {'★'.repeat(stars)}
        <span className="text-gray-300">{'★'.repeat(5 - stars)}</span>
      </span>
      <span className="text-xs text-gray-500">
        {rating}% · ({reviews})
      </span>
    </div>
  );
}

export function AsteDetailView({ auctionId }: { auctionId: string }) {
  const { t } = useTranslation();
  const numericId = parseInt(auctionId, 10);
  const { data: detailRes, isLoading } = useAuctionDetail(Number.isNaN(numericId) ? 0 : numericId);
  const { data: bidsRes } = useAuctionBids(Number.isNaN(numericId) ? 0 : numericId, { limit: 50 });
  useAuctionWebSocket(Number.isNaN(numericId) ? 0 : numericId);
  const currentUser = useAuthStore((s) => s.user);
  const currentUserId = currentUser?.id ?? null;
  const isAuthenticated = currentUser != null;

  const detail = useMemo(() => {
    if (!detailRes?.data) return null;
    return apiToAuctionUI(detailRes.data, bidsRes?.total ?? 0);
  }, [detailRes, bidsRes]);

  const bidRows: BidRowUI[] = useMemo(
    () =>
      (bidsRes?.data ?? [])
        .map(apiBidToBidRow)
        .sort((a, b) => {
          const timeDiff = new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
          if (timeDiff !== 0) return timeDiff;
          return b.bidId - a.bidId;
        }),
    [bidsRes]
  );

  const now = useNowTick();

  const detailImages = useMemo(
    () => (detail ? [detail.imageFront, detail.imageBack].filter(Boolean) : []),
    [detail]
  );
  const [imgIdx, setImgIdx] = useState(0);
  const [bidModalOpen, setBidModalOpen] = useState(false);
  const [myLastOfferEur, setMyLastOfferEur] = useState<number | null>(null);
  const [myMaxBidEur, setMyMaxBidEur] = useState<number | null>(null);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [showMaxBidRemovedToast, setShowMaxBidRemovedToast] = useState(false);
  const [bidToastAmount, setBidToastAmount] = useState<number | null>(null);
  const [stickyTop, setStickyTop] = useState(HEADER_OFFSET);
  const [asteNavHeight, setAsteNavHeight] = useState(56);
  const [showStickyHeader, setShowStickyHeader] = useState(false);
  const heroTitleRef = useRef<HTMLDivElement>(null);
  const asteNavRef = useRef<HTMLDivElement>(null);
  const [mobileSection, setMobileSection] = useState<string | null>('auction');
  const [bidsExpanded, setBidsExpanded] = useState(false);

  useEffect(() => {
    const header = document.querySelector('header');
    const asteNavEl = asteNavRef.current;
    if (!header) return;
    const measure = () => {
      const headerHeight = header.getBoundingClientRect().height;
      const rawNavHeight = asteNavEl?.getBoundingClientRect().height ?? 56;
      // Keep a stable nav height for trigger math even when mobile nav is temporarily hidden.
      const navHeight = rawNavHeight > 0 ? rawNavHeight : 56;
      setStickyTop(headerHeight);
      setAsteNavHeight(navHeight);
    };
    measure();
    const ro = new ResizeObserver(() => measure());
    ro.observe(header);
    if (asteNavEl) ro.observe(asteNavEl);
    window.addEventListener('resize', measure);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', measure);
    };
  }, []);

  useEffect(() => {
    if (bidToastAmount == null) return;
    const id = window.setTimeout(() => setBidToastAmount(null), 20000);
    return () => window.clearTimeout(id);
  }, [bidToastAmount]);

  useEffect(() => {
    if (!showMaxBidRemovedToast) return;
    const id = window.setTimeout(() => setShowMaxBidRemovedToast(false), 15000);
    return () => window.clearTimeout(id);
  }, [showMaxBidRemovedToast]);

  // Reset sticky header state when auction changes
  useEffect(() => {
    setShowStickyHeader(false);
  }, [numericId]);

  useEffect(() => {
    const titleElement = heroTitleRef.current;
    if (!titleElement) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          setShowStickyHeader(!entry.isIntersecting);
        });
      },
      {
        root: null,
        rootMargin: `-${stickyTop + asteNavHeight + 10}px 0px 0px 0px`,
        threshold: 0,
      }
    );
    observer.observe(titleElement);
    return () => observer.disconnect();
  }, [stickyTop, asteNavHeight, numericId]);

  const { data: similarData } = useAuctionList({ limit: 3 });
  const similarCards = useMemo(() => {
    return (similarData?.data ?? [])
      .filter((a) => a.id !== numericId)
      .slice(0, 3)
      .map((a) => apiToAuctionUI(a));
  }, [similarData, numericId]);

  const myLastOfferFromHistoryEur = useMemo(() => {
    if (!currentUserId) return null;
    const myLatestBid = bidRows.find((b) => sameUserId(b.userId, currentUserId));
    return myLatestBid ? myLatestBid.amountEur : null;
  }, [bidRows, currentUserId]);

  if (isLoading || !detail) {
    return (
      <div className="min-h-screen bg-white">
        <AsteNav />
        <div className="flex min-h-[40vh] items-center justify-center">
          <MascotteLoader size="md" />
        </div>
      </div>
    );
  }

  const isOwner = sameUserId(detail.createdByUserId, currentUserId);
  const isEnded = detail.status === 'ended';
  const showBuyerBid = !isOwner && !isEnded;
  const mobileActionTop = stickyTop + (showStickyHeader ? 0 : asteNavHeight);
  const detailStats = detail as unknown as {
    viewCount?: unknown;
    viewersCount?: unknown;
    watchingNow?: unknown;
    watchersCount?: unknown;
  };
  const statsViewsCountRaw =
    typeof detailStats.viewCount === 'number'
      ? detailStats.viewCount
      : typeof detailStats.viewersCount === 'number'
        ? detailStats.viewersCount
        : 0;
  const statsWatchingCountRaw =
    typeof detailStats.watchingNow === 'number'
      ? detailStats.watchingNow
      : typeof detailStats.watchersCount === 'number'
        ? detailStats.watchersCount
        : 0;
  const statsViewsCount = Math.max(0, Math.round(statsViewsCountRaw));
  const statsWatchingCount = Math.max(0, Math.round(statsWatchingCountRaw));
  const endsAt = detail.endsAt;
  const msLeft = new Date(endsAt).getTime() - now;
  const mainImg = detailImages[imgIdx] ?? detailImages[0] ?? '';
  const reserveMet = detail.reservePrice != null ? detail.currentBidEur >= detail.reservePrice : true;
  const effectiveMyLastOfferEur = myLastOfferEur ?? myLastOfferFromHistoryEur;
  const outcome: 'live' | 'sold' | 'unsold' = isEnded
    ? (reserveMet && detail.bidCount > 0 ? 'sold' : 'unsold')
    : 'live';
  const effectiveCurrentBidEur = detail.currentBidEur;
  const isWinning =
    !isOwner &&
    !isEnded &&
    currentUserId != null &&
    sameUserId(detail.highestBidderId, currentUserId);
  const fmtEur = (n: number) => n.toLocaleString('it-IT', { style: 'currency', currency: 'EUR' });

  return (
    <div className="min-h-screen bg-white font-sans text-gray-900">
      <div 
        ref={asteNavRef} 
        className={`transition-opacity duration-200 ${showStickyHeader ? 'max-lg:pointer-events-none max-lg:opacity-0' : ''}`}
      >
        <AsteNav />
      </div>

      {/* Hero — Priorità al nome prodotto */}
      <section className="w-full border-b border-gray-200 bg-white">
        <div className="container-content container-content-card-detail py-3 sm:py-4 lg:py-5">
          {/* Back link */}
          <Link
            href="/aste"
            className="mb-3 inline-flex items-center gap-1.5 text-xs font-medium text-gray-500 transition hover:text-[#FF7300] sm:text-sm"
          >
            <ArrowLeft className="h-4 w-4" />
            {t('auctions.backToAuctions')}
          </Link>

          {/* Titolo prodotto + azioni */}
          <div ref={heroTitleRef} className="flex flex-col gap-1.5 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex-1">
              {/* Riga Titolo + Azioni Compatte dentro una singola Pill */}
              <div className="flex w-full items-center justify-between gap-3 rounded-[2rem] border border-gray-100/80 bg-gray-50/80 p-1.5 pl-4 shadow-sm backdrop-blur-sm sm:pl-5">
                <h1 className="flex-1 break-words py-1 text-[20px] font-black uppercase leading-[1.1] tracking-tight text-gray-900 sm:text-[24px] md:text-[28px] lg:text-3xl">
                  {detail.title}
                </h1>
                
                {/* Salva per dopo + Condividi (Icon-only compatte a destra) */}
                <div className="flex shrink-0 items-center justify-center gap-1 sm:gap-1.5">
                  {!isOwner && (
                    <button 
                      type="button" 
                      className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-white text-gray-400 shadow-[0_2px_8px_rgba(0,0,0,0.04)] transition hover:text-[#FF7300] hover:shadow-md"
                      aria-label={t('auctions.detailSaveLater')}
                    >
                      <Bookmark className="h-4 w-4" />
                    </button>
                  )}
                  <AuctionQrButton auctionTitle={detail.title} compact />
                  <AuctionShareButton auctionTitle={detail.title} compact />
                </div>
              </div>

              {/* Venditore / Meta & Stats */}
              <div className="mt-2 flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
                {isOwner ? (
                  <p className="inline-flex max-w-fit items-center rounded bg-[#FFF4EC] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#9a3412]">
                    {t('auctions.sellerBanner')}
                  </p>
                ) : (
                  <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-gray-500 sm:text-xs">
                    <span>{t('auctions.detailSoldBy')}: <span className="font-bold text-gray-900">{detail.seller}</span></span>
                    <FlagIcon country={detail.sellerCountry} size="sm" />
                    <span className="text-gray-300">|</span>
                    <div className="flex items-center">
                      <span className="text-[12px] tracking-[0.1em] text-[#FFB800] drop-shadow-[0_1px_1px_rgba(255,184,0,0.5)]">{'★'.repeat(Math.min(5, Math.round((detail.sellerRating / 100) * 5)))}</span>
                      <span className="ml-[2px] font-bold text-gray-700">{detail.sellerRating}%</span>
                    </div>
                  </div>
                )}

                {/* Statistiche visualizzazioni & live */}
                <div className="flex items-center gap-3 text-[11px] sm:text-xs">
                  <div className="flex items-center gap-1.5" title={t('auctions.statsViews', { count: statsViewsCount })}>
                    <Eye className="h-4 w-4 text-gray-400" aria-hidden />
                    <span className="font-bold text-gray-700">{statsViewsCount}</span>
                  </div>
                  <div className="flex items-center gap-1.5 font-bold text-[#FF7300]" title={t('auctions.statsWatching', { count: statsWatchingCount })}>
                    <Users className="h-4 w-4" aria-hidden />
                    <span>{statsWatchingCount} Live</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Fixed Mobile Actions - tre pillole glass (titolo, azioni, watching) */}
      <div
        className={`fixed left-0 right-0 z-50 transition-all duration-200 lg:hidden ${
          showStickyHeader
            ? 'pointer-events-auto translate-y-0 opacity-100'
            : 'pointer-events-none -translate-y-2 opacity-0'
        }`}
        style={{ top: mobileActionTop }}
      >
        <div className="container-content container-content-card-detail py-2">
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0 max-w-[46vw] rounded-full border border-white/45 bg-white/55 px-3 py-2 shadow-[0_10px_24px_rgba(29,49,96,0.15)] ring-1 ring-white/60 backdrop-blur-xl backdrop-saturate-150">
              <h2 className="truncate text-[12px] font-bold uppercase tracking-wide text-[#1D3160]">
                {detail.title}
              </h2>
            </div>
            <div className="flex shrink-0 items-center gap-1.5">
              <div className="flex items-center gap-1.5 rounded-full border border-white/45 bg-white/55 px-1.5 py-1 shadow-[0_10px_24px_rgba(29,49,96,0.15)] ring-1 ring-white/60 backdrop-blur-xl backdrop-saturate-150">
                {!isOwner && (
                  <button
                    type="button"
                    className="inline-flex h-8 w-8 items-center justify-center rounded-full text-gray-600 transition hover:bg-white/70 hover:text-[#FF7300]"
                    aria-label={t('auctions.detailSaveLater')}
                  >
                    <Bookmark className="h-4 w-4" />
                  </button>
                )}
                <AuctionQrButton auctionTitle={detail.title} compact />
                <AuctionShareButton auctionTitle={detail.title} compact />
              </div>
              <Link
                href="/aste/nuova"
                className="flex h-10 items-center gap-1.5 rounded-full border border-white/45 bg-white/55 px-3 shadow-[0_10px_24px_rgba(29,49,96,0.15)] ring-1 ring-white/60 backdrop-blur-xl backdrop-saturate-150"
                aria-label={t('auctions.navCreate')}
              >
                <PlusCircle className="h-4 w-4 text-[#FF7300]" aria-hidden />
              </Link>
            </div>
          </div>
        </div>
      </div>

      <section className="w-full bg-white px-0 py-4 sm:px-6 sm:py-6 lg:px-8">
        <div className="container-content container-content-card-detail">
          {bidToastAmount != null && !isOwner && (
            <div
              className="mb-6 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-950 shadow-sm"
              role="status"
            >
              <p className="font-semibold">
                {t('auctions.bidSuccessToast', {
                  amount: bidToastAmount.toLocaleString('it-IT', { style: 'currency', currency: 'EUR' }),
                })}
              </p>
              <p className="mt-1 text-xs leading-relaxed text-emerald-900">{t('auctions.bidRulesReminder')}</p>
            </div>
          )}

          {showMaxBidRemovedToast && !isOwner && (
            <div
              className="mb-6 rounded-xl border border-orange-200 bg-orange-50 px-4 py-3 text-sm text-orange-950 shadow-sm animate-[fadeInDown_0.4s_ease-out]"
              role="status"
            >
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-[#FF7300]" />
                <p className="font-semibold">{t('auctions.maxBidRemovedToast')}</p>
              </div>
              <p className="mt-1 text-xs text-orange-700">{t('auctions.maxBidRemovedToastBody')}</p>
            </div>
          )}

          {/* Banner Offerta Massima Attiva */}
          {!isOwner && !isEnded && myMaxBidEur != null && (() => {
            const maxBidStillWinning = isWinning && myMaxBidEur >= detail.currentBidEur;
            const maxBidOutbid = !maxBidStillWinning;

            return maxBidOutbid ? (
              <div
                className="mb-6 rounded-xl border-2 border-red-300 bg-gradient-to-r from-red-50 via-rose-50 to-red-50 px-4 py-4 shadow-md shadow-red-500/10 animate-[fadeInDown_0.5s_ease-out]"
                role="status"
              >
                <div className="flex items-start gap-3 sm:items-center">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-500 shadow-lg shadow-red-500/30">
                    <Zap className="h-5 w-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-red-900">
                      {t('auctions.maxBidOutbidBannerTitle')}
                    </p>
                    <p className="mt-0.5 text-sm text-red-700">
                      {t('auctions.maxBidOutbidBannerBody', { amount: fmtEur(myMaxBidEur), currentPrice: fmtEur(detail.currentBidEur) })}
                    </p>
                  </div>
                  <div className="shrink-0 text-right hidden sm:block">
                    <span className="text-[10px] font-semibold uppercase tracking-wide text-red-500 line-through">
                      {fmtEur(myMaxBidEur)}
                    </span>
                    <p className="text-lg font-extrabold text-red-700">
                      {fmtEur(detail.currentBidEur)}
                    </p>
                  </div>
                </div>
                <div className="mt-3 flex items-center gap-2 border-t border-red-200/50 pt-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowCancelConfirm(false);
                      setBidModalOpen(true);
                    }}
                    className="rounded-lg bg-red-600 px-4 py-2 text-xs font-bold uppercase tracking-wide text-white transition hover:bg-red-700"
                  >
                    {t('auctions.maxBidOutbidCta')}
                  </button>
                  <button
                    type="button"
                    onClick={() => { setMyMaxBidEur(null); setShowMaxBidRemovedToast(true); }}
                    className="text-xs font-semibold text-red-500 underline underline-offset-2 transition hover:text-red-700"
                  >
                    {t('auctions.maxBidCancel')}
                  </button>
                </div>
              </div>
            ) : (
              <div
                className="mb-6 rounded-xl border border-amber-300/60 bg-gradient-to-r from-amber-50 via-orange-50 to-amber-50 px-4 py-4 shadow-md shadow-orange-500/10 animate-[fadeInDown_0.5s_ease-out]"
                role="status"
              >
                <div className="flex items-start gap-3 sm:items-center">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#FF7300] shadow-lg shadow-orange-500/30">
                    <Zap className="h-5 w-5 text-white" fill="currentColor" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-bold text-gray-900">
                        {t('auctions.maxBidActiveBannerTitle')}
                      </p>
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-emerald-700">
                        <Crown className="h-3 w-3" />
                        {t('auctions.maxBidWinningBadge')}
                      </span>
                    </div>
                    <p className="mt-0.5 text-sm text-gray-600">
                      {t('auctions.maxBidActiveBannerBody', { amount: fmtEur(myMaxBidEur) })}
                    </p>
                  </div>
                  <div className="shrink-0 text-right hidden sm:block">
                    <span className="text-xs font-medium uppercase tracking-wide text-gray-500">
                      {t('auctions.maxBidAmountLabel')}
                    </span>
                    <p className="text-lg font-bold text-[#FF7300]">
                      {fmtEur(myMaxBidEur)}
                    </p>
                  </div>
                </div>
                <div className="mt-3 flex items-center gap-2 border-t border-amber-200/50 pt-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowCancelConfirm(false);
                      setBidModalOpen(true);
                    }}
                    className="text-xs font-semibold text-gray-600 underline decoration-gray-400 underline-offset-2 transition hover:text-[#FF7300]"
                  >
                    {t('auctions.maxBidEdit')}
                  </button>
                  <span className="text-gray-300">|</span>
                  <button
                    type="button"
                    onClick={() => setShowCancelConfirm(true)}
                    className="text-xs font-semibold text-gray-500 transition hover:text-red-600"
                  >
                    {t('auctions.maxBidCancel')}
                  </button>
                </div>

                {showCancelConfirm && (
                  <div className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 animate-[fadeInDown_0.3s_ease-out]">
                    <p className="text-xs font-medium text-red-800">
                      {t('auctions.maxBidCancelConfirmTitle')}
                    </p>
                    <p className="mt-0.5 text-[11px] text-red-600">
                      {t('auctions.maxBidCancelConfirmBody')}
                    </p>
                    <div className="mt-2 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setMyMaxBidEur(null);
                          setShowCancelConfirm(false);
                          setShowMaxBidRemovedToast(true);
                        }}
                        className="rounded-md bg-red-600 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-white transition hover:bg-red-700"
                      >
                        {t('auctions.maxBidCancelConfirmYes')}
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowCancelConfirm(false)}
                        className="rounded-md border border-red-300 bg-white px-2.5 py-1 text-[10px] font-semibold text-red-700 transition hover:bg-red-50"
                      >
                        {t('auctions.maxBidCancelConfirmNo')}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })()}

          {/* Banner "Stai vincendo" */}
          {isWinning && (
            <div
              className="mb-6 rounded-xl border-2 border-emerald-400 bg-gradient-to-r from-emerald-50 via-green-50 to-emerald-50 px-4 py-4 shadow-lg shadow-emerald-500/10 animate-[fadeInDown_0.5s_ease-out]"
              role="status"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-emerald-500 shadow-lg shadow-emerald-500/30">
                  <Trophy className="h-5 w-5 text-white" aria-hidden />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-base font-extrabold uppercase tracking-wide text-emerald-800 sm:text-lg">
                    {t('auctions.winningBannerTitle')}
                  </p>
                  <p className="mt-0.5 text-sm text-emerald-700">
                    {t('auctions.winningBannerBody', { amount: fmtEur(effectiveCurrentBidEur) })}
                  </p>
                </div>
                <div className="shrink-0 text-right hidden sm:block">
                  <span className="text-[10px] font-semibold uppercase tracking-wide text-emerald-600">
                    {t('auctions.winningBannerLabel')}
                  </span>
                  <p className="text-xl font-extrabold text-emerald-700">
                    {fmtEur(effectiveCurrentBidEur)}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Blocco principale — glass effect container come Best Sellers */}
          <div className="overflow-hidden rounded-2xl border border-gray-200/60 bg-white/80 backdrop-blur-[1px] shadow-[0_4px_24px_rgba(0,0,0,0.06)]">
            <div className="grid gap-6 p-4 sm:gap-8 sm:p-6 lg:grid-cols-12 lg:p-8">
              {/* Galleria */}
              <div className="flex flex-col gap-4 lg:col-span-5">
                {/* Mobile: Unified Price + Timer Card */}
                <div className="lg:hidden">
                  <div className="rounded-2xl border border-gray-200 bg-gradient-to-br from-white via-white to-orange-50/40 p-4 shadow-sm">
                    {isEnded ? (
                      <div className="text-center">
                        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-500">
                          {t('auctions.detailAuctionClosed')}
                        </p>
                        <p className="mt-2 text-2xl font-extrabold text-[#FF7300]">
                          {fmtEur(detail.currentBidEur)}
                        </p>
                        <p className="mt-1.5 text-xs font-medium text-gray-500">
                          {new Date(endsAt).toLocaleString('it-IT', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-start justify-between gap-3">
                          {/* Left: Price */}
                          <div className="min-w-0">
                            <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-500">
                              {t('auctions.currentBid')}
                            </p>
                            <p className="mt-1 text-3xl font-extrabold tracking-tight text-gray-900">
                              {fmtEur(effectiveCurrentBidEur)}
                            </p>
                          </div>
                          {/* Right: Timer */}
                          <div className="shrink-0 text-right">
                            <p className="text-[10px] font-semibold uppercase tracking-wide text-[#FF7300]">
                              {t('auctions.detailClosesIn')}
                            </p>
                            <p
                              className="mt-1 font-mono text-xl font-bold tabular-nums tracking-tight text-gray-900"
                              suppressHydrationWarning
                            >
                              {formatHMS(msLeft)}
                            </p>
                            <p className="text-[10px] font-medium text-gray-400">
                              {t('auctions.detailHoursSuffix')}
                            </p>
                          </div>
                        </div>
                        {/* Meta row */}
                        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-gray-100 pt-2.5 text-xs text-gray-500">
                          <span>{t('auctions.detailFrom')}: <span className="font-semibold text-gray-700">{fmtEur(detail.startingBidEur)}</span></span>
                          <span className="inline-flex items-center gap-1 text-gray-600">
                            <span className="font-semibold text-gray-800">{detail.bidCount}</span> offerte
                          </span>
                          <span className={`text-[11px] font-medium ${reserveMet ? 'text-emerald-600' : 'text-amber-600'}`}>
                            {reserveMet ? t('auctions.detailReserveYes') : t('auctions.detailReserveNo')}
                          </span>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex gap-3 sm:gap-4">
                  <div className="flex w-14 shrink-0 flex-col gap-2 sm:w-[4.5rem]">
                    {detailImages.slice(0, 4).map((src, i) => (
                      <button
                        key={`${src}-${i}`}
                        type="button"
                        onClick={() => setImgIdx(i)}
                        className={`relative aspect-[63/88] w-full overflow-hidden rounded-lg border-2 bg-gray-50 transition ${
                          imgIdx === i ? 'border-[#FF7300] ring-2 ring-[#FF7300]/20' : 'border-gray-200 hover:border-gray-400'
                        }`}
                      >
                        <Image src={src} alt="" fill className="object-cover" sizes="72px" unoptimized />
                      </button>
                    ))}
                  </div>
                  <div className="relative min-h-[300px] flex-1 overflow-hidden rounded-xl border border-gray-200 bg-gray-50 sm:min-h-[380px] lg:min-h-[420px]">
                    <Image
                      src={mainImg}
                      alt=""
                      fill
                      className="object-contain p-3"
                      sizes="(max-width:1024px) 100vw, 420px"
                      priority
                      unoptimized
                    />
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-3 border-t border-gray-100 pt-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
                      <Check className="h-3 w-3" aria-hidden />
                      {t('auctions.excellent')}
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-full border border-sky-200 bg-sky-50 px-2.5 py-1 text-[11px] font-semibold text-sky-700">
                      <Shield className="h-3 w-3" aria-hidden />
                      {t('auctions.certified')}
                    </span>
                  </div>
                  {/* Note: View and live stats moved to hero section */}
                </div>
              </div>

              {/* Info centrale */}
              <div className="flex flex-col gap-5 lg:col-span-4">
                {/* Desktop details list — invariato */}
                <div className="hidden divide-y divide-gray-200 rounded-xl border border-gray-200 bg-white lg:block">
                  <div className="px-4 py-3 text-sm">
                    <span className="text-gray-500">{t('auctions.detailFrom')}: </span>
                    <span className="font-bold text-gray-900">{fmtEur(detail.startingBidEur)}</span>
                  </div>
                  <div className="px-4 py-3 text-sm">
                    <span className="text-gray-500">{t('auctions.detailEnds')}: </span>
                    <span className="font-semibold text-gray-900">
                      {new Date(endsAt).toLocaleString('it-IT', {
                        weekday: 'long',
                        day: 'numeric',
                        month: 'long',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                  {isOwner ? (
                    <div className="space-y-2 px-4 py-3 text-sm">
                      <div className="flex flex-wrap items-baseline justify-between gap-2">
                        <span className="text-gray-500">{t('auctions.sellerReserveLabel')}</span>
                        <span className="text-lg font-bold text-gray-900">{fmtEur(detail.reservePriceEur)}</span>
                      </div>
                      <p className="text-xs font-medium text-amber-900">
                        {reserveMet ? t('auctions.sellerReserveMet') : t('auctions.sellerReserveNotMet')}
                      </p>
                    </div>
                  ) : (
                    <div className="px-4 py-3 text-sm text-amber-800">
                      {reserveMet ? t('auctions.detailReserveYes') : t('auctions.detailReserveNo')}
                    </div>
                  )}
                  <div className="px-4 py-3 text-sm">
                    <span className="text-gray-500">{t('auctions.detailCondition')}: </span>
                    <span className="text-gray-900">{'Verificata'}</span>
                  </div>
                  <div className="px-4 py-3 text-sm leading-relaxed text-gray-700">{detail.description}</div>
                </div>

                {/* Mobile details accordion */}
                <div className="rounded-xl border border-gray-200 bg-white divide-y divide-gray-100 lg:hidden">
                  {/* Section: Dettagli Asta */}
                  <div>
                    <button
                      type="button"
                      onClick={() => setMobileSection(mobileSection === 'auction' ? null : 'auction')}
                      className="flex w-full items-center justify-between px-4 py-3 text-left"
                    >
                      <span className="text-xs font-bold uppercase tracking-wide text-gray-700">
                        {t('auctions.detailEnds').split(':')[0] || 'Dettagli Asta'}
                      </span>
                      <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform duration-200 ${mobileSection === 'auction' ? 'rotate-180' : ''}`} />
                    </button>
                    <div className={`overflow-hidden transition-all duration-300 ${mobileSection === 'auction' ? 'max-h-[300px] opacity-100' : 'max-h-0 opacity-0'}`}>
                      <div className="space-y-2 px-4 pb-3 text-sm">
                        <div className="flex items-baseline justify-between">
                          <span className="text-gray-500">{t('auctions.detailFrom')}</span>
                          <span className="font-bold text-gray-900">{fmtEur(detail.startingBidEur)}</span>
                        </div>
                        <div className="flex items-baseline justify-between">
                          <span className="text-gray-500">{t('auctions.detailEnds')}</span>
                          <span className="font-semibold text-gray-900 text-right text-xs">
                            {new Date(endsAt).toLocaleString('it-IT', {
                              weekday: 'short',
                              day: 'numeric',
                              month: 'short',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                        {isOwner ? (
                          <div className="flex items-baseline justify-between">
                            <span className="text-gray-500">{t('auctions.sellerReserveLabel')}</span>
                            <div className="text-right">
                              <span className="font-bold text-gray-900">{fmtEur(detail.reservePriceEur)}</span>
                              <p className="text-[10px] font-medium text-amber-900">
                                {reserveMet ? t('auctions.sellerReserveMet') : t('auctions.sellerReserveNotMet')}
                              </p>
                            </div>
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </div>

                  {/* Section: Condizione & Descrizione */}
                  <div>
                    <button
                      type="button"
                      onClick={() => setMobileSection(mobileSection === 'condition' ? null : 'condition')}
                      className="flex w-full items-center justify-between px-4 py-3 text-left"
                    >
                      <span className="text-xs font-bold uppercase tracking-wide text-gray-700">
                        {t('auctions.detailCondition')}
                      </span>
                      <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform duration-200 ${mobileSection === 'condition' ? 'rotate-180' : ''}`} />
                    </button>
                    <div className={`overflow-hidden transition-all duration-300 ${mobileSection === 'condition' ? 'max-h-[400px] opacity-100' : 'max-h-0 opacity-0'}`}>
                      <div className="space-y-2.5 px-4 pb-3">
                        <div className="flex items-center gap-2">
                          <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
                            <Check className="h-3 w-3" aria-hidden />
                            {'Verificata'}
                          </span>
                        </div>
                        <p className="text-sm leading-relaxed text-gray-700">{detail.description}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {isOwner && !isEnded && (
                  <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                    <p className="text-xs font-bold uppercase tracking-wide text-gray-500">{t('auctions.sellerStatsTitle')}</p>
                    <div className="mt-3 grid gap-3 sm:grid-cols-2">
                      <div className="flex items-start gap-2 rounded-lg bg-white p-3 shadow-sm">
                        <Users className="mt-0.5 h-4 w-4 shrink-0 text-[#FF7300]" aria-hidden />
                        <div>
                          <p className="text-lg font-bold text-gray-900">{detail.bidCount}</p>
                          <p className="text-[11px] font-medium uppercase tracking-wide text-gray-500">
                            {t('auctions.sellerUniqueBidders')}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2 rounded-lg bg-white p-3 shadow-sm">
                        <TrendingUp className="mt-0.5 h-4 w-4 shrink-0 text-[#FF7300]" aria-hidden />
                        <div>
                          <p className="text-lg font-bold text-gray-900">{bidRows.length}</p>
                          <p className="text-[11px] font-medium uppercase tracking-wide text-gray-500">
                            {t('auctions.sellerBids24h')}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {isOwner && isEnded && outcome === 'sold' && (
                  <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-950">
                    <p className="font-bold">{t('auctions.sellerEndedWonTitle')}</p>
                    <p className="mt-1 text-xs leading-relaxed">
                      {t('auctions.sellerEndedWonBody', {
                        winner: detail.winnerUsername ?? '—',
                        amount: fmtEur(detail.currentBidEur),
                      })}
                    </p>
                  </div>
                )}

                {isOwner && isEnded && outcome === 'unsold' && (
                  <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
                    <p className="font-bold">{t('auctions.sellerEndedUnsoldTitle')}</p>
                    <p className="mt-1 text-xs leading-relaxed">
                      {t('auctions.sellerEndedUnsoldBody', {
                        high: fmtEur(detail.currentBidEur),
                        reserve: fmtEur(detail.reservePriceEur),
                      })}
                    </p>
                  </div>
                )}

                {!isOwner && isEnded && (
                  <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-800">
                    <p className="font-bold uppercase tracking-wide text-gray-600">{t('auctions.buyerAuctionEnded')}</p>
                    <p className="mt-2 font-semibold text-gray-900">
                      {outcome === 'sold'
                        ? t('auctions.buyerEndedSold', { amount: fmtEur(detail.currentBidEur) })
                        : t('auctions.buyerEndedUnsold')}
                    </p>
                  </div>
                )}

                {isOwner && outcome === 'sold' && (
                  <Link
                    href={`/aste/spedizioni?order=${encodeURIComponent(String(detail.numericId))}`}
                    className="flex w-full items-center justify-center gap-2 rounded-full border-2 border-[#FF7300] bg-[#FF7300] py-4 text-center text-base font-bold uppercase tracking-wide text-white shadow-md transition hover:bg-[#e86800]"
                  >
                    <Package className="h-5 w-5 shrink-0" aria-hidden />
                    {t('auctions.sellerShippingCta')}
                  </Link>
                )}

                {isOwner && !isEnded && (
                  <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                    <button
                      type="button"
                      disabled
                      className="inline-flex flex-1 items-center justify-center gap-2 rounded-full border border-gray-300 bg-white py-3 text-sm font-bold uppercase tracking-wide text-gray-500"
                    >
                      <Settings className="h-4 w-4" aria-hidden />
                      {t('auctions.sellerActionEdit')}
                    </button>
                    <Link
                      href="/aste/mie"
                      className="btn-orange-outline-glow inline-flex flex-1 items-center justify-center rounded-full py-3"
                    >
                      {t('auctions.sellerActionManage')}
                    </Link>
                  </div>
                )}

                {showBuyerBid && (
                  <div className="space-y-3 sm:space-y-4">
                    {/* Prezzo attuale (desktop) */}
                    <div className="hidden rounded-xl border border-gray-200 bg-gradient-to-br from-gray-50 to-white p-4 shadow-sm sm:p-5 lg:block">
                      <p className="text-[10px] font-medium uppercase tracking-wide text-gray-500 sm:text-xs">
                        {t('auctions.currentBid')}
                      </p>
                      <p className="mt-1 text-2xl font-bold text-gray-900 sm:text-3xl">
                        {fmtEur(effectiveCurrentBidEur)}
                      </p>
                    </div>

                    {/* Mobile CTA separator */}
                    <div className="border-t-2 border-dashed border-orange-200/60 pt-4 lg:border-0 lg:pt-0">

                      {/* CTA Principale — condizionata all'autenticazione */}
                      {isAuthenticated ? (
                        <button
                          type="button"
                          onClick={() => setBidModalOpen(true)}
                          className="btn-orange-glow group relative w-full overflow-hidden rounded-xl border-2 py-3.5 text-center bg-gradient-to-r from-[#FF8A3D] via-[#FF7300] to-[#E86800] hover:-translate-y-0.5 active:translate-y-0 sm:py-4"
                        >
                          <div className="absolute inset-0 bg-gradient-to-r from-[#FF9A5C] via-[#FF8A3D] to-[#FF7300] opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                          <div className="relative flex items-center justify-between gap-2 px-4 sm:px-6">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-semibold text-white sm:text-base">
                                {t('auctions.bidButtonChoose')}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-base font-extrabold text-white sm:text-lg">
                                {fmtEur(minNextBidEur(effectiveCurrentBidEur))}
                              </span>
                              <svg
                                className="h-4 w-4 text-white transition-transform duration-300 group-hover:translate-x-0.5 sm:h-5 sm:w-5"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                strokeWidth={2.5}
                              >
                                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                              </svg>
                            </div>
                          </div>
                        </button>
                      ) : (
                        <Link
                          href="/login"
                          className="group flex w-full items-center justify-center gap-3 rounded-xl border-2 border-slate-900 bg-slate-900 py-3.5 text-center transition-all duration-200 hover:-translate-y-0.5 hover:bg-slate-800 sm:py-4"
                        >
                          <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
                          </svg>
                          <span className="text-sm font-bold uppercase tracking-wide text-white sm:text-base">
                            Accedi o Registrati per offrire
                          </span>
                        </Link>
                      )}
                    </div>

                    {/* Helper text */}
                    <p className="text-center text-[10px] leading-relaxed text-gray-500 sm:text-[11px]">
                      {t('auctions.bidRulesReminder').split('.')[0]}.
                    </p>
                  </div>
                )}
              </div>

              {/* Timer + cronologia */}
              <div className="flex flex-col gap-5 lg:col-span-3">
                {/* Note: Stats views/watching moved to hero section */}
                {/* Timer Glass Arancio (No Shiny) */}
                <div className="hidden relative flex-col items-center justify-center rounded-2xl border border-[#FF7300]/30 bg-[#FF7300]/10 p-6 backdrop-blur-md shadow-[0_8px_32px_rgba(255,115,0,0.12)] lg:flex overflow-hidden">
                  {/* Subtle inner highlight to enhance the glass effect */}
                  <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-transparent pointer-events-none"></div>

                  {isEnded ? (
                    <div className="relative z-10 flex flex-col items-center text-center">
                      <p className="text-[11px] font-black uppercase tracking-[0.2em] text-orange-800/60">
                        {t('auctions.detailAuctionClosed')}
                      </p>
                      <p className="mt-3 text-[13px] font-semibold text-[#9A3412]">
                        {new Date(endsAt).toLocaleString('it-IT', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                      <p className="mt-2 text-2xl font-black text-[#FF7300]">
                        {t('auctions.finalPriceLabel')}: {fmtEur(detail.currentBidEur)}
                      </p>
                    </div>
                  ) : (
                    <div className="relative z-10 flex flex-col items-center text-center">
                      <p className="text-[11px] font-black uppercase tracking-[0.25em] text-[#FF7300] drop-shadow-sm">
                        {t('auctions.detailClosesIn')}
                      </p>
                      <p
                        className="mt-3 flex items-baseline justify-center gap-1.5 font-mono text-[42px] font-bold tabular-nums tracking-tight text-[#9A3412] leading-none"
                        suppressHydrationWarning
                      >
                        {formatHMS(msLeft)}
                        <span className="text-2xl font-black tracking-widest text-orange-800/80">
                          {t('auctions.detailHoursSuffix').toUpperCase()}
                        </span>
                      </p>
                    </div>
                  )}
                </div>

                {/* Ultime Offerte — Design Premium Slider */}
                <div className="flex flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-[0_2px_20px_rgba(0,0,0,0.04)]">
                  <div className="flex items-center justify-between border-b border-gray-100 bg-gray-50/50 px-6 py-4">
                    <h3 className="text-xs font-black uppercase tracking-[0.15em] text-gray-900">
                      {isOwner ? t('auctions.sellerBidHistoryTitle') : t('auctions.detailBidHistory')}
                    </h3>
                    <span className="flex h-6 items-center justify-center rounded bg-[#1D3160] px-2 text-[11px] font-bold text-white shadow-sm">
                      {bidRows.length} Offerte
                    </span>
                  </div>

                  <div className="max-h-72 overflow-y-auto py-1">
                    {/* Current User's Bid */}
                    {!isOwner && effectiveMyLastOfferEur != null && (
                      <div 
                        className="flex items-center justify-between border-b border-gray-100 bg-gradient-to-r from-orange-50 to-amber-50/50 px-4 py-2.5 animate-[fadeIn_0.4s_ease-out]"
                      >
                        <div className="flex items-center gap-2">
                          <div className="flex h-5 w-5 items-center justify-center rounded-full bg-[#FF7300] text-[10px] text-white">
                            <span>👤</span>
                          </div>
                          <span className="text-sm font-bold text-[#FF7300]">{t('auctions.bidderYou')}</span>
                          <span className="rounded bg-orange-200 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-orange-800">
                            Tu
                          </span>
                        </div>
                        <span className="text-sm font-bold text-[#FF7300]">{fmtEur(effectiveMyLastOfferEur)}</span>
                      </div>
                    )}

                    {/* Bids List */}
                    {(() => {
                      let crownShown = false;
                      const visibleBids = bidsExpanded ? bidRows : bidRows.slice(0, 3);
                      
                      return visibleBids.map((b, i) => {
                        const isLeader = sameUserId(b.userId, detail.highestBidderId);
                        const showCrown = isLeader && !crownShown;
                        if (showCrown) crownShown = true;
                        const isMine = currentUserId != null && sameUserId(b.userId, currentUserId);
                        const bidderCountry = b.countryCode || 'IT';
                        const animationDelay = `${i * 0.05}s`;
                        const bidDate = new Date(b.createdAt);
                        const timeStr = bidDate.toLocaleString('it-IT', {
                          day: '2-digit',
                          month: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit',
                        });

                        return (
                          <div
                            key={b.bidId}
                            style={{ animationDelay }}
                            className={`group flex items-center justify-between px-6 py-3.5 transition-all duration-300 hover:bg-gray-50 animate-[fadeInUp_0.4s_ease-out_both] ${i !== visibleBids.length - 1 ? 'border-b border-gray-50' : ''} ${isMine ? 'border-l-4 border-l-[#FF7300] bg-orange-50/30' : 'border-l-4 border-l-transparent hover:border-l-gray-300'}`}
                          >
                            <div className="flex items-center gap-3 min-w-0 transition-transform duration-300 group-hover:translate-x-1">
                              <div className="shrink-0 overflow-hidden rounded-sm ring-1 ring-black/5">
                                <FlagIcon country={bidderCountry} size="sm" />
                              </div>
                              <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className={`text-[13px] ${isLeader ? 'font-black text-[#1D3160]' : 'font-bold text-gray-700'}`}>
                                    {b.username}
                                  </span>
                                  {isMine && (
                                    <span className="rounded bg-[#FF7300] px-1.5 py-0.5 text-[9px] font-extrabold uppercase tracking-wide text-white shadow-sm">
                                      Tu
                                    </span>
                                  )}
                                  {showCrown && (
                                    <Crown className="h-3.5 w-3.5 shrink-0 text-[#FFB800] drop-shadow-sm" aria-hidden />
                                  )}
                                </div>
                                <span suppressHydrationWarning className="block mt-0.5 text-[10px] tracking-wide text-gray-400">
                                  {timeStr}
                                </span>
                              </div>
                            </div>
                            <span className="shrink-0 text-[15px] font-black text-gray-900 transition-transform duration-300 group-hover:-translate-x-1">
                              {fmtEur(b.amountEur)}
                            </span>
                          </div>
                        );
                      });
                    })()}

                    {/* Expand/Collapse Toggle */}
                    {bidRows.length > 3 && (
                      <button
                        type="button"
                        onClick={() => setBidsExpanded(!bidsExpanded)}
                        className="flex w-full items-center justify-center gap-1.5 border-t border-gray-100 bg-gray-50/50 py-2.5 text-xs font-extrabold uppercase tracking-wide text-gray-500 transition-colors hover:bg-gray-50 hover:text-[#FF7300]"
                      >
                        {bidsExpanded ? 'Vedi meno' : `Vedi tutte (${bidRows.length})`}
                        <ChevronDown className={`h-4 w-4 transition-transform duration-300 ${bidsExpanded ? 'rotate-180' : ''}`} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Oggetti simili — carousel mobile, grid desktop */}
          <div className="mt-10 sm:mt-12">
            <h2 className="mb-5 text-lg font-bold uppercase tracking-wide text-gray-900 sm:text-xl">
              {t('auctions.similarTitle')}
            </h2>

            {/* Mobile: horizontal scroll carousel */}
            <div className="flex gap-4 overflow-x-auto snap-x snap-mandatory pb-3 scrollbar-hide lg:hidden">
              {similarCards.map((a) => {
                const fmtEur = (n: number) =>
                  n.toLocaleString('it-IT', { style: 'currency', currency: 'EUR' });
                const timeLeft = formatBannerCountdown(a.hoursFromNow);
                return (
                  <Link
                    key={a.id}
                    href={auctionDetailPath(a.id)}
                    prefetch
                    scroll
                    className="group w-[220px] shrink-0 snap-start overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-md transition-all duration-300 hover:border-[#FF7300] hover:shadow-lg hover:-translate-y-1"
                  >
                    {/* Immagine verticale */}
                    <div className="relative aspect-[3/4] w-full overflow-hidden bg-gray-50">
                      <Image
                        src={a.image}
                        alt=""
                        fill
                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                        sizes="220px"
                        unoptimized
                      />
                    </div>
                    {/* Info sotto */}
                    <div className="p-3">
                      <p className="line-clamp-2 text-sm font-bold uppercase leading-tight text-gray-900">
                        {a.title}
                      </p>
                      <p className="mt-1 text-[11px] text-gray-500">
                        {a.seller}
                      </p>
                      <div className="mt-2 flex items-center justify-between">
                        <p className="text-base font-extrabold text-[#FF7300]">
                          {fmtEur(a.currentBidEur)}
                        </p>
                        <p className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-gray-500">
                          <span className="inline-block h-1.5 w-1.5 rounded-full bg-orange-500 animate-pulse" />
                          {timeLeft}
                        </p>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>

            {/* Desktop: grid 3 colonne (invariato) */}
            <div className="hidden gap-5 sm:grid-cols-2 lg:grid lg:grid-cols-3">
              {similarCards.map((a) => {
                const fmtEur = (n: number) =>
                  n.toLocaleString('it-IT', { style: 'currency', currency: 'EUR' });
                const timeLeft = formatBannerCountdown(a.hoursFromNow);
                return (
                  <Link
                    key={a.id}
                    href={auctionDetailPath(a.id)}
                    prefetch
                    scroll
                    className="group flex h-[180px] overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-md transition hover:border-[#FF7300] hover:shadow-lg"
                  >
                    <div className="relative h-full w-[45%] shrink-0 overflow-hidden">
                      <Image
                        src={a.image}
                        alt=""
                        fill
                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                        sizes="160px"
                        unoptimized
                      />
                    </div>
                    <div className="flex min-w-0 flex-1 flex-col justify-between p-4">
                      <div>
                        <p className="line-clamp-2 text-sm font-bold uppercase leading-tight text-gray-900">
                          {a.title}
                        </p>
                        <p className="mt-1.5 text-xs text-gray-500">
                          {t('auctions.detailSoldBy')}: <span className="font-medium text-gray-700">{a.seller}</span>
                        </p>
                      </div>
                      <div>
                        <p className="text-lg font-extrabold text-[#FF7300]">
                          {fmtEur(a.currentBidEur)}
                        </p>
                        <p className="mt-1 inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                          <span className="inline-block h-1.5 w-1.5 rounded-full bg-orange-500 animate-pulse" />
                          {timeLeft} {t('auctions.detailHoursSuffix')}
                        </p>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Tabella / scambi */}
          <div className="mt-10 sm:mt-12">
            <h2 className="mb-5 text-lg font-bold uppercase tracking-wide text-gray-900 sm:text-xl">
              {t('auctions.tableExchangeTitle')}
            </h2>
            <div className="space-y-2 lg:space-y-3">
              {similarCards.slice(0, 5).map((row, i) => (
                <div
                  key={row.id}
                  className={`group relative isolate flex h-[80px] overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition-all duration-300 lg:h-[110px] hover:border-primary/40 hover:shadow-sm lg:hover:-translate-y-0.5 lg:hover:${PASTEL_GRADIENTS[i % PASTEL_GRADIENTS.length].border} lg:hover:${PASTEL_GRADIENTS[i % PASTEL_GRADIENTS.length].shadow} lg:hover:shadow-md`}
                >
                  {/* Gradient background on hover — desktop only */}
                  <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100 hidden lg:block">
                    <div className={`absolute inset-0 bg-gradient-to-r ${PASTEL_GRADIENTS[i % PASTEL_GRADIENTS.length].gradient}`} />
                    <div className="absolute inset-y-0 -left-full w-full -skew-x-12 bg-gradient-to-r from-transparent via-white/50 to-transparent transition-all duration-700 ease-out group-hover:left-full" />
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100 animate-pulse" />
                  </div>

                  {/* Immagine */}
                  <div className="relative h-full w-[70px] shrink-0 overflow-hidden lg:w-1/6">
                    <Image
                      src={row.image}
                      alt=""
                      fill
                      className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                      sizes="(max-width: 1024px) 70px, 72px"
                      unoptimized
                    />
                  </div>

                  {/* Info */}
                  <div className="relative z-[1] flex min-w-0 flex-1 items-center justify-between gap-2 p-2.5 lg:flex-col lg:items-start lg:justify-between lg:p-3">
                    <div className="min-w-0">
                      <p className="line-clamp-1 text-xs font-bold uppercase leading-tight text-gray-900 sm:text-sm lg:line-clamp-2">
                        {row.title}
                      </p>
                      <p className="mt-0.5 flex items-center gap-1.5 text-[10px] text-gray-500 lg:mt-1 lg:text-xs">
                        <FlagIcon country={row.sellerCountry} size="xs" />
                        <span className="font-medium text-gray-700">{row.seller}</span>
                        <span className="text-amber-500">★</span>
                        <span className="text-[10px] text-gray-400">{row.sellerRating}%</span>
                      </p>
                    </div>
                    {/* Mobile: Pill CTA | Desktop: underline CTA */}
                    <button
                      type="button"
                      className="shrink-0 rounded-full bg-gray-100 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wide text-primary transition-colors hover:bg-primary hover:text-white lg:self-start lg:rounded-none lg:bg-transparent lg:px-0 lg:py-0 lg:text-[11px] lg:text-gray-800 lg:underline lg:decoration-gray-300 lg:underline-offset-2 lg:hover:bg-transparent lg:hover:text-primary"
                    >
                      {t('auctions.exchangeRequestCta')}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {showBuyerBid && (
        <AuctionBidModal
          open={bidModalOpen}
          onClose={() => setBidModalOpen(false)}
          effectiveCurrentBidEur={effectiveCurrentBidEur}
          estimatedShippingEur={10}
          reserveMet={reserveMet}
          msLeft={msLeft}
          endsAt={new Date(endsAt)}
          myLastOfferEur={myLastOfferEur}
          auctionId={numericId}
          onSubmitOffer={(amountEur) => {
            setMyLastOfferEur(roundMoney(amountEur));
            setBidModalOpen(false);
            setBidToastAmount(roundMoney(amountEur));
          }}
          onSubmitMaxBid={(amountEur) => {
            setMyMaxBidEur(roundMoney(amountEur));
            setBidModalOpen(false);
            setBidToastAmount(roundMoney(amountEur));
          }}
        />
      )}
    </div>
  );
}
