'use client';

import { useTranslation } from '@/lib/i18n/useTranslation';

export function SearchPageLoading() {
  const { t } = useTranslation();
  return <div className="p-8 text-center text-white">{t('searchPage.loading')}</div>;
}
