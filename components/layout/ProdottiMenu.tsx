'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { LayoutGrid, X } from 'lucide-react';

const ORANGE = '#FF7300';
const BORDER = '#878787';
const SEPARATOR = 'rgba(0,0,0,0.15)';

const MENU_ITEMS = [
  { id: 'singles', label: 'SINGLES', href: '/products/mowgli-cucciolo-duomo' },
  { id: 'boosters', label: 'BOOSTERS', href: '/products?category=boosters' },
  { id: 'booster-box', label: 'BOOSTER BOXES', href: '/products?category=booster-box' },
  { id: 'set-lotti', label: 'SET, LOTTI E COLLEZIONI', href: '/products?category=set-lotti' },
  { id: 'sigillati', label: 'PRODOTTI SIGILLATI', href: '/products?category=sigillati' },
  { id: 'accessori', label: 'ACCESSORI', href: '/products?category=accessori' },
  { id: 'boutique', label: 'EBARTEX BOUTIQUE', href: '/products' },
] as const;

export function ProdottiMenu() {
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

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
      {/* Pulsante arancione: icona 2x2 + cerchio + "Prodotti" */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-none border px-5 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40 focus-visible:ring-offset-2 focus-visible:ring-offset-[#1D3160] font-sans"
        style={{ backgroundColor: ORANGE, borderColor: BORDER }}
        aria-expanded={open}
        aria-haspopup="true"
        aria-label="Menu Prodotti"
      >
        <span className="relative flex h-4 w-4 items-center justify-center" aria-hidden>
          {open ? (
            <X className="h-4 w-4 text-white" strokeWidth={2} />
          ) : (
            <LayoutGrid className="h-4 w-4 text-white" strokeWidth={2} />
          )}
        </span>
        Prodotti
      </button>

      {/* Pannello bianco, squadrato, attaccato al bottone (nessuna ripetizione "Prodotti") */}
      {open && (
        <div
          className="absolute left-0 top-full z-[110] mt-0 min-w-[240px] overflow-visible rounded-none border border-gray-200 bg-white py-2 shadow-lg"
          role="menu"
        >
          <nav>
            {MENU_ITEMS.map((item, i) => (
              <div
                key={item.id}
                className="border-b border-gray-100 last:border-b-0"
              >
                <Link
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className="prodotti-menu-item block px-4 py-3 text-left text-sm font-semibold uppercase tracking-wide text-gray-900 font-sans transition-colors duration-200 focus:outline-none"
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
