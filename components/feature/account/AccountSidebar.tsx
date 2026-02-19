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
    { href: '/account/impostazioni', label: 'IMPOSTAZIONI' },
    { href: '/account/downloads', label: 'DOWNLOADS' },
  ],
];

function SidebarDivider() {
  return <hr className="my-2 border-t border-white/20" aria-hidden />;
}

export function AccountSidebar() {
  const pathname = usePathname();

  function isActive(href: string) {
    return href === '/account'
      ? pathname === '/account'
      : pathname.startsWith(href);
  }

  const sidebarTitle =
    pathname === '/account/credito'
      ? 'CREDITO'
      : pathname === '/account/coupon'
        ? 'COUPON'
        : pathname === '/account/transazioni'
          ? 'TRANSAZIONI'
          : pathname === '/account/statistiche'
            ? 'STATISTICHE'
            : pathname === '/account/sicurezza'
              ? 'SICUREZZA'
              : pathname.startsWith('/account/impostazioni')
                ? 'IMPOSTAZIONI'
                : pathname === '/account/downloads'
                  ? 'DOWNLOADS'
                  : pathname === '/account/profilo'
                    ? 'Profilo'
                    : pathname === '/account/messaggi'
                      ? 'I MIEI MESSAGGI'
                      : pathname === '/account/indirizzi'
                        ? 'INDIRIZZI'
                        : 'Account';

  return (
    <aside className="w-72 shrink-0 border-r-2 border-white/30 pr-8">
      <h2 className="mb-5 text-3xl font-bold uppercase tracking-wide text-white">
        {sidebarTitle}
      </h2>
      <nav className="-ml-12 mt-20 flex flex-col" aria-label="Menu account">
        {SIDEBAR_SECTIONS.map((section, sectionIndex) => (
          <div key={sectionIndex}>
            {sectionIndex > 0 && <SidebarDivider />}
            <div className="flex flex-col gap-1">
              {section.map(({ href, label }) => (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    'relative flex items-center rounded-r-lg border-l-4 py-3 pl-0 pr-4 text-base font-medium uppercase tracking-wide transition-colors',
                    isActive(href)
                      ? 'border-[#FF7300] bg-[#FF7300] text-white'
                      : 'border-transparent text-white hover:bg-white/10'
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
