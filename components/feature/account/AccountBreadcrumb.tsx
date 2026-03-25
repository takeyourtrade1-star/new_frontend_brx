'use client';

import Link from 'next/link';
import { Home } from 'lucide-react';
import { useTranslation } from '@/lib/i18n/useTranslation';
import type { MessageKey } from '@/lib/i18n/messages/en';

type Props = {
  /** Current section label key (e.g. sidebar.profile). */
  current: MessageKey;
  className?: string;
  size?: 'sm' | 'lg';
};

export function AccountBreadcrumb({ current, className = '', size = 'sm' }: Props) {
  const { t } = useTranslation();
  const textSize = size === 'lg' ? 'text-lg' : 'text-sm';
  const iconClass = size === 'lg' ? 'h-5 w-5' : 'h-4 w-4';

  return (
    <nav
      className={`mb-6 flex items-center gap-2 text-gray-700 ${textSize} ${className}`}
      aria-label={t('accountPage.breadcrumbNav')}
    >
      <Link
        href="/account"
        className="hover:text-gray-900"
        aria-label={t('accountPage.breadcrumbHome')}
      >
        <Home className={iconClass} />
      </Link>
      <span className="text-gray-400">/</span>
      <Link href="/account" className="hover:text-gray-900 uppercase tracking-wide">
        {t('sidebar.account')}
      </Link>
      <span className="text-gray-400">/</span>
      <span className="font-medium text-gray-900 uppercase tracking-wide">{t(current)}</span>
    </nav>
  );
}
