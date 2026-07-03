'use client';

import { useState } from 'react';
import { Package, Sparkles } from 'lucide-react';
import { normalizeAuctionDraftMoneyInput, type AuctionCreateDraft } from '@/lib/auction/auction-create-draft';
import {
  clearAuctionShippingPreference,
  readAuctionShippingPreference,
  persistAuctionShippingFromDraft,
} from '@/lib/auction/auction-wizard-preferences';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { cn } from '@/lib/utils';
import { AuctionWizardRemember1hCheckbox } from './AuctionWizardRemember1hCheckbox';

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
  const [rememberShipping, setRememberShipping] = useState(false);

  const persistIfRemembered = (nextDraft: AuctionCreateDraft) => {
    if (rememberShipping) persistAuctionShippingFromDraft(nextDraft);
  };

  return (
    <div className={cn('space-y-6', isEmbedded && 'space-y-4')}>
      <div>
        <span className="block text-xs font-bold uppercase tracking-wide text-gray-600">
          {t('auctions.createShippingWhoLabel')}
        </span>
        <div className={cn('mt-3 space-y-2', isEmbedded && 'mt-2 space-y-1.5')}>
          <button
            type="button"
            onClick={() => {
              const cached = readAuctionShippingPreference();
              const rates =
                cached?.shippingPayer === 'buyer'
                  ? {
                      shippingNationalEur: cached.shippingNationalEur,
                      shippingEuDefaultEur: cached.shippingEuDefaultEur,
                      shippingRestOfWorldEur: cached.shippingRestOfWorldEur,
                    }
                  : {
                      shippingNationalEur: draft.shippingNationalEur,
                      shippingEuDefaultEur: draft.shippingEuDefaultEur,
                      shippingRestOfWorldEur: draft.shippingRestOfWorldEur,
                    };
              update('shippingPayer', 'buyer');
              update('shippingNationalEur', rates.shippingNationalEur);
              update('shippingEuDefaultEur', rates.shippingEuDefaultEur);
              update('shippingRestOfWorldEur', rates.shippingRestOfWorldEur);
              persistIfRemembered({ ...draft, shippingPayer: 'buyer', ...rates });
            }}
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
            onClick={() => {
              update('shippingPayer', 'seller');
              persistIfRemembered({
                ...draft,
                shippingPayer: 'seller',
                shippingNationalEur: '',
                shippingEuDefaultEur: '',
                shippingRestOfWorldEur: '',
              });
            }}
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
        <AuctionWizardRemember1hCheckbox
          checked={rememberShipping}
          onCheckedChange={(checked) => {
            setRememberShipping(checked);
            if (checked) {
              persistAuctionShippingFromDraft(draft);
            } else {
              clearAuctionShippingPreference();
            }
          }}
        />
      </div>
      {draft.shippingPayer === 'seller' && (
        <div
          className={cn(
            'flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50/80 px-4 py-3',
            isEmbedded && 'rounded-lg px-3 py-2.5'
          )}
        >
          <Sparkles className={cn('mt-0.5 h-5 w-5 shrink-0 text-emerald-600', isEmbedded && 'h-4 w-4')} aria-hidden />
          <div>
            <p className={cn('text-sm font-semibold text-emerald-900', isEmbedded && 'text-xs')}>
              {t('auctions.createShippingSellerPromoTitle')}
            </p>
            <p className={cn('mt-0.5 text-xs leading-relaxed text-emerald-800', isEmbedded && 'text-[11px]')}>
              {t('auctions.createShippingSellerPromo')}
            </p>
          </div>
        </div>
      )}
      {draft.shippingPayer === 'buyer' && (
        <div className={cn('grid gap-4 sm:grid-cols-3 sm:gap-3', isEmbedded && 'gap-3')}>
          <div>
            <label htmlFor="ac-ship-national" className="block text-xs font-bold uppercase tracking-wide text-gray-600">
              {t('auctions.createShippingNationalLabel')}
            </label>
            <div className="relative mt-1.5 max-w-xs sm:max-w-none">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-500">€</span>
              <input
                id="ac-ship-national"
                value={draft.shippingNationalEur}
                onChange={(e) => update('shippingNationalEur', e.target.value)}
                onBlur={(e) => {
                  const value = normalizeAuctionDraftMoneyInput(e.target.value);
                  update('shippingNationalEur', value);
                  persistIfRemembered({ ...draft, shippingNationalEur: value });
                }}
                className={cn(
                  'w-full rounded-lg border border-gray-300 py-2.5 pl-8 pr-3 text-sm text-gray-900 focus:border-[#FF7300] focus:outline-none focus:ring-2 focus:ring-[#FF7300]/25',
                  isEmbedded && 'py-2'
                )}
                placeholder="0,00"
                inputMode="decimal"
              />
            </div>
          </div>
          <div>
            <label htmlFor="ac-ship-eu" className="block text-xs font-bold uppercase tracking-wide text-gray-600">
              {t('auctions.createShippingEuLabel')}
            </label>
            <div className="relative mt-1.5 max-w-xs sm:max-w-none">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-500">€</span>
              <input
                id="ac-ship-eu"
                value={draft.shippingEuDefaultEur}
                onChange={(e) => update('shippingEuDefaultEur', e.target.value)}
                onBlur={(e) => {
                  const value = normalizeAuctionDraftMoneyInput(e.target.value);
                  update('shippingEuDefaultEur', value);
                  persistIfRemembered({ ...draft, shippingEuDefaultEur: value });
                }}
                className={cn(
                  'w-full rounded-lg border border-gray-300 py-2.5 pl-8 pr-3 text-sm text-gray-900 focus:border-[#FF7300] focus:outline-none focus:ring-2 focus:ring-[#FF7300]/25',
                  isEmbedded && 'py-2'
                )}
                placeholder="0,00"
                inputMode="decimal"
              />
            </div>
          </div>
          <div>
            <label htmlFor="ac-ship-rest-world" className="block text-xs font-bold uppercase tracking-wide text-gray-600">
              {t('auctions.createShippingExtraUeLabel')}
            </label>
            <div className="relative mt-1.5 max-w-xs sm:max-w-none">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-500">€</span>
              <input
                id="ac-ship-rest-world"
                value={draft.shippingRestOfWorldEur}
                onChange={(e) => update('shippingRestOfWorldEur', e.target.value)}
                onBlur={(e) => {
                  const value = normalizeAuctionDraftMoneyInput(e.target.value);
                  update('shippingRestOfWorldEur', value);
                  persistIfRemembered({ ...draft, shippingRestOfWorldEur: value });
                }}
                className={cn(
                  'w-full rounded-lg border border-gray-300 py-2.5 pl-8 pr-3 text-sm text-gray-900 focus:border-[#FF7300] focus:outline-none focus:ring-2 focus:ring-[#FF7300]/25',
                  isEmbedded && 'py-2'
                )}
                placeholder="0,00"
                inputMode="decimal"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
