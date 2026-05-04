'use client';

import React, { useRef, useEffect, useCallback, useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  Tag, RefreshCw, Gavel, CircleDollarSign, ShieldCheck,
  ArrowRightLeft, Scale, Package, TrendingUp, X, Mail,
  CheckCircle2, ArrowLeft, BellRing, Users, ChevronUp, ArrowRight,
} from 'lucide-react';
import { getCdnImageUrl, getCdnVideoUrl } from '@/lib/config';
import { useGame } from '@/lib/contexts/GameContext';
import type { GameSlug } from '@/lib/contexts/GameContext';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { useAuth } from '@/lib/hooks/use-auth';
import { SignedAlteredShowcase } from './SignedAlteredShowcase';
import { motion, AnimatePresence } from 'framer-motion';

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
  waitlistCount: number;
}[] => [
  {
    src: getCdnImageUrl('loghi-giochi/pokèmon.png'),
    alt: 'Pokémon Trading Card Game',
    homeHref: '/home/pokemon',
    gameSlug: 'pokemon',
    comingSoon: true,
    waitlistCount: 1247,
  },
  {
    src: getCdnImageUrl('loghi-giochi/yu-gi-oh.png'),
    alt: 'Yu-Gi-Oh! Trading Card Game',
    homeHref: '/home',
    gameSlug: 'clear',
    comingSoon: true,
    waitlistCount: 892,
  },
  { src: getCdnImageUrl('loghi-giochi/One_Piece_Card_Game_Logo%201.png'), alt: 'One Piece Card Game', comingSoon: true, waitlistCount: 1563 },
  { src: getCdnImageUrl('loghi-giochi/Disney_Lorcana_480x480%201.png'), alt: 'Disney Lorcana', comingSoon: true, waitlistCount: 634 },
  {
    src: getCdnImageUrl('star_wars.jpg'),
    alt: 'Star Wars: Unlimited',
    comingSoon: true,
    waitlistCount: 2105,
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
  const [notifyGame, setNotifyGame] = useState<{ src: string; alt: string; waitlistCount: number } | null>(null);
  const [fullscreenGame, setFullscreenGame] = useState<{ src: string; alt: string; bgImage: string; waitlistCount: number } | null>(null);
  const [isFullscreenClosing, setIsFullscreenClosing] = useState(false);
  const [email, setEmail] = useState('');
  const [isNotifySuccess, setIsNotifySuccess] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [waitlistCounts, setWaitlistCounts] = useState<Record<string, number>>(() =>
    Object.fromEntries(getComingSoonGames().map((g) => [g.alt, g.waitlistCount]))
  );
  const [activeFeature, setActiveFeature] = useState<'aste' | 'tornei' | 'brx'>('aste');
  const [isFeatureHovered, setIsFeatureHovered] = useState(false);

  useEffect(() => {
    if (isFeatureHovered) return;
    const features: Array<'aste' | 'tornei' | 'brx'> = ['aste', 'tornei', 'brx'];
    const timer = setTimeout(() => {
      setActiveFeature((prev) => {
        const currentIndex = features.indexOf(prev);
        return features[(currentIndex + 1) % features.length];
      });
    }, 7000);
    return () => clearTimeout(timer);
  }, [activeFeature, isFeatureHovered]);

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
      if (notifyGame) {
        setWaitlistCounts((prev) => ({
          ...prev,
          [notifyGame.alt]: (prev[notifyGame.alt] ?? notifyGame.waitlistCount) + 1,
        }));
      }
      setTimeout(() => {
        setNotifyGame(null);
        setIsNotifySuccess(false);
        setEmail('');
      }, 2000);
    }, 800);
  }, [email, notifyGame]);

  const handleFullscreenNotifySubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setTimeout(() => {
      setIsNotifySuccess(true);
      if (fullscreenGame) {
        setWaitlistCounts((prev) => ({
          ...prev,
          [fullscreenGame.alt]: (prev[fullscreenGame.alt] ?? fullscreenGame.waitlistCount) + 1,
        }));
      }
      setTimeout(() => {
        handleCloseFullscreen();
      }, 2000);
    }, 800);
  }, [email, handleCloseFullscreen, fullscreenGame]);

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
  const parallaxRef = useRef<HTMLDivElement>(null);

  /* ─── parallax scroll effect ─── */
  useEffect(() => {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) return;

    let ticking = false;
    const onScroll = () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(() => {
          if (parallaxRef.current) {
            const scrollY = window.scrollY;
            // Subtle zoom as you scroll → depth parallax feel
            const scale = 1 + scrollY * 0.00005;
            parallaxRef.current.style.transform = `scale(${scale})`;
          }
          ticking = false;
        });
      }
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    videoRef.current?.play().catch(() => {});
  }, []);

  /* ─── render ─── */
  return (
    <div className="relative w-full overflow-x-hidden text-white bg-[#0F172A]">

      {/* ══════ BACKGROUND VIDEO — parallax scroll effect ══════ */}
      <div
        ref={parallaxRef}
        className="pointer-events-none fixed inset-0 z-0 h-screen w-screen will-change-transform"
      >
        <video
          ref={videoRef}
          src={getCdnVideoUrl(LANDING_BG_VIDEO)}
          className="absolute inset-0 w-full h-full object-cover object-center"
          autoPlay loop muted playsInline
          disablePictureInPicture disableRemotePlayback aria-hidden
        />
        {/* Dark overlay */}
        <div
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(180deg, rgba(15,23,42,0.55) 0%, rgba(29,49,96,0.40) 50%, rgba(15,23,42,0.65) 100%)',
          }}
        />
      </div>

      {/* ══════ CONTENT LAYER ══════ */}
      <div className="relative z-[2] flex flex-col">

        {/* ────── LOGO + TAGLINE — same row ────── */}
        <header className="bento-entry flex items-center justify-center px-4 pt-6 pb-4 sm:pt-6 sm:pb-5 md:pt-5 md:pb-3" style={{ animationDelay: '0ms' }}>
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
              Colleziona, competi e vinci —{' '}
              <Link href="/tornei-live" className="font-bold text-[#38BDF8] hover:underline">
                BRX Express
              </Link>{' '}
              in 24h,{' '}
              <Link href="/aste" className="font-bold text-[#FB923C] hover:underline">
                Aste
              </Link>{' '}
              e{' '}
              <Link href="/tornei-live" className="font-bold text-[#A78BFA] hover:underline">
                Tornei Live
              </Link>
            </h1>
          </div>
        </header>

        {/* ═══════════════════════════════════════════════
            HERO — Card Magic (left) + Feature Carousel (right)
            ═══════════════════════════════════════════════ */}
        <section className="px-4 pt-4 pb-8 sm:px-5 sm:pt-5 sm:pb-10 md:px-6 md:pt-4 md:pb-8">
          <div className="mx-auto grid w-full max-w-6xl gap-5 sm:gap-6 md:gap-5 grid-cols-1 lg:grid-cols-2">

            {/* ──── LEFT: MAGIC CARD ──── */}
            <div
              className="bento-entry bento-card group relative flex flex-col min-h-[180px] sm:min-h-[200px] md:min-h-[220px] lg:min-h-[260px] rounded-2xl"
              style={{ animationDelay: '180ms' }}
            >
              {/* Rotating border glow — MTG Red/White/Blue */}
              <div className="pointer-events-none absolute -inset-[3px] z-0 overflow-hidden rounded-[18px]">
                <div
                  className="absolute -inset-[50%] h-[200%] w-[200%]"
                  style={{
                    background: 'conic-gradient(from 0deg, transparent 0%, rgba(220,38,38,0.22) 10%, rgba(248,113,113,0.18) 22%, rgba(239,68,68,0.22) 35%, transparent 60%)',
                    filter: 'blur(22px)',
                    animation: 'magicRotateBorder 8s linear infinite',
                  }}
                />
              </div>

              {/* Inner glass mask */}
              <div
                className="pointer-events-none absolute inset-[1px] z-[1] rounded-[14px]"
                style={{
                  background: 'linear-gradient(135deg, rgba(239,68,68,0.10) 0%, rgba(15,23,42,0.40) 45%, rgba(59,130,246,0.10) 100%)',
                  backdropFilter: 'blur(16px)',
                  WebkitBackdropFilter: 'blur(16px)',
                  border: '1px solid rgba(239,68,68,0.30)',
                }}
              />

              {/* Pulsating glow overlay */}
              <div
                className="pointer-events-none absolute inset-0 rounded-2xl z-[1]"
                style={{
                  animation: 'magicPulse 3s ease-in-out infinite',
                  animationDelay: '180ms',
                }}
              />

              <Link
                href="/home/magic"
                id="hero-magic-card"
                className="relative z-[2] flex flex-1 items-center justify-between overflow-hidden rounded-2xl p-5 sm:p-6 md:p-7 lg:p-8 transition-all duration-500 hover:shadow-[0_0_40px_rgba(239,68,68,0.30)] hover:scale-[1.01]"
                aria-label={t('landing.gameAria.goHome', { name: 'Magic The Gathering' })}
                onClick={() => setSelectedGame('mtg')}
              >
                {/* Badge "Disponibile subito" — centered pill */}
                <span className="magic-pill absolute left-1/2 top-3 z-10 -translate-x-1/2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[8px] sm:text-[9px] font-bold uppercase tracking-widest text-white"
                  style={{
                    animation: 'magicPillGlow 4s ease-in-out infinite',
                    animationDelay: '180ms',
                  }}
                >
                  Disponibile subito!
                </span>

                {/* Decorative glows */}
                <div className="pointer-events-none absolute -left-12 -top-12 h-48 w-48 rounded-full bg-red-500/8 blur-3xl" />
                <div className="pointer-events-none absolute -right-8 bottom-0 h-32 w-32 rounded-full bg-blue-500/8 blur-3xl" />

                {/* Left side: Text */}
                <div className="relative z-10 flex flex-col gap-1 sm:gap-1.5">
                  <h2 className="font-display text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold uppercase tracking-tight text-white drop-shadow-lg">
                    Magic: The Gathering
                  </h2>
                  <p className="max-w-md text-[11px] sm:text-xs md:text-sm text-white/50">
                    Compra, vendi e metti all&apos;asta le tue carte. Inizia subito.
                  </p>
                </div>

                {/* Right side: Game logo */}
                <div className="relative z-10 flex shrink-0 items-center justify-center">
                  <div className="relative h-20 w-36 sm:h-24 sm:w-44 md:h-28 md:w-52 lg:h-36 lg:w-64 transition-transform duration-500 group-hover:scale-110">
                    <img
                      src={MAIN_GAMES[0].src}
                      alt={MAIN_GAMES[0].alt}
                      className="h-full w-full object-contain drop-shadow-[0_0_24px_rgba(239,68,68,0.35)]"
                    />
                  </div>
                </div>

                {/* CTA hint */}
                <div className="absolute bottom-3 right-3 z-20 flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-red-300/70 transition-colors duration-300 group-hover:text-red-200">
                  <span>Scopri il mondo di magic</span>
                  <motion.div
                    animate={{ x: [0, 4, 0] }}
                    transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
                  >
                    <ArrowRight className="h-3 w-3" />
                  </motion.div>
                </div>
              </Link>
            </div>

            {/* ──── RIGHT: FEATURE CAROUSEL ──── */}
            <div 
              className="flex flex-col gap-3 sm:gap-4 min-h-[180px] sm:min-h-[200px] md:min-h-[220px] lg:min-h-[260px]"
              onMouseEnter={() => setIsFeatureHovered(true)}
              onMouseLeave={() => setIsFeatureHovered(false)}
            >
              {/* 3 Buttons */}
              <div className="flex gap-2.5 sm:gap-3">
                {(['aste', 'tornei', 'brx'] as const).map((key) => {
                  const isActive = activeFeature === key;
                  const labels: Record<string, string> = { aste: 'Scopri le aste', tornei: 'Tornei Live', brx: 'BRX Express' };
                  const gradients: Record<string, string> = {
                    aste: 'linear-gradient(135deg, rgba(251,146,60,0.12) 0%, rgba(15,23,42,0.35) 100%)',
                    tornei: 'linear-gradient(135deg, rgba(167,139,250,0.12) 0%, rgba(15,23,42,0.35) 100%)',
                    brx: 'linear-gradient(135deg, rgba(56,189,248,0.12) 0%, rgba(15,23,42,0.35) 100%)',
                  };
                  const borders: Record<string, string> = {
                    aste: 'border-orange-400/40',
                    tornei: 'border-violet-400/40',
                    brx: 'border-sky-400/40',
                  };
                  const activeBorders: Record<string, string> = {
                    aste: 'border-orange-400/70',
                    tornei: 'border-violet-400/70',
                    brx: 'border-sky-400/70',
                  };
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setActiveFeature(key)}
                      className={`bento-entry relative flex-1 overflow-hidden rounded-xl border px-3 py-3 sm:px-4 sm:py-3.5 text-[10px] sm:text-[11px] md:text-xs font-bold uppercase tracking-wider text-white transition-all duration-300 hover:scale-[1.02] ${isActive ? activeBorders[key] : borders[key]} ${isActive ? 'bg-white/10 shadow-[0_0_20px_rgba(255,255,255,0.08)]' : 'bg-white/5'}`}
                      style={{
                        animationDelay: key === 'aste' ? '200ms' : key === 'tornei' ? '260ms' : '320ms',
                        background: isActive ? gradients[key] : undefined,
                        backdropFilter: 'blur(12px)',
                        WebkitBackdropFilter: 'blur(12px)',
                      }}
                    >
                      {/* Progress indicator */}
                      <span
                        className={`absolute inset-x-2 bottom-1 h-0.5 rounded-full origin-left ${key === 'aste' ? 'bg-orange-400' : key === 'tornei' ? 'bg-violet-400' : 'bg-sky-400'}`}
                        style={{
                          transform: `scaleX(${isActive ? 1 : 0})`,
                          opacity: isActive ? 0.7 : 0,
                          transition: isActive
                            ? 'transform 7000ms linear, opacity 400ms ease'
                            : 'transform 300ms ease-out, opacity 200ms ease',
                        }}
                      />
                      {labels[key]}
                    </button>
                  );
                })}
              </div>

              {/* Content Panel */}
              <div className="relative flex-1 overflow-hidden rounded-2xl border border-white/15 bg-white/5 backdrop-blur-md transition-all duration-500">
                <AnimatePresence mode="wait">
                  {activeFeature === 'aste' && (
                    <motion.div
                      key="aste"
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.3 }}
                      className="absolute inset-0 flex flex-col p-4 sm:p-5 group/card cursor-pointer hover:bg-white/5 transition-colors"
                    >
                      <Link href="/aste" className="absolute inset-0 z-10" aria-label="Esplora le Aste" />

                      {/* Top: Title & Mobile Arrow */}
                      <div className="mb-2 sm:mb-3 flex items-center justify-between relative z-20 pointer-events-none">
                        <h3 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-black uppercase tracking-tight text-white group-hover/card:text-[#FB923C] transition-colors">
                          Aste
                        </h3>
                        {/* Mobile Arrow */}
                        <motion.div
                          animate={{ x: [0, 4, 0] }}
                          transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
                          className="sm:hidden text-[#FB923C]"
                        >
                          <ArrowRight className="h-5 w-5" />
                        </motion.div>
                      </div>

                      {/* Description */}
                      <p className="flex-1 text-xs sm:text-sm md:text-base leading-relaxed text-white/80 relative z-20 pointer-events-none pr-1">
                        Metti all&apos;asta le tue carte o fai offerte su quelle disponibili.
                        Trova il prezzo giusto per le tue collezionabili in modo sicuro e trasparente.
                      </p>

                      {/* Desktop CTA */}
                      <div className="mt-3 hidden sm:flex items-center justify-between rounded-xl border border-[#FB923C]/40 bg-[#FB923C]/15 px-4 py-2.5 text-[10px] sm:text-xs font-bold uppercase tracking-wider text-[#FB923C] transition-all duration-300 group-hover/card:bg-[#FB923C]/25 group-hover/card:border-[#FB923C]/60 group-hover/card:shadow-[0_0_20px_rgba(251,146,60,0.2)] relative z-20 pointer-events-none">
                        <span>Esplora le Aste</span>
                        <span className="text-sm">→</span>
                      </div>
                    </motion.div>
                  )}
                  {activeFeature === 'tornei' && (
                    <motion.div
                      key="tornei"
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.3 }}
                      className="absolute inset-0 flex flex-col p-4 sm:p-5 group/card cursor-pointer hover:bg-white/5 transition-colors"
                    >
                      <Link href="/tornei-live" className="absolute inset-0 z-10" aria-label="Scopri i Tornei" />

                      {/* Top: Title & Mobile Arrow */}
                      <div className="mb-2 sm:mb-3 flex items-center justify-between relative z-20 pointer-events-none">
                        <h3 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-black uppercase tracking-tight text-white group-hover/card:text-[#A78BFA] transition-colors">
                          Tornei Live
                        </h3>
                        {/* Mobile Arrow */}
                        <motion.div
                          animate={{ x: [0, 4, 0] }}
                          transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
                          className="sm:hidden text-[#A78BFA]"
                        >
                          <ArrowRight className="h-5 w-5" />
                        </motion.div>
                      </div>

                      {/* Description */}
                      <p className="flex-1 text-xs sm:text-sm md:text-base leading-relaxed text-white/80 relative z-20 pointer-events-none pr-1">
                        Partecipa ai tornei live, competi con altri giocatori e scala le classifiche
                        in tempo reale. Montepremi garantiti e community attiva.
                      </p>

                      {/* Desktop CTA */}
                      <div className="mt-3 hidden sm:flex items-center justify-between rounded-xl border border-[#A78BFA]/40 bg-[#A78BFA]/15 px-4 py-2.5 text-[10px] sm:text-xs font-bold uppercase tracking-wider text-[#A78BFA] transition-all duration-300 group-hover/card:bg-[#A78BFA]/25 group-hover/card:border-[#A78BFA]/60 group-hover/card:shadow-[0_0_20px_rgba(167,139,250,0.2)] relative z-20 pointer-events-none">
                        <span>Scopri i Tornei</span>
                        <span className="text-sm">→</span>
                      </div>
                    </motion.div>
                  )}
                  {activeFeature === 'brx' && (
                    <motion.div
                      key="brx"
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.3 }}
                      className="absolute inset-0 flex flex-col p-4 sm:p-5 group/card cursor-pointer hover:bg-white/5 transition-colors"
                    >
                      <Link href="/tornei-live" className="absolute inset-0 z-10" aria-label="Scopri BRX Express" />

                      {/* Top: Title & Mobile Arrow */}
                      <div className="mb-2 sm:mb-3 flex items-center justify-between relative z-20 pointer-events-none">
                        <h3 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-black uppercase tracking-tight text-white group-hover/card:text-[#38BDF8] transition-colors">
                          BRX Express
                        </h3>
                        {/* Mobile Arrow */}
                        <motion.div
                          animate={{ x: [0, 4, 0] }}
                          transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
                          className="sm:hidden text-[#38BDF8]"
                        >
                          <ArrowRight className="h-5 w-5" />
                        </motion.div>
                      </div>

                      {/* Description */}
                      <p className="flex-1 text-xs sm:text-sm md:text-base leading-relaxed text-white/80 relative z-20 pointer-events-none pr-1">
                        Logistica decentralizzata e spedizione in 24h. Il futuro del trading card game
                        è qui: consegna rapida, sicura e tracciata.
                      </p>

                      {/* Desktop CTA */}
                      <div className="mt-3 hidden sm:flex items-center justify-between rounded-xl border border-[#38BDF8]/40 bg-[#38BDF8]/15 px-4 py-2.5 text-[10px] sm:text-xs font-bold uppercase tracking-wider text-[#38BDF8] transition-all duration-300 group-hover/card:bg-[#38BDF8]/25 group-hover/card:border-[#38BDF8]/60 group-hover/card:shadow-[0_0_20px_rgba(56,189,248,0.2)] relative z-20 pointer-events-none">
                        <span>Scopri BRX Express</span>
                        <span className="text-sm">→</span>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

          </div>
        </section>

        {/* ═══════════════════════════════════════════════
            COMING SOON GAMES — infinite horizontal scroll
            ═══════════════════════════════════════════════ */}
        <section className="bento-entry px-4 pb-8 sm:px-6 sm:pb-10" style={{ animationDelay: '480ms' }}>
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
                {[...COMING_SOON_GAMES, ...COMING_SOON_GAMES].map((game, index) => (
                  <button
                    key={`${game.alt}-${index}`}
                    type="button"
                    className="group flex h-14 w-14 sm:h-16 sm:w-16 md:h-20 md:w-20 lg:h-24 lg:w-24 items-center justify-center rounded-full cursor-pointer overflow-hidden bg-white/10 border border-white/20 transition-transform duration-300 hover:scale-110 flex-shrink-0"
                    onClick={() => {
                      const bgImage = GAME_FULLSCREEN_IMAGES[game.alt];
                      const count = waitlistCounts[game.alt] ?? game.waitlistCount;
                      if (bgImage) {
                        setFullscreenGame({ src: game.src, alt: game.alt, bgImage, waitlistCount: count });
                      } else {
                        setNotifyGame({ src: game.src, alt: game.alt, waitlistCount: count });
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

        {/* ═══════════════════════════════════════════════
            FEATURES + BOUTIQUE (below the fold) — video shows through
            ═══════════════════════════════════════════════ */}
        <section className="relative w-full overflow-hidden px-4 pt-12 pb-12 sm:px-5 sm:pt-14 sm:pb-14 md:pt-12 md:pb-10 z-[2]">
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

              <div className="grid w-full grid-cols-2 md:grid-cols-3 gap-x-4 sm:gap-x-5 md:gap-x-6 gap-y-6 sm:gap-y-7 md:gap-y-8">
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
            <div className="mx-auto my-8 sm:my-10 md:my-10 h-px w-2/3 max-w-lg bg-gradient-to-r from-transparent via-white/30 to-transparent" />

            {/* ─── Boutique Cards ─── */}
            <div className="mt-10 sm:mt-12 md:mt-14 text-center">
              <h3 className="mb-5 sm:mb-6 md:mb-8 text-xs sm:text-sm md:text-base font-semibold uppercase tracking-widest text-white/90">
                La Nostra Boutique
              </h3>

              <div className="grid grid-cols-3 sm:grid-cols-6 gap-4 sm:gap-4 md:gap-5 max-w-5xl mx-auto px-2 sm:px-3">
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

            {/* ─── Signed & Altered Collections Showcase ─── */}
            <div className="mt-12 sm:mt-14 md:mt-16">
              <SignedAlteredShowcase />
            </div>

          </div>
        </section>

        {/* ─── Transition zone before footer ─── */}
        <div className="relative z-[2] w-full h-20 sm:h-28 bg-gradient-to-b from-transparent via-[#0F172A]/80 to-[#1D3160]" />

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

                <div className="mb-3 flex items-center gap-2 rounded-full bg-[#FF7300]/90 px-4 py-2 text-white shadow-lg">
                  <Users className="h-4 w-4" />
                  <span className="text-sm font-semibold">{notifyGame.waitlistCount.toLocaleString('it-IT')} in lista d&apos;attesa</span>
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
                <p className="mt-4 text-sm text-white/60">
                  Ora ci sono <span className="text-[#FF7300] font-bold">{(notifyGame.waitlistCount + 1).toLocaleString('it-IT')}</span> utenti in lista!
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
            <span className="text-sm font-semibold">{fullscreenGame.waitlistCount.toLocaleString('it-IT')} in lista d&apos;attesa</span>
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
                  Ora ci sono <span className="text-[#FF7300] font-bold">{(fullscreenGame.waitlistCount + 1).toLocaleString('it-IT')}</span> utenti in lista!
                </p>
              </div>
            )}
          </div>
        </div>
      )}

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

        @keyframes magicPulse {
          0%, 100% {
            box-shadow: 0 0 20px rgba(239,68,68,0.15), 0 0 60px rgba(59,130,246,0.08), inset 0 0 20px rgba(239,68,68,0.05);
          }
          50% {
            box-shadow: 0 0 40px rgba(239,68,68,0.35), 0 0 100px rgba(59,130,246,0.18), inset 0 0 30px rgba(239,68,68,0.12);
          }
        }

        @keyframes magicRotateBorder {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }

        @keyframes magicPillGlow {
          0%, 65% {
            box-shadow: 0 0 12px rgba(239,68,68,0.15);
            border-color: rgba(255,255,255,0.15);
            text-shadow: none;
          }
          72% {
            box-shadow: 0 0 32px rgba(239,68,68,0.9), 0 0 64px rgba(239,68,68,0.6), inset 0 0 16px rgba(239,68,68,0.3);
            border-color: rgba(239,68,68,0.7);
            text-shadow: 0 0 10px rgba(239,68,68,0.8);
          }
          80% {
            box-shadow: 0 0 32px rgba(239,68,68,0.9), 0 0 64px rgba(239,68,68,0.6), inset 0 0 16px rgba(239,68,68,0.3);
            border-color: rgba(239,68,68,0.7);
            text-shadow: 0 0 10px rgba(239,68,68,0.8);
          }
          87%, 100% {
            box-shadow: 0 0 12px rgba(239,68,68,0.15);
            border-color: rgba(255,255,255,0.15);
            text-shadow: none;
          }
        }
      `}</style>

    </div>
  );
}
