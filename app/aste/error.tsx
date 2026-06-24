'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { RefreshCw } from 'lucide-react';
import { MissingPage } from '@/components/shared/MissingPage';

export default function AsteError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') {
      console.error('[AsteError]', error);
    }
  }, [error]);

  return (
    <MissingPage
      title="Sezione aste non disponibile"
      description={
        <>
          <p>Si è verificato un errore imprevisto. Riprova tra qualche istante.</p>
          {process.env.NODE_ENV !== 'production' && error?.message && (
            <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-left font-mono text-xs text-red-700 dark:bg-red-950 dark:text-red-300">
              {error.message}
            </p>
          )}
        </>
      }
      actions={
        <>
          <button
            type="button"
            onClick={() => reset()}
            className="inline-flex items-center gap-2 rounded-full bg-[#FF7300] px-5 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-[#e86800]"
          >
            <RefreshCw className="h-4 w-4" aria-hidden />
            Riprova
          </button>
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-full border border-gray-300 bg-white px-5 py-2.5 text-sm font-bold text-gray-700 shadow-sm transition hover:border-gray-400 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
          >
            Home
          </Link>
        </>
      }
    />
  );
}
