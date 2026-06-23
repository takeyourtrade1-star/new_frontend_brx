'use client';

import { Package } from 'lucide-react';
import { normalizeAuctionDraftMoneyInput, type AuctionCreateDraft } from '@/lib/auction/auction-create-draft';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { cn } from '@/lib/utils';

type AuctionCreateDraftUpdate = <K extends keyof AuctionCreateDraft>(
  key: K,
  value: AuctionCreateDraft[K]
) => void;

export type AuctionCreateShippingStepProps = {
  draft: AuctionCreateDraft;
  update: AuctionCreateDraftUpdate;
  isEmbedded: boolean;
};

export function AuctionCreateShippingStep({ draft, update, isEmbedded }: AuctionCreateShippingStepProps) {
  const { t } = useTranslation();

  return (
    <div className={cn('space-y-6', isEmbedded && 'space-y-4')}>
      <div>
        <span className="block text-xs font-bold uppercase tracking-wide text-gray-600">
          {t('auctions.createShippingWhoLabel')}
        </span>
        <div className={cn('mt-3 space-y-2', isEmbedded && 'mt-2 space-y-1.5')}>
          <button
            type="button"
            onClick={() => update('shippingPayer', 'buyer')}
            className={cn(
              'flex w-full items-center gap-3 rounded-xl border-2 px-4 py-4 text-left transition-all',
              isEmbedded && 'rounded-lg py-2.5',
              draft.shippingPayer === 'buyer'
                ? 'border-[#FF7300] bg-orange-50/80'
                : 'border-gray-200 hover:border-gray-300'
            )}
          >
            <Package className={cn('h-5 w-5 text-[#1D3160]', isEmbedded && 'h-4 w-4')} aria-hidden />
            <div>
              <p className={cn('text-sm font-semibold text-gray-900', isEmbedded && 'text-xs')}>
                {t('auctions.createShippingBuyer')}
              </p>
              <p className={cn('text-xs text-gray-500', isEmbedded && 'text-[11px]')}>
                {t('auctions.createShippingBuyerHint')}
              </p>
            </div>
          </button>
          <button
            type="button"
            onClick={() => update('shippingPayer', 'seller')}
            className={cn(
              'flex w-full items-center gap-3 rounded-xl border-2 px-4 py-4 text-left transition-all',
              isEmbedded && 'rounded-lg py-2.5',
              draft.shippingPayer === 'seller'
                ? 'border-[#FF7300] bg-orange-50/80'
                : 'border-gray-200 hover:border-gray-300'
            )}
          >
            <Package className={cn('h-5 w-5 text-[#1D3160]', isEmbedded && 'h-4 w-4')} aria-hidden />
            <div>
              <p className={cn('text-sm font-semibold text-gray-900', isEmbedded && 'text-xs')}>
                {t('auctions.createShippingSeller')}
              </p>
              <p className={cn('text-xs text-gray-500', isEmbedded && 'text-[11px]')}>
                {t('auctions.createShippingSellerHint')}
              </p>
            </div>
          </button>
        </div>
      </div>
      {draft.shippingPayer === 'buyer' && (
        <div className="space-y-4">
          <div>
            <label htmlFor="ac-ship-national" className="block text-xs font-bold uppercase tracking-wide text-gray-600">
              {t('auctions.createShippingNationalLabel', {
                country: draft.shippingOriginCountry || 'IT',
              })}
            </label>
            <div className="relative mt-1.5 max-w-xs">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-500">€</span>
              <input
                id="ac-ship-national"
                value={draft.shippingNationalEur}
                onChange={(e) => update('shippingNationalEur', e.target.value)}
                onBlur={(e) => update('shippingNationalEur', normalizeAuctionDraftMoneyInput(e.target.value))}
                className={cn(
                  'w-full rounded-lg border border-gray-300 py-2.5 pl-8 pr-3 text-sm text-gray-900 focus:border-[#FF7300] focus:outline-none focus:ring-2 focus:ring-[#FF7300]/25',
                  isEmbedded && 'py-2'
                )}
                inputMode="decimal"
              />
            </div>
          </div>
          <div>
            <label htmlFor="ac-ship-eu" className="block text-xs font-bold uppercase tracking-wide text-gray-600">
              {t('auctions.createShippingEuLabel')}
            </label>
            <div className="relative mt-1.5 max-w-xs">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-500">€</span>
              <input
                id="ac-ship-eu"
                value={draft.shippingEuDefaultEur}
                onChange={(e) => update('shippingEuDefaultEur', e.target.value)}
                onBlur={(e) => update('shippingEuDefaultEur', normalizeAuctionDraftMoneyInput(e.target.value))}
                className={cn(
                  'w-full rounded-lg border border-gray-300 py-2.5 pl-8 pr-3 text-sm text-gray-900 focus:border-[#FF7300] focus:outline-none focus:ring-2 focus:ring-[#FF7300]/25',
                  isEmbedded && 'py-2'
                )}
                inputMode="decimal"
              />
            </div>
          </div>
          <div>
            <label htmlFor="ac-ship-rest-world" className="block text-xs font-bold uppercase tracking-wide text-gray-600">
              {t('auctions.createShippingExtraUeLabel')}
            </label>
            <p className="mt-1 text-[11px] text-gray-500">
              Tariffa unica per acquirenti al di fuori dell&apos;area UE indicata sopra (non il paese di origine).
            </p>
            <div className="relative mt-1.5 max-w-xs">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-500">€</span>
              <input
                id="ac-ship-rest-world"
                value={draft.shippingRestOfWorldEur}
                onChange={(e) => update('shippingRestOfWorldEur', e.target.value)}
                onBlur={(e) => update('shippingRestOfWorldEur', normalizeAuctionDraftMoneyInput(e.target.value))}
                className={cn(
                  'w-full rounded-lg border border-gray-300 py-2.5 pl-8 pr-3 text-sm text-gray-900 focus:border-[#FF7300] focus:outline-none focus:ring-2 focus:ring-[#FF7300]/25',
                  isEmbedded && 'py-2'
                )}
                inputMode="decimal"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
