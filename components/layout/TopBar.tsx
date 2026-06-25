'use client';

import { useState, useEffect, useRef } from 'react';
import { useClickOutside } from '@/hooks/useClickOutside';
import {
  AccountMenuPanel,
  AcquistiMenuPanel,
  VendiMenuPanel,
  GamesMenuPanel,
} from '@/components/layout/header/HeaderDropdownPanels';
import { HeaderLoginForm } from '@/components/layout/header/HeaderLoginForm';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import dynamic from 'next/dynamic';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ChevronDown } from 'lucide-react';
import { TournamentsPortalLink } from './TournamentsPortalButton';
import { CartDropdown } from './CartDropdown';
import { MobileHeaderNavIcon, MOBILE_HEADER_ICON_CLASS } from './MobileHeaderNavIcon';
import { NotificationBell } from '@/components/feature/notifiche/NotificationBell';
import { Button } from '@/components/ui/button';
import { cn, formatEuroNoSpace } from '@/lib/utils';
import { useAuthStore } from '@/lib/stores/auth-store';
import { parseAuthError } from '@/lib/api/auth-error';
import { useLogin } from '@/lib/hooks/use-auth';
import { headerLoginSchema, type HeaderLoginValues } from '@/lib/validations/auth';
import { getCdnImageUrl } from '@/lib/config';
import { useGame } from '@/lib/contexts/GameContext';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { LOCALE_TO_INTL } from '@/lib/i18n/locales';
import type { UiLocale } from '@/lib/i18n/locales';
import { AuctionGavelIcon } from '@/components/ui/AuctionGavelIcon';
import { PurchasesBagIcon } from '@/components/ui/PurchasesBagIcon';
import { SalesTagIcon } from '@/components/ui/SalesTagIcon';
import { ProfileSaluteIcon } from '@/components/ui/ProfileSaluteIcon';
import { FEATURES } from '@/lib/config/features';
import {
  HEADER_BRX_LOGO_COLUMN_CLASS,
  HEADER_BRX_LOGO_IMAGE_CLASS,
  HEADER_BRX_LOGO_LINK_CLASS,
  HEADER_GAME_ROW_GAP_CLASS,
  HEADER_GAME_TEXT_INSET_CLASS,
} from '@/components/layout/headerBrxColumn';
import { ScambiVideoIntro } from '@/components/feature/scambi/ScambiVideoIntro';



const HamburgerMenu = dynamic(
  () => import('./HamburgerMenu').then((mod) => mod.HamburgerMenu),
  {
    ssr: false,
    loading: () => (
      <div className="md:hidden" aria-hidden>
        <div className={MOBILE_HEADER_ICON_CLASS} />
      </div>
    ),
  }
);

export function TopBar() {
  const { t, locale } = useTranslation();
  const router = useRouter();
  const { selectedGame, setSelectedGame, gameDisplayName } = useGame();
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const [acquistiMenuOpen, setAcquistiMenuOpen] = useState(false);
  const [vendiMenuOpen, setVendiMenuOpen] = useState(false);
  const [gamesMenuOpen, setGamesMenuOpen] = useState(false);
  const [scambiIntroOpen, setScambiIntroOpen] = useState(false);
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
    } catch (err: unknown) {
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

  useClickOutside(accountMenuRef, () => setAccountMenuOpen(false), accountMenuOpen);
  useClickOutside(acquistiMenuRef, () => setAcquistiMenuOpen(false), acquistiMenuOpen);
  useClickOutside(vendiMenuRef, () => setVendiMenuOpen(false), vendiMenuOpen);
  // FE-REV-005: il menu giochi mancava del listener click-outside presente sugli altri menu.
  useClickOutside(gamesMenuRef, () => setGamesMenuOpen(false), gamesMenuOpen);

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
      {scambiIntroOpen && <ScambiVideoIntro onClose={() => setScambiIntroOpen(false)} />}
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
              <GamesMenuPanel onClose={() => setGamesMenuOpen(false)} onSelect={setSelectedGame} t={t} />
            )}
          </div>
        </div>

        {/* Center: tutte le icone in mezzo — form login (non autenticato) o menu nav (autenticato) */}
        <div className="flex min-w-0 flex-1 items-center justify-center gap-2">
          {!isAuthenticated ? (
            <>
            {/* Desktop: inline login form */}
            <HeaderLoginForm
              onSubmit={handleSubmit(onHeaderLogin)}
              register={register}
              errors={errors}
              submitting={loginMutation.isPending}
              t={t}
            />
            {/* Mobile: "Accedi o Registrati" link */}
            <div className="flex shrink-0 items-center md:hidden">
              <Link
                href="/registrati"
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
                <Link href="/registrati">{t('auth.registerUpper')}</Link>
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
                  className="group flex items-center gap-1.5 rounded-lg px-1 py-1 text-white transition-opacity hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[#1D3160]"
                  aria-expanded={accountMenuOpen}
                  aria-haspopup="true"
                  aria-label={t('account.menuAria')}
                >
                  <span
                    className="flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-full"
                    aria-hidden
                  >
                    {/* Icona profilo con saluto militare all'hover */}
                    <ProfileSaluteIcon
                      className="h-[1.1rem] w-[1.1rem]"
                      stroke="#FF7300"
                      strokeWidth={2}
                      animated
                    />
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
                  <AccountMenuPanel onClose={() => setAccountMenuOpen(false)} t={t} />
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
                  className="group md:hidden"
                >
                  <PurchasesBagIcon className={MOBILE_HEADER_ICON_CLASS} stroke="#FF7300" strokeWidth={2} animated />
                </MobileHeaderNavIcon>

                {/* Desktop: Dropdown Acquisti con I miei acquisti e Lista desideri */}
                <button
                  type="button"
                  onClick={() => {
                    setAcquistiMenuOpen((o) => !o);
                    setAccountMenuOpen(false);
                  }}
                  className="group hidden items-center gap-1.5 rounded-lg px-1 py-1 text-white transition-opacity hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[#1D3160] md:flex"
                  aria-expanded={acquistiMenuOpen}
                  aria-haspopup="true"
                  aria-label={t('purchases.menuAria')}
                >
                  <span
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/5"
                    aria-hidden
                  >
                    <PurchasesBagIcon className="h-[0.9rem] w-[0.9rem]" stroke="#FF7300" strokeWidth={2} animated />
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
                  <AcquistiMenuPanel onClose={() => setAcquistiMenuOpen(false)} t={t} />
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
                  className="group md:hidden"
                >
                  <SalesTagIcon className={MOBILE_HEADER_ICON_CLASS} stroke="#FF7300" strokeWidth={2} animated />
                </MobileHeaderNavIcon>

                {/* Dropdown Vendi - Visibile sia mobile che desktop */}
                {vendiMenuOpen && (
                  <VendiMenuPanel onClose={() => setVendiMenuOpen(false)} t={t} />
                )}

                {/* Tasto Vendi visibile solo su desktop - ora apre un dropdown */}
                <button
                  type="button"
                  onClick={() => {
                    setVendiMenuOpen((o) => !o);
                    setAccountMenuOpen(false);
                    setAcquistiMenuOpen(false);
                  }}
                  className="group hidden items-center gap-1.5 rounded-lg px-1 py-1 text-white transition-opacity hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-white/20 md:flex"
                  aria-expanded={vendiMenuOpen}
                  aria-haspopup="true"
                  aria-label={t('nav.sell')}
                >
                  <span
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/5"
                    aria-hidden
                  >
                    <SalesTagIcon className="h-[0.9rem] w-[0.9rem]" stroke="#FF7300" strokeWidth={2} animated />
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
                as="button"
                onClick={() => setScambiIntroOpen(true)}
                aria-label={t('nav.trades')}
                aria-expanded={false}
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
              <button
                type="button"
                onClick={() => setScambiIntroOpen(true)}
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
              </button>

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
          {!scambiIntroOpen && <HamburgerMenu />}
        </div>
      </div>
    </>
  );
}
