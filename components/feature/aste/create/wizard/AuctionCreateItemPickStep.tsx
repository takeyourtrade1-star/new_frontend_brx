'use client';

import { useRouter } from 'next/navigation';
import type { AuctionCreateCardSelection, AuctionCreateDraft } from '@/lib/auction/auction-create-draft';
import { useTranslation } from '@/lib/i18n/useTranslation';
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

  return (
    <div className="flex flex-col gap-5">
      {draft.fromSyncInventory === null ? (
        <div className="flex flex-col items-center gap-5">
          <div className="flex w-full flex-col gap-3 sm:flex-row sm:justify-center">
            <button
              type="button"
              onClick={onChooseInInventoryYes}
              data-step-focus="true"
              className="rounded-xl border-2 border-[#FF7300] bg-[#FF7300] px-8 py-4 text-sm font-bold uppercase text-white transition hover:bg-[#e86800]"
            >
              {t('auctions.createInInventoryYes')}
            </button>
            <button
              type="button"
              onClick={onChooseInInventoryNo}
              className="rounded-xl border-2 border-[#1D3160] bg-white px-8 py-4 text-sm font-bold uppercase text-[#1D3160] transition hover:bg-[#1D3160]/5"
            >
              {t('auctions.createInInventoryNo')}
            </button>
          </div>
          <button
            type="button"
            onClick={() => router.push('/aste')}
            className="text-xs font-semibold uppercase tracking-wide text-gray-500 underline decoration-gray-300 underline-offset-4 transition hover:text-[#1D3160] hover:decoration-[#1D3160]/40"
          >
            {t('auctions.createCancel')}
          </button>
        </div>
      ) : draft.fromSyncInventory === true ? (
        <AuctionCreateCardPicker
          variant="wizard-step1-inventory"
          selectedId={draft.cardSelection?.id ?? null}
          selectedTitle={draft.cardSelection?.title ?? null}
          onSelect={onCardSelect}
          onClearSelection={onClearCardSelection}
        />
      ) : (
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
