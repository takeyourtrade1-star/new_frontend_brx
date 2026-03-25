'use client';

import Link from 'next/link';
import { useTranslation } from '@/lib/i18n/useTranslation';

export default function NotFound() {
  const { t } = useTranslation();
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 p-8">
      <h2 className="text-xl font-semibold text-[var(--color-brand-dark)] dark:text-white">
        {t('pages.notFound.title')}
      </h2>
      <p className="text-muted-foreground">{t('pages.notFound.description')}</p>
      <Link
        href="/"
        className="rounded-md bg-[var(--color-brand)] px-4 py-2 text-sm font-medium text-white hover:opacity-90"
      >
        {t('pages.notFound.backHome')}
      </Link>
    </div>
  );
}
