'use client';

import { useRouter } from 'next/navigation';
import { Archive, Search } from 'lucide-react';
import type { AuctionCreateCardSelection, AuctionCreateDraft } from '@/lib/auction/auction-create-draft';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { cn } from '@/lib/utils';
import { AuctionCreateCardPicker } from '../AuctionCreateCardPicker';
import { AuctionCreateGenericSearch } from '../AuctionCreateGenericSearch';

type AuctionCreateDraftUpdate = <K extends keyof AuctionCreateDraft>(
  key: K,
  value: AuctionCreateDraft[K]
) => void;

export type AuctionCreateItemPickStepProps = {
  draft: AuctionCreateDraft;
  update: AuctionCreateDraftUpdate;
  onChooseInInventoryYes: () => void;
  onChooseInInventoryNo: () => void;
  onCardSelect: (sel: AuctionCreateCardSelection) => void;
  onGenericSelect: (sel: AuctionCreateCardSelection) => void;
  onClearCardSelection: () => void;
};

export function AuctionCreateItemPickStep({
  draft,
  onChooseInInventoryYes,
  onChooseInInventoryNo,
  onCardSelect,
  onGenericSelect,
  onClearCardSelection,
}: AuctionCreateItemPickStepProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const chosen = draft.fromSyncInventory;

  return (
    <div className="flex flex-col gap-5">
      {/* Scelta inventario: segmented control sempre visibile — al click non
          cambia vista, il contenuto (ricerca/inventario) appare qui sotto. */}
      <div className="flex flex-col items-center gap-3">
        <div className="grid w-full max-w-md grid-cols-2 gap-1.5 rounded-2xl border border-gray-200 bg-gray-50/80 p-1.5">
          {[
            {
              value: true,
              icon: Archive,
              label: t('auctions.createInInventoryYes'),
              desc: t('auctions.createInInventoryYesDesc'),
              onPick: onChooseInInventoryYes,
              focus: true,
            },
            {
              value: false,
              icon: Search,
              label: t('auctions.createInInventoryNo'),
              desc: t('auctions.createInInventoryNoDesc'),
              onPick: onChooseInInventoryNo,
              focus: false,
            },
          ].map(({ value, icon: Icon, label, desc, onPick, focus }) => {
            const active = chosen === value;
            return (
              <button
                key={String(value)}
                type="button"
                data-step-focus={focus ? 'true' : undefined}
                aria-pressed={active}
                onClick={() => {
                  if (chosen !== value) onPick();
                }}
                className={cn(
                  'flex flex-col items-center gap-1 rounded-xl px-3 py-3 text-center transition-all',
                  active
                    ? 'bg-white shadow-[0_1px_3px_rgba(16,24,40,0.12)] ring-2 ring-[#FF7300]'
                    : 'text-gray-500 hover:bg-white/70 hover:text-[#1D3160]',
                )}
              >
                <Icon
                  className={cn('h-5 w-5', active ? 'text-[#FF7300]' : 'text-gray-400')}
                  strokeWidth={2}
                  aria-hidden
                />
                <span className={cn('text-sm font-bold uppercase tracking-wide', active ? 'text-[#1D3160]' : undefined)}>
                  {label}
                </span>
                <span className="text-[11px] leading-tight text-gray-500">{desc}</span>
              </button>
            );
          })}
        </div>
        {chosen === null && (
          <button
            type="button"
            onClick={() => router.push('/aste')}
            className="text-xs font-semibold uppercase tracking-wide text-gray-500 underline decoration-gray-300 underline-offset-4 transition hover:text-[#1D3160] hover:decoration-[#1D3160]/40"
          >
            {t('auctions.createCancel')}
          </button>
        )}
      </div>

      {/* Contenuto inline sotto la scelta */}
      {chosen === true && (
        <AuctionCreateCardPicker
          variant="wizard-step1-inventory"
          selectedId={draft.cardSelection?.id ?? null}
          selectedTitle={draft.cardSelection?.title ?? null}
          onSelect={onCardSelect}
          onClearSelection={onClearCardSelection}
        />
      )}
      {chosen === false && (
        <AuctionCreateGenericSearch
          selectedId={draft.cardSelection?.id ?? null}
          selectedTitle={draft.cardSelection?.title ?? null}
          onSelect={onGenericSelect}
          onClearSelection={onClearCardSelection}
        />
      )}
    </div>
  );
}
