'use client';

/**
 * Dettaglio asta — light mode (sfondo bianco) come Figma: card bianca, testi scuri, accenti arancioni.
 */

import { useMemo, useState, useEffect, useRef, useCallback } from 'react';
import { TrendingUp, Users, ChevronDown } from 'lucide-react';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { minNextBidEur, roundMoney } from '@/lib/auction/bid-math';
import { AuctionBidPanel } from '@/components/feature/aste/AuctionBidPanel';
import { AsteNav } from '@/components/feature/aste/AsteNav';
import { LoginGateModal } from '@/components/feature/auth/LoginGateModal';
import { auctionConditionLabelKey } from '@/lib/auction/auction-create-draft';
import { getCardLanguageLabel } from '@/lib/card-languages';
import { AUCTION_SHIPPING_REST_OF_WORLD_ISO } from '@/lib/auction/eu-shipping-regions';
import {
  useAuctionDetail,
  useAuctionBids,
  useAuctionList,
  useAuctionWebSocket,
} from '@/lib/hooks/use-auctions';
import { apiToAuctionUI, apiBidToBidRow, type AuctionUI, type BidRowUI } from '@/lib/auction/auction-adapter';
import { useAuthStore } from '@/lib/stores/auth-store';
import { useUserCountry } from '@/lib/hooks/use-user-country';
import { useAuctionSaved } from '@/hooks/aste/useAuctionSaved';
import { MascotteLoader } from '@/components/dev/MascotteLoader';
import { useEnrichedAuction, useEnrichedAuctions, useEnrichedBidRows } from '@/lib/hooks/use-enriched-auctions';
import {
  formatAuctionEur,
  resolveShippingCost,
  sameUserId,
  HEADER_OFFSET,
} from '@/lib/auction/auction-detail-utils';
import { buildAuctionExpiryIcs, buildGoogleCalendarUrl } from '@/lib/auction/calendar';
import { useAuctionProxyBidding } from '@/hooks/aste/useAuctionProxyBidding';
import { AuctionCollapsibleRow } from '@/components/feature/aste/detail/AuctionCollapsibleRow';
import { AuctionProductMeta } from '@/components/feature/aste/detail/AuctionProductMeta';
import { AuctionGallery } from '@/components/feature/aste/detail/AuctionGallery';
import { AuctionTimerCardMobile } from '@/components/feature/aste/detail/AuctionTimerCardMobile';
import { AuctionTimerCardDesktop } from '@/components/feature/aste/detail/AuctionTimerCardDesktop';
import { AuctionBidHistory } from '@/components/feature/aste/detail/AuctionBidHistory';
import { SimilarAuctionsSections } from '@/components/feature/aste/detail/SimilarAuctionsSections';
import { ProxyLimitModal } from '@/components/feature/aste/detail/ProxyLimitModal';
import { AuctionImageLightbox } from '@/components/feature/aste/detail/AuctionImageLightbox';
import { AuctionHero } from '@/components/feature/aste/detail/AuctionHero';
import { AuctionMobileActionsBar } from '@/components/feature/aste/detail/AuctionMobileActionsBar';
import { AuctionShippingDetails } from '@/components/feature/aste/detail/AuctionShippingDetails';
import { AuctionStatusPanels } from '@/components/feature/aste/detail/AuctionStatusPanels';

export function AsteDetailView({ auctionId }: { auctionId: string }) {
  const { t } = useTranslation();
  const numericId = parseInt(auctionId, 10);
  const { data: detailRes, isLoading } = useAuctionDetail(Number.isNaN(numericId) ? 0 : numericId);
  const { data: bidsRes } = useAuctionBids(Number.isNaN(numericId) ? 0 : numericId, { limit: 50 });
  useAuctionWebSocket(Number.isNaN(numericId) ? 0 : numericId);
  const currentUser = useAuthStore((s) => s.user);
  const currentUserId = currentUser?.id ?? null;
  const isAuthenticated = currentUser != null;
  const viewerCountry = useUserCountry();

  const baseDetail = useMemo(() => {
    if (!detailRes?.data) return null;
    return apiToAuctionUI(detailRes.data, bidsRes?.total ?? 0);
  }, [detailRes, bidsRes]);

  const baseBidRows: BidRowUI[] = useMemo(
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
  const detail = useEnrichedAuction(baseDetail);
  const bidRows = useEnrichedBidRows(baseBidRows);

  const detailImages = useMemo(() => {
    if (!detail) return [] as string[];
    if (detail.photoUrls && detail.photoUrls.length > 0) return detail.photoUrls;
    return [detail.imageFront, detail.imageBack].filter(Boolean);
  }, [detail]);
  const [imgIdx, setImgIdx] = useState(0);
  const [loginGateOpen, setLoginGateOpen] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [thumbStart, setThumbStart] = useState(0);
  const [myLastOfferEur, setMyLastOfferEur] = useState<number | null>(null);
  const [myMaxBidEur, setMyMaxBidEur] = useState<number | null>(null);
  const [floatingNotice, setFloatingNotice] = useState<{
    kind: 'success' | 'warning';
    message: string;
  } | null>(null);
  const previousProxyBidOutbidRef = useRef(false);
  const [stickyTop, setStickyTop] = useState(HEADER_OFFSET);
  const [asteNavHeight, setAsteNavHeight] = useState(36);
  const [showStickyHeader, setShowStickyHeader] = useState(false);
  const heroTitleRef = useRef<HTMLDivElement>(null);
  const asteNavRef = useRef<HTMLDivElement>(null);
  const [mobileSection, setMobileSection] = useState<string | null>('auction');
  const [bidsExpanded, setBidsExpanded] = useState(false);
  const [descriptionExpanded, setDescriptionExpanded] = useState(false);
  const [shippingExpanded, setShippingExpanded] = useState(false);
  const [calendarMenuOpen, setCalendarMenuOpen] = useState(false);
  const calendarMenuMobileRef = useRef<HTMLDivElement>(null);
  const calendarMenuDesktopRef = useRef<HTMLDivElement>(null);
  const [pendingSaveAfterLogin, setPendingSaveAfterLogin] = useState(false);

  const { isSaved, setSaved } = useAuctionSaved({
    numericId,
    isAuthenticated,
    currentUserId,
  });

  const {
    proxyModalOpen,
    proxyInput,
    setProxyInput,
    proxyInputError,
    setProxyInputError,
    openProxyModal,
    closeProxyModal,
    stopProxyBidding,
    increaseProxyLimit,
    resetProxyModal,
    isUpdating: isProxyUpdating,
    isCancelling: isProxyCancelling,
  } = useAuctionProxyBidding({
    numericId: Number.isNaN(numericId) ? 0 : numericId,
    myMaxBidEur,
    setMyMaxBidEur,
    onNotice: setFloatingNotice,
  });

  useEffect(() => {
    const header = document.querySelector('header');
    const asteNavEl = asteNavRef.current;
    if (!header) return;
    const measure = () => {
      const headerHeight = header.getBoundingClientRect().height;
      const rawNavHeight = asteNavEl?.getBoundingClientRect().height ?? 56;
      // Keep a stable nav height for trigger math even when mobile nav is temporarily hidden.
      const navHeight = rawNavHeight > 0 ? rawNavHeight : 36;
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
    if (!floatingNotice) return;
    const id = window.setTimeout(() => setFloatingNotice(null), 3600);
    return () => window.clearTimeout(id);
  }, [floatingNotice]);

  // Reset sticky header state when auction changes
  useEffect(() => {
    setShowStickyHeader(false);
  }, [numericId]);

  useEffect(() => {
    setImgIdx(0);
    setThumbStart(0);
    // FE-REV-007: navigando client-side da un'asta all'altra va azzerato anche lo stato proxy/offerta,
    // altrimenti modale e toast mostrano dati dell'asta precedente.
    setMyMaxBidEur(null);
    setMyLastOfferEur(null);
    resetProxyModal();
    previousProxyBidOutbidRef.current = false;
  }, [numericId, resetProxyModal]);

  useEffect(() => {
    if (imgIdx < thumbStart) {
      setThumbStart(imgIdx);
      return;
    }
    if (imgIdx >= thumbStart + 4) {
      setThumbStart(imgIdx - 3);
    }
  }, [imgIdx, thumbStart]);

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
  const similarCardsBase = useMemo(() => {
    return (similarData?.data ?? [])
      .filter((a) => a.id !== numericId)
      .slice(0, 3)
      .map((a) => apiToAuctionUI(a));
  }, [similarData, numericId]);
  const similarCards = useEnrichedAuctions(similarCardsBase);

  const myLastOfferFromHistoryEur = useMemo(() => {
    if (!currentUserId) return null;
    const myLatestBid = bidRows.find((b) => sameUserId(b.userId, currentUserId));
    return myLatestBid ? myLatestBid.amountEur : null;
  }, [bidRows, currentUserId]);

  const isOwner = detail ? sameUserId(detail.createdByUserId, currentUserId) : false;
  const isEnded = detail?.status === 'ended';
  const showBuyerBid = !isOwner && !isEnded;
  const mobileActionTop = stickyTop + (showStickyHeader ? 0 : asteNavHeight);
  const detailStats = (detail ?? {}) as {
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
  const endsAt = detail?.endsAt ?? new Date(0).toISOString();
  const mainImg = detailImages[imgIdx] ?? detailImages[0] ?? '';
  const visibleThumbs = 4;
  const hasThumbOverflow = detailImages.length > visibleThumbs;
  const maxThumbStart = Math.max(0, detailImages.length - visibleThumbs);
  const conditionLabel = detail?.condition ? t(auctionConditionLabelKey(detail.condition)) : '—';
  const languageLabel = detail?.cardLanguage ? getCardLanguageLabel(detail.cardLanguage) : '—';
  const expansionName = detail?.setName?.trim() || '—';
  const shippingInfo = detail
    ? resolveShippingCost(
        detail,
        ((currentUser as { country?: string } | null)?.country ?? viewerCountry)
      )
    : { included: false, label: 'Spedizione da definire' };
  const restOfWorldPriceRow = detail?.shippingCountryPrices?.find(
    (r) => r.country_iso === AUCTION_SHIPPING_REST_OF_WORLD_ISO
  );
  const shippingCountryRows = (detail?.shippingCountryPrices ?? [])
    .filter((r) => r.country_iso !== AUCTION_SHIPPING_REST_OF_WORLD_ISO)
    .slice(0, 8);
  const reserveMet = detail?.reservePrice != null ? detail.currentBidEur >= detail.reservePrice : true;
  const effectiveMyLastOfferEur = myLastOfferEur ?? myLastOfferFromHistoryEur;
  const outcome: 'live' | 'sold' | 'unsold' = isEnded
    ? (reserveMet && (detail?.bidCount ?? 0) > 0 ? 'sold' : 'unsold')
    : 'live';
  const effectiveCurrentBidEur = detail?.currentBidEur ?? 0;
  const detailTitle = detail?.title ?? 'Asta';
  const isWinning =
    !isOwner &&
    !isEnded &&
    currentUserId != null &&
    sameUserId(detail?.highestBidderId, currentUserId);
  const fmtEur = (n: number) => formatAuctionEur(n);
  const antiSnipeLabel =
    detail != null && detail.antiSniperEnabled && detail.antiSniperMinutes != null
      ? t('auctions.createAntiSniperMinutes', { minutes: String(detail.antiSniperMinutes) })
      : t('auctions.detailAntiSnipeOff');
  const descriptionText =
    detail?.description?.trim() || t('auctions.detailDescriptionEmpty');
  const proxyBidIsWinning = !isOwner && !isEnded && myMaxBidEur != null && isWinning && myMaxBidEur >= effectiveCurrentBidEur;
  const proxyBidOutbid = !isOwner && !isEnded && myMaxBidEur != null && !proxyBidIsWinning;
  const downloadCalendarIcs = useCallback(() => {
    if (typeof window === 'undefined') return;
    const eventStart = new Date(endsAt);
    if (Number.isNaN(eventStart.getTime())) return;

    const icsContent = buildAuctionExpiryIcs({
      auctionId: numericId,
      title: detailTitle,
      url: window.location.href,
      start: eventStart,
    });

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const fileUrl = window.URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = fileUrl;
    anchor.download = `asta-${numericId}-scadenza.ics`;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    window.URL.revokeObjectURL(fileUrl);
  }, [detailTitle, endsAt, numericId]);

  const openGoogleCalendar = useCallback(() => {
    if (typeof window === 'undefined') return;
    const eventStart = new Date(endsAt);
    if (Number.isNaN(eventStart.getTime())) return;
    const url = buildGoogleCalendarUrl({
      title: detailTitle,
      url: window.location.href,
      start: eventStart,
    });
    window.open(url, '_blank', 'noopener,noreferrer');
  }, [detailTitle, endsAt]);

  const handleAddToIosCalendar = useCallback(() => {
    downloadCalendarIcs();
    setCalendarMenuOpen(false);
  }, [downloadCalendarIcs]);

  const handleAddToGoogleCalendar = useCallback(() => {
    openGoogleCalendar();
    setCalendarMenuOpen(false);
  }, [openGoogleCalendar]);

  useEffect(() => {
    if (!calendarMenuOpen) return;
    const onPointerDown = (event: MouseEvent | PointerEvent) => {
      const target = event.target;
      if (!(target instanceof Node)) return;
      if (calendarMenuMobileRef.current?.contains(target)) return;
      if (calendarMenuDesktopRef.current?.contains(target)) return;
      setCalendarMenuOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setCalendarMenuOpen(false);
      }
    };
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [calendarMenuOpen]);

  useEffect(() => {
    if (proxyBidOutbid && !previousProxyBidOutbidRef.current) {
      setFloatingNotice({
        kind: 'warning',
        message: 'La tua offerta e stata superata.',
      });
    }
    previousProxyBidOutbidRef.current = proxyBidOutbid;
  }, [proxyBidOutbid]);

  if (isLoading || !detail) {
    return (
      <div className="min-h-screen bg-white">
        <AsteNav variant="compact" />
        <div className="flex min-h-[40vh] items-center justify-center">
          <MascotteLoader size="md" />
        </div>
      </div>
    );
  }

  const handleToggleSave = () => {
    if (!isAuthenticated) {
      setPendingSaveAfterLogin(true);
      setLoginGateOpen(true);
      return;
    }
    void setSaved(!isSaved);
  };

  return (
    <div className="min-h-screen bg-white font-sans text-gray-900">
      <div 
        ref={asteNavRef} 
        className={`transition-opacity duration-200 ${showStickyHeader ? 'max-lg:pointer-events-none max-lg:opacity-0' : ''}`}
      >
        <AsteNav variant="compact" />
      </div>

      {floatingNotice && !isOwner && (
        <div
          className="fixed left-1/2 z-[140] w-[min(92vw,640px)] -translate-x-1/2 px-1"
          style={{ top: stickyTop + 8 }}
          role="status"
          aria-live="polite"
        >
          <div
            className={`rounded-2xl border px-4 py-3 text-center shadow-[0_20px_45px_rgba(15,23,42,0.16)] backdrop-blur-2xl backdrop-saturate-150 transition-all duration-300 ${
              floatingNotice.kind === 'warning'
                ? 'border-rose-200/80 bg-rose-50/75 text-rose-900'
                : 'border-emerald-200/80 bg-white/70 text-[#16324f]'
            }`}
          >
            <p className="text-sm font-semibold tracking-[0.01em] sm:text-[15px]">{floatingNotice.message}</p>
          </div>
        </div>
      )}

      {/* Hero — Priorità al nome prodotto */}
      <AuctionHero
        title={detail.title}
        isOwner={isOwner}
        isSaved={isSaved}
        sellerDisplayName={detail.sellerDisplayName}
        sellerAccountType={detail.sellerAccountType}
        sellerCountry={detail.sellerCountry}
        sellerRating={detail.sellerRating}
        statsViewsCount={statsViewsCount}
        statsWatchingCount={statsWatchingCount}
        heroTitleRef={heroTitleRef}
        onToggleSave={handleToggleSave}
        t={t}
      />

      {/* Fixed Mobile Actions - tre pillole glass (titolo, azioni, watching) */}
      <AuctionMobileActionsBar
        title={detail.title}
        isOwner={isOwner}
        isSaved={isSaved}
        showStickyHeader={showStickyHeader}
        mobileActionTop={mobileActionTop}
        onToggleSave={handleToggleSave}
        t={t}
      />

      <section className="w-full bg-white px-0 py-2 sm:px-6 sm:py-3 lg:px-8 lg:py-4">
        <div className="container-content container-content-card-detail">
          {/* Blocco principale — glass effect container come Best Sellers */}
          <div className="overflow-hidden rounded-2xl border border-gray-200/60 bg-white/80 backdrop-blur-[1px] shadow-[0_4px_24px_rgba(0,0,0,0.06)]">
            <div className="grid gap-4 p-3 sm:gap-5 sm:p-4 lg:grid-cols-12 lg:items-start lg:gap-5 lg:p-5">
              {/* Galleria */}
              <div className="order-1 flex h-full flex-col gap-3 lg:col-span-5 lg:self-start lg:pr-5 lg:border-r lg:border-black/10">
                {/* Mobile: Unified Price + Timer Card */}
                <AuctionTimerCardMobile
                  isEnded={isEnded}
                  endsAt={endsAt}
                  currentBidEur={detail.currentBidEur}
                  effectiveCurrentBidEur={effectiveCurrentBidEur}
                  startingBidEur={detail.startingBidEur}
                  bidCount={detail.bidCount}
                  reserveMet={reserveMet}
                  antiSnipeLabel={antiSnipeLabel}
                  calendarRef={calendarMenuMobileRef}
                  calendarMenuOpen={calendarMenuOpen}
                  onToggleCalendar={() => setCalendarMenuOpen((open) => !open)}
                  onIos={handleAddToIosCalendar}
                  onGoogle={handleAddToGoogleCalendar}
                />

                <AuctionGallery
                  detailImages={detailImages}
                  imgIdx={imgIdx}
                  setImgIdx={setImgIdx}
                  thumbStart={thumbStart}
                  setThumbStart={setThumbStart}
                  hasThumbOverflow={hasThumbOverflow}
                  maxThumbStart={maxThumbStart}
                  visibleThumbs={visibleThumbs}
                  mainImg={mainImg}
                  onOpenLightbox={() => setLightboxOpen(true)}
                />
                <AuctionProductMeta
                  conditionLabel={conditionLabel}
                  languageLabel={languageLabel}
                  expansionName={expansionName}
                  expansionHref={detail.setHref}
                  t={t}
                />
                <div className="mt-2 w-full space-y-2 px-1">
                  <AuctionCollapsibleRow
                    label={t('auctions.detailDescription')}
                    expanded={descriptionExpanded}
                    onToggle={() => setDescriptionExpanded((open) => !open)}
                  >
                    <p className="text-left text-sm leading-relaxed text-gray-600">{descriptionText}</p>
                  </AuctionCollapsibleRow>
                  <AuctionCollapsibleRow
                    label={t('auctions.detailShipping')}
                    expanded={shippingExpanded}
                    onToggle={() => setShippingExpanded((open) => !open)}
                  >
                    <AuctionShippingDetails
                      shippingInfo={shippingInfo}
                      shippingOriginCountry={detail.shippingOriginCountry}
                      shippingNationalEur={detail.shippingNationalEur}
                      shippingEuDefaultEur={detail.shippingEuDefaultEur}
                      restOfWorldPriceEur={restOfWorldPriceRow?.price_eur ?? null}
                      shippingCountryRows={shippingCountryRows}
                      fmtEur={fmtEur}
                    />
                  </AuctionCollapsibleRow>
                </div>
              </div>

              {/* Info centrale */}
              <div className="order-3 flex h-full flex-col gap-3 lg:col-span-4 lg:order-2 lg:self-start lg:pl-5">
                {/* Desktop details list — invariato */}
                <div className="hidden divide-y divide-black/5 rounded-xl border border-transparent bg-white/0 lg:block">
                  <div className="px-3 py-2 text-sm">
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
                    <div className="space-y-1.5 px-3 py-2 text-sm">
                      <div className="flex flex-wrap items-baseline justify-between gap-2">
                        <span className="text-gray-500">{t('auctions.sellerReserveLabel')}</span>
                        <span className="text-lg font-bold text-gray-900">{fmtEur(detail.reservePriceEur)}</span>
                      </div>
                      <p className="text-xs font-medium text-amber-900">
                        {reserveMet ? t('auctions.sellerReserveMet') : t('auctions.sellerReserveNotMet')}
                      </p>
                    </div>
                  ) : null}
                </div>

                {/* Mobile details accordion */}
                <div className="rounded-xl border border-transparent bg-white/0 divide-y divide-black/5 lg:hidden">
                  {/* Section: Dettagli Asta */}
                  <div>
                    <button
                      type="button"
                      onClick={() => setMobileSection(mobileSection === 'auction' ? null : 'auction')}
                      className="flex w-full items-center justify-between px-3 py-2 text-left"
                    >
                      <span className="text-xs font-bold uppercase tracking-wide text-gray-700">
                        {t('auctions.detailEnds').split(':')[0] || 'Dettagli Asta'}
                      </span>
                      <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform duration-200 ${mobileSection === 'auction' ? 'rotate-180' : ''}`} />
                    </button>
                    <div className={`transition-all duration-300 ${mobileSection === 'auction' ? 'max-h-[70vh] overflow-y-auto opacity-100' : 'max-h-0 overflow-hidden opacity-0'}`}>
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

                <AuctionStatusPanels
                  isOwner={isOwner}
                  isEnded={isEnded}
                  outcome={outcome}
                  winnerUsername={detail.winnerUsername}
                  currentBidEur={detail.currentBidEur}
                  reservePriceEur={detail.reservePriceEur}
                  fmtEur={fmtEur}
                  t={t}
                />

                {showBuyerBid && (
                  <AuctionBidPanel
                    auctionId={numericId}
                    currentBidEur={effectiveCurrentBidEur}
                    isWinning={isWinning}
                    reserveMet={reserveMet}
                    maxBidEur={myMaxBidEur}
                    proxyBidOutbid={proxyBidOutbid}
                    buyNowEnabled={detail.buyNowEnabled}
                    buyNowPrice={detail.buyNowPrice}
                    buyNowUrl={detail.buyNowUrl}
                    isAuthenticated={isAuthenticated}
                    onOpenMaxBid={openProxyModal}
                    onRequireAuth={() => setLoginGateOpen(true)}
                    onSubmitOffer={(amountEur) => {
                      setMyLastOfferEur(roundMoney(amountEur));
                      setFloatingNotice({
                        kind: 'success',
                        message: `Offerta registrata correttamente: ${fmtEur(roundMoney(amountEur))}.`,
                      });
                    }}
                    onSubmitMaxBid={(amountEur) => {
                      setMyMaxBidEur(roundMoney(amountEur));
                      setFloatingNotice({
                        kind: 'success',
                        message: `Proxy bidding impostato a ${fmtEur(roundMoney(amountEur))}.`,
                      });
                    }}
                  />
                )}
              </div>

              {/* Timer + cronologia */}
              <div className="order-2 flex h-full flex-col gap-3 lg:col-span-3 lg:order-3 lg:self-start">
                {/* Note: Stats views/watching moved to hero section */}
                {/* Timer Glass Arancio (No Shiny) */}
                <AuctionTimerCardDesktop
                  isEnded={isEnded}
                  endsAt={endsAt}
                  currentBidEur={detail.currentBidEur}
                  antiSnipeLabel={antiSnipeLabel}
                  calendarRef={calendarMenuDesktopRef}
                  calendarMenuOpen={calendarMenuOpen}
                  onToggleCalendar={() => setCalendarMenuOpen((open) => !open)}
                  onIos={handleAddToIosCalendar}
                  onGoogle={handleAddToGoogleCalendar}
                />

                {/* Ultime Offerte — Design Premium Slider */}
                <AuctionBidHistory
                  bidRows={bidRows}
                  bidsExpanded={bidsExpanded}
                  onToggleExpanded={() => setBidsExpanded(!bidsExpanded)}
                  isOwner={isOwner}
                  highestBidderId={detail.highestBidderId}
                  currentUserId={currentUserId}
                />
              </div>
            </div>
          </div>

          <SimilarAuctionsSections similarCards={similarCards} />
        </div>
      </section>

      {lightboxOpen && detailImages.length > 0 && (
        <AuctionImageLightbox
          mainImg={mainImg}
          onPrev={() => setImgIdx((v) => (v - 1 + detailImages.length) % detailImages.length)}
          onNext={() => setImgIdx((v) => (v + 1) % detailImages.length)}
          onClose={() => setLightboxOpen(false)}
        />
      )}

      {showBuyerBid && (
        <LoginGateModal
          open={loginGateOpen}
          onClose={() => {
            // FE-REV-009: chiudere senza login non deve lasciare un salvataggio "in sospeso"
            // che scatterebbe al login successivo aperto per fare un'offerta.
            setPendingSaveAfterLogin(false);
            setLoginGateOpen(false);
          }}
          onSuccess={() => {
            setLoginGateOpen(false);
            if (pendingSaveAfterLogin) {
              setPendingSaveAfterLogin(false);
              void setSaved(true);
            }
          }}
          title={`Accedi per offrire ${fmtEur(minNextBidEur(effectiveCurrentBidEur))}`}
          subtitle="Bastano pochi secondi per partecipare all'asta."
        />
      )}

      {proxyModalOpen && myMaxBidEur != null && (
        <ProxyLimitModal
          maxBidEur={myMaxBidEur}
          proxyInput={proxyInput}
          proxyInputError={proxyInputError}
          onChangeInput={(value) => {
            setProxyInput(value);
            setProxyInputError(null);
          }}
          onIncrease={increaseProxyLimit}
          onStop={stopProxyBidding}
          onClose={closeProxyModal}
          isUpdating={isProxyUpdating}
          isCancelling={isProxyCancelling}
        />
      )}
    </div>
  );
}
