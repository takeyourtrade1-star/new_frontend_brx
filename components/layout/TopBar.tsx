'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { AlertCircle, Check, ChevronDown, Eye, EyeOff, LogIn, LogOut } from 'lucide-react';
import { HamburgerMenu } from './HamburgerMenu';
import { useCartStore } from '@/lib/stores/cart-store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/lib/stores/auth-store';
import { useLogin } from '@/lib/hooks/use-auth';
import { headerLoginSchema, type HeaderLoginValues } from '@/lib/validations/auth';
import { getCdnImageUrl } from '@/lib/config';
import { useGame, GAME_OPTIONS } from '@/lib/contexts/GameContext';
import type { GameSlug } from '@/lib/contexts/GameContext';

const GAME_HOME_PATH: Record<GameSlug, string> = {
  mtg: '/home/magic',
  pokemon: '/home/pokemon',
  op: '/home/one-piece',
};

const AUTH_INPUT_HEIGHT = 'h-9';
const AUTH_INPUT_WIDTH = 'w-36';
const inputBase =
  'rounded-full px-4 text-sm font-normal text-[#0F172A] placeholder:text-gray-500 focus:outline-none focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 border';

const FLASH_DURATION_MS = 4500;

export function TopBar() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const { selectedGame, setSelectedGame, gameDisplayName } = useGame();
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const [acquistiMenuOpen, setAcquistiMenuOpen] = useState(false);
  const [gamesMenuOpen, setGamesMenuOpen] = useState(false);
  const accountMenuRef = useRef<HTMLDivElement>(null);
  const acquistiMenuRef = useRef<HTMLDivElement>(null);
  const gamesMenuRef = useRef<HTMLDivElement>(null);
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const flashMessage = useAuthStore((s) => s.flashMessage);
  const setFlashMessage = useAuthStore((s) => s.setFlashMessage);
  const logout = useAuthStore((s) => s.logout);
  const loginMutation = useLogin();
  const cartCount = useCartStore((s) => s.getItemCount());
  const cartTotal = useCartStore((s) => s.getTotal());
  const [loginError, setLoginError] = useState<string | null>(null);
  const lastFlashRef = useRef<string | null>(null);
  const [toastExiting, setToastExiting] = useState(false);
  const lastErrorRef = useRef<string | null>(null);
  const [errorExiting, setErrorExiting] = useState(false);

  const formatEuro = (n: number) =>
    new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(n);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<HeaderLoginValues>({
    resolver: zodResolver(headerLoginSchema),
    defaultValues: { username: '', password: '' },
  });

  const onHeaderLogin = async (data: HeaderLoginValues) => {
    setLoginError(null);
    setFlashMessage(null); // Pulisci eventuali messaggi precedenti
    
    try {
      // L'API richiede email, ma l'utente può inserire username o email
      // Se contiene @, è un'email, altrimenti proviamo a usarlo come email
      const email = data.username.includes('@') 
        ? data.username 
        : data.username;
      
      const result = await loginMutation.mutateAsync({
        email: email,
        password: data.password,
      });

      // Se MFA è richiesto, mostra messaggio e reindirizza alla pagina di login completa
      if (result.mfaRequired) {
        setLoginError('Autenticazione a due fattori richiesta. Reindirizzamento...');
        setTimeout(() => {
          router.push('/login');
        }, 1500);
        return;
      }

      // Login completato con successo
      // Il flash message viene impostato dallo store, ma assicuriamoci che appaia
      setFlashMessage('Login avvenuto con successo');
      reset();
      
      // L'header si aggiornerà automaticamente perché isAuthenticated e user cambiano nello store
    } catch (err: any) {
      // Pulisci il flash message in caso di errore
      setFlashMessage(null);
      
      const errorMessage =
        err?.response?.data?.detail?.[0]?.msg ||
        err?.response?.data?.message ||
        err?.message ||
        'Errore durante il login. Verifica email e password.';
      setLoginError(errorMessage);
    }
  };

  useEffect(() => {
    if (flashMessage) {
      lastFlashRef.current = flashMessage;
      setToastExiting(false);
    } else if (lastFlashRef.current != null) {
      setToastExiting(true);
    }
  }, [flashMessage]);

  useEffect(() => {
    if (!flashMessage) return;
    const t = setTimeout(() => setFlashMessage(null), FLASH_DURATION_MS);
    return () => clearTimeout(t);
  }, [flashMessage, setFlashMessage]);

  useEffect(() => {
    if (!toastExiting) return;
    const t = setTimeout(() => {
      setToastExiting(false);
      lastFlashRef.current = null;
    }, 320);
    return () => clearTimeout(t);
  }, [toastExiting]);

  useEffect(() => {
    if (loginError) {
      lastErrorRef.current = loginError;
      setErrorExiting(false);
    } else if (lastErrorRef.current != null) {
      setErrorExiting(true);
    }
  }, [loginError]);

  useEffect(() => {
    if (!errorExiting) return;
    const t = setTimeout(() => {
      setErrorExiting(false);
      lastErrorRef.current = null;
    }, 320);
    return () => clearTimeout(t);
  }, [errorExiting]);

  useEffect(() => {
    if (!loginError) return;
    // Auto-rimuovi il messaggio di errore dopo 5 secondi
    const t = setTimeout(() => {
      setLoginError(null);
    }, 5000);
    return () => clearTimeout(t);
  }, [loginError]);

  useEffect(() => {
    if (!accountMenuOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (accountMenuRef.current && !accountMenuRef.current.contains(e.target as Node)) {
        setAccountMenuOpen(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [accountMenuOpen]);

  useEffect(() => {
    if (!acquistiMenuOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (acquistiMenuRef.current && !acquistiMenuRef.current.contains(e.target as Node)) {
        setAcquistiMenuOpen(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [acquistiMenuOpen]);

  useEffect(() => {
    if (!gamesMenuOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (gamesMenuRef.current && !gamesMenuRef.current.contains(e.target as Node)) {
        setGamesMenuOpen(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [gamesMenuOpen]);

  /** Mostra nome utente: se c'è un nome reale (senza @) usalo, altrimenti la parte prima della @ dell'email */
  const shortLabel = (() => {
    const name = user?.name?.trim();
    const email = user?.email?.trim() ?? '';
    if (name && !name.includes('@')) {
      return name.length > 12 ? `${name.slice(0, 12)}…` : name;
    }
    if (email) {
      const username = (email.split('@')[0] || '').trim() || 'Utente';
      const display = username.length > 12 ? `${username.slice(0, 12)}…` : username;
      return display.toUpperCase();
    }
    return 'Utente';
  })();
  const balance = '0,00€';

  return (
    <>
      {/* Toast successo: sotto la barra di ricerca, entra da destra e esce a destra */}
      {(flashMessage || toastExiting) && (
        <div
          className={cn(
            'fixed right-6 z-[60] flex items-center gap-3 rounded-xl border border-gray-200/80 bg-white px-4 py-3 shadow-[0_4px_24px_rgba(0,0,0,0.12)]',
            toastExiting ? 'toast-exit' : 'toast-enter'
          )}
          style={{ top: 200, borderLeft: '4px solid #22c55e' }}
          role="status"
          aria-live="polite"
        >
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
            <Check className="h-4 w-4" strokeWidth={2.5} aria-hidden />
          </span>
          <span className="text-sm font-medium text-gray-800">
            {flashMessage ?? lastFlashRef.current}
          </span>
        </div>
      )}

      {/* Toast errore (credenziali sbagliate ecc.): stessa posizione e animazione da destra */}
      {(loginError || errorExiting) && (
        <div
          className={cn(
            'fixed right-6 z-[60] flex items-center gap-3 rounded-xl border border-gray-200/80 bg-white px-4 py-3 shadow-[0_4px_24px_rgba(0,0,0,0.12)]',
            errorExiting ? 'toast-exit' : 'toast-enter'
          )}
          style={{ top: 200, borderLeft: '4px solid #ef4444' }}
          role="alert"
          aria-live="assertive"
        >
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-red-50 text-red-600">
            <AlertCircle className="h-4 w-4" strokeWidth={2.5} aria-hidden />
          </span>
          <span className="text-sm font-medium text-gray-800">
            {loginError ?? lastErrorRef.current}
          </span>
        </div>
      )}

      <div className="flex items-center gap-2 py-0 min-w-0">
        {/* Left: Logo + Magic dropdown — non flex-1 quando loggato così il menu centrale può espandersi */}
        <div className={cn(
          'flex min-w-0 items-center gap-2 sm:gap-3',
          isAuthenticated ? 'flex-initial' : 'flex-1'
        )}>
          <Link
            href="/"
            className="flex items-center rounded-lg px-2 py-1 transition-opacity hover:opacity-90"
            aria-label="BRX Home"
          >
            <Image
              src={getCdnImageUrl('Logo%20Corto%20BRX.png')}
              alt="BRX"
              width={140}
              height={70}
              className="h-14 w-auto object-contain"
              priority
              unoptimized
            />
          </Link>

          <div className="relative ml-[3.25rem]" ref={gamesMenuRef}>
            <button
              type="button"
              onClick={() => setGamesMenuOpen((o) => !o)}
              className={cn(
                'relative flex items-center gap-1 px-0 py-0 text-sm font-medium text-white',
                'cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[#1D3160]'
              )}
              aria-expanded={gamesMenuOpen}
              aria-haspopup="true"
              aria-label="Seleziona gioco"
            >
              <span>{selectedGame ? gameDisplayName(selectedGame) : 'Seleziona gioco'}</span>
              <span
                className={cn(
                  'ml-1 flex h-4 w-4 items-center justify-center text-[#FF7300] transition-transform',
                  gamesMenuOpen && 'rotate-180'
                )}
                aria-hidden
              >
                <ChevronDown className="h-3.5 w-3.5" strokeWidth={2} />
              </span>
            </button>
            {gamesMenuOpen && (
              <div
                className="absolute left-0 top-full z-[110] mt-0 min-w-[180px] border border-gray-200 bg-white py-2 shadow-lg"
                role="menu"
                aria-label="Menu giochi"
              >
                {GAME_OPTIONS.map((opt, i) => {
                  const logoSrc =
                    opt.value === 'mtg'
                      ? getCdnImageUrl('loghi-giochi/magic.png')
                      : opt.value === 'pokemon'
                      ? getCdnImageUrl('loghi-giochi/pokèmon.png')
                      : getCdnImageUrl('loghi-giochi/One_Piece_Card_Game_Logo%201.png');
                  return (
                  <div key={opt.value}>
                    {i > 0 && <div className="my-1 h-px bg-gray-100" aria-hidden />}
                    <Link
                      href={GAME_HOME_PATH[opt.value]}
                      onClick={() => {
                        setSelectedGame(opt.value);
                        setGamesMenuOpen(false);
                      }}
                      className="games-menu-item flex w-full items-center justify-center px-4 py-3 text-gray-900 transition-colors"
                      role="menuitem"
                      aria-label={opt.label}
                    >
                      <Image
                        src={logoSrc}
                        alt={opt.label}
                        width={140}
                        height={56}
                        className="max-h-10 w-auto object-contain sm:max-h-12"
                        unoptimized
                      />
                    </Link>
                  </div>
                )})}
              </div>
            )}
          </div>
        </div>

        {/* Center: Form login diretto (solo se non loggato). Su mobile: link Accedi; da md in su: form completo */}
        {!isAuthenticated && (
          <>
          <Link
            href="/login"
            className="md:hidden flex-shrink-0 rounded-full border px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90"
            style={{ backgroundColor: '#FF7300', borderColor: '#878787' }}
          >
            Accedi
          </Link>
          <form
            onSubmit={handleSubmit(onHeaderLogin)}
            className="hidden flex-1 justify-center items-center gap-3 md:flex relative"
            noValidate
          >
            <div className="relative">
              <Input
                type="text"
                placeholder="Username"
                autoComplete="email"
                className={cn(
                  inputBase,
                  AUTH_INPUT_HEIGHT,
                  AUTH_INPUT_WIDTH,
                  'border',
                  errors.username && 'border-red-500'
                )}
                style={{
                  backgroundColor: '#d9d9d9',
                  borderColor: errors.username ? undefined : '#FF7300',
                }}
                {...register('username')}
              />
              {errors.username && (
                <span className="absolute left-0 top-full mt-0.5 whitespace-nowrap text-[10px] text-red-400">
                  {errors.username.message}
                </span>
              )}
            </div>
            <div className="relative flex items-center">
              <Input
                type={showPassword ? 'text' : 'password'}
                placeholder="Password"
                autoComplete="current-password"
                className={cn(
                  inputBase,
                  AUTH_INPUT_HEIGHT,
                  AUTH_INPUT_WIDTH,
                  'pl-4 pr-10 border',
                  errors.password && 'border-red-500'
                )}
                style={{
                  backgroundColor: '#d9d9d9',
                  borderColor: errors.password ? undefined : '#FF7300',
                }}
                {...register('password')}
              />
              <button
                type="button"
                onClick={() => setShowPassword((p) => !p)}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded p-1 text-gray-600 hover:bg-gray-300/50"
                aria-label={showPassword ? 'Nascondi password' : 'Mostra password'}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
            <Button
              type="submit"
              disabled={loginMutation.isPending}
              className="flex shrink-0 items-center justify-center rounded-full border px-4 hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                backgroundColor: '#FF7300',
                borderColor: '#878787',
                color: '#2d1810',
                height: '2.25rem',
                minWidth: '2.25rem',
              }}
              aria-label="Accedi"
            >
              {loginMutation.isPending ? (
                <span className="text-xs">...</span>
              ) : (
                <LogIn
                  className="shrink-0"
                  style={{ width: '1.25rem', height: '1.25rem' }}
                  strokeWidth={2}
                />
              )}
            </Button>
            <Link
              href="/recupera-credenziali"
              className="whitespace-nowrap text-xs text-gray-400 hover:text-white leading-none"
            >
              Recupera credenziali
            </Link>
          </form>
          </>
        )}

        {/* Centro/Destra: se loggato = menu distribuito al centro + Hamburger a destra */}
        <div className={cn(
          'flex min-w-0 items-center mr-0',
          isAuthenticated ? 'flex-1' : 'flex-1 shrink-0 justify-end gap-2 sm:gap-3'
        )}>
          {isAuthenticated && user ? (
            <>
              {/* Menu centrale: User, Acquisti, Vendi, Carrello, Scambi, Aste — spacing lineare e omogeneo (Figma) */}
              <div className="flex flex-1 justify-evenly items-center gap-3 sm:gap-4 max-w-4xl mx-auto">
              {/* 1. Nome utente + icona */}
              <div className="relative flex items-center gap-2" ref={accountMenuRef}>
                <button
                  type="button"
                  onClick={() => {
                    setAccountMenuOpen((o) => !o);
                    setAcquistiMenuOpen(false);
                  }}
                  className="flex items-center gap-2 rounded-lg px-1.5 py-1.5 text-white transition-opacity hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[#1D3160]"
                  aria-expanded={accountMenuOpen}
                  aria-haspopup="true"
                  aria-label="Menu account"
                >
                  <span
                    className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full"
                    aria-hidden
                  >
                    {/* Icona profilo SVG (24x24, stroke #FF7300) */}
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#FF7300"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="h-6 w-6"
                    >
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                      <circle cx="12" cy="7" r="4"></circle>
                    </svg>
                  </span>
                  <span className="hidden max-w-[6.5rem] shrink-0 text-sm font-medium uppercase text-white md:block" title={user?.email ?? user?.name ?? undefined}>
                    {shortLabel}
                  </span>
                  <span className="hidden text-sm text-white sm:inline shrink-0">({balance})</span>
                  <span
                    className={cn(
                      'ml-1 flex h-4 w-4 shrink-0 items-center justify-center text-[#FF7300] transition-transform',
                      accountMenuOpen && 'rotate-180'
                    )}
                    aria-hidden
                  >
                    {/* Freccia dropdown SVG (16x16, stroke #FF7300) */}
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polyline points="6 9 12 15 18 9"></polyline>
                    </svg>
                  </span>
                </button>

                {accountMenuOpen && (
                  <div
                    className="absolute left-0 top-full z-[110] mt-1 min-w-[200px] rounded-2xl px-4 py-3 shadow-xl"
                    style={{ backgroundColor: '#FF8C00' }}
                    role="menu"
                    aria-label="Menu account"
                  >
                    <nav className="flex flex-col" aria-label="Menu account">
                      <Link
                        href="/account"
                        className="block py-2 text-sm font-medium uppercase tracking-wide text-white hover:underline"
                        onClick={() => setAccountMenuOpen(false)}
                      >
                        ACCOUNT
                      </Link>
                      <div className="my-1 h-px bg-white/80" aria-hidden />
                      <Link
                        href="/account/messaggi"
                        className="block py-2 text-sm font-medium uppercase tracking-wide text-white hover:underline"
                        onClick={() => setAccountMenuOpen(false)}
                      >
                        I MIEI MESSAGGI
                      </Link>
                      <div className="my-1 h-px bg-white/80" aria-hidden />
                      <Link
                        href="/account/credito"
                        className="block py-2 text-sm font-medium uppercase tracking-wide text-white hover:underline"
                        onClick={() => setAccountMenuOpen(false)}
                      >
                        CREDITO
                      </Link>
                      <div className="my-1 h-px bg-white/80" aria-hidden />
                      <Link
                        href="/account/oggetti"
                        className="block py-2 text-sm font-medium uppercase tracking-wide text-white hover:underline"
                        onClick={() => setAccountMenuOpen(false)}
                      >
                        I MIEI OGGETTI
                      </Link>
                      <div className="my-1 h-px bg-white/80" aria-hidden />
                      <Link
                        href="/account/sincronizzazione"
                        className="block py-2 text-sm font-medium uppercase tracking-wide text-white hover:underline"
                        onClick={() => setAccountMenuOpen(false)}
                      >
                        SINCRONIZZAZIONE
                      </Link>
                    </nav>
                  </div>
                )}
              </div>

              {/* 2. ACQUISTI: icona shopping bag + testo + dropdown, stile coordinato al profilo */}
              <div className="relative flex items-center gap-2" ref={acquistiMenuRef}>
                <button
                  type="button"
                  onClick={() => {
                    setAcquistiMenuOpen((o) => !o);
                    setAccountMenuOpen(false);
                  }}
                  className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-white transition-opacity hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[#1D3160]"
                  aria-expanded={acquistiMenuOpen}
                  aria-haspopup="true"
                  aria-label="Menu acquisti"
                >
                  <span
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/5"
                    aria-hidden
                  >
                    {/* Icona ACQUISTI: shopping bag (stroke #FF7300, 2px) */}
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#FF7300"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="h-5 w-5"
                    >
                      <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
                      <line x1="3" y1="6" x2="21" y2="6"></line>
                      <path d="M16 10a4 4 0 0 1-8 0"></path>
                    </svg>
                  </span>
                  <span className="hidden whitespace-nowrap text-sm font-medium uppercase md:inline">
                    ACQUISTI
                  </span>
                  <span
                    className="ml-0.5 flex h-4 w-4 shrink-0 items-center justify-center text-[#FF7300]"
                    aria-hidden
                  >
                    {/* Freccia dropdown minimal, senza “bottone nel bottone” */}
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className={cn('h-4 w-4 transition-transform', acquistiMenuOpen && 'rotate-180')}
                    >
                      <polyline points="6 9 12 15 18 9"></polyline>
                    </svg>
                  </span>
                </button>

                {acquistiMenuOpen && (
                  <div
                    className="absolute left-0 top-full z-[110] mt-1 min-w-[200px] rounded-2xl px-4 py-3 shadow-xl"
                    style={{ backgroundColor: '#FF8C00' }}
                    role="menu"
                  >
                    <Link
                      href="/ordini/acquisti"
                      className="block py-2 text-sm font-medium uppercase tracking-wide text-white hover:underline"
                      onClick={() => setAcquistiMenuOpen(false)}
                    >
                      I MIEI ACQUISTI
                    </Link>
                    <div className="my-1 h-px bg-white/80" aria-hidden />
                    <Link
                      href="/account/lista-desideri"
                      className="block py-2 text-sm font-medium uppercase tracking-wide text-white hover:underline"
                      onClick={() => setAcquistiMenuOpen(false)}
                    >
                      LISTA DESIDERI
                    </Link>
                  </div>
                )}
              </div>

              {/* 3. VENDI: icona price tag + testo, coordinata al resto */}
              <Link
                href="/account-business"
                className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-white transition-opacity hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[#1D3160]"
                aria-label="Vendi"
              >
                <span
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/5"
                  aria-hidden
                >
                  {/* Icona VENDI: price tag (stroke #FF7300, 2px) */}
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#FF7300"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-5 w-5"
                  >
                    <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path>
                    <line x1="7" y1="7" x2="7.01" y2="7"></line>
                  </svg>
                </span>
                <span className="hidden whitespace-nowrap text-sm font-medium uppercase lg:inline">
                  VENDI
                </span>
              </Link>

              {/* 4. SCAMBI: frecce circolari (sync), coordinato alle altre icone */}
              <Link
                href="/scambi"
                className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-white transition-opacity hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[#1D3160]"
                aria-label="Scambi"
              >
                <span
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/5"
                  aria-hidden
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#FF7300"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-5 w-5"
                  >
                    <polyline points="17 1 21 5 17 9"></polyline>
                    <path d="M3 11V9a4 4 0 0 1 4-4h14"></path>
                    <polyline points="7 23 3 19 7 15"></polyline>
                    <path d="M21 13v2a4 4 0 0 1-4 4H3"></path>
                  </svg>
                </span>
                <span className="hidden whitespace-nowrap text-sm font-medium uppercase md:inline">
                  SCAMBI
                </span>
              </Link>

              {/* 5. ASTE: martelletto da battitore, coordinato alle altre icone */}
              <Link
                href="/aste"
                className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-white transition-opacity hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[#1D3160]"
                aria-label="Aste"
              >
                <span
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/5"
                  aria-hidden
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#FF7300"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-5 w-5"
                  >
                    <path d="m14.5 12.5-8 8a2.119 2.119 0 1 1-3-3l8-8"></path>
                    <path d="m16 16 6-6"></path>
                    <path d="m8 8 6-6"></path>
                    <path d="m9 7 8 8"></path>
                    <path d="m21 11-8-8"></path>
                  </svg>
                </span>
                <span className="hidden whitespace-nowrap text-sm font-medium uppercase md:inline">
                  ASTE
                </span>
              </Link>

              {/* 6. Carrello: outline moderno, coordinato alle altre icone */}
              <Link
                href="/cart"
                className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-white transition-opacity hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[#1D3160]"
                aria-label={`Carrello ${formatEuro(cartTotal)}`}
              >
                <span className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/5">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#FF7300"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-5 w-5"
                    aria-hidden
                  >
                    <circle cx="9" cy="21" r="1"></circle>
                    <circle cx="20" cy="21" r="1"></circle>
                    <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
                  </svg>
                  {cartCount > 0 && (
                    <span
                      className="absolute -right-0.5 -top-0.5 flex h-3.5 min-w-[0.875rem] items-center justify-center rounded-full bg-white px-0.5 text-[9px] font-bold text-[#FF7300]"
                      aria-hidden
                    >
                      {cartCount > 99 ? '99+' : cartCount}
                    </span>
                  )}
                </span>
                <span className="hidden text-sm text-white sm:inline">
                  ({formatEuro(cartTotal)})
                </span>
              </Link>
              </div>
            </>
          ) : (
            <>
              <Button
                asChild
                className="rounded-full border px-5 py-2 text-sm font-bold uppercase tracking-wide text-white transition-colors hover:opacity-90"
                style={{ backgroundColor: '#FF7300', borderColor: '#878787' }}
              >
                <Link href="/registrati">REGISTRATI</Link>
              </Button>
              <Link
                href="/cart"
                className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/5 text-white transition-opacity hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[#1D3160]"
                aria-label={`Carrello${cartCount > 0 ? ` (${cartCount} articoli)` : ''}`}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#FF7300"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-6 w-6"
                  aria-hidden
                >
                  <circle cx="9" cy="21" r="1"></circle>
                  <circle cx="20" cy="21" r="1"></circle>
                  <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
                </svg>
                {cartCount > 0 && (
                  <span
                    className="absolute -right-1 -top-1 flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-[#FF7300] px-1 text-[10px] font-bold text-white"
                    aria-hidden
                  >
                    {cartCount > 99 ? '99+' : cartCount}
                  </span>
                )}
              </Link>
            </>
          )}
          <div className="flex shrink-0 items-center" aria-label="Menu">
            <HamburgerMenu />
          </div>
        </div>
      </div>
    </>
  );
}
