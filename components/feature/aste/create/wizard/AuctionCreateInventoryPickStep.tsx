'use client';

import { useCallback } from 'react';
import type { AuctionCreateDraft } from '@/lib/auction/auction-create-draft';
import type { InventoryItemWithCatalog } from '@/lib/sync/inventory-types';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { useIntlLocale } from '@/lib/i18n/useIntlLocale';
import { cn, formatEuroNoSpace } from '@/lib/utils';

type AuctionCreateDraftUpdate = <K extends keyof AuctionCreateDraft>(
  key: K,
  value: AuctionCreateDraft[K]
) => void;

export type EmbeddedInventoryPick = 'unset' | 'skip' | number;

export type AuctionCreateInventoryPickStepProps = {
  draft: AuctionCreateDraft;
  update: AuctionCreateDraftUpdate;
  isEmbedded: boolean;
  embeddedInventoryItems: InventoryItemWithCatalog[];
  embeddedInventoryPick: EmbeddedInventoryPick;
  onEmbeddedInventoryPickChange: (pick: EmbeddedInventoryPick) => void;
};

export function AuctionCreateInventoryPickStep({
  isEmbedded,
  embeddedInventoryItems,
  embeddedInventoryPick,
  onEmbeddedInventoryPickChange,
}: AuctionCreateInventoryPickStepProps) {
  const { t } = useTranslation();
  const intlLocale = useIntlLocale();
  const formatEuro = useCallback((n: number) => formatEuroNoSpace(n, intlLocale), [intlLocale]);

  return (
    <div className={cn('space-y-4', isEmbedded && 'space-y-2')}>
      <p className={cn('text-sm text-gray-600', isEmbedded && 'text-[11px] leading-snug text-zinc-500')}>
        {t('auctions.createStepInventoryPickIntro')}
      </p>

      {isEmbedded ? (
        <div className="space-y-2">
          <button
            type="button"
            onClick={() => {
              if (typeof embeddedInventoryPick === 'number') return;
              const firstId = embeddedInventoryItems[0]?.id;
              if (typeof firstId === 'number') onEmbeddedInventoryPickChange(firstId);
            }}
            className={cn(
              'w-full rounded-lg border px-3 py-2 text-left text-xs transition',
              typeof embeddedInventoryPick === 'number'
                ? 'border-[#FF7300] bg-orange-50'
                : 'border-gray-200 bg-white hover:border-gray-300'
            )}
          >
            <span className="block text-[11px] font-bold uppercase tracking-wide text-[#1D3160]">
              Usa una copia in inventario
            </span>
            <span className="mt-0.5 block text-[11px] text-zinc-500">
              Seleziona la copia gia presente e parti da quei dati.
            </span>
          </button>

          <select
            value={typeof embeddedInventoryPick === 'number' ? String(embeddedInventoryPick) : ''}
            onChange={(e) => onEmbeddedInventoryPickChange(Number(e.target.value))}
            className={cn(
              'w-full rounded-lg border bg-white px-3 py-2 text-xs text-gray-900 focus:border-[#FF7300] focus:outline-none focus:ring-2 focus:ring-[#FF7300]/25',
              typeof embeddedInventoryPick === 'number'
                ? 'border-[#FF7300]/60'
                : 'border-gray-300'
            )}
          >
            <option value="" disabled>
              Seleziona una copia
            </option>
            {embeddedInventoryItems.map((item) => {
              const props = item.properties as Record<string, unknown> | undefined;
              const cond = typeof props?.condition === 'string' ? props.condition : '';
              return (
                <option key={item.id} value={item.id}>
                  #{item.id} · {t('auctions.createInventoryQtyLabel', { n: item.quantity })} ·{' '}
                  {formatEuro(item.price_cents / 100)}
                  {cond ? ` · ${cond}` : ''}
                </option>
              );
            })}
          </select>

          <button
            type="button"
            onClick={() => onEmbeddedInventoryPickChange('skip')}
            className={cn(
              'w-full rounded-lg border px-3 py-2 text-xs font-semibold uppercase tracking-wide text-[#1D3160] transition',
              embeddedInventoryPick === 'skip'
                ? 'border-[#FF7300] bg-orange-50'
                : 'border-dashed border-gray-300 bg-gray-50 hover:bg-gray-100'
            )}
          >
            {t('auctions.createInventorySkipCta')}
          </button>
        </div>
      ) : (
        <>
          <ul className={cn('space-y-2', isEmbedded && 'space-y-1.5')}>
            {embeddedInventoryItems.map((item) => {
              const props = item.properties as Record<string, unknown> | undefined;
              const cond = typeof props?.condition === 'string' ? props.condition : '';
              return (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => onEmbeddedInventoryPickChange(item.id)}
                    className={cn(
                      'w-full rounded-xl border px-4 py-3 text-left text-sm transition',
                      isEmbedded && 'rounded-lg px-3 py-2 text-xs',
                      embeddedInventoryPick === item.id
                        ? 'border-[#FF7300] bg-orange-50'
                        : 'border-gray-200 bg-white hover:border-gray-300'
                    )}
                  >
                    <span className="font-semibold text-[#1D3160]">#{item.id}</span>
                    <span className="text-gray-600">
                      {' '}
                      · {t('auctions.createInventoryQtyLabel', { n: item.quantity })}
                    </span>
                    <span className="text-gray-600"> · {formatEuro(item.price_cents / 100)}</span>
                    {cond ? <span className="text-xs text-gray-500"> · {cond}</span> : null}
                  </button>
                </li>
              );
            })}
          </ul>
          <button
            type="button"
            onClick={() => onEmbeddedInventoryPickChange('skip')}
            className={cn(
              'w-full rounded-xl border px-4 py-3 text-sm font-semibold uppercase tracking-wide text-[#1D3160] transition',
              isEmbedded && 'rounded-lg px-3 py-2 text-xs',
              embeddedInventoryPick === 'skip'
                ? 'border-[#FF7300] bg-orange-50'
                : 'border-dashed border-gray-300 bg-gray-50 hover:bg-gray-100'
            )}
          >
            {t('auctions.createInventorySkipCta')}
          </button>
        </>
      )}
    </div>
  );
}
