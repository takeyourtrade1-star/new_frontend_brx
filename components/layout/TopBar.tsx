'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ChevronDown, Eye, EyeOff, LogIn, LogOut, ShoppingBag, Tag } from 'lucide-react';
import { HamburgerMenu } from './HamburgerMenu';
import { TournamentsPortalLink } from './TournamentsPortalButton';
import { CartDropdown } from './CartDropdown';
import { MobileHeaderNavIcon, MOBILE_HEADER_ICON_CLASS } from './MobileHeaderNavIcon';
import { NotificationBell } from '@/components/feature/notifiche/NotificationBell';
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
import { AuctionGavelIcon } from '@/components/ui/AuctionGavelIcon';
import { FEATURES } from '@/lib/config/features';
import {
  HEADER_BRX_LOGO_COLUMN_CLASS,
  HEADER_BRX_LOGO_IMAGE_CLASS,
  HEADER_BRX_LOGO_LINK_CLASS,
  HEADER_GAME_ROW_GAP_CLASS,
  HEADER_GAME_TEXT_INSET_CLASS,
} from '@/components/layout/headerBrxColumn';

const GAME_HOME_PATH: Record<GameSlug, string> = {
  mtg: '/home/magic',
  pokemon: '/home/pokemon',
  op: '/home/one-piece',
};

const AUTH_INPUT_HEIGHT = 'h-9';
const AUTH_INPUT_WIDTH = 'w-36';
const inputBase =
  'rounded-full px-4 text-sm font-normal font-sans text-[#0F172A] placeholder:text-gray-500 focus:outline-none focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 border';

const ORANGE_GLASS_MENU_CLASS =
  'absolute left-1/2 top-full z-[120] mt-1.5 min-w-[200px] -translate-x-1/2 rounded-2xl border border-primary/45 bg-primary/30 px-4 py-3 text-white backdrop-blur-2xl backdrop-saturate-150 shadow-2xl ring-1 ring-white/20 animate-orange-menu-enter';
const ORANGE_GLASS_DIVIDER_CLASS = 'my-1 h-px bg-white/45';
const ORANGE_GLASS_COMPACT_MENU_CLASS =
  'absolute left-1/2 top-full z-[120] mt-1.5 min-w-[180px] -translate-x-1/2 rounded-2xl border border-white/20 bg-white/10 px-2 py-2 text-white backdrop-blur-2xl backdrop-saturate-150 shadow-2xl ring-1 ring-white/10 animate-orange-menu-enter';
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
  const authLoading = useAuthStore((s) => s.isLoading);
  const fetchUser = useAuthStore((s) => s.fetchUser);
  const setFlashMessage = useAuthStore((s) => s.setFlashMessage);
  const setAuthError = useAuthStore((s) => s.setAuthError);
  const logout = useAuthStore((s) => s.logout);
  const loginMutation = useLogin();

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
    setAuthError(null);
    setFlashMessage(null);
    
    try {
      const input = data.username.trim();
      const isEmail = input.includes('@');
      
      const credentials = isEmail
        ? { email: input, password: data.password }
        : { username: input, password: data.password };

      console.log('[TopBar] Sending login with', isEmail ? 'email' : 'username', ':', input);
      
      const result = await loginMutation.mutateAsync(credentials);

      console.log('[TopBar] Login result:', result);

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
      console.error('[TopBar] Login error:', err);
      setFlashMessage(null);
      const parsed = parseAuthError(err);
      setAuthError(parsed.message);
    }
  };

  /** Sessione attiva ma profilo non in store: recupera /me (race dopo login o persist tardivo) */
  useEffect(() => {
    if (!isAuthenticated || user) return;
    void fetchUser();
  }, [isAuthenticated, user, fetchUser]);

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

  /** Mostra nome utente: preferisce la parte prima della @ dell'email, poi il nome, poi il fallback */
  const shortLabel = (() => {
    if (isAuthenticated && !user && (authLoading || loginMutation.isPending)) {
      return '…';
    }
    const email = user?.email?.trim() ?? '';
    const name = user?.name?.trim() ?? '';
    if (email) {
      const username = (email.split('@')[0] || '').trim();
      if (username) {
        return (username.length > 12 ? `${username.slice(0, 12)}…` : username).toUpperCase();
      }
    }
    if (name && !name.includes('@')) {
      return name.length > 12 ? `${name.slice(0, 12)}…` : name;
    }
    return t('user.fallbackName');
  })();
  const balance = '0,00€';

  return (
    <>
      <div className="flex w-full min-h-0 items-center gap-0 py-0.5">
        {/* Left: Logo + selettore gioco — colonna allineata al menu Prodotti sotto */}
        <div
          className={`flex min-w-0 flex-1 md:flex-none items-center overflow-visible ${HEADER_GAME_ROW_GAP_CLASS}`}
        >
          <div className={HEADER_BRX_LOGO_COLUMN_CLASS}>
            <Link
              href="/"
              className={HEADER_BRX_LOGO_LINK_CLASS}
              aria-label={t('topBar.homeAria')}
            >
              <Image
                src={getCdnImageUrl('Logo%20Corto%20BRX.png')}
                alt="BRX"
                width={240}
                height={120}
                className={HEADER_BRX_LOGO_IMAGE_CLASS}
                priority
                unoptimized
              />
            </Link>
          </div>

          {/* Da tablet in su: selettore in header. Su mobile il gioco si sceglie dal menu hamburger. */}
          <div
            className={cn(
              'relative hidden h-full min-w-0 items-center md:flex',
              HEADER_GAME_TEXT_INSET_CLASS
            )}
            ref={gamesMenuRef}
          >
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

        {/* Center: tutte le icone in mezzo — form login (non autenticato) o menu nav (autenticato) */}
        <div className="flex min-w-0 flex-1 items-center justify-center gap-2">
          {!isAuthenticated ? (
            <>
            {/* Desktop: inline login form */}
            <form
              onSubmit={handleSubmit(onHeaderLogin)}
              className="hidden items-center gap-3 md:flex relative"
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
            {/* Mobile: "Accedi o Registrati" link */}
            <div className="flex shrink-0 items-center md:hidden">
              <Link 
                href="/login" 
                className="text-[13px] font-semibold tracking-wide text-white/95 hover:text-white transition-colors uppercase"
              >
                Accedi o Registrati
              </Link>
            </div>
            {/* Desktop: REGISTRATI button */}
            <div className="hidden shrink-0 md:block ml-3">
              <Button
                asChild
                className="btn-orange-glow rounded-full border px-5 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Link href="/login">{t('auth.registerUpper')}</Link>
              </Button>
            </div>
            </>
          ) : isAuthenticated ? (
            <>
              {/* Menu centrale: desktop = Account + Acquisti + Vendi + Scambi + Aste + Carrello. Mobile = Acquisti + Vendite + Scambi + Aste (carrello in FAB) */}
              <div className="flex flex-1 items-center justify-center gap-0.5 md:gap-2">
              {/* 1. Nome utente + icona — solo da tablet in su; su mobile è nel menu hamburger */}
              <div className="relative hidden items-center gap-2 md:flex" ref={accountMenuRef}>
                <button
                  type="button"
                  onClick={() => {
                    setAccountMenuOpen((o) => !o);
                    setAcquistiMenuOpen(false);
                  }}
                  className="flex items-center gap-1.5 rounded-lg px-1 py-1 text-white transition-opacity hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[#1D3160]"
                  aria-expanded={accountMenuOpen}
                  aria-haspopup="true"
                  aria-label={t('account.menuAria')}
                >
                  <span
                    className="flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-full"
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
                      className="h-[1.1rem] w-[1.1rem]"
                    >
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                      <circle cx="12" cy="7" r="4"></circle>
                    </svg>
                  </span>
                  <span className="hidden max-w-[6rem] shrink-0 text-[0.78rem] font-medium uppercase text-white md:block" title={user?.email ?? user?.name ?? undefined}>
                    {shortLabel}
                  </span>
                  <span className="hidden text-[0.78rem] text-white sm:inline shrink-0">({balance})</span>
                  <span
                    className={cn(
                      'ml-0.5 flex h-3.5 w-3.5 shrink-0 items-center justify-center text-[#FF7300] transition-transform',
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
                      <div className={ORANGE_GLASS_DIVIDER_CLASS} aria-hidden />
                      <Link
                        href="/scambi"
                        className="block py-2 text-sm font-medium uppercase tracking-wide text-white hover:underline"
                        onClick={() => setAccountMenuOpen(false)}
                      >
                        I MIEI SCAMBI
                      </Link>
                    </nav>
                  </div>
                )}
              </div>

              {/* 2. ACQUISTI — mobile e desktop: dropdown I miei acquisti + Lista desideri */}
              <div
                className="relative order-1 flex items-center md:order-2"
                ref={acquistiMenuRef}
              >
                {/* Mobile: dropdown Acquisti */}
                <MobileHeaderNavIcon
                  as="button"
                  onClick={() => {
                    setAcquistiMenuOpen((o) => !o);
                    setAccountMenuOpen(false);
                    setVendiMenuOpen(false);
                  }}
                  aria-label={t('purchases.menuAria')}
                  aria-expanded={acquistiMenuOpen}
                  menuOpen={acquistiMenuOpen}
                  showChevron
                  className="md:hidden"
                >
                  <ShoppingBag className={MOBILE_HEADER_ICON_CLASS} strokeWidth={2} aria-hidden />
                </MobileHeaderNavIcon>

                {/* Desktop: Dropdown Acquisti con I miei acquisti e Lista desideri */}
                <button
                  type="button"
                  onClick={() => {
                    setAcquistiMenuOpen((o) => !o);
                    setAccountMenuOpen(false);
                  }}
                  className="hidden items-center gap-1.5 rounded-lg px-1 py-1 text-white transition-opacity hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[#1D3160] md:flex"
                  aria-expanded={acquistiMenuOpen}
                  aria-haspopup="true"
                  aria-label={t('purchases.menuAria')}
                >
                  <span
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/5"
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
                      className="h-[0.9rem] w-[0.9rem]"
                    >
                      <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
                      <line x1="3" y1="6" x2="21" y2="6"></line>
                      <path d="M16 10a4 4 0 0 1-8 0"></path>
                    </svg>
                  </span>
                  <span className="hidden whitespace-nowrap text-[0.78rem] font-medium uppercase md:inline">
                    {t('purchases.title')}
                  </span>
                  <span
                    className="ml-0.5 flex h-3.5 w-3.5 shrink-0 items-center justify-center text-[#FF7300]"
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

              {/* 3. VENDITE — mobile e desktop: dropdown vendita */}
              <div
                className="relative order-2 flex items-center md:order-3"
                ref={vendiMenuRef}
              >
                <MobileHeaderNavIcon
                  as="button"
                  onClick={() => {
                    setVendiMenuOpen((o) => !o);
                    setAccountMenuOpen(false);
                    setAcquistiMenuOpen(false);
                  }}
                  aria-label={t('nav.sell')}
                  aria-expanded={vendiMenuOpen}
                  menuOpen={vendiMenuOpen}
                  showChevron
                  className="md:hidden"
                >
                  <Tag className={MOBILE_HEADER_ICON_CLASS} strokeWidth={2} aria-hidden />
                </MobileHeaderNavIcon>

                {/* Dropdown Vendi - Visibile sia mobile che desktop */}
                {vendiMenuOpen && (
                  <div
                    className={ORANGE_GLASS_MENU_CLASS}
                    role="menu"
                  >
                    <nav className="flex flex-col">
                      <Link
                        href="/vendi"
                        className="relative flex w-full items-center rounded-full bg-white/60 shadow-lg py-2 text-base font-semibold uppercase tracking-wide text-[#FF7300] hover:bg-white/70 hover:shadow-xl transition-all mx-0 my-2 backdrop-blur-md border border-white/30"
                        onClick={() => setVendiMenuOpen(false)}
                      >
                        <span className="absolute left-2 flex h-7 w-7 items-center justify-center rounded-full bg-[#FF7300] text-white opacity-90 animate-pulse shadow-sm">
                          <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                        </span>
                        <span className="w-full text-center">Vendi</span>
                      </Link>

                      <div className={ORANGE_GLASS_DIVIDER_CLASS} aria-hidden />
                      <Link
                        href="/ordini/vendite"
                        className="block py-2 text-sm font-medium uppercase tracking-wide text-white hover:underline"
                        onClick={() => setVendiMenuOpen(false)}
                      >
                        Le mie vendite
                      </Link>

                      <div className={ORANGE_GLASS_DIVIDER_CLASS} aria-hidden />
                      <Link
                        href="/account/oggetti"
                        className="block py-2 text-sm font-medium uppercase tracking-wide text-white hover:underline"
                        onClick={() => setVendiMenuOpen(false)}
                      >
                        {t('account.items')}
                      </Link>
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
                  className="hidden items-center gap-1.5 rounded-lg px-1 py-1 text-white transition-opacity hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-white/20 md:flex"
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
                  <span className="hidden whitespace-nowrap text-[0.78rem] font-medium uppercase lg:inline">
                    {t('nav.sell')}
                  </span>
                  <span className="hidden h-3.5 w-3.5 shrink-0 items-center justify-center text-[#FF7300] lg:flex">
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



              {/* TORNEI LIVE spostato nell'hamburger menu — rimosso dall'header desktop */}

              {/* 4. SCAMBI — mobile icona diretta; desktop con label */}
              <MobileHeaderNavIcon
                as="link"
                href="/scambi"
                aria-label={t('nav.trades')}
                className="group order-3 md:hidden"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#FF7300"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-6 w-6 shrink-0 transition-transform duration-[1200ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:rotate-180"
                  aria-hidden
                >
                  <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                  <path d="M3 3v5h5" />
                  <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
                  <path d="M21 21v-5h-5" />
                </svg>
              </MobileHeaderNavIcon>
              <Link
                href="/scambi"
                className="group order-3 hidden items-center gap-1.5 rounded-lg px-1 py-1 text-white transition-opacity hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[#1D3160] md:order-4 md:flex"
                aria-label={t('nav.trades')}
              >
                <span
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/5"
                  aria-hidden
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#FF7300"
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-[0.9rem] w-[0.9rem] transition-transform duration-[1200ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:rotate-180"
                  >
                    <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                    <path d="M3 3v5h5" />
                    <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
                    <path d="M21 21v-5h-5" />
                  </svg>
                </span>
                <span className="hidden whitespace-nowrap text-[0.78rem] font-medium uppercase md:inline">
                  {t('nav.trades')}
                </span>
              </Link>

              {/* 5. ASTE — mobile icona diretta; desktop con label */}
              <MobileHeaderNavIcon
                as="link"
                href="/aste"
                aria-label={t('nav.auctions')}
                className="group relative order-4 md:hidden"
              >
                <AuctionGavelIcon className="h-6 w-6" stroke="#FF7300" animated />
              </MobileHeaderNavIcon>
              <Link
                href="/aste"
                className="group order-4 hidden items-center gap-1.5 rounded-lg px-1 py-1 text-white transition-opacity hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[#1D3160] md:order-5 md:flex"
                aria-label={t('nav.auctions')}
              >
                <span
                  className="relative flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/5"
                  aria-hidden
                >
                  <AuctionGavelIcon className="h-[0.9rem] w-[0.9rem]" stroke="#FF7300" animated />
                </span>
                <span className="hidden whitespace-nowrap text-[0.78rem] font-medium uppercase md:inline">
                  {t('nav.auctions')}
                </span>
              </Link>

              {/* 6. Carrello — solo desktop; su mobile FAB in basso a destra */}
              <div className="order-5 hidden md:order-6 md:block">
                <CartDropdown />
              </div>
              </div>
            </>
          ) : null}
        </div>
        {/* Destra: notifiche, portale tornei (esterno), hamburger */}
        <div className="ml-1 flex flex-1 justify-end md:flex-none md:justify-start items-center gap-2 md:gap-2.5" aria-label={t('header.menuAria')}>
          {isAuthenticated ? <NotificationBell /> : null}
          <TournamentsPortalLink variant="header" />
          <HamburgerMenu />
        </div>
      </div>
    </>
  );
}
