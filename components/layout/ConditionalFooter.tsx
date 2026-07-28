'use client';

import { usePathname } from 'next/navigation';
import { Footer } from '@/components/layout/Footer';

const HIDE_FOOTER_PREFIXES = ['/c/asta-foto', '/c/vendi-foto', '/tornei'];

export function ConditionalFooter() {
  const pathname = usePathname();
  if (pathname && HIDE_FOOTER_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
    return null;
  }
  return <Footer />;
}
