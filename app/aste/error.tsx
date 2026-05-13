'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { RefreshCw, AlertTriangle } from 'lucide-react';

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
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-6 px-4 py-16 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full border border-amber-200 bg-amber-50">
        <AlertTriangle className="h-8 w-8 text-amber-500" aria-hidden />
      </div>

      <div className="max-w-md">
        <h1 className="text-xl font-bold text-gray-900">
          Sezione aste non disponibile
        </h1>
        <p className="mt-2 text-sm text-gray-500">
          Si è verificato un errore imprevisto. Riprova tra qualche istante.
        </p>
        {process.env.NODE_ENV !== 'production' && error?.message && (
          <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-left font-mono text-xs text-red-700">
            {error.message}
          </p>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-center gap-3">
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
          className="inline-flex items-center gap-2 rounded-full border border-gray-300 bg-white px-5 py-2.5 text-sm font-bold text-gray-700 shadow-sm transition hover:border-gray-400"
        >
          Home
        </Link>
      </div>
    </div>
  );
}
