'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Menu, X, ChevronDown, LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTheme } from '@/lib/theme-context';
import { useAuthStore } from '@/lib/stores/auth-store';
import { useLogout } from '@/lib/hooks/use-auth';

const MENU_BG = '#ff6b00';
const SEPARATOR = 'rgba(255,255,255,0.25)';
const FLAG_BASE = 'https://flagcdn.com';

/** Stesse lingue usate in registrati/account-form */
const LINGUE = [
  { id: 'it' as const, label: 'ITALIANO', countryCode: 'it' },
  { id: 'ja' as const, label: 'GIAPPONESE', countryCode: 'jp' },
  { id: 'en' as const, label: 'INGLESE', countryCode: 'gb' },
  { id: 'es' as const, label: 'SPAGNOLO', countryCode: 'es' },
  { id: 'de' as const, label: 'TEDESCO', countryCode: 'de' },
  { id: 'fr' as const, label: 'FRANCESE', countryCode: 'fr' },
] as const;

const menuItems = [
  { label: 'Ricerca utente', href: '/search' },
  { label: 'Ricerca avanzate singole', href: '/search?advanced=1' },
  { label: 'Norme legali', href: '/legal/norme' },
  { label: 'Condizioni legali', href: '/legal/condizioni' },
] as const;

const AUTH_ITEMS = [
  { label: 'Accedi', href: '/login' },
  { label: 'Registrati', href: '/registrati' },
  { label: 'Recupera credenziali', href: '/recupera-credenziali' },
] as const;

export function HamburgerMenu() {
  const [open, setOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const [linguaId, setLinguaId] = useState<(typeof LINGUE)[number]['id']>('it');
  const [linguaDropdownOpen, setLinguaDropdownOpen] = useState(false);
  const linguaDropdownRef = useRef<HTMLDivElement>(null);
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const logoutMutation = useLogout();

  const currentLingua = LINGUE.find((l) => l.id === linguaId) ?? LINGUE[0];
  const isDark = theme === 'dark';

  const handleLogout = async () => {
    try {
      await logoutMutation.mutateAsync();
      setOpen(false);
    } catch (error) {
      console.error('Errore durante il logout:', error);
    }
  };

  useEffect(() => {
    if (!linguaDropdownOpen) return;
    const onClickOutside = (e: MouseEvent) => {
      if (linguaDropdownRef.current && !linguaDropdownRef.current.contains(e.target as Node)) {
        setLinguaDropdownOpen(false);
      }
    };
    document.addEventListener('click', onClickOutside);
    return () => document.removeEventListener('click', onClickOutside);
  }, [linguaDropdownOpen]);

  useEffect(() => {
    if (!open) return;
    const onEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', onEscape);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onEscape);
      document.body.style.overflow = '';
    };
  }, [open]);

  return (
    <>
      {/* Trigger: solo le tre linee (hamburger) - z-index alto per essere sopra tutto */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="relative z-[10001] -mr-2 flex h-12 w-12 shrink-0 items-center justify-center text-white transition-opacity hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[#1D3160]"
        aria-label="Apri menu"
        aria-expanded={open}
      >
        <Menu className="h-8 w-8" strokeWidth={2.5} aria-hidden />
      </button>

      {/* Overlay (sopra tutto, incluso barra di ricerca) */}
      {open && (
        <div
          className="fixed inset-0 z-[9999] bg-black/50 transition-opacity"
          aria-hidden
          onClick={() => setOpen(false)}
        />
      )}

      {/* Pannello laterale arancione (slide da destra) - sopra tutto */}
      <div
        className={cn(
          'fixed right-0 top-0 z-[10000] flex h-full w-[280px] max-w-[85vw] flex-col rounded-tl-2xl shadow-xl transition-transform duration-300 ease-out',
          open ? 'translate-x-0' : 'translate-x-full'
        )}
        style={{ backgroundColor: MENU_BG }}
        role="dialog"
        aria-modal="true"
        aria-label="Menu"
      >
        {/* Header con pulsante chiudi */}
        <div className="flex items-center justify-end border-b px-4 py-3" style={{ borderColor: SEPARATOR }}>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="rounded p-2 text-white transition-opacity hover:opacity-80 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
            aria-label="Chiudi menu"
          >
            <X className="h-7 w-7" />
          </button>
        </div>

        <nav className="flex flex-1 flex-col overflow-y-auto py-2">
          {/* Mostra AUTH_ITEMS solo se NON loggato */}
          {!isAuthenticated &&
            AUTH_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className="block px-5 py-4 text-sm font-semibold uppercase tracking-wide text-white transition-opacity hover:opacity-90"
                style={{ borderBottom: `1px solid ${SEPARATOR}` }}
              >
                {item.label}
              </Link>
            ))}
          
          {/* Mostra Logout solo se loggato */}
          {isAuthenticated && (
            <button
              type="button"
              onClick={handleLogout}
              disabled={logoutMutation.isPending}
              className="flex items-center gap-3 px-5 py-4 text-left text-sm font-semibold uppercase tracking-wide text-white transition-opacity hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ borderBottom: `1px solid ${SEPARATOR}` }}
            >
              <LogOut className="h-5 w-5 shrink-0" />
              <span>{logoutMutation.isPending ? 'Logout in corso...' : 'Logout'}</span>
            </button>
          )}
          {menuItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className="block px-5 py-4 text-sm font-semibold uppercase tracking-wide text-white transition-opacity hover:opacity-90"
              style={{ borderBottom: `1px solid ${SEPARATOR}` }}
            >
              {item.label}
            </Link>
          ))}

          {/* Dark mode con toggle */}
          <div
            className="flex items-center justify-between px-5 py-4"
            style={{ borderBottom: `1px solid ${SEPARATOR}` }}
          >
            <span className="text-sm font-semibold uppercase tracking-wide text-white">
              Dark mode
            </span>
            <button
              type="button"
              role="switch"
              aria-checked={isDark}
              onClick={toggleTheme}
              className={cn(
                'relative h-6 w-11 shrink-0 rounded-full transition-colors duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[#ff6b00]',
                isDark ? 'bg-blue-600' : 'bg-gray-400'
              )}
            >
              <span
                className={cn(
                  'absolute top-1/2 h-4 w-4 -translate-y-1/2 rounded-full bg-white shadow transition-[left] duration-200',
                  isDark ? 'left-6' : 'left-1'
                )}
              />
            </button>
          </div>

          {/* Aiuto */}
          <Link
            href="/aiuto"
            onClick={() => setOpen(false)}
            className="block px-5 py-4 text-sm font-semibold uppercase tracking-wide text-white transition-opacity hover:opacity-90"
            style={{ borderBottom: `1px solid ${SEPARATOR}` }}
          >
            Aiuto
          </Link>

          {/* Lingua: dropdown con le stesse opzioni di registrati */}
          <div
            ref={linguaDropdownRef}
            className="relative"
            style={{ borderBottom: `1px solid ${SEPARATOR}` }}
          >
            <button
              type="button"
              onClick={() => setLinguaDropdownOpen((v) => !v)}
              className="flex w-full items-center justify-between px-5 py-4 text-left text-sm font-semibold uppercase tracking-wide text-white transition-opacity hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:ring-inset"
              aria-expanded={linguaDropdownOpen}
              aria-haspopup="listbox"
              aria-label="Seleziona lingua"
            >
              <span>{currentLingua.label}</span>
              <div className="flex items-center gap-2">
                <Image
                  src={`${FLAG_BASE}/w40/${currentLingua.countryCode}.png`}
                  alt=""
                  width={24}
                  height={16}
                  className="h-4 w-6 rounded object-cover"
                  unoptimized
                />
                <ChevronDown
                  className={cn('h-5 w-5 text-white transition-transform', linguaDropdownOpen && 'rotate-180')}
                  aria-hidden
                />
              </div>
            </button>
            {linguaDropdownOpen && (
              <ul
                className="absolute left-0 right-0 top-full z-10 max-h-48 overflow-y-auto py-1"
                style={{ backgroundColor: MENU_BG, boxShadow: '0 4px 12px rgba(0,0,0,0.2)' }}
                role="listbox"
              >
                {LINGUE.map((lang) => (
                  <li key={lang.id} role="option" aria-selected={linguaId === lang.id}>
                    <button
                      type="button"
                      onClick={() => {
                        setLinguaId(lang.id);
                        setLinguaDropdownOpen(false);
                      }}
                      className={cn(
                        'flex w-full items-center gap-3 px-5 py-3 text-left text-sm font-semibold uppercase tracking-wide text-white transition-opacity hover:opacity-90',
                        linguaId === lang.id && 'opacity-100'
                      )}
                    >
                      <Image
                        src={`${FLAG_BASE}/w40/${lang.countryCode}.png`}
                        alt=""
                        width={24}
                        height={16}
                        className="h-4 w-6 shrink-0 rounded object-cover"
                        unoptimized
                      />
                      {lang.label}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </nav>
      </div>
    </>
  );
}
