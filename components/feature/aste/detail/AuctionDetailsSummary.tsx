'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import type { MessageKey } from '@/lib/i18n/messages/en';
import { useIntlLocale } from '@/lib/i18n/useIntlLocale';

export interface AuctionDetailsSummaryProps {
  endsAt: string;
  isOwner: boolean;
  startingBidEur: number;
  reservePriceEur: number;
  reserveMet: boolean;
  fmtEur: (n: number) => string;
  t: (key: MessageKey, vars?: Record<string, string | number>) => string;
}

/** Riepilogo dettagli asta: lista desktop + accordion mobile (scadenza, riserva, base). */
export function AuctionDetailsSummary({
  endsAt,
  isOwner,
  startingBidEur,
  reservePriceEur,
  reserveMet,
  fmtEur,
  t,
}: AuctionDetailsSummaryProps) {
  const [mobileSection, setMobileSection] = useState<string | null>('auction');
  const intlLocale = useIntlLocale();

  return (
    <>
      {/* Desktop details list — invariato */}
      <div className="hidden divide-y divide-black/5 rounded-xl border border-transparent bg-white/0 lg:block">
        <div className="px-3 py-2 text-sm">
          <span className="text-gray-500">{t('auctions.detailEnds')}: </span>
          <span className="font-semibold text-gray-900">
            {new Date(endsAt).toLocaleString(intlLocale, {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </span>
        </div>
        {isOwner ? (
          <div className="space-y-1.5 px-3 py-2 text-sm">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <span className="text-gray-500">{t('auctions.sellerReserveLabel')}</span>
              <span className="text-lg font-bold text-gray-900">{fmtEur(reservePriceEur)}</span>
            </div>
            <p className="text-xs font-medium text-amber-900">
              {reserveMet ? t('auctions.sellerReserveMet') : t('auctions.sellerReserveNotMet')}
            </p>
          </div>
        ) : null}
      </div>

      {/* Mobile details accordion */}
      <div className="rounded-xl border border-transparent bg-white/0 divide-y divide-black/5 lg:hidden">
        {/* Section: Dettagli Asta */}
        <div>
          <button
            type="button"
            onClick={() => setMobileSection(mobileSection === 'auction' ? null : 'auction')}
            className="flex w-full items-center justify-between px-3 py-2 text-left"
          >
            <span className="text-xs font-bold uppercase tracking-wide text-gray-700">
              {t('auctions.detailEnds').split(':')[0] || 'Dettagli Asta'}
            </span>
            <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform duration-200 ${mobileSection === 'auction' ? 'rotate-180' : ''}`} />
          </button>
          <div className={`transition-all duration-300 ${mobileSection === 'auction' ? 'max-h-[70vh] overflow-y-auto opacity-100' : 'max-h-0 overflow-hidden opacity-0'}`}>
            <div className="space-y-2 px-4 pb-3 text-sm">
              <div className="flex items-baseline justify-between">
                <span className="text-gray-500">{t('auctions.detailFrom')}</span>
                <span className="font-bold text-gray-900">{fmtEur(startingBidEur)}</span>
              </div>
              <div className="flex items-baseline justify-between">
                <span className="text-gray-500">{t('auctions.detailEnds')}</span>
                <span className="font-semibold text-gray-900 text-right text-xs">
                  {new Date(endsAt).toLocaleString(intlLocale, {
                    weekday: 'short',
                    day: 'numeric',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
              {isOwner ? (
                <div className="flex items-baseline justify-between">
                  <span className="text-gray-500">{t('auctions.sellerReserveLabel')}</span>
                  <div className="text-right">
                    <span className="font-bold text-gray-900">{fmtEur(reservePriceEur)}</span>
                    <p className="text-[10px] font-medium text-amber-900">
                      {reserveMet ? t('auctions.sellerReserveMet') : t('auctions.sellerReserveNotMet')}
                    </p>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
