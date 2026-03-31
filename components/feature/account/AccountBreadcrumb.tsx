'use client';

import { Home } from 'lucide-react';
import { useTranslation } from '@/lib/i18n/useTranslation';
import type { MessageKey } from '@/lib/i18n/messages/en';
import { AppBreadcrumb, type AppBreadcrumbItem } from '@/components/ui/AppBreadcrumb';

type Props = {
  /** Current section label key (e.g. sidebar.profile). */
  current: MessageKey;
  className?: string;
  size?: 'sm' | 'lg';
};

export function AccountBreadcrumb({ current, className = '', size = 'sm' }: Props) {
  const { t } = useTranslation();
  const iconClass = size === 'lg' ? 'h-5 w-5' : 'h-4 w-4';
  const textSize = size === 'lg' ? 'text-lg' : 'text-sm';

  const items: AppBreadcrumbItem[] = [
    {
      href: '/account',
      label: t('accountPage.breadcrumbHome'),
      ariaLabel: t('accountPage.breadcrumbHome'),
      icon: <Home className={iconClass} />,
      iconOnly: true,
      isCurrent: false,
    },
    { href: '/account', label: t('sidebar.account'), isCurrent: false },
    { label: t(current), isCurrent: true },
  ];

  return (
    <AppBreadcrumb
      items={items}
      ariaLabel={t('accountPage.breadcrumbNav')}
      variant="accountLight"
      className={`mb-6 uppercase tracking-wide ${textSize} ${className}`}
    />
  );
}
