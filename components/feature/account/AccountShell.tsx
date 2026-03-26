'use client';

import { usePathname } from 'next/navigation';
import { AccountSidebar } from './AccountSidebar';
import { AccountBreadcrumb } from './AccountBreadcrumb';
import type { MessageKey } from '@/lib/i18n/messages/en';

/** Path segment → i18n key per la breadcrumb */
const PATH_TO_KEY: Record<string, MessageKey> = {
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
  downloads: 'breadcrumb.downloads',
  api: 'breadcrumb.api',
  acquisti: 'breadcrumb.acquisti',
  ordini: 'breadcrumb.ordini',
  'lista-desideri': 'breadcrumb.lista-desideri',
  'utenti-bloccati': 'breadcrumb.utenti-bloccati',
};

/** Pagine che non devono mostrare la sidebar */
const NO_SIDEBAR_PATHS = [
  '/account/lista-desideri',
  '/account/oggetti',
];

/** Estrae la chiave i18n dal pathname per la breadcrumb */
function getBreadcrumbKey(pathname: string): MessageKey | undefined {
  const segments = pathname.split('/').filter(Boolean);
  // Rimuovi 'account' dal primo segmento e prendi l'ultimo
  const relevantSegments = segments.filter(s => s !== 'account');
  const lastSegment = relevantSegments[relevantSegments.length - 1];
  return lastSegment ? PATH_TO_KEY[lastSegment] : undefined;
}

/** Shell account: sidebar visibile a sinistra tranne per le pagine in NO_SIDEBAR_PATHS */
export function AccountShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const hideSidebar = NO_SIDEBAR_PATHS.some((p) => pathname.startsWith(p));
  const breadcrumbKey = getBreadcrumbKey(pathname);

  const breadcrumbSection = breadcrumbKey ? (
    <div className="mb-6">
      <AccountBreadcrumb current={breadcrumbKey} />
    </div>
  ) : null;

  if (hideSidebar) {
    return (
      <div className="container-content mx-auto min-h-[calc(100vh-80px)] py-8">
        <main>
          {breadcrumbSection}
          {children}
        </main>
      </div>
    );
  }

  return (
    <div className="container-content mx-auto flex min-h-[calc(100vh-80px)] gap-0 py-8">
      <AccountSidebar />
      <main className="min-w-0 flex-1 pl-8">
        {breadcrumbSection}
        {children}
      </main>
    </div>
  );
}
