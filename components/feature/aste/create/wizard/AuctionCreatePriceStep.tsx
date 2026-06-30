'use client';

import { normalizeAuctionDraftMoneyInput, type AuctionCreateDraft } from '@/lib/auction/auction-create-draft';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { cn } from '@/lib/utils';

type AuctionCreateDraftUpdate = <K extends keyof AuctionCreateDraft>(
  key: K,
  value: AuctionCreateDraft[K]
) => void;

export type AuctionCreatePriceStepProps = {
  draft: AuctionCreateDraft;
  update: AuctionCreateDraftUpdate;
  isEmbedded: boolean;
};

export function AuctionCreatePriceStep({ draft, update, isEmbedded }: AuctionCreatePriceStepProps) {
  const { t } = useTranslation();

  return (
    <div className={cn('space-y-5', isEmbedded && 'space-y-3')}>
      <div className={cn('grid gap-5 sm:grid-cols-2', isEmbedded && 'gap-2.5')}>
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
              className={cn(
                'w-full rounded-lg border border-gray-300 py-2.5 pl-8 pr-3 text-sm text-gray-900 focus:border-[#FF7300] focus:outline-none focus:ring-2 focus:ring-[#FF7300]/25',
                isEmbedded && 'py-2'
              )}
              inputMode="decimal"
            />
          </div>
        </div>
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
              className={cn(
                'w-full rounded-lg border border-gray-300 py-2.5 pl-8 pr-3 text-sm text-gray-900 focus:border-[#FF7300] focus:outline-none focus:ring-2 focus:ring-[#FF7300]/25',
                isEmbedded && 'py-2'
              )}
              inputMode="decimal"
              placeholder="—"
            />
          </div>
          <p className={cn('mt-1 text-xs text-gray-500', isEmbedded && 'mt-0.5 text-[11px]')}>
            {t('auctions.createReserveHint')}
          </p>
        </div>
      </div>
      {!isEmbedded && (
        draft.inventoryListPriceEur ? (
          // Carta già in vendita (da inventario, prezzata): chiediamo se tenerla in
          // vendita. Sì → il "Compra subito" eredita il prezzo del listing; No → niente buy-now.
          <div className="rounded-xl border border-gray-200 bg-gray-50/80 p-4">
            <span className="block text-xs font-bold uppercase tracking-wide text-gray-600">
              {t('auctions.createKeepListingLabel')}
            </span>
            <p className="mt-1 text-xs leading-snug text-gray-500">
              {t('auctions.createKeepListingHint', { price: draft.inventoryListPriceEur })}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => {
                  update('keepInventoryListing', true);
                  update('buyNowPriceEur', draft.inventoryListPriceEur);
                }}
                className={cn(
                  'rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-wide transition-colors',
                  draft.keepInventoryListing
                    ? 'border-[#FF7300] bg-[#FF7300] text-white'
                    : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                )}
              >
                {t('auctions.createKeepListingYes')}
              </button>
              <button
                type="button"
                onClick={() => {
                  update('keepInventoryListing', false);
                  update('buyNowPriceEur', '');
                }}
                className={cn(
                  'rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-wide transition-colors',
                  !draft.keepInventoryListing
                    ? 'border-[#FF7300] bg-[#FF7300] text-white'
                    : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                )}
              >
                {t('auctions.createKeepListingNo')}
              </button>
            </div>
          </div>
        ) : (
          // Prodotto caricato direttamente in asta: "Compra subito" facoltativo.
          <div>
            <label htmlFor="ac-buynow" className="block text-xs font-bold uppercase tracking-wide text-gray-600">
              {t('auctions.createBuyNowLabel')}
            </label>
            <div className="relative mt-1.5 max-w-xs">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-500">€</span>
              <input
                id="ac-buynow"
                value={draft.buyNowPriceEur}
                onChange={(e) => update('buyNowPriceEur', e.target.value)}
                onBlur={(e) => update('buyNowPriceEur', normalizeAuctionDraftMoneyInput(e.target.value))}
                className="w-full rounded-lg border border-gray-300 py-2.5 pl-8 pr-3 text-sm text-gray-900 focus:border-[#FF7300] focus:outline-none focus:ring-2 focus:ring-[#FF7300]/25"
                inputMode="decimal"
                placeholder="—"
              />
            </div>
            <p className="mt-1 text-xs text-gray-500">{t('auctions.createBuyNowHint')}</p>
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
