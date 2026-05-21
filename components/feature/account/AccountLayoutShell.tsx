'use client';

import { usePathname } from 'next/navigation';
import { AccountShell } from '@/components/feature/account/AccountShell';

const FULL_WIDTH_ROUTES = ['/account/oggetti'];

export function AccountLayoutShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isFullWidth = FULL_WIDTH_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(route + '/')
  );

  if (isFullWidth) return <>{children}</>;
  return <AccountShell>{children}</AccountShell>;
}
