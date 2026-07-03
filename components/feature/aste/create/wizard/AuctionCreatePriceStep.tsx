'use client';

import { useState } from 'react';
import { normalizeAuctionDraftMoneyInput, type AuctionCreateDraft } from '@/lib/auction/auction-create-draft';
import {
  clearAuctionBuyNowEnabledPreference,
  clearAuctionReserveEnabledPreference,
  writeAuctionBuyNowEnabledPreference,
  writeAuctionReserveEnabledPreference,
} from '@/lib/auction/auction-wizard-preferences';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { cn } from '@/lib/utils';
import { AuctionWizardRemember1hCheckbox } from './AuctionWizardRemember1hCheckbox';

type AuctionCreateDraftUpdate = <K extends keyof AuctionCreateDraft>(
  key: K,
  value: AuctionCreateDraft[K]
) => void;

export type AuctionCreatePriceStepProps = {
  draft: AuctionCreateDraft;
  update: AuctionCreateDraftUpdate;
  isEmbedded: boolean;
};

/** Coppia di pill Sì/No: scelta esplicita obbligatoria (stato iniziale null = nessuna selezionata). */
function YesNoToggle({
  value,
  onChange,
  yesLabel,
  noLabel,
  ariaLabel,
}: {
  value: boolean | null;
  onChange: (next: boolean) => void;
  yesLabel: string;
  noLabel: string;
  ariaLabel: string;
}) {
  const pill = (target: boolean) =>
    cn(
      'rounded-full border px-4 py-1.5 text-xs font-semibold uppercase tracking-wide transition-colors',
      value === target
        ? 'border-[#FF7300] bg-[#FF7300] text-white'
        : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
    );
  return (
    <div className="flex shrink-0 gap-2" role="group" aria-label={ariaLabel}>
      <button type="button" onClick={() => onChange(true)} aria-pressed={value === true} className={pill(true)}>
        {yesLabel}
      </button>
      <button type="button" onClick={() => onChange(false)} aria-pressed={value === false} className={pill(false)}>
        {noLabel}
      </button>
    </div>
  );
}

const MONEY_INPUT_CLS =
  'w-full rounded-lg border border-gray-300 py-2.5 pl-8 pr-3 text-sm text-gray-900 focus:border-[#FF7300] focus:outline-none focus:ring-2 focus:ring-[#FF7300]/25';

export function AuctionCreatePriceStep({ draft, update, isEmbedded }: AuctionCreatePriceStepProps) {
  const { t } = useTranslation();
  const [rememberReserve, setRememberReserve] = useState(false);
  const [rememberBuyNow, setRememberBuyNow] = useState(false);

  return (
    <div className={cn('space-y-5', isEmbedded && 'space-y-3')}>
      <div className={cn(!isEmbedded && 'max-w-xs', isEmbedded && 'grid gap-2.5 sm:grid-cols-2')}>
        <div>
          <label htmlFor="ac-start" className="block text-xs font-bold uppercase tracking-wide text-gray-600">
            {t('auctions.createStartingBidLabel')}
          </label>
          <div className="relative mt-1.5">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-500">€</span>
            <input
              id="ac-start"
              value={draft.startingBidEur}
              onChange={(e) => update('startingBidEur', e.target.value)}
              onBlur={(e) => update('startingBidEur', normalizeAuctionDraftMoneyInput(e.target.value))}
              className={cn(MONEY_INPUT_CLS, isEmbedded && 'py-2')}
              inputMode="decimal"
            />
          </div>
        </div>
        {isEmbedded && (
          <div>
            <label htmlFor="ac-res" className="block text-xs font-bold uppercase tracking-wide text-gray-600">
              {t('auctions.createReserveLabel')}
            </label>
            <div className="relative mt-1.5">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-500">€</span>
              <input
                id="ac-res"
                value={draft.reservePriceEur}
                onChange={(e) => update('reservePriceEur', e.target.value)}
                onBlur={(e) => update('reservePriceEur', normalizeAuctionDraftMoneyInput(e.target.value))}
                className={cn(MONEY_INPUT_CLS, 'py-2')}
                inputMode="decimal"
                placeholder="—"
              />
            </div>
            <p className="mt-0.5 text-[11px] text-gray-500">{t('auctions.createReserveHint')}</p>
          </div>
        )}
      </div>
      {!isEmbedded && (
        // Scelta esplicita obbligatoria: l'utente deve rispondere Sì o No
        // sia alla riserva sia al Compra subito prima di poter proseguire.
        <div className="rounded-xl border border-gray-200 bg-gray-50/80 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="text-xs font-bold uppercase tracking-wide text-gray-600">
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
          <p className="mt-1 text-xs leading-snug text-gray-500">{t('auctions.createReserveHint')}</p>
          <AuctionWizardRemember1hCheckbox
            checked={rememberReserve}
            onCheckedChange={(checked) => {
              setRememberReserve(checked);
              if (checked && draft.reserveEnabled !== null) {
                writeAuctionReserveEnabledPreference(draft.reserveEnabled);
              } else if (!checked) {
                clearAuctionReserveEnabledPreference();
              }
            }}
          />
          {draft.reserveEnabled && (
            <div className="relative mt-3 max-w-xs">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-500">€</span>
              <input
                id="ac-res"
                value={draft.reservePriceEur}
                onChange={(e) => update('reservePriceEur', e.target.value)}
                onBlur={(e) => update('reservePriceEur', normalizeAuctionDraftMoneyInput(e.target.value))}
                className={MONEY_INPUT_CLS}
                inputMode="decimal"
                placeholder="—"
                aria-label={t('auctions.createReserveToggleLabel')}
              />
            </div>
          )}
        </div>
      )}
      {!isEmbedded && (
        draft.inventoryListPriceEur ? (
          // Carta già in vendita (da inventario, prezzata): chiediamo se tenerla in
          // vendita. Sì → il "Compra subito" eredita il prezzo del listing; No → niente buy-now.
          // La scelta vale anche come toggle obbligatorio del Compra subito.
          <div className="rounded-xl border border-gray-200 bg-gray-50/80 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <span className="text-xs font-bold uppercase tracking-wide text-gray-600">
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
            <p className="mt-1 text-xs leading-snug text-gray-500">
              {t('auctions.createKeepListingHint', { price: draft.inventoryListPriceEur })}
            </p>
            <AuctionWizardRemember1hCheckbox
              checked={rememberBuyNow}
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
          <div className="rounded-xl border border-gray-200 bg-gray-50/80 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <span className="text-xs font-bold uppercase tracking-wide text-gray-600">
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
            <p className="mt-1 text-xs leading-snug text-gray-500">{t('auctions.createBuyNowHint')}</p>
            <AuctionWizardRemember1hCheckbox
              checked={rememberBuyNow}
              onCheckedChange={(checked) => {
                setRememberBuyNow(checked);
                if (checked && draft.buyNowEnabled !== null) {
                  writeAuctionBuyNowEnabledPreference(draft.buyNowEnabled);
                } else if (!checked) {
                  clearAuctionBuyNowEnabledPreference();
                }
              }}
            />
            {draft.buyNowEnabled && (
              <div className="relative mt-3 max-w-xs">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-500">€</span>
                <input
                  id="ac-buynow"
                  value={draft.buyNowPriceEur}
                  onChange={(e) => update('buyNowPriceEur', e.target.value)}
                  onBlur={(e) => update('buyNowPriceEur', normalizeAuctionDraftMoneyInput(e.target.value))}
                  className={MONEY_INPUT_CLS}
                  inputMode="decimal"
                  placeholder="—"
                  aria-label={t('auctions.createBuyNowToggleLabel')}
                />
              </div>
            )}
          </div>
        )
      )}
      {isEmbedded && (
        <div>
          <span className="block text-xs font-bold uppercase tracking-wide text-gray-600">
            {t('auctions.createDurationLabel')}
          </span>
          <div className={cn('mt-2 flex flex-wrap gap-2', isEmbedded && 'mt-1 gap-1')}>
            {([3, 5, 7] as const).map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => update('durationDays', d)}
                className={cn(
                  'rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-wide transition-colors',
                  isEmbedded && 'px-3 py-1.5 text-[11px]',
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
      )}
    </div>
  );
}
