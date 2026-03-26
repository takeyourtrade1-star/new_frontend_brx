'use client';

import { Download } from 'lucide-react';
import { useTranslation } from '@/lib/i18n/useTranslation';

export function DownloadsContent() {
  const { t } = useTranslation();

  return (
    <div className="font-sans text-gray-900">
      <h1 className="mb-8 text-2xl font-bold uppercase tracking-wide text-gray-900 sm:text-3xl">
        {t('sidebar.downloads')}
      </h1>

      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="mb-4 flex h-14 w-14 items-center justify-center border border-gray-200 bg-gray-50">
          <Download className="h-6 w-6 text-gray-400" />
        </div>
        <p className="text-base font-semibold text-gray-500 uppercase tracking-wide">
          {t('accountPage.downloadsEmpty')}
        </p>
        <p className="mt-2 text-sm text-gray-400">{t('accountPage.downloadsEmptyHint')}</p>
      </div>
    </div>
  );
}
