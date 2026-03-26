'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import Link from 'next/link';
import { LayoutGrid, X } from 'lucide-react';
import { useTranslation } from '@/lib/i18n/useTranslation';

const ORANGE_GLASS_MENU_CLASS =
  'absolute left-0 top-full z-[110] mt-0 w-[calc(100vw-1rem)] max-w-[280px] overflow-visible rounded-2xl border border-primary/45 bg-primary/30 py-2 text-white backdrop-blur-2xl backdrop-saturate-150 shadow-2xl ring-1 ring-white/20 animate-in fade-in-0 duration-200 md:w-auto md:min-w-[240px] md:origin-left';
const ORANGE_GLASS_DIVIDER_CLASS = 'border-b border-white/35 last:border-b-0';

export function ProdottiMenu({ isSquared = false }: { isSquared?: boolean }) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  const menuItems = useMemo(
    () =>
      [
        { id: 'singles' as const, label: t('products.singles'), href: '/products/singles' },
        { id: 'boosters' as const, label: t('products.boosters'), href: '/products/boosters' },
        { id: 'booster-box' as const, label: t('products.boosterBoxes'), href: '/products/booster-boxes' },
        { id: 'set-lotti' as const, label: t('products.setLots'), href: '/products/set-lotti-collezioni' },
        { id: 'sigillati' as const, label: t('products.sealed'), href: '/products/sigillati' },
        { id: 'accessori' as const, label: t('products.accessories'), href: '/products/accessori' },
        { id: 'boutique' as const, label: t('products.boutique'), href: '/products/boutique' },
      ],
    [t]
  );

  useEffect(() => {
    if (!open) return;
    const onClickOutside = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('click', onClickOutside);
    return () => document.removeEventListener('click', onClickOutside);
  }, [open]);

  return (
    <div className="relative shrink-0" ref={panelRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`flex h-11 w-11 shrink-0 items-center justify-center gap-2 border border-stroke-grey bg-primary px-0 text-sm font-medium text-white transition-opacity hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40 focus-visible:ring-offset-2 focus-visible:ring-offset-[#1D3160] font-sans md:h-auto md:min-h-11 md:w-auto md:px-5 md:py-2 ${
          isSquared ? 'rounded-none' : 'rounded-[50px]'
        }`}
        aria-expanded={open}
        aria-haspopup="true"
        aria-label={t('products.menuAria')}
      >
        <span className="relative flex h-4 w-4 items-center justify-center md:h-4 md:w-4" aria-hidden>
          {open ? (
            <X className="h-4 w-4 text-white" strokeWidth={2} />
          ) : (
            <LayoutGrid className="h-4 w-4 text-white" strokeWidth={2} />
          )}
        </span>
        <span className="hidden md:inline">{t('products.button')}</span>
      </button>

      {open && (
        <div
          className={ORANGE_GLASS_MENU_CLASS}
          role="menu"
        >
          <nav>
            {menuItems.map((item) => (
              <div key={item.id} className={ORANGE_GLASS_DIVIDER_CLASS}>
                <Link
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className="block rounded-lg px-4 py-3 text-left text-sm font-semibold uppercase tracking-wide text-white/95 font-sans transition-colors duration-200 hover:bg-white/10 focus:bg-white/10 focus:outline-none"
                  role="menuitem"
                >
                  {item.label}
                </Link>
              </div>
            ))}
          </nav>
        </div>
      )}
    </div>
  );
}
