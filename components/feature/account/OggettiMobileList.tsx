'use client';

import Image from 'next/image';
import Link from 'next/link';
import {
  CheckSquare,
  Loader2,
  Minus,
  Pencil,
  Plus,
  Square,
  Trash2,
} from 'lucide-react';
import { ConditionBadge } from '@/components/ui/ConditionBadge';
import { CardLanguageFlag } from '@/components/ui/CardLanguageFlag';
import { RarityIndicator } from '@/components/ui/RarityIndicator';
import { DemoListingBadge } from '@/components/feature/sync/DemoListingBadge';
import { getCardDisplayNames } from '@/lib/card-display-name';
import {
  getInventoryConditionCode,
  getInventoryLanguageLabel,
} from '@/lib/inventory/inventory-filter-utils';
import { isDemoEbartexListing } from '@/lib/sync/inventory-types';
import type { InventoryItemWithCatalog } from '@/lib/sync/inventory-types';
import { formatEuroNoSpace } from '@/lib/utils';
import type { MessageKey } from '@/lib/i18n/messages/en';

export interface OggettiMobileListProps {
  items: InventoryItemWithCatalog[];
  buildImageUrl: (raw: string | null | undefined) => string | null;
  defaultImage: string;
  selectedLang: string;
  selectedIds?: Set<number>;
  onToggleSelect?: (id: number) => void;
  selectionMode: boolean;
  mutationsDisabled?: boolean;
  deletingId: number | null;
  qtyUpdatingId: number | null;
  onEdit: (item: InventoryItemWithCatalog) => void;
  onDelete: (item: InventoryItemWithCatalog) => void;
  onQtyDelta: (item: InventoryItemWithCatalog, delta: -1 | 1) => void;
  t: (key: MessageKey, vars?: Record<string, string | number>) => string;
}

export function OggettiMobileList({
  items,
  buildImageUrl,
  defaultImage,
  selectedLang,
  selectedIds,
  onToggleSelect,
  selectionMode,
  mutationsDisabled,
  deletingId,
  qtyUpdatingId,
  onEdit,
  onDelete,
  onQtyDelta,
  t,
}: OggettiMobileListProps) {
  return (
    <ul className="divide-y divide-gray-100">
      {items.map((item) => {
        const imgUrl = item.card?.image
          ? buildImageUrl(item.card.image) || defaultImage
          : defaultImage;
        const languageCode =
          item.properties && typeof item.properties.mtg_language === 'string'
            ? item.properties.mtg_language
            : null;
        const conditionCode = getInventoryConditionCode(
          item.properties?.condition as string | undefined
        );
        const displayNames = item.card
          ? getCardDisplayNames(
              { name: item.card.name ?? '', keywords_localized: item.card.keywords_localized },
              selectedLang
            )
          : { primary: `Carta #${item.blueprint_id}`, secondary: null };
        const namePrimary =
          (displayNames.primary || item.card?.name) ?? `Carta #${item.blueprint_id}`;
        const setName = item.card?.set_name ?? '';
        const productHref = item.card?.id ? `/products/${item.card.id}` : null;
        const isSelected = selectedIds?.has(item.id) ?? false;
        const priceLabel = formatEuroNoSpace((item.price_cents ?? 0) / 100, 'it-IT');

        return (
          <li
            key={item.id}
            className={`flex gap-3 px-3 py-3 transition-colors ${
              isSelected ? 'bg-primary/[0.06]' : 'bg-white active:bg-gray-50'
            }`}
          >
            {selectionMode && (
              <button
                type="button"
                onClick={() => onToggleSelect?.(item.id)}
                className={`mt-1 flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition-colors ${
                  isSelected ? 'bg-primary text-white' : 'bg-gray-100 text-gray-400'
                }`}
                aria-label={isSelected ? 'Deseleziona' : 'Seleziona'}
              >
                {isSelected ? (
                  <CheckSquare className="h-5 w-5" aria-hidden />
                ) : (
                  <Square className="h-5 w-5" aria-hidden />
                )}
              </button>
            )}

            <Link
              href={productHref ?? '#'}
              onClick={(e) => {
                if (!productHref) e.preventDefault();
              }}
              className="relative h-[4.5rem] w-[3.25rem] shrink-0 overflow-hidden rounded-lg bg-gray-100 ring-1 ring-gray-200/80"
            >
              <Image
                src={imgUrl}
                alt={namePrimary}
                fill
                className="object-contain p-0.5"
                sizes="52px"
                unoptimized={imgUrl.startsWith('http') || imgUrl === defaultImage}
              />
            </Link>

            <div className="min-w-0 flex-1">
              {productHref ? (
                <Link
                  href={productHref}
                  className="line-clamp-2 text-[15px] font-semibold leading-snug text-gray-900"
                >
                  {namePrimary}
                </Link>
              ) : (
                <p className="line-clamp-2 text-[15px] font-semibold leading-snug text-gray-900">
                  {namePrimary}
                </p>
              )}
              {setName ? (
                <p className="mt-0.5 line-clamp-1 text-xs text-gray-500">{setName}</p>
              ) : null}

              <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                {conditionCode ? <ConditionBadge condition={conditionCode} size="sm" /> : null}
                {languageCode ? (
                  <CardLanguageFlag
                    code={languageCode}
                    size="xs"
                    title={getInventoryLanguageLabel(languageCode)}
                  />
                ) : null}
                {item.card?.rarity ? (
                  <RarityIndicator rarity={item.card.rarity} size="sm" />
                ) : null}
                {isDemoEbartexListing(item) ? <DemoListingBadge /> : null}
              </div>

              <div className="mt-2 flex items-center justify-between gap-2">
                <span className="text-base font-bold tabular-nums text-primary">{priceLabel}</span>
                <div className="flex items-center gap-0.5 rounded-lg bg-gray-100 p-0.5">
                  <button
                    type="button"
                    disabled={mutationsDisabled || qtyUpdatingId === item.id || deletingId === item.id}
                    onClick={() => onQtyDelta(item, -1)}
                    className="flex h-9 w-9 items-center justify-center rounded-md bg-white text-red-600 shadow-sm ring-1 ring-gray-200/80 disabled:opacity-50"
                    aria-label="Diminuisci quantità"
                  >
                    {qtyUpdatingId === item.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Minus className="h-4 w-4" />
                    )}
                  </button>
                  <span className="min-w-[1.5rem] text-center text-sm font-bold tabular-nums text-gray-800">
                    {item.quantity}
                  </span>
                  <button
                    type="button"
                    disabled={
                      mutationsDisabled ||
                      qtyUpdatingId === item.id ||
                      deletingId === item.id ||
                      item.quantity >= 999
                    }
                    onClick={() => onQtyDelta(item, 1)}
                    className="flex h-9 w-9 items-center justify-center rounded-md bg-white text-emerald-700 shadow-sm ring-1 ring-gray-200/80 disabled:opacity-50"
                    aria-label="Aumenta quantità"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>

            <div className="flex shrink-0 flex-col gap-1.5 pt-0.5">
              <button
                type="button"
                onClick={() => onEdit(item)}
                disabled={mutationsDisabled}
                className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary text-white shadow-sm disabled:opacity-50"
                aria-label={t('accountPage.itemsEdit')}
              >
                <Pencil className="h-4 w-4" aria-hidden />
              </button>
              <button
                type="button"
                onClick={() => onDelete(item)}
                disabled={mutationsDisabled || deletingId === item.id}
                className="flex h-11 w-11 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-500 disabled:opacity-50"
                aria-label={t('accountPage.itemsDelete')}
              >
                {deletingId === item.id ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4" aria-hidden />
                )}
              </button>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
