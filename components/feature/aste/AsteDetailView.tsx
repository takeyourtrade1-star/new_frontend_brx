'use client';

/**
 * Dettaglio asta — light mode (sfondo bianco) come Figma: card bianca, testi scuri, accenti arancioni.
 */

import { useMemo, useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { Eye, Package, TrendingUp, Users, Bookmark, ArrowLeft, ChevronDown, PlusCircle, Globe } from 'lucide-react';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { FlagIcon } from '@/components/ui/FlagIcon';
import { minNextBidEur, roundMoney } from '@/lib/auction/bid-math';
import { AuctionBidPanel } from '@/components/feature/aste/AuctionBidPanel';
import { AuctionShareButton } from '@/components/feature/aste/AuctionShareButton';
import { AuctionQrButton } from '@/components/feature/aste/AuctionQrButton';
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
import { savedApi } from '@/lib/api/auction-client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
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
  const queryClient = useQueryClient();

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

  const savedStatusQuery = useQuery({
    queryKey: ['saved-auctions', 'status', numericId, currentUserId],
    queryFn: () => savedApi.getSavedStatus(numericId),
    enabled: isAuthenticated && !Number.isNaN(numericId) && numericId > 0,
    staleTime: 10_000,
  });
  const savedMutation = useMutation({
    mutationFn: async (shouldSave: boolean) => {
      if (shouldSave) return savedApi.saveAuction(numericId);
      await savedApi.unsaveAuction(numericId);
      return { success: true, data: { saved: false } };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['saved-auctions', 'status', numericId, currentUserId] });
      queryClient.invalidateQueries({ queryKey: ['saved-auctions', 'list', currentUserId] });
    },
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
  const isSaved = Boolean(savedStatusQuery.data?.data?.saved);
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
      <section className="w-full border-b border-gray-200 bg-white">
        <div className="container-content container-content-card-detail py-2 sm:py-2.5 lg:py-3">
          {/* Back link */}
          <Link
            href="/aste"
            className="mb-1.5 inline-flex items-center gap-1.5 text-xs font-medium text-gray-500 transition hover:text-[#FF7300] sm:text-sm"
          >
            <ArrowLeft className="h-4 w-4" />
            {t('auctions.backToAuctions')}
          </Link>

          {/* Titolo prodotto + azioni */}
          <div ref={heroTitleRef} className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex-1">
              {/* Riga Titolo + Azioni Compatte dentro una singola Pill */}
              <div className="flex w-full items-center justify-between gap-2 rounded-[1.75rem] border border-gray-100/80 bg-gray-50/80 p-1 pl-3 shadow-sm backdrop-blur-sm sm:pl-4">
                <div className="min-w-0 flex-1">
                  <h1 className="break-words py-0.5 text-[20px] font-black uppercase leading-[1.05] tracking-tight text-gray-900 sm:text-[22px] md:text-[26px] lg:text-[28px]">
                    {detail.title}
                  </h1>
                </div>

                {/* Salva per dopo + Condividi (Icon-only compatte a destra) */}
                <div className="flex shrink-0 items-center justify-center gap-1 sm:gap-1.5">
                  {!isOwner && (
                    <button 
                      type="button" 
                      onClick={() => {
                        if (!isAuthenticated) {
                          setPendingSaveAfterLogin(true);
                          setLoginGateOpen(true);
                          return;
                        }
                        void savedMutation.mutateAsync(!isSaved);
                      }}
                      className={`inline-flex h-8 w-8 items-center justify-center rounded-full bg-white shadow-[0_2px_8px_rgba(0,0,0,0.04)] transition hover:shadow-md ${isSaved ? 'text-[#FF7300]' : 'text-gray-400 hover:text-[#FF7300]'}`}
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
              <div className="mt-1.5 flex flex-wrap items-center justify-between gap-x-3 gap-y-1.5">
                {isOwner ? (
                  <p className="inline-flex max-w-fit items-center rounded bg-[#FFF4EC] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#9a3412]">
                    {t('auctions.sellerBanner')}
                  </p>
                ) : (
                  <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-gray-500 sm:text-xs">
                    <span>{t('auctions.detailSoldBy')}: <span className="font-bold text-gray-900">{detail.sellerDisplayName}</span></span>
                    <span className="rounded bg-gray-100 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-gray-600">
                      {detail.sellerAccountType === 'business' ? 'Business' : 'Privato'}
                    </span>
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
            <div className="min-w-0 max-w-[46vw] rounded-full border border-white/60 bg-white/70 px-3 py-2 shadow-[0_10px_24px_rgba(29,49,96,0.15)] backdrop-blur-xl backdrop-saturate-150">
              <h2 className="truncate text-[12px] font-bold uppercase tracking-wide text-[#1D3160]">
                {detail.title}
              </h2>
            </div>
            <div className="flex shrink-0 items-center gap-1.5">
              <div className="flex items-center gap-1.5 rounded-full border border-white/60 bg-white/70 px-1.5 py-1 shadow-[0_10px_24px_rgba(29,49,96,0.15)] backdrop-blur-xl backdrop-saturate-150">
                {!isOwner && (
                  <button
                    type="button"
                    onClick={() => {
                      if (!isAuthenticated) {
                        setPendingSaveAfterLogin(true);
                        setLoginGateOpen(true);
                        return;
                      }
                      void savedMutation.mutateAsync(!isSaved);
                    }}
                    className={`inline-flex h-8 w-8 items-center justify-center rounded-full transition hover:bg-white/70 ${isSaved ? 'text-[#FF7300]' : 'text-gray-600 hover:text-[#FF7300]'}`}
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
                className="flex h-10 items-center gap-1.5 rounded-full border border-white/60 bg-white/70 px-3 shadow-[0_10px_24px_rgba(29,49,96,0.15)] backdrop-blur-xl backdrop-saturate-150"
                aria-label={t('auctions.navCreate')}
              >
                <PlusCircle className="h-4 w-4 text-[#FF7300]" aria-hidden />
              </Link>
            </div>
          </div>
        </div>
      </div>

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
                    <p className="text-sm font-semibold text-gray-900">
                      {shippingInfo.included ? 'Spedizione inclusa' : shippingInfo.label}
                    </p>
                    {!shippingInfo.included ? (
                      <p className="mt-1 text-xs text-gray-500">Tariffe per area di consegna</p>
                    ) : null}
                    <div className="mt-2 space-y-1.5">
                      {detail.shippingOriginCountry ? (
                        <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-white px-2.5 py-2 text-xs">
                          <div className="flex items-center gap-2">
                            <FlagIcon country={detail.shippingOriginCountry} size="sm" />
                            <span className="font-medium text-gray-600">Nazionale</span>
                          </div>
                          <span className="font-semibold text-gray-900">
                            {detail.shippingNationalEur != null ? fmtEur(detail.shippingNationalEur) : '—'}
                          </span>
                        </div>
                      ) : null}
                      <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-white px-2.5 py-2 text-xs">
                        <span className="font-medium text-gray-600">Resto Europa (default)</span>
                        <span className="font-semibold text-gray-900">
                          {detail.shippingEuDefaultEur != null ? fmtEur(detail.shippingEuDefaultEur) : '—'}
                        </span>
                      </div>
                      {restOfWorldPriceRow ? (
                        <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-white px-2.5 py-2 text-xs">
                          <div className="flex items-center gap-2">
                            <Globe className="h-3.5 w-3.5 text-gray-500" aria-hidden />
                            <span className="font-medium text-gray-600">Resto del mondo</span>
                          </div>
                          <span className="font-semibold text-gray-900">{fmtEur(restOfWorldPriceRow.price_eur)}</span>
                        </div>
                      ) : null}
                      {shippingCountryRows.length > 0 ? (
                        <div className="rounded-lg border border-gray-200 bg-white px-2.5 py-2">
                          <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-gray-500">
                            Tariffe specifiche per paese
                          </p>
                          <div className="space-y-1.5">
                            {shippingCountryRows.map((row) => (
                              <div key={row.country_iso} className="flex items-center justify-between text-xs">
                                <div className="flex items-center gap-2">
                                  <FlagIcon country={row.country_iso} size="sm" />
                                  <span className="font-medium text-gray-600">{row.country_iso}</span>
                                </div>
                                <span className="font-semibold text-gray-900">{fmtEur(row.price_eur)}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : null}
                    </div>
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

                {isOwner && isEnded && outcome === 'sold' && (
                  <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-950">
                    <p className="font-bold">{t('auctions.sellerEndedWonTitle')}</p>
                    <p className="mt-1 text-xs leading-relaxed">
                      {t('auctions.sellerEndedWonBody', {
                        winner: detail.winnerUsername,
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
                    href="/ordini/vendite?tab=da-spedire"
                    className="flex w-full items-center justify-center gap-2 rounded-full border-2 border-[#FF7300] bg-[#FF7300] py-4 text-center text-base font-bold uppercase tracking-wide text-white shadow-md transition hover:bg-[#e86800]"
                  >
                    <Package className="h-5 w-5 shrink-0" aria-hidden />
                    {t('auctions.sellerShippingCta')}
                  </Link>
                )}

                {isOwner && !isEnded && (
                  <div className="flex flex-col items-stretch gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <Link
                      href="/aste/mie"
                      className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-800 shadow-sm transition hover:border-[#FF7300]/35 hover:text-[#FF7300]"
                    >
                      {t('auctions.sellerActionManage')}
                    </Link>
                    <button
                      type="button"
                      disabled
                      className="self-center text-xs font-medium text-gray-500 underline-offset-2 transition hover:text-[#FF7300] hover:underline disabled:cursor-not-allowed disabled:opacity-60 sm:self-auto"
                    >
                      {t('auctions.sellerActionEdit')}
                    </button>
                  </div>
                )}

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
              void savedMutation.mutateAsync(true);
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
