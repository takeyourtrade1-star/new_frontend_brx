'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useRef, useState, useEffect, useCallback } from 'react';
import { PlusCircle, List, Users, Truck, ChevronLeft, ChevronRight, LucideIcon } from 'lucide-react';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { useAuthStore } from '@/lib/stores/auth-store';
import { cn } from '@/lib/utils';

const HEADER_OFFSET = 80; // Altezza approssimativa header in px

/** Navigazione aste orizzontale scrollabile: visibile su tutti i breakpoint e sticky */
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

  const isCreateAuction = (index: number) => index === 0;

  if (!isAuthenticated) {
    // Non loggato: mostra solo pulsante "Crea asta" che porta a login
    return (
      <div className="sticky z-40 bg-white" style={{ top: stickyTop }}>
        <div className="container-content relative">
          <nav
            ref={navRef}
            className="scrollbar-hide flex justify-center gap-2 overflow-x-auto border-b border-gray-200 px-4 py-3"
            aria-label="Menu aste"
          >
            <Link
              href="/login?redirect=/aste/nuova"
              className="flex shrink-0 items-center gap-1.5 rounded-full bg-primary px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-white shadow-md ring-1 ring-primary/20 transition-all hover:shadow-lg hover:scale-105 hover:ring-primary/40"
            >
              <PlusCircle className="h-4 w-4" aria-hidden />
              <span className="inline">{t('auctions.createAuction')}</span>
            </Link>
          </nav>
        </div>
      </div>
    );
  }

  const links: { href: string; label: string; Icon: LucideIcon }[] = [
    { href: '/aste/nuova', label: t('auctions.createAuction'), Icon: PlusCircle },
    { href: '/aste/mie', label: t('auctions.navMyListings'), Icon: List },
    { href: '/aste/partecipazioni', label: t('auctions.navParticipations'), Icon: Users },
    { href: '/aste/spedizioni', label: t('auctions.navShipping'), Icon: Truck },
  ];

  function isActive(href: string) {
    return pathname?.startsWith(href) ?? false;
  }

  return (
    <div className="sticky z-40 bg-white" style={{ top: stickyTop }}>
      <div className="container-content relative">
        {/* Blur gradient sinistra */}
        <div
          className={cn(
            'pointer-events-none absolute left-0 top-0 z-30 h-full w-12 bg-gradient-to-r from-white to-transparent transition-opacity duration-300',
            canScrollLeft ? 'opacity-100' : 'opacity-0'
          )}
          aria-hidden
        />
        {/* Blur gradient destra */}
        <div
          className={cn(
            'pointer-events-none absolute right-0 top-0 z-30 h-full w-12 bg-gradient-to-l from-white to-transparent transition-opacity duration-300',
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
          className="scrollbar-hide flex justify-center gap-2 overflow-x-auto border-b border-gray-200 px-4 py-3 pr-8 md:pr-12"
          aria-label="Menu aste"
        >
          {links.map(({ href, label, Icon }, index) => {
            const active = isActive(href);
            const isCreateAuction = index === 0;
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  'flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold uppercase tracking-wide transition-all',
                  isCreateAuction && active
                    ? 'bg-primary text-white shadow-lg ring-2 ring-primary/30 scale-105'
                    : isCreateAuction
                      ? 'bg-primary text-white shadow-md ring-1 ring-primary/20 hover:shadow-lg hover:scale-105 hover:ring-primary/40'
                      : active
                        ? 'bg-primary text-white shadow-sm'
                        : 'border border-gray-300 bg-white text-gray-600 hover:border-gray-400 hover:text-gray-900'
                )}
              >
                <Icon className="h-4 w-4" aria-hidden />
                <span className={cn(isCreateAuction ? 'inline' : 'hidden md:inline', active && 'inline')}>{label}</span>
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
