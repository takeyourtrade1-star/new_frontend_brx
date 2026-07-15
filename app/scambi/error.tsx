'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { cn } from '@/lib/utils';
import { ScambiShell, scambiGlass } from '@/components/feature/scambi/ScambiShell';

export default function ScambiError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const { t } = useTranslation();

  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') {
      console.error('[ScambiError]', error);
    }
  }, [error]);

  return (
    <ScambiShell>
      <div className="container-content flex min-h-[70vh] items-center justify-center py-12">
        <section className={cn(scambiGlass, 'w-full max-w-lg rounded-[2rem] p-7 text-center sm:p-9')} role="alert">
          <h1 className="text-2xl font-black uppercase tracking-tight text-white">{t('pages.error.scambiTitle')}</h1>
          <p className="mt-2 text-sm leading-relaxed text-white/60">{t('pages.error.sectionGeneric')}</p>
          {process.env.NODE_ENV !== 'production' && error?.message && (
            <p className="mt-4 break-words rounded-xl border border-red-300/20 bg-red-400/10 px-3 py-2 text-left font-mono text-xs text-red-100">
              {error.message}
            </p>
          )}
          <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            type="button"
            onClick={reset}
            className="inline-flex items-center rounded-xl bg-[#FF7300] px-5 py-2.5 text-sm font-black text-white shadow-sm transition-all hover:-translate-y-0.5 hover:bg-[#e86800] hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF8A26]/60 motion-reduce:transform-none"
          >
            {t('pages.error.retry')}
          </button>
          <Link
            href="/"
            className="inline-flex items-center rounded-xl border border-white/15 bg-white/10 px-5 py-2.5 text-sm font-bold text-white/75 transition-colors hover:bg-white/15 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
          >
            {t('pages.error.home')}
          </Link>
          </div>
        </section>
      </div>
    </ScambiShell>
  );
}
