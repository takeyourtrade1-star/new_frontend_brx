'use client';

import { useState, useEffect, useRef, useMemo, useLayoutEffect, useCallback } from 'react';
import Link from 'next/link';
import { LayoutGrid, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/lib/i18n/useTranslation';

export function ProdottiMenu() {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);
  const [headerBottom, setHeaderBottom] = useState(0);

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

  const measure = useCallback(() => {
    const header = btnRef.current?.closest('header');
    if (header) setHeaderBottom(header.getBoundingClientRect().bottom);
  }, []);

  useLayoutEffect(() => {
    measure();
    const header = btnRef.current?.closest('header');
    if (!header) return;
    const ro = new ResizeObserver(measure);
    ro.observe(header);
    return () => ro.disconnect();
  }, [measure]);

  const drawerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    measure();
    const onEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    const onClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      // Chiudi se il click è fuori dal drawer E fuori dal bottone trigger
      if (
        drawerRef.current &&
        !drawerRef.current.contains(target) &&
        btnRef.current &&
        !btnRef.current.contains(target)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener('keydown', onEscape);
    document.addEventListener('mousedown', onClickOutside);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onEscape);
      document.removeEventListener('mousedown', onClickOutside);
      document.body.style.overflow = '';
    };
  }, [open, measure]);

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex h-11 w-11 shrink-0 items-center justify-center gap-2 rounded-[50px] border border-stroke-grey bg-primary px-0 text-sm font-medium text-white transition-opacity hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40 focus-visible:ring-offset-2 focus-visible:ring-offset-[#1D3160] font-sans md:h-auto md:min-h-11 md:w-auto md:px-5 md:py-2"
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

      {/* Overlay — solo sotto l'header */}
      {open && (
        <div
          className="fixed inset-x-0 bottom-0 z-[9999] bg-black/40 transition-opacity"
          style={{ top: headerBottom }}
          aria-hidden
          onClick={() => setOpen(false)}
        />
      )}

      {/* Drawer — parte dal bordo inferiore dell'header */}
      <div
        ref={drawerRef}
        className={cn(
          'fixed left-0 bottom-0 z-[10000] flex w-[min(100%,340px)] max-w-[92vw] flex-col bg-white shadow-[8px_0_32px_rgba(0,0,0,0.12)] transition-transform duration-300 ease-out',
          open ? 'translate-x-0' : '-translate-x-full'
        )}
        style={{ top: headerBottom }}
        role="dialog"
        aria-modal="true"
        aria-label={t('products.menuAria')}
      >
        {/* Voci menu */}
        <nav className="flex-1 overflow-y-auto">
          {menuItems.map((item) => (
            <Link
              key={item.id}
              href={item.href}
              onClick={() => setOpen(false)}
              className="block border-b border-gray-100 px-5 py-3.5 text-[13px] font-semibold uppercase tracking-wide text-[#1D3160] transition-colors duration-200 hover:bg-primary/30 hover:backdrop-blur-2xl hover:backdrop-saturate-150 focus:bg-primary/30 focus:outline-none"
              role="menuitem"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </>
  );
}
