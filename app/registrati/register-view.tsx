'use client';

import Link from 'next/link';
import { RegistratiDemoForm } from '@/components/feature/registrati/RegistratiDemoForm';
import { AuthShell } from '@/components/layout/AuthShell';
import { useTranslation } from '@/lib/i18n/useTranslation';

export function RegisterView() {
  const { t } = useTranslation();

  return (
    <AuthShell>
      <div className="relative w-full max-w-[480px] mx-auto overflow-hidden rounded-[40px] bg-white/85 backdrop-blur-[60px] shadow-[0_32px_64px_rgba(0,0,0,0.1),inset_0_1px_1px_rgba(255,255,255,0.8)] border border-white/50">
        <div className="p-8 sm:p-10 flex flex-col items-center">
          <h1 className="text-center text-[26px] sm:text-[32px] font-bold tracking-tight text-[#1d1d1f] mb-2">
            {t('pages.register.title')}
          </h1>
          <p className="text-center text-[15px] text-[#86868b] mb-8">
            Crea il tuo account in pochi secondi.
          </p>

          <div className="w-full">
            <RegistratiDemoForm />
          </div>

          <div className="mt-8 text-center">
            <Link href="/login?accesso=1" className="text-[14px] font-medium text-[#0066cc] hover:underline transition-colors">
              {t('pages.register.hasAccount')}
            </Link>
          </div>
        </div>
      </div>
    </AuthShell>
  );
}
