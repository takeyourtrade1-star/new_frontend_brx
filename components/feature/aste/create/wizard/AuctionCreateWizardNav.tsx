'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { AuctionGavelIcon } from '@/components/ui/AuctionGavelIcon';
import {
  AUCTION_LISTING_PHOTO_MAX,
  AUCTION_LISTING_PHOTO_MIN,
} from '@/lib/auction/auction-create-draft';
import type { WizardStepId } from '@/lib/auction/auction-create-wizard-types';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { cn } from '@/lib/utils';

type AuctionCreateWizardNavProps = {
  isEmbedded: boolean;
  stepId: WizardStepId;
  itemPickSearchActive: boolean;
  showStickyNav: boolean;
  isLastStep: boolean;
  continueDisabled: boolean;
  publishDisabled: boolean;
  currentStepNumber: number;
  totalSteps: number;
  onBack: () => void;
  onNext: () => void;
  onPublish: () => void;
};

export function AuctionCreateWizardNav({
  isEmbedded,
  stepId,
  itemPickSearchActive,
  showStickyNav,
  isLastStep,
  continueDisabled,
  publishDisabled,
  currentStepNumber,
  totalSteps,
  onBack,
  onNext,
  onPublish,
}: AuctionCreateWizardNavProps) {
  const { t } = useTranslation();

  const showEmbeddedFooter =
    isEmbedded && (stepId !== 'item_pick' || itemPickSearchActive);

  return (
    <>
      {showEmbeddedFooter && (
        <div className="border-t border-zinc-100 bg-zinc-50/70 px-3 py-2">
          <div className="flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={onBack}
              className="inline-flex min-h-[32px] items-center gap-1 rounded-lg border border-zinc-300 bg-white px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-[#1D3160] transition hover:border-zinc-400"
            >
              <ChevronLeft className="h-3 w-3" aria-hidden />
              {t('auctions.createBack')}
            </button>

            {!isLastStep ? (
              <button
                type="button"
                disabled={continueDisabled}
                title={continueDisabled ? t('auctions.createContinueDisabledFooter') : undefined}
                onClick={onNext}
                className={cn(
                  'inline-flex min-h-[32px] items-center gap-1 rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-white transition',
                  continueDisabled
                    ? 'cursor-not-allowed bg-[#FF7300]/35 opacity-60'
                    : 'bg-[#FF7300] hover:bg-[#e86800]'
                )}
              >
                {t('auctions.createContinue')}
                <ChevronRight className="h-3 w-3" aria-hidden />
              </button>
            ) : (
              <div className="flex min-w-0 flex-1 flex-col items-stretch gap-1.5 sm:flex-row sm:items-center sm:justify-end sm:gap-2">
                <p className="text-[10px] leading-snug text-gray-600 sm:max-w-[11rem] sm:text-right">
                  {t('auctions.createCancelWindowBanner')}
                </p>
                <button
                  type="button"
                  disabled={publishDisabled}
                  title={
                    publishDisabled
                      ? t('auctions.createValidationPhotos', {
                          min: AUCTION_LISTING_PHOTO_MIN,
                          max: AUCTION_LISTING_PHOTO_MAX,
                        })
                      : undefined
                  }
                  onClick={onPublish}
                  className={cn(
                    'group inline-flex min-h-[32px] shrink-0 items-center justify-center gap-1 rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-white transition',
                    publishDisabled
                      ? 'cursor-not-allowed bg-[#FF7300]/35 opacity-60'
                      : 'bg-[#FF7300] hover:bg-[#e86800]'
                  )}
                >
                  <AuctionGavelIcon className="h-3 w-3" animated />
                  {t('auctions.createSubmit')}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {showStickyNav && (
        <div
          className={cn(
            'sticky bottom-0 z-40 mt-4 sm:mt-6',
            'border-t border-gray-200/80 bg-[#f5f5f5]/90 pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom,0px))] backdrop-blur-sm'
          )}
          role="navigation"
          aria-label={t('auctions.createProgress', { current: currentStepNumber, total: totalSteps })}
        >
          {continueDisabled && (
            <p className="mb-2.5 px-2 text-center text-xs leading-snug text-gray-600 sm:px-4">
              {t('auctions.createContinueDisabledFooter')}
            </p>
          )}
          <div className="flex items-center justify-between gap-2 px-3 py-2 sm:gap-3 sm:px-4">
            <button
              type="button"
              onClick={onBack}
              className="inline-flex min-h-[34px] items-center justify-center gap-1 rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-[#1D3160] transition hover:bg-zinc-50"
            >
              <ChevronLeft className="h-3.5 w-3.5" aria-hidden />
              {t('auctions.createBack')}
            </button>

            {!isLastStep ? (
              <button
                type="button"
                disabled={continueDisabled}
                title={continueDisabled ? t('auctions.createContinueDisabledFooter') : undefined}
                onClick={onNext}
                className={cn(
                  'inline-flex min-h-[34px] items-center justify-center gap-1 rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-wide text-white transition',
                  continueDisabled
                    ? 'cursor-not-allowed bg-[#FF7300]/40 opacity-60'
                    : 'bg-[#FF7300] hover:bg-[#e86800]'
                )}
              >
                {t('auctions.createContinue')}
                <ChevronRight className="h-3.5 w-3.5" aria-hidden />
              </button>
            ) : (
              <div className="flex min-w-0 flex-1 flex-col items-stretch gap-2 sm:flex-row sm:items-center sm:justify-end sm:gap-3">
                <p className="text-[11px] leading-snug text-gray-600 sm:max-w-xs sm:text-right">
                  {t('auctions.createCancelWindowBanner')}
                </p>
                <button
                  type="button"
                  disabled={publishDisabled}
                  title={
                    publishDisabled
                      ? t('auctions.createValidationPhotos', {
                          min: AUCTION_LISTING_PHOTO_MIN,
                          max: AUCTION_LISTING_PHOTO_MAX,
                        })
                      : undefined
                  }
                  onClick={onPublish}
                  className={cn(
                    'group inline-flex min-h-[34px] shrink-0 items-center justify-center gap-1 rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-wide text-white transition',
                    publishDisabled
                      ? 'cursor-not-allowed bg-[#FF7300]/40 opacity-60'
                      : 'bg-[#FF7300] hover:bg-[#e86800]'
                  )}
                >
                  <AuctionGavelIcon className="h-3.5 w-3.5" animated />
                  {t('auctions.createSubmit')}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
