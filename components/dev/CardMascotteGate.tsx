'use client';

import { usePathname } from 'next/navigation';
import dynamic from 'next/dynamic';

// CardMascotte è un overlay (createPortal + z-index fissato): non occupa spazio nel
// flusso del layout, quindi il fallback può essere `null` senza alterare l'UI.
// L'import dinamico con ssr:false tiene la mascotte fuori dal bundle iniziale;
// internamente html2canvas è caricato on-demand solo all'interazione (vedi CardMascotte.tsx).
const CardMascotte = dynamic(
  () => import('@/components/dev/CardMascotte').then((m) => m.CardMascotte),
  { ssr: false, loading: () => null }
);

const HIDDEN_PATH_PREFIXES = [
  '/scanner',
  '/tornei',
  '/login',
  '/registrati',
  '/recupera-credenziali',
];

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
