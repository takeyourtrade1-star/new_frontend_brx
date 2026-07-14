'use client';

import Image from 'next/image';
import Link from 'next/link';
import {
  CheckSquare,
  Loader2,
  Minus,
  MoreVertical,
  Pencil,
  Plus,
  Square,
  Trash2,
} from 'lucide-react';
import { useState } from 'react';
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
import { useIntlLocale } from '@/lib/i18n/useIntlLocale';
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

function MobileRowActions({
  item,
  mutationsDisabled,
  deletingId,
  qtyUpdatingId,
  onEdit,
  onDelete,
  onQtyDelta,
  t,
}: {
  item: InventoryItemWithCatalog;
  mutationsDisabled?: boolean;
  deletingId: number | null;
  qtyUpdatingId: number | null;
  onEdit: (item: InventoryItemWithCatalog) => void;
  onDelete: (item: InventoryItemWithCatalog) => void;
  onQtyDelta: (item: InventoryItemWithCatalog, delta: -1 | 1) => void;
  t: OggettiMobileListProps['t'];
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const busy = qtyUpdatingId === item.id || deletingId === item.id;
  const tradeLocked = (item.reserved_quantity ?? 0) > 0;

  return (
    <div className="relative flex shrink-0 items-center gap-1">
      <div className="flex items-center rounded-lg bg-gray-100/90 p-0.5">
        <button
          type="button"
          disabled={tradeLocked || mutationsDisabled || busy}
          onClick={() => onQtyDelta(item, -1)}
          className="flex h-8 w-8 items-center justify-center rounded-md text-red-600 disabled:opacity-40"
          aria-label={t('accountPage.itemsDecreaseQty')}
        >
          {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Minus className="h-3.5 w-3.5" />}
        </button>
        <span className="min-w-[1.25rem] text-center text-xs font-bold tabular-nums text-gray-800">
          {item.quantity}
          {tradeLocked && (
            <span className="block text-[8px] font-bold uppercase text-amber-700">
              {t('trades.inventoryLocked')}
            </span>
          )}
        </span>
        <button
          type="button"
          disabled={tradeLocked || mutationsDisabled || busy || item.quantity >= 999}
          onClick={() => onQtyDelta(item, 1)}
          className="flex h-8 w-8 items-center justify-center rounded-md text-emerald-700 disabled:opacity-40"
          aria-label={t('accountPage.itemsIncreaseQty')}
        >
          <Plus className="h-3.5 w-3.5" />
        </button>
      </div>
      <button
        type="button"
        disabled={tradeLocked}
        onClick={() => setMenuOpen((o) => !o)}
        className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 ring-1 ring-gray-200/80 disabled:opacity-40"
        aria-label={t('accountPage.itemsTableActions')}
      >
        <MoreVertical className="h-4 w-4" />
      </button>
      {menuOpen && (
        <>
          <button
            type="button"
            className="fixed inset-0 z-10"
            aria-label={t('accountPage.itemsClose')}
            onClick={() => setMenuOpen(false)}
          />
          <div className="absolute right-0 top-full z-20 mt-1 min-w-[9rem] overflow-hidden rounded-xl border border-gray-200 bg-white py-1 shadow-lg">
            <button
              type="button"
              disabled={mutationsDisabled}
              onClick={() => {
                setMenuOpen(false);
                onEdit(item);
              }}
              className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm text-gray-800 active:bg-gray-50"
            >
              <Pencil className="h-4 w-4 text-primary" />
              {t('accountPage.itemsEdit')}
            </button>
            <button
              type="button"
              disabled={mutationsDisabled || deletingId === item.id}
              onClick={() => {
                setMenuOpen(false);
                onDelete(item);
              }}
              className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm text-red-600 active:bg-red-50"
            >
              {deletingId === item.id ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
              {t('accountPage.itemsDelete')}
            </button>
          </div>
        </>
      )}
    </div>
  );
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
  const intlLocale = useIntlLocale();
  return (
    <ul className="w-full divide-y divide-gray-100">
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
        const tradeLocked = (item.reserved_quantity ?? 0) > 0;
        const priceLabel = formatEuroNoSpace((item.price_cents ?? 0) / 100, intlLocale);

        return (
          <li
            key={item.id}
            className={`w-full max-w-full px-2.5 py-2.5 ${
              isSelected ? 'bg-primary/[0.05]' : 'bg-white'
            }`}
          >
            <div className="flex w-full max-w-full items-start gap-2">
              {selectionMode && (
                <button
                  type="button"
                  disabled={tradeLocked}
                  onClick={() => onToggleSelect?.(item.id)}
                  className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg disabled:opacity-40 ${
                    isSelected ? 'bg-primary text-white' : 'bg-gray-100 text-gray-400'
                  }`}
                  aria-label={isSelected ? 'Deseleziona' : 'Seleziona'}
                >
                  {isSelected ? (
                    <CheckSquare className="h-4 w-4" aria-hidden />
                  ) : (
                    <Square className="h-4 w-4" aria-hidden />
                  )}
                </button>
              )}

              <Link
                href={productHref ?? '#'}
                onClick={(e) => {
                  if (!productHref) e.preventDefault();
                }}
                className="relative h-[3.75rem] w-[2.65rem] shrink-0 overflow-hidden rounded-md bg-gray-100 ring-1 ring-gray-200/80"
              >
                <Image
                  src={imgUrl}
                  alt={namePrimary}
                  fill
                  className="object-contain p-0.5"
                  sizes="42px"
                  unoptimized={imgUrl.startsWith('http') || imgUrl === defaultImage}
                />
              </Link>

              <div className="min-w-0 flex-1 overflow-hidden">
                {productHref ? (
                  <Link
                    href={productHref}
                    className="block truncate text-[14px] font-semibold leading-tight text-gray-900"
                  >
                    {namePrimary}
                  </Link>
                ) : (
                  <p className="truncate text-[14px] font-semibold leading-tight text-gray-900">
                    {namePrimary}
                  </p>
                )}
                {setName ? (
                  <p className="truncate text-[11px] text-gray-500">{setName}</p>
                ) : null}

                <div className="mt-1 flex flex-wrap items-center gap-1">
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
                  {tradeLocked ? (
                    <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[9px] font-bold uppercase text-amber-800">
                      {t('trades.inventoryLocked')}
                    </span>
                  ) : null}
                </div>

                <div className="mt-1.5 flex max-w-full items-center justify-between gap-2">
                  <span className="shrink-0 text-[15px] font-bold tabular-nums text-primary">
                    {priceLabel}
                  </span>
                  <MobileRowActions
                    item={item}
                    mutationsDisabled={mutationsDisabled}
                    deletingId={deletingId}
                    qtyUpdatingId={qtyUpdatingId}
                    onEdit={onEdit}
                    onDelete={onDelete}
                    onQtyDelta={onQtyDelta}
                    t={t}
                  />
                </div>
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
