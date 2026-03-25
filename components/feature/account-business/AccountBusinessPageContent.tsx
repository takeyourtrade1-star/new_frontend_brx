'use client';

import Link from 'next/link';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { AccountBusinessForm } from '@/components/feature/account-business/AccountBusinessForm';

export function AccountBusinessPageContent() {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-[#212121] px-4 py-10 sm:py-16">
      <div className="mx-auto max-w-2xl">
        <div className="rounded-2xl bg-white p-8 shadow-xl sm:p-10">
          <h1 className="mb-2 text-2xl font-bold text-[#1f2937]">{t('accountBusiness.pageTitle')}</h1>
          <p className="mb-6 text-sm text-gray-500">{t('accountBusiness.intro')}</p>

          <div className="mb-8 rounded-xl bg-gray-50 p-4 text-sm text-gray-700">
            <h2 className="mb-2 font-semibold text-gray-900">{t('accountBusiness.whoTitle')}</h2>
            <p className="mb-3">{t('accountBusiness.whoText')}</p>
            <h2 className="mb-2 font-semibold text-gray-900">{t('accountBusiness.needTitle')}</h2>
            <ul className="list-inside list-disc space-y-1">
              <li>{t('accountBusiness.need1')}</li>
              <li>{t('accountBusiness.need2')}</li>
              <li>{t('accountBusiness.need3')}</li>
            </ul>
            <p className="mt-3 text-gray-600">{t('accountBusiness.afterText')}</p>
          </div>

          <div>
            <h2 className="mb-4 text-lg font-semibold text-gray-900">{t('accountBusiness.formSectionTitle')}</h2>
            <AccountBusinessForm />
          </div>
        </div>

        <p className="mt-6 text-center">
          <Link
            href="/registrati"
            className="text-sm text-white/80 hover:text-white hover:underline"
          >
            {t('accountBusiness.footerLink')}
          </Link>
        </p>
      </div>
    </div>
  );
}
