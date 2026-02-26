'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

/** Mappa segmenti di path → etichette per il breadcrumb (estensibile con dati da backend/cms) */
const SEGMENT_LABELS: Record<string, string> = {
  home: 'Home',
  account: 'Account',
  profilo: 'Profilo',
  oggetti: 'Oggetti',
  sincronizzazione: 'Sincronizzazione',
  credito: 'Credito',
  coupon: 'Coupon',
  indirizzi: 'Indirizzi',
  messaggi: 'Messaggi',
  transazioni: 'Transazioni',
  statistiche: 'Statistiche',
  sicurezza: 'Sicurezza',
  impostazioni: 'Impostazioni',
  'paesi-spedizione': 'Paesi di spedizione',
  lingua: 'Lingua',
  email: 'Email',
  'utenti-bloccati': 'Utenti bloccati',
  downloads: 'Download',
  api: 'API',
  acquisti: 'Acquisti',
  ordini: 'Ordini',
  products: 'Prodotti',
  product: 'Dettaglio',
  search: 'Ricerca',
  cart: 'Carrello',
  aste: 'Aste',
  scambi: 'Scambi',
  aiuto: 'Aiuto',
  contatti: 'Contatti',
  legal: 'Normativa',
  norme: 'Norme legali',
  condizioni: 'Condizioni',
  privacy: 'Privacy',
  cookie: 'Cookie',
  login: 'Accedi',
  registrati: 'Registrati',
  'recupera-credenziali': 'Recupera credenziali',
};

function getLabel(segment: string): string {
  if (SEGMENT_LABELS[segment]) return SEGMENT_LABELS[segment];
  if (segment.length === 0) return 'Home';
  return segment
    .split(/[-_]/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');
}

export function BreadcrumbBar() {
  const pathname = usePathname();
  const segments = pathname.split('/').filter(Boolean);

  const items: { href: string; label: string; isLast: boolean }[] = [
    { href: '/', label: 'Home', isLast: segments.length === 0 },
  ];

  let href = '';
  segments.forEach((seg, i) => {
    href += `/${seg}`;
    const isLast = i === segments.length - 1;
    const label = getLabel(seg);
    items.push({ href, label, isLast });
  });

  return (
    <nav
      className="flex w-full items-center gap-1.5 border-t border-white/15 px-2 py-2 text-sm text-white/95 sm:px-3"
      style={{ backgroundColor: '#1D3160' }}
      aria-label="Breadcrumb"
    >
      {/* Icona placeholder (sostituibile con asset Figma) */}
      <span
        className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-white/20"
        aria-hidden
      >
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-white"
        >
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
          <polyline points="9 22 9 12 15 12 15 22" />
        </svg>
      </span>

      <ol className="flex min-w-0 flex-wrap items-center gap-1.5">
        {items.map((item, i) => (
          <li key={item.href} className="flex items-center gap-1.5">
            {i > 0 && (
              <span className="text-white/50 select-none" aria-hidden>
                /
              </span>
            )}
            {item.isLast ? (
              <span className="truncate font-medium text-white" aria-current="page">
                {item.label}
              </span>
            ) : (
              <Link
                href={item.href}
                className="truncate text-white/90 transition-colors hover:text-white hover:underline"
              >
                {item.label}
              </Link>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
