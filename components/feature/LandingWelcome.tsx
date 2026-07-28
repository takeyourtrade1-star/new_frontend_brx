'use client';

import React, { useEffect, useCallback, useMemo, useState } from 'react';
import type { LucideProps } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import {
  CircleDollarSign, ShieldCheck,
  ArrowRightLeft, Scale, Package, TrendingUp, X, Mail,
  CheckCircle2, ArrowLeft, BellRing, Users,
  ArrowRight, ScanLine,
} from 'lucide-react';
import { getCdnImageUrl } from '@/lib/config';
import { TOURNAMENTS_PORTAL_LINK_PROPS } from '@/lib/config/tournaments';
import { useGame } from '@/lib/contexts/GameContext';
import type { GameSlug } from '@/lib/contexts/GameContext';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { useIntlLocale } from '@/lib/i18n/useIntlLocale';
import { useTimeouts } from '@/lib/hooks/use-timeout-fn';
import { SignedAlteredShowcase } from './SignedAlteredShowcase';
import { CardFoilOverlay } from './product/detail/CardFoilOverlay';
import { LandingBackgroundVideo } from '@/components/feature/LandingBackgroundVideo';
import { LANDING_ROTATION_MS, LANDING_ROTATION_COLORS } from '@/components/home/landingMotion';

/* ═══════════════════════════════════════════════════════════
   CONSTANTS
   ═══════════════════════════════════════════════════════════ */

type LandingGameSlug = GameSlug | 'clear';

const FEATURE_ICONS: Record<string, React.FC<LucideProps>> = {
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

/** Sfondo gradiente leggero per ogni gioco, sui colori del brand:
 * Pokémon (giallo/blu), Yu-Gi-Oh! (viola/oro), One Piece (rosso/oro),
 * Lorcana (turchese/oro inchiostro), Star Wars (blu/ambra). */
const GAME_GRADIENTS: Record<string, string> = {
  'Pokémon Trading Card Game': 'from-[#FFCB05]/25 to-[#2A75BB]/25',
  'Yu-Gi-Oh! Trading Card Game': 'from-[#7A3FA0]/30 to-[#C9A227]/20',
  'One Piece Card Game': 'from-[#D8232A]/[28%] to-[#E0A23B]/20',
  'Disney Lorcana': 'from-[#15A6A6]/[28%] to-[#D4AF37]/20',
  'Star Wars: Unlimited': 'from-[#1E6FB8]/[26%] to-[#F2C200]/[18%]',
};

const getComingSoonGames = (): {
  src: string;
  alt: string;
  label: string;
  homeHref?: string;
  comingSoon?: boolean;
  gameSlug?: LandingGameSlug;
  waitlistCount: number;
}[] => [
  {
    src: getCdnImageUrl('loghi-giochi/pokèmon.png'),
    alt: 'Pokémon Trading Card Game',
    label: 'Pokémon',
    homeHref: '/home/pokemon',
    gameSlug: 'pokemon',
    comingSoon: true,
    waitlistCount: 1247,
  },
  {
    src: getCdnImageUrl('loghi-giochi/yu-gi-oh.png'),
    alt: 'Yu-Gi-Oh! Trading Card Game',
    label: 'Yu-Gi-Oh!',
    homeHref: '/home',
    gameSlug: 'clear',
    comingSoon: true,
    waitlistCount: 892,
  },
  {
    src: getCdnImageUrl('loghi-giochi/One_Piece_Card_Game_Logo%201.png'),
    alt: 'One Piece Card Game',
    label: 'One Piece',
    comingSoon: true,
    waitlistCount: 1563,
  },
  {
    src: getCdnImageUrl('loghi-giochi/Disney_Lorcana_480x480%201.png'),
    alt: 'Disney Lorcana',
    label: 'Lorcana',
    comingSoon: true,
    waitlistCount: 634,
  },
  {
    src: getCdnImageUrl('star_wars.jpg'),
    alt: 'Star Wars: Unlimited',
    label: 'Star Wars',
    comingSoon: true,
    waitlistCount: 2105,
  },
];

/** Giochi TCG presenti sul catalogo Cardmarket ma non ancora mostrati qui singolarmente
 * (Magic + i 5 di COMING_SOON_GAMES sono già visibili): mostrato come tile "+N" in stile Cardmarket. */
const EXTRA_COMING_SOON_GAMES_COUNT = 10;

/* ─── Boutique ─── */
const BOUTIQUE_GLOW_COLORS: Record<string, string> = {
  dadi: '251, 191, 36',
  buste: '167, 139, 250',
  tappetini: '56, 189, 248',
  memorabilia: '251, 146, 60',
  albums: '251, 113, 133',
  'game-kits': '255, 115, 0',
};

// Tutte le card rimandano alla pagina Boutique standard (non a categorie filtrate).
const BOUTIQUE_CATEGORIES = [
  { id: 'dadi', label: 'Dadi', href: '/products/boutique',
    imageUrl: '/ebartex-boutique/dadi-boutique.webp',
    imageSet: { sm: '/ebartex-boutique/dadi-boutique-sm.webp', md: '/ebartex-boutique/dadi-boutique-md.webp', lg: '/ebartex-boutique/dadi-boutique-lg.webp' }
  },
  { id: 'buste', label: 'Buste', href: '/products/boutique',
    imageUrl: '/ebartex-boutique/buste-boutique.webp',
    imageSet: { sm: '/ebartex-boutique/buste-boutique-sm.webp', md: '/ebartex-boutique/buste-boutique-md.webp', lg: '/ebartex-boutique/buste-boutique-lg.webp' }
  },
  { id: 'tappetini', label: 'Tappetini', href: '/products/boutique',
    imageUrl: '/ebartex-boutique/tappetini-boutique.webp',
    imageSet: { sm: '/ebartex-boutique/tappetini-boutique-sm.webp', md: '/ebartex-boutique/tappetini-boutique-md.webp', lg: '/ebartex-boutique/tappetini-boutique-lg.webp' }
  },
  { id: 'memorabilia', label: 'Memorabilia', href: '/products/boutique',
    imageUrl: '/ebartex-boutique/memorabilia-boutique.webp',
    imageSet: { sm: '/ebartex-boutique/memorabilia-boutique-sm.webp', md: '/ebartex-boutique/memorabilia-boutique-md.webp', lg: '/ebartex-boutique/memorabilia-boutique-lg.webp' }
  },
  { id: 'albums', label: 'Albums', href: '/products/boutique',
    imageUrl: '/ebartex-boutique/albums-boutique.webp',
    imageSet: { sm: '/ebartex-boutique/albums-boutique-sm.webp', md: '/ebartex-boutique/albums-boutique-md.webp', lg: '/ebartex-boutique/albums-boutique-lg.webp' }
  },
  { id: 'game-kits', label: 'Game kits', href: '/products/boutique',
    imageUrl: '/ebartex-boutique/gamekits-boutique.webp',
    imageSet: { sm: '/ebartex-boutique/gamekits-boutique-sm.webp', md: '/ebartex-boutique/gamekits-boutique-md.webp', lg: '/ebartex-boutique/gamekits-boutique-lg.webp' }
  },
];

/* ═══════════════════════════════════════════════════════════
   HERO TAGLINE — punti sincronizzati col ventaglio di carte:
   stesso ordine (Vendi, Aste, Scambi, Tornei, BRX), stessa palette
   e stesso indice attivo. Hover/focus su un punto porta in primo
   piano la carta corrispondente; click naviga alla feature.
   ═══════════════════════════════════════════════════════════ */

/** Rotte dei punti, nello stesso ordine di LANDING_ROTATION_COLORS. */
const HERO_POINT_ROUTES: { href: string; external?: boolean }[] = [
  { href: '/vendi' },
  { href: '/aste' },
  { href: '/scambi' },
  { href: TOURNAMENTS_PORTAL_LINK_PROPS.href, external: true },
  { href: '/brx-express' },
];

const KEYWORD_REGEX_BY_LOCALE: Record<string, RegExp> = {
  it: /(BRX Express|comprare|vendere|scambiare|all'asta|asta|tornei live)/gi,
  en: /(BRX Express|buy|sell|trade|auction|live tournaments)/gi,
  es: /(BRX Express|comprar|vender|intercambiar|subastar|torneos en vivo)/gi,
  pt: /(BRX Express|comprar|vender|trocar|leilão|torneios ao vivo)/gi,
  fr: /(BRX Express|acheter|vendre|échanger|aux enchères|enchères|tournois en direct)/gi,
  de: /(BRX Express|kaufen|verkaufen|tauschen|versteigern|live-turniere)/gi,
};

function highlightKeywords(text: string, isActive: boolean, locale: string) {
  const regex = KEYWORD_REGEX_BY_LOCALE[locale] || KEYWORD_REGEX_BY_LOCALE['it'];
  const parts = text.split(regex);
  if (parts.length === 1) return text;

  return parts.map((part, i) => {
    if (part.match(regex)) {
      return (
        <span
          key={i}
          className={`hero-keyword transition-all duration-500 font-bold ${
            isActive ? 'hero-keyword-active' : 'hero-keyword-inactive'
          }`}
        >
          {part}
        </span>
      );
    }
    return part;
  });
}

function HeroTaglinePoints({
  active,
  setActive,
  setPaused,
}: {
  active: number;
  setActive: (i: number) => void;
  setPaused: (paused: boolean) => void;
}) {
  const { t, locale } = useTranslation();

  // Riordinati per combaciare con la rotazione del ventaglio:
  // point1=Vendi, point3=Aste, point2=Scambi, point4=Tornei, point5=BRX.
  const points = [
    t('landing.hero.static.point1'),
    t('landing.hero.static.point3'),
    t('landing.hero.static.point2'),
    t('landing.hero.static.point4'),
    t('landing.hero.static.point5'),
  ];

  return (
    <div className="flex flex-col text-left py-1 sm:py-2 max-w-xl lg:max-w-2xl">
      {/* Intro phrase */}
      <span className="text-xl font-extrabold uppercase tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-white via-white/95 to-white/70 sm:text-xl md:text-2xl lg:text-3xl mb-3 sm:mb-4 text-left drop-shadow-md select-none">
        {t('landing.hero.static.intro')}
      </span>

      {/* List points — colore e stato attivo condivisi col ventaglio */}
      <ul className="space-y-2 sm:space-y-2.5 text-left">
        {points.map((point, index) => {
          const color = LANDING_ROTATION_COLORS[index];
          const route = HERO_POINT_ROUTES[index];
          const isActive = index === active;

          const content = (
            <>
              <span
                className="flex-shrink-0 w-2.5 h-2.5 mt-[0.45rem] rounded-full transition-all duration-300"
                style={{
                  backgroundColor: color.hex,
                  opacity: isActive ? 1 : 0.5,
                  transform: isActive ? 'scale(1.3)' : 'scale(1)',
                  boxShadow: isActive ? `0 0 12px ${color.glow}` : 'none',
                }}
                aria-hidden
              />
              <span
                className={`text-base lg:text-[1.05rem] leading-relaxed font-medium ${
                  isActive
                    ? 'hero-point-reveal'
                    : 'text-white/60 transition-colors duration-300 group-hover:text-white/90'
                }`}
                style={isActive ? { ['--point-color' as string]: color.hex } : undefined}
              >
                {highlightKeywords(point, isActive, locale)}
              </span>
            </>
          );

          const sharedProps = {
            className:
              'group flex items-start gap-3 text-left rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50',
            onMouseEnter: () => {
              setActive(index);
              setPaused(true);
            },
            onMouseLeave: () => setPaused(false),
            onFocus: () => {
              setActive(index);
              setPaused(true);
            },
            onBlur: () => setPaused(false),
          };

          return (
            <li key={index}>
              {route.external ? (
                <a {...TOURNAMENTS_PORTAL_LINK_PROPS} {...sharedProps}>
                  {content}
                </a>
              ) : (
                <Link href={route.href} {...sharedProps}>
                  {content}
                </Link>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   COMPONENT
   ═══════════════════════════════════════════════════════════ */

export function LandingWelcome() {
  const { t } = useTranslation();
  const intlLocale = useIntlLocale();
  const { setSelectedGame } = useGame();

  /* ─── state ─── */
  const [heroRotationIdx, setHeroRotationIdx] = useState(0);
  const [heroRotationPaused, setHeroRotationPaused] = useState(false);

  useEffect(() => {
    if (heroRotationPaused) return;
    const interval = setInterval(() => {
      setHeroRotationIdx((prev) => (prev + 1) % 5);
    }, LANDING_ROTATION_MS);
    return () => clearInterval(interval);
  }, [heroRotationPaused]);

  const [notifyGame, setNotifyGame] = useState<{ src: string; alt: string; waitlistCount: number } | null>(null);
  const [fullscreenGame, setFullscreenGame] = useState<{ src: string; alt: string; bgImage: string; waitlistCount: number } | null>(null);
  const [isFullscreenClosing, setIsFullscreenClosing] = useState(false);
  const [email, setEmail] = useState('');
  const [isNotifySuccess, setIsNotifySuccess] = useState(false);
  const [waitlistCounts, setWaitlistCounts] = useState<Record<string, number>>(() =>
    Object.fromEntries(getComingSoonGames().map((g) => [g.alt, g.waitlistCount]))
  );

  /* ─── handlers ─── */
  const schedule = useTimeouts();

  const handleCloseFullscreen = useCallback(() => {
    setIsFullscreenClosing(true);
    schedule(() => {
      setFullscreenGame(null);
      setIsFullscreenClosing(false);
      setIsNotifySuccess(false);
      setEmail('');
    }, 400);
  }, [schedule]);

  const handleNotifySubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    schedule(() => {
      setIsNotifySuccess(true);
      if (notifyGame) {
        setWaitlistCounts((prev) => ({
          ...prev,
          [notifyGame.alt]: (prev[notifyGame.alt] ?? notifyGame.waitlistCount) + 1,
        }));
      }
      schedule(() => {
        setNotifyGame(null);
        setIsNotifySuccess(false);
        setEmail('');
      }, 2000);
    }, 800);
  }, [email, notifyGame, schedule]);

  const handleFullscreenNotifySubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    schedule(() => {
      setIsNotifySuccess(true);
      if (fullscreenGame) {
        setWaitlistCounts((prev) => ({
          ...prev,
          [fullscreenGame.alt]: (prev[fullscreenGame.alt] ?? fullscreenGame.waitlistCount) + 1,
        }));
      }
      schedule(() => {
        handleCloseFullscreen();
      }, 2000);
    }, 800);
  }, [email, handleCloseFullscreen, fullscreenGame, schedule]);

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

  /* ─── render ─── */
  return (
    <div className="relative w-full overflow-x-hidden text-white bg-[#0F172A]">

      <LandingBackgroundVideo />

      {/* ══════ CONTENT LAYER ══════ */}
      <div className="relative z-[2] flex flex-col">

        {/* ═══════════════════════════════════════════════
            HERO — logo + tagline + ventaglio su una riga,
            card Magic grande sotto: tutto entro il viewport.
            ═══════════════════════════════════════════════ */}
        {/* min-h oltre il viewport di proposito: la piega taglia le tile dei
            giochi in arrivo a metà — sopra si vedono "Presto in arrivo" e la
            parte alta delle tile, invito a scrollare. */}
        <section className="flex min-h-[calc(100svh-40px)] flex-col px-4 pt-8 pb-0 sm:px-5 sm:pt-10 md:px-6 xl:pt-6">

          {/* ────── LOGO + TAGLINE + CARDS — same row, centrata nello spazio
                     libero; la card Magic è ancorata in fondo al viewport ────── */}
          <header className="bento-entry flex flex-1 items-center justify-center" style={{ animationDelay: '0ms' }}>
            <div className="flex w-full max-w-7xl flex-col items-center gap-8 xl:flex-row xl:items-center xl:justify-center xl:gap-14">
              <Image
                src={getCdnImageUrl('Logo%20Principale%20EBARTEX.png')}
                alt="Ebartex"
                width={800}
                height={300}
                className="h-28 w-auto shrink-0 object-contain sm:h-32 md:h-36 xl:h-40"
                sizes="(max-width: 640px) 300px, (max-width: 1024px) 350px, 450px"
                priority
                unoptimized
              />
              <div className="flex items-stretch justify-center gap-4 sm:gap-6 md:gap-8">
                <div className="self-stretch w-px bg-white/15 hidden md:block my-3" />
                <HeroTaglinePoints
                  active={heroRotationIdx}
                  setActive={setHeroRotationIdx}
                  setPaused={setHeroRotationPaused}
                />
              </div>
            </div>
          </header>

          <div className="mx-auto mt-16 w-full max-w-4xl sm:mt-12">

            {/* ──── MAGIC CARD ──── */}
            <div
              className="bento-entry group relative flex flex-col min-h-[200px] sm:min-h-[210px] md:min-h-[230px] rounded-2xl border border-white/10 bg-[#0F172A]/50 backdrop-blur-md overflow-hidden w-full"
              style={{ animationDelay: '180ms' }}
            >
              <Link
                href="/home/magic"
                id="hero-magic-card"
                className="relative flex flex-col flex-1 rounded-2xl transition-all duration-500 hover:bg-white/[0.03]"
                aria-label={t('landing.gameAria.goHome', { name: 'Magic The Gathering' })}
                onClick={() => setSelectedGame('mtg')}
              >
                {/* Badge "Disponibile subito" — centered pill */}
                <span className="absolute left-1/2 top-4 z-10 -translate-x-1/2 rounded-full border border-white/15 bg-white/10 px-4 py-1.5 text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-white shadow-md">
                  Disponibile subito!
                </span>

                {/* Metà Magic: bordo-a-bordo della card, dal top fino alla
                    linea divisoria — il velo foil (stesso delle 3 card blu
                    della home Magic) copre tutta questa zona */}
                <div className="relative flex flex-1 flex-col overflow-hidden rounded-t-2xl px-5 pt-5 pb-5 sm:px-6 sm:pt-6 md:px-7 md:pt-7 lg:px-8 lg:pt-8">
                  <CardFoilOverlay className="dashboard-card-foil rounded-t-2xl opacity-[0.14]" />

                  {/* Top row: Text + Logo — su mobile il titolo è centrato sotto il
                      badge assoluto "Disponibile subito!": serve più margine per
                      non finirci sotto (il badge occupa ~top-4 → ~44px). */}
                  <div className="flex flex-col sm:flex-row flex-1 items-center justify-between gap-6 sm:gap-8 mt-8 sm:mt-2">
                  <div className="flex flex-col gap-1.5 sm:gap-2 text-center sm:text-left">
                    <h2 className="font-display text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold uppercase tracking-tight text-white drop-shadow-lg">
                      Magic: The Gathering
                    </h2>
                    <p className="max-w-md text-xs sm:text-sm md:text-base text-white/50 leading-relaxed">
                      Compra, vendi e metti all&apos;asta le tue carte. Inizia subito.
                    </p>
                  </div>

                  <div className="relative flex shrink-0 items-center justify-center">
                    <div className="relative h-24 w-40 -translate-y-1 sm:h-28 sm:w-48 sm:-translate-y-1.5 md:h-32 md:w-56 lg:h-36 lg:w-64 transition-transform duration-500 group-hover:scale-105">
                      <Image
                        src={MAIN_GAMES[0].src}
                        alt={MAIN_GAMES[0].alt}
                        fill
                        sizes="(max-width: 640px) 160px, (max-width: 768px) 200px, 300px"
                        className="object-contain drop-shadow-[0_0_24px_rgba(239,68,68,0.25)]"
                      />
                    </div>
                  </div>
                </div>

                </div>

                {/* Bottom: Coming soon games */}
                <div className="border-t border-white/10 pt-4 px-5 pb-5 sm:px-6 sm:pb-6 md:px-7 md:pb-7 lg:px-8 lg:pb-8">
                  <p className="text-[10px] sm:text-[11px] font-bold uppercase tracking-widest text-white/40 mb-3 text-center">
                    Presto in arrivo
                  </p>
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 sm:gap-3">
                    {COMING_SOON_GAMES.map((game) => (
                      <button
                        key={game.alt}
                        type="button"
                        aria-label={game.alt}
                        className="group/game relative flex aspect-[4/3] w-full flex-col items-center justify-center gap-1.5 rounded-xl overflow-hidden bg-white/10 border border-white/15 px-1 py-2 transition-all duration-300 hover:bg-white/15 hover:border-white/25 hover:scale-105"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          const bgImage = GAME_FULLSCREEN_IMAGES[game.alt];
                          const count = waitlistCounts[game.alt] ?? game.waitlistCount;
                          if (bgImage) {
                            setFullscreenGame({ src: game.src, alt: game.alt, bgImage, waitlistCount: count });
                          } else {
                            setNotifyGame({ src: game.src, alt: game.alt, waitlistCount: count });
                          }
                        }}
                      >
                        {/* Sfondo gradiente sui colori del brand del gioco */}
                        <span
                          aria-hidden
                          className={`pointer-events-none absolute inset-0 bg-gradient-to-br opacity-70 transition-opacity duration-300 group-hover/game:opacity-100 ${GAME_GRADIENTS[game.alt] ?? ''}`}
                        />
                        <div className="relative z-10 flex flex-1 min-h-0 w-full items-center justify-center">
                          <div className="relative h-full max-h-[56%] w-full max-w-[62%]">
                            <Image
                              src={game.src}
                              alt=""
                              fill
                              sizes="(max-width: 640px) 18vw, 100px"
                              className="object-contain"
                            />
                          </div>
                        </div>
                        <span className="relative z-10 shrink-0 text-center text-[9px] font-bold leading-tight text-white/80 sm:text-[10px]">
                          {game.label}
                        </span>
                      </button>
                    ))}
                    <button
                      type="button"
                      aria-label={`+${EXTRA_COMING_SOON_GAMES_COUNT} altri giochi in arrivo`}
                      className="group/game relative flex aspect-[4/3] w-full flex-col items-center justify-center gap-0.5 rounded-xl overflow-hidden bg-white/5 border border-dashed border-white/20 px-1 py-2 transition-all duration-300 hover:bg-white/10 hover:border-white/30 hover:scale-105"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                      }}
                    >
                      <span className="relative z-10 text-base font-black text-white/90 sm:text-lg">
                        +{EXTRA_COMING_SOON_GAMES_COUNT}
                      </span>
                      <span className="relative z-10 shrink-0 text-center text-[9px] font-bold leading-tight text-white/50 sm:text-[10px]">
                        altri giochi
                      </span>
                    </button>
                  </div>
                </div>
              </Link>
            </div>

            <Link
              href="/scanner"
              aria-label={t('landing.assoVision.aria')}
              className="bento-entry group relative mt-4 flex w-full items-center gap-3 overflow-hidden rounded-2xl border border-[#FF7300]/25 bg-[#1D3160]/75 px-4 py-3.5 shadow-[0_12px_35px_-22px_rgba(255,115,0,0.8)] backdrop-blur-md transition-all duration-300 hover:-translate-y-0.5 hover:border-[#FF7300]/45 hover:bg-[#1D3160]/90 sm:gap-4 sm:px-5"
              style={{ animationDelay: '260ms' }}
            >
              <span
                aria-hidden
                className="absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-[#FFB066] via-[#FF7300] to-[#E65300]"
              />
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[#FF7300]/25 bg-[#FF7300]/15 text-[#FF9A47] transition-transform duration-300 group-hover:scale-105 sm:h-12 sm:w-12">
                <ScanLine className="h-5 w-5 sm:h-6 sm:w-6" strokeWidth={2} />
              </span>

              <span className="min-w-0 flex-1">
                <span className="block text-[9px] font-bold uppercase tracking-[0.18em] text-[#FF9A47]">
                  {t('landing.assoVision.eyebrow')}
                </span>
                <span className="mt-0.5 block text-sm font-black text-white sm:text-base">
                  {t('landing.assoVision.title')}
                </span>
                <span className="mt-0.5 hidden text-xs leading-relaxed text-white/55 sm:block">
                  {t('landing.assoVision.body')}
                </span>
              </span>

              <span className="flex shrink-0 items-center gap-1.5 rounded-full bg-[#FF7300] px-3 py-2 text-[10px] font-black uppercase tracking-wide text-[#1A0F08] transition-colors group-hover:bg-[#FF8A2B] sm:px-4 sm:text-[11px]">
                {t('landing.assoVision.cta')}
                <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
              </span>
            </Link>

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
                <Link
                  href="/products/boutique"
                  className="transition-colors hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
                >
                  La Nostra Boutique
                </Link>
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

          </div>

          <div className="relative z-10 mx-auto max-w-4xl">
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
                  <Image src={notifyGame.src} alt="" width={40} height={40} className="object-contain" />
                </div>

                <div className="mb-3 flex items-center gap-2 rounded-full bg-[#FF7300]/90 px-4 py-2 text-white shadow-lg">
                  <Users className="h-4 w-4" />
                  <span className="text-sm font-semibold">{notifyGame.waitlistCount.toLocaleString(intlLocale)} in lista d&apos;attesa</span>
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
                  Ora ci sono <span className="text-[#FF7300] font-bold">{(notifyGame.waitlistCount + 1).toLocaleString(intlLocale)}</span> utenti in lista!
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

          {/* Controlli superiori: su viewport strette il badge va a capo senza
              sovrapporsi al pulsante; quando c'è spazio restano ai due angoli. */}
          <div className="relative z-50 ml-[max(1.5rem,env(safe-area-inset-left))] mr-[max(1.5rem,env(safe-area-inset-right))] mt-[max(1.5rem,env(safe-area-inset-top))] flex flex-wrap items-start gap-2">
            {/* Back button */}
            <button
              type="button"
              onClick={handleCloseFullscreen}
              className={`flex max-w-full items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-white/80 transition-all duration-300 hover:bg-white/20 hover:text-white backdrop-blur-md border border-white/20 ${isFullscreenClosing ? 'animate-landing-slide-up-exit' : 'animate-landing-slide-down'}`}
              style={{ willChange: 'transform, opacity' }}
            >
              <ArrowLeft className="h-5 w-5 shrink-0" />
              <span className="min-w-0 break-words text-left text-sm font-medium">Torna indietro</span>
            </button>

            {/* Social proof */}
            <div
              className={`ml-auto flex max-w-full items-center gap-2 rounded-full bg-[#FF7300]/90 px-4 py-2 text-white shadow-lg ${isFullscreenClosing ? 'animate-landing-slide-up-exit' : 'animate-landing-slide-down'}`}
              style={{ willChange: 'transform, opacity', animationDelay: isFullscreenClosing ? '0ms' : '100ms' }}
            >
              <Users className="h-4 w-4 shrink-0" />
              <span className="min-w-0 break-words text-sm font-semibold">{fullscreenGame.waitlistCount.toLocaleString(intlLocale)} in lista d&apos;attesa</span>
            </div>
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
                  Ora ci sono <span className="text-[#FF7300] font-bold">{(fullscreenGame.waitlistCount + 1).toLocaleString(intlLocale)}</span> utenti in lista!
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Inline keyframes for boutique entry + hero gradient headline */}
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
        .hero-gradient-text {
          background-image: linear-gradient(90deg, #FF7300, #FFC24B, #FF7300, #FF9A3D, #FF7300);
          background-size: 300% 100%;
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
          animation: heroGradientShift 5s linear infinite;
        }
        @keyframes heroGradientShift {
          0% { background-position: 0% 50%; }
          100% { background-position: 100% 50%; }
        }
        /* Punto attivo della tagline: il testo si colora gradualmente da
           sinistra a destra del colore del pallino (sweep clippato sul testo). */
        .hero-point-reveal {
          background-image:
            linear-gradient(90deg, var(--point-color, #fff), var(--point-color, #fff)),
            linear-gradient(90deg, rgba(255,255,255,0.6), rgba(255,255,255,0.6));
          background-size: 0% 100%, 100% 100%;
          background-repeat: no-repeat;
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
          /* easing quasi lineare: con curve tipo (0.16,1,...) lo sweep arriva
             all'80% nei primi 300ms e sembra istantaneo */
          animation: heroPointReveal 1.8s ease-in-out forwards;
        }
                @keyframes heroPointReveal {
          from { background-size: 0% 100%, 100% 100%; }
          to { background-size: 100% 100%, 100% 100%; }
        }
        /* Parole chiave accentuate: foil olografico perlescente, applicato
           SOLO alla frase attiva. Da inattive ereditano il colore del testo
           circostante. Sul foil: pastelli tenui in diagonale + lama di luce
           bianca che spazza avanti/indietro (carta foil inclinata). */
        .hero-keyword {
          font-weight: 800;
          display: inline-block;
          white-space: nowrap;
          transition: transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275), filter 0.4s ease-in-out, opacity 0.4s ease-in-out;
        }
        .hero-keyword-inactive {
          color: inherit;
          transform: scale(1);
        }
        .hero-keyword-active {
          background-image:
            linear-gradient(100deg, rgba(255,255,255,0) 42%, rgba(255,255,255,0.55) 50%, rgba(255,255,255,0) 58%),
            linear-gradient(115deg, #D3F2FF 0%, #E6DFFF 24%, #FFE4F1 48%, #FFF2D8 70%, #DFFCF0 88%, #D3F2FF 100%);
          background-size: 250% 100%, 200% auto;
          -webkit-background-clip: text !important;
          background-clip: text !important;
          -webkit-text-fill-color: transparent !important;
          color: transparent !important;
          animation: heroKeywordFoil 6s ease-in-out infinite;
          transform: scale(1.04);
          filter: drop-shadow(0 0 4px rgba(215, 240, 255, 0.4)) drop-shadow(0 0 12px rgba(165, 210, 255, 0.2));
        }
        @keyframes heroKeywordFoil {
          0% { background-position: 0% 0%, 0% 50%; }
          50% { background-position: 100% 0%, 100% 50%; }
          100% { background-position: 0% 0%, 0% 50%; }
        }
        @media (prefers-reduced-motion: reduce) {
          .hero-gradient-text {
            animation: none;
            background-position: 0% 50%;
          }
          .hero-point-reveal {
            animation: none;
            background-image: none;
            color: var(--point-color, #fff);
          }
          .hero-keyword,
          .hero-keyword-active {
            transition: none;
            animation: none;
          }
        }
      `}</style>

    </div>
  );
}
