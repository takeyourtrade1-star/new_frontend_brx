'use client';

import { Globe } from 'lucide-react';
import { FlagIcon } from '@/components/ui/FlagIcon';
import { useTranslation } from '@/lib/i18n/useTranslation';

export interface AuctionShippingCountryRow {
  country_iso: string;
  price_eur: number;
}

export interface AuctionShippingDetailsProps {
  shippingInfo: { included: boolean; label: string };
  shippingOriginCountry?: string | null;
  shippingNationalEur?: number | null;
  shippingEuDefaultEur?: number | null;
  restOfWorldPriceEur?: number | null;
  shippingCountryRows: AuctionShippingCountryRow[];
  fmtEur: (n: number) => string;
}

/** Dettaglio tariffe di spedizione (nazionale, resto Europa, mondo, per paese). */
export function AuctionShippingDetails({
  shippingInfo,
  shippingOriginCountry,
  shippingNationalEur,
  shippingEuDefaultEur,
  restOfWorldPriceEur,
  shippingCountryRows,
  fmtEur,
}: AuctionShippingDetailsProps) {
  const { t } = useTranslation();
  return (
    <>
      <p className="text-sm font-semibold text-gray-900">
        {shippingInfo.included ? t('auctions.shippingDetails.included') : shippingInfo.label}
      </p>
      {!shippingInfo.included ? (
        <p className="mt-1 text-xs text-gray-500">{t('auctions.shippingDetails.ratesByArea')}</p>
      ) : null}
      <div className="mt-2 space-y-1.5">
        {shippingOriginCountry ? (
          <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-white px-2.5 py-2 text-xs">
            <div className="flex items-center gap-2">
              <FlagIcon country={shippingOriginCountry} size="sm" />
              <span className="font-medium text-gray-600">{t('auctions.shippingDetails.national')}</span>
            </div>
            <span className="font-semibold text-gray-900">
              {shippingNationalEur != null ? fmtEur(shippingNationalEur) : '—'}
            </span>
          </div>
        ) : null}
        <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-white px-2.5 py-2 text-xs">
          <span className="font-medium text-gray-600">{t('auctions.shippingDetails.restEuropeDefault')}</span>
          <span className="font-semibold text-gray-900">
            {shippingEuDefaultEur != null ? fmtEur(shippingEuDefaultEur) : '—'}
          </span>
        </div>
        {restOfWorldPriceEur != null ? (
          <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-white px-2.5 py-2 text-xs">
            <div className="flex items-center gap-2">
              <Globe className="h-3.5 w-3.5 text-gray-500" aria-hidden />
              <span className="font-medium text-gray-600">{t('auctions.shippingDetails.restWorld')}</span>
            </div>
            <span className="font-semibold text-gray-900">{fmtEur(restOfWorldPriceEur)}</span>
          </div>
        ) : null}
        {shippingCountryRows.length > 0 ? (
          <div className="rounded-lg border border-gray-200 bg-white px-2.5 py-2">
            <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-gray-500">
              {t('auctions.shippingDetails.perCountry')}
            </p>
            <div className="space-y-1.5">
              {shippingCountryRows.map((row) => (
                <div key={row.country_iso} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <FlagIcon country={row.country_iso} size="sm" />
                    <span className="font-medium text-gray-600">{row.country_iso}</span>
                  </div>
                  <span className="font-semibold text-gray-900">{fmtEur(row.price_eur)}</span>
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </>
  );
}
