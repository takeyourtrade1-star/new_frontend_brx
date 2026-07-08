'use client';

import { usePathname } from 'next/navigation';
import dynamic from 'next/dynamic';

// AssoRoot è un overlay (position:fixed): fallback null non altera il layout.
// L'import dinamico con ssr:false tiene la mascotte fuori dal bundle iniziale;
// guardaroba e html2canvas sono a loro volta chunk on-demand (vedi AssoRoot).
const AssoRoot = dynamic(
  () => import('@/components/mascotte/AssoRoot').then((m) => m.AssoRoot),
  { ssr: false, loading: () => null }
);

const HIDDEN_PATH_PREFIXES = [
  '/scanner',
  '/tornei',
  '/login',
  '/registrati',
  '/recupera-credenziali',
];

export function AssoGate() {
  const pathname = usePathname();

  if (
    pathname &&
    HIDDEN_PATH_PREFIXES.some(
      (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
    )
  ) {
    return null;
  }

  return <AssoRoot />;
}
