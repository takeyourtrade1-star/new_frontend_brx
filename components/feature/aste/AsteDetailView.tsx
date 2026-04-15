'use client';

/**
 * Dettaglio asta — light mode (sfondo bianco) come Figma: card bianca, testi scuri, accenti arancioni.
 */

import { useMemo, useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Eye, Package, Settings, Shield, TrendingUp, Users, Bookmark, Crown, Zap, ArrowLeft, Trophy } from 'lucide-react';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { FlagIcon } from '@/components/ui/FlagIcon';
import { auctionDetailPath } from '@/lib/auction/auction-paths';
import { roundMoney, minNextBidEur } from '@/lib/auction/bid-math';
import { AuctionBidModal } from '@/components/feature/aste/AuctionBidModal';
import { AuctionShareButton } from '@/components/feature/aste/AuctionShareButton';
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

  const detail = useMemo(() => {
    if (!detailRes?.data) return null;
    return apiToAuctionUI(detailRes.data, bidsRes?.total ?? 0);
  }, [detailRes, bidsRes]);

  const bidRows: BidRowUI[] = useMemo(
    () => {
      const all = (bidsRes?.data ?? [])
        .map(apiBidToBidRow)
        .sort((a, b) => {
          const amtDiff = b.amountEur - a.amountEur;
          if (amtDiff !== 0) return amtDiff;
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        });
      const seen = new Set<string>();
      return all.filter((b) => {
        if (seen.has(b.userId)) return false;
        seen.add(b.userId);
        return true;
      });
    },
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

  useEffect(() => {
    const header = document.querySelector('header');
    const asteNavEl = asteNavRef.current;
    if (!header) return;
    const measure = () => {
      const headerHeight = header.getBoundingClientRect().height;
      const navHeight = asteNavEl?.getBoundingClientRect().height ?? 56;
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
  }, [stickyTop, asteNavHeight]);

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
  const endsAt = detail.endsAt;
  const msLeft = new Date(endsAt).getTime() - now;
  const mainImg = detailImages[imgIdx] ?? detailImages[0] ?? '';
  const reserveMet = detail.reservePrice != null ? detail.currentBidEur >= detail.reservePrice : true;
  const effectiveMyLastOfferEur = myLastOfferEur ?? myLastOfferFromHistoryEur;
  const outcome: 'live' | 'sold' | 'unsold' = isEnded
    ? (reserveMet && detail.bidCount > 0 ? 'sold' : 'unsold')
    : 'live';
  const effectiveCurrentBidEur = Math.max(detail.currentBidEur, effectiveMyLastOfferEur ?? 0);
  const isWinning =
    !isOwner &&
    !isEnded &&
    currentUserId != null &&
    sameUserId(detail.highestBidderId, currentUserId);
  const fmtEur = (n: number) => n.toLocaleString('it-IT', { style: 'currency', currency: 'EUR' });

  return (
    <div className="min-h-screen bg-white font-sans text-gray-900">
      <div ref={asteNavRef}>
        <AsteNav />
      </div>

      {/* Hero — Priorità al nome prodotto */}
      <section className="w-full border-b border-gray-200 bg-white">
        <div className="container-content py-3 sm:py-4 lg:py-5">
          {/* Back link */}
          <Link
            href="/aste"
            className="mb-3 inline-flex items-center gap-1.5 text-xs font-medium text-gray-500 transition hover:text-[#FF7300] sm:text-sm"
          >
            <ArrowLeft className="h-4 w-4" />
            {t('auctions.backToAuctions')}
          </Link>

          {/* Titolo prodotto + azioni a destra */}
          <div ref={heroTitleRef} className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
            <div className="flex-1">
              <h1 className="break-words text-2xl font-extrabold uppercase tracking-tight text-gray-900 sm:text-3xl md:text-4xl lg:text-5xl">
                {detail.title}
              </h1>

              {/* Venditore sotto il titolo */}
              <div className="mt-2 flex items-center gap-2 text-sm sm:text-base">
                {isOwner ? (
                  <span className="font-semibold text-[#FF7300]">{t('auctions.sellerYouTitle')}</span>
                ) : (
                  <>
                    <span className="text-gray-500">{t('auctions.detailSoldBy')}:</span>
                    <span className="font-bold text-gray-900">{detail.seller}</span>
                    <FlagIcon country={detail.sellerCountry} size="md" />
                    <Shield className="h-4 w-4 text-amber-500" />
                    <span className="text-amber-500 text-xs">{'★'.repeat(Math.min(5, Math.round((detail.sellerRating / 100) * 5)))}</span>
                    <span className="text-xs text-gray-500">{detail.sellerRating}%</span>
                  </>
                )}
              </div>

              {isOwner && (
                <p className="mt-3 inline-flex flex-wrap items-center gap-2 rounded-lg border border-[#FF7300]/35 bg-[#FFF4EC] px-3 py-2 text-xs font-bold uppercase tracking-wide text-[#9a3412] sm:text-sm">
                  {t('auctions.sellerBanner')}
                </p>
              )}
            </div>

            {/* Salva per dopo + Condividi a destra */}
            <div className="flex items-center gap-4 shrink-0">
              {!isOwner && (
                <button type="button" className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-600 underline decoration-gray-300 hover:text-[#FF7300]">
                  <Bookmark className="h-4 w-4" />
                  {t('auctions.detailSaveLater')}
                </button>
              )}
              <AuctionShareButton auctionTitle={detail.title} />
            </div>
          </div>
        </div>
      </section>

      {/* Sticky Mobile Header - Nome prodotto | Preferiti + Condividi */}
      {showStickyHeader && (
        <div
          className="sticky z-50 border-b border-gray-200 bg-white/95 backdrop-blur-sm shadow-sm lg:hidden animate-[fadeInDown_0.2s_ease-out]"
          style={{ top: stickyTop + asteNavHeight }}
        >
          <div className="container-content py-2">
            <div className="flex items-center gap-2.5">
              <h2 className="min-w-0 flex-1 truncate text-[13px] font-bold uppercase tracking-wide text-gray-900">
                {detail.title}
              </h2>
              <div className="flex shrink-0 items-center gap-1.5 rounded-full border border-zinc-200 bg-white px-1.5 py-1 shadow-sm">
                {!isOwner && (
                  <button
                    type="button"
                    className="inline-flex h-8 w-8 items-center justify-center rounded-full text-gray-500 transition hover:bg-zinc-100 hover:text-[#FF7300]"
                    aria-label={t('auctions.detailSaveLater')}
                  >
                    <Bookmark className="h-4 w-4" />
                  </button>
                )}
                <AuctionShareButton auctionTitle={detail.title} compact />
              </div>
            </div>
          </div>
        </div>
      )}

      <section className="w-full bg-white px-4 py-4 sm:px-6 sm:py-6 lg:px-8">
        <div className="container-content">
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
                <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 pt-3">
                  <div className="flex flex-wrap gap-4 text-xs font-medium text-gray-600">
                    <span className="underline decoration-gray-300 underline-offset-4 hover:text-[#FF7300]">
                      {t('auctions.excellent')}
                    </span>
                    <span className="underline decoration-gray-300 underline-offset-4 hover:text-[#FF7300]">
                      {t('auctions.certified')}
                    </span>
                  </div>
                </div>
              </div>

              {/* Info centrale */}
              <div className="flex flex-col gap-5 lg:col-span-4">
                <div className="divide-y divide-gray-200 rounded-xl border border-gray-200 bg-white">
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
                    {/* Prezzo attuale + CTA bid */}
                    <div className="rounded-xl border border-gray-200 bg-gradient-to-br from-gray-50 to-white p-4 shadow-sm sm:p-5">
                      <p className="text-[10px] font-medium uppercase tracking-wide text-gray-500 sm:text-xs">
                        {t('auctions.currentBid')}
                      </p>
                      <p className="mt-1 text-2xl font-bold text-gray-900 sm:text-3xl">
                        {fmtEur(effectiveCurrentBidEur)}
                      </p>
                    </div>

                    {/* CTA Principale - Scegli Offerta */}
                    <button
                      type="button"
                      onClick={() => setBidModalOpen(true)}
                      className="btn-orange-glow group relative w-full overflow-hidden rounded-xl border-2 py-3.5 text-center bg-gradient-to-r from-[#FF8A3D] via-[#FF7300] to-[#E86800] hover:-translate-y-0.5 active:translate-y-0 sm:py-4"
                    >
                      {/* Animated gradient overlay */}
                      <div className="absolute inset-0 bg-gradient-to-r from-[#FF9A5C] via-[#FF8A3D] to-[#FF7300] opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

                      <div className="relative flex items-center justify-between gap-2 px-4 sm:px-6">
                        {/* Left - Label */}
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold sm:text-base">
                            {t('auctions.bidButtonChoose')}
                          </span>
                        </div>

                        {/* Right - Amount + Arrow */}
                        <div className="flex items-center gap-2">
                          <span className="text-base font-extrabold sm:text-lg">
                            {fmtEur(minNextBidEur(effectiveCurrentBidEur))}
                          </span>
                          <svg
                            className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5 sm:h-5 sm:w-5"
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

                    {/* Helper text */}
                    <p className="text-center text-[10px] leading-relaxed text-gray-500 sm:text-[11px]">
                      {t('auctions.bidRulesReminder').split('.')[0]}.
                    </p>
                  </div>
                )}
              </div>

              {/* Timer + cronologia */}
              <div className="flex flex-col gap-5 lg:col-span-3">
                {/* Stats views/watching — sopra il timer */}
                <div className="flex flex-wrap items-center justify-end gap-x-4 gap-y-1 text-xs text-gray-600 sm:text-sm">
                  <span className="inline-flex items-center gap-1.5">
                    <Eye className="h-4 w-4 text-gray-400" />
                    {t('auctions.statsViews', { count: 0 })}
                  </span>
                  <span className="inline-flex items-center gap-1.5 font-semibold text-[#FF7300]">
                    <Users className="h-4 w-4" />
                    {t('auctions.statsWatching', { count: 0 })}
                  </span>
                </div>

                <div className="rounded-xl border border-gray-200 bg-gray-50 p-5 text-center shadow-inner">
                  {isEnded ? (
                    <>
                      <p className="text-xs font-bold uppercase tracking-[0.25em] text-gray-600">
                        {t('auctions.detailAuctionClosed')}
                      </p>
                      <p className="mt-3 text-sm font-semibold text-gray-800">
                        {new Date(endsAt).toLocaleString('it-IT', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                      <p className="mt-2 text-lg font-bold text-[#FF7300]">
                        {t('auctions.finalPriceLabel')}: {fmtEur(detail.currentBidEur)}
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="text-xs font-bold uppercase tracking-[0.25em] text-[#FF7300]">
                        {t('auctions.detailClosesIn')}
                      </p>
                      <p
                        className="mt-3 flex flex-wrap items-baseline justify-center gap-1 font-mono text-3xl font-bold tabular-nums tracking-tight text-gray-900 sm:text-4xl"
                        suppressHydrationWarning
                      >
                        <span>{formatHMS(msLeft)}</span>
                        <span className="text-2xl font-bold text-gray-900 sm:text-3xl">
                          {' '}
                          {t('auctions.detailHoursSuffix')}
                        </span>
                      </p>
                    </>
                  )}
                </div>

                {/* Ultime Offerte — Minimal con Crown, evidenza You, animazione */}
                <div className="rounded-xl border border-gray-200/60 bg-white/90 shadow-sm">
                  <div className="flex items-center gap-2 border-b border-gray-100 px-4 py-3">
                    <TrendingUp className="h-4 w-4 text-[#FF7300]" aria-hidden />
                    <h3 className="text-xs font-bold uppercase tracking-wider text-gray-600">
                      {isOwner ? t('auctions.sellerBidHistoryTitle') : t('auctions.detailBidHistory')}
                    </h3>
                    <span className="ml-auto rounded-full bg-orange-100 px-2 py-0.5 text-[10px] font-bold text-[#FF7300]">
                      {bidRows.length}
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
                    {bidRows.map((b, i) => {
                      const isLeader = sameUserId(b.userId, detail.highestBidderId);
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
                          key={`${b.userId}-${b.createdAt}-${i}`}
                          style={{ animationDelay }}
                          className={`flex items-center justify-between px-4 py-2.5 animate-[fadeInUp_0.4s_ease-out_both] ${i !== bidRows.length - 1 ? 'border-b border-gray-50' : ''} ${isMine ? 'bg-gradient-to-r from-orange-50/70 to-amber-50/40' : isLeader ? 'bg-gradient-to-r from-amber-50/40 to-orange-50/20' : ''}`}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <FlagIcon country={bidderCountry} size="sm" />
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span className={`text-sm ${isMine ? 'font-bold text-[#FF7300]' : isLeader ? 'font-bold text-gray-900' : 'font-medium text-gray-700'}`}>
                                  {b.username}
                                </span>
                                {isMine && (
                                  <span className="rounded bg-orange-200 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-orange-800">
                                    Tu
                                  </span>
                                )}
                                {isLeader && (
                                  <Crown className="h-3.5 w-3.5 shrink-0 text-amber-500" aria-label="Primo posto" />
                                )}
                              </div>
                              <span suppressHydrationWarning className="block text-[10px] text-gray-400">
                                {timeStr}
                              </span>
                            </div>
                          </div>
                          <span className={`shrink-0 text-sm font-semibold ${isMine ? 'text-[#FF7300]' : isLeader ? 'text-emerald-600' : 'text-gray-600'}`}>
                            {fmtEur(b.amountEur)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Oggetti simili — layout pulito: immagine full-height a sinistra, info a destra */}
          <div className="mt-10 sm:mt-12">
            <h2 className="mb-5 text-lg font-bold uppercase tracking-wide text-gray-900 sm:text-xl">
              {t('auctions.similarTitle')}
            </h2>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
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
                    {/* Immagine — altezza totale, spazio a sinistra */}
                    <div className="relative h-full w-[45%] shrink-0 overflow-hidden">
                      <Image
                        src={a.image}
                        alt=""
                        fill
                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                        sizes="(max-width: 1024px) 45vw, 160px"
                        unoptimized
                      />
                    </div>

                    {/* Info — a destra */}
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

          {/* Tabella / scambi — layout orizzontale: immagine a sinistra, info a destra */}
          <div className="mt-10 sm:mt-12">
            <h2 className="mb-5 text-lg font-bold uppercase tracking-wide text-gray-900 sm:text-xl">
              {t('auctions.tableExchangeTitle')}
            </h2>
            <div className="space-y-3">
              {similarCards.slice(0, 5).map((row, i) => (
                <div
                  key={row.id}
                  className={`group relative isolate flex h-[110px] overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:${PASTEL_GRADIENTS[i % PASTEL_GRADIENTS.length].border} hover:${PASTEL_GRADIENTS[i % PASTEL_GRADIENTS.length].shadow} hover:shadow-md`}
                >
                  {/* Gradient background on hover */}
                  <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                    <div className={`absolute inset-0 bg-gradient-to-r ${PASTEL_GRADIENTS[i % PASTEL_GRADIENTS.length].gradient}`} />
                    {/* Animated shimmer sweep */}
                    <div className="absolute inset-y-0 -left-full w-full -skew-x-12 bg-gradient-to-r from-transparent via-white/50 to-transparent transition-all duration-700 ease-out group-hover:left-full" />
                    {/* Secondary subtle pulse */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100 animate-pulse" />
                  </div>

                  {/* Immagine — altezza totale, spazio a sinistra */}
                  <div className="relative h-full w-1/6 shrink-0 overflow-hidden">
                    <Image
                      src={row.image}
                      alt=""
                      fill
                      className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                      sizes="(max-width: 1024px) 16vw, 72px"
                      unoptimized
                    />
                  </div>

                  {/* Info — a destra */}
                  <div className="relative z-[1] flex min-w-0 flex-1 flex-col justify-between p-3">
                    <div>
                      <p className="line-clamp-2 text-xs font-bold uppercase leading-tight text-gray-900 sm:text-sm">
                        {row.title}
                      </p>
                      <p className="mt-1 flex items-center gap-1.5 text-[11px] text-gray-500 sm:text-xs">
                        <FlagIcon country={row.sellerCountry} size="xs" />
                        <span className="font-medium text-gray-700">{row.seller}</span>
                        <span className="text-amber-500">★</span>
                        <span className="text-[10px] text-gray-400">{row.sellerRating}%</span>
                      </p>
                    </div>
                    <button
                      type="button"
                      className="self-start text-[11px] font-bold uppercase tracking-wide text-gray-800 underline decoration-gray-300 underline-offset-2 hover:text-primary sm:text-xs"
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
