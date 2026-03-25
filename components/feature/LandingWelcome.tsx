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
/** Stesso navy dell’header di navigazione */
const HEADER_NAVY = '#1D3160';
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

  const HOW_TO_ITEMS = React.useMemo(
    () => [
      {
        id: 'vendere' as const,
        title: t('landing.howTo.sell.title'),
        description: t('landing.howTo.sell.desc'),
        href: '/home',
        cta: t('landing.howTo.sell.cta'),
        icon: Tag,
      },
      {
        id: 'scambiare' as const,
        title: t('landing.howTo.trade.title'),
        description: t('landing.howTo.trade.desc'),
        href: '/scambi',
        cta: t('landing.howTo.trade.cta'),
        icon: RefreshCw,
      },
      {
        id: 'asta' as const,
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
        <header className="flex items-center justify-center px-4 pb-3 pt-14 sm:pb-4 sm:pt-16 md:pb-5 md:pt-16 lg:pt-20">
          <div className="relative flex w-full max-w-5xl items-center justify-center">
            <Image
              src={getCdnImageUrl('Logo%20Principale%20EBARTEX.png')}
              alt="Ebartex"
              width={700}
              height={263}
              className="h-36 w-auto max-w-[90vw] object-contain object-center sm:h-40 md:h-44 lg:h-48 xl:h-52 2xl:h-56"
              sizes="(max-width: 640px) 85vw, (max-width: 1024px) 50vw, 600px"
              priority
              unoptimized
            />
          </div>
        </header>

        {/* Tagline: titolo in evidenza + sottotitolo curato */}
        <div className="text-center px-3 pb-10 pt-5 sm:px-4 sm:pb-12 sm:pt-6 md:pb-14 md:pt-8">
          <h2 className="text-xl font-semibold uppercase tracking-[0.06em] text-white drop-shadow-sm sm:text-2xl md:text-3xl md:tracking-[0.05em] lg:text-4xl">
            {t('landing.heroTitle')}
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-sm font-normal leading-relaxed tracking-wide text-white/80 sm:mt-6 sm:text-base md:mt-7">
            {t('landing.heroSubtitle')}
          </p>
        </div>

        {/* Loghi giochi: griglia 2×3 / 3×2; margini ridotti, box logo più alto */}
        <section className="px-1.5 pb-12 sm:px-3 sm:pb-14 md:px-4 md:pb-16">
          <div className="mx-auto grid w-full max-w-5xl grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-[3px] md:gap-1">
            {GAME_LOGOS.map((game) => (
              <Link
                key={game.alt}
                href={game.comingSoon ? '#' : game.homeHref ?? '/home'}
                className="group relative flex min-h-[10.5rem] w-full flex-col items-center justify-center gap-1.5 border border-white/15 bg-white/5 px-1 py-2 transition-all duration-200 hover:border-white/35 hover:bg-white/10 hover:backdrop-blur-md sm:min-h-[11rem] sm:gap-2 sm:px-2 sm:py-2.5 md:min-h-[11.5rem]"
                style={{ borderRadius: 0 }}
                aria-label={
                  game.comingSoon
                    ? t('landing.gameAria.soon', { name: game.alt })
                    : t('landing.gameAria.goHome', { name: game.alt })
                }
                onClick={() => {
                  if (game.comingSoon) return;
                  if (game.gameSlug === 'clear') setSelectedGame(null);
                  else if (game.gameSlug) setSelectedGame(game.gameSlug);
                }}
              >
                {/* Area verticale maggiore per i loghi (stessa per tutti) */}
                <div className="flex h-[5.25rem] w-full max-w-[min(100%,14rem)] items-center justify-center sm:h-28 md:h-32">
                  <Image
                    src={game.src}
                    alt={game.alt}
                    width={220}
                    height={100}
                    className="h-full w-full max-h-full max-w-full object-contain object-center transition-opacity group-hover:opacity-95"
                    sizes="(max-width: 640px) 46vw, 220px"
                    unoptimized
                  />
                </div>
                {game.comingSoon ? (
                  <span className="mt-0.5 shrink-0 rounded-full bg-white/15 px-1.5 py-0.5 text-center font-sans text-[8px] font-semibold leading-tight tracking-tight text-white backdrop-blur-md sm:px-2 sm:text-[10px]">
                    {t('landing.comingSoon')}
                  </span>
                ) : null}
              </Link>
            ))}
          </div>
        </section>

        {/* Come vendere / scambiare / asta — fascia gradiente (uniforme al resto della landing) */}
        <section
          className="w-full px-4 py-14 sm:px-5 sm:py-16 md:py-20 bg-gradient-global"
        >
          <div className="mx-auto max-w-4xl">
            <p className="text-center text-sm font-normal leading-relaxed text-white/95 sm:text-base md:text-lg">
              {t('landing.howToIntro')}
            </p>
            <div className="mt-12 grid grid-cols-1 gap-8 sm:mt-14 sm:grid-cols-3 sm:gap-9 md:gap-10">
              {HOW_TO_ITEMS.map((item, index) => {
                const Icon = item.icon;
                const gradientClass = index === 0 ? 'bg-gradient-card1' : index === 1 ? 'bg-gradient-card2' : 'bg-gradient-card3';
                return (
                  <Link
                    key={item.id}
                    href={item.href}
                    className={`group flex h-full min-h-[168px] flex-col rounded-xl ${gradientClass} p-6 shadow-[0_8px_28px_rgba(0,0,0,0.18),0_2px_8px_rgba(0,0,0,0.06)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_14px_36px_rgba(0,0,0,0.2),0_4px_12px_rgba(0,0,0,0.08)] sm:min-h-[184px] sm:p-7`}
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center text-white" aria-hidden>
                      <Icon className="h-6 w-6" strokeWidth={1.75} />
                    </div>
                    <h3 className="mt-4 text-lg font-medium leading-snug text-white">
                      {item.title}
                    </h3>
                    <p className="mt-2 flex-1 text-sm leading-relaxed text-white/90">{item.description}</p>
                    <span
                      className="mt-5 inline-flex w-full items-center justify-center rounded-lg border px-3 py-2.5 text-sm font-medium uppercase tracking-wide text-[#2d1810] transition-all group-hover:opacity-95 group-hover:scale-[1.02] bg-white border-white/80 hover:bg-white/95"
                    >
                      {item.cta}
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>

        {/* 6 KPI — titolo sezione + griglia centrata, più aria tra le celle */}
        <section
          className="mt-16 px-4 pb-14 pt-4 sm:mt-20 sm:px-6 sm:pb-16 md:mt-24 md:pb-20"
          aria-labelledby="landing-features-heading"
        >
          <div className="mx-auto max-w-5xl">
            <div className="mb-12 text-center sm:mb-14 md:mb-16">
              <p className="mb-3 text-xs font-medium uppercase tracking-[0.38em] text-[#FF7300]/95 sm:text-sm sm:tracking-[0.32em] md:text-base md:tracking-[0.28em]">
                {t('landing.feat.sectionKicker')}
              </p>
              <h2
                id="landing-features-heading"
                className="text-[1.375rem] font-light leading-tight tracking-tight text-white sm:text-2xl md:text-3xl"
              >
                {t('landing.feat.sectionTitle')}
              </h2>
              <div
                className="mx-auto mt-4 h-px w-20 max-w-[5rem] bg-gradient-to-r from-transparent via-[#FF7300]/85 to-transparent sm:mt-5 sm:w-24"
                aria-hidden
              />
            </div>
            <div className="grid w-full grid-cols-2 justify-items-center gap-x-6 gap-y-14 sm:gap-x-10 sm:gap-y-16 md:gap-x-12 md:gap-y-20 lg:grid-cols-3 lg:gap-x-14 lg:gap-y-16">
              {FEATURES.map((f) => {
                const IconComponent = FEATURE_ICONS[f.iconKey];
                return (
                  <div
                    key={f.title}
                    className="flex w-full max-w-[10.75rem] min-w-0 flex-col items-center justify-start gap-4 text-center sm:max-w-[12rem] sm:gap-5 md:max-w-[14rem] lg:max-w-none"
                  >
                    <div className="flex h-[3.75rem] w-[3.75rem] shrink-0 items-center justify-center sm:h-16 sm:w-16 md:h-[4.5rem] md:w-[4.5rem]">
                      {IconComponent ? <IconComponent /> : null}
                    </div>
                    <div className="w-full min-w-0">
                      <h3 className="text-[0.8125rem] font-medium uppercase leading-snug tracking-[0.06em] text-white/95 sm:text-[0.9375rem] md:text-base lg:text-lg">
                        {f.title}
                      </h3>
                      <p className="mt-2 hidden text-[13px] leading-relaxed text-white/80 md:block md:text-base">
                        {f.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Barra parole: marquee orizzontale, non cliccabile, una riga anche su mobile */}
        <div className="relative w-full pt-10 sm:pt-12 md:pt-14" aria-hidden>
          <div
            className="pointer-events-none select-none overflow-hidden border border-[#2c1810]"
            style={{
              backgroundImage: `url(${getCdnImageUrl('rectangle-30.jpg')})`,
              backgroundRepeat: 'repeat-x',
              backgroundSize: 'auto 100%',
            }}
          >
            <div className="landing-nav-ticker-track">
              {[0, 1].map((dup) => (
                <div
                  key={dup}
                  className="flex shrink-0 items-center gap-4 py-3 pl-4 pr-10 sm:gap-8 sm:py-3.5 sm:pl-6 sm:pr-16 md:gap-12 md:pr-20"
                  aria-hidden={dup === 1}
                >
                  {NAV_TICKER_WORDS.map((word, i) => (
                    <React.Fragment key={`${dup}-${word}-${i}`}>
                      {i > 0 ? (
                        <span className="shrink-0 text-lg font-light text-white/45 sm:text-2xl md:text-3xl" aria-hidden>
                          ·
                        </span>
                      ) : null}
                      <span className="font-display whitespace-nowrap text-lg font-normal uppercase leading-none tracking-normal text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.4)] sm:text-2xl md:text-3xl lg:text-[2.25rem]">
                        {word}
                      </span>
                    </React.Fragment>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
