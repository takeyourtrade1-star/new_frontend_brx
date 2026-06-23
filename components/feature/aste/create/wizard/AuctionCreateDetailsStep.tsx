'use client';

import { useMemo } from 'react';
import { Info } from 'lucide-react';
import {
  AUCTION_ANTI_SNIPER_BACKEND_READY,
  AUCTION_ANTI_SNIPER_MINUTES_OPTIONS,
  AUCTION_CARD_CONDITION_OPTIONS,
  AUCTION_CUSTOM_DESCRIPTION_MAX,
  conditionSelectValue,
  type AuctionCreateDraft,
} from '@/lib/auction/auction-create-draft';
import { buildCardLanguageOptions } from '@/lib/card-languages';
import { CardLanguageSelect } from '@/components/ui/CardLanguageSelect';
import { CustomSelect } from '@/components/ui/CustomSelect';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { cn } from '@/lib/utils';

type AuctionCreateDraftUpdate = <K extends keyof AuctionCreateDraft>(
  key: K,
  value: AuctionCreateDraft[K]
) => void;

export type AuctionCreateDetailsStepProps = {
  draft: AuctionCreateDraft;
  update: AuctionCreateDraftUpdate;
  isEmbedded: boolean;
};

export function AuctionCreateDetailsStep({ draft, update, isEmbedded }: AuctionCreateDetailsStepProps) {
  const { t } = useTranslation();

  const cardLanguageFlagOptions = useMemo(
    () => buildCardLanguageOptions(draft.cardSelection?.availableLanguages),
    [draft.cardSelection?.availableLanguages]
  );

  return (
    <>
      {draft.isCard && !isEmbedded ? (
        <div className="space-y-5">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wide text-gray-600">
              {t('auctions.createConditionLabel')}
            </label>
            <CustomSelect
              options={AUCTION_CARD_CONDITION_OPTIONS.map(({ value, labelKey }) => ({
                value,
                label: t(labelKey),
              }))}
              value={conditionSelectValue(draft.condition)}
              onChange={(value) => update('condition', value)}
              className="mt-1.5"
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wide text-gray-600">
              Lingua carta
            </label>
            <CardLanguageSelect
              options={cardLanguageFlagOptions}
              value={draft.cardLanguage}
              onChange={(code) => update('cardLanguage', code)}
              className="mt-1.5"
            />
          </div>
          <div>
            <span className="block text-xs font-bold uppercase tracking-wide text-gray-600">
              {t('auctions.createDurationLabel')}
            </span>
            <div className="mt-2 flex flex-wrap gap-2">
              {([3, 5, 7] as const).map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => update('durationDays', d)}
                  className={cn(
                    'rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-wide transition-colors',
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
          <div className="rounded-xl border border-gray-200 bg-gray-50/80 p-4">
            <div className="flex flex-wrap items-center gap-2">
              <label className="flex cursor-pointer items-center gap-2">
                <input
                  type="checkbox"
                  checked={draft.antiSniperEnabled}
                  onChange={(e) => update('antiSniperEnabled', e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-[#FF7300] focus:ring-[#FF7300]/30"
                />
                <span className="text-xs font-bold uppercase tracking-wide text-gray-700">
                  {t('auctions.createAntiSniperToggle')}
                </span>
              </label>
              <span className="text-xs font-bold uppercase tracking-wide text-gray-500">
                {t('auctions.createAntiSniperLabel')}
              </span>
              <button
                type="button"
                title={t('auctions.createAntiSniperHint')}
                className="inline-flex h-6 w-6 items-center justify-center rounded-full text-gray-400 transition hover:bg-gray-200 hover:text-[#1D3160]"
                aria-label={t('auctions.createAntiSniperHint')}
              >
                <Info className="h-4 w-4" aria-hidden />
              </button>
            </div>
            {draft.antiSniperEnabled && (
              <div className="mt-3 flex flex-wrap items-center gap-2">
                {AUCTION_ANTI_SNIPER_MINUTES_OPTIONS.map((minutes) => {
                  const backendReady = AUCTION_ANTI_SNIPER_BACKEND_READY.has(minutes);
                  return (
                    <button
                      key={minutes}
                      type="button"
                      disabled={!backendReady}
                      onClick={() => backendReady && update('antiSniperMinutes', minutes)}
                      className={cn(
                        'relative rounded-full border px-3 py-1.5 text-xs font-semibold uppercase tracking-wide transition-colors',
                        !backendReady && 'cursor-not-allowed opacity-50',
                        draft.antiSniperMinutes === minutes && backendReady
                          ? 'border-[#FF7300] bg-[#FF7300] text-white'
                          : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                      )}
                    >
                      {t('auctions.createAntiSniperMinutes', { minutes: String(minutes) })}
                      {!backendReady && (
                        <span className="ml-1 text-[9px] font-medium normal-case text-gray-400">
                          ({t('auctions.createAntiSniperComingSoon')})
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
          <div>
            <label htmlFor="ac-desc" className="flex items-baseline justify-between gap-2">
              <span className="text-xs font-bold uppercase tracking-wide text-gray-600">
                {t('auctions.createObjectNoteLabel')}
              </span>
              <span className="text-[11px] tabular-nums text-gray-400">
                {draft.description.length}/{AUCTION_CUSTOM_DESCRIPTION_MAX}
              </span>
            </label>
            <textarea
              id="ac-desc"
              value={draft.description}
              onChange={(e) => {
                const v = e.target.value;
                if (v.length <= AUCTION_CUSTOM_DESCRIPTION_MAX) update('description', v);
              }}
              rows={4}
              maxLength={AUCTION_CUSTOM_DESCRIPTION_MAX}
              className="mt-1.5 w-full resize-y rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-900 focus:border-[#FF7300] focus:outline-none focus:ring-2 focus:ring-[#FF7300]/25"
              placeholder={t('auctions.createObjectNotePlaceholder')}
            />
            <p className="mt-1 text-xs text-gray-500">{t('auctions.createAuctionNoteHint')}</p>
          </div>
        </div>
      ) : null}

      {draft.isCard === false ? (
        <div className={cn('space-y-5', isEmbedded && 'space-y-3')}>
          <div>
            <label htmlFor="ac-title-nc" className="block text-xs font-bold uppercase tracking-wide text-gray-600">
              {t('auctions.createTitleLabel')}
            </label>
            <input
              id="ac-title-nc"
              value={draft.title}
              onChange={(e) => update('title', e.target.value)}
              className={cn(
                'mt-1.5 w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-900 focus:border-[#FF7300] focus:outline-none focus:ring-2 focus:ring-[#FF7300]/25',
                isEmbedded && 'py-2'
              )}
              placeholder={t('auctions.createTitlePlaceholder')}
              autoComplete="off"
            />
          </div>
          <div>
            <label htmlFor="ac-desc-nc" className="block text-xs font-bold uppercase tracking-wide text-gray-600">
              {t('auctions.createDescLabel')}
            </label>
            <textarea
              id="ac-desc-nc"
              value={draft.description}
              onChange={(e) => update('description', e.target.value)}
              rows={isEmbedded ? 3 : 4}
              className={cn(
                'mt-1.5 w-full resize-y rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-900 focus:border-[#FF7300] focus:outline-none focus:ring-2 focus:ring-[#FF7300]/25',
                isEmbedded && 'py-2'
              )}
              placeholder={t('auctions.createDescPlaceholder')}
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wide text-gray-600">
              {t('auctions.createConditionLabel')}
            </label>
            <CustomSelect
              options={AUCTION_CARD_CONDITION_OPTIONS.map(({ value, labelKey }) => ({
                value,
                label: t(labelKey),
              }))}
              value={conditionSelectValue(draft.condition)}
              onChange={(value) => update('condition', value)}
              className={cn('mt-1.5', isEmbedded && '[&_button]:py-2')}
            />
          </div>
        </div>
      ) : null}
    </>
  );
}
