'use client';

import { useCallback, useState, type ReactNode } from 'react';
import Link from 'next/link';
import {
  Gavel,
  Loader2,
  Minus,
  Pencil,
  Plus,
  ShoppingCart,
  Star,
} from 'lucide-react';
import { FlagIcon } from '@/components/ui/FlagIcon';
import { ConditionBadge, type ConditionCode } from '@/components/ui/ConditionBadge';
import { CardImageCameraPeek } from '@/components/ui/CardImageCameraPeek';
import { cn, formatEuroNoSpace } from '@/lib/utils';
import { type ListingItem } from '@/lib/api/sync-client';
import { auctionDetailPath } from '@/lib/auction/auction-paths';
import { listingConditionCode, type MarketplaceRow } from '@/lib/product-detail/marketplace-rows';

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

function formatCountdownDuration(ms: number): string {
  if (ms <= 0) return '—';
  const totalMinutes = Math.ceil(ms / 60000);
  const days = Math.floor(totalMinutes / (24 * 60));
  const hours = Math.floor((totalMinutes % (24 * 60)) / 60);
  const minutes = totalMinutes % 60;
  if (days > 0) return `${days}g ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
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
    <div className="flex min-w-0 items-center gap-1 overflow-hidden text-[11px] leading-none whitespace-nowrap">
      <Link
        href={href}
        className="inline-flex shrink-0 items-center gap-0.5 text-amber-800 hover:text-amber-900"
        title={reviewTitle}
      >
        <Star className="h-2.5 w-2.5 shrink-0 fill-amber-400 text-amber-500" aria-hidden />
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

function MarketplaceProductInfoCell({
  conditionCode,
  langFlag,
  langTitle,
  imageUrl,
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
  imageUrl?: string | null;
  imageName?: string;
  description: string;
  auctionTag?: boolean;
  foil?: boolean;
  signed?: boolean;
  altered?: boolean;
}) {
  return (
    <div className="flex min-w-0 items-center gap-1 overflow-hidden">
      <ConditionBadge condition={conditionCode} size="xs" />
      {langFlag ? <FlagIcon country={langFlag} size="xs" title={langTitle} className="shrink-0" /> : null}
      {imageUrl ? (
        <CardImageCameraPeek
          imageUrl={imageUrl}
          name={imageName ?? 'Carta'}
          className="!h-3.5 !w-3.5 shrink-0 text-[#3D65C6]"
          ariaLabel="Anteprima foto"
        />
      ) : null}
      {auctionTag ? (
        <span className="shrink-0 rounded bg-violet-100 px-1 py-px text-[8px] font-bold uppercase leading-none text-violet-800">
          Asta
        </span>
      ) : null}
      {foil ? (
        <span className="shrink-0 text-[8px] font-bold uppercase text-violet-700" title="Foil">
          F
        </span>
      ) : null}
      {signed ? (
        <span className="shrink-0 text-[8px] font-bold uppercase text-sky-700" title="Firmata">
          S
        </span>
      ) : null}
      {altered ? (
        <span className="shrink-0 text-[8px] font-bold uppercase text-rose-700" title="Alterata">
          A
        </span>
      ) : null}
      <p className="min-w-0 flex-1 truncate text-[10px] italic text-slate-500" title={description}>
        {description}
      </p>
    </div>
  );
}

function MarketplaceOfferCell({
  priceLabel,
  quantity,
  children,
}: {
  priceLabel: string;
  quantity: number | string;
  children: ReactNode;
}) {
  return (
    <div className="flex items-center justify-end gap-2 whitespace-nowrap">
      <span className="text-[13px] font-bold tabular-nums text-[#1D3160]">{priceLabel}</span>
      <span className="w-6 text-center text-[11px] font-medium tabular-nums text-slate-600">{quantity}</span>
      {children}
    </div>
  );
}

function getAuctionDescription(a: { description?: string | null; numericId: number }): string {
  const trimmed = a.description?.trim();
  if (trimmed) return trimmed;
  const h = hashSellerId(String(a.numericId));
  return MOCK_SELLER_DESCRIPTIONS[h % MOCK_SELLER_DESCRIPTIONS.length] ?? MOCK_SELLER_DESCRIPTIONS[0];
}

function getAuctionPhotoUrl(
  a: { photoUrls?: string[]; imageFront?: string; image?: string },
  fallback?: string
): string | null {
  return a.photoUrls?.[0] ?? a.imageFront ?? a.image ?? fallback ?? null;
}

interface ModernSellerTableProps {
  rows?: MarketplaceRow[];
  listings?: ListingItem[];
  loading?: boolean;
  auctionsLoading?: boolean;
  error?: string | null;
  nowMs?: number;
  emptyMessage?: string;
  cardImageSrc?: string;
  cardName?: string;
  /** Lingua carta catalogo (per righe asta senza lingua esplicita). */
  cardLanguage?: string | null;
  onAddToCart?: (item: ListingItem, quantity: number, sourceEl: HTMLElement) => void;
  isOwnListing?: (item: ListingItem) => boolean;
  onOwnerEdit?: (item: ListingItem) => void;
  onOwnerQuantityChange?: (item: ListingItem, delta: -1 | 1) => Promise<void>;
  busyItemId?: number | null;
}

export function ModernSellerTable({
  rows,
  listings = [],
  loading = false,
  auctionsLoading = false,
  error = null,
  nowMs = Date.now(),
  emptyMessage,
  cardImageSrc,
  cardName,
  cardLanguage,
  onAddToCart,
  isOwnListing = () => false,
  onOwnerEdit,
  onOwnerQuantityChange,
  busyItemId = null,
}: ModernSellerTableProps) {
  const displayRows: MarketplaceRow[] =
    rows ??
    listings.map((l) => ({
      kind: 'listing' as const,
      id: `listing-${l.item_id}`,
      listing: l,
    }));
  const formatEuro = (n: number) => formatEuroNoSpace(n, 'it-IT');
  const [activeCartItemId, setActiveCartItemId] = useState<number | null>(null);
  const [cartQtyByItem, setCartQtyByItem] = useState<Record<number, number>>({});

  const getCartQty = useCallback(
    (item: ListingItem) => {
      const stored = cartQtyByItem[item.item_id];
      if (stored != null) return Math.min(item.quantity, Math.max(1, stored));
      return 1;
    },
    [cartQtyByItem]
  );

  const setCartQty = useCallback((itemId: number, qty: number, max: number) => {
    setCartQtyByItem((prev) => ({
      ...prev,
      [itemId]: Math.min(max, Math.max(1, qty)),
    }));
  }, []);

  const openInlineCart = (item: ListingItem) => {
    setActiveCartItemId(item.item_id);
    setCartQty(item.item_id, getCartQty(item), item.quantity);
  };

  const closeInlineCart = () => setActiveCartItemId(null);

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
          <col style={{ width: '26%' }} />
          <col style={{ width: '52%' }} />
          <col style={{ width: '22%' }} />
        </colgroup>
        <thead>
          <tr className="bg-[#1D3160] text-[10px] font-semibold uppercase tracking-wide text-white">
            <th className="border-r border-white/15 px-2 py-1.5">Venditore</th>
            <th className="border-r border-white/15 px-2 py-1.5">Informazioni sul prodotto</th>
            <th className="px-2 py-1.5 text-right">Offerta</th>
          </tr>
        </thead>
        <tbody>
          {displayRows.map((row, index) => {
            if (row.kind === 'auction') {
              const a = row.auction;
              const remaining = new Date(a.endsAt).getTime() - nowMs;
              const sellerName = a.sellerDisplayName || a.seller;
              const auctionCondition = getConditionCode(a.condition);
              const auctionLang = languageFlagCode(cardLanguage);
              const auctionPhoto = getAuctionPhotoUrl(a, cardImageSrc);
              const auctionDesc = getAuctionDescription(a);

              return (
                <tr
                  key={row.id}
                  className={cn(
                    'border-b border-gray-200 align-middle',
                    index % 2 === 0 ? 'bg-violet-50/20' : 'bg-violet-50/35'
                  )}
                >
                  <td className="border-r border-gray-200/80 px-2 py-1">
                    <MarketplaceSellerCell
                      username={sellerName}
                      country={a.sellerCountry}
                      rating={normalizeRatingToFive(a.sellerRating)}
                      reviewCount={a.sellerReviewCount}
                      salesCount={0}
                    />
                  </td>
                  <td className="border-r border-gray-200/80 px-2 py-1">
                    <MarketplaceProductInfoCell
                      conditionCode={auctionCondition}
                      langFlag={auctionLang}
                      langTitle={cardLanguage ?? undefined}
                      imageUrl={auctionPhoto}
                      imageName={a.title || cardName}
                      description={auctionDesc}
                      auctionTag
                    />
                  </td>
                  <td className="px-2 py-1">
                    <div className="flex items-center justify-end gap-2 whitespace-nowrap">
                      <span className="text-[13px] font-bold tabular-nums text-[#1D3160]">
                        {formatEuro(a.currentBidEur || a.startingBidEur)}
                      </span>
                      <span className="w-10 text-center text-[10px] font-semibold tabular-nums text-violet-700">
                        {formatCountdownDuration(remaining)}
                      </span>
                      <Link
                        href={auctionDetailPath(String(a.numericId))}
                        className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-sm bg-violet-600 text-white shadow-sm transition hover:bg-violet-700"
                        aria-label="Apri asta"
                        title={`Asta · ${formatCountdownDuration(remaining)}`}
                      >
                        <Gavel className="h-3 w-3" strokeWidth={2.25} />
                      </Link>
                    </div>
                  </td>
                </tr>
              );
            }

            const item = row.listing;
            const isOwn = isOwnListing(item);
            const isBusy = busyItemId === item.item_id;
            const conditionCode = listingConditionCode(item.condition);
            const langFlag = languageFlagCode(item.mtg_language);
            const rep = getSellerReputation(item);
            const isCartOpen = activeCartItemId === item.item_id;
            const cartQty = getCartQty(item);
            const description = getListingDescription(item);

            return (
              <tr
                key={row.id}
                className={cn(
                  'border-b border-gray-200 align-middle transition-colors',
                  index % 2 === 0 ? 'bg-white' : 'bg-slate-50/60',
                  isOwn && 'bg-sky-50/40',
                  isCartOpen && 'bg-orange-50/40',
                  !isCartOpen && !isOwn && 'hover:bg-orange-50/20'
                )}
              >
                <td className="border-r border-gray-200/80 px-2 py-1">
                  <MarketplaceSellerCell
                    username={item.seller_display_name}
                    country={item.country}
                    rating={rep.rating}
                    reviewCount={rep.reviewCount}
                    salesCount={rep.salesCount}
                    isPro={item.seller_account_type === 'business'}
                  />
                </td>

                <td className="border-r border-gray-200/80 px-2 py-1">
                  <MarketplaceProductInfoCell
                    conditionCode={conditionCode}
                    langFlag={langFlag}
                    langTitle={item.mtg_language ?? undefined}
                    imageUrl={cardImageSrc}
                    imageName={cardName ?? item.seller_display_name}
                    description={description}
                    foil={item.mtg_foil}
                    signed={item.signed}
                    altered={item.altered}
                  />
                </td>

                <td className="px-2 py-1">
                  <MarketplaceOfferCell priceLabel={formatEuro(item.price_cents / 100)} quantity={item.quantity}>
                    {isOwn ? (
                      <div className="inline-flex items-center rounded-sm border border-slate-200 bg-white">
                        <button
                          type="button"
                          disabled={isBusy}
                          onClick={() => onOwnerQuantityChange?.(item, -1)}
                          className="inline-flex h-6 w-5 items-center justify-center text-slate-600 hover:bg-slate-50 disabled:opacity-40"
                          aria-label="Diminuisci quantità"
                        >
                          {isBusy ? <Loader2 className="h-2.5 w-2.5 animate-spin" /> : <Minus className="h-2.5 w-2.5" />}
                        </button>
                        <span className="min-w-[1.1rem] border-x border-slate-200 text-center text-[10px] font-bold tabular-nums text-slate-800">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          disabled={isBusy || item.quantity >= 999}
                          onClick={() => onOwnerQuantityChange?.(item, 1)}
                          className="inline-flex h-6 w-5 items-center justify-center text-slate-600 hover:bg-slate-50 disabled:opacity-40"
                          aria-label="Aumenta quantità"
                        >
                          <Plus className="h-2.5 w-2.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onOwnerEdit?.(item)}
                          className="inline-flex h-6 w-5 items-center justify-center border-l border-slate-200 text-slate-500 hover:bg-amber-50"
                          aria-label="Modifica inserzione"
                        >
                          <Pencil className="h-2.5 w-2.5" />
                        </button>
                      </div>
                    ) : isCartOpen ? (
                      <div className="inline-flex items-center rounded-sm border border-orange-200 bg-white">
                        <button
                          type="button"
                          onClick={() => setCartQty(item.item_id, cartQty - 1, item.quantity)}
                          disabled={cartQty <= 1}
                          className="inline-flex h-6 w-5 items-center justify-center text-slate-500 disabled:opacity-40"
                          aria-label="Meno"
                        >
                          <Minus className="h-2.5 w-2.5" />
                        </button>
                        <span className="min-w-[1.1rem] border-x border-orange-100 text-center text-[10px] font-bold tabular-nums">
                          {cartQty}
                        </span>
                        <button
                          type="button"
                          onClick={() => setCartQty(item.item_id, cartQty + 1, item.quantity)}
                          disabled={cartQty >= item.quantity}
                          className="inline-flex h-6 w-5 items-center justify-center text-slate-500 disabled:opacity-40"
                          aria-label="Più"
                        >
                          <Plus className="h-2.5 w-2.5" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            onAddToCart?.(item, cartQty, e.currentTarget);
                            closeInlineCart();
                          }}
                          className="inline-flex h-6 w-6 items-center justify-center border-l border-orange-200 bg-[#FF7300] text-white hover:bg-[#e86a00]"
                          aria-label="Conferma carrello"
                        >
                          <ShoppingCart className="h-2.5 w-2.5" />
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => openInlineCart(item)}
                        className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-sm bg-[#2563eb] text-white hover:bg-[#1d4ed8]"
                        aria-label="Aggiungi al carrello"
                        title="Acquista"
                      >
                        <ShoppingCart className="h-3 w-3" strokeWidth={2.25} />
                      </button>
                    )}
                  </MarketplaceOfferCell>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* Mobile */}
      <div className="divide-y divide-gray-100 sm:hidden">
        {displayRows.map((row, index) => {
          if (row.kind === 'auction') {
            const a = row.auction;
            const remaining = new Date(a.endsAt).getTime() - nowMs;
            const sellerName = a.sellerDisplayName || a.seller;
            const auctionCondition = getConditionCode(a.condition);
            const auctionLang = languageFlagCode(cardLanguage);
            const auctionPhoto = getAuctionPhotoUrl(a, cardImageSrc);

            return (
              <div key={row.id} className="bg-violet-50/35 px-3 py-2.5">
                <MarketplaceSellerCell
                  username={sellerName}
                  country={a.sellerCountry}
                  rating={normalizeRatingToFive(a.sellerRating)}
                  reviewCount={a.sellerReviewCount}
                  salesCount={0}
                />
                <div className="mt-1.5">
                  <MarketplaceProductInfoCell
                    conditionCode={auctionCondition}
                    langFlag={auctionLang}
                    langTitle={cardLanguage ?? undefined}
                    imageUrl={auctionPhoto}
                    imageName={a.title || cardName}
                    description={getAuctionDescription(a)}
                    auctionTag
                  />
                </div>
                <div className="mt-2 flex items-center justify-end gap-2">
                  <span className="text-sm font-bold tabular-nums">{formatEuro(a.currentBidEur || a.startingBidEur)}</span>
                  <span className="text-[10px] font-semibold text-violet-700">{formatCountdownDuration(remaining)}</span>
                  <Link
                    href={auctionDetailPath(String(a.numericId))}
                    className="inline-flex h-8 items-center gap-1 rounded-sm bg-violet-600 px-2.5 text-xs font-bold text-white"
                  >
                    <Gavel className="h-3.5 w-3.5" /> Asta
                  </Link>
                </div>
              </div>
            );
          }

          const item = row.listing;
          const isOwn = isOwnListing(item);
          const isBusy = busyItemId === item.item_id;
          const conditionCode = listingConditionCode(item.condition);
          const langFlag = languageFlagCode(item.mtg_language);
          const rep = getSellerReputation(item);
          const isCartOpen = activeCartItemId === item.item_id;
          const cartQty = getCartQty(item);

          return (
            <div
              key={row.id}
              className={cn(
                'px-3 py-2.5',
                index % 2 === 0 ? 'bg-white' : 'bg-slate-50/70',
                isOwn && 'bg-sky-50/40',
                isCartOpen && 'bg-orange-50/40'
              )}
            >
              <div className="mb-2 flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <MarketplaceSellerCell
                    username={item.seller_display_name}
                    country={item.country}
                    rating={rep.rating}
                    reviewCount={rep.reviewCount}
                    salesCount={rep.salesCount}
                    isPro={item.seller_account_type === 'business'}
                  />
                </div>
                <div className="flex shrink-0 items-center gap-1.5 whitespace-nowrap">
                  <span className="text-sm font-bold tabular-nums text-[#1D3160]">
                    {formatEuro(item.price_cents / 100)}
                  </span>
                  <span className="text-[11px] font-semibold tabular-nums text-slate-500">×{item.quantity}</span>
                </div>
              </div>

              <div className="mb-2">
                <MarketplaceProductInfoCell
                  conditionCode={conditionCode}
                  langFlag={langFlag}
                  langTitle={item.mtg_language ?? undefined}
                  imageUrl={cardImageSrc}
                  imageName={cardName ?? item.seller_display_name}
                  description={getListingDescription(item)}
                  foil={item.mtg_foil}
                  signed={item.signed}
                  altered={item.altered}
                />
              </div>

              <div className="mt-2 flex items-center justify-end gap-2">
                <MarketplaceOfferCell priceLabel={formatEuro(item.price_cents / 100)} quantity={item.quantity}>
                  {isOwn ? (
                    <div className="inline-flex items-center rounded-sm border border-slate-200 bg-white">
                      <button
                        type="button"
                        disabled={isBusy}
                        onClick={() => onOwnerQuantityChange?.(item, -1)}
                        className="inline-flex h-7 w-6 items-center justify-center text-slate-600 disabled:opacity-40"
                        aria-label="Diminuisci"
                      >
                        {isBusy ? <Loader2 className="h-3 w-3 animate-spin" /> : <Minus className="h-3 w-3" />}
                      </button>
                      <span className="min-w-[1.1rem] border-x border-slate-200 text-center text-[10px] font-bold tabular-nums">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        disabled={isBusy || item.quantity >= 999}
                        onClick={() => onOwnerQuantityChange?.(item, 1)}
                        className="inline-flex h-7 w-6 items-center justify-center text-slate-600 disabled:opacity-40"
                        aria-label="Aumenta"
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onOwnerEdit?.(item)}
                        className="inline-flex h-7 w-6 items-center justify-center border-l border-slate-200 text-slate-500"
                        aria-label="Modifica"
                      >
                        <Pencil className="h-3 w-3" />
                      </button>
                    </div>
                  ) : isCartOpen ? (
                    <div className="inline-flex items-center rounded-sm border border-orange-200 bg-white">
                      <button
                        type="button"
                        onClick={() => setCartQty(item.item_id, cartQty - 1, item.quantity)}
                        disabled={cartQty <= 1}
                        className="inline-flex h-7 w-6 items-center justify-center disabled:opacity-40"
                      >
                        <Minus className="h-3 w-3" />
                      </button>
                      <span className="min-w-[1.1rem] border-x border-orange-100 text-center text-[10px] font-bold tabular-nums">
                        {cartQty}
                      </span>
                      <button
                        type="button"
                        onClick={() => setCartQty(item.item_id, cartQty + 1, item.quantity)}
                        disabled={cartQty >= item.quantity}
                        className="inline-flex h-7 w-6 items-center justify-center disabled:opacity-40"
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          onAddToCart?.(item, cartQty, e.currentTarget);
                          closeInlineCart();
                        }}
                        className="inline-flex h-7 w-7 items-center justify-center border-l border-orange-200 bg-[#FF7300] text-white"
                      >
                        <ShoppingCart className="h-3 w-3" />
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => openInlineCart(item)}
                      className="inline-flex h-7 w-7 items-center justify-center rounded-sm bg-[#2563eb] text-white"
                      aria-label="Carrello"
                    >
                      <ShoppingCart className="h-3.5 w-3.5" />
                    </button>
                  )}
                </MarketplaceOfferCell>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
