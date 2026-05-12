'use client';

/**
 * Dettaglio asta — light mode (sfondo bianco) come Figma: card bianca, testi scuri, accenti arancioni.
 */

import { useMemo, useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Eye, Package, Settings, Shield, TrendingUp, Users, Bookmark, Crown, ArrowLeft, Trophy, Check, ChevronDown, ChevronUp, ChevronLeft, ChevronRight, Clock, PlusCircle, CalendarPlus, Smartphone, Globe } from 'lucide-react';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { FlagIcon } from '@/components/ui/FlagIcon';
import { auctionDetailPath } from '@/lib/auction/auction-paths';
import { minNextBidEur, parseLocaleMoneyInput, roundMoney, roundUpToHalfStep } from '@/lib/auction/bid-math';
import { AuctionBidPanel } from '@/components/feature/aste/AuctionBidPanel';
import { AuctionShareButton } from '@/components/feature/aste/AuctionShareButton';
import { AuctionQrButton } from '@/components/feature/aste/AuctionQrButton';
import { AsteNav } from '@/components/feature/aste/AsteNav';
import { LoginGateModal } from '@/components/feature/auth/LoginGateModal';
import { auctionConditionLabelKey } from '@/lib/auction/auction-create-draft';
import { AUCTION_SHIPPING_REST_OF_WORLD_ISO, isEuShippingCountry } from '@/lib/auction/eu-shipping-regions';
import type { MessageKey } from '@/lib/i18n/messages/en';
import {
  useAuctionDetail,
  useAuctionBids,
  useAuctionList,
  useAuctionWebSocket,
  useCancelProxyLimit,
  useUpdateProxyLimit,
} from '@/lib/hooks/use-auctions';
import { apiToAuctionUI, apiBidToBidRow, type AuctionUI, type BidRowUI } from '@/lib/auction/auction-adapter';
import { useAuthStore } from '@/lib/stores/auth-store';
import { useUserCountry } from '@/lib/hooks/use-user-country';
import { savedApi } from '@/lib/api/auction-client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { MascotteLoader } from '@/components/dev/MascotteLoader';
import { enrichAuctionsWithPublicUsers, enrichBidRowsWithPublicUsers } from '@/lib/auction/public-user-enrichment';

const PASTEL_GRADIENTS = [
  { gradient: 'from-rose-300/20 via-rose-200/10 to-transparent', border: 'border-rose-300/60', shadow: 'shadow-rose-200/30' },
  { gradient: 'from-sky-300/20 via-sky-200/10 to-transparent', border: 'border-sky-300/60', shadow: 'shadow-sky-200/30' },
  { gradient: 'from-violet-300/20 via-violet-200/10 to-transparent', border: 'border-violet-300/60', shadow: 'shadow-violet-200/30' },
  { gradient: 'from-emerald-300/20 via-emerald-200/10 to-transparent', border: 'border-emerald-300/60', shadow: 'shadow-emerald-200/30' },
  { gradient: 'from-amber-300/20 via-amber-200/10 to-transparent', border: 'border-amber-300/60', shadow: 'shadow-amber-200/30' },
] as const;
const ORANGE = '#FF7300';
const HEADER_OFFSET = 80;
const CALENDAR_GLASS_MENU_CLASS =
  'absolute right-0 z-[320] w-60 overflow-hidden rounded-2xl border border-white/20 bg-gradient-to-b from-slate-800/95 via-slate-900/93 to-black/92 p-1.5 text-white backdrop-blur-xl backdrop-saturate-150 shadow-[0_26px_60px_rgba(2,6,23,0.58)] ring-1 ring-white/10 animate-orange-menu-enter';
const CALENDAR_MENU_ITEM_CLASS =
  'flex w-full items-center justify-between rounded-xl px-2.5 py-2.5 text-left text-[13px] font-semibold text-white drop-shadow-[0_1px_1px_rgba(0,0,0,0.35)] transition hover:bg-white/14 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/45';
const CALENDAR_MENU_BADGE_CLASS = 'rounded-md border border-white/30 bg-white/12 px-1.5 py-0.5 text-[10px] font-extrabold tracking-wide text-white';

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

function formatAuctionEur(value: number): string {
  return roundUpToHalfStep(value).toLocaleString('it-IT', { style: 'currency', currency: 'EUR' });
}

function resolveShippingCost(
  detail: AuctionUI,
  viewerCountryRaw: string | null | undefined
): { included: boolean; label: string } {
  if (detail.shippingPayer === 'seller') {
    return { included: true, label: 'Spedizione inclusa' };
  }
  const viewerCountry = (viewerCountryRaw ?? '').toUpperCase();
  const originCountry = (detail.shippingOriginCountry ?? '').toUpperCase();
  if (!viewerCountry) {
    return {
      included: false,
      label:
        detail.shippingEuDefaultEur != null
          ? `Spedizione da ${formatAuctionEur(detail.shippingEuDefaultEur)}`
          : 'Spedizione da definire',
    };
  }
  if (viewerCountry === originCountry && detail.shippingNationalEur != null) {
    return { included: false, label: `Spedizione ${formatAuctionEur(detail.shippingNationalEur)}` };
  }
  const countryOverride = detail.shippingCountryPrices.find((r) => r.country_iso === viewerCountry);
  if (countryOverride) {
    return { included: false, label: `Spedizione ${formatAuctionEur(countryOverride.price_eur)}` };
  }
  if (isEuShippingCountry(viewerCountry)) {
    if (detail.shippingEuDefaultEur != null) {
      return { included: false, label: `Spedizione ${formatAuctionEur(detail.shippingEuDefaultEur)}` };
    }
  } else {
    const restWorld = detail.shippingCountryPrices.find(
      (r) => r.country_iso === AUCTION_SHIPPING_REST_OF_WORLD_ISO
    );
    if (restWorld) {
      return { included: false, label: `Spedizione ${formatAuctionEur(restWorld.price_eur)}` };
    }
    if (detail.shippingEuDefaultEur != null) {
      return { included: false, label: `Spedizione ${formatAuctionEur(detail.shippingEuDefaultEur)}` };
    }
  }
  return { included: false, label: 'Spedizione da definire' };
}

function formatIcsDateUtc(date: Date): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  const hours = String(date.getUTCHours()).padStart(2, '0');
  const minutes = String(date.getUTCMinutes()).padStart(2, '0');
  const seconds = String(date.getUTCSeconds()).padStart(2, '0');
  return `${year}${month}${day}T${hours}${minutes}${seconds}Z`;
}

function escapeIcsText(value: string): string {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/\n/g, '\\n')
    .replace(/,/g, '\\,')
    .replace(/;/g, '\\;');
}

function formatGoogleDateUtc(date: Date): string {
  return formatIcsDateUtc(date);
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
  const [detail, setDetail] = useState<AuctionUI | null>(null);
  const [bidRows, setBidRows] = useState<BidRowUI[]>([]);

  useEffect(() => {
    let isCancelled = false;
    const resolveDetailSeller = async () => {
      if (!baseDetail) {
        setDetail(null);
        return;
      }
      const [resolved] = await enrichAuctionsWithPublicUsers([baseDetail]);
      if (!isCancelled) {
        setDetail(resolved ?? baseDetail);
      }
    };
    resolveDetailSeller();
    return () => {
      isCancelled = true;
    };
  }, [baseDetail]);

  useEffect(() => {
    let isCancelled = false;
    const resolveBidderNames = async () => {
      if (baseBidRows.length === 0) {
        setBidRows([]);
        return;
      }
      const resolved = await enrichBidRowsWithPublicUsers(baseBidRows);
      if (!isCancelled) {
        setBidRows(resolved);
      }
    };
    resolveBidderNames();
    return () => {
      isCancelled = true;
    };
  }, [baseBidRows]);

  const now = useNowTick();

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
  const [proxyModalOpen, setProxyModalOpen] = useState(false);
  const [proxyInput, setProxyInput] = useState('');
  const [proxyInputError, setProxyInputError] = useState<string | null>(null);
  const [floatingNotice, setFloatingNotice] = useState<{
    kind: 'success' | 'warning';
    message: string;
  } | null>(null);
  const previousProxyBidOutbidRef = useRef(false);
  const [stickyTop, setStickyTop] = useState(HEADER_OFFSET);
  const [asteNavHeight, setAsteNavHeight] = useState(56);
  const [showStickyHeader, setShowStickyHeader] = useState(false);
  const heroTitleRef = useRef<HTMLDivElement>(null);
  const asteNavRef = useRef<HTMLDivElement>(null);
  const [mobileSection, setMobileSection] = useState<string | null>('auction');
  const [bidsExpanded, setBidsExpanded] = useState(false);
  const [calendarMenuOpen, setCalendarMenuOpen] = useState(false);
  const calendarMenuMobileRef = useRef<HTMLDivElement>(null);
  const calendarMenuDesktopRef = useRef<HTMLDivElement>(null);
  const updateProxyLimitMutation = useUpdateProxyLimit(Number.isNaN(numericId) ? 0 : numericId);
  const cancelProxyLimitMutation = useCancelProxyLimit(Number.isNaN(numericId) ? 0 : numericId);
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
  }, [numericId]);

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
  const [similarCards, setSimilarCards] = useState<AuctionUI[]>([]);

  useEffect(() => {
    let isCancelled = false;
    const resolveSimilarSellers = async () => {
      if (similarCardsBase.length === 0) {
        setSimilarCards([]);
        return;
      }
      const resolved = await enrichAuctionsWithPublicUsers(similarCardsBase);
      if (!isCancelled) {
        setSimilarCards(resolved);
      }
    };
    resolveSimilarSellers();
    return () => {
      isCancelled = true;
    };
  }, [similarCardsBase]);

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
  const msLeft = new Date(endsAt).getTime() - now;
  const mainImg = detailImages[imgIdx] ?? detailImages[0] ?? '';
  const visibleThumbs = 4;
  const hasThumbOverflow = detailImages.length > visibleThumbs;
  const maxThumbStart = Math.max(0, detailImages.length - visibleThumbs);
  const conditionLabel = detail?.condition ? t(auctionConditionLabelKey(detail.condition)) : '—';
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
  const proxyBidIsWinning = !isOwner && !isEnded && myMaxBidEur != null && isWinning && myMaxBidEur >= effectiveCurrentBidEur;
  const proxyBidOutbid = !isOwner && !isEnded && myMaxBidEur != null && !proxyBidIsWinning;
  const downloadCalendarIcs = useCallback(() => {
    if (typeof window === 'undefined') return;
    const eventStart = new Date(endsAt);
    if (Number.isNaN(eventStart.getTime())) return;

    const eventEnd = new Date(eventStart.getTime() + 30 * 60 * 1000);
    const nowUtc = formatIcsDateUtc(new Date());
    const eventStartUtc = formatIcsDateUtc(eventStart);
    const eventEndUtc = formatIcsDateUtc(eventEnd);
    const eventTitle = `Scadenza asta: ${detailTitle}`;
    const eventUrl = window.location.href;
    const eventDescription = `L'asta "${detailTitle}" scade in questo momento.\\n${eventUrl}`;
    const uid = `auction-${numericId}-${eventStart.getTime()}@ebartex`;
    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//EBARTEX//Auction Calendar//IT',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      'BEGIN:VEVENT',
      `UID:${uid}`,
      `DTSTAMP:${nowUtc}`,
      `DTSTART:${eventStartUtc}`,
      `DTEND:${eventEndUtc}`,
      `SUMMARY:${escapeIcsText(eventTitle)}`,
      `DESCRIPTION:${escapeIcsText(eventDescription)}`,
      `URL:${eventUrl}`,
      'END:VEVENT',
      'END:VCALENDAR',
    ].join('\r\n');

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
    const eventEnd = new Date(eventStart.getTime() + 30 * 60 * 1000);
    const eventTitle = `Scadenza asta: ${detailTitle}`;
    const eventDetails = `L'asta "${detailTitle}" scade in questo momento.`;
    const url = new URL('https://calendar.google.com/calendar/render');
    url.searchParams.set('action', 'TEMPLATE');
    url.searchParams.set('text', eventTitle);
    url.searchParams.set('details', eventDetails);
    url.searchParams.set('location', window.location.href);
    url.searchParams.set('dates', `${formatGoogleDateUtc(eventStart)}/${formatGoogleDateUtc(eventEnd)}`);
    window.open(url.toString(), '_blank', 'noopener,noreferrer');
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
        <AsteNav />
        <div className="flex min-h-[40vh] items-center justify-center">
          <MascotteLoader size="md" />
        </div>
      </div>
    );
  }

  const openProxyModal = () => {
    if (myMaxBidEur == null) return;
    const normalized = roundUpToHalfStep(myMaxBidEur);
    setProxyInput(
      Number.isInteger(normalized)
        ? String(normalized)
        : normalized.toFixed(1).replace('.', ',')
    );
    setProxyInputError(null);
    setProxyModalOpen(true);
  };

  const closeProxyModal = () => {
    setProxyModalOpen(false);
    setProxyInputError(null);
  };

  const stopProxyBidding = async () => {
    try {
      await cancelProxyLimitMutation.mutateAsync();
      setMyMaxBidEur(null);
      setFloatingNotice({
        kind: 'success',
        message: 'Proxy bidding disattivato.',
      });
      closeProxyModal();
    } catch (err) {
      setProxyInputError(err instanceof Error ? err.message : 'Impossibile disattivare il proxy bidding.');
    }
  };

  const increaseProxyLimit = async () => {
    if (myMaxBidEur == null) return;
    const parsed = parseLocaleMoneyInput(proxyInput);
    if (!Number.isFinite(parsed)) {
      setProxyInputError('Inserisci un importo valido.');
      return;
    }
    const nextLimit = roundUpToHalfStep(parsed);
    if (nextLimit <= myMaxBidEur) {
      setProxyInputError(`Il nuovo limite deve essere superiore a ${fmtEur(myMaxBidEur)}.`);
      return;
    }
    try {
      const res = await updateProxyLimitMutation.mutateAsync({ maxAmount: nextLimit });
      setMyMaxBidEur(res.data.proxy_limit);
      setFloatingNotice({
        kind: 'success',
        message: `Proxy bidding impostato a ${fmtEur(res.data.proxy_limit)}.`,
      });
      closeProxyModal();
    } catch (err) {
      setProxyInputError(err instanceof Error ? err.message : 'Impossibile aggiornare il limite proxy.');
    }
  };

  return (
    <div className="min-h-screen bg-white font-sans text-gray-900">
      <div 
        ref={asteNavRef} 
        className={`transition-opacity duration-200 ${showStickyHeader ? 'max-lg:pointer-events-none max-lg:opacity-0' : ''}`}
      >
        <AsteNav />
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
              <div className="mt-2 flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
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

      <section className="w-full bg-white px-0 py-4 sm:px-6 sm:py-6 lg:px-8">
        <div className="container-content container-content-card-detail">
          {/* Blocco principale — glass effect container come Best Sellers */}
          <div className="overflow-hidden rounded-2xl border border-gray-200/60 bg-white/80 backdrop-blur-[1px] shadow-[0_4px_24px_rgba(0,0,0,0.06)]">
            <div className="grid gap-6 p-4 sm:gap-8 sm:p-6 lg:grid-cols-12 lg:items-start lg:gap-7 lg:p-8">
              {/* Galleria */}
              <div className="order-1 flex h-full flex-col gap-5 lg:col-span-5 lg:self-start lg:pr-7 lg:border-r lg:border-black/10">
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
                            <p className="mt-1 text-2xl font-extrabold tracking-tight text-gray-900 sm:text-3xl">
                              {fmtEur(effectiveCurrentBidEur)}
                            </p>
                          </div>
                          {/* Right: Timer */}
                          <div className="shrink-0 text-right">
                            <div ref={calendarMenuMobileRef} className="relative flex items-center justify-end gap-1.5">
                              <p className="text-[10px] font-semibold uppercase tracking-wide text-[#FF7300]">
                                {t('auctions.detailClosesIn')}
                              </p>
                              <button
                                type="button"
                                onClick={() => setCalendarMenuOpen((open) => !open)}
                                className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-[#FF7300]/30 bg-white/70 text-[#FF7300] transition hover:border-[#FF7300] hover:bg-white"
                                aria-label="Apri menu calendario"
                                title="Aggiungi al calendario"
                                aria-haspopup="menu"
                                aria-expanded={calendarMenuOpen}
                              >
                                <CalendarPlus className="h-3.5 w-3.5" />
                              </button>
                              {calendarMenuOpen && (
                                <div
                                  className={`${CALENDAR_GLASS_MENU_CLASS} top-7`}
                                  role="menu"
                                  aria-label="Opzioni calendario"
                                >
                                  <button
                                    type="button"
                                    onClick={handleAddToIosCalendar}
                                    className={CALENDAR_MENU_ITEM_CLASS}
                                    role="menuitem"
                                  >
                                    <span className="inline-flex items-center gap-2">
                                      <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-white/18 ring-1 ring-white/35">
                                        <Smartphone className="h-4 w-4" />
                                      </span>
                                      <span>Calendario iOS</span>
                                    </span>
                                    <span className={CALENDAR_MENU_BADGE_CLASS}>ICS</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={handleAddToGoogleCalendar}
                                    className={`${CALENDAR_MENU_ITEM_CLASS} mt-1`}
                                    role="menuitem"
                                  >
                                    <span className="inline-flex items-center gap-2">
                                      <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-white/18 ring-1 ring-white/35">
                                        <Globe className="h-4 w-4" />
                                      </span>
                                      <span>Google Calendar</span>
                                    </span>
                                    <span className={CALENDAR_MENU_BADGE_CLASS}>WEB</span>
                                  </button>
                                </div>
                              )}
                            </div>
                            <p
                              className="mt-1 font-mono text-lg font-bold tabular-nums tracking-tight text-gray-900 sm:text-xl"
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

                <div className="flex items-stretch gap-3 sm:gap-4">
                  <div className="flex w-14 shrink-0 flex-col items-center gap-2 sm:w-[4.5rem]">
                    {hasThumbOverflow ? (
                      <button
                        type="button"
                        onClick={() => setThumbStart((v) => Math.max(0, v - 1))}
                        disabled={thumbStart <= 0}
                        className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-600 transition hover:border-[#FF7300] hover:text-[#FF7300] disabled:opacity-40"
                      >
                        <ChevronUp className="h-4 w-4" />
                      </button>
                    ) : null}

                    {(hasThumbOverflow ? detailImages.slice(thumbStart, thumbStart + visibleThumbs) : detailImages).map((src, i) => {
                      const absoluteIndex = hasThumbOverflow ? thumbStart + i : i;
                      return (
                        <button
                          key={`${src}-${absoluteIndex}`}
                          type="button"
                          onClick={() => setImgIdx(absoluteIndex)}
                          className={`relative aspect-[63/88] w-full overflow-hidden rounded-lg border-2 bg-gray-50 transition ${
                            imgIdx === absoluteIndex ? 'border-[#FF7300] ring-2 ring-[#FF7300]/20' : 'border-gray-200 hover:border-gray-400'
                          }`}
                        >
                          <Image src={src} alt="" fill className="object-cover" sizes="72px" unoptimized />
                        </button>
                      );
                    })}

                    {hasThumbOverflow ? (
                      <button
                        type="button"
                        onClick={() => setThumbStart((v) => Math.min(maxThumbStart, v + 1))}
                        disabled={thumbStart >= maxThumbStart}
                        className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-600 transition hover:border-[#FF7300] hover:text-[#FF7300] disabled:opacity-40"
                      >
                        <ChevronDown className="h-4 w-4" />
                      </button>
                    ) : null}
                  </div>
                  <div className="group relative min-h-[300px] flex-1 overflow-hidden rounded-2xl border border-transparent bg-white/0 shadow-none sm:min-h-[380px] lg:min-h-[420px]">
                    <button
                      type="button"
                      onClick={() => setLightboxOpen(true)}
                      className="absolute inset-0 z-10 cursor-zoom-in"
                      aria-label="Apri immagine in grande"
                    />
                    <Image
                      src={mainImg}
                      alt=""
                      fill
                      className="object-contain"
                      sizes="(max-width:1024px) 100vw, 420px"
                      priority
                      unoptimized
                    />
                    {detailImages.length > 1 ? (
                      <>
                        <button
                          type="button"
                          onClick={() => setImgIdx((v) => (v - 1 + detailImages.length) % detailImages.length)}
                          className="absolute left-2 top-1/2 z-20 hidden h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/85 text-gray-800 shadow transition hover:bg-white group-hover:flex"
                        >
                          <ChevronLeft className="h-5 w-5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setImgIdx((v) => (v + 1) % detailImages.length)}
                          className="absolute right-2 top-1/2 z-20 hidden h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/85 text-gray-800 shadow transition hover:bg-white group-hover:flex"
                        >
                          <ChevronRight className="h-5 w-5" />
                        </button>
                      </>
                    ) : null}
                  </div>
                </div>
                <div className="mt-1 flex justify-center border-t border-gray-100 pt-3">
                  <div className="inline-flex items-center gap-2 rounded-full border border-[#FF7300]/35 bg-white/70 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-gray-700 shadow-[0_10px_24px_rgba(255,115,0,0.12)] backdrop-blur-md backdrop-saturate-150 sm:gap-3">
                    <span>{t('auctions.detailCondition')}: <span className="text-gray-900">{conditionLabel}</span></span>
                    <span className="text-gray-300">|</span>
                    <span>{t('auctions.detailFrom')}: <span className="text-[#1D3160]">{fmtEur(detail.startingBidEur)}</span></span>
                  </div>
                </div>
              </div>

              {/* Info centrale */}
              <div className="order-3 flex h-full flex-col gap-5 lg:col-span-4 lg:order-2 lg:self-start lg:pl-7">
                {/* Desktop details list — invariato */}
                <div className="hidden divide-y divide-black/5 rounded-xl border border-transparent bg-white/0 lg:block">
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
                  ) : null}
                </div>

                {/* Mobile details accordion */}
                <div className="rounded-xl border border-transparent bg-white/0 divide-y divide-black/5 lg:hidden">
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
              <div className="order-2 flex h-full flex-col gap-5 lg:col-span-3 lg:order-3 lg:self-start">
                {/* Note: Stats views/watching moved to hero section */}
                {/* Timer Glass Arancio (No Shiny) */}
                <div className="hidden relative flex-col items-center justify-center rounded-2xl border border-[#FF7300]/30 bg-[#FF7300]/10 p-4 px-6 xl:p-6 xl:px-8 backdrop-blur-md shadow-[0_8px_32px_rgba(255,115,0,0.12)] lg:flex overflow-visible min-w-0 w-full">
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
                      <div className="flex items-center justify-center gap-2">
                        <p className="text-[11px] font-black uppercase tracking-[0.25em] text-[#FF7300] drop-shadow-sm">
                          {t('auctions.detailClosesIn')}
                        </p>
                        <div ref={calendarMenuDesktopRef} className="relative">
                          <button
                            type="button"
                            onClick={() => setCalendarMenuOpen((open) => !open)}
                            className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-[#FF7300]/35 bg-white/70 text-[#FF7300] transition hover:border-[#FF7300] hover:bg-white"
                            aria-label="Apri menu calendario"
                            title="Aggiungi al calendario"
                            aria-haspopup="menu"
                            aria-expanded={calendarMenuOpen}
                          >
                            <CalendarPlus className="h-4 w-4" />
                          </button>
                          {calendarMenuOpen && (
                            <div
                              className={`${CALENDAR_GLASS_MENU_CLASS} top-9 text-left`}
                              role="menu"
                              aria-label="Opzioni calendario"
                            >
                              <button
                                type="button"
                                onClick={handleAddToIosCalendar}
                                className={CALENDAR_MENU_ITEM_CLASS}
                                role="menuitem"
                              >
                                <span className="inline-flex items-center gap-2">
                                  <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-white/18 ring-1 ring-white/35">
                                    <Smartphone className="h-4 w-4" />
                                  </span>
                                  <span>Calendario iOS</span>
                                </span>
                                <span className={CALENDAR_MENU_BADGE_CLASS}>ICS</span>
                              </button>
                              <button
                                type="button"
                                onClick={handleAddToGoogleCalendar}
                                className={`${CALENDAR_MENU_ITEM_CLASS} mt-1`}
                                role="menuitem"
                              >
                                <span className="inline-flex items-center gap-2">
                                  <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-white/18 ring-1 ring-white/35">
                                    <Globe className="h-4 w-4" />
                                  </span>
                                  <span>Google Calendar</span>
                                </span>
                                <span className={CALENDAR_MENU_BADGE_CLASS}>WEB</span>
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                      <p
                        className="mt-3 flex items-baseline justify-center gap-1.5 font-mono text-3xl font-bold tabular-nums tracking-tight text-[#9A3412] leading-none xl:text-4xl 3xl:text-5xl"
                        suppressHydrationWarning
                      >
                        {formatHMS(msLeft)}
                        <span className="text-xl font-black tracking-widest text-orange-800/80 xl:text-2xl">
                          {t('auctions.detailHoursSuffix').toUpperCase()}
                        </span>
                      </p>
                    </div>
                  )}
                </div>

                {/* Ultime Offerte — Design Premium Slider */}
                <div className="flex flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-[0_2px_20px_rgba(0,0,0,0.04)]">
                  <div className="flex items-center justify-between border-b border-gray-100 bg-gray-50/50 px-4 py-3 xl:px-6 xl:py-4">
                    <h3 className="text-xs font-black uppercase tracking-[0.15em] text-gray-900">
                      {isOwner ? t('auctions.sellerBidHistoryTitle') : t('auctions.detailBidHistory')}
                    </h3>
                    <span className="flex h-6 items-center justify-center rounded bg-[#1D3160] px-2 text-[11px] font-bold text-white shadow-sm">
                      {bidRows.length} Offerte
                    </span>
                  </div>

                  <div className="max-h-72 overflow-y-auto py-1">
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
                            className={`group flex items-center justify-between px-4 py-2.5 transition-all duration-300 hover:bg-gray-50 animate-[fadeInUp_0.4s_ease-out_both] xl:px-6 xl:py-3.5 ${i !== visibleBids.length - 1 ? 'border-b border-gray-50' : ''} ${isMine ? 'border-l-4 border-l-[#FF7300] bg-orange-50/60' : 'border-l-4 border-l-transparent hover:border-l-gray-300'}`}
                          >
                            <div className="flex items-center gap-3 min-w-0 transition-transform duration-300 group-hover:translate-x-1">
                              <div className="shrink-0 overflow-hidden rounded-sm ring-1 ring-black/5">
                                <FlagIcon country={bidderCountry} size="sm" />
                              </div>
                              <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className={`text-xs xl:text-[13px] ${isLeader ? 'font-black text-[#1D3160]' : 'font-bold text-gray-700'}`}>
                                    {b.displayName}
                                  </span>
                                  {showCrown && (
                                    <Crown className="h-3.5 w-3.5 shrink-0 text-[#FFB800] drop-shadow-sm" aria-hidden />
                                  )}
                                </div>
                                <span suppressHydrationWarning className="block mt-0.5 text-[10px] tracking-wide text-gray-400">
                                  {timeStr}
                                </span>
                              </div>
                            </div>
                            <span className="shrink-0 text-sm font-black text-gray-900 transition-transform duration-300 group-hover:-translate-x-1 xl:text-[15px]">
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

            <section className="mt-8 rounded-3xl border border-black/10 bg-white px-5 py-6 shadow-[0_8px_28px_rgba(0,0,0,0.06)] sm:mt-10 sm:px-7 sm:py-7 lg:px-9 lg:py-8">
              <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_1px_minmax(0,1fr)] lg:gap-9">
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#6E6E73]">Descrizione</p>
                  <h3 className="mt-1 text-[24px] font-semibold tracking-tight text-[#1D1D1F] sm:text-[28px]">
                    Buone condizioni
                  </h3>
                  <p className="mt-4 max-w-[70ch] text-[15px] leading-7 text-[#424245] sm:text-[16px]">
                    {detail.description || 'Nessuna descrizione aggiuntiva fornita dal venditore.'}
                  </p>
                  <p className="mt-5 max-w-[70ch] text-[13px] leading-6 text-[#6E6E73]">
                    Politiche di reso: il reso e gestito secondo le condizioni dichiarate dal venditore e lo stato dell&apos;oggetto. In caso di problemi, puoi aprire una contestazione dalla cronologia ordini.
                  </p>
                </div>

                <div className="hidden w-px bg-black/10 lg:block" aria-hidden />

                <div className="min-w-0">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#6E6E73]">Spedizione</p>
                  <h3 className="mt-1 text-[24px] font-semibold tracking-tight text-[#1D1D1F] sm:text-[28px]">
                    Spedizione da definire
                  </h3>
                  <p className="mt-2 text-[13px] text-[#6E6E73] sm:text-[14px]">{shippingInfo.label}</p>

                  <div className="mt-5 space-y-2.5">
                    {detail.shippingOriginCountry ? (
                      <div className="flex items-center justify-between rounded-2xl border border-black/10 bg-[#F7F7F8] px-3.5 py-3 text-[13px]">
                        <div className="flex items-center gap-2.5">
                          <FlagIcon country={detail.shippingOriginCountry} size="sm" />
                          <span className="font-medium text-[#424245]">Nazionale</span>
                        </div>
                        <span className="font-semibold text-[#1D1D1F]">
                          {detail.shippingNationalEur != null ? fmtEur(detail.shippingNationalEur) : '—'}
                        </span>
                      </div>
                    ) : null}
                    <div className="flex items-center justify-between rounded-2xl border border-black/10 bg-[#F7F7F8] px-3.5 py-3 text-[13px]">
                      <span className="font-medium text-[#424245]">Resto Europa (default)</span>
                      <span className="font-semibold text-[#1D1D1F]">
                        {detail.shippingEuDefaultEur != null ? fmtEur(detail.shippingEuDefaultEur) : '—'}
                      </span>
                    </div>

                    {restOfWorldPriceRow ? (
                      <div className="flex items-center justify-between rounded-2xl border border-black/10 bg-[#F7F7F8] px-3.5 py-3 text-[13px]">
                        <div className="flex items-center gap-2.5">
                          <Globe className="h-4 w-4 text-[#424245]" aria-hidden />
                          <span className="font-medium text-[#424245]">Resto del mondo</span>
                        </div>
                        <span className="font-semibold text-[#1D1D1F]">{fmtEur(restOfWorldPriceRow.price_eur)}</span>
                      </div>
                    ) : null}

                    {shippingCountryRows.length > 0 ? (
                      <div className="rounded-2xl border border-black/10 bg-white px-3.5 py-3">
                        <p className="mb-2.5 text-[11px] font-semibold uppercase tracking-[0.1em] text-[#6E6E73]">
                          Tariffe specifiche per paese
                        </p>
                        <div className="space-y-2">
                          {shippingCountryRows.map((row) => (
                            <div key={row.country_iso} className="flex items-center justify-between text-[13px]">
                              <div className="flex items-center gap-2.5">
                                <FlagIcon country={row.country_iso} size="sm" />
                                <span className="font-medium text-[#424245]">{row.country_iso}</span>
                              </div>
                              <span className="font-semibold text-[#1D1D1F]">{fmtEur(row.price_eur)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>
            </section>
          </div>

          {/* Oggetti simili — carousel mobile, grid desktop */}
          <div className="mt-10 sm:mt-12">
            <h2 className="mb-5 text-lg font-bold uppercase tracking-wide text-gray-900 sm:text-xl">
              {t('auctions.similarTitle')}
            </h2>

            {/* Mobile: horizontal scroll carousel */}
            <div className="flex gap-4 overflow-x-auto snap-x snap-mandatory pb-3 scrollbar-hide lg:hidden">
              {similarCards.map((a) => {
                const fmtEur = (n: number) => formatAuctionEur(n);
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
                const fmtEur = (n: number) => formatAuctionEur(n);
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

      {lightboxOpen && detailImages.length > 0 && (
        <div
          className="fixed inset-0 z-[260] flex items-center justify-center bg-black/90 p-4"
          onClick={() => setLightboxOpen(false)}
        >
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setImgIdx((v) => (v - 1 + detailImages.length) % detailImages.length);
            }}
            className="absolute left-4 top-1/2 z-[261] hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/20 text-white transition hover:bg-white/30 md:flex"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setImgIdx((v) => (v + 1) % detailImages.length);
            }}
            className="absolute right-4 top-1/2 z-[261] hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/20 text-white transition hover:bg-white/30 md:flex"
          >
            <ChevronRight className="h-6 w-6" />
          </button>
          <button
            type="button"
            onClick={() => setLightboxOpen(false)}
            className="absolute right-4 top-4 z-[261] rounded-full bg-white/20 px-3 py-1 text-sm font-semibold text-white transition hover:bg-white/30"
          >
            Chiudi
          </button>
          <div className="relative h-[82vh] w-full max-w-5xl" onClick={(e) => e.stopPropagation()}>
            <Image src={mainImg} alt="" fill className="object-contain" sizes="100vw" unoptimized />
          </div>
        </div>
      )}

      {showBuyerBid && (
        <LoginGateModal
          open={loginGateOpen}
          onClose={() => setLoginGateOpen(false)}
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
        <div className="fixed inset-0 z-[220] flex items-center justify-center bg-black/45 p-4">
          <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-5 shadow-2xl">
            <p className="text-xs font-bold uppercase tracking-wide text-gray-500">Proxy bidding</p>
            <h3 className="mt-1 text-lg font-extrabold text-[#1D3160]">Gestisci il tuo limite massimo</h3>
            <p className="mt-2 text-sm text-gray-600">
              Puoi aumentare il limite senza inviare una nuova offerta manuale. Il sistema aggiorna solo il tuo tetto massimo.
            </p>

            <div className="mt-4 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">Limite attuale</p>
              <p className="text-xl font-extrabold text-[#FF7300]">{fmtEur(myMaxBidEur)}</p>
            </div>

            <div className="mt-4">
              <label htmlFor="proxy-limit-input" className="mb-1 block text-xs font-bold uppercase tracking-wide text-gray-600">
                Nuovo limite massimo
              </label>
              <input
                id="proxy-limit-input"
                type="text"
                inputMode="decimal"
                value={proxyInput}
                onChange={(e) => {
                  setProxyInput(e.target.value);
                  setProxyInputError(null);
                }}
                placeholder="Es. 24,5"
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-base font-semibold text-gray-900 focus:border-[#FF7300] focus:outline-none focus:ring-2 focus:ring-[#FF7300]/20"
              />
              {proxyInputError && (
                <p className="mt-1 text-xs font-medium text-red-600">{proxyInputError}</p>
              )}
            </div>

            <div className="mt-5 flex items-center gap-2">
              <button
                type="button"
                onClick={increaseProxyLimit}
                disabled={updateProxyLimitMutation.isPending || cancelProxyLimitMutation.isPending}
                className="flex-1 rounded-lg bg-[#FF7300] px-4 py-2.5 text-xs font-bold uppercase tracking-wide text-white transition hover:bg-[#e86800]"
              >
                {updateProxyLimitMutation.isPending ? 'Salvataggio...' : 'Salva nuovo limite'}
              </button>
              <button
                type="button"
                onClick={closeProxyModal}
                disabled={updateProxyLimitMutation.isPending || cancelProxyLimitMutation.isPending}
                className="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-xs font-bold uppercase tracking-wide text-gray-700 transition hover:bg-gray-50"
              >
                Chiudi
              </button>
            </div>

            <button
              type="button"
              onClick={stopProxyBidding}
              disabled={updateProxyLimitMutation.isPending || cancelProxyLimitMutation.isPending}
              className="mt-3 w-full rounded-lg border border-red-300 bg-red-50 px-4 py-2.5 text-xs font-bold uppercase tracking-wide text-red-700 transition hover:bg-red-100"
            >
              {cancelProxyLimitMutation.isPending ? 'Disattivazione...' : 'Interrompi proxy bidding'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
