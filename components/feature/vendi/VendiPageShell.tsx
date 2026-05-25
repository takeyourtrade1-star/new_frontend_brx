'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import { Home } from 'lucide-react';
import { AppBreadcrumb, type AppBreadcrumbItem } from '@/components/ui/AppBreadcrumb';
import { useTranslation } from '@/lib/i18n/useTranslation';
import type { MessageKey } from '@/lib/i18n/messages/en';

type VendiPageShellProps = {
  title: string;
  subtitle?: string;
  breadcrumbItems: AppBreadcrumbItem[];
  children: ReactNode;
};

export function VendiPageShell({ title, subtitle, breadcrumbItems, children }: VendiPageShellProps) {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-[#f5f5f5]">
      <div className="container-content py-6 lg:py-8">
        <AppBreadcrumb
          items={breadcrumbItems}
          ariaLabel={t('vendi.breadcrumbAria')}
          variant="default"
          className="mb-5 w-auto text-sm"
        />

        <header className="mb-8 border-b border-gray-200 pb-6">
          <h1 className="text-2xl font-bold text-[#1D3160] sm:text-3xl">{title}</h1>
          {subtitle ? <p className="mt-2 max-w-2xl text-sm text-gray-600 sm:text-base">{subtitle}</p> : null}
        </header>

        {children}
      </div>
    </div>
  );
}

export function vendiBaseBreadcrumbItems(t: (key: MessageKey) => string, currentLabel: string): AppBreadcrumbItem[] {
  return [
    {
      href: '/',
      label: t('breadcrumb.home'),
      icon: <Home className="h-4 w-4" aria-hidden />,
      iconOnly: true,
      ariaLabel: t('breadcrumb.home'),
      isCurrent: false,
    },
    { href: '/account/oggetti', label: t('vendi.breadcrumb.stock'), isCurrent: false },
    { href: '/vendi', label: t('vendi.breadcrumb.methods'), isCurrent: false },
    { label: currentLabel, isCurrent: true },
  ];
}

export function VendiLoginGate() {
  const { t } = useTranslation();

  return (
    <div className="mx-auto max-w-lg rounded-2xl border border-gray-200 bg-white p-10 text-center shadow-sm">
      <h2 className="text-xl font-bold text-[#1D3160]">{t('vendi.loginRequiredTitle')}</h2>
      <p className="mt-3 text-sm leading-relaxed text-gray-600">{t('vendi.loginRequiredBody')}</p>
      <Link
        href="/login"
        className="mt-6 inline-flex rounded-full bg-[#FF7300] px-8 py-3 text-sm font-bold uppercase text-white transition hover:bg-[#e86800]"
      >
        {t('auth.login')}
      </Link>
    </div>
  );
}
