'use client';

import Link from 'next/link';
import { LoginCodeForm } from '@/components/feature/login/login-code-form';
import { AuthBackLink, AuthFooterLinks, AUTH_LINK_CLASS } from '@/components/auth/ui';
import { AuthSplitLayout } from '@/components/layout/AuthSplitLayout';
import { useTranslation } from '@/lib/i18n/useTranslation';

export function LoginCodeView() {
  const { t } = useTranslation();

  return (
    <AuthSplitLayout
      formPlacement="start"
      className="min-h-screen lg:min-h-screen"
      panelClassName="flex min-h-full flex-1 flex-col"
    >
      <AuthBackLink href="/login" label={t('auth.back')} />

      <div className="flex flex-1 flex-col justify-center py-6 sm:py-8">
        <LoginCodeForm />
      </div>

      <AuthFooterLinks align="left" className="mt-auto shrink-0">
        {t('loginCode.noAccount')}{' '}
        <Link href="/registrati" className={`font-semibold ${AUTH_LINK_CLASS}`}>
          {t('auth.register')}
        </Link>
      </AuthFooterLinks>
    </AuthSplitLayout>
  );
}
