'use client';

import React, { useRef, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Tag, RefreshCw, Gavel } from 'lucide-react';
import { getCdnImageUrl, getCdnVideoUrl } from '@/lib/config';
import { useGame } from '@/lib/contexts/GameContext';
import type { GameSlug } from '@/lib/contexts/GameContext';
import { useTranslation } from '@/lib/i18n/useTranslation';

const BRAND_ORANGE = '#FF7300';
const REGISTER_BTN_BORDER = '#878787';

const LANDING_BG_VIDEO = 'videos/sfondo_carte.mp4';

const svgProps = {
  xmlns: 'http://www.w3.org/2000/svg',
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: BRAND_ORANGE,
  strokeWidth: 1.7,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  className: 'h-full w-full',
};

/** 1. Prezzi Migliori - mano con moneta */
function IconPrezziMigliori() {
  return (
    <svg {...svgProps} width={48} height={48}>
      <circle cx="12" cy="7" r="4" />
      <line x1="12" y1="5" x2="12" y2="9" />
      <path d="M18 16c-1.5 0-2.5-.5-4-1l-3-1H4v4h12l2 1a2 2 0 0 0 2-3z" />
    </svg>
  );
}

/** 2. Sistema Sicuro - lucchetto con spunta */
function IconSistemaSicuro() {
  return (
    <svg {...svgProps} width={48} height={48}>
      <rect x="4" y="11" width="16" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
      <polyline points="9 16 11 18 15 14" />
    </svg>
  );
}

/** 3. Gestione Semplice - frecce orizzontali */
function IconGestioneSemplice() {
  return (
    <svg {...svgProps} width={48} height={48}>
      <path d="M17 3l4 4-4 4" />
      <path d="M3 7h18" />
      <path d="M7 21l-4-4 4-4" />
      <path d="M21 17H3" />
    </svg>
  );
}

/** 4. Grande Domanda - bilancia equilibrata */
function IconGrandeDomanda() {
  return (
    <svg {...svgProps} width={48} height={48}>
      <line x1="12" y1="3" x2="12" y2="21" />
      <line x1="8" y1="21" x2="16" y2="21" />
      <line x1="4" y1="6" x2="20" y2="6" />
      <circle cx="12" cy="6" r="1" />
      <line x1="4" y1="6" x2="1" y2="14" />
      <line x1="4" y1="6" x2="7" y2="14" />
      <path d="M1 14h6a3 3 0 0 1-6 0z" />
      <line x1="20" y1="6" x2="17" y2="14" />
      <line x1="20" y1="6" x2="23" y2="14" />
      <path d="M17 14h6a3 3 0 0 1-6 0z" />
    </svg>
  );
}

/** 5. Vendite Semplici - pacco / scatola isometrica */
function IconVenditeSemplici() {
  return (
    <svg {...svgProps} width={48} height={48}>
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
      <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
      <line x1="12" y1="22.08" x2="12" y2="12" />
    </svg>
  );
}

/** 6. Commissioni Leggere - grafico in crescita */
function IconCommissioniLeggere() {
  return (
    <svg {...svgProps} width={48} height={48}>
      <line x1="3" y1="21" x2="21" y2="21" />
      <line x1="6" y1="21" x2="6" y2="16" />
      <line x1="12" y1="21" x2="12" y2="12" />
      <line x1="18" y1="21" x2="18" y2="8" />
      <polyline points="3 16 8 11 13 14 20 6" />
      <polyline points="15 6 20 6 20 11" />
    </svg>
  );
}

const FEATURE_ICONS: Record<string, React.FC> = {
  prezzi: IconPrezziMigliori,
  sicuro: IconSistemaSicuro,
  gestione: IconGestioneSemplice,
  domanda: IconGrandeDomanda,
  vendite: IconVenditeSemplici,
  commissioni: IconCommissioniLeggere,
};

type LandingGameSlug = GameSlug | 'clear';

const getGameLogos = (): {
  src: string;
  alt: string;
  homeHref?: string;
  comingSoon?: boolean;
  /** Allinea subito header + ricerca al gioco scelto */
  gameSlug?: LandingGameSlug;
}[] => [
  {
    src: getCdnImageUrl('loghi-giochi/magic.png'),
    alt: 'Magic The Gathering',
    homeHref: '/home/magic',
    gameSlug: 'mtg',
  },
  {
    src: getCdnImageUrl('loghi-giochi/yu-gi-oh.png'),
    alt: 'Yu-Gi-Oh! Trading Card Game',
    homeHref: '/home',
    gameSlug: 'clear',
  },
  {
    src: getCdnImageUrl('loghi-giochi/pokèmon.png'),
    alt: 'Pokémon Trading Card Game',
    homeHref: '/home/pokemon',
    gameSlug: 'pokemon',
  },
  { src: getCdnImageUrl('loghi-giochi/One_Piece_Card_Game_Logo%201.png'), alt: 'One Piece Card Game', comingSoon: true },
  { src: getCdnImageUrl('loghi-giochi/Disney_Lorcana_480x480%201.png'), alt: 'Disney Lorcana', comingSoon: true },
  {
    src: getCdnImageUrl('star_wars.jpg'),
    alt: 'Star Wars: Unlimited',
    comingSoon: true,
  },
];

export function LandingWelcome() {
  const { t } = useTranslation();
  const { setSelectedGame } = useGame();
  const [activePill, setActivePill] = React.useState<'vendere' | 'scambiare' | 'asta' | null>(null);

  const HOW_TO_ITEMS = React.useMemo(
    () => [
      {
        id: 'vendere' as const,
        shortTitle: 'VENDI',
        title: t('landing.howTo.sell.title'),
        description: t('landing.howTo.sell.desc'),
        href: '/home',
        cta: t('landing.howTo.sell.cta'),
        icon: Tag,
      },
      {
        id: 'scambiare' as const,
        shortTitle: 'SCAMBIA',
        title: t('landing.howTo.trade.title'),
        description: t('landing.howTo.trade.desc'),
        href: '/scambi',
        cta: t('landing.howTo.trade.cta'),
        icon: RefreshCw,
      },
      {
        id: 'asta' as const,
        shortTitle: 'ASTE',
        title: t('landing.howTo.auction.title'),
        description: t('landing.howTo.auction.desc'),
        href: '/scambi',
        cta: t('landing.howTo.auction.cta'),
        icon: Gavel,
      },
    ],
    [t]
  );

  const FEATURES = React.useMemo(
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

  const NAV_TICKER_WORDS = React.useMemo(
    () =>
      [
        t('landing.nav.sell'),
        t('landing.nav.earn'),
        t('landing.nav.buy'),
        t('landing.nav.save'),
        t('landing.nav.collect'),
      ] as const,
    [t]
  );

  const GAME_LOGOS = getGameLogos();
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    videoRef.current?.play().catch(() => {});
  }, []);

  return (
    <div className="relative w-full overflow-x-hidden overflow-y-visible text-white">
      {/* Sfondo video: copre l’altezza del contenuto (niente min-h-screen: evita doppia altezza con header + scroll strani) */}
      <video
        ref={videoRef}
        src={getCdnVideoUrl(LANDING_BG_VIDEO)}
        className="pointer-events-none absolute inset-0 h-full min-h-full w-full object-cover object-center"
        autoPlay
        loop
        muted
        playsInline
        disablePictureInPicture
        disableRemotePlayback
        aria-hidden
      />
      {/* Overlay blu leggero: lascia vedere il video ma mantiene leggibilità */}
      <div
        className="absolute inset-0 z-[1]"
        style={{
          background: 'linear-gradient(rgba(61, 101, 198, 0.4), rgba(29, 49, 96, 0.5))',
        }}
      />
      <div className="relative z-10 flex min-h-0 flex-col">
        {/* Hero: logo + tagline + griglia giochi, con più altezza */}
        <header className="flex items-center justify-center px-4 pb-2 pt-4 sm:pb-3 sm:pt-6 md:pb-4 md:pt-7 lg:pt-8">
          <div className="relative flex w-full max-w-5xl items-center justify-center">
            <Image
              src={getCdnImageUrl('Logo%20Principale%20EBARTEX.png')}
              alt="Ebartex"
              width={700}
              height={263}
              className="h-28 w-auto max-w-[90vw] object-contain object-center sm:h-32 md:h-36 lg:h-40 xl:h-44 2xl:h-48"
              sizes="(max-width: 640px) 85vw, (max-width: 1024px) 50vw, 600px"
              priority
              unoptimized
            />
          </div>
        </header>

        {/* Tagline: titolo in evidenza + sottotitolo curato */}
        <div className="px-3 pb-3 text-center sm:px-4 sm:pb-4 md:pb-5">
          <h2 className="text-lg font-semibold uppercase tracking-[0.06em] text-white drop-shadow-sm sm:text-xl md:text-2xl md:tracking-[0.05em] lg:text-3xl">
            {t('landing.heroTitle')}
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-xs font-normal leading-relaxed tracking-wide text-white/80 sm:mt-4 sm:text-sm md:mt-5">
            {t('landing.heroSubtitle')}
          </p>
        </div>

        {/* Loghi giochi: 3 grandi sopra + 3 piccole sotto */}
        <section className="px-2 pb-2 sm:px-4 sm:pb-3 md:px-6 md:pb-4">
          {/* Riga 1: 3 giochi principali centrati */}
          <div className="mx-auto flex w-full max-w-4xl flex-row flex-wrap items-center justify-center gap-4 py-2 sm:gap-6 md:gap-8">
            {GAME_LOGOS.slice(0, 3).map((game) => (
              <Link
                key={game.alt}
                href={game.homeHref ?? '/home'}
                className="group relative flex h-44 w-44 shrink-0 items-center justify-center overflow-visible rounded-full border border-white/15 bg-white/5 p-7 shadow-[0_0_30px_rgba(255,255,255,0.15)] shadow-[inset_0_0_20px_rgba(255,255,255,0.1)] transition-all duration-200 hover:border-white/35 hover:bg-white/10 hover:backdrop-blur-md sm:h-48 sm:w-48 sm:p-8 md:h-52 md:w-52 md:p-9"
                aria-label={t('landing.gameAria.goHome', { name: game.alt })}
                onClick={() => {
                  if (game.gameSlug === 'clear') setSelectedGame(null);
                  else if (game.gameSlug) setSelectedGame(game.gameSlug);
                }}
              >
                <img
                  src={game.src}
                  alt={game.alt}
                  style={{ display: 'block', maxWidth: '100%', maxHeight: '135px', width: 'auto', height: 'auto', objectFit: 'contain' }}
                />
              </Link>
            ))}
          </div>
          
          {/* Riga 2: 3 giochi in arrivo centrati nel container */}
          <div className="mx-auto mt-6 flex w-full max-w-md flex-row items-center justify-center gap-3 rounded-full border border-white/25 bg-white/5 px-4 py-4 backdrop-blur-sm sm:mt-8 sm:gap-4 sm:px-6 sm:py-5 md:mt-10 md:gap-5 md:px-8 md:py-6 relative">
            {/* Badge sopra */}
            <div className="absolute -top-3 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded-full bg-white/90 px-4 py-1.5 text-center font-sans text-[10px] font-semibold uppercase tracking-wide text-[#1D3160] shadow-lg backdrop-blur-sm sm:text-xs">
              PRESTO IN ARRIVO
            </div>
            
            {GAME_LOGOS.slice(3, 6).map((game) => (
              <Link
                key={game.alt}
                href="#"
                className="group relative flex h-20 w-20 shrink-0 items-center justify-center overflow-visible rounded-full border border-white/15 bg-white/5 p-3 transition-all duration-200 hover:border-white/35 hover:bg-white/10 hover:backdrop-blur-md sm:h-24 sm:w-24 sm:p-4 md:h-28 md:w-28 md:p-5"
                aria-label={t('landing.gameAria.soon', { name: game.alt })}
                onClick={() => {}}
              >
                <img
                  src={game.src}
                  alt={game.alt}
                  style={{ display: 'block', maxWidth: '100%', maxHeight: '60px', width: 'auto', height: 'auto', objectFit: 'contain' }}
                />
              </Link>
            ))}
          </div>
        </section>

        {/* Come vendere / scambiare / asta — forte glass effect, video che si intravede */}
        <section className="relative w-full overflow-hidden px-4 pt-8 pb-6 sm:px-5 sm:pt-10 sm:pb-7 md:pt-12 md:pb-8">
          {/* Sfondo blur forte con gradiente di transizione quasi invisibile */}
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-header-bg/8 via-header-bg/20 via-header-bg/35 to-header-bg/70 backdrop-blur-2xl" />
          
          <div className="relative z-10 mx-auto max-w-4xl">
            {/* KPI icone — rimpicciolite e integrate */}
            <div className="mb-6 sm:mb-7" aria-labelledby="landing-features-heading">
              <div className="mb-3 text-center sm:mb-4">
                <p className="mb-1 text-[9px] font-medium uppercase tracking-[0.25em] text-[#FF7300]/95 sm:text-[10px]">
                  {t('landing.feat.sectionKicker')}
                </p>
                <h2
                  id="landing-features-heading"
                  className="text-sm font-light leading-tight tracking-tight text-white sm:text-base"
                >
                  {t('landing.feat.sectionTitle')}
                </h2>
              </div>
              <div className="grid w-full grid-cols-3 justify-items-center gap-x-2 gap-y-3 sm:gap-x-3 sm:gap-y-4">
                {FEATURES.map((f) => {
                  const IconComponent = FEATURE_ICONS[f.iconKey];
                  return (
                    <div
                      key={f.title}
                      className="flex w-full max-w-[5.25rem] min-w-0 flex-col items-center justify-start gap-1 text-center sm:max-w-[6rem] sm:gap-1.5"
                    >
                      <div className="flex h-5 w-5 shrink-0 items-center justify-center sm:h-6 sm:w-6">
                        {IconComponent ? <IconComponent /> : null}
                      </div>
                      <div className="w-full min-w-0">
                        <h3 className="text-[9px] font-medium uppercase leading-tight tracking-[0.04em] text-white/95 sm:text-[10px]">
                          {f.title}
                        </h3>
                        <p className="mt-0.5 hidden text-[9px] leading-relaxed text-white/60 md:block">
                          {f.description}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 3 Pillole espandibili Accordion */}
            <p className="text-center text-xs font-normal leading-relaxed text-white/95 sm:text-sm md:text-base">
              {t('landing.howToIntro')}
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center sm:items-start sm:gap-3 md:mt-8">
              {HOW_TO_ITEMS.map((item) => {
                const Icon = item.icon;
                const isActive = activePill === item.id;
                const isCollapsed = activePill !== null && !isActive;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActivePill(isActive ? null : item.id)}
                    className={`group relative flex overflow-hidden border border-gray-200 bg-white shadow-sm transition-all duration-300 ease-out cursor-pointer ${
                      isActive 
                        ? 'flex-col rounded-2xl p-4 sm:w-64' 
                        : isCollapsed 
                          ? 'items-center justify-center rounded-full p-2 sm:h-11 sm:w-11' 
                          : 'flex-row items-center gap-2 rounded-2xl p-3 sm:w-auto sm:px-4'
                    }`}
                  >
                    {/* Icona */}
                    <div className={`flex shrink-0 items-center justify-center rounded-full bg-gray-100 ${
                      isActive ? 'h-6 w-6' : 'h-6 w-6'
                    }`}>
                      <Icon className="h-3 w-3 text-gray-600" strokeWidth={2} />
                    </div>
                    
                    {/* Titolo - visibile solo se non collassato */}
                    {!isCollapsed && (
                      <span className={`font-semibold text-[#1D3160] uppercase tracking-wide whitespace-nowrap ${
                        isActive ? 'text-sm mt-2 mb-1' : 'text-xs'
                      }`}>
                        {item.shortTitle}
                      </span>
                    )}

                    {/* Contenuto espanso */}
                    {isActive && (
                      <div className="flex flex-col animate-in fade-in duration-200">
                        <p className="mb-3 text-xs leading-relaxed text-gray-600">
                          {item.description}
                        </p>
                        <Link
                          href={item.href}
                          className="inline-flex w-full items-center justify-center rounded-lg bg-[#1D3160] px-3 py-2 text-xs font-semibold uppercase tracking-wide text-white transition-all hover:bg-[#243663]"
                        >
                          {item.cta}
                        </Link>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </section>

      </div>
    </div>
  );
}
