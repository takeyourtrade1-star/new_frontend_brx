'use client';

/**
 * Modal "Fai un'offerta" — Enhanced UI con design moderno e coerente
 * Regole: fino a 100 € ultima offerta → min +1 €; oltre 100 € → min +2,5 %.
 */

import { useEffect, useMemo, useState } from 'react';
import { X } from 'lucide-react';
import { useTranslation } from '@/lib/i18n/useTranslation';
import type { MessageKey } from '@/lib/i18n/messages/en';
import { minNextBidEur, roundMoney } from '@/lib/auction/bid-math';
import { usePlaceBid } from '@/lib/hooks/use-auctions';

const ORANGE = '#FF7300';



type Props = {

  open: boolean;

  onClose: () => void;

  effectiveCurrentBidEur: number;

  estimatedShippingEur: number;

  reserveMet: boolean;

  msLeft: number;

  endsAt: Date;

  myLastOfferEur: number | null;

  onSubmitOffer: (amountEur: number) => void;

  onSubmitMaxBid?: (amountEur: number) => void;

  auctionId?: number;

};



function formatEndsRelative(ms: number): string {

  if (ms <= 0) return '0g 0h';

  const d = Math.floor(ms / 86400000);

  const h = Math.floor((ms % 86400000) / 3600000);

  return `${d}g ${h}h`;

}



export function AuctionBidModal({

  open,

  onClose,

  effectiveCurrentBidEur,

  estimatedShippingEur,

  reserveMet,

  msLeft,

  endsAt,

  myLastOfferEur,

  onSubmitOffer,

  onSubmitMaxBid,

  auctionId,

}: Props) {

  const { t } = useTranslation();

  const [input, setInput] = useState('');

  const [error, setError] = useState<string | null>(null);

  const minBid = useMemo(() => minNextBidEur(effectiveCurrentBidEur), [effectiveCurrentBidEur]);



  const quickAmounts = useMemo(() => {

    const a = minBid;

    if (effectiveCurrentBidEur <= 100) {

      return [a, roundMoney(a + 4), roundMoney(a + 9)];

    }

    return [a, roundMoney(a + 10), roundMoney(a + 25)];

  }, [effectiveCurrentBidEur, minBid]);



  useEffect(() => {

    if (open) {

      // Pre-popola con minBid formattato con separatori migliaia

      setInput(minBid.toLocaleString('it-IT', { minimumFractionDigits: 0, maximumFractionDigits: 2 }));

      setError(null);

    }

  }, [open, minBid]);



  useEffect(() => {

    if (!open) return;

    const onKey = (e: KeyboardEvent) => {

      if (e.key === 'Escape') onClose();

    };

    window.addEventListener('keydown', onKey);

    return () => window.removeEventListener('keydown', onKey);

  }, [open, onClose]);



  useEffect(() => {

    if (!open) return;

    const prevOverflow = document.body.style.overflow;

    document.body.style.overflow = 'hidden';

    return () => {

      document.body.style.overflow = prevOverflow;

    };

  }, [open]);



  // Hide mascot when modal is open - use specific class name
  useEffect(() => {

    if (open) {

      document.body.classList.add('auction-bid-modal-open');

    } else {

      document.body.classList.remove('auction-bid-modal-open');

    }

    return () => {

      document.body.classList.remove('auction-bid-modal-open');

    };

  }, [open]);



  const placeBidMutation = usePlaceBid(auctionId ?? 0);

  const parsedInput = useMemo(() => {
    const raw = input.replace(',', '.').trim();
    const n = parseFloat(raw);
    return Number.isFinite(n) ? roundMoney(n) : NaN;
  }, [input]);

  const displayBidAmount = Number.isFinite(parsedInput) ? parsedInput : minBid;

  if (!open) return null;

  const fmtEur = (n: number) => n.toLocaleString('it-IT', { style: 'currency', currency: 'EUR' });

  const dateLine = endsAt.toLocaleString('it-IT', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit',
  });

  const handleDirectBid = async () => {
    if (!Number.isFinite(parsedInput)) {
      setError(t('auctions.bidErrorInvalid'));
      return;
    }
    const min = minNextBidEur(effectiveCurrentBidEur);
    if (parsedInput < min) {
      setError(t('auctions.bidErrorTooLow', { min: fmtEur(min) }));
      return;
    }
    setError(null);
    if (auctionId != null && auctionId > 0) {
      try {
        await placeBidMutation.mutateAsync({ amount: parsedInput });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Errore offerta');
        return;
      }
    }
    onSubmitOffer(parsedInput);
  };

  const handleMaxBid = async () => {
    if (!Number.isFinite(parsedInput)) {
      setError(t('auctions.bidErrorInvalid'));
      return;
    }
    const min = minNextBidEur(effectiveCurrentBidEur);
    if (parsedInput < min) {
      setError(t('auctions.bidErrorTooLow', { min: fmtEur(min) }));
      return;
    }
    setError(null);
    const firstBid = roundMoney(min);
    if (auctionId != null && auctionId > 0) {
      try {
        await placeBidMutation.mutateAsync({ amount: firstBid, maxAmount: parsedInput });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Errore offerta massima');
        return;
      }
    }
    onSubmitMaxBid?.(parsedInput);
  };



  const reserveKey: MessageKey = reserveMet ? 'auctions.detailReserveYes' : 'auctions.detailReserveNo';



  return (
    <div className="fixed inset-0 z-[200] flex items-end justify-center sm:items-center sm:p-4">
      {/* Backdrop with blur */}
      <button
        type="button"
        className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
        aria-label={t('auctions.bidModalAriaClose')}
        onClick={onClose}
      />

      {/* Modal Content */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="bid-modal-title"
        className="relative z-[201] w-full max-w-lg overflow-hidden rounded-t-2xl border-t border-gray-200 bg-white shadow-2xl sm:rounded-2xl sm:border"
      >
        {/* Safe area for mobile - top */}
        <div className="h-safe-area-inset-top sm:h-0" />

        {/* Mobile drag handle */}
        <div className="flex justify-center pt-3 sm:hidden">
          <div className="h-1 w-12 rounded-full bg-gray-300" />
        </div>

        {/* Header with gradient */}
        <div className="relative overflow-hidden border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white px-5 pt-4 pb-3 sm:px-8 sm:pt-5 sm:pb-4">
          <div className="absolute inset-0 bg-gradient-to-r from-[#FF7300]/5 via-transparent to-[#FF7300]/5" />
          
          <div className="relative">
            {/* Header row */}
            <div className="flex items-start justify-between">
              <div className="flex-1 pr-8">
                <h2 id="bid-modal-title" className="text-base font-bold uppercase tracking-wide text-gray-900 sm:text-lg">
                  {t('auctions.bidModalTitle')}
                </h2>
                <p className="mt-0.5 text-xs font-medium text-gray-500">{t(reserveKey)}</p>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="shrink-0 rounded-lg p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
                aria-label={t('auctions.bidModalAriaClose')}
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Current offer - ultra compact inline display */}
            <div className="mt-2 flex items-center justify-between rounded-md border border-gray-200 bg-white px-3 py-1.5 shadow-sm sm:mt-3 sm:px-3.5 sm:py-2">
              <span className="text-[10px] font-semibold uppercase tracking-wide text-gray-500">
                {t('auctions.bidModalCurrentOffer')}
              </span>
              <span className="text-lg font-bold text-gray-900 sm:text-xl">
                {fmtEur(effectiveCurrentBidEur)}
              </span>
            </div>
          </div>
        </div>

        {/* Body - scrollable on mobile */}
        <div className="max-h-[65vh] overflow-y-auto px-5 py-4 sm:max-h-none sm:px-8 sm:py-5">
          {/* CAMPO INSERIMENTO */}
          <div className="mb-4 sm:mb-5">
            <label className="mb-2 block text-[10px] font-semibold uppercase tracking-wide text-gray-700 sm:text-xs">
              {t('auctions.bidInput')}
            </label>
            <div className="relative">
              <input
                type="text"
                inputMode="decimal"
                value={input}
                onChange={(e) => {
                  setInput(e.target.value);
                  setError(null);
                }}
                placeholder="0,00"
                className="w-full rounded-xl border-2 border-gray-300 bg-white px-4 py-3.5 pr-12 text-xl font-bold text-gray-900 placeholder:text-gray-400 transition-colors focus:border-[#FF7300] focus:outline-none focus:ring-2 focus:ring-[#FF7300]/20 sm:px-5 sm:py-4 sm:pr-14 sm:text-2xl"
              />
              <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-lg font-bold text-gray-400 sm:right-5 sm:text-xl">
                €
              </span>
            </div>
          </div>

          {/* 3 OFFERTE CONSIGLIATE */}
          <div className="mb-5 sm:mb-6">
            <p className="mb-2.5 text-[10px] font-semibold uppercase tracking-wide text-gray-600 sm:mb-3 sm:text-xs">
              {t('auctions.suggestedBids')}
            </p>
            <div className="flex items-stretch justify-center gap-2 sm:gap-3">
              {quickAmounts.map((amt, idx) => {
                const isRecommended = idx === 1;
                const pct = ((amt - effectiveCurrentBidEur) / effectiveCurrentBidEur) * 100;
                const pctStr = pct < 1 ? pct.toFixed(1) : Math.round(pct).toString();

                return (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => {
                      setInput(amt.toString());
                      setError(null);
                    }}
                    className={`group relative flex-1 rounded-xl border-2 p-3 text-center transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md active:translate-y-0 sm:p-4 ${
                      isRecommended
                        ? 'border-[#FF7300] bg-gradient-to-b from-orange-50 to-white shadow-md'
                        : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}
                  >
                    {isRecommended && (
                      <div className="absolute -top-2.5 left-1/2 -translate-x-1/2">
                        <span className="inline-flex items-center rounded-full bg-[#FF7300] px-2 py-0.5 text-[8px] font-bold uppercase tracking-wide text-white shadow-sm whitespace-nowrap sm:px-2.5 sm:text-[9px]">
                          {t('auctions.suggestedBid')}
                        </span>
                      </div>
                    )}

                    <span className={`block text-[9px] font-medium uppercase tracking-wide ${isRecommended ? 'text-[#FF7300]' : 'text-gray-500'} sm:text-[10px]`}>
                      {t('auctions.bidButtonChoose')}
                    </span>
                    <span className={`mt-1 block text-sm font-bold ${isRecommended ? 'text-[#FF7300]' : 'text-gray-900'} sm:mt-1.5 sm:text-base`}>
                      {fmtEur(amt)}
                    </span>
                    <span className={`mt-0.5 block text-[9px] font-semibold ${isRecommended ? 'text-orange-600' : 'text-gray-400'} sm:text-[10px]`}>
                      +{pctStr}%
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Error message */}
          {error && (
            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-xs font-medium text-red-700 sm:mb-5 sm:px-5 sm:py-3.5 sm:text-sm" role="alert">
              {error}
            </div>
          )}

          {/* BOTTONI AZIONE */}
          <div className="flex items-stretch gap-3 sm:gap-4">
            <button
              type="button"
              onClick={handleDirectBid}
              disabled={placeBidMutation.isPending}
              className="flex-[0.65] rounded-xl border-2 border-gray-300 bg-white px-3 py-3.5 text-[10px] font-bold uppercase tracking-wide text-gray-700 transition-all duration-200 hover:border-gray-400 hover:bg-gray-50 hover:shadow-sm active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed sm:flex-[0.7] sm:px-4 sm:py-4 sm:text-xs"
            >
              {t('auctions.bidButtonMain', { amount: fmtEur(displayBidAmount) })}
            </button>
            <button
              type="button"
              onClick={handleMaxBid}
              disabled={placeBidMutation.isPending}
              className="flex-1 rounded-xl border-2 border-[#FF7300] bg-gradient-to-r from-[#FF8A3D] to-[#FF7300] px-4 py-3.5 text-[10px] font-bold uppercase tracking-wide text-white shadow-md shadow-orange-500/20 transition-all duration-200 hover:shadow-lg hover:shadow-orange-500/30 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed sm:px-6 sm:py-4 sm:text-xs"
            >
              {t('auctions.bidButtonMax')}
            </button>
          </div>

          {/* Info text */}
          <p className="mt-3 text-center text-[10px] text-gray-500 sm:mt-4 sm:text-xs">
            {t('auctions.bidMaxHint')}
          </p>

          {/* Footer info */}
          <div className="mt-3 flex items-center justify-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 sm:mt-5 sm:px-5 sm:py-3.5">
            <p className="text-center text-[10px] text-gray-600 sm:text-xs">
              <span className="font-medium">{t('auctions.bidModalEndsPrefix')} </span>
              <span suppressHydrationWarning className="font-semibold text-gray-900">
                {formatEndsRelative(msLeft)}, {dateLine}
              </span>
            </p>
          </div>
        </div>

        {/* Safe area for mobile - bottom */}
        <div className="h-safe-area-inset-bottom pb-2 sm:hidden" />
      </div>
    </div>
  );
}

