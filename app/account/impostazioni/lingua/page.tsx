'use client';

import { ChevronDown } from 'lucide-react';
import { ImpostazioniSubBreadcrumb } from '@/components/feature/account/ImpostazioniSubBreadcrumb';
import { useTranslation } from '@/lib/i18n/useTranslation';

function FlagIt() {
  return (
    <span className="inline-block h-5 w-7 overflow-hidden rounded-sm border border-gray-300 shadow-sm" aria-hidden>
      <span className="flex h-full w-full">
        <span className="w-1/3 bg-[#009246]" />
        <span className="w-1/3 bg-white" />
        <span className="w-1/3 bg-[#CE2B37]" />
      </span>
    </span>
  );
}

export default function ImpostazioniLinguaPage() {
  const { t } = useTranslation();

  return (
    <div className="font-sans text-gray-900">
      <ImpostazioniSubBreadcrumb current="accountPage.crumbLanguage" />

      <p className="mb-10 max-w-2xl text-lg leading-relaxed text-gray-700">
        {t('accountPage.langSettingsIntro')}
      </p>

      <form className="max-w-2xl space-y-8">
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <label className="text-lg font-medium text-gray-900">{t('accountPage.langSite')}</label>
          <button
            type="button"
            className="flex items-center gap-2 rounded-lg border border-gray-300 bg-gray-50 px-4 py-2 text-base font-semibold text-gray-900 transition-colors hover:border-[#FF7300] hover:bg-[#FF7300]/5"
          >
            <span>{t('accountPage.langItalian')}</span>
            <FlagIt />
            <ChevronDown className="h-5 w-5 text-gray-600" />
          </button>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4 rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <label className="text-lg font-medium text-gray-900">{t('accountPage.langEmail')}</label>
          <button
            type="button"
            className="flex items-center gap-2 rounded-lg border border-gray-300 bg-gray-50 px-4 py-2 text-base font-semibold text-gray-900 transition-colors hover:border-[#FF7300] hover:bg-[#FF7300]/5"
          >
            <span>{t('accountPage.langItalian')}</span>
            <FlagIt />
            <ChevronDown className="h-5 w-5 text-gray-600" />
          </button>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4 rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <label className="text-lg font-medium text-gray-900">{t('accountPage.langShowNameEn')}</label>
          <div className="h-6 w-6 shrink-0 rounded border-2 border-gray-300" />
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4 rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <label className="text-lg font-medium text-gray-900">{t('accountPage.langUseProduct')}</label>
          <div className="h-6 w-6 shrink-0 rounded border-2 border-gray-300" />
        </div>
      </form>

      <p className="mt-10 max-w-2xl text-sm leading-relaxed text-gray-500">{t('accountPage.langFootnote')}</p>
    </div>
  );
}
