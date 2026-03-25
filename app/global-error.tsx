'use client';

import { useEffect, useState } from 'react';
import { getMessage } from '@/lib/i18n/getMessage';
import { readStoredUiLocale } from '@/lib/i18n/clientLocale';
import type { MessageKey } from '@/lib/i18n/messages/en';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const [locale, setLocale] = useState(() => readStoredUiLocale());

  useEffect(() => {
    setLocale(readStoredUiLocale());
  }, []);

  const t = (key: MessageKey) => getMessage(locale, key);

  return (
    <html lang={locale}>
      <body className="font-sans antialiased min-h-screen bg-white text-gray-900 dark:bg-gray-900 dark:text-gray-100">
        <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-8">
          <h2 className="text-xl font-semibold">{t('pages.globalError.title')}</h2>
          <p className="max-w-md text-center text-gray-600 dark:text-gray-400">
            {error.message || t('pages.globalError.generic')}
          </p>
          <button
            type="button"
            onClick={() => reset()}
            className="rounded-md bg-[#3D65C6] px-4 py-2 text-sm font-medium text-white hover:opacity-90"
          >
            {t('pages.globalError.reload')}
          </button>
        </div>
      </body>
    </html>
  );
}
