'use client';

import Link from 'next/link';
import { RecuperaCredenzialiForm } from '@/components/feature/login/recupera-credenziali-form';
import { AuthShell } from '@/components/layout/AuthShell';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { usePasswordResetStore } from '@/lib/stores/password-reset-store';

export function RecoverView() {
  const { t } = useTranslation();
  const step = usePasswordResetStore((s) => s.step);

  const titleKey =
    step === 'otp1_requested'
      ? 'passwordReset.step2Title'
      : step === 'otp1_verified'
      ? 'passwordReset.step3Title'
      : step === 'otp2_requested'
      ? 'passwordReset.step4Title'
      : step === 'completed'
      ? 'passwordReset.successTitle'
      : step === 'error'
      ? 'errors.titles.generic'
      : 'passwordReset.step1Title';

  const subtitleKey =
    step === 'otp1_requested'
      ? 'passwordReset.step2Subtitle'
      : step === 'otp1_verified'
      ? 'passwordReset.step3Subtitle'
      : step === 'otp2_requested'
      ? 'passwordReset.step4Subtitle'
      : step === 'completed'
      ? 'passwordReset.successMessage'
      : step === 'error'
      ? 'passwordReset.errorGeneric'
      : 'passwordReset.step1Subtitle';

  return (
    <AuthShell>
      <div className="relative w-full max-w-[480px] mx-auto overflow-hidden rounded-[40px] bg-white/85 backdrop-blur-[60px] shadow-[0_32px_64px_rgba(0,0,0,0.1),inset_0_1px_1px_rgba(255,255,255,0.8)] border border-white/50">
        <div className="p-8 sm:p-10 flex flex-col">
          <Link
            href="/login?accesso=1"
            className="self-start text-[#86868b] hover:text-[#1d1d1f] mb-6 flex items-center gap-1 text-[13px] font-medium transition-colors"
          >
            ← {t('account.securityBack')}
          </Link>
          <h1 className="text-center text-[26px] sm:text-[32px] font-bold tracking-tight text-[#1d1d1f] mb-2">
            {t(titleKey as any)}
          </h1>
          {step !== 'completed' && step !== 'error' && (
            <p className="text-center text-[14px] text-[#86868b] mb-8">
              {t(subtitleKey as any)}
            </p>
          )}
          <RecuperaCredenzialiForm />
          <div className="mt-8 pt-6 border-t border-gray-200/50 text-center">
            <p className="text-[14px] text-[#515154]">
              {t('pages.login.noAccount')}{' '}
              <Link href="/registrati" className="font-semibold text-[#0066cc] hover:underline">
                {t('auth.register')}
              </Link>
            </p>
          </div>
        </div>
      </div>
    </AuthShell>
  );
}
