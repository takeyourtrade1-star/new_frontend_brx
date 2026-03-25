'use client';

import Link from 'next/link';
import { useTranslation } from '@/lib/i18n/useTranslation';

/**
 * Scelta tra i tre tipi di registrazione: Demo, Account privato, Account business.
 * Mostrato sulla pagina /registrati. Non tocca login né altri flussi.
 */
export function RegistratiChoice() {
  const { t } = useTranslation();

  return (
    <div className="space-y-6">
      <p className="text-center text-white/90">{t('registerChoice.intro')}</p>
      <div className="grid gap-4 sm:grid-cols-1">
        <Link
          href="/registrati/demo"
          className="block rounded-xl border-2 border-white/30 bg-white/05 p-6 text-center transition-colors hover:border-[#FF7300] hover:bg-white/10"
        >
          <h2 className="mb-2 text-lg font-bold uppercase tracking-wide text-white">
            {t('registerChoice.demoTitle')}
          </h2>
          <p className="text-sm text-white/80">{t('registerChoice.demoDesc')}</p>
        </Link>
        <div
          aria-disabled
          className="relative block cursor-not-allowed rounded-xl border-2 border-white/25 bg-white/05 p-6 text-center opacity-90"
        >
          <div className="absolute right-4 top-4 rounded-full border border-white/25 bg-black/20 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white/90 backdrop-blur">
            {t('registerChoice.soonBadge')}
          </div>
          <h2 className="mb-2 text-lg font-bold uppercase tracking-wide text-white">
            {t('registerChoice.privatoTitle')}
          </h2>
          <p className="text-sm text-white/70">{t('registerChoice.privatoDesc')}</p>
        </div>
        <div
          aria-disabled
          className="relative block cursor-not-allowed rounded-xl border-2 border-white/25 bg-white/05 p-6 text-center opacity-90"
        >
          <div className="absolute right-4 top-4 rounded-full border border-white/25 bg-black/20 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white/90 backdrop-blur">
            {t('registerChoice.soonBadge')}
          </div>
          <h2 className="mb-2 text-lg font-bold uppercase tracking-wide text-white">
            {t('registerChoice.businessTitle')}
          </h2>
          <p className="text-sm text-white/70">{t('registerChoice.businessDesc')}</p>
        </div>
      </div>
    </div>
  );
}
