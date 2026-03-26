'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useMemo } from 'react';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/lib/i18n/useTranslation';

export function AccountSidebar() {
  const { t } = useTranslation();
  const pathname = usePathname();

  const sections = useMemo(
    () =>
      [
        [{ href: '/account', label: t('sidebar.account') }],
        [
          { href: '/account/profilo', label: t('sidebar.profile') },
          { href: '/account/indirizzi', label: t('sidebar.addresses') },
          { href: '/account/messaggi', label: t('sidebar.messages') },
        ],
        [
          { href: '/account/credito', label: t('sidebar.credit') },
          { href: '/account/coupon', label: t('sidebar.coupon') },
          { href: '/account/transazioni', label: t('sidebar.transactions') },
        ],
        [
          { href: '/account/statistiche', label: t('sidebar.stats') },
          { href: '/account/sicurezza', label: t('sidebar.security') },
          { href: '/account/sincronizzazione', label: t('sidebar.sync') },
          { href: '/account/impostazioni', label: t('sidebar.settings') },
          { href: '/account/downloads', label: t('sidebar.downloads') },
        ],
      ] as const,
    [t]
  );

  function isActive(href: string) {
    return href === '/account' ? pathname === '/account' : pathname.startsWith(href);
  }

  return (
    <aside className="w-56 shrink-0 border-r border-gray-300">
      <nav className="flex flex-col" aria-label={t('account.menuAria')}>
        {sections.map((section, sectionIndex) => (
          <div key={sectionIndex}>
            {sectionIndex > 0 && <div className="my-1 h-px bg-gray-200" aria-hidden />}
            <div className="flex flex-col">
              {section.map(({ href, label }) => (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    'mx-2 flex items-center rounded-full px-4 py-2 text-sm font-semibold uppercase tracking-wide transition-colors',
                    isActive(href)
                      ? 'border border-primary/45 bg-primary/60 text-white shadow-2xl backdrop-blur-2xl backdrop-saturate-150 ring-1 ring-white/20'
                      : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                  )}
                >
                  {label}
                </Link>
              ))}
            </div>
          </div>
        ))}
      </nav>
    </aside>
  );
}
