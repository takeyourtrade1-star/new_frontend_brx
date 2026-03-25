'use client';

/**
 * Dettaglio asta — light mode (sfondo bianco) come Figma: card bianca, testi scuri, accenti arancioni.
 */

import { useMemo, useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Eye, Package, Settings, Shield, TrendingUp, Users } from 'lucide-react';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { countryFlagEmoji } from '@/lib/auction/country-flag';
import { auctionDetailPath } from '@/lib/auction/auction-paths';
import { roundMoney } from '@/lib/auction/bid-math';
import { AuctionBidModal } from '@/components/feature/aste/AuctionBidModal';
import { AuctionShareButton } from '@/components/feature/aste/AuctionShareButton';
import {
  getAuctionDetailMock,
  SIMILAR_MOCK_IDS,
  SIMILAR_CARD_LAYOUTS,
  SIMILAR_RESERVE_STATUS,
  type SimilarCardBanner,
  type SimilarReserveStatus,
} from '@/components/feature/aste/mock-auction-detail';
import type { MessageKey } from '@/lib/i18n/messages/en';
import { MOCK_AUCTIONS, type AuctionMock } from '@/components/feature/aste/mock-auctions';
import { isMyAuctionListing } from '@/components/feature/aste/mock-user-auctions';

const ORANGE = '#FF7300';

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

const TITLE_ACCENT: Record<SimilarCardBanner['titleAccent'], string> = {
  red: 'text-red-600',
  orange: 'text-orange-500',
  sky: 'text-sky-600',
};

const RESERVE_MSG: Record<SimilarReserveStatus, MessageKey> = {
  none: 'auctions.similarReserveNone',
  not_met: 'auctions.similarReserveNotMet',
  met: 'auctions.similarReserveMet',
};

function reserveRowClass(status: SimilarReserveStatus): string {
  if (status === 'met') return 'text-emerald-800';
  if (status === 'not_met') return 'text-amber-800';
  return 'text-gray-600';
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
      <span className="text-lg leading-none" aria-hidden>
        {countryFlagEmoji(country)}
      </span>
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
  const detail = useMemo(() => getAuctionDetailMock(auctionId), [auctionId]);
  const isOwner = isMyAuctionListing(auctionId);
  const isEnded = detail.outcome !== 'live';
  const showBuyerBid = !isOwner && !isEnded;
  const now = useNowTick();
  const pageLoadMs = useState(() => Date.now())[0];
  const endsAt = useMemo(
    () => new Date(pageLoadMs + detail.hoursFromNow * 3600000).toISOString(),
    [pageLoadMs, detail.hoursFromNow]
  );
  const msLeft = useMemo(() => new Date(endsAt).getTime() - now, [endsAt, now]);
  const [imgIdx, setImgIdx] = useState(0);
  const [bidModalOpen, setBidModalOpen] = useState(false);
  const [myLastOfferEur, setMyLastOfferEur] = useState<number | null>(null);
  const [bidToastAmount, setBidToastAmount] = useState<number | null>(null);
  const mainImg = detail.images[imgIdx] ?? detail.images[0];

  useEffect(() => {
    if (bidToastAmount == null) return;
    const id = window.setTimeout(() => setBidToastAmount(null), 12000);
    return () => window.clearTimeout(id);
  }, [bidToastAmount]);

  const effectiveCurrentBidEur = Math.max(detail.currentBidEur, myLastOfferEur ?? 0);

  const fmtEur = (n: number) => n.toLocaleString('it-IT', { style: 'currency', currency: 'EUR' });

  const similarCards = useMemo(() => {
    return SIMILAR_MOCK_IDS.map((id, i) => {
      const auction = MOCK_AUCTIONS.find((a) => a.id === id);
      const layout = SIMILAR_CARD_LAYOUTS[i];
      const reserveStatus = SIMILAR_RESERVE_STATUS[i];
      if (!auction || !layout || reserveStatus == null) return null;
      return { auction, layout, reserveStatus };
    }).filter(
      (x): x is { auction: AuctionMock; layout: SimilarCardBanner; reserveStatus: SimilarReserveStatus } =>
        x !== null
    );
  }, []);

  const tradeRows = useMemo(
    () =>
      MOCK_AUCTIONS.slice(0, 3).map((a) => ({
        seller: a.seller,
        country: a.sellerCountry,
        title: a.title,
        image: a.image,
        rating: a.sellerRating,
      })),
    []
  );

  return (
    <div className="min-h-screen bg-white font-sans text-gray-900">
      {/* Breadcrumb + titolo — come dettaglio carta, sfondo bianco */}
      <section className="w-full border-b border-gray-200 bg-white">
        <div className="container-content py-2 sm:py-3 lg:py-4">
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
            <nav className="min-w-0 text-xs font-medium text-gray-600 sm:text-sm" aria-label="Breadcrumb">
              <Link href="/" className="hover:text-gray-900 hover:underline">
                {t('auctions.breadcrumbHome')}
              </Link>
              <span className="mx-1 text-gray-400">/</span>
              <Link href="/aste" className="hover:text-gray-900 hover:underline">
                {t('auctions.detailBreadcrumb')}
              </Link>
              <span className="mx-1 text-gray-400">/</span>
              <span className="break-words font-semibold text-gray-900">{detail.title.toUpperCase()}</span>
            </nav>
            <Link href="#" className="shrink-0 text-xs font-medium text-gray-500 hover:text-[#FF7300] sm:text-sm">
              {t('auctions.needHelp')}
            </Link>
          </div>
          <h1 className="break-words text-xl font-bold uppercase tracking-tight text-gray-900 sm:text-2xl md:text-3xl lg:text-4xl">
            {detail.title}
          </h1>
          <p className="mt-1 break-words text-sm font-bold uppercase tracking-wide text-[#FF7300] sm:text-base">
            {detail.subtitle}
          </p>
          {isOwner && (
            <p className="mt-3 inline-flex flex-wrap items-center gap-2 rounded-lg border border-[#FF7300]/35 bg-[#FFF4EC] px-3 py-2 text-xs font-bold uppercase tracking-wide text-[#9a3412] sm:text-sm">
              {t('auctions.sellerBanner')}
            </p>
          )}
          <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-gray-600 sm:text-sm">
            <span className="inline-flex items-center gap-1.5">
              <Eye className="h-4 w-4 text-gray-400" aria-hidden />
              {t('auctions.statsViews', { count: detail.viewCount })}
            </span>
            <span className="inline-flex items-center gap-1.5 font-semibold text-[#FF7300]">
              <Users className="h-4 w-4" aria-hidden />
              {t('auctions.statsWatching', { count: detail.watchingNow })}
            </span>
          </div>
        </div>
      </section>

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
          {/* Blocco principale — card bianca Figma */}
          <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-[0_4px_24px_rgba(0,0,0,0.06)]">
            <div className="grid gap-6 p-4 sm:gap-8 sm:p-6 lg:grid-cols-12 lg:p-8">
              {/* Galleria */}
              <div className="flex flex-col gap-4 lg:col-span-5">
                <div className="flex gap-3 sm:gap-4">
                  <div className="flex w-14 shrink-0 flex-col gap-2 sm:w-[4.5rem]">
                    {detail.images.slice(0, 4).map((src, i) => (
                      <button
                        key={src}
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
                  <AuctionShareButton auctionTitle={detail.title} />
                </div>
              </div>

              {/* Info centrale */}
              <div className="flex flex-col gap-5 lg:col-span-4">
                <div>
                  {isOwner ? (
                    <p className="text-base">
                      <span className="font-semibold text-[#FF7300]">{t('auctions.sellerYouTitle')}</span>
                    </p>
                  ) : (
                    <p className="text-base">
                      <span className="font-semibold text-[#FF7300]">{t('auctions.detailSoldBy')}: </span>
                      <span className="font-bold text-gray-900">{detail.seller}</span>
                    </p>
                  )}
                  <div className="mt-2">
                    <SellerMetaRow
                      country={detail.sellerCountry}
                      rating={detail.sellerRating}
                      reviews={detail.sellerReviewCount}
                    />
                  </div>
                </div>

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
                        {detail.reserveMet ? t('auctions.sellerReserveMet') : t('auctions.sellerReserveNotMet')}
                      </p>
                    </div>
                  ) : (
                    <div className="px-4 py-3 text-sm text-amber-800">
                      {detail.reserveMet ? t('auctions.detailReserveYes') : t('auctions.detailReserveNo')}
                    </div>
                  )}
                  <div className="px-4 py-3 text-sm">
                    <span className="text-gray-500">{t('auctions.detailCondition')}: </span>
                    <span className="text-gray-900">{detail.conditionLabel}</span>
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
                          <p className="text-lg font-bold text-gray-900">{detail.uniqueBidders}</p>
                          <p className="text-[11px] font-medium uppercase tracking-wide text-gray-500">
                            {t('auctions.sellerUniqueBidders')}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2 rounded-lg bg-white p-3 shadow-sm">
                        <TrendingUp className="mt-0.5 h-4 w-4 shrink-0 text-[#FF7300]" aria-hidden />
                        <div>
                          <p className="text-lg font-bold text-gray-900">{detail.recentBids24h}</p>
                          <p className="text-[11px] font-medium uppercase tracking-wide text-gray-500">
                            {t('auctions.sellerBids24h')}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {isOwner && isEnded && detail.outcome === 'sold' && (
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

                {isOwner && isEnded && detail.outcome === 'unsold' && (
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
                      {detail.outcome === 'sold'
                        ? t('auctions.buyerEndedSold', { amount: fmtEur(detail.currentBidEur) })
                        : t('auctions.buyerEndedUnsold')}
                    </p>
                  </div>
                )}

                {isOwner && detail.outcome === 'sold' && detail.shippingOrderId && (
                  <Link
                    href={`/aste/spedizioni?order=${encodeURIComponent(detail.shippingOrderId)}`}
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
                      className="inline-flex flex-1 items-center justify-center rounded-full border border-[#FF7300] bg-white py-3 text-sm font-bold uppercase tracking-wide text-[#FF7300] transition hover:bg-orange-50"
                    >
                      {t('auctions.sellerActionManage')}
                    </Link>
                  </div>
                )}

                {showBuyerBid && (
                  <button
                    type="button"
                    onClick={() => setBidModalOpen(true)}
                    className="w-full rounded-full py-4 text-center text-base font-bold uppercase tracking-wide text-white shadow-md transition hover:brightness-105"
                    style={{ backgroundColor: ORANGE }}
                  >
                    {t('auctions.detailPlaceBid')}
                  </button>
                )}
                {!isOwner && (
                  <div className="flex flex-wrap gap-6 text-sm">
                    <button type="button" className="font-medium text-gray-600 underline decoration-gray-300 hover:text-[#FF7300]">
                      {t('auctions.detailAddCart')}
                    </button>
                    <button type="button" className="font-medium text-gray-600 underline decoration-gray-300 hover:text-[#FF7300]">
                      {t('auctions.detailSaveLater')}
                    </button>
                  </div>
                )}
              </div>

              {/* Timer + cronologia */}
              <div className="flex flex-col gap-5 lg:col-span-3">
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

                <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                  <p className="mb-3 border-b border-gray-100 pb-2 text-xs font-bold uppercase tracking-wide text-gray-500">
                    {isOwner ? t('auctions.sellerBidHistoryTitle') : t('auctions.detailBidHistory')}
                  </p>
                  <ul className="max-h-56 space-y-0 overflow-y-auto text-sm">
                    {!isOwner && myLastOfferEur != null && (
                      <li className="flex flex-col gap-0.5 border-b border-orange-200 bg-orange-50/90 py-2.5 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <span className="font-semibold text-gray-900">{t('auctions.bidderYou')}</span>
                          <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#c2410c]">
                            {t('auctions.myLastOfferBadge')}
                          </p>
                        </div>
                        <span className="text-xs text-gray-600 sm:text-right">
                          <span className="uppercase tracking-wide text-gray-400">{t('auctions.detailBidProposed')} </span>
                          <span className="text-base font-bold text-[#FF7300]">{fmtEur(myLastOfferEur)}</span>
                        </span>
                      </li>
                    )}
                    {detail.bids.map((b, i) => (
                      <li
                        key={`${b.username}-${i}`}
                        className="flex flex-col gap-0.5 border-b border-gray-100 py-2.5 last:border-0 sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div>
                          <span className="font-semibold text-gray-900">{b.username}</span>
                          {isOwner && b.atLabel && (
                            <p className="text-[10px] font-medium uppercase tracking-wide text-gray-400">{b.atLabel}</p>
                          )}
                        </div>
                        <span className="text-xs text-gray-600 sm:text-right">
                          <span className="uppercase tracking-wide text-gray-400">{t('auctions.detailBidProposed')} </span>
                          <span className="text-base font-bold text-[#FF7300]">{fmtEur(b.amountEur)}</span>
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Oggetti simili — layout Figma: header gradient + avatar, corpo 2 colonne, CTA */}
          <div className="mt-10 sm:mt-12">
            <h2 className="mb-5 text-lg font-bold uppercase tracking-wide text-gray-900 sm:text-xl">
              {t('auctions.similarTitle')}
            </h2>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {similarCards.map(({ auction: a, layout, reserveStatus }) => {
                const handle = sellerBannerHandle(a.seller);
                const initial = handle.charAt(0) || '?';
                const bannerTime =
                  layout.bannerMode === 'starts' && layout.startsInMinutes != null
                    ? `${layout.startsInMinutes} MIN`
                    : formatBannerCountdown(a.hoursFromNow);
                const bannerLabel =
                  layout.bannerMode === 'starts'
                    ? t('auctions.similarBannerStarts', { time: bannerTime })
                    : t('auctions.similarBannerEnds', { time: bannerTime });
                const fmtEur = (n: number) =>
                  n.toLocaleString('it-IT', { style: 'currency', currency: 'EUR' });
                return (
                  <Link
                    key={a.id}
                    href={auctionDetailPath(a.id)}
                    prefetch
                    scroll
                    className="group flex flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-md transition hover:border-[#FF7300] hover:shadow-lg"
                  >
                    <div
                      className="flex min-h-[52px] items-center justify-between gap-2 px-3 py-2.5"
                      style={{ background: layout.gradient }}
                    >
                      <div className="flex min-w-0 flex-1 items-center gap-2">
                        <span
                          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/20 text-xs font-bold uppercase text-white ring-2 ring-white/30"
                          aria-hidden
                        >
                          {initial}
                        </span>
                        <span className="truncate text-xs font-bold uppercase tracking-wide text-white">
                          {handle}
                        </span>
                      </div>
                      <p className="max-w-[55%] text-right text-[10px] font-bold uppercase leading-tight tracking-wide text-white">
                        {bannerLabel}
                      </p>
                    </div>

                    <div className="flex flex-1 flex-col bg-white">
                      <div className="flex gap-3 px-3 pb-3 pt-3">
                        <div className="relative w-[40%] max-w-[7.5rem] shrink-0 self-start">
                          <div className="relative aspect-[5/7] w-full overflow-hidden rounded-lg border border-gray-100 bg-gray-50 shadow-sm">
                            <Image
                              src={a.image}
                              alt=""
                              fill
                              className="object-cover"
                              sizes="(max-width: 1024px) 40vw, 120px"
                              unoptimized
                            />
                          </div>
                        </div>
                        <div className="min-w-0 flex-1">
                          <p
                            className={`line-clamp-3 text-[11px] font-bold uppercase leading-snug sm:text-xs ${TITLE_ACCENT[layout.titleAccent]}`}
                          >
                            {a.title}
                          </p>
                          <dl className="mt-2 space-y-1.5 text-[11px] sm:text-xs">
                            <div className="flex justify-between gap-2 border-b border-gray-100 pb-1">
                              <dt className="text-gray-500">{t('auctions.similarRowStarting')}</dt>
                              <dd className="shrink-0 font-semibold text-gray-900">{fmtEur(a.startingBidEur)}</dd>
                            </div>
                            <div className="flex justify-between gap-2 border-b border-gray-100 pb-1">
                              <dt className="text-gray-500">{t('auctions.similarRowCurrent')}</dt>
                              <dd className="shrink-0 font-semibold text-gray-900">{fmtEur(a.currentBidEur)}</dd>
                            </div>
                          </dl>
                          <p
                            className={`mt-1.5 text-[10px] font-medium leading-snug sm:text-[11px] ${reserveRowClass(reserveStatus)}`}
                          >
                            {t(RESERVE_MSG[reserveStatus])}
                          </p>
                        </div>
                      </div>
                      <span
                        className="mt-auto w-full py-3.5 text-center text-[11px] font-bold uppercase tracking-wide text-white transition group-hover:brightness-105 sm:text-xs"
                        style={{ backgroundColor: ORANGE }}
                      >
                        {t('auctions.similarParticipateCta')}
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Tabella / scambi — righe arrotondate chiare */}
          <div className="mt-10 sm:mt-12">
            <h2 className="mb-4 text-sm font-bold uppercase tracking-wide text-gray-800">
              {t('auctions.tableExchangeTitle')}
            </h2>
            <div className="space-y-3">
              {tradeRows.map((row, i) => (
                <div
                  key={i}
                  className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-gray-200 bg-white px-4 py-4 shadow-sm"
                >
                  <div className="flex min-w-[140px] items-center gap-2 text-sm font-semibold text-gray-900">
                    <span>{countryFlagEmoji(row.country)}</span>
                    {row.seller}
                    <span className="text-amber-500">★</span>
                    <span className="text-xs font-normal text-gray-500">{row.rating}%</span>
                  </div>
                  <div className="flex min-w-0 flex-1 items-center gap-3">
                    <span className="relative h-14 w-10 shrink-0 overflow-hidden rounded-md border border-gray-100 bg-gray-50">
                      <Image src={row.image} alt="" fill className="object-cover" sizes="40px" unoptimized />
                    </span>
                    <span className="truncate font-medium text-gray-800">{row.title}</span>
                  </div>
                  <button
                    type="button"
                    className="text-right text-xs font-bold uppercase tracking-wide text-gray-800 underline decoration-gray-300 underline-offset-2 hover:text-[#FF7300] sm:text-sm"
                  >
                    {t('auctions.exchangeRequestCta')}
                  </button>
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
          estimatedShippingEur={detail.estimatedShippingEur}
          reserveMet={detail.reserveMet}
          msLeft={msLeft}
          endsAt={new Date(endsAt)}
          myLastOfferEur={myLastOfferEur}
          onSubmitOffer={(amountEur) => {
            setMyLastOfferEur(roundMoney(amountEur));
            setBidModalOpen(false);
            setBidToastAmount(roundMoney(amountEur));
          }}
        />
      )}
    </div>
  );
}
