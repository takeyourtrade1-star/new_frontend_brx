'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { RecuperaCredenzialiForm } from '@/components/feature/login/recupera-credenziali-form';
import {
  AuthBackLink,
  AuthFooterLinks,
  AuthStepIndicator,
  AuthSplitHeader,
  AUTH_LINK_CLASS,
} from '@/components/auth/ui';
import { AuthSplitLayout } from '@/components/layout/AuthSplitLayout';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { usePasswordResetStore } from '@/lib/stores/password-reset-store';

function stepNumber(step: string): number {
  switch (step) {
    case 'otp1_requested':
      return 2;
    case 'otp1_verified':
      return 3;
    case 'otp2_requested':
      return 4;
    case 'completed':
    case 'error':
      return 4;
    default:
      return 1;
  }
}

export function RecoverView() {
  const { t } = useTranslation();
  const step = usePasswordResetStore((s) => s.step);
  const resetFlow = usePasswordResetStore((s) => s.resetFlow);

  useEffect(() => {
    resetFlow();
  }, [resetFlow]);

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

  const showStepIndicator = step !== 'completed' && step !== 'error';

  return (
    <AuthSplitLayout
      formPlacement="start"
      className="min-h-screen lg:min-h-screen"
      panelClassName="flex min-h-full flex-1 flex-col"
    >
      <AuthBackLink href="/login" label={t('auth.back')} />

      <div className="flex flex-1 flex-col justify-center py-6 sm:py-8">
        <AuthSplitHeader
          title={t(titleKey)}
          subtitle={showStepIndicator ? t(subtitleKey) : undefined}
          className="mb-0 shrink-0"
        />

        {showStepIndicator ? (
          <AuthStepIndicator currentStep={stepNumber(step)} totalSteps={4} />
        ) : null}

        <RecuperaCredenzialiForm />
      </div>

      <AuthFooterLinks align="left" className="mt-auto shrink-0">
        {t('pages.login.noAccountPrompt')}{' '}
        <Link href="/registrati" className={`font-semibold ${AUTH_LINK_CLASS}`}>
          {t('auth.register')}
        </Link>
      </AuthFooterLinks>
    </AuthSplitLayout>
  );
}
