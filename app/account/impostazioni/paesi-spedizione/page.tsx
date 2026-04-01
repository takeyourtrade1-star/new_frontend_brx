'use client';

import { useTranslation } from '@/lib/i18n/useTranslation';

export default function PaesiSpedizionePage() {
  const { t } = useTranslation();

  return (
    <div className="font-sans text-gray-900">
      <section className="max-w-3xl rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <p className="text-lg leading-relaxed text-gray-700">{t('accountPage.shipIntro')}</p>
      </section>
    </div>
  );
}
