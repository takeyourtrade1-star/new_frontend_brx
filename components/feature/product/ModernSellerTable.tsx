'use client';

import { memo, useCallback, useEffect, useState, type ReactNode } from 'react';
import { AuctionGavelIcon } from '@/components/ui/AuctionGavelIcon';
import Link from 'next/link';
import {
  ChevronLeft,
  ChevronRight,
  Loader2,
  MessageSquare,
  Minus,
  Pencil,
  Plus,
  ShoppingCart,
  Star,
  X,
} from 'lucide-react';
import { ScambiIcon } from '@/components/ui/ScambiIcon';
import { FlagIcon } from '@/components/ui/FlagIcon';
import { ConditionBadge, type ConditionCode } from '@/components/ui/ConditionBadge';
import { CardImageCameraPeek } from '@/components/ui/CardImageCameraPeek';
import { cn, formatEuroNoSpace } from '@/lib/utils';
import { type ListingItem } from '@/lib/api/sync-client';
import { auctionDetailPath } from '@/lib/auction/auction-paths';
import { formatAuctionCountdown } from '@/lib/auction/auction-countdown';
import type { AuctionUI } from '@/lib/auction/auction-adapter';
import { listingConditionCode, type MarketplaceRow } from '@/lib/product-detail/marketplace-rows';
import { listingRowKey } from '@/lib/marketplace/listing-map';
import { getListingPhotos } from '@/lib/api/listing-photo-client';
import { MarketplaceNowProvider, useMarketplaceNowMs } from '@/lib/hooks/use-marketplace-now-ms';

const CONDITION_TEXT_TO_CODE: Record<string, ConditionCode> = {
  'Near Mint': 'NM',
  near_mint: 'NM',
  'Lightly Played': 'SP',
  lightly_played: 'SP',
  'Slightly Played': 'SP',
  'Moderately Played': 'MP',
  moderately_played: 'MP',
  'Heavily Played': 'PL',
  heavily_played: 'PL',
  Played: 'PL',
  Damaged: 'PO',
  damaged: 'PO',
  Poor: 'PO',
};

import { getCardLanguageFlagCode } from '@/lib/card-languages';

function getConditionCode(conditionText?: string | null): ConditionCode {
  if (!conditionText) return 'NM';
  return CONDITION_TEXT_TO_CODE[conditionText] ?? 'NM';
}

function languageFlagCode(language?: string | null): string | null {
  if (!language) return null;
  return getCardLanguageFlagCode(language);
}

function hashSellerId(sellerId: string): number {
  let h = 0;
  for (let i = 0; i < sellerId.length; i++) {
    h = (Math.imul(31, h) + sellerId.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

/** Placeholder stabile finché l'API non espone rating/vendite per venditore. */
function getSellerReputation(item: ListingItem) {
  const extended = item as ListingItem & {
    seller_rating?: number | null;
    seller_review_count?: number | null;
    seller_sales_count?: number | null;
  };
  if (
    extended.seller_rating != null &&
    extended.seller_review_count != null &&
    extended.seller_sales_count != null
  ) {
    return {
      rating: extended.seller_rating,
      reviewCount: extended.seller_review_count,
      salesCount: extended.seller_sales_count,
    };
  }
  const h = hashSellerId(item.seller_id);
  return {
    rating: (42 + (h % 8)) / 10,
    reviewCount: 80 + (h % 920),
    salesCount: 150 + (h % 9850),
  };
}

function formatReviewRating(rating: number): string {
  return rating.toLocaleString('it-IT', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
}

/** Rating API: 0–5 oppure percentuale 0–100. */
function normalizeRatingToFive(rating: number): number {
  if (rating > 5) return (rating / 100) * 5;
  return rating;
}

function formatSalesCount(count: number): string {
  if (count >= 1_000_000) {
    return `${(count / 1_000_000).toLocaleString('it-IT', { maximumFractionDigits: 1 })}M`;
  }
  if (count >= 1_000) {
    return `${(count / 1_000).toLocaleString('it-IT', { maximumFractionDigits: 1 })}K`;
  }
  return count.toLocaleString('it-IT');
}

const MOCK_SELLER_DESCRIPTIONS = [
  'Spedizione entro 24h in bustine protettive e toploader.',
  'Carta dal mazzo personale, sempre conservata in perfect fit.',
  'Possibile leggera curvatura da mazzo; foto aggiuntive su richiesta.',
  'Vendo solo se unita ad altro acquisto (vedi altre inserzioni).',
  'Articolo come da foto, spedizione tracciata in tutta Europa.',
];

function getListingDescription(item: ListingItem): string {
  const trimmed = item.description?.trim();
  if (trimmed) return trimmed;
  const h = hashSellerId(String(item.item_id));
  return MOCK_SELLER_DESCRIPTIONS[h % MOCK_SELLER_DESCRIPTIONS.length] ?? MOCK_SELLER_DESCRIPTIONS[0];
}

function profileHrefForSeller(username: string): string {
  return `/users/${encodeURIComponent(username)}`;
}

function MarketplaceSellerCell({
  username,
  country,
  rating,
  reviewCount,
  salesCount,
  isPro,
}: {
  username: string;
  country?: string | null;
  rating: number;
  reviewCount: number;
  salesCount: number;
  isPro?: boolean;
}) {
  const href = profileHrefForSeller(username);
  const reviewTitle = `${reviewCount.toLocaleString('it-IT')} recensioni`;

  return (
    <div className="flex min-w-0 items-center gap-1.5 overflow-hidden text-xs leading-none whitespace-nowrap">
      <Link
        href={href}
        className="inline-flex shrink-0 items-center gap-0.5 text-amber-800 hover:text-amber-900"
        title={reviewTitle}
      >
        <Star className="h-3 w-3 shrink-0 fill-amber-400 text-amber-500" aria-hidden />
        <span className="font-semibold tabular-nums">{formatReviewRating(rating)}/5</span>
      </Link>
      <span className="shrink-0 text-slate-300">·</span>
      <span className="shrink-0 tabular-nums text-slate-500" title="Vendite completate">
        {formatSalesCount(salesCount)}
      </span>
      <span className="shrink-0 text-slate-300">·</span>
      {country ? <FlagIcon country={country} size="xs" className="shrink-0" /> : null}
      <Link href={href} className="min-w-0 truncate font-semibold text-[#2563eb] hover:underline">
        {username}
      </Link>
      {isPro ? (
        <span className="shrink-0 rounded bg-slate-700 px-1 py-px text-[7px] font-bold uppercase text-white">Pro</span>
      ) : null}
    </div>
  );
}

// PERF: row seller cell only re-renders when its reputation props change.
const MemoMarketplaceSellerCell = memo(MarketplaceSellerCell);

function dedupePhotoUrls(urls: (string | null | undefined)[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of urls) {
    const u = raw?.trim();
    if (!u || seen.has(u)) continue;
    seen.add(u);
    out.push(u);
  }
  return out;
}

function getAuctionPhotoUrls(
  a: { photoUrls?: string[]; imageFront?: string; imageBack?: string; image?: string },
  fallback?: string
): string[] {
  return dedupePhotoUrls([...(a.photoUrls ?? []), a.imageFront, a.imageBack, a.image, fallback]);
}

function getListingPhotoUrls(fallback?: string | null): string[] {
  return dedupePhotoUrls([fallback]);
}

function useListingRowImageUrls(item: ListingItem, fallback?: string | null): string[] {
  const [urls, setUrls] = useState<string[]>(() => getListingPhotoUrls(fallback));

  useEffect(() => {
    const base = getListingPhotoUrls(fallback);
    // eslint-disable-next-line no-console
    console.log('[ModernSellerTable] useListingRowImageUrls', { itemId: item.item_id, listingId: item.marketplace_listing_id, source: item.listing_source });
    if (item.listing_source !== 'marketplace' || !item.marketplace_listing_id) {
      // eslint-disable-next-line no-console
      console.log('[ModernSellerTable] skipping photo fetch (not marketplace or no id)', { itemId: item.item_id });
      setUrls(base);
      return;
    }

    let cancelled = false;
    void getListingPhotos(item.marketplace_listing_id)
      .then((photos) => {
        if (cancelled) return;
        const first = photos[0]?.cdn_url;
        // eslint-disable-next-line no-console
        console.log('[ModernSellerTable] photo fetch result', { listingId: item.marketplace_listing_id, first, count: photos.length });
        setUrls(dedupePhotoUrls([first, fallback]));
      })
      .catch((err) => {
        if (!cancelled) {
          // eslint-disable-next-line no-console
          console.warn('[ModernSellerTable] photo fetch error', { listingId: item.marketplace_listing_id, err });
          setUrls(base);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [item.listing_source, item.marketplace_listing_id, fallback]);

  return urls;
}

function MarketplacePhotoCarousel({
  imageUrls,
  name,
  compact = false,
}: {
  imageUrls: string[];
  name: string;
  compact?: boolean;
}) {
  const [index, setIndex] = useState(0);
  const urls = imageUrls.filter(Boolean);
  if (urls.length === 0) return null;

  const safeIndex = index % urls.length;
  const current = urls[safeIndex];
  const hasMultiple = urls.length > 1;
  const peekClass = compact ? '!h-6 !w-6' : '!h-7 !w-7';

  return (
    <div className="flex shrink-0 items-center gap-px">
      {hasMultiple && !compact ? (
        <button
          type="button"
          onClick={() => setIndex((i) => (i - 1 + urls.length) % urls.length)}
          className="inline-flex h-6 w-5 items-center justify-center rounded-sm text-slate-500 hover:bg-slate-100"
          aria-label="Foto precedente"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
        </button>
      ) : null}
      <CardImageCameraPeek
        key={current}
        imageUrl={current}
        name={name}
        className={cn(peekClass, 'shrink-0 text-[#3D65C6]')}
        ariaLabel={`Anteprima foto ${hasMultiple ? `${safeIndex + 1} di ${urls.length}` : ''}`.trim()}
      />
      {hasMultiple ? (
        compact ? (
          <button
            type="button"
            onClick={() => setIndex((i) => (i + 1) % urls.length)}
            className="ml-px text-[9px] font-semibold tabular-nums text-slate-500"
            aria-label="Foto successiva"
          >
            {safeIndex + 1}/{urls.length}
          </button>
        ) : (
          <>
            <span className="min-w-[1.4rem] text-center text-[10px] font-semibold tabular-nums text-slate-500">
              {safeIndex + 1}/{urls.length}
            </span>
            <button
              type="button"
              onClick={() => setIndex((i) => (i + 1) % urls.length)}
              className="inline-flex h-6 w-5 items-center justify-center rounded-sm text-slate-500 hover:bg-slate-100"
              aria-label="Foto successiva"
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </>
        )
      ) : null}
    </div>
  );
}

function MobileDescriptionNote({ description }: { description: string }) {
  const [open, setOpen] = useState(false);
  const trimmed = description.trim();
  if (!trimmed) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[#3D65C6] hover:bg-sky-50"
        aria-label="Note venditore"
        title="Note venditore"
      >
        <MessageSquare className="h-3.5 w-3.5" strokeWidth={2} />
      </button>
      {open ? (
        <div
          className="fixed inset-0 z-[200] flex items-end justify-center bg-black/40 p-3 sm:items-center"
          role="dialog"
          aria-modal="true"
          aria-label="Note venditore"
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-t-2xl bg-white p-4 shadow-2xl sm:rounded-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-2 flex items-center justify-between gap-2">
              <h4 className="text-xs font-bold uppercase tracking-wide text-slate-500">Note venditore</h4>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="inline-flex h-7 w-7 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100"
                aria-label="Chiudi"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <p className="text-sm leading-relaxed text-slate-600">{trimmed}</p>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="mt-4 w-full rounded-lg bg-slate-100 py-2.5 text-sm font-semibold text-slate-800"
            >
              Chiudi
            </button>
          </div>
        </div>
      ) : null}
    </>
  );
}

function MobileTraitLetters({ foil, signed, altered }: { foil?: boolean; signed?: boolean; altered?: boolean }) {
  if (!foil && !signed && !altered) return null;
  return (
    <span className="flex shrink-0 items-center gap-0.5 text-[8px] font-bold uppercase leading-none">
      {foil ? <span className="text-violet-700">F</span> : null}
      {signed ? <span className="text-sky-700">S</span> : null}
      {altered ? <span className="text-rose-700">A</span> : null}
    </span>
  );
}

function MobileProductAttributes({
  conditionCode,
  langFlag,
  langTitle,
  imageUrls,
  imageName,
  description,
  auctionTag,
  foil,
  signed,
  altered,
}: {
  conditionCode: ConditionCode;
  langFlag: string | null;
  langTitle?: string;
  imageUrls: string[];
  imageName?: string;
  description: string;
  auctionTag?: boolean;
  foil?: boolean;
  signed?: boolean;
  altered?: boolean;
}) {
  return (
    <div className="flex min-w-0 flex-1 items-center gap-1">
      <ConditionBadge condition={conditionCode} size="xs" />
      {langFlag ? <FlagIcon country={langFlag} size="xs" title={langTitle} className="shrink-0" /> : null}
      <MarketplacePhotoCarousel imageUrls={imageUrls} name={imageName ?? 'Carta'} compact />
      <MobileDescriptionNote description={description} />
      <MobileTraitLetters foil={foil} signed={signed} altered={altered} />
      {auctionTag ? (
        <span className="shrink-0 rounded bg-violet-100 px-1 py-px text-[8px] font-bold uppercase text-violet-800">
          Asta
        </span>
      ) : null}
    </div>
  );
}

// PERF: mobile attribute strip memoized per row props.
const MemoMobileProductAttributes = memo(MobileProductAttributes);

function MarketplaceProductInfoCell({
  conditionCode,
  langFlag,
  langTitle,
  imageUrls,
  imageName,
  description,
  auctionTag,
  foil,
  signed,
  altered,
}: {
  conditionCode: ConditionCode;
  langFlag: string | null;
  langTitle?: string;
  imageUrls: string[];
  imageName?: string;
  description: string;
  auctionTag?: boolean;
  foil?: boolean;
  signed?: boolean;
  altered?: boolean;
}) {
  return (
    <div className="flex min-w-0 items-center">
      <div className="flex shrink-0 items-center gap-1.5 border-r border-slate-200/90 pr-3">
        <ConditionBadge condition={conditionCode} size="sm" />
        {langFlag ? <FlagIcon country={langFlag} size="sm" title={langTitle} className="shrink-0" /> : null}
        <MarketplacePhotoCarousel imageUrls={imageUrls} name={imageName ?? 'Carta'} />
        {auctionTag ? (
          <span className="shrink-0 rounded bg-violet-100 px-1.5 py-0.5 text-[9px] font-bold uppercase leading-none text-violet-800">
            Asta
          </span>
        ) : null}
        {foil ? (
          <span className="shrink-0 text-[9px] font-bold uppercase text-violet-700" title="Foil">
            F
          </span>
        ) : null}
        {signed ? (
          <span className="shrink-0 text-[9px] font-bold uppercase text-sky-700" title="Firmata">
            S
          </span>
        ) : null}
        {altered ? (
          <span className="shrink-0 text-[9px] font-bold uppercase text-rose-700" title="Alterata">
            A
          </span>
        ) : null}
      </div>
      <p
        className="min-w-0 flex-1 truncate pl-3 text-[11px] italic leading-snug text-slate-500"
        title={description}
      >
        {description}
      </p>
    </div>
  );
}

// PERF: desktop product info cell memoized per row props.
const MemoMarketplaceProductInfoCell = memo(MarketplaceProductInfoCell);

// PERF: countdown ticks isolated — only these nodes subscribe to marketplaceNowMs.
function AuctionCountdownText({ endsAt, className }: { endsAt: string; className?: string }) {
  const nowMs = useMarketplaceNowMs();
  const remaining = new Date(endsAt).getTime() - nowMs;
  return (
    <span className={className}>
      {remaining <= 0 ? '—' : formatAuctionCountdown(remaining)}
    </span>
  );
}

function AuctionGavelLinkDesktop({ numericId, endsAt }: { numericId: number; endsAt: string }) {
  const nowMs = useMarketplaceNowMs();
  const remaining = new Date(endsAt).getTime() - nowMs;
  const label = remaining <= 0 ? '—' : formatAuctionCountdown(remaining);
  return (
    <div className="inline-flex items-center">
      <Link
        href={auctionDetailPath(String(numericId))}
        className="group relative z-10 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-violet-600 text-white shadow-sm transition hover:bg-violet-700"
        aria-label="Apri asta"
        title={`Asta · ${label}`}
      >
        <AuctionGavelIcon className="h-3.5 w-3.5" strokeWidth={2.25} animated />
      </Link>
      {/* Pillola tempo rimasto: bordo sinistro "fuso" sotto il bottone circolare */}
      <span className="-ml-3 inline-flex h-6 items-center rounded-r-full bg-violet-100 pl-4 pr-2 text-[10px] font-bold tabular-nums leading-none text-violet-700">
        {label}
      </span>
    </div>
  );
}

/** Tre colonne allineate: prezzo | quantità | azioni */
function MarketplaceOfferGrid({
  price,
  quantity,
  actions,
}: {
  price: ReactNode;
  quantity: ReactNode;
  actions: ReactNode;
}) {
  return (
    <div className="grid w-full grid-cols-[minmax(0,1fr)_2.75rem_6.5rem] items-center">
      <div className="pr-2 text-right text-sm font-bold tabular-nums text-[#1D3160]">{price}</div>
      <div className="text-center text-xs font-semibold tabular-nums text-slate-600">{quantity}</div>
      <div className="flex justify-end">{actions}</div>
    </div>
  );
}

function getAuctionDescription(a: { description?: string | null; numericId: number }): string {
  const trimmed = a.description?.trim();
  if (trimmed) return trimmed;
  const h = hashSellerId(String(a.numericId));
  return MOCK_SELLER_DESCRIPTIONS[h % MOCK_SELLER_DESCRIPTIONS.length] ?? MOCK_SELLER_DESCRIPTIONS[0];
}

const noopIsOwnListing = () => false;

type DesktopAuctionRowProps = {
  rowId: string;
  index: number;
  auction: AuctionUI;
  cardLanguage?: string | null;
  cardImageSrc?: string;
  cardName?: string;
  formatEuro: (n: number) => string;
};

// PERF: auction desktop row skips re-render unless row data changes; countdown isolated in child.
const DesktopAuctionRow = memo(function DesktopAuctionRow({
  rowId,
  index,
  auction: a,
  cardLanguage,
  cardImageSrc,
  cardName,
  formatEuro,
}: DesktopAuctionRowProps) {
  const sellerName = a.sellerDisplayName || a.seller;
  const auctionCondition = getConditionCode(a.condition);
  const auctionLang = languageFlagCode(cardLanguage);
  const auctionPhotos = getAuctionPhotoUrls(a, cardImageSrc);
  const auctionDesc = getAuctionDescription(a);

  return (
    <tr
      key={rowId}
      className={cn(
        'border-b border-gray-200 align-middle',
        index % 2 === 0 ? 'bg-violet-50/20' : 'bg-violet-50/35'
      )}
    >
      <td className="border-r border-gray-200/80 px-2.5 py-2">
        <MemoMarketplaceSellerCell
          username={sellerName}
          country={a.sellerCountry}
          rating={normalizeRatingToFive(a.sellerRating)}
          reviewCount={a.sellerReviewCount}
          salesCount={0}
        />
      </td>
      <td className="border-r border-gray-200/80 px-2.5 py-2">
        <MemoMarketplaceProductInfoCell
          conditionCode={auctionCondition}
          langFlag={auctionLang}
          langTitle={cardLanguage ?? undefined}
          imageUrls={auctionPhotos}
          imageName={a.title || cardName}
          description={auctionDesc}
          auctionTag
        />
      </td>
      <td className="px-2.5 py-2">
        <MarketplaceOfferGrid
          price={formatEuro(a.currentBidEur || a.startingBidEur)}
          quantity={null}
          actions={<AuctionGavelLinkDesktop numericId={a.numericId} endsAt={a.endsAt} />}
        />
      </td>
    </tr>
  );
});

type DesktopListingRowProps = {
  rowId: string;
  index: number;
  item: ListingItem;
  cardImageSrc?: string;
  cardName?: string;
  isOwn: boolean;
  isBusy: boolean;
  isCartOpen: boolean;
  cartQty: number;
  description: string;
  formatEuro: (n: number) => string;
  onOwnerQuantityChange?: (item: ListingItem, delta: -1 | 1) => Promise<void>;
  onOwnerEdit?: (item: ListingItem) => void;
  onAddToCart?: (item: ListingItem, quantity: number, sourceEl: HTMLElement) => void;
  onBuyNow?: (item: ListingItem, quantity: number) => void;
  onProposeTrade?: (item: ListingItem) => void;
  onOpenInlineCart: (item: ListingItem) => void;
  onCloseInlineCart: () => void;
  onSetCartQty: (rowKey: string, qty: number, max: number) => void;
};

// PERF: listing desktop row re-renders only when its item/cart/busy props change.
const DesktopListingRow = memo(function DesktopListingRow({
  rowId,
  index,
  item,
  cardImageSrc,
  cardName,
  isOwn,
  isBusy,
  isCartOpen,
  cartQty,
  description,
  formatEuro,
  onOwnerQuantityChange,
  onOwnerEdit,
  onAddToCart,
  onBuyNow,
  onProposeTrade,
  onOpenInlineCart,
  onCloseInlineCart,
  onSetCartQty,
}:DesktopListingRowProps) {
  const conditionCode = listingConditionCode(item.condition);
  const langFlag = languageFlagCode(item.mtg_language);
  const rep = getSellerReputation(item);
  const rowKey = listingRowKey(item);
  const imageUrls = useListingRowImageUrls(item, cardImageSrc);

  return (
    <tr
      key={rowId}
      className={cn(
        'border-b border-gray-200 align-middle transition-colors',
        index % 2 === 0 ? 'bg-white' : 'bg-slate-50/60',
        isOwn && 'bg-sky-50/40',
        isCartOpen && 'bg-orange-50/40',
        !isCartOpen && !isOwn && 'hover:bg-orange-50/20'
      )}
    >
      <td className="border-r border-gray-200/80 px-2.5 py-2">
        <MemoMarketplaceSellerCell
          username={item.seller_display_name}
          country={item.country}
          rating={rep.rating}
          reviewCount={rep.reviewCount}
          salesCount={rep.salesCount}
          isPro={item.seller_account_type === 'business'}
        />
      </td>

      <td className="border-r border-gray-200/80 px-2.5 py-2">
        <MemoMarketplaceProductInfoCell
          conditionCode={conditionCode}
          langFlag={langFlag}
          langTitle={item.mtg_language ?? undefined}
          imageUrls={imageUrls}
          imageName={cardName ?? item.seller_display_name}
          description={description}
          foil={item.mtg_foil}
          signed={item.signed}
          altered={item.altered}
        />
      </td>

      <td className="px-2.5 py-2">
        <MarketplaceOfferGrid
          price={formatEuro(item.price_cents / 100)}
          quantity={item.quantity}
          actions={
            isOwn ? (
              <div className="inline-flex items-center rounded-sm border border-slate-200 bg-white">
                <button
                  type="button"
                  disabled={isBusy}
                  onClick={() => onOwnerQuantityChange?.(item, -1)}
                  className="inline-flex h-7 w-6 items-center justify-center text-slate-600 hover:bg-slate-50 disabled:opacity-40"
                  aria-label="Diminuisci quantità"
                >
                  {isBusy ? <Loader2 className="h-3 w-3 animate-spin" /> : <Minus className="h-3 w-3" />}
                </button>
                <span className="inline-flex h-7 min-w-[1.25rem] items-center justify-center border-x border-slate-200 text-center text-[11px] font-bold tabular-nums text-slate-800">
                  {item.quantity}
                </span>
                <button
                  type="button"
                  disabled={isBusy || item.quantity >= 999}
                  onClick={() => onOwnerQuantityChange?.(item, 1)}
                  className="inline-flex h-7 w-6 items-center justify-center text-slate-600 hover:bg-slate-50 disabled:opacity-40"
                  aria-label="Aumenta quantità"
                >
                  <Plus className="h-3 w-3" />
                </button>
                <button
                  type="button"
                  onClick={() => onOwnerEdit?.(item)}
                  className="inline-flex h-7 w-6 items-center justify-center border-l border-slate-200 text-slate-500 hover:bg-amber-50"
                  aria-label="Modifica inserzione"
                >
                  <Pencil className="h-3 w-3" />
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-end gap-1">
                {onProposeTrade && (
                  <button
                    type="button"
                    onClick={() => onProposeTrade(item)}
                    className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-sm bg-[#FF7300] text-white hover:bg-[#e86a00]"
                    aria-label="Proponi scambio"
                    title="Proponi scambio"
                  >
                    <ScambiIcon className="h-3.5 w-3.5" strokeWidth={2.25} />
                  </button>
                )}
                {isCartOpen ? (
                <div className="inline-flex items-center rounded-sm border border-orange-200 bg-white">
                <button
                  type="button"
                  onClick={() => onSetCartQty(rowKey, cartQty - 1, item.quantity)}
                  disabled={cartQty <= 1}
                  className="inline-flex h-7 w-6 items-center justify-center text-slate-500 disabled:opacity-40"
                  aria-label="Meno"
                >
                  <Minus className="h-3 w-3" />
                </button>
                <span className="inline-flex h-7 min-w-[1.25rem] items-center justify-center border-x border-orange-100 text-center text-[11px] font-bold tabular-nums">
                  {cartQty}
                </span>
                <button
                  type="button"
                  onClick={() => onSetCartQty(rowKey, cartQty + 1, item.quantity)}
                  disabled={cartQty >= item.quantity}
                  className="inline-flex h-7 w-6 items-center justify-center text-slate-500 disabled:opacity-40"
                  aria-label="Più"
                >
                  <Plus className="h-3 w-3" />
                </button>
                {onBuyNow ? (
                  <button
                    type="button"
                    onClick={() => {
                      onBuyNow(item, cartQty);
                      onCloseInlineCart();
                    }}
                    className="inline-flex h-7 min-w-[2.25rem] items-center justify-center border-l border-orange-200 bg-emerald-600 px-1 text-[9px] font-bold uppercase text-white hover:bg-emerald-700"
                    aria-label="Acquista ora"
                    title="Acquista ora"
                  >
                    Buy
                  </button>
                ) : null}
                <button
                  type="button"
                  onClick={(e) => {
                    onAddToCart?.(item, cartQty, e.currentTarget);
                    onCloseInlineCart();
                  }}
                  className="inline-flex h-7 w-7 items-center justify-center border-l border-orange-200 bg-[#FF7300] text-white hover:bg-[#e86a00]"
                  aria-label="Conferma carrello"
                >
                  <ShoppingCart className="h-3.5 w-3.5" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => onOpenInlineCart(item)}
                className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-sm bg-[#2563eb] text-white hover:bg-[#1d4ed8]"
                aria-label="Aggiungi al carrello"
                title="Acquista"
              >
                <ShoppingCart className="h-3.5 w-3.5" strokeWidth={2.25} />
              </button>
                )}
              </div>
            )
          }
        />
      </td>
    </tr>
  );
});

type MobileAuctionRowProps = {
  rowId: string;
  index: number;
  auction: AuctionUI;
  cardLanguage?: string | null;
  cardImageSrc?: string;
  cardName?: string;
  formatEuro: (n: number) => string;
};

// PERF: mobile auction row memoized; countdown isolated in child.
const MobileAuctionRow = memo(function MobileAuctionRow({
  rowId,
  index,
  auction: a,
  cardLanguage,
  cardImageSrc,
  cardName,
  formatEuro,
}: MobileAuctionRowProps) {
  const sellerName = a.sellerDisplayName || a.seller;
  const auctionCondition = getConditionCode(a.condition);
  const auctionLang = languageFlagCode(cardLanguage);
  const auctionPhotos = getAuctionPhotoUrls(a, cardImageSrc);
  const auctionDesc = getAuctionDescription(a);

  return (
    <article
      key={rowId}
      className={cn(
        'flex gap-2 border-b border-slate-200/90 px-3 py-2.5',
        index % 2 === 0 ? 'bg-violet-50/25' : 'bg-violet-50/40'
      )}
    >
      <div className="min-w-0 flex-1">
        <MemoMarketplaceSellerCell
          username={sellerName}
          country={a.sellerCountry}
          rating={normalizeRatingToFive(a.sellerRating)}
          reviewCount={a.sellerReviewCount}
          salesCount={0}
        />
        <div className="mt-1.5 flex items-center justify-between gap-2">
          <MemoMobileProductAttributes
            conditionCode={auctionCondition}
            langFlag={auctionLang}
            langTitle={cardLanguage ?? undefined}
            imageUrls={auctionPhotos}
            imageName={a.title || cardName}
            description={auctionDesc}
            auctionTag
          />
          <div className="flex shrink-0 items-baseline gap-1.5 tabular-nums">
            <AuctionCountdownText endsAt={a.endsAt} className="text-xs font-medium text-violet-700" />
            <span className="text-sm font-bold text-slate-900">
              {formatEuro(a.currentBidEur || a.startingBidEur)}
            </span>
          </div>
        </div>
      </div>
      <div className="flex shrink-0 items-center self-center">
        <Link
          href={auctionDetailPath(String(a.numericId))}
          className="group inline-flex h-9 w-9 items-center justify-center rounded-full bg-violet-600 text-white shadow-sm"
          aria-label="Apri asta"
        >
          <AuctionGavelIcon className="h-4 w-4" strokeWidth={2.25} animated />
        </Link>
      </div>
    </article>
  );
});

type MobileListingRowProps = DesktopListingRowProps;

// PERF: mobile listing row re-renders only when its item/cart/busy props change.
const MobileListingRow = memo(function MobileListingRow({
  rowId,
  index,
  item,
  cardImageSrc,
  cardName,
  isOwn,
  isBusy,
  isCartOpen,
  cartQty,
  description,
  formatEuro,
  onOwnerQuantityChange,
  onOwnerEdit,
  onAddToCart,
  onBuyNow,
  onProposeTrade,
  onOpenInlineCart,
  onCloseInlineCart,
  onSetCartQty,
}:MobileListingRowProps) {
  const conditionCode = listingConditionCode(item.condition);
  const langFlag = languageFlagCode(item.mtg_language);
  const rep = getSellerReputation(item);
  const rowKey = listingRowKey(item);
  const imageUrls = useListingRowImageUrls(item, cardImageSrc);

  return (
    <article
      key={rowId}
      className={cn(
        'flex gap-2 border-b border-slate-200/90 px-3 py-2.5',
        index % 2 === 0 ? 'bg-white' : 'bg-slate-50/60',
        isOwn && 'bg-sky-50/35',
        isCartOpen && 'bg-orange-50/35'
      )}
    >
      <div className="min-w-0 flex-1">
        <MemoMarketplaceSellerCell
          username={item.seller_display_name}
          country={item.country}
          rating={rep.rating}
          reviewCount={rep.reviewCount}
          salesCount={rep.salesCount}
          isPro={item.seller_account_type === 'business'}
        />
        <div className="mt-1.5 flex items-center justify-between gap-2">
          <MemoMobileProductAttributes
            conditionCode={conditionCode}
            langFlag={langFlag}
            langTitle={item.mtg_language ?? undefined}
            imageUrls={imageUrls}
            imageName={cardName ?? item.seller_display_name}
            description={description}
            foil={item.mtg_foil}
            signed={item.signed}
            altered={item.altered}
          />
          <div className="flex shrink-0 items-baseline gap-1.5 tabular-nums">
            <span className="text-xs font-medium text-slate-600">{item.quantity}</span>
            <span className="text-sm font-bold text-slate-900">{formatEuro(item.price_cents / 100)}</span>
          </div>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-1.5 self-center">
        {!isOwn && onProposeTrade && (
          <button
            type="button"
            onClick={() => onProposeTrade(item)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-sm bg-[#FF7300] text-white shadow-sm"
            aria-label="Proponi scambio"
            title="Proponi scambio"
          >
            <ScambiIcon className="h-4 w-4" strokeWidth={2.25} />
          </button>
        )}
        {isOwn ? (
          <div className="inline-flex flex-col overflow-hidden rounded-sm border border-slate-200 bg-white shadow-sm">
              <div className="flex items-center border-b border-slate-200">
              <button
                type="button"
                disabled={isBusy}
                onClick={() => onOwnerQuantityChange?.(item, -1)}
                className="inline-flex h-8 w-8 items-center justify-center text-slate-600 disabled:opacity-40"
                aria-label="Diminuisci"
              >
                {isBusy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Minus className="h-3.5 w-3.5" />}
              </button>
              <span className="inline-flex h-8 min-w-[1.5rem] items-center justify-center border-x border-slate-200 text-center text-xs font-bold tabular-nums">
                {item.quantity}
              </span>
              <button
                type="button"
                disabled={isBusy || item.quantity >= 999}
                onClick={() => onOwnerQuantityChange?.(item, 1)}
                className="inline-flex h-8 w-8 items-center justify-center text-slate-600 disabled:opacity-40"
                aria-label="Aumenta"
              >
                <Plus className="h-3.5 w-3.5" />
              </button>
            </div>
            <button
              type="button"
              onClick={() => onOwnerEdit?.(item)}
              className="inline-flex h-7 w-full items-center justify-center text-slate-500 hover:bg-amber-50"
              aria-label="Modifica"
            >
              <Pencil className="h-3.5 w-3.5" />
            </button>
          </div>
        ) : isCartOpen ? (
          <div className="inline-flex flex-col overflow-hidden rounded-sm border border-orange-200 bg-white shadow-sm">
            <div className="flex items-center">
              <button
                type="button"
                onClick={() => onSetCartQty(rowKey, cartQty - 1, item.quantity)}
                disabled={cartQty <= 1}
                className="inline-flex h-8 w-8 items-center justify-center disabled:opacity-40"
                aria-label="Meno"
              >
                <Minus className="h-3.5 w-3.5" />
              </button>
              <span className="inline-flex h-8 min-w-[1.5rem] items-center justify-center border-x border-orange-100 text-center text-xs font-bold tabular-nums">
                {cartQty}
              </span>
              <button
                type="button"
                onClick={() => onSetCartQty(rowKey, cartQty + 1, item.quantity)}
                disabled={cartQty >= item.quantity}
                className="inline-flex h-8 w-8 items-center justify-center disabled:opacity-40"
                aria-label="Più"
              >
                <Plus className="h-3.5 w-3.5" />
              </button>
            </div>
            {onBuyNow ? (
              <button
                type="button"
                onClick={() => {
                  onBuyNow(item, cartQty);
                  onCloseInlineCart();
                }}
                className="inline-flex h-8 w-full items-center justify-center border-t border-orange-100 bg-emerald-600 text-[10px] font-bold uppercase text-white"
                aria-label="Acquista ora"
              >
                Buy
              </button>
            ) : null}
            <button
              type="button"
              onClick={(e) => {
                onAddToCart?.(item, cartQty, e.currentTarget);
                onCloseInlineCart();
              }}
              className="inline-flex h-8 w-full items-center justify-center bg-[#2563eb] text-white"
              aria-label="Aggiungi al carrello"
            >
              <ShoppingCart className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => onOpenInlineCart(item)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-sm bg-[#2563eb] text-white shadow-sm"
            aria-label="Aggiungi al carrello"
          >
            <ShoppingCart className="h-4 w-4" strokeWidth={2.25} />
          </button>
        )}
      </div>
    </article>
  );
});

interface ModernSellerTableProps {
  rows?: MarketplaceRow[];
  listings?: ListingItem[];
  loading?: boolean;
  auctionsLoading?: boolean;
  error?: string | null;
  emptyMessage?: string;
  cardImageSrc?: string;
  cardName?: string;
  /** Lingua carta catalogo (per righe asta senza lingua esplicita). */
  cardLanguage?: string | null;
  onAddToCart?: (item: ListingItem, quantity: number, sourceEl: HTMLElement) => void;
  onBuyNow?: (item: ListingItem, quantity: number) => void;
  onProposeTrade?: (item: ListingItem) => void;
  isOwnListing?: (item: ListingItem) => boolean;
  onOwnerEdit?: (item: ListingItem) => void;
  onOwnerQuantityChange?: (item: ListingItem, delta: -1 | 1) => Promise<void>;
  busyItemId?: string | null;
}

function ModernSellerTableInner({
  rows,
  listings = [],
  loading = false,
  auctionsLoading = false,
  error = null,
  emptyMessage,
  cardImageSrc,
  cardName,
  cardLanguage,
  onAddToCart,
  onBuyNow,
  onProposeTrade,
  isOwnListing = noopIsOwnListing,
  onOwnerEdit,
  onOwnerQuantityChange,
  busyItemId = null,
}: ModernSellerTableProps) {
  const displayRows: MarketplaceRow[] =
    rows ??
    listings.map((l) => ({
      kind: 'listing' as const,
      id: `listing-${listingRowKey(l)}`,
      listing: l,
    }));
  // PERF: stable formatter reference for memoized row children.
  const formatEuro = useCallback((n: number) => formatEuroNoSpace(n, 'it-IT'), []);
  const [activeCartRowKey, setActiveCartRowKey] = useState<string | null>(null);
  const [cartQtyByRow, setCartQtyByRow] = useState<Record<string, number>>({});

  const getCartQty = useCallback(
    (item: ListingItem) => {
      const key = listingRowKey(item);
      const stored = cartQtyByRow[key];
      if (stored != null) return Math.min(item.quantity, Math.max(1, stored));
      return 1;
    },
    [cartQtyByRow],
  );

  const setCartQty = useCallback((rowKey: string, qty: number, max: number) => {
    setCartQtyByRow((prev) => ({
      ...prev,
      [rowKey]: Math.min(max, Math.max(1, qty)),
    }));
  }, []);

  // PERF: stable cart open/close handlers keep memoized rows from invalidating.
  const openInlineCart = useCallback((item: ListingItem) => {
    const key = listingRowKey(item);
    setActiveCartRowKey(key);
    setCartQtyByRow((prev) => ({
      ...prev,
      [key]: Math.min(item.quantity, Math.max(1, prev[key] ?? 1)),
    }));
  }, []);

  const closeInlineCart = useCallback(() => setActiveCartRowKey(null), []);

  if (loading || auctionsLoading) {
    return (
      <div className="px-4 py-8 text-center text-sm text-gray-500">
        <Loader2 className="mx-auto mb-2 h-5 w-5 animate-spin text-gray-400" />
        Caricamento offerte…
      </div>
    );
  }

  if (error) {
    return (
      <div className="px-4 py-8 text-center text-sm text-amber-600">{error}</div>
    );
  }

  if (displayRows.length === 0) {
    return (
      <div className="px-4 py-10 text-center text-sm text-gray-600">
        {emptyMessage ?? 'Presto ci saranno articoli in vendita disponibili.'}
      </div>
    );
  }

  return (
    <>
      {/* Desktop — layout Cardmarket compatto */}
      <table className="hidden w-full table-fixed border-collapse text-left text-sm sm:table">
        <colgroup>
          <col style={{ width: '22%' }} />
          <col style={{ width: '46%' }} />
          <col style={{ width: '32%' }} />
        </colgroup>
        <thead>
          <tr className="bg-[#1D3160] text-[11px] font-semibold uppercase tracking-wide text-white">
            <th className="border-r border-white/15 px-2.5 py-2">Venditore</th>
            <th className="border-r border-white/15 px-2.5 py-2">Informazioni sul prodotto</th>
            <th className="px-0 py-0">
              <div className="grid grid-cols-[minmax(0,1fr)_2.75rem_6.5rem] border-l border-white/10 px-2.5 py-2 text-right">
                <span>Offerta</span>
                <span className="sr-only">Quantità</span>
                <span className="sr-only">Azioni</span>
              </div>
            </th>
          </tr>
        </thead>
        <tbody>
          {displayRows.map((row, index) => {
            if (row.kind === 'auction') {
              return (
                <DesktopAuctionRow
                  key={row.id}
                  rowId={row.id}
                  index={index}
                  auction={row.auction}
                  cardLanguage={cardLanguage}
                  cardImageSrc={cardImageSrc}
                  cardName={cardName}
                  formatEuro={formatEuro}
                />
              );
            }

            const item = row.listing;
            const isOwn = isOwnListing(item);
            const rowKey = listingRowKey(item);
            const isBusy = busyItemId === rowKey;
            const isCartOpen = activeCartRowKey === rowKey;
            const cartQty = getCartQty(item);
            const description = getListingDescription(item);

            return (
              <DesktopListingRow
                key={row.id}
                rowId={row.id}
                index={index}
                item={item}
                cardImageSrc={cardImageSrc}
                cardName={cardName}
                isOwn={isOwn}
                isBusy={isBusy}
                isCartOpen={isCartOpen}
                cartQty={cartQty}
                description={description}
                formatEuro={formatEuro}
                onOwnerQuantityChange={onOwnerQuantityChange}
                onOwnerEdit={onOwnerEdit}
                onAddToCart={onAddToCart}
                onBuyNow={onBuyNow}
                onProposeTrade={onProposeTrade}
                onOpenInlineCart={openInlineCart}
                onCloseInlineCart={closeInlineCart}
                onSetCartQty={setCartQty}
              />
            );
          })}
        </tbody>
      </table>

      {/* Mobile — layout Cardmarket: venditore | articolo+prezzo | azione */}
      <div className="sm:hidden">
        {displayRows.map((row, index) => {
          if (row.kind === 'auction') {
            return (
              <MobileAuctionRow
                key={row.id}
                rowId={row.id}
                index={index}
                auction={row.auction}
                cardLanguage={cardLanguage}
                cardImageSrc={cardImageSrc}
                cardName={cardName}
                formatEuro={formatEuro}
              />
            );
          }

          const item = row.listing;
          const isOwn = isOwnListing(item);
          const rowKey = listingRowKey(item);
          const isBusy = busyItemId === rowKey;
          const isCartOpen = activeCartRowKey === rowKey;
          const cartQty = getCartQty(item);
          const description = getListingDescription(item);

          return (
            <MobileListingRow
              key={row.id}
              rowId={row.id}
              index={index}
              item={item}
              cardImageSrc={cardImageSrc}
              cardName={cardName}
              isOwn={isOwn}
              isBusy={isBusy}
              isCartOpen={isCartOpen}
              cartQty={cartQty}
              description={description}
              formatEuro={formatEuro}
              onOwnerQuantityChange={onOwnerQuantityChange}
              onOwnerEdit={onOwnerEdit}
              onAddToCart={onAddToCart}
              onBuyNow={onBuyNow}
              onOpenInlineCart={openInlineCart}
              onCloseInlineCart={closeInlineCart}
              onSetCartQty={setCartQty}
            />
          );
        })}
      </div>
    </>
  );
}

// PERF: memoized table shell; timer provider keeps parent/detail view off 1s ticks.
export const ModernSellerTable = memo(function ModernSellerTable(props: ModernSellerTableProps) {
  return (
    <MarketplaceNowProvider>
      <ModernSellerTableInner {...props} />
    </MarketplaceNowProvider>
  );
});
