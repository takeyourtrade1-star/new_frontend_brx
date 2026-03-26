'use client';

import Link from 'next/link';
import { ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useTranslation } from '@/lib/i18n/useTranslation';

const SALDO_MOCK = '0,00';

export function TransazioniContent() {
  const { t } = useTranslation();

  return (
    <div className="text-gray-900" style={{ backgroundColor: 'transparent' }}>
      <div className="mb-6 mt-2 rounded-none bg-gray-100 px-6 py-5 shadow-md">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <span className="text-sm font-medium uppercase tracking-wide text-gray-700">
            {t('accountPage.txYourCredit')}
          </span>
          <span className="text-2xl font-bold text-gray-800 sm:text-3xl">
            {SALDO_MOCK} €
          </span>
        </div>
      </div>

      <div className="mb-10 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <Button
            type="button"
            className="rounded-none px-6 py-2.5 text-sm font-semibold uppercase text-gray-900 shadow-md transition-opacity hover:opacity-90"
            style={{ backgroundColor: '#ff7f00' }}
          >
            {t('accountPage.txTopUp')}
          </Button>
          <Button
            type="button"
            className="rounded-none border border-[#1D3160] px-6 py-2.5 text-sm font-semibold uppercase text-white shadow-sm transition-opacity hover:opacity-90"
            style={{ backgroundColor: '#1D3160' }}
          >
            {t('accountPage.txWithdraw')}
          </Button>
        </div>
        <Link
          href="/account/transazioni"
          className="text-sm text-gray-900 underline hover:text-gray-700"
        >
          {t('accountPage.txAllLink')}
        </Link>
      </div>

      <section>
        <h2 className="mb-4 text-lg font-bold uppercase tracking-wide text-gray-900">
          {t('accountPage.txSectionTitle')}
        </h2>

        <div className="rounded-none bg-gray-100 p-6 shadow-md">
          <div className="grid grid-cols-1 items-end gap-10 sm:grid-cols-[1fr_1fr_1fr_auto]">
            <div className="min-w-0">
              <label
                htmlFor="transazioni-periodo"
                className="mb-2 block text-sm font-medium uppercase text-gray-900"
              >
                {t('accountPage.txPickPeriod')}
              </label>
              <div className="relative flex h-10 items-center rounded-none bg-white px-4 py-2 shadow-sm">
                <select
                  id="transazioni-periodo"
                  className="h-full w-full appearance-none border-0 bg-transparent pr-8 text-sm font-medium uppercase text-gray-900 focus:outline-none focus:ring-0"
                  defaultValue="month"
                >
                  <option value="month">{t('accountPage.txThisMonth')}</option>
                  <option value="week">{t('accountPage.txThisWeek')}</option>
                  <option value="year">{t('accountPage.txThisYear')}</option>
                </select>
                <ChevronDown
                  className="pointer-events-none absolute right-3 h-4 w-4 shrink-0 text-gray-900"
                  aria-hidden
                />
              </div>
            </div>

            <div className="min-w-0">
              <label
                htmlFor="transazioni-data-inizio"
                className="mb-2 block text-sm font-medium uppercase text-gray-900"
              >
                {t('accountPage.couponStartDate')}
              </label>
              <div className="relative flex h-10 items-center rounded-none bg-white px-4 py-2 shadow-sm">
                <Input
                  id="transazioni-data-inizio"
                  type="text"
                  placeholder={t('accountPage.datePlaceholder')}
                  className="h-full border-0 bg-transparent text-sm font-medium uppercase text-gray-900 placeholder:text-gray-500 focus-visible:ring-0 focus-visible:ring-offset-0"
                />
                <ChevronDown
                  className="pointer-events-none absolute right-3 h-4 w-4 shrink-0 text-gray-900"
                  aria-hidden
                />
              </div>
            </div>

            <div className="min-w-0">
              <label
                htmlFor="transazioni-data-fine"
                className="mb-2 block text-sm font-medium uppercase text-gray-900"
              >
                {t('accountPage.couponEndDate')}
              </label>
              <div className="relative flex h-10 items-center rounded-none bg-white px-4 py-2 shadow-sm">
                <Input
                  id="transazioni-data-fine"
                  type="text"
                  placeholder={t('accountPage.datePlaceholder')}
                  className="h-full border-0 bg-transparent text-sm font-medium uppercase text-gray-900 placeholder:text-gray-500 focus-visible:ring-0 focus-visible:ring-offset-0"
                />
                <ChevronDown
                  className="pointer-events-none absolute right-3 h-4 w-4 shrink-0 text-gray-900"
                  aria-hidden
                />
              </div>
            </div>

            <Button
              type="button"
              className="h-10 shrink-0 rounded-none px-6 font-semibold uppercase text-gray-900 shadow-md transition-opacity hover:opacity-90"
              style={{ backgroundColor: '#ff7f00' }}
            >
              {t('search.searchBtn')}
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
