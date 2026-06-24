'use client';

import { useEffect } from 'react';
import { MissingPage } from '@/components/shared/MissingPage';
import { useTranslation } from '@/lib/i18n/useTranslation';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const { t } = useTranslation();

  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.error(error);
    }
  }, [error]);

  return (
    <MissingPage
      title={t('pages.error.title')}
      description={
        <>
          <p className="max-w-md text-center">
            {process.env.NODE_ENV === 'development'
              ? error.message || t('pages.error.generic')
              : t('pages.error.generic')}
          </p>
          {process.env.NODE_ENV === 'development' && error.digest && (
            <p className="mt-2 text-xs text-gray-400">
              Digest: {error.digest}
            </p>
          )}
        </>
      }
      actions={
        <button
          type="button"
          onClick={() => reset()}
          className="rounded-md bg-[var(--color-brand)] px-4 py-2 text-sm font-medium text-white hover:opacity-90"
        >
          {t('pages.error.retry')}
        </button>
      }
    />
  );
}
