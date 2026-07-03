'use client';

import { useEffect, useState } from 'react';
import { CardLanguageSelect } from '@/components/ui/CardLanguageSelect';
import { CustomSelect } from '@/components/ui/CustomSelect';
import {
  AUCTION_CARD_CONDITION_OPTIONS,
  AUCTION_CUSTOM_DESCRIPTION_MAX,
  conditionSelectValue,
  normalizeAuctionDraftMoneyInput,
  type AuctionCreateDraft,
} from '@/lib/auction/auction-create-draft';
import {
  readAuctionLanguagePreference,
  writeAuctionLanguagePreference,
} from '@/lib/auction/auction-language-preference';
import {
  clearAuctionBuyNowEnabledPreference,
  clearAuctionReserveEnabledPreference,
  writeAuctionBuyNowEnabledPreference,
  writeAuctionReserveEnabledPreference,
} from '@/lib/auction/auction-wizard-preferences';
import type { CardLanguageOption } from '@/lib/card-languages';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { cn } from '@/lib/utils';
import { YesNoToggle } from './AuctionCreatePriceStep';
import { AuctionWizardRemember1hCheckbox } from './AuctionWizardRemember1hCheckbox';

const EMB_MONEY_INPUT_CLS =
  'w-full rounded-lg border border-gray-300 py-1.5 pl-7 pr-2.5 text-xs text-gray-900 focus:border-[#FF7300] focus:outline-none focus:ring-2 focus:ring-[#FF7300]/25';

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
  const [rememberLanguage, setRememberLanguage] = useState(false);
  const [rememberReserve, setRememberReserve] = useState(false);
  const [rememberBuyNow, setRememberBuyNow] = useState(false);

  useEffect(() => {
    if (draft.cardLanguage) return;
    const cached = readAuctionLanguagePreference();
    if (!cached) return;
    const valid = cardLanguageFlagOptions.some((o) => o.code === cached);
    if (valid) update('cardLanguage', cached);
  }, [draft.cardLanguage, cardLanguageFlagOptions, update]);

  const handleLanguageChange = (code: string) => {
    update('cardLanguage', code);
    if (rememberLanguage && code) {
      writeAuctionLanguagePreference(code);
    }
  };

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
            {t('auctions.createCardLanguageLabel')}
          </span>
          <CardLanguageSelect
            options={cardLanguageFlagOptions}
            value={draft.cardLanguage}
            onChange={handleLanguageChange}
            className="[&_button]:rounded-lg [&_button]:border-gray-300 [&_button]:bg-white [&_button]:px-2.5 [&_button]:py-1.5 [&_button]:text-xs"
          />
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

      <div>
        <label htmlFor="ac-start-emb" className="block text-[10px] font-bold uppercase tracking-wide text-gray-600">
          {t('auctions.createStartingBidLabel')}
        </label>
        <div className="relative mt-1 max-w-xs">
          <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-gray-500">€</span>
          <input
            id="ac-start-emb"
            value={draft.startingBidEur}
            onChange={(e) => update('startingBidEur', e.target.value)}
            onBlur={(e) => update('startingBidEur', normalizeAuctionDraftMoneyInput(e.target.value))}
            className={EMB_MONEY_INPUT_CLS}
            inputMode="decimal"
          />
        </div>
      </div>

      <div className="rounded-lg border border-gray-200 bg-gray-50/80 p-2.5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-[10px] font-bold uppercase tracking-wide text-gray-600">
            {t('auctions.createReserveToggleLabel')}
          </span>
          <YesNoToggle
            value={draft.reserveEnabled}
            onChange={(next) => {
              update('reserveEnabled', next);
              if (!next) update('reservePriceEur', '');
              if (rememberReserve) writeAuctionReserveEnabledPreference(next);
            }}
            yesLabel={t('auctions.createInInventoryYes')}
            noLabel={t('auctions.createInInventoryNo')}
            ariaLabel={t('auctions.createReserveToggleLabel')}
          />
        </div>
        <p className="mt-1 text-[10px] leading-snug text-gray-500">{t('auctions.createReserveHint')}</p>
        <AuctionWizardRemember1hCheckbox
          checked={rememberReserve}
          className="mt-1.5"
          onCheckedChange={(checked) => {
            setRememberReserve(checked);
            if (checked && draft.reserveEnabled !== null) {
              writeAuctionReserveEnabledPreference(draft.reserveEnabled);
            } else if (!checked) {
              clearAuctionReserveEnabledPreference();
            }
          }}
        />
        {draft.reserveEnabled ? (
          <div className="relative mt-2 max-w-xs">
            <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-gray-500">€</span>
            <input
              id="ac-res-emb"
              value={draft.reservePriceEur}
              onChange={(e) => update('reservePriceEur', e.target.value)}
              onBlur={(e) => update('reservePriceEur', normalizeAuctionDraftMoneyInput(e.target.value))}
              className={EMB_MONEY_INPUT_CLS}
              inputMode="decimal"
              placeholder="—"
              aria-label={t('auctions.createReserveToggleLabel')}
            />
          </div>
        ) : null}
      </div>

      {draft.inventoryListPriceEur ? (
        <div className="rounded-lg border border-gray-200 bg-gray-50/80 p-2.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="block text-[10px] font-bold uppercase tracking-wide text-gray-600">
              {t('auctions.createKeepListingLabel')}
            </span>
            <YesNoToggle
              value={draft.buyNowEnabled}
              onChange={(next) => {
                update('keepInventoryListing', next);
                update('buyNowEnabled', next);
                update('buyNowPriceEur', next ? draft.inventoryListPriceEur : '');
                if (rememberBuyNow) writeAuctionBuyNowEnabledPreference(next);
              }}
              yesLabel={t('auctions.createKeepListingYes')}
              noLabel={t('auctions.createKeepListingNo')}
              ariaLabel={t('auctions.createKeepListingLabel')}
            />
          </div>
          <p className="mt-1 text-[10px] leading-snug text-gray-500">
            {t('auctions.createKeepListingHint', { price: draft.inventoryListPriceEur })}
          </p>
          <AuctionWizardRemember1hCheckbox
            checked={rememberBuyNow}
            className="mt-1.5"
            onCheckedChange={(checked) => {
              setRememberBuyNow(checked);
              if (checked && draft.buyNowEnabled !== null) {
                writeAuctionBuyNowEnabledPreference(draft.buyNowEnabled);
              } else if (!checked) {
                clearAuctionBuyNowEnabledPreference();
              }
            }}
          />
        </div>
      ) : (
        <div className="rounded-lg border border-gray-200 bg-gray-50/80 p-2.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wide text-gray-600">
              {t('auctions.createBuyNowToggleLabel')}
            </span>
            <YesNoToggle
              value={draft.buyNowEnabled}
              onChange={(next) => {
                update('buyNowEnabled', next);
                if (!next) update('buyNowPriceEur', '');
                if (rememberBuyNow) writeAuctionBuyNowEnabledPreference(next);
              }}
              yesLabel={t('auctions.createInInventoryYes')}
              noLabel={t('auctions.createInInventoryNo')}
              ariaLabel={t('auctions.createBuyNowToggleLabel')}
            />
          </div>
          <p className="mt-1 text-[10px] leading-snug text-gray-500">{t('auctions.createBuyNowHint')}</p>
          <AuctionWizardRemember1hCheckbox
            checked={rememberBuyNow}
            className="mt-1.5"
            onCheckedChange={(checked) => {
              setRememberBuyNow(checked);
              if (checked && draft.buyNowEnabled !== null) {
                writeAuctionBuyNowEnabledPreference(draft.buyNowEnabled);
              } else if (!checked) {
                clearAuctionBuyNowEnabledPreference();
              }
            }}
          />
          {draft.buyNowEnabled ? (
            <div className="relative mt-2 max-w-xs">
              <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-gray-500">€</span>
              <input
                id="ac-buynow-emb"
                value={draft.buyNowPriceEur}
                onChange={(e) => update('buyNowPriceEur', e.target.value)}
                onBlur={(e) => update('buyNowPriceEur', normalizeAuctionDraftMoneyInput(e.target.value))}
                className={EMB_MONEY_INPUT_CLS}
                inputMode="decimal"
                placeholder="—"
                aria-label={t('auctions.createBuyNowToggleLabel')}
              />
            </div>
          ) : null}
        </div>
      )}

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
