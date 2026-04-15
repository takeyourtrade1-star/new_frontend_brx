'use client';

import Link from 'next/link';
import { RecuperaCredenzialiForm } from '@/components/feature/login/recupera-credenziali-form';
import { AuthShell, AUTH_GLASS_CLASS, AUTH_GLASS_LIGHT } from '@/components/layout/AuthShell';
import { useTranslation } from '@/lib/i18n/useTranslation';

export function RecoverView() {
  const { t } = useTranslation();

  return (
    <AuthShell>
      <h1 className="mb-6 text-center text-3xl font-bold uppercase tracking-wide text-white">
        {t('pages.recover.title')}
      </h1>
      <div className={AUTH_GLASS_CLASS} style={AUTH_GLASS_LIGHT}>
        <div className="p-12">
          <RecuperaCredenzialiForm />
        </div>
      </div>
      <div className="mt-4 text-center">
        <Link href="/registrati" className="text-base text-[#FF7300] font-medium hover:underline">
          {t('pages.login.noAccount')}
        </Link>
      </div>
    </AuthShell>
  );
}
