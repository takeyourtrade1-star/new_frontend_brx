'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { useClickOutside } from '@/hooks/useClickOutside';
import { DrawerAuthForm } from '@/components/layout/header/DrawerAuthForm';
import { DrawerLanguage } from '@/components/layout/header/DrawerLanguage';
import { FLAG_BASE, LANG_TO_COUNTRY } from '@/components/layout/header/lang-flags';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Menu, X, ChevronDown, LogOut, UserCircle, MessageSquare, Wallet, Package, ShoppingBag, ShoppingCart, Heart, RefreshCw, Search, Users, Scale, FileText, HelpCircle, ScanLine, QrCode } from 'lucide-react';
import { ScambiIcon } from '@/components/ui/ScambiIcon';
import { useCartStore } from '@/lib/stores/cart-store';
import { cn } from '@/lib/utils';
import { useTheme } from '@/lib/theme-context';
import { useAuthStore } from '@/lib/stores/auth-store';
import { useLogout, useLogin } from '@/lib/hooks/use-auth';
import { useLanguage, LANGUAGE_NAMES } from '@/lib/contexts/LanguageContext';
import { headerLoginSchema, type HeaderLoginValues } from '@/lib/validations/auth';
import { Button } from '@/components/ui/button';
import { useGame, GAME_OPTIONS } from '@/lib/contexts/GameContext';
import type { GameSlug } from '@/lib/contexts/GameContext';
import { getCdnImageUrl } from '@/lib/config';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { AnimatePresence, motion } from 'framer-motion';
import { QRCodeSVG } from 'qrcode.react';
import { TournamentsPortalLink } from './TournamentsPortalButton';
import { BetaBadge } from '@/components/ui/BetaBadge';

const GAME_HOME_PATH: Record<GameSlug, string> = {
  mtg: '/home/magic',
  pokemon: '/home/pokemon',
  op: '/home/one-piece',
};


const navLinkClass = 'flex items-center gap-4 px-5 py-2.5 text-[13px] font-normal text-gray-700 transition-colors hover:bg-gray-50 active:bg-gray-100';

export function HamburgerMenu() {
  const { t } = useTranslation();
  const router = useRouter();
  const { selectedGame, setSelectedGame, gameDisplayName } = useGame();
  const [open, setOpen] = useState(false);
  const [scannerQrOpen, setScannerQrOpen] = useState(false);
  const [scannerQrUrl, setScannerQrUrl] = useState('');
  const { theme, toggleTheme } = useTheme();
  const { selectedLang, setSelectedLang, availableLangs } = useLanguage();
  const [linguaDropdownOpen, setLinguaDropdownOpen] = useState(false);
  const [gameDropdownOpen, setGameDropdownOpen] = useState(false);
  const [accountDropdownOpen, setAccountDropdownOpen] = useState(false);
  const linguaDropdownRef = useRef<HTMLDivElement>(null);
  const gameMenuRef = useRef<HTMLDivElement>(null);
  const accountDropdownRef = useRef<HTMLDivElement>(null);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const cartItems = useCartStore((s) => s.items);
  const cartCount = useMemo(
    () => cartItems.reduce((acc, item) => acc + item.quantity, 0),
    [cartItems],
  );
  const setFlashMessage = useAuthStore((s) => s.setFlashMessage);
  const logoutMutation = useLogout();
  const loginMutation = useLogin();
  const [loginError, setLoginError] = useState<string | null>(null);
  const fetchUser = useAuthStore((s) => s.fetchUser);

  const navItems = useMemo(
    () => [
      { label: t('nav.cameraMatch') ?? 'CameraMatch', href: '/scanner', icon: ScanLine, badge: 'beta' as const },
      { label: t('nav.advancedSinglesSearch') ?? 'Ricerca avanzata singole', href: '/search/advanced', icon: Search, badge: undefined },
      { label: t('nav.userSearch'), href: '/search/user', icon: Users, badge: undefined },
    ],
    [t]
  );

  const legalItems = useMemo(
    () => [
      { label: t('nav.legalNorms'), href: '/legal/norme', icon: Scale },
      { label: t('nav.legalTerms'), href: '/legal/condizioni', icon: FileText },
    ],
    [t]
  );

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<HeaderLoginValues>({
    resolver: zodResolver(headerLoginSchema),
    defaultValues: { username: '', password: '' },
  });

  const currentLangLabel = (LANGUAGE_NAMES[selectedLang] ?? selectedLang).toUpperCase();
  const currentCountryCode = LANG_TO_COUNTRY[selectedLang] ?? selectedLang;
  const isDark = theme === 'dark';

  const onDrawerLogin = async (data: HeaderLoginValues) => {
    setFlashMessage(null);
    setLoginError(null);
    try {
      const input = data.username.trim();
      const isEmail = input.includes('@');
      const credentials = isEmail
        ? { email: input, password: data.password }
        : { username: input, password: data.password };
      const result = await loginMutation.mutateAsync(credentials);
      if (result.mfaRequired) {
        setOpen(false);
        reset();
        router.replace('/login/verify-mfa');
        return;
      }
      setFlashMessage(t('auth.loginSuccess'));
      reset();
      setOpen(false);
    } catch (err: unknown) {
      const e = err as {
        response?: { data?: { detail?: { msg?: string }[]; message?: string } };
        message?: string;
      };
      const errorMessage =
        e?.response?.data?.detail?.[0]?.msg ||
        e?.response?.data?.message ||
        e?.message ||
        t('auth.loginErrorGeneric');
      setLoginError(errorMessage);
    }
  };

  const handleLogout = async () => {
    try {
      await logoutMutation.mutateAsync();
      setOpen(false);
    } catch (error) {
      console.error('Errore durante il logout:', error);
    }
  };

  useEffect(() => {
    if (!scannerQrOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setScannerQrOpen(false);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [scannerQrOpen]);

  useClickOutside(linguaDropdownRef, () => setLinguaDropdownOpen(false), linguaDropdownOpen);
  useClickOutside(gameMenuRef, () => setGameDropdownOpen(false), gameDropdownOpen);
  useClickOutside(accountDropdownRef, () => setAccountDropdownOpen(false), accountDropdownOpen);

  useEffect(() => {
    if (!open) {
      setGameDropdownOpen(false);
      setAccountDropdownOpen(false);
    }
  }, [open]);

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
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          'relative z-[10001] flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-white transition-opacity hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[#1D3160] md:h-12 md:w-12',
          open && 'pointer-events-none invisible'
        )}
        aria-label={t('common.openMenu')}
        aria-expanded={open}
      >
        <Menu className="h-6 w-6 shrink-0 md:h-8 md:w-8" strokeWidth={2.25} aria-hidden />
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[9999] bg-black/40 transition-opacity"
          aria-hidden
          onClick={() => setOpen(false)}
        />
      )}

      <div
        className={cn(
          'fixed right-0 top-0 z-[10000] flex h-full w-[min(100%,340px)] max-w-[92vw] flex-col bg-white shadow-[-8px_0_32px_rgba(0,0,0,0.12)] transition-transform duration-300 ease-out',
          open ? 'translate-x-0' : 'translate-x-full'
        )}
        role="dialog"
        aria-modal="true"
        aria-label={t('common.menuDialog')}
      >
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-gray-100 px-5 py-3">
          <span className="text-[11px] font-semibold uppercase tracking-widest text-gray-400">Menu</span>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="rounded-full p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700 focus:outline-none"
            aria-label={t('common.closeMenu')}
          >
            <X className="h-5 w-5" strokeWidth={2} />
          </button>
        </div>

        <nav className="flex min-h-0 flex-1 flex-col">
          <div className="flex-1 overflow-y-auto pb-2">
          {/* GIOCHI: sempre in cima, solo MTG (come desktop) */}
          <div className="relative border-b border-orange-100 md:hidden" ref={gameMenuRef}>
            <p className="px-5 pb-1.5 pt-4 text-[10px] font-semibold uppercase tracking-[0.14em] text-gray-500">
              {t('game.label')}
            </p>
            <div className="px-5 pb-4">
              <button
                type="button"
                onClick={() => setGameDropdownOpen((v) => !v)}
                className="flex w-full items-center justify-between gap-2 rounded border border-gray-300 bg-white px-3 py-2.5 text-left shadow-sm transition-colors hover:border-gray-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1D3160]/25"
                aria-expanded={gameDropdownOpen}
                aria-haspopup="listbox"
                aria-label={t('game.selectGameAria')}
              >
                <span className="min-w-0 flex-1 truncate text-[12px] font-semibold uppercase leading-snug tracking-wide text-[#1D3160]">
                  {selectedGame ? gameDisplayName(selectedGame) : t('game.selectGame')}
                </span>
                <ChevronDown
                  className={cn('h-5 w-5 shrink-0 text-[#1D3160] transition-transform', gameDropdownOpen && 'rotate-180')}
                  aria-hidden
                />
              </button>
              {gameDropdownOpen && (
                <ul
                  className="mt-1 max-h-56 overflow-auto rounded border border-gray-200 bg-white py-1 shadow-md"
                  role="listbox"
                  aria-label={t('game.gamesListAria')}
                >
                  {GAME_OPTIONS.filter(opt => opt.value === 'mtg').map((opt) => {
                    const logoSrc = getCdnImageUrl('loghi-giochi/magic.png');
                    const active = selectedGame === opt.value;
                    return (
                      <li key={opt.value} role="option" aria-selected={active}>
                        <button
                          type="button"
                          className={cn(
                            'flex w-full items-center gap-2 px-3 py-2.5 text-left transition-colors hover:bg-gray-50',
                            active && 'bg-orange-50/80'
                          )}
                          onClick={() => {
                            setSelectedGame(opt.value);
                            setGameDropdownOpen(false);
                            router.push(GAME_HOME_PATH[opt.value]);
                            setOpen(false);
                          }}
                        >
                          <Image
                            src={logoSrc}
                            alt={opt.label}
                            width={88}
                            height={28}
                            className="h-6 w-14 shrink-0 object-contain object-left"
                            unoptimized
                          />
                          <span className="min-w-0 flex-1 text-[11px] font-semibold uppercase leading-tight tracking-wide text-[#1D3160]">
                            {gameDisplayName(opt.value)}
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>

          {!isAuthenticated && (
            <DrawerAuthForm
              onSubmit={handleSubmit(onDrawerLogin)}
              register={register}
              errors={errors}
              submitting={loginMutation.isPending}
              loginError={loginError}
              onNavigate={() => setOpen(false)}
              t={t}
            />
          )}

          <TournamentsPortalLink variant="drawer" onNavigate={() => setOpen(false)} />

          {isAuthenticated ? (
            <Link
              href="/cart"
              onClick={() => setOpen(false)}
              className={cn(navLinkClass, 'md:hidden font-medium text-[#1D3160]')}
            >
              <ShoppingCart className="h-6 w-6 shrink-0 text-[#1D3160]" strokeWidth={1.5} aria-hidden />
              <span className="flex-1">{t('nav.cart')}</span>
              {cartCount > 0 ? (
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[10px] font-bold text-white">
                  {cartCount > 99 ? '99+' : cartCount}
                </span>
              ) : null}
            </Link>
          ) : null}

          {isAuthenticated && (
            <div className="relative md:hidden" ref={accountDropdownRef}>
              <p className="px-5 pt-3 pb-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-gray-400">{t('account.account')}</p>
              <button
                type="button"
                onClick={() => setAccountDropdownOpen((v) => !v)}
                className="flex w-full items-center justify-between px-5 py-2.5 text-left text-[13px] font-medium text-[#1D3160] transition-colors hover:bg-gray-50/80 focus:outline-none"
                aria-expanded={accountDropdownOpen}
                aria-haspopup="true"
              >
                <div className="flex items-center gap-3">
                  <UserCircle className="h-6 w-6 shrink-0 text-[#1D3160]/50" strokeWidth={1.5} aria-hidden />
                  <span>{t('account.account')}</span>
                </div>
                <ChevronDown
                  className={cn('h-4 w-4 shrink-0 text-gray-400 transition-transform', accountDropdownOpen && 'rotate-180')}
                  aria-hidden
                />
              </button>
              <div
                className={cn(
                  'overflow-hidden transition-all duration-250 ease-out bg-gray-50/60',
                  accountDropdownOpen ? 'max-h-[400px] opacity-100' : 'max-h-0 opacity-0'
                )}
              >
                {[
                  { href: '/account', icon: UserCircle, label: t('account.account') },
                  { href: '/account/messaggi', icon: MessageSquare, label: t('account.messages') },
                  { href: '/account/credito', icon: Wallet, label: t('account.credit') },
                  { href: '/account/oggetti', icon: Package, label: t('account.items') },
                  { href: '/ordini/acquisti', icon: ShoppingBag, label: t('purchases.myPurchases') },
                  { href: '/account/lista-desideri', icon: Heart, label: t('purchases.wishlist') },
                  { href: '/account/sincronizzazione', icon: RefreshCw, label: t('account.sync') },
                  { href: '/scambi', icon: ScambiIcon, label: 'I MIEI SCAMBI' },
                ].map(({ href, icon: Icon, label }) => (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-3 pl-12 pr-5 py-2 text-[11px] font-medium text-[#1D3160]/80 transition-colors hover:bg-gray-100/60"
                  >
                    <Icon className="h-4 w-4 shrink-0 text-[#1D3160]/40" strokeWidth={1.5} aria-hidden />
                    {label}
                  </Link>
                ))}
              </div>
              <div className="mx-5 my-1 h-px bg-gray-100" aria-hidden />
            </div>
          )}

          {/* Nav items — CameraMatch: su desktop apre popup QR verso /scanner sul telefono */}
          {navItems.map((item) => {
            const IconComponent = item.icon;
            const isCameraMatch = item.href === '/scanner';
            if (isCameraMatch) {
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={(e) => {
                    if (
                      typeof window !== 'undefined' &&
                      window.matchMedia('(min-width: 768px)').matches
                    ) {
                      e.preventDefault();
                      setScannerQrUrl(`${window.location.origin}/scanner`);
                      setOpen(false);
                      setScannerQrOpen(true);
                      return;
                    }
                    setOpen(false);
                  }}
                  className={cn(
                    navLinkClass,
                    'font-medium text-[#1D3160] hover:bg-blue-50'
                  )}
                  aria-label={t('nav.cameraMatchAria')}
                >
                  <IconComponent
                    className="h-6 w-6 shrink-0 text-[#1D3160]"
                    strokeWidth={1.5}
                    aria-hidden
                  />
                  <span className="flex flex-1 items-center gap-2">
                    {item.label}
                    {item.badge === 'beta' && <BetaBadge variant="nav" />}
                  </span>
                </Link>
              );
            }
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={navLinkClass}
              >
                <IconComponent
                  className="h-6 w-6 shrink-0 text-gray-400"
                  strokeWidth={1.5}
                  aria-hidden
                />
                <span className="flex flex-1 items-center gap-2">
                  {item.label}
                  {item.badge === 'beta' && <BetaBadge variant="nav" />}
                </span>
              </Link>
            );
          })}

          <div className="h-px bg-gray-100" aria-hidden />

          {/* Impostazioni */}
          <div>
            {/* Modalità scura */}
            <div className="flex items-center justify-between px-5 py-3">
              <span className="text-[13px] font-normal text-gray-700">Dark Mode</span>
              <button
                type="button"
                role="switch"
                aria-checked={false}
                disabled
                className="relative h-5 w-9 shrink-0 rounded-full bg-gray-200 cursor-not-allowed opacity-40 focus:outline-none"
              >
                <span className="absolute left-0.5 top-1/2 h-4 w-4 -translate-y-1/2 rounded-full bg-white shadow" />
              </button>
            </div>

            {/* Aiuto */}
            <Link href="/aiuto" onClick={() => setOpen(false)} className={navLinkClass}>
              <HelpCircle className="h-6 w-6 shrink-0 text-gray-400" strokeWidth={1.5} aria-hidden />
              {t('common.help')}
            </Link>

            {/* Lingua */}
            <DrawerLanguage
              containerRef={linguaDropdownRef}
              isOpen={linguaDropdownOpen}
              onToggle={() => setLinguaDropdownOpen((v) => !v)}
              onSelectLang={(lang) => { setSelectedLang(lang); setLinguaDropdownOpen(false); }}
              currentCountryCode={currentCountryCode}
              selectedLang={selectedLang}
              availableLangs={availableLangs}
              navLinkClass={navLinkClass}
              t={t}
            />
          </div>

          {/* Legal — in fondo, stile secondario */}
          <div className="h-px bg-gray-100" aria-hidden />
          {legalItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className="flex items-center gap-3.5 px-5 py-2.5 text-[12px] font-normal text-gray-400 transition-colors hover:bg-gray-50 hover:text-gray-600"
            >
              <item.icon className="h-4 w-4 shrink-0 text-gray-300" strokeWidth={1.5} aria-hidden />
              {item.label}
            </Link>
          ))}
          </div>

          {isAuthenticated && (
            <div className="shrink-0 border-t border-gray-100 bg-white">
              <button
                type="button"
                onClick={handleLogout}
                disabled={logoutMutation.isPending}
                className="flex w-full items-center justify-center gap-2 px-5 py-3 text-[13px] font-medium text-red-500 transition-colors hover:bg-red-50/60 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <LogOut className="h-6 w-6 shrink-0" strokeWidth={1.5} aria-hidden />
                <span>{logoutMutation.isPending ? t('auth.logoutPending') : t('auth.logout')}</span>
              </button>
            </div>
          )}
        </nav>
      </div>

      {typeof document !== 'undefined' &&
        createPortal(
          <AnimatePresence>
            {scannerQrOpen && scannerQrUrl ? (
              <motion.div
                key="scanner-qr-modal"
                className="fixed inset-0 z-[10050] flex items-center justify-center p-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <motion.div
                  className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                  onClick={() => setScannerQrOpen(false)}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                />
                <motion.div
                  className="relative w-full max-w-sm rounded-2xl border border-gray-200 bg-white p-6 shadow-2xl"
                  initial={{ y: 20, opacity: 0, scale: 0.95 }}
                  animate={{ y: 0, opacity: 1, scale: 1 }}
                  exit={{ y: 10, opacity: 0, scale: 0.98 }}
                  transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                  role="dialog"
                  aria-modal="true"
                  aria-labelledby="scanner-qr-title"
                >
                  <button
                    type="button"
                    onClick={() => setScannerQrOpen(false)}
                    className="absolute right-3 top-3 inline-flex h-8 w-8 items-center justify-center rounded-full text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
                    aria-label={t('common.close')}
                  >
                    <X className="h-5 w-5" />
                  </button>

                  <div className="text-center">
                    <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-orange-100">
                      <QrCode className="h-6 w-6 text-[#FF7300]" aria-hidden />
                    </div>
                    <div className="flex flex-wrap items-center justify-center gap-2">
                      <h3 id="scanner-qr-title" className="text-lg font-bold text-gray-900">
                        {t('nav.cameraMatchQrTitle')}
                      </h3>
                      <BetaBadge variant="nav" />
                    </div>
                    <p className="mt-1 text-sm text-gray-500">{t('nav.cameraMatchQrSubtitle')}</p>
                    <p className="mt-2 text-xs leading-relaxed text-gray-400">{t('scanner.betaNotice')}</p>
                  </div>

                  <div className="mt-5 flex flex-col items-center gap-4">
                    <div className="rounded-xl border-2 border-gray-100 bg-white p-4 shadow-sm">
                      <QRCodeSVG
                        value={scannerQrUrl}
                        size={200}
                        level="M"
                        includeMargin={false}
                        bgColor="#ffffff"
                        fgColor="#1f2937"
                      />
                    </div>
                    <p className="text-center text-xs font-medium uppercase tracking-wide text-[#1D3160]">
                      {t('nav.cameraMatch')}
                    </p>
                  </div>

                  <div className="mt-5 border-t border-gray-100 pt-4 text-center">
                    <p className="text-xs text-gray-500">{t('nav.cameraMatchQrHint')}</p>
                  </div>
                </motion.div>
              </motion.div>
            ) : null}
          </AnimatePresence>,
          document.body
        )}
    </>
  );
}
