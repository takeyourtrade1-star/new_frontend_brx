'use client';

import { usePathname } from 'next/navigation';
import { AccountSidebar } from './AccountSidebar';

/** Pagine che non devono mostrare la sidebar */
const NO_SIDEBAR_PATHS = [
  '/account/lista-desideri',
];

/** Shell account: sidebar visibile a sinistra tranne per le pagine in NO_SIDEBAR_PATHS */
export function AccountShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const hideSidebar = NO_SIDEBAR_PATHS.some((p) => pathname.startsWith(p));

  if (hideSidebar) {
    return (
      <div className="container-content mx-auto min-h-[calc(100vh-80px)] py-8">
        <main>{children}</main>
      </div>
    );
  }

  return (
    <div className="container-content mx-auto flex min-h-[calc(100vh-80px)] gap-0 py-8">
      <AccountSidebar />
      <main className="min-w-0 flex-1 pl-8">{children}</main>
    </div>
  );
}
