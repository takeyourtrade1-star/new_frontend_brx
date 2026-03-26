'use client';

import Link from 'next/link';
import { ChevronDown } from 'lucide-react';
import { useTranslation } from '@/lib/i18n/useTranslation';

function FilterRow({ thirdLabelKey }: { thirdLabelKey: 'accountPage.statsPurchaseDate' | 'accountPage.statsPaymentDate' }) {
  const { t } = useTranslation();
  const third = t(thirdLabelKey);
  return (
    <div className="flex flex-wrap items-end justify-between gap-4 py-3">
      <div className="flex flex-wrap items-end gap-4">
        <span className="text-sm font-medium uppercase text-gray-900">
          {t('accountPage.statsOrdersSold')}
        </span>
        <div className="relative flex h-10 items-center rounded-none bg-white px-4 py-2 shadow-sm">
          <select
            className="h-full w-full appearance-none border-0 bg-transparent pr-8 text-sm font-medium uppercase text-gray-900 focus:outline-none focus:ring-0"
            defaultValue="month"
          >
            <option value="month">{t('accountPage.statsMonth')}</option>
            <option value="week">{t('accountPage.statsWeek')}</option>
            <option value="year">{t('accountPage.statsYear')}</option>
          </select>
          <ChevronDown
            className="pointer-events-none absolute right-3 h-4 w-4 shrink-0 text-gray-900"
            aria-hidden
          />
        </div>
        <div className="relative flex h-10 items-center rounded-none bg-white px-4 py-2 shadow-sm">
          <select
            className="h-full w-full appearance-none border-0 bg-transparent pr-8 text-sm font-medium uppercase text-gray-900 focus:outline-none focus:ring-0"
            defaultValue="2025"
          >
            <option value="2025">2025</option>
            <option value="2024">2024</option>
            <option value="2023">2023</option>
          </select>
          <ChevronDown
            className="pointer-events-none absolute right-3 h-4 w-4 shrink-0 text-gray-900"
            aria-hidden
          />
        </div>
        <div className="relative flex h-10 w-40 items-center rounded-none bg-white px-4 py-2 shadow-sm">
          <select
            className="h-full w-full appearance-none border-0 bg-transparent pr-8 text-sm font-medium uppercase text-gray-900 focus:outline-none focus:ring-0"
            defaultValue={third}
          >
            <option value={third}>{third}</option>
          </select>
          <ChevronDown
            className="pointer-events-none absolute right-3 h-4 w-4 shrink-0 text-gray-900"
            aria-hidden
          />
        </div>
      </div>
      <div className="flex items-center gap-6">
        <Link
          href="#"
          className="text-sm font-semibold uppercase text-gray-900 hover:underline"
          style={{ color: '#ff7f00' }}
        >
          {t('accountPage.statsExportCsv')}
        </Link>
        <Link
          href="#"
          className="text-sm font-semibold uppercase text-gray-900 hover:underline"
          style={{ color: '#ff7f00' }}
        >
          {t('accountPage.statsExportXls')}
        </Link>
      </div>
    </div>
  );
}

const FILTER_KEYS: Array<'accountPage.statsPurchaseDate' | 'accountPage.statsPaymentDate'> = [
  'accountPage.statsPurchaseDate',
  'accountPage.statsPaymentDate',
  'accountPage.statsPurchaseDate',
  'accountPage.statsPurchaseDate',
];

export function StatisticheContent() {
  const { t } = useTranslation();

  return (
    <div className="font-sans text-gray-900">
      <section className="mb-12 mt-10">
        <h2 className="mb-1 text-lg font-bold uppercase tracking-wide text-gray-900">
          {t('accountPage.statsPurchaseSummary')}
        </h2>
        <p className="mb-6 text-sm text-gray-700">{t('accountPage.statsPurchaseSubtitle')}</p>
        <div className="divide-y divide-white/20">
          {FILTER_KEYS.map((key, i) => (
            <FilterRow key={i} thirdLabelKey={key} />
          ))}
        </div>
      </section>

      <hr className="my-8 border-t border-gray-400/70" aria-hidden />

      <section className="mb-12">
        <h2 className="mb-1 text-lg font-bold uppercase tracking-wide text-gray-900">
          {t('accountPage.statsSalesTitle')}
        </h2>
        <p className="text-sm uppercase text-gray-500">{t('accountPage.statsSalesSubtitle')}</p>
      </section>

      <hr className="my-8 border-t border-gray-400/70" aria-hidden />

      <section className="mb-12">
        <h2 className="mb-4 text-lg font-bold uppercase tracking-wide text-gray-900">
          {t('accountPage.statsReferralsTitle')}
        </h2>
        <p className="mb-8 max-w-2xl text-sm leading-relaxed text-gray-700">
          {t('accountPage.statsReferralsBody')}
        </p>
        <p className="mb-6 text-center text-base font-bold uppercase text-gray-900">
          {t('accountPage.statsNoReferrals')}
        </p>
        <div className="flex justify-center">
          <button
            type="button"
            className="rounded-none border border-gray-300 px-6 py-2.5 text-sm font-semibold uppercase text-gray-700 transition-colors hover:border-red-400 hover:text-red-600"
          >
            {t('accountPage.statsOptOutReferral')}
          </button>
        </div>
      </section>
    </div>
  );
}
