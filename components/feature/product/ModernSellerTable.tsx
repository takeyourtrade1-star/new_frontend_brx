'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Camera, Loader2, Minus, Pencil, Plus, User } from 'lucide-react';
import { FlagIcon } from '@/components/ui/FlagIcon';
import { ConditionBadge, type ConditionCode } from '@/components/ui/ConditionBadge';
import { BrxExpressIcon } from '@/components/ui/BrxExpressIcon';
import { CardImageCameraPeek } from '@/components/ui/CardImageCameraPeek';
import { cn, formatEuroNoSpace } from '@/lib/utils';
import { getCdnImageUrl } from '@/lib/config';
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

const LANGUAGE_TO_FLAG: Record<string, string> = {
  en: 'GB',
  it: 'IT',
  fr: 'FR',
  de: 'DE',
  es: 'ES',
  pt: 'PT',
  jp: 'JP',
  ja: 'JP',
};

function getConditionCode(conditionText?: string | null): ConditionCode {
  if (!conditionText) return 'NM';
  return CONDITION_TEXT_TO_CODE[conditionText] ?? 'NM';
}

function languageFlagCode(language?: string | null): string | null {
  if (!language) return null;
  const key = language.trim().toLowerCase();
  return LANGUAGE_TO_FLAG[key] ?? key.toUpperCase().slice(0, 2);
}

function formatLanguageLabel(language?: string | null): string {
  if (!language) return '—';
  return language.toUpperCase();
}

interface ModernSellerTableProps {
  listings: ListingItem[];
  loading?: boolean;
  error?: string | null;
  cardImageSrc?: string;
  cardName?: string;
  onAddToCart?: (item: ListingItem, event: React.MouseEvent<HTMLButtonElement>) => void;
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
      {/* Desktop – layout tabella venditori */}
      <table className="hidden w-full table-fixed text-left text-sm sm:table">
        <colgroup>
          <col style={{ width: '28%' }} />
          <col style={{ width: '44%' }} />
          <col style={{ width: '28%' }} />
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
            const salesLabel = index === 0 ? '5K' : index === 1 ? '357' : '10K';

            return (
              <tr
                key={item.item_id}
                className={cn(
                  'border-b border-gray-200 align-middle transition-colors hover:bg-orange-50/40',
                  index % 2 === 0 ? 'bg-white' : 'bg-gray-50/80'
                )}
              >
                {/* Venditore */}
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="inline-flex min-w-[2.25rem] items-center justify-center rounded border border-gray-300 bg-white px-1.5 py-0.5 text-[10px] font-semibold tabular-nums text-gray-600">
                      {salesLabel}
                    </span>
                    {item.country && <FlagIcon country={item.country} size="sm" />}
                    <Link
                      href={`/users/${item.seller_display_name}`}
                      className="truncate text-sm font-medium text-[#3D65C6] hover:underline"
                    >
                      {item.seller_display_name}
                    </Link>
                    <span className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700" title="Venditore verificato">
                      <User className="h-3 w-3" strokeWidth={2.5} />
                    </span>
                    {hasBrxExpress && (
                      <span className="inline-flex items-center gap-0.5 rounded-full bg-gradient-to-r from-orange-500 to-amber-500 px-1.5 py-0.5 text-[10px] font-bold text-white" title="BRX Express">
                        <BrxExpressIcon size="sm" className="text-white" />
                      </span>
                    )}
                  </div>
                </td>

                {/* Informazioni prodotto */}
                <td className="px-4 py-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <ConditionBadge condition={conditionCode} size="md" />
                    {langFlag && <FlagIcon country={langFlag} size="xs" />}
                    <span className="text-xs text-gray-600">{formatLanguageLabel(item.mtg_language)}</span>
                    {cardImageSrc && (
                      <CardImageCameraPeek
                        imageUrl={cardImageSrc}
                        name={cardName ?? item.seller_display_name}
                        className="!h-5 !w-5 text-[#3D65C6]"
                        ariaLabel="Anteprima foto carta"
                      />
                    )}
                    {!cardImageSrc && (
                      <span className="inline-flex h-5 w-5 items-center justify-center rounded bg-blue-50 text-[#3D65C6]" title="Foto disponibile">
                        <Camera className="h-3.5 w-3.5" />
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-xs italic text-gray-500 line-clamp-1">
                    {item.condition ?? 'Near Mint'}
                    {item.mtg_language ? ` (${item.mtg_language})` : ''}
                  </p>
                </td>

                {/* Offerta */}
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-3">
                    <div className="text-right">
                      <div className="text-sm font-bold tabular-nums text-[#3D65C6]">
                        {formatEuro(item.price_cents / 100)}
                      </div>
                      <div className="text-xs tabular-nums text-gray-500">{item.quantity}</div>
                    </div>
                    {isOwn ? (
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          disabled={isBusy}
                          onClick={() => onOwnerQuantityChange?.(item, -1)}
                          className="flex h-8 w-8 items-center justify-center rounded-md bg-red-500 text-white shadow-sm transition hover:bg-red-600 disabled:opacity-50"
                          aria-label="Diminuisci quantità"
                        >
                          {isBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Minus className="h-4 w-4" />}
                        </button>
                        <button
                          type="button"
                          disabled={isBusy || item.quantity >= 999}
                          onClick={() => onOwnerQuantityChange?.(item, 1)}
                          className="flex h-8 w-8 items-center justify-center rounded-md bg-emerald-600 text-white shadow-sm transition hover:bg-emerald-700 disabled:opacity-50"
                          aria-label="Aumenta quantità"
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onOwnerEdit?.(item)}
                          className="flex h-8 w-8 items-center justify-center rounded-md bg-amber-400 text-gray-900 shadow-sm transition hover:bg-amber-500"
                          aria-label="Modifica inserzione"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={(e) => onAddToCart?.(item, e)}
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded border border-gray-300 bg-gray-100 text-gray-700 shadow-sm transition hover:bg-gray-200"
                        aria-label="Aggiungi al carrello"
                      >
                        <Image src={getCdnImageUrl('cart-icon.png')} alt="" width={20} height={20} className="h-5 w-5 object-contain" unoptimized />
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
      <div className="divide-y divide-gray-200 sm:hidden">
        {listings.map((item, index) => {
          const isOwn = isOwnListing(item);
          const isBusy = busyItemId === item.item_id;
          const conditionCode = getConditionCode(item.condition);
          const langFlag = languageFlagCode(item.mtg_language);
          const hasBrxExpress = index === 0;

          return (
            <div key={item.item_id} className={cn('px-4 py-4', index % 2 === 0 ? 'bg-white' : 'bg-gray-50')}>
              <div className="mb-2 flex items-center justify-between gap-2">
                <div className="flex min-w-0 items-center gap-2">
                  {item.country && <FlagIcon country={item.country} size="sm" />}
                  <Link href={`/users/${item.seller_display_name}`} className="truncate text-sm font-semibold text-[#3D65C6]">
                    {item.seller_display_name}
                  </Link>
                  {hasBrxExpress && <BrxExpressIcon size="sm" className="text-orange-500" />}
                </div>
                <span className="shrink-0 text-sm font-bold tabular-nums text-[#3D65C6]">
                  {formatEuro(item.price_cents / 100)}
                </span>
              </div>
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <ConditionBadge condition={conditionCode} size="sm" />
                {langFlag && <FlagIcon country={langFlag} size="xs" />}
                <span className="text-xs text-gray-600">{item.condition ?? '—'}</span>
                {cardImageSrc && (
                  <CardImageCameraPeek
                    imageUrl={cardImageSrc}
                    name={cardName ?? item.seller_display_name}
                    className="!h-5 !w-5 text-[#3D65C6]"
                    ariaLabel="Anteprima foto carta"
                  />
                )}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Qty: {item.quantity}</span>
                {isOwn ? (
                  <div className="flex items-center gap-1">
                    <button type="button" disabled={isBusy} onClick={() => onOwnerQuantityChange?.(item, -1)} className="flex h-8 w-8 items-center justify-center rounded-md bg-red-500 text-white disabled:opacity-50" aria-label="Diminuisci">
                      {isBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Minus className="h-4 w-4" />}
                    </button>
                    <button type="button" disabled={isBusy || item.quantity >= 999} onClick={() => onOwnerQuantityChange?.(item, 1)} className="flex h-8 w-8 items-center justify-center rounded-md bg-emerald-600 text-white disabled:opacity-50" aria-label="Aumenta">
                      <Plus className="h-4 w-4" />
                    </button>
                    <button type="button" onClick={() => onOwnerEdit?.(item)} className="flex h-8 w-8 items-center justify-center rounded-md bg-amber-400 text-gray-900" aria-label="Modifica">
                      <Pencil className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={(e) => onAddToCart?.(item, e)}
                    className="flex h-9 w-9 items-center justify-center rounded-full border border-[#FF7300]/40 bg-white shadow-sm"
                    aria-label="Aggiungi al carrello"
                  >
                    <Image src={getCdnImageUrl('cart-icon.png')} alt="" width={20} height={20} className="h-5 w-5 object-contain" unoptimized />
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
