'use client';

/**
 * Modal "Fai un'offerta" — light mode (Figma): bordo arancione, sfondo bianco.
 * Regole: fino a 100 € ultima offerta → min +1 €; oltre 100 € → min +2,5 %.
 */

import { useEffect, useMemo, useState } from 'react';
import { X } from 'lucide-react';
import { useTranslation } from '@/lib/i18n/useTranslation';
import type { MessageKey } from '@/lib/i18n/messages/en';
import { minNextBidEur, roundMoney } from '@/lib/auction/bid-math';

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
      setInput('');
      setError(null);
    }
  }, [open]);

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

  if (!open) return null;

  const fmtEur = (n: number) => n.toLocaleString('it-IT', { style: 'currency', currency: 'EUR' });

  const dateLine = endsAt.toLocaleString('it-IT', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit',
  });

  const submitIfValid = (amount: number) => {
    const min = minNextBidEur(effectiveCurrentBidEur);
    if (!Number.isFinite(amount) || amount < min) {
      setError(t('auctions.bidErrorTooLow', { min: fmtEur(min) }));
      return;
    }
    setError(null);
    onSubmitOffer(roundMoney(amount));
  };

  const handleConfirm = () => {
    const raw = input.replace(',', '.').trim();
    const parsed = parseFloat(raw);
    const amount = Number.isFinite(parsed) ? roundMoney(parsed) : NaN;
    if (!Number.isFinite(amount)) {
      setError(t('auctions.bidErrorInvalid'));
      return;
    }
    submitIfValid(amount);
  };

  const reserveKey: MessageKey = reserveMet ? 'auctions.detailReserveYes' : 'auctions.detailReserveNo';

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
        aria-label={t('auctions.bidModalAriaClose')}
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="bid-modal-title"
        className="relative z-[201] w-full max-w-lg rounded-[1.35rem] border-[3px] bg-white p-5 shadow-2xl"
        style={{ borderColor: ORANGE }}
      >
        <div className="mb-4 flex items-start justify-between gap-3 pr-1">
          <h2 id="bid-modal-title" className="flex-1 text-lg font-bold uppercase tracking-wide text-gray-900">
            {t('auctions.bidModalTitle')}
          </h2>
          <div className="flex shrink-0 flex-col items-end gap-1 text-right">
            <button
              type="button"
              onClick={onClose}
              className="rounded-full p-1.5 text-gray-500 transition hover:bg-gray-100 hover:text-gray-900"
              aria-label={t('auctions.bidModalAriaClose')}
            >
              <X className="h-5 w-5" />
            </button>
            <p className="max-w-[12rem] text-[11px] font-medium leading-snug text-gray-600">{t(reserveKey)}</p>
          </div>
        </div>

        <div className="mb-4 space-y-2 text-sm text-gray-800">
          <p>
            <span className="text-gray-600">{t('auctions.bidModalCurrentOffer')} </span>
            <span className="font-bold text-gray-900">{fmtEur(effectiveCurrentBidEur)}</span>
          </p>
          <p>
            <span className="text-gray-600">{t('auctions.bidModalMinNext')} </span>
            <span className="font-bold text-[#FF7300]">{fmtEur(minBid)}</span>
          </p>
          <p>
            <span className="text-gray-600">{t('auctions.bidModalShipping')} </span>
            <span className="font-semibold text-gray-900">{fmtEur(estimatedShippingEur)}</span>
          </p>
        </div>

        <p className="mb-3 rounded-lg bg-gray-50 px-3 py-2 text-[11px] leading-snug text-gray-600">{t('auctions.bidMinRuleHint')}</p>

        {myLastOfferEur != null && (
          <div className="mb-4 rounded-xl border border-[#FF7300]/40 bg-orange-50 px-3 py-2.5 text-sm font-semibold text-[#c2410c]">
            {t('auctions.myLastOfferLabel', { amount: fmtEur(myLastOfferEur) })}
          </div>
        )}

        <div className="mb-4 flex flex-wrap gap-2">
          {quickAmounts.map((amt) => (
            <button
              key={amt}
              type="button"
              onClick={() => submitIfValid(amt)}
              className="min-w-[5.5rem] flex-1 rounded-full px-3 py-2.5 text-center text-xs font-bold uppercase tracking-wide text-white transition hover:brightness-105"
              style={{ backgroundColor: ORANGE }}
            >
              {t('auctions.bidModalOfferQuick', { amount: fmtEur(amt) })}
            </button>
          ))}
        </div>

        <div className="mb-3 flex items-stretch gap-2 rounded-full border border-gray-200 bg-gray-50 pl-4 pr-1.5 py-1">
          <input
            type="text"
            inputMode="decimal"
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              setError(null);
            }}
            placeholder={t('auctions.bidModalPlaceholder')}
            className="min-w-0 flex-1 bg-transparent py-2.5 text-sm text-gray-900 placeholder:text-[#FF7300] focus:outline-none"
          />
          <div className="flex shrink-0 items-center gap-1.5">
            <button
              type="button"
              onClick={handleConfirm}
              className="text-xs font-bold uppercase tracking-wide text-[#FF7300] hover:underline"
            >
              {t('auctions.bidModalConfirm')}
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-lg font-bold text-white"
              style={{ backgroundColor: ORANGE }}
              aria-label={t('auctions.bidModalConfirm')}
            >
              €
            </button>
          </div>
        </div>

        {error && (
          <p className="mb-3 text-sm font-medium text-red-600" role="alert">
            {error}
          </p>
        )}

        <p className="text-right text-xs text-gray-600">
          <span className="font-medium">{t('auctions.bidModalEndsPrefix')} </span>
          <span suppressHydrationWarning>
            {formatEndsRelative(msLeft)}, {dateLine}
          </span>
        </p>
      </div>
    </div>
  );
}
