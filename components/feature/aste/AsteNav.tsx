'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useRef, useState, useEffect, useCallback } from 'react';
import { PlusCircle, List, Users, ChevronLeft, ChevronRight, LucideIcon } from 'lucide-react';
import { AuctionGavelIcon } from '@/components/ui/AuctionGavelIcon';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { useAuthStore } from '@/lib/stores/auth-store';
import { cn } from '@/lib/utils';

const HEADER_OFFSET = 80;

const HOME_NAV_BUTTON_CLASS =
  'flex h-9 w-9 sm:h-12 sm:w-12 shrink-0 items-center justify-center rounded-full border-2 border-gray-200 bg-white text-gray-600 transition-all duration-300 hover:border-[#FF7300] hover:text-[#FF7300] hover:shadow-[0_0_10px_rgba(255,115,0,0.15)] active:scale-95';

const HOME_NAV_BUTTON_COMPACT_CLASS =
  'flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-white/70 bg-white/75 text-gray-600 shadow-sm backdrop-blur-md transition-all duration-300 hover:border-[#FF7300]/50 hover:text-[#FF7300] active:scale-95';

type AsteNavProps = {
  variant?: 'default' | 'compact';
};

/** Glass bubble navigation - each item in its own floating bubble */
export function AsteNav({ variant = 'default' }: AsteNavProps) {
  const compact = variant === 'compact';
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

  if (!isAuthenticated) {
    // Non loggato: mostra solo pulsante "Crea asta" in glass bubble arancione chiaro
    return (
      <div className="sticky z-40" style={{ top: stickyTop }}>
        <div className={cn('container-content relative', compact ? 'py-0.5' : 'py-2 sm:py-3')}>
          <nav
            ref={navRef}
            className={cn(
              'scrollbar-hide flex justify-center overflow-x-auto px-3',
              compact ? 'gap-1.5 py-0' : 'gap-2 sm:gap-3 py-1.5',
            )}
            aria-label="Menu aste"
          >
            <Link
              href="/aste"
              aria-label={t('auctions.breadcrumbHome')}
              className={cn(compact ? HOME_NAV_BUTTON_COMPACT_CLASS : HOME_NAV_BUTTON_CLASS, 'group')}
            >
              <AuctionGavelIcon
                className={compact ? 'h-3 w-3' : 'h-3.5 w-3.5 sm:h-4 sm:w-4'}
                animated
              />
            </Link>
            <Link
              href="/login?redirect=/aste/nuova"
              title={t('auctions.createAuction')}
              className={cn(
                'group flex shrink-0 items-center justify-center rounded-full font-semibold uppercase tracking-wide text-[#FF7300] transition-all duration-300 active:scale-95',
                compact
                  ? 'h-7 w-7 border border-[#FF7300]/35 bg-[#FFF4EC]/90 backdrop-blur-md hover:border-[#FF7300] hover:shadow-[0_0_8px_rgba(255,115,0,0.2)]'
                  : 'h-9 sm:h-12 gap-1.5 sm:gap-2 border-2 border-[#FF7300] bg-[#FFF4EC] px-3 sm:px-4 text-[10px] sm:text-xs hover:bg-[#FFF0E0] hover:shadow-[0_0_12px_rgba(255,115,0,0.3)]',
              )}
            >
              <PlusCircle
                className={cn(
                  'shrink-0 transition-transform group-hover:rotate-90',
                  compact ? 'h-3 w-3' : 'h-3.5 w-3.5 sm:h-4 sm:w-4',
                )}
                aria-hidden
              />
              {!compact && <span className="whitespace-nowrap">{t('auctions.createAuction')}</span>}
            </Link>
          </nav>
        </div>
      </div>
    );
  }

  const links: {
    href: string;
    label: string;
    Icon?: LucideIcon;
    auctionIcon?: boolean;
    isPrimary?: boolean;
    iconOnly?: boolean;
  }[] = [
    { href: '/aste', label: t('auctions.breadcrumbHome'), auctionIcon: true, iconOnly: true },
    { href: '/aste/nuova', label: t('auctions.createAuction'), Icon: PlusCircle, isPrimary: true },
    { href: '/aste/mie', label: t('auctions.navMyListings'), Icon: List },
    { href: '/aste/partecipazioni', label: t('auctions.navParticipations'), Icon: Users },
  ];

  function isActive(href: string) {
    if (href === '/aste') {
      return pathname === '/aste';
    }
    return pathname?.startsWith(href) ?? false;
  }

  return (
    <div className="sticky z-40" style={{ top: stickyTop }}>
      <div className={cn('container-content relative', compact ? 'py-0.5' : 'py-2.5 sm:py-3.5')}>
        {/* Blur gradient sinistra */}
        <div
          className={cn(
            'pointer-events-none absolute left-0 top-0 z-30 h-full bg-gradient-to-r from-white/70 via-white/40 to-transparent transition-opacity duration-300',
            compact ? 'w-10' : 'w-16',
            canScrollLeft ? 'opacity-100' : 'opacity-0',
          )}
          aria-hidden
        />
        {/* Blur gradient destra */}
        <div
          className={cn(
            'pointer-events-none absolute right-0 top-0 z-30 h-full bg-gradient-to-l from-white/70 via-white/40 to-transparent transition-opacity duration-300',
            compact ? 'w-10' : 'w-16',
            canScrollRight ? 'opacity-100' : 'opacity-0',
          )}
          aria-hidden
        />

        {/* Freccia sinistra - glass bubble */}
        <button
          onClick={() => scroll('left')}
          className={cn(
            'absolute top-1/2 z-40 -translate-y-1/2 transition-all duration-300',
            compact ? 'left-1' : 'left-2 sm:left-3',
            canScrollLeft ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-2 pointer-events-none',
          )}
          aria-label="Scorri a sinistra"
          type="button"
        >
          <div
            className={cn(
              'flex items-center justify-center rounded-full border-2 border-[#FF7300]/30 bg-white transition-all duration-300 hover:scale-110 hover:border-[#FF7300] hover:shadow-[0_0_10px_rgba(255,115,0,0.2)] active:scale-95',
              compact ? 'h-6 w-6' : 'h-8 w-8 sm:h-10 sm:w-10',
            )}
          >
            <ChevronLeft className={cn('text-gray-700', compact ? 'h-3 w-3' : 'h-3.5 w-3.5 sm:h-5 sm:w-5')} aria-hidden />
          </div>
        </button>

        {/* Glass bubbles nav */}
        <nav
          ref={navRef}
          className={cn(
            'scrollbar-hide flex items-center justify-center overflow-x-auto px-3',
            compact ? 'gap-1.5 py-0' : 'gap-2 sm:gap-3 py-1.5',
          )}
          aria-label="Menu aste"
        >
          {links.map(({ href, label, Icon, auctionIcon, isPrimary, iconOnly }) => {
            const active = isActive(href);
            const showIconOnly = iconOnly || compact;
            return (
              <Link
                key={href}
                href={href}
                aria-label={showIconOnly ? label : undefined}
                title={showIconOnly ? label : undefined}
                aria-current={showIconOnly && active ? 'page' : undefined}
                className={cn(
                  'group relative flex shrink-0 items-center rounded-full font-semibold uppercase tracking-wide transition-all duration-300',
                  showIconOnly
                    ? compact
                      ? cn(
                          'h-7 w-7 justify-center border backdrop-blur-md',
                          active
                            ? 'border-[#FF7300]/60 bg-[#FFF4EC]/95 text-[#FF7300] shadow-[0_0_8px_rgba(255,115,0,0.18)]'
                            : isPrimary
                              ? 'border-[#FF7300]/30 bg-[#FFF4EC]/85 text-[#FF7300]/90 hover:border-[#FF7300]/50'
                              : 'border-white/70 bg-white/75 text-gray-600 hover:border-[#FF7300]/40 hover:text-[#FF7300]',
                        )
                      : HOME_NAV_BUTTON_CLASS
                    : cn(
                        'h-9 sm:h-12 justify-center sm:justify-start px-0 sm:px-4 w-9 sm:w-auto text-[10px] sm:text-xs',
                        active
                          ? 'border-2 border-[#FF7300] bg-[#FFF4EC] text-[#FF7300] shadow-[0_0_10px_rgba(255,115,0,0.2)] scale-105'
                          : isPrimary
                            ? 'border-2 border-[#FF7300]/30 bg-[#FFF4EC] text-[#FF7300]/90 hover:border-[#FF7300] hover:text-[#FF7300] hover:shadow-[0_0_12px_rgba(255,115,0,0.2)] active:scale-95'
                            : 'border-2 border-gray-200 bg-white text-gray-600 hover:border-[#FF7300] hover:text-[#FF7300] hover:shadow-[0_0_10px_rgba(255,115,0,0.15)] active:scale-95',
                      ),
                )}
              >
                {auctionIcon ? (
                  <AuctionGavelIcon
                    className={compact ? 'h-3 w-3' : 'h-3.5 w-3.5 sm:h-4 sm:w-4'}
                    animated
                  />
                ) : Icon ? (
                  <Icon
                    className={cn(
                      'shrink-0 transition-transform duration-300',
                      compact ? 'h-3 w-3' : 'h-3.5 w-3.5 sm:h-4 sm:w-4',
                      isPrimary && 'group-hover:rotate-90',
                    )}
                    aria-hidden
                  />
                ) : null}
                {!showIconOnly && <span className="hidden sm:inline whitespace-nowrap sm:ml-1.5">{label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Freccia destra - glass bubble */}
        <button
          onClick={() => scroll('right')}
          className={cn(
            'absolute top-1/2 z-40 -translate-y-1/2 transition-all duration-300',
            compact ? 'right-1' : 'right-2 sm:right-3',
            canScrollRight ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-2 pointer-events-none',
          )}
          aria-label="Scorri a destra"
          type="button"
        >
          <div
            className={cn(
              'flex items-center justify-center rounded-full border-2 border-[#FF7300]/30 bg-white transition-all duration-300 hover:scale-110 hover:border-[#FF7300] hover:shadow-[0_0_10px_rgba(255,115,0,0.2)] active:scale-95',
              compact ? 'h-6 w-6' : 'h-8 w-8 sm:h-10 sm:w-10',
            )}
          >
            <ChevronRight className={cn('text-gray-700', compact ? 'h-3 w-3' : 'h-3.5 w-3.5 sm:h-5 sm:w-5')} aria-hidden />
          </div>
        </button>
      </div>
    </div>
  );
}
