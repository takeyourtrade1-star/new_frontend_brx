'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Menu, X, ChevronDown, LogOut, User, Key, Eye, EyeOff, UserCircle, MessageSquare, Wallet, Package, ShoppingBag, Heart, RefreshCw, Search, Users, Scale, FileText, HelpCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTheme } from '@/lib/theme-context';
import { useAuthStore } from '@/lib/stores/auth-store';
import { useLogout, useLogin } from '@/lib/hooks/use-auth';
import { useLanguage, LANGUAGE_NAMES } from '@/lib/contexts/LanguageContext';
import { headerLoginSchema, type HeaderLoginValues } from '@/lib/validations/auth';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useGame, GAME_OPTIONS } from '@/lib/contexts/GameContext';
import type { GameSlug } from '@/lib/contexts/GameContext';
import { getCdnImageUrl } from '@/lib/config';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { translateZodMessage } from '@/lib/i18n/translateZodMessage';

const GAME_HOME_PATH: Record<GameSlug, string> = {
  mtg: '/home/magic',
  pokemon: '/home/pokemon',
  op: '/home/one-piece',
};

const FLAG_BASE = 'https://flagcdn.com';

const LANG_TO_COUNTRY: Record<string, string> = {
  en: 'gb',
  de: 'de',
  es: 'es',
  fr: 'fr',
  it: 'it',
  pt: 'pt',
};

const navLinkClass = 'flex items-center gap-3 px-5 py-3.5 text-[13px] font-semibold uppercase tracking-wide text-[#1D3160] transition-colors hover:bg-gray-50';

export function HamburgerMenu() {
  const { t } = useTranslation();
  const router = useRouter();
  const { selectedGame, setSelectedGame, gameDisplayName } = useGame();
  const [open, setOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const { selectedLang, setSelectedLang, availableLangs } = useLanguage();
  const [linguaDropdownOpen, setLinguaDropdownOpen] = useState(false);
  const [gameDropdownOpen, setGameDropdownOpen] = useState(false);
  const [accountDropdownOpen, setAccountDropdownOpen] = useState(false);
  const [devMode, setDevMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('dev-mode') === 'true';
    }
    return false;
  });
  const linguaDropdownRef = useRef<HTMLDivElement>(null);
  const gameMenuRef = useRef<HTMLDivElement>(null);
  const accountDropdownRef = useRef<HTMLDivElement>(null);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated) || devMode;
  const setFlashMessage = useAuthStore((s) => s.setFlashMessage);
  const mockLogin = useAuthStore((s) => s.mockLogin);
  const logout = useAuthStore((s) => s.logout);
  const logoutMutation = useLogout();
  const loginMutation = useLogin();
  const [loginError, setLoginError] = useState<string | null>(null);

  const menuItems = useMemo(
    () =>
      [
        { label: t('nav.advancedSinglesSearch') ?? 'Ricerca avanzata singole', href: '/search/advanced', icon: Search },
        { label: t('nav.userSearch'), href: '/search/user', icon: Users },
        { label: t('nav.legalNorms'), href: '/legal/norme', icon: Scale },
        { label: t('nav.legalTerms'), href: '/legal/condizioni', icon: FileText },
      ] as const,
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
      if (devMode) {
        // If in dev mode, just turn it off
        setDevMode(false);
        localStorage.removeItem('dev-mode');
        setOpen(false);
      } else {
        await logoutMutation.mutateAsync();
        setOpen(false);
      }
    } catch (error) {
      console.error('Errore durante il logout:', error);
    }
  };

  const toggleDevMode = () => {
    const newDevMode = !devMode;
    setDevMode(newDevMode);
    localStorage.setItem('dev-mode', String(newDevMode));
    
    if (newDevMode) {
      // Activate dev mode with mock user
      mockLogin();
    } else {
      // Deactivate dev mode - logout
      logout();
    }
    setOpen(false);
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
    if (!gameDropdownOpen) return;
    const onClickOutside = (e: MouseEvent) => {
      if (gameMenuRef.current && !gameMenuRef.current.contains(e.target as Node)) {
        setGameDropdownOpen(false);
      }
    };
    document.addEventListener('click', onClickOutside);
    return () => document.removeEventListener('click', onClickOutside);
  }, [gameDropdownOpen]);

  useEffect(() => {
    if (!accountDropdownOpen) return;
    const onClickOutside = (e: MouseEvent) => {
      if (accountDropdownRef.current && !accountDropdownRef.current.contains(e.target as Node)) {
        setAccountDropdownOpen(false);
      }
    };
    document.addEventListener('click', onClickOutside);
    return () => document.removeEventListener('click', onClickOutside);
  }, [accountDropdownOpen]);

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

  const inputUnderline =
    'h-9 border-0 border-b border-gray-300 bg-transparent pl-8 pr-1 text-sm text-[#0F172A] shadow-none rounded-none ring-0 focus-visible:ring-0 focus-visible:border-[#1D3160] focus-visible:outline-none';

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          'relative z-[10001] flex h-14 w-14 shrink-0 items-center justify-center rounded-lg text-white transition-opacity hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[#1D3160] md:h-12 md:w-12',
          open && 'pointer-events-none invisible'
        )}
        aria-label={t('common.openMenu')}
        aria-expanded={open}
      >
        <Menu className="h-10 w-10 shrink-0 md:h-8 md:w-8" strokeWidth={2.5} aria-hidden />
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
        {/* Header: solo chiusura a destra */}
        <div
          className="flex shrink-0 items-center justify-end border-b border-gray-200 px-3 py-2.5"
        >
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="rounded p-1.5 text-[#1D3160] transition-opacity hover:opacity-70 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1D3160]/30"
            aria-label={t('common.closeMenu')}
          >
            <X className="h-7 w-7" strokeWidth={2} />
          </button>
        </div>

        {/* Dev Mode Banner */}
        {devMode && (
          <div className="shrink-0 bg-yellow-400 px-4 py-2 text-center">
            <p className="text-[11px] font-bold uppercase tracking-wide text-yellow-900">
              ⚠️ Dev Mode Active
            </p>
            <p className="text-[10px] text-yellow-800">
              Viewing as authenticated
            </p>
          </div>
        )}

        <nav className="flex min-h-0 flex-1 flex-col">
          <div className="flex-1 overflow-y-auto pb-2">
          {/* GIOCHI: sempre in cima, solo MTG (come desktop) */}
          <div className="relative border-b border-gray-100 md:hidden" ref={gameMenuRef}>
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
            <div className="border-b border-gray-100 px-5 py-5">
              <form onSubmit={handleSubmit(onDrawerLogin)} className="space-y-5" noValidate>
                <div>
                  <div className="mb-1 flex items-center justify-between gap-2">
                    <span className="text-[11px] font-bold uppercase tracking-wide text-[#1D3160]">
                      {t('auth.usernameOrEmail')}
                    </span>
                    <Link
                      href="/recupera-credenziali"
                      onClick={() => setOpen(false)}
                      className="text-[10px] font-semibold uppercase text-[#1D3160] underline-offset-2 hover:underline"
                    >
                      {t('auth.forgot')}
                    </Link>
                  </div>
                  <div className="relative">
                    <User
                      className="pointer-events-none absolute left-0 top-1/2 h-4 w-4 -translate-y-1/2 text-[#1D3160]"
                      aria-hidden
                    />
                    <Input
                      type="text"
                      autoComplete="email"
                      placeholder=""
                      className={cn(inputUnderline, errors.username && 'border-red-500')}
                      {...register('username')}
                    />
                  </div>
                  {errors.username && (
                    <p className="mt-1 text-[11px] text-red-600">
                      {translateZodMessage(errors.username.message, t)}
                    </p>
                  )}
                </div>

                <div>
                  <div className="mb-1 flex items-center justify-between gap-2">
                    <span className="text-[11px] font-bold uppercase tracking-wide text-[#1D3160]">
                      {t('auth.password')}
                    </span>
                    <Link
                      href="/recupera-credenziali"
                      onClick={() => setOpen(false)}
                      className="text-[10px] font-semibold uppercase text-[#1D3160] underline-offset-2 hover:underline"
                    >
                      {t('auth.forgot')}
                    </Link>
                  </div>
                  <div className="relative">
                    <Key
                      className="pointer-events-none absolute left-0 top-1/2 h-4 w-4 -translate-y-1/2 text-[#1D3160]"
                      aria-hidden
                    />
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="current-password"
                      className={cn(inputUnderline, 'pr-8', errors.password && 'border-red-500')}
                      {...register('password')}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((p) => !p)}
                      className="absolute right-0 top-1/2 -translate-y-1/2 p-1 text-gray-500 hover:text-[#1D3160]"
                      aria-label={showPassword ? t('auth.hidePassword') : t('auth.showPassword')}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="mt-1 text-[11px] text-red-600">
                      {translateZodMessage(errors.password.message, t)}
                    </p>
                  )}
                </div>

                {loginError && (
                  <p className="text-center text-[11px] text-red-600" role="alert">
                    {loginError}
                  </p>
                )}

                <div className="flex flex-col gap-2 pt-1">
                  <Button
                    type="submit"
                    disabled={loginMutation.isPending}
                    className="h-10 w-full rounded-sm border-2 border-[#1D3160] bg-white text-sm font-bold uppercase tracking-wide text-[#1D3160] shadow-none hover:bg-gray-50 disabled:opacity-50"
                  >
                    {loginMutation.isPending ? t('auth.loggingIn') : t('auth.login')}
                  </Button>
                  <Button
                    type="button"
                    asChild
                    className="h-10 w-full rounded-sm border border-[#878787] bg-white text-sm font-bold uppercase tracking-wide text-[#1D3160] shadow-none hover:bg-gray-50"
                  >
                    <Link
                      href="/login?accesso=1&otp=1"
                      onClick={() => setOpen(false)}
                    >
                      Accedi con codice monouso
                    </Link>
                  </Button>
                  <Button
                    type="button"
                    asChild
                    className="h-10 w-full rounded-sm border border-[#878787] bg-[#FF7300] text-sm font-bold uppercase tracking-wide text-white shadow-none hover:opacity-95"
                  >
                    <Link href="/login" onClick={() => setOpen(false)}>
                      {t('auth.register')}
                    </Link>
                  </Button>
                </div>
              </form>
            </div>
          )}

          {isAuthenticated && (
            <div className="relative border-b border-gray-100 md:hidden" ref={accountDropdownRef}>
              {/* Account Dropdown Trigger */}
              <button
                type="button"
                onClick={() => setAccountDropdownOpen((v) => !v)}
                className="flex w-full items-center justify-between px-5 py-3.5 text-left text-[13px] font-semibold uppercase tracking-wide text-[#1D3160] transition-colors hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#1D3160]/20"
                aria-expanded={accountDropdownOpen}
                aria-haspopup="true"
              >
                <div className="flex items-center gap-3">
                  <UserCircle className="h-5 w-5 shrink-0 text-[#1D3160]" strokeWidth={2} aria-hidden />
                  <span>{t('account.account')}</span>
                </div>
                <ChevronDown
                  className={cn('h-5 w-5 shrink-0 text-[#1D3160] transition-transform', accountDropdownOpen && 'rotate-180')}
                  aria-hidden
                />
              </button>

              {/* Account Dropdown Menu */}
              <div
                className={cn(
                  'border-t border-gray-100 bg-gray-50/50 overflow-hidden transition-all duration-300 ease-out',
                  accountDropdownOpen ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'
                )}
              >
                <div className="py-1">
                  <Link
                    href="/account"
                    onClick={() => setOpen(false)}
                    className={cn(navLinkClass, 'pl-14', 'transition-colors hover:bg-gray-100/50')}
                  >
                    <UserCircle className="h-4 w-4 shrink-0 text-[#1D3160]/70" strokeWidth={2} aria-hidden />
                    {t('account.account')}
                  </Link>
                  <Link
                    href="/account/messaggi"
                    onClick={() => setOpen(false)}
                    className={cn(navLinkClass, 'pl-14', 'transition-colors hover:bg-gray-100/50')}
                  >
                    <MessageSquare className="h-4 w-4 shrink-0 text-[#1D3160]/70" strokeWidth={2} aria-hidden />
                    {t('account.messages')}
                  </Link>
                  <Link
                    href="/account/credito"
                    onClick={() => setOpen(false)}
                    className={cn(navLinkClass, 'pl-14', 'transition-colors hover:bg-gray-100/50')}
                  >
                    <Wallet className="h-4 w-4 shrink-0 text-[#1D3160]/70" strokeWidth={2} aria-hidden />
                    {t('account.credit')}
                  </Link>
                  <Link
                    href="/account/oggetti"
                    onClick={() => setOpen(false)}
                    className={cn(navLinkClass, 'pl-14', 'transition-colors hover:bg-gray-100/50')}
                  >
                    <Package className="h-4 w-4 shrink-0 text-[#1D3160]/70" strokeWidth={2} aria-hidden />
                    {t('account.items')}
                  </Link>
                  <Link
                    href="/ordini/acquisti"
                    onClick={() => setOpen(false)}
                    className={cn(navLinkClass, 'pl-14', 'transition-colors hover:bg-gray-100/50')}
                  >
                    <ShoppingBag className="h-4 w-4 shrink-0 text-[#1D3160]/70" strokeWidth={2} aria-hidden />
                    {t('purchases.myPurchases')}
                  </Link>
                  <Link
                    href="/account/lista-desideri"
                    onClick={() => setOpen(false)}
                    className={cn(navLinkClass, 'pl-14', 'transition-colors hover:bg-gray-100/50')}
                  >
                    <Heart className="h-4 w-4 shrink-0 text-[#1D3160]/70" strokeWidth={2} aria-hidden />
                    {t('purchases.wishlist')}
                  </Link>
                  <Link
                    href="/account/sincronizzazione"
                    onClick={() => setOpen(false)}
                    className={cn(navLinkClass, 'pl-14', 'transition-colors hover:bg-gray-100/50')}
                  >
                    <RefreshCw className="h-4 w-4 shrink-0 text-[#1D3160]/70" strokeWidth={2} aria-hidden />
                    {t('account.sync')}
                  </Link>
                </div>
              </div>
            </div>
          )}

          {menuItems.map((item) => {
            const IconComponent = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={cn(navLinkClass, 'border-b border-gray-100')}
              >
                <IconComponent className="h-5 w-5 shrink-0 text-[#1D3160]/70" strokeWidth={2} aria-hidden />
                {item.label}
              </Link>
            );
          })}

          <div className="flex items-center justify-between border-b border-gray-100 px-5 py-3.5">
            <span className="text-[13px] font-semibold uppercase tracking-wide text-gray-400">
              {t('common.darkMode')}
            </span>
            <button
              type="button"
              role="switch"
              aria-checked={false}
              disabled
              className={cn(
                'relative h-6 w-11 shrink-0 rounded-full transition-colors duration-300 focus:outline-none cursor-not-allowed opacity-50',
                'bg-gray-300'
              )}
            >
              <span
                className={cn(
                  'absolute top-1/2 h-4 w-4 -translate-y-1/2 rounded-full bg-white shadow transition-[left] duration-200',
                  'left-1'
                )}
              />
            </button>
          </div>

          {/* Dev Mode Toggle */}
          <div className={cn(
            'flex items-center justify-between border-b border-gray-100 px-5 py-3.5',
            devMode && 'bg-yellow-50 border-yellow-200'
          )}>
            <div className="flex flex-col">
              <span className={cn(
                'text-[13px] font-semibold uppercase tracking-wide',
                devMode ? 'text-yellow-700' : 'text-gray-600'
              )}>
                Dev Mode
              </span>
              <span className="text-[10px] text-gray-500 normal-case tracking-wide">
                {devMode ? 'Simulating logged-in state' : 'View site as authenticated'}
              </span>
            </div>
            <button
              type="button"
              onClick={toggleDevMode}
              role="switch"
              aria-checked={devMode}
              className={cn(
                'relative h-6 w-11 shrink-0 rounded-full transition-colors duration-300 focus:outline-none',
                devMode ? 'bg-yellow-500' : 'bg-gray-300'
              )}
            >
              <span
                className={cn(
                  'absolute top-1/2 h-4 w-4 -translate-y-1/2 rounded-full bg-white shadow transition-[left] duration-200',
                  devMode ? 'left-6' : 'left-1'
                )}
              />
            </button>
          </div>

          <Link href="/aiuto" onClick={() => setOpen(false)} className={cn(navLinkClass, 'border-b border-gray-100')}>
            <HelpCircle className="h-5 w-5 shrink-0 text-[#1D3160]/70" strokeWidth={2} aria-hidden />
            {t('common.help')}
          </Link>

          <div ref={linguaDropdownRef} className="relative border-b border-gray-100">
            <button
              type="button"
              onClick={() => setLinguaDropdownOpen((v) => !v)}
              className="flex w-full items-center justify-between px-5 py-3.5 text-left text-[13px] font-semibold uppercase tracking-wide text-[#1D3160] transition-colors hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#1D3160]/20"
              aria-expanded={linguaDropdownOpen}
              aria-haspopup="listbox"
              aria-label={t('common.languageSelectAria')}
            >
              <span>{currentLangLabel}</span>
              <div className="flex items-center gap-2">
                <Image
                  src={`${FLAG_BASE}/w40/${currentCountryCode}.png`}
                  alt=""
                  width={24}
                  height={16}
                  className="h-4 w-6 rounded object-cover"
                  unoptimized
                />
                <ChevronDown
                  className={cn('h-5 w-5 text-[#1D3160] transition-transform', linguaDropdownOpen && 'rotate-180')}
                  aria-hidden
                />
              </div>
            </button>
            {linguaDropdownOpen && (
              <ul
                className="border-t border-gray-100 bg-white py-1 shadow-inner"
                role="listbox"
              >
                {availableLangs.map((lang) => (
                  <li key={lang} role="option" aria-selected={selectedLang === lang}>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedLang(lang);
                        setLinguaDropdownOpen(false);
                      }}
                      className={cn(
                        'flex w-full items-center gap-3 px-5 py-3 text-left text-[13px] font-semibold uppercase tracking-wide text-[#1D3160] transition-colors hover:bg-gray-50',
                        selectedLang === lang && 'bg-gray-50'
                      )}
                    >
                      <Image
                        src={`${FLAG_BASE}/w40/${LANG_TO_COUNTRY[lang] ?? lang}.png`}
                        alt=""
                        width={24}
                        height={16}
                        className="h-4 w-6 shrink-0 rounded object-cover"
                        unoptimized
                      />
                      {(LANGUAGE_NAMES[lang] ?? lang).toUpperCase()}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
          </div>

          {isAuthenticated && (
            <div className="shrink-0 border-t border-gray-200 bg-white">
              <button
                type="button"
                onClick={handleLogout}
                disabled={logoutMutation.isPending}
                className={cn(
                  'flex w-full items-center justify-center gap-3 px-5 py-4 text-left text-[13px] font-semibold uppercase tracking-wide transition-colors disabled:cursor-not-allowed disabled:opacity-50',
                  devMode 
                    ? 'text-yellow-700 hover:bg-yellow-100' 
                    : 'text-red-600 hover:bg-red-50'
                )}
              >
                <LogOut className="h-5 w-5 shrink-0" strokeWidth={2} aria-hidden />
                <span>{devMode ? 'Exit Dev Mode' : (logoutMutation.isPending ? t('auth.logoutPending') : t('auth.logout'))}</span>
              </button>
            </div>
          )}
        </nav>
      </div>
    </>
  );
}
