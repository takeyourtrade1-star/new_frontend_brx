'use client';

import { useMemo } from 'react';
import {
  auctionConditionLabelKey,
  buildAuctionLanguageOptions,
  type AuctionCreateDraft,
} from '@/lib/auction/auction-create-draft';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { ListingPhotoThumbnailsRow } from '../AuctionListingPhotoUpload';

export type AuctionCreateReviewStepProps = {
  draft: AuctionCreateDraft;
};

export function AuctionCreateReviewStep({ draft }: AuctionCreateReviewStepProps) {
  const { t } = useTranslation();

  const cardLanguageLabel = useMemo(() => {
    const cardLanguageOptions = buildAuctionLanguageOptions(draft.cardSelection?.availableLanguages);
    return cardLanguageOptions.find((opt) => opt.value === draft.cardLanguage)?.label ?? '—';
  }, [draft.cardSelection?.availableLanguages, draft.cardLanguage]);

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
        <p className="text-sm font-bold text-amber-900">{t('auctions.createCancelWindowBanner')}</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
          <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400">{t('auctions.createStepItem')}</p>
          <p className="mt-1 text-sm font-semibold text-[#1D3160]">{draft.title || '—'}</p>
          {draft.cardSelection?.setName ? (
            <p className="text-xs text-gray-500">{draft.cardSelection.setName}</p>
          ) : null}
          {draft.fromSyncInventory != null && (
            <p className="mt-1 text-[11px] text-gray-500">
              {draft.fromSyncInventory ? t('auctions.createInInventoryYes') : t('auctions.createInInventoryNo')}
            </p>
          )}
        </div>
        <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
          <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400">
            {t('auctions.createConditionLabel')}
          </p>
          <p className="mt-1 text-sm font-semibold text-gray-900">{t(auctionConditionLabelKey(draft.condition))}</p>
          {draft.isCard && (
            <>
              <p className="mt-2 text-[10px] font-bold uppercase tracking-wide text-gray-400">Lingua carta</p>
              <p className="mt-0.5 text-sm font-semibold text-gray-900">{cardLanguageLabel}</p>
            </>
          )}
        </div>
        <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
          <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400">{t('auctions.createDurationLabel')}</p>
          <p className="mt-1 text-sm font-semibold text-gray-900">
            {t('auctions.createDurationDays', { days: draft.durationDays })}
          </p>
          {draft.antiSnipeEnabled && (
            <p className="mt-2 text-[11px] text-gray-600">
              {t('auctions.createAntiSnipeLabel')}:{' '}
              {t('auctions.createAntiSnipeMinutes', { minutes: String(draft.antiSnipeMinutes) })}
            </p>
          )}
        </div>
        <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
          <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400">{t('auctions.createStepPrice')}</p>
          <p className="mt-1 text-sm font-semibold text-gray-900">
            {t('auctions.createStartingBidLabel')}: €{draft.startingBidEur || '—'}
          </p>
          {draft.reservePriceEur ? (
            <p className="text-xs text-gray-600">
              {t('auctions.createReserveLabel')}: €{draft.reservePriceEur}
            </p>
          ) : null}
          {draft.buyNowPriceEur ? (
            <p className="text-xs text-gray-600">
              {t('auctions.createBuyNowLabel')}: €{draft.buyNowPriceEur}
            </p>
          ) : null}
        </div>
        <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm sm:col-span-2">
          <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400">
            {t('auctions.createShippingWhoLabel')}
          </p>
          <p className="mt-1 text-sm font-semibold text-gray-900">
            {draft.shippingPayer === 'buyer' ? t('auctions.createShippingBuyer') : t('auctions.createShippingSeller')}
            {draft.shippingPayer === 'buyer' && (
              <span className="block text-xs font-normal text-gray-600">
                {t('auctions.createShippingNationalLabel')}: €
                {draft.shippingNationalEur} · {t('auctions.createShippingEuLabel')}: €{draft.shippingEuDefaultEur} ·{' '}
                {t('auctions.createShippingExtraUeLabel')}: €{draft.shippingRestOfWorldEur}
              </span>
            )}
          </p>
        </div>
        {draft.description ? (
          <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm sm:col-span-2">
            <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400">
              {t('auctions.createObjectNoteLabel')}
            </p>
            <p className="mt-1 text-sm text-gray-800 whitespace-pre-wrap">{draft.description}</p>
          </div>
        ) : null}
        <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm sm:col-span-2">
          <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400">{t('auctions.createStepPhotos')}</p>
          <div className="mt-2">
            <ListingPhotoThumbnailsRow photos={draft.listingPhotos} />
          </div>
        </div>
      </div>

      <p className="text-center text-[11px] text-gray-500">
        <span
          className="cursor-help underline decoration-dotted underline-offset-2"
          title={t('auctions.createPublishTermsTooltip')}
        >
          {t('auctions.createPublishTermsLabel')}
        </span>
      </p>
    </div>
  );
}
