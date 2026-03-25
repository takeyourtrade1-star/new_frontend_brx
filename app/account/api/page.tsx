'use client';

import { useTranslation } from '@/lib/i18n/useTranslation';

export default function ApiPage() {
  const { t } = useTranslation();
  return (
    <h1 className="text-2xl font-bold uppercase tracking-wide text-white">{t('accountPage.apiSettings')}</h1>
  );
}
