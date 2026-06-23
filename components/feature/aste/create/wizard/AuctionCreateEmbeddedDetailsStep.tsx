'use client';

import { CardLanguageSelect } from '@/components/ui/CardLanguageSelect';
import { CustomSelect } from '@/components/ui/CustomSelect';
import {
  AUCTION_CARD_CONDITION_OPTIONS,
  AUCTION_CUSTOM_DESCRIPTION_MAX,
  conditionSelectValue,
  normalizeAuctionDraftMoneyInput,
  type AuctionCreateDraft,
} from '@/lib/auction/auction-create-draft';
import type { CardLanguageOption } from '@/lib/card-languages';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { cn } from '@/lib/utils';

export type AuctionCreateEmbeddedDetailsStepProps = {
  draft: AuctionCreateDraft;
  update: <K extends keyof AuctionCreateDraft>(key: K, value: AuctionCreateDraft[K]) => void;
  cardLanguageFlagOptions: CardLanguageOption[];
};

export function AuctionCreateEmbeddedDetailsStep({
  draft,
  update,
  cardLanguageFlagOptions,
}: AuctionCreateEmbeddedDetailsStepProps) {
  const { t } = useTranslation();

  return (
    <div className="space-y-2.5">
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="mb-0.5 block text-[10px] font-bold uppercase tracking-wide text-gray-600">
            {t('auctions.createConditionLabel')}
          </label>
          <CustomSelect
            options={AUCTION_CARD_CONDITION_OPTIONS.map(({ value, labelKey }) => ({
              value,
              label: t(labelKey),
            }))}
            value={conditionSelectValue(draft.condition)}
            onChange={(value) => update('condition', value)}
            className="[&_button]:rounded-lg [&_button]:border-gray-300 [&_button]:bg-white [&_button]:px-2.5 [&_button]:py-1.5 [&_button]:text-xs"
          />
        </div>
        <div>
          <span className="mb-0.5 block text-[10px] font-bold uppercase tracking-wide text-gray-600">
            Lingua carta
          </span>
          <CardLanguageSelect
            options={cardLanguageFlagOptions}
            value={draft.cardLanguage}
            onChange={(code) => update('cardLanguage', code)}
            className="[&_button]:rounded-lg [&_button]:border-gray-300 [&_button]:bg-white [&_button]:px-2.5 [&_button]:py-1.5 [&_button]:text-xs"
          />
        </div>
      </div>

      <div>
        <label htmlFor="ac-desc-emb" className="flex items-baseline justify-between gap-2">
          <span className="text-[10px] font-bold uppercase tracking-wide text-gray-600">
            {t('auctions.createAuctionNoteLabel')}
          </span>
          <span className="text-[10px] tabular-nums text-gray-400">
            {draft.description.length}/{AUCTION_CUSTOM_DESCRIPTION_MAX}
          </span>
        </label>
        <textarea
          id="ac-desc-emb"
          value={draft.description}
          onChange={(e) => {
            const v = e.target.value;
            if (v.length <= AUCTION_CUSTOM_DESCRIPTION_MAX) update('description', v);
          }}
          rows={2}
          maxLength={AUCTION_CUSTOM_DESCRIPTION_MAX}
          className="mt-1 w-full resize-y rounded-lg border border-gray-300 px-2.5 py-1.5 text-xs text-gray-900 focus:border-[#FF7300] focus:outline-none focus:ring-2 focus:ring-[#FF7300]/25"
          placeholder={t('auctions.createAuctionNotePlaceholder')}
        />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label htmlFor="ac-start-emb" className="block text-[10px] font-bold uppercase tracking-wide text-gray-600">
            {t('auctions.createStartingBidLabel')}
          </label>
          <div className="relative mt-1">
            <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-gray-500">€</span>
            <input
              id="ac-start-emb"
              value={draft.startingBidEur}
              onChange={(e) => update('startingBidEur', e.target.value)}
              onBlur={(e) => update('startingBidEur', normalizeAuctionDraftMoneyInput(e.target.value))}
              className="w-full rounded-lg border border-gray-300 py-1.5 pl-7 pr-2.5 text-xs text-gray-900 focus:border-[#FF7300] focus:outline-none focus:ring-2 focus:ring-[#FF7300]/25"
              inputMode="decimal"
            />
          </div>
        </div>
        <div>
          <label htmlFor="ac-res-emb" className="block text-[10px] font-bold uppercase tracking-wide text-gray-600">
            {t('auctions.createReserveLabel')}
          </label>
          <div className="relative mt-1">
            <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-gray-500">€</span>
            <input
              id="ac-res-emb"
              value={draft.reservePriceEur}
              onChange={(e) => update('reservePriceEur', e.target.value)}
              onBlur={(e) => update('reservePriceEur', normalizeAuctionDraftMoneyInput(e.target.value))}
              className="w-full rounded-lg border border-gray-300 py-1.5 pl-7 pr-2.5 text-xs text-gray-900 focus:border-[#FF7300] focus:outline-none focus:ring-2 focus:ring-[#FF7300]/25"
              inputMode="decimal"
              placeholder="—"
            />
          </div>
        </div>
      </div>
      <p className="text-[10px] leading-snug text-gray-500">{t('auctions.createReserveHint')}</p>

      <div className="flex flex-wrap items-center gap-1.5">
        <span className="text-[10px] font-bold uppercase tracking-wide text-gray-600">
          {t('auctions.createDurationLabel')}
        </span>
        {([3, 5, 7] as const).map((d) => (
          <button
            key={d}
            type="button"
            onClick={() => update('durationDays', d)}
            className={cn(
              'rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide transition-colors',
              draft.durationDays === d
                ? 'border-[#FF7300] bg-[#FF7300] text-white'
                : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
            )}
          >
            {t('auctions.createDurationDays', { days: d })}
          </button>
        ))}
      </div>
    </div>
  );
}
