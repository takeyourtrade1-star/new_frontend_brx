'use client';

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import { Camera, Info } from 'lucide-react';
import {
  AUCTION_ANTI_SNIPE_BACKEND_READY,
  AUCTION_ANTI_SNIPE_MINUTES_OPTIONS,
  AUCTION_CARD_CONDITION_OPTIONS,
  AUCTION_CUSTOM_DESCRIPTION_MAX,
  conditionSelectValue,
  type AuctionCreateDraft,
} from '@/lib/auction/auction-create-draft';
import {
  readAuctionLanguagePreference,
  writeAuctionLanguagePreference,
} from '@/lib/auction/auction-language-preference';
import { buildCardLanguageOptions } from '@/lib/card-languages';
import { CardLanguageSelect } from '@/components/ui/CardLanguageSelect';
import { CustomSelect } from '@/components/ui/CustomSelect';
import { getCardImageUrl } from '@/lib/assets';
import { AuctionCreateCardDataPanel } from '@/components/feature/aste/create/AuctionCreateCardDataPanel';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { cn } from '@/lib/utils';

type AuctionCreateDraftUpdate = <K extends keyof AuctionCreateDraft>(
  key: K,
  value: AuctionCreateDraft[K]
) => void;

/** Stile select condiviso con la tab VENDI (SellSingleDetailsStep). */
const SELL_TAB_SELECT_CLASS =
  '[&_button]:rounded-md [&_button]:border-zinc-200/80 [&_button]:bg-zinc-50/40 [&_button]:px-2 [&_button]:py-1 [&_button]:text-[13px]';

export type AuctionCreateDetailsStepProps = {
  draft: AuctionCreateDraft;
  update: AuctionCreateDraftUpdate;
  isEmbedded: boolean;
};

export function AuctionCreateDetailsStep({ draft, update, isEmbedded }: AuctionCreateDetailsStepProps) {
  const { t } = useTranslation();
  const [rememberLanguage, setRememberLanguage] = useState(false);

  const cardLanguageFlagOptions = useMemo(
    () => buildCardLanguageOptions(draft.cardSelection?.availableLanguages),
    [draft.cardSelection?.availableLanguages]
  );

  const isFromInventory = draft.cardSelection?.inventoryItemId != null;

  useEffect(() => {
    if (isEmbedded || isFromInventory || draft.cardLanguage) return;
    const cached = readAuctionLanguagePreference();
    if (!cached) return;
    const valid = cardLanguageFlagOptions.some((o) => o.code === cached);
    if (valid) update('cardLanguage', cached);
  }, [isEmbedded, isFromInventory, draft.cardLanguage, cardLanguageFlagOptions, update]);

  const handleLanguageChange = (code: string) => {
    update('cardLanguage', code);
    if (rememberLanguage && code) {
      writeAuctionLanguagePreference(code);
    }
  };

  const imageUrl = draft.cardSelection?.image
    ? getCardImageUrl(draft.cardSelection.image)
    : null;

  return (
    <>
      {draft.isCard && !isEmbedded ? (
        <div className="space-y-5">
          {draft.cardSelection ? (
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
              <div className="mx-auto w-full max-w-[180px] shrink-0 sm:mx-0 sm:max-w-[200px]">
                <p className="mb-2 truncate text-center text-sm font-semibold text-[#1D3160] sm:text-left">
                  {draft.cardSelection.title}
                </p>
                <div
                  className="relative aspect-[63/88] w-full overflow-hidden rounded-xl border border-zinc-300/50 bg-zinc-100/60 shadow-sm"
                  style={{ aspectRatio: '63/88' }}
                >
                  {imageUrl ? (
                    <Image
                      src={imageUrl}
                      alt={draft.cardSelection.title}
                      fill
                      className="object-contain"
                      sizes="200px"
                      unoptimized
                    />
                  ) : (
                    <span className="absolute inset-0 flex items-center justify-center text-gray-300">
                      <Camera className="h-8 w-8" aria-hidden />
                    </span>
                  )}
                </div>
              </div>

              <div className="min-w-0 flex-1 space-y-4">
                <AuctionCreateCardDataPanel selection={draft.cardSelection} />

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="mb-0.5 block text-[9px] font-semibold uppercase tracking-wider text-zinc-400">
                      {t('auctions.createCardLanguageLabel')}
                    </label>
                    <CardLanguageSelect
                      options={cardLanguageFlagOptions}
                      value={draft.cardLanguage}
                      onChange={handleLanguageChange}
                      placeholder={t('auctions.createCardLanguagePlaceholder')}
                      className={SELL_TAB_SELECT_CLASS}
                    />
                    {!isFromInventory ? (
                      <label className="mt-1.5 flex cursor-pointer items-center gap-1.5 text-[10px] font-semibold text-zinc-600">
                        <input
                          type="checkbox"
                          checked={rememberLanguage}
                          onChange={(e) => {
                            const checked = e.target.checked;
                            setRememberLanguage(checked);
                            if (checked && draft.cardLanguage) {
                              writeAuctionLanguagePreference(draft.cardLanguage);
                            }
                          }}
                          className="h-3 w-3 rounded border-zinc-300 text-primary focus:ring-primary/25"
                        />
                        {t('auctions.createRememberLanguage1h')}
                      </label>
                    ) : null}
                  </div>
                  <div>
                    <label className="mb-0.5 block text-[9px] font-semibold uppercase tracking-wider text-zinc-400">
                      {t('auctions.createConditionLabel')}
                    </label>
                    <CustomSelect
                      options={AUCTION_CARD_CONDITION_OPTIONS.map(({ value, labelKey }) => ({
                        value,
                        label: t(labelKey),
                      }))}
                      value={conditionSelectValue(draft.condition)}
                      onChange={(value) => update('condition', value)}
                      placeholder={t('auctions.createConditionPlaceholder')}
                      className={SELL_TAB_SELECT_CLASS}
                    />
                  </div>
                </div>
              </div>
            </div>
          ) : null}

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
              <span className="text-xs font-bold uppercase tracking-wide text-gray-700">
                {t('auctions.createAntiSnipeLabel')}
              </span>
              <button
                type="button"
                title={t('auctions.createAntiSnipeHint')}
                className="inline-flex h-6 w-6 items-center justify-center rounded-full text-gray-400 transition hover:bg-gray-200 hover:text-[#1D3160]"
                aria-label={t('auctions.createAntiSnipeHint')}
              >
                <Info className="h-4 w-4" aria-hidden />
              </button>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              {AUCTION_ANTI_SNIPE_MINUTES_OPTIONS.map((minutes) => {
                const backendReady = AUCTION_ANTI_SNIPE_BACKEND_READY.has(minutes);
                return (
                  <button
                    key={minutes}
                    type="button"
                    disabled={!backendReady}
                    onClick={() => backendReady && update('antiSnipeMinutes', minutes)}
                    className={cn(
                      'relative rounded-full border px-3 py-1.5 text-xs font-semibold uppercase tracking-wide transition-colors',
                      !backendReady && 'cursor-not-allowed opacity-50',
                      draft.antiSnipeMinutes === minutes && backendReady
                        ? 'border-[#FF7300] bg-[#FF7300] text-white'
                        : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                    )}
                  >
                    {t('auctions.createAntiSnipeMinutes', { minutes: String(minutes) })}
                    {!backendReady && (
                      <span className="ml-1 text-[9px] font-medium normal-case text-gray-400">
                        ({t('auctions.createAntiSnipeComingSoon')})
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
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
