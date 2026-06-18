'use client';

import Link from 'next/link';
import { LoginForm } from '@/components/feature/login/login-form';
import { AuthSplitLayout } from '@/components/layout/AuthSplitLayout';
import {
  AuthSplitHeader,
  AUTH_LINK_CLASS,
  AUTH_SPLIT_SECTION_CLASS,
} from '@/components/auth/ui';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { SiteLanguagePicker } from '@/components/ui/SiteLanguagePicker';

export function LoginView() {
  const { t } = useTranslation();

  return (
    <AuthSplitLayout
      formPlacement="start"
      className="min-h-screen lg:min-h-screen"
      panelClassName="flex min-h-full flex-1 flex-col"
    >
      <div className="flex shrink-0 justify-end">
        <SiteLanguagePicker variant="auth" compact />
      </div>

      <div className="flex flex-1 flex-col justify-center py-6 sm:py-8">
        <AuthSplitHeader
          title={t('pages.login.demoLanding.title')}
          className="mb-5 shrink-0 sm:mb-6"
        />
        <LoginForm variant="landing" />
      </div>

      <div className={cn(AUTH_SPLIT_SECTION_CLASS, 'mt-auto shrink-0')}>
        <p>
          <Link
            href="/"
            className={`font-semibold ${AUTH_LINK_CLASS} transition-colors hover:underline`}
          >
            {t('pages.login.demoLanding.exploreSite')}
          </Link>
        </p>
        <p className="mt-2">{t('pages.login.demoLanding.description')}</p>
        <p className="mt-2">
          {t('pages.login.demoLanding.supportText')}{' '}
          <a
            href="mailto:ebartex.service@gmail.com"
            className={`font-medium ${AUTH_LINK_CLASS}`}
          >
            ebartex.service@gmail.com
          </a>
        </p>
        <p className="mt-2 font-medium text-[#86868b]/90">
          {t('pages.login.demoLanding.footerNote')}
        </p>
      </div>
    </AuthSplitLayout>
  );
}
