'use client';



/**

 * Modal "Fai un'offerta" — light mode (Figma): bordo arancione, sfondo bianco.

 * Regole: fino a 100 € ultima offerta → min +1 €; oltre 100 € → min +2,5 %.

 */



import { useEffect, useMemo, useState } from 'react';

import { X, ChevronDown } from 'lucide-react';

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

  const [rulesExpanded, setRulesExpanded] = useState(false);



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

        className="relative z-[201] w-full max-w-2xl rounded border-[3px] bg-white px-8 py-7 shadow-2xl sm:px-10 sm:py-8"

        style={{ borderColor: ORANGE }}

      >

        {/* X button - absolute top right */}

        <button

          type="button"

          onClick={onClose}

          className="absolute right-4 top-4 rounded p-1.5 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"

          aria-label={t('auctions.bidModalAriaClose')}

        >

          <X className="h-4 w-4" />

        </button>



        {/* Header - title and reserve status */}

        <div className="mb-4 pr-10">

          <h2 id="bid-modal-title" className="text-xl font-bold uppercase tracking-wide text-gray-900">

            {t('auctions.bidModalTitle')}

          </h2>

          <p className="mt-1 text-xs font-medium text-gray-400">{t(reserveKey)}</p>

        </div>



        {/* Offerta attuale - IN EVIDENZA */}

        <div className="mb-6 text-center">

          <p className="text-xs text-gray-400">{t('auctions.bidModalCurrentOffer')}</p>

          <p className="text-2xl font-extrabold text-gray-900">{fmtEur(effectiveCurrentBidEur)}</p>

        </div>



        {/* CAMPO INSERIMENTO - CENTRALE */}

        <div className="mb-5 flex items-center justify-center gap-4">

          <div className="flex max-w-sm items-center gap-2 rounded-full border border-gray-200 bg-gray-50 p-1.5 pr-4 shadow-lg">

            <button

              type="button"

              onClick={handleConfirm}

              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-lg font-medium text-white bg-gray-400"

              aria-label={t('auctions.bidModalConfirm')}

            >

              €

            </button>

            <input

              type="text"

              inputMode="decimal"

              value={input}

              onChange={(e) => {

                setInput(e.target.value);

                setError(null);

              }}

              placeholder="Inserisci offerta"

              className="min-w-0 flex-1 bg-transparent py-1.5 text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none"

            />

          </div>

        </div>



        {/* 3 OFFERTE CONSIGLIATE */}

        <div className="mb-5 flex items-start justify-center gap-3">

          {quickAmounts.map((amt, idx) => {

            const isMiddle = idx === 1;

            // Calcola percentuale reale rispetto all'offerta attuale

            const pct = ((amt - effectiveCurrentBidEur) / effectiveCurrentBidEur) * 100;

            const pctStr = pct < 1 ? pct.toFixed(1) : Math.round(pct).toString();

            return (

              <div key={amt} className="flex flex-col items-center">

                <button

                  type="button"

                  onClick={() => {

                    setInput(amt.toString());

                    setError(null);

                  }}

                  className={`relative rounded px-2.5 py-2 text-center text-xs font-bold uppercase tracking-wide transition hover:bg-gray-50 ${

                    isMiddle

                      ? 'min-w-[5.5rem] scale-105 bg-orange-100/80 border border-orange-300 text-[#FF7300] shadow-lg backdrop-blur-sm'

                      : 'min-w-[4.5rem] border border-gray-200 text-gray-700'

                  }`}

                >

                  {isMiddle && (

                    <span className="absolute -top-1.5 left-1/2 -translate-x-1/2 rounded border border-orange-300 bg-orange-50 px-1 py-0 text-[6px] font-semibold shadow-sm text-[#FF7300]">

                      Consigliato

                    </span>

                  )}

                  <span className={`block text-[9px] ${isMiddle ? 'text-orange-600/70' : 'text-gray-500'}`}>OFFRI</span>

                  <span className={`block text-xs ${isMiddle ? 'text-gray-900' : 'text-gray-800'}`}>{fmtEur(amt)}</span>

                  <span className={`block text-[8px] font-medium ${isMiddle ? 'text-orange-500' : 'text-gray-400'}`}>

                    +{pctStr}%

                  </span>

                </button>

              </div>

            );

          })}

        </div>



        {/* BOTTONI OFFRI E OFFERTA MAX */}

        <div className="mb-4 flex items-center justify-center gap-4">

          <button

            type="button"

            onClick={handleConfirm}

            className="rounded border border-gray-200 px-6 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50"

          >

            OFFRI

          </button>

          <button

            type="button"

            onClick={handleConfirm}

            className="rounded border border-orange-300 bg-orange-100/80 px-8 py-3 text-base font-bold uppercase tracking-wide text-[#FF7300] shadow-lg backdrop-blur-sm transition hover:bg-orange-200/80"

          >

            OFFERTA MAX

          </button>

        </div>



        {/* TESTO OFFERTA MASSIMA */}

        <p className="mb-4 text-center text-xs font-medium text-gray-400">

          Quale offerta massima vuoi impostare? <span className="text-gray-300">Al resto ci pensiamo noi.</span>

        </p>



        {error && (

          <p className="mb-3 text-sm font-medium text-red-600 text-center" role="alert">

            {error}

          </p>

        )}



        <p className="text-center text-xs text-gray-400">

          <span className="font-medium">{t('auctions.bidModalEndsPrefix')} </span>

          <span suppressHydrationWarning>

            {formatEndsRelative(msLeft)}, {dateLine}

          </span>

        </p>

      </div>

    </div>

  );

}

