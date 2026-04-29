'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { AlertCircle, Check, ChevronDown, Eye, EyeOff, LogIn, LogOut } from 'lucide-react';
import { HamburgerMenu } from './HamburgerMenu';
import { CartDropdown } from './CartDropdown';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn, formatEuroNoSpace } from '@/lib/utils';
import { useAuthStore } from '@/lib/stores/auth-store';
import { parseAuthError } from '@/lib/api/auth-error';
import { useLogin } from '@/lib/hooks/use-auth';
import { headerLoginSchema, type HeaderLoginValues } from '@/lib/validations/auth';
import { getCdnImageUrl } from '@/lib/config';
import { useGame, GAME_OPTIONS } from '@/lib/contexts/GameContext';
import type { GameSlug } from '@/lib/contexts/GameContext';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { LOCALE_TO_INTL } from '@/lib/i18n/locales';
import type { UiLocale } from '@/lib/i18n/locales';
import { translateZodMessage } from '@/lib/i18n/translateZodMessage';
import { FEATURES } from '@/lib/config/features';

const GAME_HOME_PATH: Record<GameSlug, string> = {
  mtg: '/home/magic',
  pokemon: '/home/pokemon',
  op: '/home/one-piece',
};

const AUTH_INPUT_HEIGHT = 'h-9';
const AUTH_INPUT_WIDTH = 'w-36';
const inputBase =
  'rounded-full px-4 text-sm font-normal font-sans text-[#0F172A] placeholder:text-gray-500 focus:outline-none focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 border';

const FLASH_DURATION_MS = 4500;
const ORANGE_GLASS_MENU_CLASS =
  'absolute left-1/2 top-full z-[110] mt-1.5 min-w-[200px] -translate-x-1/2 rounded-2xl border border-primary/45 bg-primary/30 px-4 py-3 text-white backdrop-blur-2xl backdrop-saturate-150 shadow-2xl ring-1 ring-white/20 animate-orange-menu-enter';
const ORANGE_GLASS_DIVIDER_CLASS = 'my-1 h-px bg-white/45';
const ORANGE_GLASS_COMPACT_MENU_CLASS =
  'absolute left-1/2 top-full z-[110] mt-1.5 min-w-[180px] -translate-x-1/2 rounded-2xl border border-white/20 bg-white/10 px-2 py-2 text-white backdrop-blur-2xl backdrop-saturate-150 shadow-2xl ring-1 ring-white/10 animate-orange-menu-enter';
const ORANGE_GLASS_SOFT_DIVIDER_CLASS = 'my-1 h-px bg-white/30';

export function TopBar() {
  const { t, locale } = useTranslation();
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const { selectedGame, setSelectedGame, gameDisplayName } = useGame();
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const [acquistiMenuOpen, setAcquistiMenuOpen] = useState(false);
  const [vendiMenuOpen, setVendiMenuOpen] = useState(false);
  const [gamesMenuOpen, setGamesMenuOpen] = useState(false);
  const accountMenuRef = useRef<HTMLDivElement>(null);
  const vendiMenuRef = useRef<HTMLDivElement>(null);
  const acquistiMenuRef = useRef<HTMLDivElement>(null);
  const gamesMenuRef = useRef<HTMLDivElement>(null);
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const flashMessage = useAuthStore((s) => s.flashMessage);
  const setFlashMessage = useAuthStore((s) => s.setFlashMessage);
  const logout = useAuthStore((s) => s.logout);
  const loginMutation = useLogin();
  const [loginError, setLoginError] = useState<string | null>(null);
  const lastFlashRef = useRef<string | null>(null);
  const [toastExiting, setToastExiting] = useState(false);
  const lastErrorRef = useRef<string | null>(null);
  const [errorExiting, setErrorExiting] = useState(false);

  const intlLocale = LOCALE_TO_INTL[locale as UiLocale] ?? 'it-IT';
  const formatEuro = (n: number) => formatEuroNoSpace(n, intlLocale);

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
      // Verifica se l'input è email (contiene '@') o username
      // e invia solo il campo corretto al backend
      const input = data.username.trim();
      const isEmail = input.includes('@');
      
      // [DEV CHECK] In DevTools Network tab, verifica che il body contenga:
      // - Se input contiene '@': { "email": "...", "password": "...", "website_url": "" }
      // - Se input NON contiene '@': { "username": "...", "password": "...", "website_url": "" }
      // MAI entrambi email e username contemporaneamente
      const credentials = isEmail
        ? { email: input, password: data.password }
        : { username: input, password: data.password };
      
      const result = await loginMutation.mutateAsync(credentials);

      // Stesso flusso della pagina /login: vai al form codice Authenticator (non alla landing /login)
      if (result.mfaRequired) {
        reset();
        router.replace('/login/verify-mfa');
        return;
      }

      // Login completato con successo
      // Il flash message viene impostato dallo store, ma assicuriamoci che appaia
      setFlashMessage(t('auth.loginSuccess'));
      reset();
      
      // L'header si aggiornerà automaticamente perché isAuthenticated e user cambiano nello store
    } catch (err: any) {
      // Pulisci il flash message in caso di errore
      setFlashMessage(null);
      
      // Usa parseAuthError per normalizzare l'errore
      const parsed = parseAuthError(err);
      setLoginError(parsed.message);
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
    if (!vendiMenuOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (vendiMenuRef.current && !vendiMenuRef.current.contains(e.target as Node)) {
        setVendiMenuOpen(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [vendiMenuOpen]);

  /** Mostra nome utente: se c'è un nome reale (senza @) usalo, altrimenti la parte prima della @ dell'email */
  const shortLabel = (() => {
    const name = user?.name?.trim();
    const email = user?.email?.trim() ?? '';
    if (name && !name.includes('@')) {
      return name.length > 12 ? `${name.slice(0, 12)}…` : name;
    }
    if (email) {
      const username = (email.split('@')[0] || '').trim() || t('user.fallbackName');
      const display = username.length > 12 ? `${username.slice(0, 12)}…` : username;
      return display.toUpperCase();
    }
    return t('user.fallbackName');
  })();
  const balance = '0,00€';

  return (
    <>
      <style>{`
        @keyframes toast-spring-in {
          0% { transform: translate(-50%, -150%) scale(0.9); opacity: 0; }
          50% { transform: translate(-50%, 10%) scale(1.02); opacity: 1; }
          100% { transform: translate(-50%, 0) scale(1); opacity: 1; }
        }
        @keyframes toast-spring-out {
          0% { transform: translate(-50%, 0) scale(1); opacity: 1; }
          100% { transform: translate(-50%, -150%) scale(0.9); opacity: 0; }
        }
        .toast-spring-enter {
          animation: toast-spring-in 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }
        .toast-spring-exit {
          animation: toast-spring-out 0.3s cubic-bezier(0.4, 0, 1, 1) forwards;
        }
      `}</style>

      {/* Toast successo: Premium Glassmorphism Colorato */}
      {(flashMessage || toastExiting) && (
        <div
          className={cn(
            'fixed left-1/2 top-6 z-[110] flex items-center gap-3 rounded-full border bg-emerald-50/90 px-5 py-3 backdrop-blur-2xl backdrop-saturate-150',
            'border-emerald-500/20 shadow-[0_8px_30px_-4px_rgba(16,185,129,0.3)]',
            toastExiting ? 'toast-spring-exit' : 'toast-spring-enter'
          )}
          role="status"
          aria-live="polite"
        >
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-white shadow-[inset_0_-2px_4px_rgba(0,0,0,0.2)]">
            <Check className="h-4 w-4" strokeWidth={3} aria-hidden />
          </div>
          <span className="text-sm font-bold text-emerald-900 tracking-wide">
            {flashMessage ?? lastFlashRef.current}
          </span>
        </div>
      )}

      {/* Toast errore: Premium Glassmorphism Colorato */}
      {(loginError || errorExiting) && (
        <div
          className={cn(
            'fixed left-1/2 top-6 z-[110] flex items-center gap-3 rounded-full border bg-red-50/90 px-5 py-3 backdrop-blur-2xl backdrop-saturate-150',
            'border-red-500/20 shadow-[0_8px_30px_-4px_rgba(239,68,68,0.3)]',
            errorExiting ? 'toast-spring-exit' : 'toast-spring-enter'
          )}
          role="alert"
          aria-live="assertive"
        >
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-red-500 text-white shadow-[inset_0_-2px_4px_rgba(0,0,0,0.2)]">
            <AlertCircle className="h-4 w-4" strokeWidth={2.5} aria-hidden />
          </div>
          <span className="text-sm font-bold text-red-900 tracking-wide">
            {loginError ?? lastErrorRef.current}
          </span>
        </div>
      )}

      <div className="flex min-h-0 items-center gap-1.5 py-0 min-w-0 md:gap-2 md:py-0">
        {/* Left: Logo + selettore gioco — su mobile logo più grande; margine desktop solo da md */}
        <div
          className={cn(
            'flex min-w-0 items-center gap-2 sm:gap-3',
            isAuthenticated ? 'flex-initial' : 'flex-1'
          )}
        >
          <Link
            href="/"
            className="flex shrink-0 items-center rounded-lg py-0.5 pl-0 pr-1 transition-opacity hover:opacity-90 md:pl-8 md:pr-1 md:py-1"
            aria-label={t('topBar.homeAria')}
          >
            <Image
              src={getCdnImageUrl('Logo%20Corto%20BRX.png')}
              alt="BRX"
              width={240}
              height={120}
              className="h-14 w-auto max-h-14 object-contain md:h-14 md:max-h-none"
              priority
              unoptimized
            />
          </Link>

          {/* Da tablet in su: selettore in header. Su mobile il gioco si sceglie dal menu hamburger. */}
          <div className="relative hidden h-full min-w-0 items-center md:ml-[3.25rem] md:-ml-1 md:flex" ref={gamesMenuRef}>
            <button
              type="button"
              onClick={() => setGamesMenuOpen((o) => !o)}
              className={cn(
                'relative flex cursor-pointer items-center gap-1 px-0 py-0 leading-none text-sm font-medium text-white',
                'focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[#1D3160]'
              )}
              aria-expanded={gamesMenuOpen}
              aria-haspopup="true"
              aria-label={t('game.selectGameAria')}
            >
              <span className="leading-none">{selectedGame ? gameDisplayName(selectedGame) : t('game.selectGame')}</span>
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
                className={ORANGE_GLASS_COMPACT_MENU_CLASS}
                role="menu"
                aria-label={t('topBar.gamesMenuAria')}
              >
                {GAME_OPTIONS.filter(opt => opt.value === 'mtg').map((opt, i) => {
                  const logoSrc =
                    opt.value === 'mtg'
                      ? getCdnImageUrl('loghi-giochi/magic.png')
                      : opt.value === 'pokemon'
                      ? getCdnImageUrl('loghi-giochi/pokèmon.png')
                      : getCdnImageUrl('loghi-giochi/One_Piece_Card_Game_Logo%201.png');
                  return (
                  <div key={opt.value}>
                    {i > 0 && <div className={ORANGE_GLASS_SOFT_DIVIDER_CLASS} aria-hidden />}
                    <Link
                      href={GAME_HOME_PATH[opt.value]}
                      onClick={() => {
                        setSelectedGame(opt.value);
                        setGamesMenuOpen(false);
                      }}
                      className="flex w-full items-center justify-center rounded-lg px-4 py-3 text-white/95 transition-colors duration-200 hover:bg-white/10 focus:bg-white/10 focus:outline-none"
                      role="menuitem"
                      aria-label={opt.label}
                    >
                      <Image
                        src={logoSrc}
                        alt={opt.label}
                        width={160}
                        height={48}
                        className="mx-auto h-10 w-auto max-w-[9rem] object-contain sm:h-12 sm:max-w-[10rem]"
                        sizes="160px"
                        unoptimized
                      />
                    </Link>
                  </div>
                )})}
              </div>
            )}
          </div>
        </div>

        {/* Center: form login inline solo desktop (md+). Su mobile login/registrazione nel menu hamburger */}
        {!isAuthenticated && (
          <>
          <form
            onSubmit={handleSubmit(onHeaderLogin)}
            className="hidden flex-1 justify-center items-center gap-3 md:flex relative"
            noValidate
          >
            <div className="relative">
              <Input
                type="text"
                placeholder={t('auth.usernamePlaceholder')}
                aria-label={t('auth.usernamePlaceholder')}
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
                  {translateZodMessage(errors.username.message, t)}
                </span>
              )}
            </div>
            <div className="relative flex items-center">
              <Input
                type={showPassword ? 'text' : 'password'}
                placeholder={t('auth.passwordPlaceholder')}
                aria-label={t('auth.passwordPlaceholder')}
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
                aria-label={showPassword ? t('auth.hidePassword') : t('auth.showPassword')}
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
              className="btn-orange-glow flex shrink-0 items-center justify-center rounded-full border px-4 !text-[#2d1810] h-[2.25rem] min-w-[2.25rem] disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label={t('auth.loginButtonAria')}
            >
              {loginMutation.isPending ? (
                <span className="text-xs">...</span>
              ) : (
                <LogIn
                  className="shrink-0"
                  style={{ width: '1.25rem', height: '1.25rem', color: 'white' }}
                  strokeWidth={2}
                />
              )}
            </Button>
            <Link
              href="/recupera-credenziali"
              className="whitespace-nowrap text-xs text-gray-400 hover:text-white leading-none"
            >
              {t('auth.recoverCredentials')}
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
              {/* Menu centrale: desktop = Account + Acquisti + Vendi + Scambi + Aste + Carrello. Mobile = solo 5 icone (senza profilo), ordine: Acquisti → Vendi → Aste → Scambi → Carrello */}
              <div className="mx-auto flex max-w-4xl flex-1 items-center justify-evenly gap-2 md:gap-4">
              {/* 1. Nome utente + icona — solo da tablet in su; su mobile è nel menu hamburger */}
              <div className="relative hidden items-center gap-2 md:flex" ref={accountMenuRef}>
                <button
                  type="button"
                  onClick={() => {
                    setAccountMenuOpen((o) => !o);
                    setAcquistiMenuOpen(false);
                  }}
                  className="flex items-center gap-2 rounded-lg px-1.5 py-1.5 text-white transition-opacity hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[#1D3160]"
                  aria-expanded={accountMenuOpen}
                  aria-haspopup="true"
                  aria-label={t('account.menuAria')}
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
                    className={ORANGE_GLASS_MENU_CLASS}
                    role="menu"
                    aria-label={t('account.menuAria')}
                  >
                    <nav className="flex flex-col" aria-label={t('account.menuAria')}>
                      <Link
                        href="/account"
                        className="block py-2 text-sm font-medium uppercase tracking-wide text-white hover:underline"
                        onClick={() => setAccountMenuOpen(false)}
                      >
                        {t('account.account')}
                      </Link>
                      <div className={ORANGE_GLASS_DIVIDER_CLASS} aria-hidden />
                      <Link
                        href="/account/messaggi"
                        className="block py-2 text-sm font-medium uppercase tracking-wide text-white hover:underline"
                        onClick={() => setAccountMenuOpen(false)}
                      >
                        {t('account.messages')}
                      </Link>
                      <div className={ORANGE_GLASS_DIVIDER_CLASS} aria-hidden />
                      <Link
                        href="/account/credito"
                        className="block py-2 text-sm font-medium uppercase tracking-wide text-white hover:underline"
                        onClick={() => setAccountMenuOpen(false)}
                      >
                        {t('account.credit')}
                      </Link>
                      <div className={ORANGE_GLASS_DIVIDER_CLASS} aria-hidden />
                      <Link
                        href="/account/sincronizzazione"
                        className="block py-2 text-sm font-medium uppercase tracking-wide text-white hover:underline"
                        onClick={() => setAccountMenuOpen(false)}
                      >
                        {t('account.sync')}
                      </Link>
                    </nav>
                  </div>
                )}
              </div>

              {/* 2. ACQUISTI - Su mobile diventa link diretto a "I miei oggetti", su desktop dropdown */}
              <div
                className="relative order-1 flex items-center gap-2 md:order-2"
                ref={acquistiMenuRef}
              >
                {/* Mobile: Link diretto a I miei oggetti (sostituisce il dropdown) */}
                <Link
                  href="/account/oggetti"
                  className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-white transition-opacity hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[#1D3160] md:hidden"
                  aria-label={t('account.items')}
                >
                  <span
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/5"
                    aria-hidden
                  >
                    {/* Icona OGGETTI: package/box */}
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
                      <path d="m7.5 4.27 9 5.15"></path>
                      <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"></path>
                      <path d="m3.3 7 8.7 5 8.7-5"></path>
                      <path d="M12 22V12"></path>
                    </svg>
                  </span>
                </Link>

                {/* Desktop: Dropdown Acquisti con I miei acquisti e Lista desideri */}
                <button
                  type="button"
                  onClick={() => {
                    setAcquistiMenuOpen((o) => !o);
                    setAccountMenuOpen(false);
                  }}
                  className="hidden items-center gap-2 rounded-lg px-2 py-1.5 text-white transition-opacity hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[#1D3160] md:flex"
                  aria-expanded={acquistiMenuOpen}
                  aria-haspopup="true"
                  aria-label={t('purchases.menuAria')}
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
                    {t('purchases.title')}
                  </span>
                  <span
                    className="ml-0.5 flex h-4 w-4 shrink-0 items-center justify-center text-[#FF7300]"
                    aria-hidden
                  >
                    {/* Freccia dropdown minimal, senza "bottone nel bottone" */}
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
                    className={ORANGE_GLASS_MENU_CLASS}
                    role="menu"
                  >
                    <Link
                      href="/ordini/acquisti"
                      className="block py-2 text-sm font-medium uppercase tracking-wide text-white hover:underline"
                      onClick={() => setAcquistiMenuOpen(false)}
                    >
                      {t('purchases.myPurchases')}
                    </Link>
                    <div className={ORANGE_GLASS_DIVIDER_CLASS} aria-hidden />
                    <Link
                      href="/account/lista-desideri"
                      className="block py-2 text-sm font-medium uppercase tracking-wide text-white hover:underline"
                      onClick={() => setAcquistiMenuOpen(false)}
                    >
                      {t('purchases.wishlist')}
                    </Link>
                  </div>
                )}
              </div>

              {/* 3. VENDI - Su mobile è un dropdown con Vendi/Aste; su desktop Link diretto */}
              <div
                className="relative order-2 flex items-center gap-2 md:order-3"
                ref={vendiMenuRef}
              >
                <button
                  type="button"
                  onClick={() => {
                    setVendiMenuOpen((o) => !o);
                    setAccountMenuOpen(false);
                    setAcquistiMenuOpen(false);
                  }}
                  className="flex items-center gap-2 rounded-lg px-1.5 py-1.5 text-white transition-opacity hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[#1D3160] md:hidden"
                  aria-expanded={vendiMenuOpen}
                  aria-haspopup="true"
                  aria-label={t('nav.sell')}
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
                      <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path>
                      <line x1="7" y1="7" x2="7.01" y2="7"></line>
                    </svg>
                  </span>
                  <span className="ml-0.5 flex h-4 w-4 shrink-0 items-center justify-center text-[#FF7300] md:hidden">
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
                      className={cn('h-4 w-4 transition-transform', vendiMenuOpen && 'rotate-180')}
                    >
                      <polyline points="6 9 12 15 18 9"></polyline>
                    </svg>
                  </span>
                </button>

                {/* Dropdown Vendi - Visibile sia mobile che desktop */}
                {vendiMenuOpen && (
                  <div
                    className={ORANGE_GLASS_MENU_CLASS}
                    role="menu"
                  >
                    <nav className="flex flex-col">
                      <Link
                        href="/vendi"
                        className="block py-2 text-sm font-medium uppercase tracking-wide text-white hover:underline"
                        onClick={() => setVendiMenuOpen(false)}
                      >
                        Metti in vendita
                      </Link>

                      {/* Solo su desktop: "I miei oggetti" (su mobile ha il pulsante dedicato) */}
                      <div className="hidden md:block">
                        <div className={ORANGE_GLASS_DIVIDER_CLASS} aria-hidden />
                        <Link
                          href="/account/oggetti"
                          className="block py-2 text-sm font-medium uppercase tracking-wide text-white hover:underline"
                          onClick={() => setVendiMenuOpen(false)}
                        >
                          I miei oggetti
                        </Link>
                      </div>

                      {/* Solo su mobile, includiamo anche Tornei live, Aste e BRX Express che su desktop hanno link diretti */}
                      <div className="md:hidden">
                        <div className={ORANGE_GLASS_DIVIDER_CLASS} aria-hidden />
                        <Link
                          href="/aste"
                          className="block py-2 text-sm font-medium uppercase tracking-wide text-white hover:underline"
                          onClick={() => setVendiMenuOpen(false)}
                        >
                          {t('nav.auctions')}
                        </Link>
                        <div className={ORANGE_GLASS_DIVIDER_CLASS} aria-hidden />
                        <Link
                          href="/tornei-live"
                          className="block py-2 text-sm font-medium uppercase tracking-wide text-white hover:underline"
                          onClick={() => setVendiMenuOpen(false)}
                        >
                          Tornei live
                        </Link>
                        <div className={ORANGE_GLASS_DIVIDER_CLASS} aria-hidden />
                        <Link
                          href="/brx-express"
                          className="block py-2 text-sm font-medium uppercase tracking-wide text-white hover:underline"
                          onClick={() => setVendiMenuOpen(false)}
                        >
                          BRX Express
                        </Link>
                      </div>
                    </nav>
                  </div>
                )}

                {/* Tasto Vendi visibile solo su desktop - ora apre un dropdown */}
                <button
                  type="button"
                  onClick={() => {
                    setVendiMenuOpen((o) => !o);
                    setAccountMenuOpen(false);
                    setAcquistiMenuOpen(false);
                  }}
                  className="hidden items-center gap-2 rounded-lg px-2 py-1.5 text-white transition-opacity hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-white/20 md:flex"
                  aria-expanded={vendiMenuOpen}
                  aria-haspopup="true"
                  aria-label={t('nav.sell')}
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
                      <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path>
                      <line x1="7" y1="7" x2="7.01" y2="7"></line>
                    </svg>
                  </span>
                  <span className="hidden whitespace-nowrap text-sm font-medium uppercase lg:inline">
                    {t('nav.sell')}
                  </span>
                  <span className="hidden h-4 w-4 shrink-0 items-center justify-center text-[#FF7300] lg:flex">
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
                      className={cn('h-4 w-4 transition-transform', vendiMenuOpen && 'rotate-180')}
                    >
                      <polyline points="6 9 12 15 18 9"></polyline>
                    </svg>
                  </span>
                </button>
              </div>

              {/* 4. TORNEI LIVE - solo desktop */}
              <Link
                href="/tornei-live"
                className="order-3 hidden items-center gap-2 rounded-lg px-1.5 py-1.5 text-white transition-opacity hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[#1D3160] md:order-5 md:flex md:px-2"
                aria-label="Tornei live"
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
                    <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"></path>
                    <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"></path>
                    <path d="M4 22h16"></path>
                    <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"></path>
                    <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"></path>
                    <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"></path>
                  </svg>
                </span>
                <span className="hidden whitespace-nowrap text-sm font-medium uppercase md:inline">
                  Tornei live
                </span>
              </Link>

              {/* 5. ASTE - solo desktop */}
              <Link
                href="/aste"
                className="order-4 hidden items-center gap-2 rounded-lg px-1.5 py-1.5 text-white transition-opacity hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[#1D3160] md:order-4 md:flex md:px-2"
                aria-label={t('nav.auctions')}
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
                  {t('nav.auctions')}
                </span>
              </Link>

              {/* 6. Carrello con dropdown preview */}
              <div className="order-5 md:order-6">
                <CartDropdown />
              </div>
              </div>
            </>
          ) : (
            <>
              {/* Link testo pulito visibile solo su mobile */}
              <div className="flex shrink-0 items-center md:hidden mr-2 sm:mr-4">
                <Link 
                  href="/login" 
                  className="text-[13px] font-semibold tracking-wide text-white/95 hover:text-white transition-colors uppercase"
                >
                  Accedi o Registrati
                </Link>
              </div>

              {/* Pulsante pieno visibile solo su desktop */}
              <div className="hidden shrink-0 md:block">
                <Button
                  asChild
                  className="btn-orange-glow rounded-full border px-5 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Link href="/login">{t('auth.registerUpper')}</Link>
                </Button>
              </div>
            </>
          )}
          <div className="flex shrink-0 items-center" aria-label={t('header.menuAria')}>
            <HamburgerMenu />
          </div>
        </div>
      </div>
    </>
  );
}
