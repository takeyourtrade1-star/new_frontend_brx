'use client';

import Link from 'next/link';
import { Home } from 'lucide-react';
import { useTranslation } from '@/lib/i18n/useTranslation';
import type { MessageKey } from '@/lib/i18n/messages/en';

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
  const navClass = isDark ? 'text-white/90' : 'text-lg text-gray-700';
  const sepClass = isDark ? 'text-white/60' : 'text-gray-400';
  const linkClass = isDark ? 'hover:text-white' : 'hover:text-gray-900';
  const lastClass = isDark ? 'text-white' : 'font-medium text-gray-900';
  const helpClass = isDark
    ? 'text-sm font-medium uppercase text-white/90 hover:text-white'
    : 'ml-auto text-sm font-medium uppercase text-gray-700 hover:text-gray-900';

  return (
    <div className={`mb-6 flex flex-wrap items-center justify-between gap-4 ${className}`}>
      <nav
        className={`flex items-center gap-2 uppercase tracking-wide ${navClass}`}
        aria-label={t('accountPage.breadcrumbNav')}
      >
        <Link
          href="/account"
          className={linkClass}
          aria-label={t('accountPage.breadcrumbHome')}
        >
          <Home className="h-5 w-5" />
        </Link>
        <span className={sepClass}>/</span>
        <Link href="/account" className={linkClass}>
          {t('sidebar.account')}
        </Link>
        <span className={sepClass}>/</span>
        <Link href="/account/impostazioni" className={linkClass}>
          {t('breadcrumb.impostazioni')}
        </Link>
        <span className={sepClass}>/</span>
        <span className={lastClass}>{t(current)}</span>
      </nav>
      {showHelpLink && (
        <Link href="/aiuto" className={helpClass}>
          {t('accountPage.needHelp')}
        </Link>
      )}
    </div>
  );
}
