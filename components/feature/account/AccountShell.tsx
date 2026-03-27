'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { AccountSidebar } from './AccountSidebar';
import { AccountBreadcrumb } from './AccountBreadcrumb';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { cn } from '@/lib/utils';
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
  const relevantSegments = segments.filter(s => s !== 'account');
  const lastSegment = relevantSegments[relevantSegments.length - 1];
  return lastSegment ? PATH_TO_KEY[lastSegment] : undefined;
}

/** Navigazione account orizzontale scrollabile: solo mobile (nascosta su md+) */
function MobileAccountNav() {
  const { t } = useTranslation();
  const pathname = usePathname();

  const links = [
    { href: '/account', label: t('sidebar.account') },
    { href: '/account/profilo', label: t('sidebar.profile') },
    { href: '/account/indirizzi', label: t('sidebar.addresses') },
    { href: '/account/messaggi', label: t('sidebar.messages') },
    { href: '/account/credito', label: t('sidebar.credit') },
    { href: '/account/coupon', label: t('sidebar.coupon') },
    { href: '/account/transazioni', label: t('sidebar.transactions') },
    { href: '/account/statistiche', label: t('sidebar.stats') },
    { href: '/account/sicurezza', label: t('sidebar.security') },
    { href: '/account/sincronizzazione', label: t('sidebar.sync') },
    { href: '/account/impostazioni', label: t('sidebar.settings') },
    { href: '/account/downloads', label: t('sidebar.downloads') },
  ];

  function isActive(href: string) {
    return href === '/account' ? pathname === '/account' : pathname.startsWith(href);
  }

  return (
    <nav
      className="scrollbar-hide mb-4 flex gap-2 overflow-x-auto pb-1 md:hidden"
      aria-label={t('account.menuAria')}
    >
      {links.map(({ href, label }) => (
        <Link
          key={href}
          href={href}
          className={cn(
            'shrink-0 rounded-full px-4 py-1.5 text-xs font-semibold uppercase tracking-wide transition-colors',
            isActive(href)
              ? 'bg-primary text-white shadow-sm'
              : 'border border-gray-300 bg-white text-gray-600 hover:border-gray-400 hover:text-gray-900'
          )}
        >
          {label}
        </Link>
      ))}
    </nav>
  );
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
      <div className="container-content mx-auto min-h-[calc(100vh-80px)] py-4 md:py-8">
        <main>
          <MobileAccountNav />
          {breadcrumbSection}
          {children}
        </main>
      </div>
    );
  }

  return (
    <div className="container-content mx-auto min-h-[calc(100vh-80px)] py-4 md:py-8">
      <MobileAccountNav />
      <div className="flex gap-0">
        <div className="hidden md:block">
          <AccountSidebar />
        </div>
        <main className="min-w-0 flex-1 md:pl-8">
          {breadcrumbSection}
          {children}
        </main>
      </div>
    </div>
  );
}
