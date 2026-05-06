'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useRef, useState, useEffect, useCallback } from 'react';
import { PlusCircle, ArrowLeftRight, ChevronLeft, ChevronRight, LucideIcon } from 'lucide-react';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { useAuthStore } from '@/lib/stores/auth-store';
import { cn } from '@/lib/utils';

const HEADER_OFFSET = 80;

/** Glass bubble navigation - each item in its own floating bubble */
export function ScambiNav() {
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

  // Nascondi il menu quando si sta effettivamente creando uno scambio
  const isCreatingExchange = pathname === '/scambi/nuova' || pathname?.startsWith('/scambi/nuova/');
  if (isCreatingExchange) return null;

  if (!isAuthenticated) {
    // Non loggato: mostra solo pulsante "Nuovo scambio" in glass bubble arancione chiaro
    return (
      <div className="sticky z-40" style={{ top: stickyTop }}>
        <div className="container-content relative py-3 sm:py-4">
          <nav
            ref={navRef}
            className="scrollbar-hide flex justify-center gap-2 sm:gap-3 overflow-x-auto px-4"
            aria-label="Menu scambi"
          >
            <Link
              href="/login?redirect=/scambi/nuova"
              className="group flex h-9 sm:h-12 shrink-0 items-center gap-1.5 sm:gap-2 rounded-full border-2 border-[#FF7300] bg-[#FFF4EC] px-3 sm:px-4 text-[10px] sm:text-xs font-semibold uppercase tracking-wide text-[#FF7300] transition-all duration-300 hover:bg-[#FFF0E0] hover:shadow-[0_0_12px_rgba(255,115,0,0.3)] active:scale-95"
            >
              <PlusCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0 transition-transform group-hover:rotate-90" aria-hidden />
              <span className="whitespace-nowrap">Inventario Scambiabile</span>
            </Link>
          </nav>
        </div>
      </div>
    );
  }

  const links: { href: string; label: string; Icon: LucideIcon; isPrimary?: boolean }[] = [
    { href: '/scambi/nuova', label: 'Inventario Scambiabile', Icon: PlusCircle, isPrimary: true },
    { href: '/scambi/mie', label: 'Scambi in corso', Icon: ArrowLeftRight },
  ];

  function isActive(href: string) {
    return pathname?.startsWith(href) ?? false;
  }

  return (
    <div className="sticky z-40" style={{ top: stickyTop }}>
      <div className="container-content relative py-4">
        {/* Blur gradient sinistra */}
        <div
          className={cn(
            'pointer-events-none absolute left-0 top-0 z-30 h-full w-16 bg-gradient-to-r from-white/70 via-white/40 to-transparent transition-opacity duration-300',
            canScrollLeft ? 'opacity-100' : 'opacity-0'
          )}
          aria-hidden
        />
        {/* Blur gradient destra */}
        <div
          className={cn(
            'pointer-events-none absolute right-0 top-0 z-30 h-full w-16 bg-gradient-to-l from-white/70 via-white/40 to-transparent transition-opacity duration-300',
            canScrollRight ? 'opacity-100' : 'opacity-0'
          )}
          aria-hidden
        />

        {/* Freccia sinistra - glass bubble */}
        <button
          onClick={() => scroll('left')}
          className={cn(
            'absolute left-2 sm:left-3 top-1/2 z-40 -translate-y-1/2 transition-all duration-300',
            canScrollLeft ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-2 pointer-events-none'
          )}
          aria-label="Scorri a sinistra"
          type="button"
        >
          <div className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-full border-2 border-[#FF7300]/30 bg-white transition-all duration-300 hover:scale-110 hover:border-[#FF7300] hover:shadow-[0_0_10px_rgba(255,115,0,0.2)] active:scale-95">
            <ChevronLeft className="h-3.5 w-3.5 sm:h-5 sm:w-5 text-gray-700" aria-hidden />
          </div>
        </button>

        {/* Glass bubbles nav */}
        <nav
          ref={navRef}
          className="scrollbar-hide flex items-center justify-center gap-2 sm:gap-3 overflow-x-auto px-4"
          aria-label="Menu scambi"
        >
          {links.map(({ href, label, Icon, isPrimary }) => {
            const active = isActive(href);
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  'group relative flex h-9 sm:h-12 shrink-0 items-center justify-center sm:justify-start rounded-full px-0 sm:px-4 text-[10px] sm:text-xs font-semibold uppercase tracking-wide transition-all duration-300',
                  active
                    ? 'w-9 sm:w-auto border-2 border-[#FF7300] bg-[#FFF4EC] text-[#FF7300] shadow-[0_0_10px_rgba(255,115,0,0.2)] scale-105'
                    : isPrimary
                      ? 'w-9 sm:w-auto border-2 border-[#FF7300]/30 bg-[#FFF4EC] text-[#FF7300]/90 hover:border-[#FF7300] hover:text-[#FF7300] hover:shadow-[0_0_12px_rgba(255,115,0,0.2)] active:scale-95'
                      : 'w-9 sm:w-auto border-2 border-gray-200 bg-white text-gray-600 hover:border-[#FF7300] hover:text-[#FF7300] hover:shadow-[0_0_10px_rgba(255,115,0,0.15)] active:scale-95'
                )}
              >
                <Icon className={cn('h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0 transition-transform duration-300', isPrimary && 'group-hover:rotate-90')} aria-hidden />
                <span className="hidden sm:inline whitespace-nowrap sm:ml-1.5">{label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Freccia destra - glass bubble */}
        <button
          onClick={() => scroll('right')}
          className={cn(
            'absolute right-2 sm:right-3 top-1/2 z-40 -translate-y-1/2 transition-all duration-300',
            canScrollRight ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-2 pointer-events-none'
          )}
          aria-label="Scorri a destra"
          type="button"
        >
          <div className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-full border-2 border-[#FF7300]/30 bg-white transition-all duration-300 hover:scale-110 hover:border-[#FF7300] hover:shadow-[0_0_10px_rgba(255,115,0,0.2)] active:scale-95">
            <ChevronRight className="h-3.5 w-3.5 sm:h-5 sm:w-5 text-gray-700" aria-hidden />
          </div>
        </button>
      </div>
    </div>
  );
}
