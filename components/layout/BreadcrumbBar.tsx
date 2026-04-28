'use client';

import { usePathname } from 'next/navigation';
import { useTranslation } from '@/lib/i18n/useTranslation';
import type { MessageKey } from '@/lib/i18n/messages/en';
import { AppBreadcrumb, type AppBreadcrumbItem } from '@/components/ui/AppBreadcrumb';

/** Path segment → i18n key (extend when adding new top-level routes). */
const SEGMENT_TO_KEY: Record<string, MessageKey> = {
  account: 'breadcrumb.account',
  profilo: 'breadcrumb.profilo',
  oggetti: 'breadcrumb.oggetti',
  sincronizzazione: 'breadcrumb.sincronizzazione',
  credito: 'breadcrumb.credito',
  coupon: 'breadcrumb.coupon',
  indirizzi: 'breadcrumb.indirizzi',
  messaggi: 'breadcrumb.messaggi',
  transazioni: 'breadcrumb.transazioni',
  statistiche: 'breadcrumb.statistiche',
  sicurezza: 'breadcrumb.sicurezza',
  impostazioni: 'breadcrumb.impostazioni',
  'paesi-spedizione': 'breadcrumb.paesi-spedizione',
  lingua: 'breadcrumb.lingua',
  email: 'breadcrumb.email',
  'utenti-bloccati': 'breadcrumb.utenti-bloccati',
  downloads: 'breadcrumb.downloads',
  api: 'breadcrumb.api',
  acquisti: 'breadcrumb.acquisti',
  ordini: 'breadcrumb.ordini',
  products: 'breadcrumb.products',
  product: 'breadcrumb.product',
  search: 'breadcrumb.search',
  cart: 'breadcrumb.cart',
  aste: 'breadcrumb.aste',
  'tcg-express': 'breadcrumb.tcgExpress',
  aiuto: 'breadcrumb.aiuto',
  contatti: 'breadcrumb.contatti',
  legal: 'breadcrumb.legal',
  norme: 'breadcrumb.norme',
  condizioni: 'breadcrumb.condizioni',
  privacy: 'breadcrumb.privacy',
  cookie: 'breadcrumb.cookie',
  login: 'breadcrumb.login',
  registrati: 'breadcrumb.registrati',
  'recupera-credenziali': 'breadcrumb.recupera-credenziali',
  'lista-desideri': 'breadcrumb.lista-desideri',
};

export function BreadcrumbBar() {
  const pathname = usePathname();
  const { t } = useTranslation();
  const segments = pathname.split('/').filter(Boolean);

  const items: AppBreadcrumbItem[] = [
    { href: '/', label: t('breadcrumb.home'), isCurrent: segments.length === 0 },
  ];

  let href = '';
  segments.forEach((seg, i) => {
    href += `/${seg}`;
    const key = SEGMENT_TO_KEY[seg];
    const label = key ? t(key) : formatSegmentFallback(seg);
    items.push({ href, label, isCurrent: i === segments.length - 1 });
  });

  return (
    <AppBreadcrumb
      items={items}
      ariaLabel={t('accountPage.breadcrumbNav')}
      variant="topbarBlue"
      prefix={(
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
      )}
    />
  );
}

function formatSegmentFallback(segment: string): string {
  if (segment.length === 0) return '';
  return segment
    .split(/[-_]/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');
}
