'use client';

import Link from 'next/link';
import { MissingPage } from '@/components/shared/MissingPage';
import { useTranslation } from '@/lib/i18n/useTranslation';

export default function NotFound() {
  const { t } = useTranslation();

  return (
    <MissingPage
      title={t('pages.notFound.title')}
      description={t('pages.notFound.description')}
      actions={
        <Link
          href="/"
          className="rounded-md bg-[var(--color-brand)] px-4 py-2 text-sm font-medium text-white hover:opacity-90"
        >
          {t('pages.notFound.backHome')}
        </Link>
      }
    />
  );
}
