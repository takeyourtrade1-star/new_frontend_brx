'use client';

import Link from 'next/link';
import { RegistratiChoice } from '@/components/feature/registrati/RegistratiChoice';
import { AuthShell, AUTH_GLASS_CLASS, AUTH_GLASS_DARK } from '@/components/layout/AuthShell';
import { useTranslation } from '@/lib/i18n/useTranslation';

export function RegisterView() {
  const { t } = useTranslation();

  return (
    <AuthShell>
      <h1 className="mb-6 text-center text-3xl font-bold uppercase tracking-wide text-white">
        {t('pages.register.title')}
      </h1>
      <div className={AUTH_GLASS_CLASS} style={AUTH_GLASS_DARK}>
        <div className="p-12">
          <RegistratiChoice />
        </div>
      </div>
      <div className="mt-4 text-center">
        <Link href="/login" className="text-sm text-white hover:underline">
          {t('pages.register.hasAccount')}
        </Link>
      </div>
    </AuthShell>
  );
}
