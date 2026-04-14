'use client';

import { usePathname } from 'next/navigation';
import { CardMascotte } from '@/components/dev/CardMascotte';

const HIDDEN_PATH_PREFIXES = ['/test-scanner'];

export function CardMascotteGate() {
  const pathname = usePathname();

  if (
    pathname &&
    HIDDEN_PATH_PREFIXES.some(
      (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
    )
  ) {
    return null;
  }

  return <CardMascotte />;
}
