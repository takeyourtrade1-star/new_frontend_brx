'use client';

import { usePathname } from 'next/navigation';
import { AccountSidebar } from './AccountSidebar';

export function AccountShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const hideSidebar =
    pathname === '/account/messaggi' ||
    pathname === '/account/oggetti' ||
    pathname === '/account/impostazioni/lingua' ||
    pathname === '/account/impostazioni/email' ||
    pathname === '/account/impostazioni/utenti-bloccati' ||
    pathname === '/account/impostazioni/paesi-spedizione';

  if (pathname === '/account/messaggi' || pathname === '/account/oggetti') {
    return (
      <main className="w-full px-4 py-8 md:container md:mx-auto">
        {children}
      </main>
    );
  }

  return (
    <div className="container mx-auto flex gap-6 px-4 py-8">
      {!hideSidebar && <AccountSidebar />}
      <main className="min-w-0 flex-1">{children}</main>
    </div>
  );
}
