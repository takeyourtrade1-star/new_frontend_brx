'use client';

import { useTranslation } from '@/lib/i18n/useTranslation';

export function ProductsPageClient() {
  const { t } = useTranslation();

  return (
    <main className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold">{t('productsPage.title')}</h1>
      <p className="mt-2 text-muted-foreground">{t('productsPage.body')}</p>
    </main>
  );
}
