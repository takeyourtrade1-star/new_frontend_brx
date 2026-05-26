'use client';

import { useCallback, useState } from 'react';
import Link from 'next/link';
import {
  Camera,
  Check,
  Loader2,
  Minus,
  Pencil,
  Plus,
  ShoppingCart,
  Star,
  User,
  X,
} from 'lucide-react';
import { FlagIcon } from '@/components/ui/FlagIcon';
import { ConditionBadge, type ConditionCode } from '@/components/ui/ConditionBadge';
import { BrxExpressIcon } from '@/components/ui/BrxExpressIcon';
import { CardImageCameraPeek } from '@/components/ui/CardImageCameraPeek';
import { cn, formatEuroNoSpace } from '@/lib/utils';
import { type ListingItem } from '@/lib/api/sync-client';

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

function formatSalesCount(count: number): string {
  if (count >= 1_000_000) {
    return `${(count / 1_000_000).toLocaleString('it-IT', { maximumFractionDigits: 1 })}M`;
  }
  if (count >= 1_000) {
    return `${(count / 1_000).toLocaleString('it-IT', { maximumFractionDigits: 1 })}K`;
  }
  return count.toLocaleString('it-IT');
}

interface ModernSellerTableProps {
  listings: ListingItem[];
  loading?: boolean;
  error?: string | null;
  cardImageSrc?: string;
  cardName?: string;
  onAddToCart?: (item: ListingItem, quantity: number, sourceEl: HTMLElement) => void;
  isOwnListing?: (item: ListingItem) => boolean;
  onOwnerEdit?: (item: ListingItem) => void;
  onOwnerQuantityChange?: (item: ListingItem, delta: -1 | 1) => Promise<void>;
  busyItemId?: number | null;
}

export function ModernSellerTable({
  listings,
  loading = false,
  error = null,
  cardImageSrc,
  cardName,
  onAddToCart,
  isOwnListing = () => false,
  onOwnerEdit,
  onOwnerQuantityChange,
  busyItemId = null,
}: ModernSellerTableProps) {
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

  if (loading) {
    return (
      <div className="px-4 py-8 text-center text-sm text-gray-500">
        <Loader2 className="mx-auto mb-2 h-5 w-5 animate-spin text-gray-400" />
        Caricamento venditori…
      </div>
    );
  }

  if (error) {
    return (
      <div className="px-4 py-8 text-center text-sm text-amber-600">{error}</div>
    );
  }

  if (listings.length === 0) {
    return (
      <div className="px-4 py-10 text-center text-sm text-gray-600">
        Presto ci saranno articoli in vendita disponibili.
      </div>
    );
  }

  return (
    <>
      {/* Desktop */}
      <table className="hidden w-full table-fixed text-left text-sm sm:table">
        <colgroup>
          <col style={{ width: '32%' }} />
          <col style={{ width: '38%' }} />
          <col style={{ width: '30%' }} />
        </colgroup>
        <thead>
          <tr className="bg-[#1D3160] text-xs font-semibold uppercase tracking-wide text-white">
            <th className="px-4 py-3">Venditore</th>
            <th className="px-4 py-3">Informazioni prodotto</th>
            <th className="px-4 py-3 text-right">Offerta</th>
          </tr>
        </thead>
        <tbody>
          {listings.map((item, index) => {
            const isOwn = isOwnListing(item);
            const isBusy = busyItemId === item.item_id;
            const conditionCode = getConditionCode(item.condition);
            const langFlag = languageFlagCode(item.mtg_language);
            const hasBrxExpress = index === 0;
            const rep = getSellerReputation(item);
            const isCartOpen = activeCartItemId === item.item_id;
            const cartQty = getCartQty(item);

            return (
              <tr
                key={item.item_id}
                className={cn(
                  'border-b border-gray-100 align-middle transition-colors',
                  index % 2 === 0 ? 'bg-white' : 'bg-slate-50/70',
                  isCartOpen && 'bg-orange-50/50 ring-1 ring-inset ring-orange-200/60',
                  !isCartOpen && 'hover:bg-orange-50/30'
                )}
              >
                {/* Venditore */}
                <td className="px-4 py-3.5">
                  <div className="flex min-w-0 flex-col gap-2">
                    <div className="flex min-w-0 items-center gap-2">
                      {item.country && <FlagIcon country={item.country} size="sm" />}
                      <Link
                        href={`/users/${item.seller_display_name}`}
                        className="truncate text-sm font-semibold text-[#2563eb] hover:underline"
                      >
                        {item.seller_display_name}
                      </Link>
                      <span
                        className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700"
                        title="Venditore verificato"
                      >
                        <User className="h-3 w-3" strokeWidth={2.5} />
                      </span>
                      {hasBrxExpress && (
                        <span
                          className="inline-flex items-center gap-0.5 rounded-full bg-gradient-to-r from-orange-500 to-amber-500 px-1.5 py-0.5 text-[10px] font-bold text-white"
                          title="BRX Express"
                        >
                          <BrxExpressIcon size="sm" className="text-white" />
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                      <span
                        className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-900 ring-1 ring-amber-200/80"
                        title="Valutazione media"
                      >
                        <Star className="h-3 w-3 fill-amber-400 text-amber-500" aria-hidden />
                        <span className="tabular-nums">{formatReviewRating(rep.rating)}</span>
                        <span className="font-medium text-amber-800/70">/5</span>
                        <span className="font-normal text-amber-700/80 tabular-nums">
                          ({rep.reviewCount.toLocaleString('it-IT')})
                        </span>
                      </span>
                      <span
                        className="text-[11px] font-medium tabular-nums text-slate-500"
                        title="Vendite completate"
                      >
                        {formatSalesCount(rep.salesCount)}{' '}
                        <span className="font-normal text-slate-400">vendite</span>
                      </span>
                    </div>
                  </div>
                </td>

                {/* Informazioni prodotto */}
                <td className="px-4 py-3.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <ConditionBadge condition={conditionCode} size="md" />
                    {langFlag && (
                      <FlagIcon country={langFlag} size="xs" title={item.mtg_language ?? undefined} />
                    )}
                    {cardImageSrc ? (
                      <CardImageCameraPeek
                        imageUrl={cardImageSrc}
                        name={cardName ?? item.seller_display_name}
                        className="!h-5 !w-5 text-[#3D65C6]"
                        ariaLabel="Anteprima foto carta"
                      />
                    ) : (
                      <span
                        className="inline-flex h-6 w-6 items-center justify-center rounded-lg bg-slate-100 text-[#3D65C6]"
                        title="Foto disponibile"
                      >
                        <Camera className="h-3.5 w-3.5" />
                      </span>
                    )}
                  </div>
                </td>

                {/* Offerta */}
                <td className="px-4 py-3.5">
                  <div className="flex items-center justify-end gap-3">
                    <div className="flex flex-col items-end gap-1">
                      <div className="text-base font-bold tabular-nums tracking-tight text-[#1D3160]">
                        {formatEuro(item.price_cents / 100)}
                      </div>
                      <span
                        className="inline-flex items-center rounded-md bg-slate-100 px-2 py-0.5 text-xs font-bold tabular-nums text-slate-700 ring-1 ring-slate-200/80"
                        title="Quantità disponibile"
                      >
                        ×{item.quantity}
                      </span>
                    </div>

                    {isOwn ? (
                      <div className="flex items-center gap-1 rounded-xl border border-slate-200/80 bg-white p-1 shadow-sm">
                        <button
                          type="button"
                          disabled={isBusy}
                          onClick={() => onOwnerQuantityChange?.(item, -1)}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-b from-rose-500 to-rose-600 text-white shadow-sm transition hover:from-rose-600 hover:to-rose-700 disabled:opacity-50"
                          aria-label="Diminuisci quantità"
                        >
                          {isBusy ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Minus className="h-4 w-4" />
                          )}
                        </button>
                        <span className="min-w-[1.5rem] text-center text-sm font-bold tabular-nums text-slate-800">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          disabled={isBusy || item.quantity >= 999}
                          onClick={() => onOwnerQuantityChange?.(item, 1)}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-b from-emerald-500 to-emerald-600 text-white shadow-sm transition hover:from-emerald-600 hover:to-emerald-700 disabled:opacity-50"
                          aria-label="Aumenta quantità"
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onOwnerEdit?.(item)}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-b from-amber-400 to-amber-500 text-slate-900 shadow-sm transition hover:from-amber-500 hover:to-amber-600"
                          aria-label="Modifica inserzione"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ) : isCartOpen ? (
                      <div className="flex items-center gap-1 rounded-xl border border-orange-200 bg-white p-1 shadow-md shadow-orange-500/10">
                        <button
                          type="button"
                          onClick={() => setCartQty(item.item_id, cartQty - 1, item.quantity)}
                          disabled={cartQty <= 1}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 disabled:opacity-40"
                          aria-label="Meno"
                        >
                          <Minus className="h-4 w-4" />
                        </button>
                        <span className="min-w-[1.75rem] text-center text-sm font-bold tabular-nums text-slate-900">
                          {cartQty}
                        </span>
                        <button
                          type="button"
                          onClick={() => setCartQty(item.item_id, cartQty + 1, item.quantity)}
                          disabled={cartQty >= item.quantity}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 disabled:opacity-40"
                          aria-label="Più"
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            onAddToCart?.(item, cartQty, e.currentTarget);
                            closeInlineCart();
                          }}
                          className="inline-flex h-8 items-center gap-1 rounded-lg bg-gradient-to-r from-[#FF7300] to-amber-500 px-2.5 text-xs font-bold text-white shadow-sm transition hover:from-[#e86a00] hover:to-amber-600 active:scale-[0.98]"
                          aria-label="Conferma e aggiungi al carrello"
                        >
                          <Check className="h-3.5 w-3.5" />
                          <ShoppingCart className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={closeInlineCart}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
                          aria-label="Annulla"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => openInlineCart(item)}
                        className="group inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#FF7300] to-amber-500 text-white shadow-md shadow-orange-500/25 transition hover:from-[#e86a00] hover:to-amber-600 hover:shadow-lg active:scale-95"
                        aria-label="Aggiungi al carrello"
                      >
                        <ShoppingCart className="h-4 w-4 transition group-hover:scale-110" strokeWidth={2.25} />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* Mobile */}
      <div className="divide-y divide-gray-100 sm:hidden">
        {listings.map((item, index) => {
          const isOwn = isOwnListing(item);
          const isBusy = busyItemId === item.item_id;
          const conditionCode = getConditionCode(item.condition);
          const langFlag = languageFlagCode(item.mtg_language);
          const hasBrxExpress = index === 0;
          const rep = getSellerReputation(item);
          const isCartOpen = activeCartItemId === item.item_id;
          const cartQty = getCartQty(item);

          return (
            <div
              key={item.item_id}
              className={cn('px-4 py-4', index % 2 === 0 ? 'bg-white' : 'bg-slate-50/70', isCartOpen && 'bg-orange-50/40')}
            >
              <div className="mb-2 flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <div className="flex min-w-0 items-center gap-2">
                    {item.country && <FlagIcon country={item.country} size="sm" />}
                    <Link
                      href={`/users/${item.seller_display_name}`}
                      className="truncate text-sm font-semibold text-[#2563eb]"
                    >
                      {item.seller_display_name}
                    </Link>
                    {hasBrxExpress && <BrxExpressIcon size="sm" className="text-orange-500" />}
                  </div>
                  <div className="mt-1.5 flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-900 ring-1 ring-amber-200/80">
                      <Star className="h-3 w-3 fill-amber-400 text-amber-500" />
                      {formatReviewRating(rep.rating)}/5 ({rep.reviewCount.toLocaleString('it-IT')})
                    </span>
                    <span className="text-[11px] text-slate-500 tabular-nums">
                      {formatSalesCount(rep.salesCount)} vendite
                    </span>
                  </div>
                </div>
                <div className="shrink-0 text-right">
                  <div className="text-sm font-bold tabular-nums text-[#1D3160]">
                    {formatEuro(item.price_cents / 100)}
                  </div>
                  <span className="mt-0.5 inline-flex rounded-md bg-slate-100 px-1.5 py-0.5 text-xs font-bold tabular-nums text-slate-700">
                    ×{item.quantity}
                  </span>
                </div>
              </div>

              <div className="mb-3 flex flex-wrap items-center gap-2">
                <ConditionBadge condition={conditionCode} size="sm" />
                {langFlag && <FlagIcon country={langFlag} size="xs" />}
                {cardImageSrc && (
                  <CardImageCameraPeek
                    imageUrl={cardImageSrc}
                    name={cardName ?? item.seller_display_name}
                    className="!h-5 !w-5 text-[#3D65C6]"
                    ariaLabel="Anteprima foto carta"
                  />
                )}
              </div>

              <div className="flex items-center justify-end gap-2">
                {isOwn ? (
                  <div className="flex items-center gap-1 rounded-xl border border-slate-200 bg-white p-1 shadow-sm">
                    <button
                      type="button"
                      disabled={isBusy}
                      onClick={() => onOwnerQuantityChange?.(item, -1)}
                      className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-rose-500 text-white disabled:opacity-50"
                      aria-label="Diminuisci"
                    >
                      {isBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Minus className="h-4 w-4" />}
                    </button>
                    <span className="min-w-[1.5rem] text-center text-sm font-bold tabular-nums">{item.quantity}</span>
                    <button
                      type="button"
                      disabled={isBusy || item.quantity >= 999}
                      onClick={() => onOwnerQuantityChange?.(item, 1)}
                      className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-600 text-white disabled:opacity-50"
                      aria-label="Aumenta"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onOwnerEdit?.(item)}
                      className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-amber-400 text-slate-900"
                      aria-label="Modifica"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                  </div>
                ) : isCartOpen ? (
                  <div className="flex w-full items-center justify-end gap-1 rounded-xl border border-orange-200 bg-white p-1.5 shadow-sm">
                    <button
                      type="button"
                      onClick={() => setCartQty(item.item_id, cartQty - 1, item.quantity)}
                      disabled={cartQty <= 1}
                      className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 disabled:opacity-40"
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                    <span className="min-w-[2rem] text-center text-sm font-bold tabular-nums">{cartQty}</span>
                    <button
                      type="button"
                      onClick={() => setCartQty(item.item_id, cartQty + 1, item.quantity)}
                      disabled={cartQty >= item.quantity}
                      className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 disabled:opacity-40"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        onAddToCart?.(item, cartQty, e.currentTarget);
                        closeInlineCart();
                      }}
                      className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-gradient-to-r from-[#FF7300] to-amber-500 py-2 text-xs font-bold text-white"
                    >
                      <ShoppingCart className="h-4 w-4" />
                      Aggiungi
                    </button>
                    <button type="button" onClick={closeInlineCart} className="inline-flex h-9 w-9 items-center justify-center text-slate-400">
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => openInlineCart(item)}
                    className="inline-flex h-10 items-center gap-2 rounded-xl bg-gradient-to-r from-[#FF7300] to-amber-500 px-4 text-sm font-bold text-white shadow-md"
                  >
                    <ShoppingCart className="h-4 w-4" />
                    Carrello
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
