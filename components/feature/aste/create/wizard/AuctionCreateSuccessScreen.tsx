'use client';

import Link from 'next/link';
import { Check } from 'lucide-react';
import { useCallback } from 'react';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { useIntlLocale } from '@/lib/i18n/useIntlLocale';

export type AuctionCreateSuccessInfo = {
  id: number | null;
  startIso: string;
  endIso: string;
};

type AuctionCreateSuccessScreenProps = {
  createdAuctionInfo: AuctionCreateSuccessInfo | null;
};

export function AuctionCreateSuccessScreen({ createdAuctionInfo }: AuctionCreateSuccessScreenProps) {
  const { t } = useTranslation();
  const intlLocale = useIntlLocale();

  const formatDateTimeLong = useCallback((iso: string) => {
    const d = new Date(iso);
    if (!Number.isFinite(d.getTime())) return '—';
    return new Intl.DateTimeFormat(intlLocale, {
      dateStyle: 'full',
      timeStyle: 'short',
    }).format(d);
  }, [intlLocale]);

  return (
    <div className="mx-auto max-w-lg rounded-2xl border border-gray-200 bg-white p-10 text-center shadow-sm">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
        <Check className="h-8 w-8" strokeWidth={2.5} aria-hidden />
      </div>
      <h1 className="mt-6 text-xl font-bold uppercase tracking-wide text-gray-900">{t('auctions.createSuccessTitle')}</h1>
      <p className="mt-3 text-sm leading-relaxed text-gray-600">{t('auctions.createSuccessBody')}</p>
      {createdAuctionInfo && (
        <div className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50/60 p-4 text-left">
          <p className="text-xs font-bold uppercase tracking-wide text-emerald-800">{t('auctions.createSuccessDetailsTitle')}</p>
          <p className="mt-2 text-sm text-emerald-900">{t('auctions.createSuccessStartedImmediately')}</p>
          <p className="mt-1 text-sm text-emerald-900">{t('auctions.createSuccessStart', { date: formatDateTimeLong(createdAuctionInfo.startIso) })}</p>
          <p className="mt-1 text-sm text-emerald-900">{t('auctions.createSuccessEnd', { date: formatDateTimeLong(createdAuctionInfo.endIso) })}</p>
          {createdAuctionInfo.id ? (
            <p className="mt-1 text-sm text-emerald-900">{t('auctions.createSuccessId', { id: createdAuctionInfo.id })}</p>
          ) : null}
        </div>
      )}
      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
        <Link
          href="/aste/mie"
          className="inline-flex items-center justify-center rounded-full bg-[#FF7300] px-8 py-3 text-sm font-bold uppercase text-white transition hover:bg-[#e86800]"
        >
          {t('auctions.createViewListings')}
        </Link>
        <Link
          href="/aste"
          className="inline-flex items-center justify-center rounded-full border border-gray-300 px-8 py-3 text-sm font-semibold uppercase text-gray-800 transition hover:bg-gray-50"
        >
          {t('auctions.createBackToHub')}
        </Link>
      </div>
    </div>
  );
}
