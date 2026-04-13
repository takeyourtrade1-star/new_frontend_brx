'use client';

import React, { useRef, useEffect, useCallback, useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  Tag, RefreshCw, Gavel, CircleDollarSign, ShieldCheck,
  ArrowRightLeft, Scale, Package, TrendingUp, X, Mail,
  CheckCircle2, ArrowLeft, BellRing, Users, ChevronUp,
} from 'lucide-react';
import { getCdnImageUrl, getCdnVideoUrl } from '@/lib/config';
import { useGame } from '@/lib/contexts/GameContext';
import type { GameSlug } from '@/lib/contexts/GameContext';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { useAuth } from '@/lib/hooks/use-auth';

/* ═══════════════════════════════════════════════════════════
   CONSTANTS
   ═══════════════════════════════════════════════════════════ */

const LANDING_BG_VIDEO = 'videos/sfondo_carte.mp4';

type LandingGameSlug = GameSlug | 'clear';

const FEATURE_ICONS: Record<string, React.FC<any>> = {
  prezzi: CircleDollarSign,
  sicuro: ShieldCheck,
  gestione: ArrowRightLeft,
  domanda: Scale,
  vendite: Package,
  commissioni: TrendingUp,
};

/* ─── Games ─── */
const getMainGames = (): {
  src: string;
  alt: string;
  homeHref: string;
  gameSlug: LandingGameSlug;
}[] => [
  {
    src: getCdnImageUrl('loghi-giochi/magic.png'),
    alt: 'Magic The Gathering',
    homeHref: '/home/magic',
    gameSlug: 'mtg',
  },
];

const GAME_FULLSCREEN_IMAGES: Record<string, string> = {
  'Pokémon Trading Card Game': '/landing-giochi-bg/pokemon.png',
  "Yu-Gi-Oh! Trading Card Game": '/landing-giochi-bg/yugioh.png',
  'One Piece Card Game': '/landing-giochi-bg/one-piece.png',
  'Disney Lorcana': '/landing-giochi-bg/disney.png',
  'Star Wars: Unlimited': '/landing-giochi-bg/starwars.png',
};

const getComingSoonGames = (): {
  src: string;
  alt: string;
  homeHref?: string;
  comingSoon?: boolean;
  gameSlug?: LandingGameSlug;
}[] => [
  {
    src: getCdnImageUrl('loghi-giochi/pokèmon.png'),
    alt: 'Pokémon Trading Card Game',
    homeHref: '/home/pokemon',
    gameSlug: 'pokemon',
    comingSoon: true,
  },
  {
    src: getCdnImageUrl('loghi-giochi/yu-gi-oh.png'),
    alt: 'Yu-Gi-Oh! Trading Card Game',
    homeHref: '/home',
    gameSlug: 'clear',
    comingSoon: true,
  },
  { src: getCdnImageUrl('loghi-giochi/One_Piece_Card_Game_Logo%201.png'), alt: 'One Piece Card Game', comingSoon: true },
  { src: getCdnImageUrl('loghi-giochi/Disney_Lorcana_480x480%201.png'), alt: 'Disney Lorcana', comingSoon: true },
  {
    src: getCdnImageUrl('star_wars.jpg'),
    alt: 'Star Wars: Unlimited',
    comingSoon: true,
  },
];

/* ─── Boutique ─── */
const BOUTIQUE_GLOW_COLORS: Record<string, string> = {
  dadi: '251, 191, 36',
  buste: '167, 139, 250',
  tappetini: '56, 189, 248',
  memorabilia: '251, 146, 60',
  albums: '251, 113, 133',
  'game-kits': '255, 115, 0',
};

const BOUTIQUE_CATEGORIES = [
  { id: 'dadi', label: 'Dadi', href: '/products?category=dadi',
    imageUrl: '/ebartex-boutique/dadi-boutique.webp',
    imageSet: { sm: '/ebartex-boutique/dadi-boutique-sm.webp', md: '/ebartex-boutique/dadi-boutique-md.webp', lg: '/ebartex-boutique/dadi-boutique-lg.webp' }
  },
  { id: 'buste', label: 'Buste', href: '/products?category=buste',
    imageUrl: '/ebartex-boutique/buste-boutique.webp',
    imageSet: { sm: '/ebartex-boutique/buste-boutique-sm.webp', md: '/ebartex-boutique/buste-boutique-md.webp', lg: '/ebartex-boutique/buste-boutique-lg.webp' }
  },
  { id: 'tappetini', label: 'Tappetini', href: '/products?category=tappetini',
    imageUrl: '/ebartex-boutique/tappetini-boutique.webp',
    imageSet: { sm: '/ebartex-boutique/tappetini-boutique-sm.webp', md: '/ebartex-boutique/tappetini-boutique-md.webp', lg: '/ebartex-boutique/tappetini-boutique-lg.webp' }
  },
  { id: 'memorabilia', label: 'Memorabilia', href: '/products?category=memorabilia',
    imageUrl: '/ebartex-boutique/memorabilia-boutique.webp',
    imageSet: { sm: '/ebartex-boutique/memorabilia-boutique-sm.webp', md: '/ebartex-boutique/memorabilia-boutique-md.webp', lg: '/ebartex-boutique/memorabilia-boutique-lg.webp' }
  },
  { id: 'albums', label: 'Albums', href: '/products?category=albums',
    imageUrl: '/ebartex-boutique/albums-boutique.webp',
    imageSet: { sm: '/ebartex-boutique/albums-boutique-sm.webp', md: '/ebartex-boutique/albums-boutique-md.webp', lg: '/ebartex-boutique/albums-boutique-lg.webp' }
  },
  { id: 'game-kits', label: 'Game kits', href: '/products?category=game-kits',
    imageUrl: '/ebartex-boutique/gamekits-boutique.webp',
    imageSet: { sm: '/ebartex-boutique/gamekits-boutique-sm.webp', md: '/ebartex-boutique/gamekits-boutique-md.webp', lg: '/ebartex-boutique/gamekits-boutique-lg.webp' }
  },
];

/* ═══════════════════════════════════════════════════════════
   COMPONENT
   ═══════════════════════════════════════════════════════════ */

export function LandingWelcome() {
  const { t } = useTranslation();
  const { setSelectedGame } = useGame();
  const { isAuthenticated } = useAuth();

  /* ─── state ─── */
  const [notifyGame, setNotifyGame] = useState<{ src: string; alt: string } | null>(null);
  const [fullscreenGame, setFullscreenGame] = useState<{ src: string; alt: string; bgImage: string } | null>(null);
  const [isFullscreenClosing, setIsFullscreenClosing] = useState(false);
  const [email, setEmail] = useState('');
  const [isNotifySuccess, setIsNotifySuccess] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);

  /* ─── handlers ─── */
  const handleCloseFullscreen = useCallback(() => {
    setIsFullscreenClosing(true);
    setTimeout(() => {
      setFullscreenGame(null);
      setIsFullscreenClosing(false);
      setIsNotifySuccess(false);
      setEmail('');
    }, 400);
  }, []);

  const handleNotifySubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setTimeout(() => {
      setIsNotifySuccess(true);
      setTimeout(() => {
        setNotifyGame(null);
        setIsNotifySuccess(false);
        setEmail('');
      }, 2000);
    }, 800);
  }, [email]);

  const handleFullscreenNotifySubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setTimeout(() => {
      setIsNotifySuccess(true);
      setTimeout(() => {
        handleCloseFullscreen();
      }, 2000);
    }, 800);
  }, [email, handleCloseFullscreen]);

  const handleScrollToTop = useCallback(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 400);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  /* ─── memoised data ─── */
  const FEATURES = useMemo(
    () => [
      { iconKey: 'prezzi' as const, title: t('landing.feat.prezzi.title'), description: t('landing.feat.prezzi.desc') },
      { iconKey: 'sicuro' as const, title: t('landing.feat.sicuro.title'), description: t('landing.feat.sicuro.desc') },
      { iconKey: 'gestione' as const, title: t('landing.feat.gestione.title'), description: t('landing.feat.gestione.desc') },
      { iconKey: 'domanda' as const, title: t('landing.feat.domanda.title'), description: t('landing.feat.domanda.desc') },
      { iconKey: 'vendite' as const, title: t('landing.feat.vendite.title'), description: t('landing.feat.vendite.desc') },
      { iconKey: 'commissioni' as const, title: t('landing.feat.commissioni.title'), description: t('landing.feat.commissioni.desc') },
    ],
    [t]
  );

  const MAIN_GAMES = getMainGames();
  const COMING_SOON_GAMES = getComingSoonGames();
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    videoRef.current?.play().catch(() => {});
  }, []);

  /* ─── render ─── */
  return (
    <div className="relative w-full overflow-x-hidden overflow-y-visible text-white">

      {/* ══════ Background video ══════ */}
      <video
        ref={videoRef}
        src={getCdnVideoUrl(LANDING_BG_VIDEO)}
        className="pointer-events-none absolute inset-0 h-full min-h-full w-full object-cover object-center"
        autoPlay loop muted playsInline
        disablePictureInPicture disableRemotePlayback aria-hidden
      />

      {/* Overlay gradient */}
      <div
        className="absolute inset-0 z-[1]"
        style={{ background: 'linear-gradient(180deg, rgba(15,23,42,0.65) 0%, rgba(29,49,96,0.50) 40%, rgba(15,23,42,0.72) 100%)' }}
      />

      {/* ══════ CONTENT LAYER ══════ */}
      <div className="relative z-10 flex min-h-0 flex-col">

        {/* ────── LOGO + TAGLINE — same row ────── */}
        <header className="bento-entry flex items-center justify-center px-4 pt-1 pb-1 sm:pt-2 sm:pb-2 md:pt-3" style={{ animationDelay: '0ms' }}>
          <div className="flex w-full max-w-6xl items-center justify-center gap-3 sm:gap-5 md:gap-6">
            <Image
              src={getCdnImageUrl('Logo%20Principale%20EBARTEX.png')}
              alt="Ebartex"
              width={700}
              height={263}
              className="h-14 w-auto shrink-0 object-contain sm:h-20 md:h-24 lg:h-28"
              sizes="(max-width: 640px) 140px, (max-width: 1024px) 200px, 280px"
              priority
              unoptimized
            />
            <div className="h-8 w-px bg-white/20 hidden sm:block" />
            <h1 className="text-xs font-medium uppercase tracking-[0.06em] text-white/80 sm:text-sm md:text-base lg:text-lg">
              L&apos;unico marketplace dove <span className="font-bold text-[#38BDF8]">Scambi</span> e metti all&apos;<span className="font-bold text-[#FB923C]">Asta</span> le tue carte
            </h1>
          </div>
        </header>

        {/* ═══════════════════════════════════════════════
            BENTO GRID HERO — 4 elementi grandi
            ═══════════════════════════════════════════════ */}
        <section className="px-4 pt-2 pb-4 sm:px-4 sm:pt-2 sm:pb-4 md:px-6 md:pt-2 md:pb-5">
          <div className="mx-auto grid w-full max-w-6xl gap-3 sm:gap-3 grid-cols-1 md:grid-cols-2 lg:grid-cols-6 lg:grid-rows-[auto_auto]">

            {/* ═══ ROW 1: COMPRA & VENDI + MAGIC CARD ═══ */}

            {/* ──── COMPRA & VENDI — text + arrow pointing RIGHT toward Magic ──── */}
            <div
              className="bento-entry col-span-1 lg:col-span-1 flex flex-col items-center justify-center gap-2 sm:gap-2 p-4 sm:p-4 md:p-5 min-h-[100px] sm:min-h-[100px] md:min-h-[110px] lg:min-h-[130px] text-center"
              style={{ animationDelay: '100ms' }}
            >
              <p className="text-[9px] sm:text-[10px] md:text-xs font-bold uppercase tracking-widest text-emerald-400">
                Compra &amp; Vendi
              </p>
              <p className="text-[8px] sm:text-[9px] md:text-[10px] text-white/50 max-w-[120px] sm:max-w-[140px] leading-snug">
                Già disponibile su Magic
              </p>
              {/* Big animated arrow pointing right - hidden on mobile */}
              <svg
                className="hidden sm:block h-8 sm:h-8 sm:w-12 md:h-10 md:w-14 text-white/40 animate-bounce-right"
                viewBox="0 0 56 40"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden
              >
                <path
                  d="M8 20H48M48 20L34 8M48 20L34 32"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>

            {/* ──── MAGIC CARD — expands when logged in (no CTA) ──── */}
            <Link
              href="/home/magic"
              id="hero-magic-card"
              className={`bento-entry bento-card group relative flex items-center justify-between overflow-hidden rounded-2xl border border-white/15 p-4 sm:p-4 md:p-5 lg:p-6 min-h-[110px] sm:min-h-[100px] md:min-h-[110px] lg:min-h-[130px] transition-all duration-500 hover:border-white/30 hover:scale-[1.01] col-span-1 ${isAuthenticated ? 'md:col-span-2 lg:col-span-5' : 'md:col-span-1 lg:col-span-3'}`}
              style={{
                animationDelay: '180ms',
                background: 'linear-gradient(135deg, rgba(167,139,250,0.08) 0%, rgba(15,23,42,0.40) 40%, rgba(99,102,241,0.04) 100%)',
                backdropFilter: 'blur(16px)',
                WebkitBackdropFilter: 'blur(16px)',
              }}
              aria-label={t('landing.gameAria.goHome', { name: 'Magic The Gathering' })}
              onClick={() => setSelectedGame('mtg')}
            >
              {/* Badge "Disponibile subito" */}
              <span className="absolute right-3 top-3 z-10 text-[8px] sm:text-[9px] font-bold uppercase tracking-widest text-white">
                Disponibile subito!
              </span>

              {/* Decorative glows */}
              <div className="pointer-events-none absolute -left-12 -top-12 h-48 w-48 rounded-full bg-indigo-500/8 blur-3xl" />

              {/* Left side: Text */}
              <div className="relative z-10 flex flex-col gap-0.5 sm:gap-1">
                <h2 className="font-display text-base sm:text-lg md:text-xl lg:text-2xl font-bold uppercase tracking-tight text-white drop-shadow-lg">
                  Magic: The Gathering
                </h2>
                <p className="max-w-md text-[10px] sm:text-[11px] md:text-xs text-white/50">
                  Compra, vendi, scambia e metti all&apos;asta le tue carte. Inizia subito.
                </p>
              </div>

              {/* Right side: Game logo */}
              <div className="relative z-10 flex shrink-0 items-center justify-center">
                <div className="relative h-16 w-28 sm:h-20 sm:w-36 md:h-24 md:w-44 lg:h-32 lg:w-56 transition-transform duration-500 group-hover:scale-110">
                  <img
                    src={MAIN_GAMES[0].src}
                    alt={MAIN_GAMES[0].alt}
                    className="h-full w-full object-contain drop-shadow-[0_0_24px_rgba(167,139,250,0.25)]"
                  />
                </div>
              </div>
            </Link>

            {/* ──── CTA + REGISTRATI — only if NOT authenticated ──── */}
            {!isAuthenticated && (
              <div
                className="bento-entry col-span-1 lg:col-span-1 flex flex-col items-center justify-center gap-2.5 sm:gap-2.5 rounded-2xl border border-white/10 p-4 sm:p-4 md:p-5 h-24 sm:h-24 md:h-28 lg:h-32"
                style={{
                  animationDelay: '260ms',
                  background: 'linear-gradient(135deg, rgba(255,115,0,0.04) 0%, rgba(15,23,42,0.35) 100%)',
                  backdropFilter: 'blur(16px)',
                  WebkitBackdropFilter: 'blur(16px)',
                }}
              >
                <p className="text-center text-[10px] sm:text-[11px] md:text-xs font-medium text-white/60">
                  Unisciti a migliaia di collezionisti
                </p>
                <Link
                  href="/login"
                  id="hero-cta-register"
                  className="bento-cta-glow group relative inline-flex w-full items-center justify-center overflow-hidden rounded-full bg-[#FF7300] px-4 py-2 sm:px-5 sm:py-2.5 md:px-7 md:py-3 text-[10px] sm:text-xs md:text-sm font-bold uppercase tracking-widest text-white shadow-[0_4px_24px_rgba(255,115,0,0.4)] transition-all duration-300 hover:scale-105 hover:bg-[#e66700] hover:shadow-[0_6px_32px_rgba(255,115,0,0.6)] active:scale-100"
                >
                  {/* Shimmer sweep */}
                  <span className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
                  <span className="relative">{t('landing.cta.register')}</span>
                </Link>
              </div>
            )}

            {/* ═══ ROW 2: SCAMBI + ASTE + Presto disponibili text ═══ */}

            {/* ──── SCAMBI CARD ──── */}
            <Link
              href="/scambi"
              id="hero-scambi-card"
              className="bento-entry bento-card group relative col-span-1 md:col-span-1 lg:col-span-2 flex flex-col justify-between overflow-hidden rounded-2xl border border-white/15 p-4 sm:p-4 md:p-5 lg:p-6 min-h-[120px] sm:min-h-[120px] md:min-h-[140px] lg:min-h-[170px] transition-all duration-500 hover:border-white/30 hover:scale-[1.01]"
              style={{
                animationDelay: '320ms',
                background: 'linear-gradient(135deg, rgba(56,189,248,0.10) 0%, rgba(15,23,42,0.40) 50%, rgba(56,189,248,0.04) 100%)',
                backdropFilter: 'blur(16px)',
                WebkitBackdropFilter: 'blur(16px)',
              }}
            >
              {/* Exclusive badges */}
              <div className="absolute right-3 top-3 z-10 flex flex-col items-end gap-1">
                <span className="text-[8px] sm:text-[9px] font-bold uppercase tracking-widest text-white/90">
                  Presto
                </span>
                <span className="bento-badge-glow rounded-full bg-[#FF7300] px-2 py-0.5 sm:px-2.5 sm:py-1 text-[8px] sm:text-[9px] font-bold uppercase tracking-widest text-white shadow-[0_2px_12px_rgba(255,115,0,0.5)]">
                  Solo Ebartex
                </span>
              </div>

              {/* Decorative bg glow */}
              <div className="pointer-events-none absolute -right-12 -top-12 h-48 w-48 rounded-full bg-[#38BDF8]/10 blur-3xl transition-all duration-700 group-hover:bg-[#38BDF8]/18 group-hover:scale-110" />

              {/* Content */}
              <div className="relative z-10 flex flex-col gap-1 sm:gap-1.5">
                <h2 className="font-display text-xl sm:text-2xl md:text-3xl lg:text-[2rem] font-bold uppercase tracking-tight text-white drop-shadow-lg">
                  Scambi
                </h2>
                <p className="max-w-sm text-[10px] sm:text-[11px] md:text-xs leading-relaxed text-white/60">
                  Proponi e accetta scambi. Nessun altro marketplace lo offre.
                </p>
              </div>

              {/* CTA — text only, no icon */}
              <div className="relative z-10 mt-2 sm:mt-3">
                <span className="inline-flex items-center rounded-full border border-[#38BDF8]/30 bg-[#38BDF8]/10 px-3.5 py-1.5 sm:px-4 sm:py-2 text-[9px] sm:text-[10px] font-semibold uppercase tracking-wider text-[#38BDF8] transition-all duration-300 group-hover:bg-[#38BDF8]/20 group-hover:border-[#38BDF8]/50 group-hover:shadow-[0_0_16px_rgba(56,189,248,0.15)]">
                  Scopri gli Scambi
                </span>
              </div>
            </Link>

            {/* ──── ASTE CARD ──── */}
            <Link
              href="/aste"
              id="hero-aste-card"
              className="bento-entry bento-card group relative col-span-1 md:col-span-1 lg:col-span-2 flex flex-col justify-between overflow-hidden rounded-2xl border border-white/15 p-4 sm:p-4 md:p-5 lg:p-6 min-h-[120px] sm:min-h-[120px] md:min-h-[140px] lg:min-h-[170px] transition-all duration-500 hover:border-white/30 hover:scale-[1.01]"
              style={{
                animationDelay: '400ms',
                background: 'linear-gradient(135deg, rgba(251,146,60,0.10) 0%, rgba(15,23,42,0.40) 50%, rgba(251,146,60,0.04) 100%)',
                backdropFilter: 'blur(16px)',
                WebkitBackdropFilter: 'blur(16px)',
              }}
            >
              {/* Exclusive badges */}
              <div className="absolute right-3 top-3 z-10 flex flex-col items-end gap-1">
                <span className="text-[8px] sm:text-[9px] font-bold uppercase tracking-widest text-white/90">
                  Presto
                </span>
                <span className="bento-badge-glow rounded-full bg-[#FF7300] px-2 py-0.5 sm:px-2.5 sm:py-1 text-[8px] sm:text-[9px] font-bold uppercase tracking-widest text-white shadow-[0_2px_12px_rgba(255,115,0,0.5)]">
                  Solo Ebartex
                </span>
              </div>

              {/* Decorative bg glows */}
              <div className="pointer-events-none absolute -right-12 -top-12 h-48 w-48 rounded-full bg-[#FB923C]/10 blur-3xl transition-all duration-700 group-hover:bg-[#FB923C]/18 group-hover:scale-110" />

              {/* Content */}
              <div className="relative z-10 flex flex-col gap-1 sm:gap-1.5">
                <h2 className="font-display text-xl sm:text-2xl md:text-3xl lg:text-[2rem] font-bold uppercase tracking-tight text-white drop-shadow-lg">
                  Aste
                </h2>
                <p className="max-w-sm text-[10px] sm:text-[11px] md:text-xs leading-relaxed text-white/60">
                  Metti all&apos;asta le tue carte o fai offerte.
                </p>
              </div>

              {/* CTA — text only, no icon */}
              <div className="relative z-10 mt-2 sm:mt-3">
                <span className="inline-flex items-center rounded-full border border-[#FB923C]/30 bg-[#FB923C]/10 px-3.5 py-1.5 sm:px-4 sm:py-2 text-[9px] sm:text-[10px] font-semibold uppercase tracking-wider text-[#FB923C] transition-all duration-300 group-hover:bg-[#FB923C]/20 group-hover:border-[#FB923C]/50 group-hover:shadow-[0_0_16px_rgba(251,146,60,0.15)]">
                  Scopri le Aste
                </span>
              </div>
            </Link>

            {/* ──── PRESTO DISPONIBILI — text with arrow pointing LEFT toward cards ──── */}
            <div
              className="bento-entry col-span-1 lg:col-span-2 flex flex-col items-center sm:items-end justify-center gap-2 sm:gap-2 p-4 sm:p-4 md:p-5 pr-4 sm:pr-6 md:pr-8 lg:pr-10 min-h-[100px] sm:min-h-[100px] md:min-h-[110px] lg:min-h-[130px] text-center sm:text-right"
              style={{ animationDelay: '480ms' }}
            >
              {/* Arrow pointing LEFT toward the cards - hidden on mobile */}
              <svg
                className="hidden sm:block h-8 sm:h-8 sm:w-12 md:h-10 md:w-14 text-white/40 animate-bounce-left"
                viewBox="0 0 56 40"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden
              >
                <path
                  d="M48 20H8M8 20L22 8M8 20L22 32"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <p className="text-[9px] sm:text-[10px] md:text-xs font-bold uppercase tracking-widest text-amber-400">
                Presto disponibili
              </p>
              <p className="text-[8px] sm:text-[9px] md:text-[10px] text-white/50 max-w-[160px] sm:max-w-[180px] leading-snug">
                Solo su Ebartex
              </p>
            </div>

          </div>
        </section>

        {/* ═══════════════════════════════════════════════
            COMING SOON GAMES — infinite horizontal scroll
            ═══════════════════════════════════════════════ */}
        <section className="bento-entry px-4 pb-4 sm:px-6 sm:pb-6" style={{ animationDelay: '480ms' }}>
          <div className="mx-auto max-w-md">
            <p className="mb-3 sm:mb-4 text-center text-[10px] sm:text-xs font-semibold uppercase tracking-widest text-white/40">
              Presto in arrivo
            </p>
            <div className="relative overflow-hidden mx-auto max-w-[416px] rounded-2xl backdrop-blur-sm bg-white/5 shadow-lg">
              {/* Fade sx */}
              <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-black/10 to-transparent z-10" />
              {/* Fade dx */}
              <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-black/10 to-transparent z-10" />
              <div className="flex gap-4 sm:gap-5 md:gap-6 animate-marquee">
                {COMING_SOON_GAMES.map((game) => (
                  <button
                    key={game.alt}
                    type="button"
                    className="group flex h-14 w-14 sm:h-16 sm:w-16 md:h-20 md:w-20 lg:h-24 lg:w-24 items-center justify-center rounded-full cursor-pointer overflow-hidden bg-white/10 border border-white/20 transition-transform duration-300 hover:scale-110 flex-shrink-0"
                    onClick={() => {
                      const bgImage = GAME_FULLSCREEN_IMAGES[game.alt];
                      if (bgImage) {
                        setFullscreenGame({ src: game.src, alt: game.alt, bgImage });
                      } else {
                        setNotifyGame({ src: game.src, alt: game.alt });
                      }
                    }}
                  >
                    <img
                      src={game.src}
                      alt={game.alt}
                      className="max-w-[60%] sm:max-w-[65%] max-h-[60%] sm:max-h-[65%] object-contain"
                    />
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ══════ Glass blur layers before features ══════ */}
        <div
          className="absolute inset-x-0 bottom-0 backdrop-blur-md pointer-events-none z-[1]"
          style={{
            top: 'calc(100% - 520px)',
            WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.15) 10%, rgba(0,0,0,0.35) 25%, rgba(0,0,0,0.55) 45%, black 65%)',
            maskImage: 'linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.15) 10%, rgba(0,0,0,0.35) 25%, rgba(0,0,0,0.55) 45%, black 65%)',
          }}
        />
        <div
          className="absolute inset-x-0 bottom-0 backdrop-blur-xl pointer-events-none z-[1]"
          style={{
            top: 'calc(100% - 420px)',
            WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.2) 15%, rgba(0,0,0,0.5) 40%, black 65%)',
            maskImage: 'linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.2) 15%, rgba(0,0,0,0.5) 40%, black 65%)',
          }}
        />
        <div
          className="absolute inset-x-0 bottom-0 bg-gradient-to-b from-transparent via-header-bg/35 to-header-bg/80 backdrop-blur-2xl pointer-events-none z-[1]"
          style={{
            top: 'calc(100% - 320px)',
            WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.2) 20%, rgba(0,0,0,0.6) 45%, black 70%)',
            maskImage: 'linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.2) 20%, rgba(0,0,0,0.6) 45%, black 70%)',
          }}
        />

        {/* ═══════════════════════════════════════════════
            FEATURES + BOUTIQUE (below the fold)
            ═══════════════════════════════════════════════ */}
        <section className="relative w-full overflow-hidden px-4 pt-6 pb-6 sm:px-5 sm:pt-8 sm:pb-7 md:pt-10 md:pb-8 z-[2]">
          <div className="relative z-10 mx-auto max-w-4xl">

            {/* ─── KPI / Features grid ─── */}
            <div className="mb-5 sm:mb-6 md:mb-7" aria-labelledby="landing-features-heading">
              <div className="mb-3 sm:mb-4 md:mb-6 text-center">
                <h2
                  id="landing-features-heading"
                  className="text-sm font-normal leading-tight tracking-wide text-white sm:text-base md:text-lg lg:text-xl"
                >
                  {t('landing.feat.sectionTitle')}
                </h2>
              </div>

              <div className="grid w-full grid-cols-2 md:grid-cols-3 gap-x-2 sm:gap-x-3 md:gap-x-6 gap-y-3 sm:gap-y-4 md:gap-y-8">
                {FEATURES.map((f) => {
                  const IconComponent = FEATURE_ICONS[f.iconKey];
                  return (
                    <div key={f.title} className="flex flex-col items-center text-center">
                      <div className="mb-1.5 sm:mb-2 flex shrink-0 items-center justify-center">
                        {IconComponent ? <IconComponent className="h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8 text-[#FF7300]" strokeWidth={1.5} /> : null}
                      </div>
                      <h3 className="text-[9px] sm:text-[10px] md:text-[11px] font-bold uppercase leading-tight tracking-[0.06em] text-white mb-0.5 sm:mb-1">
                        {f.title}
                      </h3>
                      <p className="hidden md:block text-[10px] sm:text-[11px] leading-relaxed text-white/70">
                        {f.description}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Divider */}
            <div className="mx-auto my-4 sm:my-6 md:my-8 h-px w-2/3 max-w-lg bg-gradient-to-r from-transparent via-white/30 to-transparent" />

            {/* ─── Boutique Cards ─── */}
            <div className="mt-6 sm:mt-8 md:mt-12 text-center">
              <h3 className="mb-3 sm:mb-4 md:mb-6 text-[10px] sm:text-xs md:text-sm font-semibold uppercase tracking-widest text-white/90">
                La Nostra Boutique
              </h3>

              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 sm:gap-3 md:gap-4 max-w-5xl mx-auto px-1 sm:px-2">
                {BOUTIQUE_CATEGORIES.map((cat, index) => {
                  const glowColor = BOUTIQUE_GLOW_COLORS[cat.id] || '255,255,255';
                  return (
                    <Link
                      key={cat.id}
                      href={cat.href}
                      className="group relative aspect-square overflow-hidden rounded-full border border-white/10 transition-all duration-300 hover:border-white/30 hover:shadow-[0_8px_30px_rgba(0,0,0,0.4)]"
                      style={{ animation: `categoryEnter 0.6s cubic-bezier(0.16, 1, 0.3, 1) ${index * 120}ms both` }}
                    >
                      <div
                        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
                        style={{
                          backgroundImage: `image-set(
                            url(${cat.imageSet?.sm || cat.imageUrl}) 1x,
                            url(${cat.imageSet?.md || cat.imageUrl}) 2x,
                            url(${cat.imageSet?.lg || cat.imageUrl}) 3x
                          )`,
                        }}
                        aria-hidden
                      />
                      <div className="absolute inset-0 bg-black/40 transition-all duration-300 group-hover:bg-black/10 group-hover:backdrop-blur-[2px]" aria-hidden />
                      <span
                        className="absolute inset-0 flex items-center justify-center text-center px-1 text-[10px] sm:text-xs md:text-sm font-bold uppercase tracking-wider text-white drop-shadow-lg transition-all duration-300 group-hover:scale-110"
                        style={{
                          ['--glow-color' as string]: glowColor,
                          textShadow: '0 2px 12px rgba(0,0,0,0.45)',
                        }}
                      >
                        <span className="transition-all duration-300 group-hover:[text-shadow:0_0_20px_rgba(var(--glow-color),0.9),0_0_40px_rgba(var(--glow-color),0.6),0_2px_12px_rgba(0,0,0,0.45)]">
                          {cat.label}
                        </span>
                      </span>
                    </Link>
                  );
                })}
              </div>
            </div>

          </div>
        </section>
      </div>

      {/* ══════ MODAL: Notify (small glass) ══════ */}
      {notifyGame && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 backdrop-blur-md bg-black/40 animate-in fade-in duration-300">
          <div
            className="relative w-full max-w-sm overflow-hidden rounded-[32px] border border-white/25 bg-white/10 p-8 shadow-2xl backdrop-blur-xl animate-in zoom-in-95 duration-300"
            style={{ boxShadow: '0 20px 50px rgba(0,0,0,0.5), inset 0 0 20px rgba(255,255,255,0.05)' }}
          >
            <button
              onClick={() => setNotifyGame(null)}
              className="absolute right-6 top-6 rounded-full bg-white/5 p-2 text-white/50 transition-colors hover:bg-white/10 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>

            {!isNotifySuccess ? (
              <div className="flex flex-col items-center text-center">
                <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-3xl bg-[#FF7300]/20 text-[#FF7300] shadow-[0_0_20px_rgba(255,115,0,0.2)]">
                  <img src={notifyGame.src} alt="" className="h-10 w-10 object-contain" />
                </div>

                <h3 className="mb-3 text-lg font-bold uppercase tracking-tight text-white sm:text-xl">
                  Ti interessa {notifyGame.alt}?
                </h3>

                <p className="mb-8 text-sm leading-relaxed text-white/70">
                  Siamo quasi pronti! Inserisci la tua email e ti avviseremo appena il gioco sarà disponibile sul marketplace.
                </p>

                <form onSubmit={handleNotifySubmit} className="w-full space-y-4">
                  <div className="relative group">
                    <Mail className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40 transition-colors group-focus-within:text-[#FF7300]" />
                    <input
                      type="email"
                      required
                      placeholder="La tua email..."
                      className="w-full rounded-2xl border border-white/10 bg-white/5 py-3.5 pl-11 pr-4 text-sm text-white placeholder:text-white/20 outline-none transition-all focus:border-[#FF7300]/50 focus:bg-white/10"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full rounded-2xl bg-[#FF7300] py-4 text-sm font-bold uppercase tracking-widest text-white shadow-[0_4px_20px_rgba(255,115,0,0.4)] transition-all hover:bg-[#e66700] hover:shadow-[0_6px_28px_rgba(255,115,0,0.5)] active:scale-95"
                  >
                    AVVISAMI
                  </button>
                </form>
              </div>
            ) : (
              <div className="flex flex-col items-center py-10 text-center animate-in zoom-in-95 duration-500">
                <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-green-500/20 text-green-500">
                  <CheckCircle2 className="h-12 w-12" />
                </div>
                <h3 className="mb-2 text-xl font-bold text-white">GRAZIE!</h3>
                <p className="text-sm text-white/70">
                  Abbiamo registrato la tua email. <br/>A presto!
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ══════ FULLSCREEN GAME PAGE ══════ */}
      {fullscreenGame && (
        <div
          className={`fixed inset-0 z-[9999] flex flex-col ${isFullscreenClosing ? 'animate-landing-exit' : ''}`}
          style={{ willChange: 'opacity' }}
        >
          <div
            className={`absolute inset-0 bg-cover bg-center bg-no-repeat ${isFullscreenClosing ? 'animate-landing-bg-exit' : 'animate-landing-bg'}`}
            style={{ backgroundImage: `url(${fullscreenGame.bgImage})`, willChange: 'transform, opacity' }}
          />
          <div
            className={`absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/70 ${isFullscreenClosing ? 'animate-landing-fade-exit' : 'animate-landing-fade'}`}
            style={{ willChange: 'opacity' }}
          />

          {/* Back button */}
          <button
            type="button"
            onClick={handleCloseFullscreen}
            className={`absolute left-6 top-6 z-50 flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-white/80 transition-all duration-300 hover:bg-white/20 hover:text-white backdrop-blur-md border border-white/20 ${isFullscreenClosing ? 'animate-landing-slide-up-exit' : 'animate-landing-slide-down'}`}
            style={{ willChange: 'transform, opacity' }}
          >
            <ArrowLeft className="h-5 w-5" />
            <span className="text-sm font-medium">Torna indietro</span>
          </button>

          {/* Social proof */}
          <div
            className={`absolute right-6 top-6 z-10 flex items-center gap-2 rounded-full bg-[#FF7300]/90 px-4 py-2 text-white shadow-lg ${isFullscreenClosing ? 'animate-landing-slide-up-exit' : 'animate-landing-slide-down'}`}
            style={{ willChange: 'transform, opacity', animationDelay: isFullscreenClosing ? '0ms' : '100ms' }}
          >
            <Users className="h-4 w-4" />
            <span className="text-sm font-semibold">1,247 in lista d&apos;attesa</span>
          </div>

          {/* Content area */}
          <div className="relative z-10 flex flex-1 items-center justify-center p-4" style={{ willChange: 'opacity' }}>
            {!isNotifySuccess ? (
              <div
                className={`w-full max-w-md text-center ${isFullscreenClosing ? 'animate-landing-content-down-exit' : 'animate-landing-content-up'}`}
                style={{ willChange: 'transform, opacity' }}
              >
                <h2
                  className={`mb-4 text-3xl font-black uppercase tracking-tight text-white sm:text-4xl ${isFullscreenClosing ? 'animate-landing-fade-exit' : 'animate-landing-fade-in'}`}
                  style={{ willChange: 'opacity', animationDelay: isFullscreenClosing ? '0ms' : '150ms' }}
                >
                  Ti interessa<br/>{fullscreenGame.alt}?
                </h2>
                <p
                  className={`mb-8 text-base text-white/80 ${isFullscreenClosing ? 'animate-landing-fade-exit' : 'animate-landing-fade-in'}`}
                  style={{ willChange: 'opacity', animationDelay: isFullscreenClosing ? '50ms' : '250ms' }}
                >
                  Siamo quasi pronti! Inserisci la tua email e ti avviseremo appena il gioco sarà disponibile sul marketplace.
                </p>
                <form
                  onSubmit={handleFullscreenNotifySubmit}
                  className={`space-y-4 ${isFullscreenClosing ? 'animate-landing-fade-exit' : 'animate-landing-fade-in'}`}
                  style={{ willChange: 'opacity', animationDelay: isFullscreenClosing ? '100ms' : '350ms' }}
                >
                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-4 top-1/2 z-10 h-5 w-5 -translate-y-1/2 text-white/50" />
                    <input
                      type="email"
                      required
                      placeholder="La tua email..."
                      className="relative w-full rounded-xl border border-white/20 bg-white/10 py-4 pl-12 pr-4 text-white placeholder:text-white/40 outline-none backdrop-blur-md transition-all focus:border-[#FF7300] focus:bg-white/15"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                  <button
                    type="submit"
                    className="group relative w-full overflow-hidden rounded-xl border border-white/30 bg-white/10 py-4 text-sm font-bold uppercase tracking-widest text-white backdrop-blur-md transition-all hover:bg-white/20 hover:scale-[1.02] active:scale-95"
                  >
                    <span className="relative z-10 flex items-center justify-center gap-2">
                      <BellRing className="h-4 w-4" />
                      AVVISAMI
                    </span>
                    <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/10 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
                  </button>
                </form>
              </div>
            ) : (
              <div className="text-center" style={{ willChange: 'transform, opacity' }}>
                <div
                  className={`mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-green-500/20 text-green-400 mx-auto ${isFullscreenClosing ? 'animate-landing-scale-down-exit' : 'animate-landing-success-bounce'}`}
                  style={{ willChange: 'transform' }}
                >
                  <CheckCircle2 className="h-14 w-14" />
                </div>
                <h3 className={`mb-2 text-3xl font-black text-white ${isFullscreenClosing ? 'animate-landing-fade-exit' : 'animate-landing-fade-in'}`}>GRAZIE!</h3>
                <p className={`text-lg text-white/80 ${isFullscreenClosing ? 'animate-landing-fade-exit' : 'animate-landing-fade-in'}`} style={{ animationDelay: isFullscreenClosing ? '0ms' : '100ms' }}>
                  Abbiamo registrato la tua email.<br/>A presto!
                </p>
                <p className={`mt-4 text-sm text-white/60 ${isFullscreenClosing ? 'animate-landing-fade-exit' : 'animate-landing-fade-in'}`} style={{ animationDelay: isFullscreenClosing ? '50ms' : '200ms' }}>
                  Ora ci sono <span className="text-[#FF7300] font-bold">1,248</span> utenti in lista!
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ══════ SCROLL TO TOP BUTTON ══════ */}
      <button
        onClick={handleScrollToTop}
        className={`fixed bottom-6 right-6 z-[10001] flex h-12 w-12 items-center justify-center rounded-full bg-[#FF7300] text-white shadow-[0_4px_20px_rgba(255,115,0,0.4)] transition-all duration-300 hover:bg-[#e66700] hover:scale-110 hover:shadow-[0_6px_28px_rgba(255,115,0,0.6)] active:scale-95 ${
          showScrollTop ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'
        }`}
        aria-label="Torna in cima"
      >
        <ChevronUp className="h-5 w-5" />
      </button>

      {/* Inline keyframes for boutique entry */}
      <style>{`
        @keyframes categoryEnter {
          0% {
            opacity: 0;
            transform: translateY(30px) scale(0.95);
          }
          60% {
            opacity: 0.8;
            transform: translateY(-5px) scale(1.02);
          }
          100% {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
      `}</style>

    </div>
  );
}
