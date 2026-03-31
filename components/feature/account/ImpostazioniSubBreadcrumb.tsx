'use client';

import Link from 'next/link';
import { Home } from 'lucide-react';
import { useTranslation } from '@/lib/i18n/useTranslation';
import type { MessageKey } from '@/lib/i18n/messages/en';
import { AppBreadcrumb, type AppBreadcrumbItem } from '@/components/ui/AppBreadcrumb';

type Props = {
  /** Last segment, e.g. `accountPage.crumbLanguage` */
  current: MessageKey;
  variant?: 'dark' | 'light';
  showHelpLink?: boolean;
  className?: string;
};

export function ImpostazioniSubBreadcrumb({
  current,
  variant = 'dark',
  showHelpLink = false,
  className = '',
}: Props) {
  const { t } = useTranslation();
  const isDark = variant === 'dark';
  const navClass = isDark ? 'text-base' : 'text-lg';
  const helpClass = isDark
    ? 'text-sm font-medium uppercase text-white/90 hover:text-white'
    : 'ml-auto text-sm font-medium uppercase text-gray-700 hover:text-gray-900';

  const items: AppBreadcrumbItem[] = [
    {
      href: '/account',
      label: t('accountPage.breadcrumbHome'),
      ariaLabel: t('accountPage.breadcrumbHome'),
      icon: <Home className="h-5 w-5" />,
      iconOnly: true,
      isCurrent: false,
    },
    { href: '/account', label: t('sidebar.account'), isCurrent: false },
    { href: '/account/impostazioni', label: t('breadcrumb.impostazioni'), isCurrent: false },
    { label: t(current), isCurrent: true },
  ];

  return (
    <div className={`mb-6 flex flex-wrap items-center justify-between gap-4 ${className}`}>
      <AppBreadcrumb
        items={items}
        ariaLabel={t('accountPage.breadcrumbNav')}
        variant={isDark ? 'accountDark' : 'accountLight'}
        className={`uppercase tracking-wide ${navClass}`}
      />
      {showHelpLink && (
        <Link href="/aiuto" className={helpClass}>
          {t('accountPage.needHelp')}
        </Link>
      )}
    </div>
  );
}
