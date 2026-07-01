'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useRef, useState, useEffect, useCallback } from 'react';
import { Home, PlusCircle, List, Gavel, History, ChevronLeft, ChevronRight, LucideIcon } from 'lucide-react';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { useAuthStore } from '@/lib/stores/auth-store';
import { cn } from '@/lib/utils';

const HEADER_OFFSET = 80;

const NAV_ITEM_BASE =
  'flex h-9 sm:h-11 w-9 sm:w-auto shrink-0 items-center justify-center gap-1.5 rounded-full border-2 px-0 sm:px-4 text-[10px] font-semibold uppercase tracking-wide transition-all duration-300 active:scale-95 sm:text-xs';

const NAV_ITEM_INACTIVE =
  'border-gray-200 bg-white text-gray-600 hover:border-[#FF7300] hover:text-[#FF7300] hover:shadow-[0_0_10px_rgba(255,115,0,0.15)]';

const NAV_ITEM_ACTIVE =
  'border-[#FF7300] bg-[#FFF4EC] text-[#FF7300] shadow-[0_0_10px_rgba(255,115,0,0.2)]';

const NAV_CTA_CLASS =
  'flex h-9 sm:h-11 shrink-0 items-center justify-center gap-1.5 rounded-full border-2 border-[#FF7300] bg-[#FF7300] px-3 text-[10px] font-semibold uppercase tracking-wide text-white shadow-[0_0_10px_rgba(255,115,0,0.25)] transition-all duration-300 hover:bg-[#e66700] active:scale-95 sm:px-5 sm:text-xs';

/** Barra di navigazione aste: una sola pillola per stile (bordo grigio/bianco
 * inattivo, bordo+sfondo arancione attivo), icona sempre visibile, label da
 * `sm:` in su. Il CTA "Crea asta" resta l'unico elemento pieno arancione. */
export function AsteNav() {
  const { t } = useTranslation();
  const pathname = usePathname();
  const navRef = useRef<HTMLElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
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

  // Nascondi il menu quando si sta effettivamente creando un'asta
  const isCreatingAuction = pathname === '/aste/nuova' || pathname?.startsWith('/aste/nuova/');
  if (isCreatingAuction) return null;

  const otherLinks: { href: string; label: string; Icon: LucideIcon }[] = isAuthenticated
    ? [
        { href: '/aste/mie', label: t('auctions.navPublished'), Icon: List },
        { href: '/aste/partecipazioni', label: t('auctions.navParticipated'), Icon: Gavel },
        { href: '/aste/storico', label: t('auctions.navHistory'), Icon: History },
      ]
    : [];

  const createHref = isAuthenticated ? '/aste/nuova' : '/login?redirect=/aste/nuova';

  function isActive(href: string) {
    if (href === '/aste') {
      return pathname === '/aste';
    }
    return pathname?.startsWith(href) ?? false;
  }

  return (
    <div className="sticky z-40" style={{ top: stickyTop }}>
      <div className="container-content relative py-2 sm:py-3">
        {/* Blur gradient sinistra */}
        <div
          className={cn(
            'pointer-events-none absolute left-0 top-0 z-30 h-full w-16 bg-gradient-to-r from-white/70 via-white/40 to-transparent transition-opacity duration-300',
            canScrollLeft ? 'opacity-100' : 'opacity-0',
          )}
          aria-hidden
        />
        {/* Blur gradient destra */}
        <div
          className={cn(
            'pointer-events-none absolute right-0 top-0 z-30 h-full w-16 bg-gradient-to-l from-white/70 via-white/40 to-transparent transition-opacity duration-300',
            canScrollRight ? 'opacity-100' : 'opacity-0',
          )}
          aria-hidden
        />

        {/* Freccia sinistra */}
        <button
          onClick={() => scroll('left')}
          className={cn(
            'absolute left-2 top-1/2 z-40 -translate-y-1/2 transition-all duration-300 sm:left-3',
            canScrollLeft ? 'opacity-100 translate-x-0' : 'pointer-events-none opacity-0 -translate-x-2',
          )}
          aria-label="Scorri a sinistra"
          type="button"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-[#FF7300]/30 bg-white transition-all duration-300 hover:scale-110 hover:border-[#FF7300] hover:shadow-[0_0_10px_rgba(255,115,0,0.2)] active:scale-95 sm:h-10 sm:w-10">
            <ChevronLeft className="h-3.5 w-3.5 text-gray-700 sm:h-5 sm:w-5" aria-hidden />
          </div>
        </button>

        <nav
          ref={navRef}
          className="scrollbar-hide flex items-center justify-center gap-2 overflow-x-auto px-3 py-1.5 sm:gap-3"
          aria-label="Menu aste"
        >
          <Link
            href="/aste"
            aria-label={t('auctions.breadcrumbHome')}
            title={t('auctions.breadcrumbHome')}
            aria-current={isActive('/aste') ? 'page' : undefined}
            className={cn(NAV_ITEM_BASE, isActive('/aste') ? NAV_ITEM_ACTIVE : NAV_ITEM_INACTIVE)}
          >
            <Home className="h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4" aria-hidden />
            <span className="hidden sm:inline whitespace-nowrap">{t('auctions.breadcrumbHome')}</span>
          </Link>

          <Link
            href={createHref}
            aria-label={t('auctions.createAuction')}
            title={t('auctions.createAuction')}
            className={NAV_CTA_CLASS}
          >
            <PlusCircle className="h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4" aria-hidden />
            <span className="whitespace-nowrap">{t('auctions.createAuction')}</span>
          </Link>

          {otherLinks.map(({ href, label, Icon }) => {
            const active = isActive(href);
            return (
              <Link
                key={href}
                href={href}
                aria-label={label}
                title={label}
                aria-current={active ? 'page' : undefined}
                className={cn(NAV_ITEM_BASE, active ? NAV_ITEM_ACTIVE : NAV_ITEM_INACTIVE)}
              >
                <Icon className="h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4" aria-hidden />
                <span className="hidden sm:inline whitespace-nowrap">{label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Freccia destra */}
        <button
          onClick={() => scroll('right')}
          className={cn(
            'absolute right-2 top-1/2 z-40 -translate-y-1/2 transition-all duration-300 sm:right-3',
            canScrollRight ? 'opacity-100 translate-x-0' : 'pointer-events-none opacity-0 translate-x-2',
          )}
          aria-label="Scorri a destra"
          type="button"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-[#FF7300]/30 bg-white transition-all duration-300 hover:scale-110 hover:border-[#FF7300] hover:shadow-[0_0_10px_rgba(255,115,0,0.2)] active:scale-95 sm:h-10 sm:w-10">
            <ChevronRight className="h-3.5 w-3.5 text-gray-700 sm:h-5 sm:w-5" aria-hidden />
          </div>
        </button>
      </div>
    </div>
  );
}
