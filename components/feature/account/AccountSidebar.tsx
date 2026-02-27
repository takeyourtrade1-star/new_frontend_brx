'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

type SidebarLink = { href: string; label: string };

const SIDEBAR_SECTIONS: SidebarLink[][] = [
  [{ href: '/account', label: 'ACCOUNT' }],
  [
    { href: '/account/profilo', label: 'PROFILO' },
    { href: '/account/indirizzi', label: 'INDIRIZZI' },
    { href: '/account/messaggi', label: 'I MIEI MESSAGGI' },
  ],
  [
    { href: '/account/credito', label: 'CREDITO' },
    { href: '/account/coupon', label: 'COUPON' },
    { href: '/account/transazioni', label: 'TRANSAZIONI' },
  ],
  [
    { href: '/account/statistiche', label: 'STATISTICHE' },
    { href: '/account/sicurezza', label: 'SICUREZZA' },
    { href: '/account/sincronizzazione', label: 'SINCRONIZZAZIONE' },
    { href: '/account/impostazioni', label: 'IMPOSTAZIONI' },
    { href: '/account/downloads', label: 'DOWNLOADS' },
  ],
];

export function AccountSidebar() {
  const pathname = usePathname();

  function isActive(href: string) {
    return href === '/account'
      ? pathname === '/account'
      : pathname.startsWith(href);
  }

  return (
    <aside className="w-56 shrink-0 border-r border-gray-300">
      <nav className="flex flex-col" aria-label="Menu account">
        {SIDEBAR_SECTIONS.map((section, sectionIndex) => (
          <div key={sectionIndex}>
            {sectionIndex > 0 && (
              <div className="my-1 h-px bg-gray-200" aria-hidden />
            )}
            <div className="flex flex-col">
              {section.map(({ href, label }) => (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    'flex items-center border-l-4 py-2.5 pl-4 pr-3 text-sm font-semibold uppercase tracking-wide transition-colors',
                    isActive(href)
                      ? 'border-[#FF7300] bg-[#FF7300]/8 text-[#FF7300]'
                      : 'border-transparent text-gray-700 hover:border-gray-300 hover:bg-gray-100 hover:text-gray-900'
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
