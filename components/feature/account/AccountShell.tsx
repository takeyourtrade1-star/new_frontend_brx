'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useRef, useState, useEffect, useCallback } from 'react';
import { AccountBreadcrumb } from './AccountBreadcrumb';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { cn } from '@/lib/utils';
import type { MessageKey } from '@/lib/i18n/messages/en';
import {
  User,
  UserCircle,
  MapPin,
  MessageSquare,
  Wallet,
  Ticket,
  Receipt,
  BarChart3,
  Shield,
  RefreshCw,
  Settings,
  Download,
  ChevronRight,
  ChevronLeft,
  LucideIcon,
} from 'lucide-react';

const HEADER_OFFSET = 80;

/** Links navigazione account */
const ACCOUNT_LINKS: { href: string; icon: LucideIcon; key: string }[] = [
  { href: '/account', icon: User, key: 'sidebar.account' },
  { href: '/account/profilo', icon: UserCircle, key: 'sidebar.profile' },
  { href: '/account/indirizzi', icon: MapPin, key: 'sidebar.addresses' },
  { href: '/account/messaggi', icon: MessageSquare, key: 'sidebar.messages' },
  { href: '/account/credito', icon: Wallet, key: 'sidebar.credit' },
  { href: '/account/coupon', icon: Ticket, key: 'sidebar.coupon' },
  { href: '/account/transazioni', icon: Receipt, key: 'sidebar.transactions' },
  { href: '/account/statistiche', icon: BarChart3, key: 'sidebar.stats' },
  { href: '/account/sicurezza', icon: Shield, key: 'sidebar.security' },
  { href: '/account/sincronizzazione', icon: RefreshCw, key: 'sidebar.sync' },
  { href: '/account/impostazioni', icon: Settings, key: 'sidebar.settings' },
  { href: '/account/downloads', icon: Download, key: 'sidebar.downloads' },
];

/** Verifica se un link è attivo */
function isLinkActive(href: string, pathname: string): boolean {
  return href === '/account' ? pathname === '/account' : pathname.startsWith(href);
}

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

/** Estrae la chiave i18n dal pathname per la breadcrumb */
function getBreadcrumbKey(pathname: string): MessageKey | undefined {
  const segments = pathname.split('/').filter(Boolean);
  const relevantSegments = segments.filter(s => s !== 'account');
  const lastSegment = relevantSegments[relevantSegments.length - 1];
  return lastSegment ? PATH_TO_KEY[lastSegment] : undefined;
}

/** Sidebar verticale fissa per desktop */
function AccountSidebar() {
  const { t } = useTranslation();
  const pathname = usePathname();
  const [stickyTop, setStickyTop] = useState(HEADER_OFFSET);

  useEffect(() => {
    const header = document.querySelector('header');
    if (!header) return;
    const measure = () => setStickyTop(header.getBoundingClientRect().height);
    measure();
    const ro = new ResizeObserver(() => measure());
    ro.observe(header);
    window.addEventListener('resize', measure);
    return () => { ro.disconnect(); window.removeEventListener('resize', measure); };
  }, []);

  return (
    <aside 
      className="sticky hidden h-fit w-56 shrink-0 flex-col gap-1 overflow-hidden rounded-xl border border-gray-200 bg-white p-3 md:flex"
      style={{ top: stickyTop + 16 }}
    >
      <nav className="flex flex-col gap-1" aria-label={t('account.menuAria')}>
        {ACCOUNT_LINKS.map(({ href, icon: Icon, key }) => {
          const active = isLinkActive(href, pathname);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                active
                  ? 'bg-primary/10 text-primary'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              )}
            >
              <Icon className="h-5 w-5 shrink-0" aria-hidden />
              <span className="truncate">{t(key as any)}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}

/** Navigazione account orizzontale scrollabile: solo mobile */
function AccountNavMobile() {
  const { t } = useTranslation();
  const pathname = usePathname();
  const navRef = useRef<HTMLElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [stickyTop, setStickyTop] = useState(HEADER_OFFSET);

  // Misura l'altezza effettiva dell'header per calcolare l'offset corretto
  useEffect(() => {
    const header = document.querySelector('header');
    if (!header) return;
    
    const measure = () => {
      const height = header.getBoundingClientRect().height;
      setStickyTop(height);
    };
    
    measure();
    
    const ro = new ResizeObserver(() => measure());
    ro.observe(header);
    window.addEventListener('resize', measure);
    
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', measure);
    };
  }, []);

  const checkScroll = useCallback(() => {
    const nav = navRef.current;
    if (!nav) return;
    setCanScrollLeft(nav.scrollLeft > 10);
    setCanScrollRight(nav.scrollLeft < nav.scrollWidth - nav.clientWidth - 10);
  }, []);

  useEffect(() => {
    const nav = navRef.current;
    if (!nav) return;
    checkScroll();
    nav.addEventListener('scroll', checkScroll);
    window.addEventListener('resize', checkScroll);
    return () => {
      nav.removeEventListener('scroll', checkScroll);
      window.removeEventListener('resize', checkScroll);
    };
  }, [checkScroll]);

  const scroll = useCallback((direction: 'left' | 'right') => {
    const nav = navRef.current;
    if (!nav) return;
    const scrollAmount = 200;
    nav.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth',
    });
  }, []);

  const links: { href: string; label: string; Icon: LucideIcon }[] = [
    { href: '/account', label: t('sidebar.account'), Icon: User },
    { href: '/account/profilo', label: t('sidebar.profile'), Icon: UserCircle },
    { href: '/account/indirizzi', label: t('sidebar.addresses'), Icon: MapPin },
    { href: '/account/messaggi', label: t('sidebar.messages'), Icon: MessageSquare },
    { href: '/account/credito', label: t('sidebar.credit'), Icon: Wallet },
    { href: '/account/coupon', label: t('sidebar.coupon'), Icon: Ticket },
    { href: '/account/transazioni', label: t('sidebar.transactions'), Icon: Receipt },
    { href: '/account/statistiche', label: t('sidebar.stats'), Icon: BarChart3 },
    { href: '/account/sicurezza', label: t('sidebar.security'), Icon: Shield },
    { href: '/account/sincronizzazione', label: t('sidebar.sync'), Icon: RefreshCw },
    { href: '/account/impostazioni', label: t('sidebar.settings'), Icon: Settings },
    { href: '/account/downloads', label: t('sidebar.downloads'), Icon: Download },
  ];

  function isActive(href: string) {
    return href === '/account' ? pathname === '/account' : pathname.startsWith(href);
  }

  return (
    <div className="sticky z-40 bg-[#F5F4F0] md:hidden" style={{ top: stickyTop }}>
      <div className="container-content relative">
        {/* Blur gradient sinistra */}
        <div
          className={cn(
            'pointer-events-none absolute left-0 top-0 z-30 h-full w-12 bg-gradient-to-r from-[#F5F4F0] to-transparent transition-opacity duration-300',
            canScrollLeft ? 'opacity-100' : 'opacity-0'
          )}
          aria-hidden
        />
        {/* Blur gradient destra */}
        <div
          className={cn(
            'pointer-events-none absolute right-0 top-0 z-30 h-full w-12 bg-gradient-to-l from-[#F5F4F0] to-transparent transition-opacity duration-300',
            canScrollRight ? 'opacity-100' : 'opacity-0'
          )}
          aria-hidden
        />

        {/* Freccia sinistra */}
        <button
          onClick={() => scroll('left')}
          className={cn(
            'absolute left-2 top-1/2 z-40 -translate-y-1/2 transition-all duration-300',
            canScrollLeft ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-2 pointer-events-none'
          )}
          aria-label="Scorri a sinistra"
          type="button"
        >
          <div className="flex h-7 w-7 items-center justify-center rounded-full border border-primary/45 bg-primary/60 shadow-lg ring-1 ring-white/20 backdrop-blur-2xl backdrop-saturate-150 transition-transform hover:scale-110 active:scale-95">
            <ChevronLeft className="h-4 w-4 text-white" aria-hidden />
          </div>
        </button>

        <nav
          ref={navRef}
          className="scrollbar-hide flex gap-2 overflow-x-auto border-b border-gray-200 px-4 pt-1.5 pb-2.5 pr-8"
          aria-label={t('account.menuAria')}
        >
          {ACCOUNT_LINKS.map(({ href, icon: Icon, key }) => {
            const active = isLinkActive(href, pathname);
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  'flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold uppercase tracking-wide transition-colors',
                  active
                    ? 'bg-primary text-white shadow-sm'
                    : 'border border-gray-300 bg-white text-gray-600 hover:border-gray-400 hover:text-gray-900'
                )}
              >
                <Icon className="h-4 w-4" aria-hidden />
                <span className={active ? 'inline' : 'hidden'}>{t(key as any)}</span>
              </Link>
            );
          })}
        </nav>

        {/* Freccia destra */}
        <button
          onClick={() => scroll('right')}
          className={cn(
            'absolute right-2 top-1/2 z-40 -translate-y-1/2 transition-all duration-300',
            canScrollRight ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-2 pointer-events-none'
          )}
          aria-label="Scorri a destra"
          type="button"
        >
          <div className="flex h-7 w-7 items-center justify-center rounded-full border border-primary/45 bg-primary/60 shadow-lg ring-1 ring-white/20 backdrop-blur-2xl backdrop-saturate-150 transition-transform hover:scale-110 active:scale-95">
            <ChevronRight className="h-4 w-4 text-white" aria-hidden />
          </div>
        </button>
      </div>
    </div>
  );
}

/** Shell account: layout responsive con sidebar desktop e nav mobile */
export function AccountShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const breadcrumbKey = getBreadcrumbKey(pathname);

  const breadcrumbSection = breadcrumbKey ? (
    <div className="mb-6">
      <AccountBreadcrumb current={breadcrumbKey} />
    </div>
  ) : null;

  return (
    <div className="container-content mx-auto flex min-h-[calc(100vh-80px)] flex-col gap-6 md:flex-row">
      <AccountSidebar />
      <AccountNavMobile />
      <main className="min-w-0 flex-1 py-4 md:py-8">
        {breadcrumbSection}
        {children}
      </main>
    </div>
  );
}
