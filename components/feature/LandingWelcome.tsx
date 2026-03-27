'use client';

import React, { useRef, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Tag, RefreshCw, Gavel, CircleDollarSign, ShieldCheck, ArrowRightLeft, Scale, Package, TrendingUp } from 'lucide-react';
import { getCdnImageUrl, getCdnVideoUrl } from '@/lib/config';
import { useGame } from '@/lib/contexts/GameContext';
import type { GameSlug } from '@/lib/contexts/GameContext';
import { useTranslation } from '@/lib/i18n/useTranslation';

const BRAND_ORANGE = '#FF7300';
const REGISTER_BTN_BORDER = '#878787';

const LANDING_BG_VIDEO = 'videos/sfondo_carte.mp4';

const FEATURE_ICONS: Record<string, React.FC<any>> = {
  prezzi: CircleDollarSign,
  sicuro: ShieldCheck,
  gestione: ArrowRightLeft,
  domanda: Scale,
  vendite: Package,
  commissioni: TrendingUp,
};

type LandingGameSlug = GameSlug | 'clear';

/** Giochi principali: Magic e Pokemon (sfondo quadrato) */
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
  {
    src: getCdnImageUrl('loghi-giochi/pokèmon.png'),
    alt: 'Pokémon Trading Card Game',
    homeHref: '/home/pokemon',
    gameSlug: 'pokemon',
  },
];

/** Giochi in arrivo + Yu-Gi-Oh (sfondo rotondo, riga inferiore) */
const getComingSoonGames = (): {
  src: string;
  alt: string;
  homeHref?: string;
  comingSoon?: boolean;
  gameSlug?: LandingGameSlug;
}[] => [
  {
    src: getCdnImageUrl('loghi-giochi/yu-gi-oh.png'),
    alt: 'Yu-Gi-Oh! Trading Card Game',
    homeHref: '/home',
    gameSlug: 'clear',
  },
  { src: getCdnImageUrl('loghi-giochi/One_Piece_Card_Game_Logo%201.png'), alt: 'One Piece Card Game', comingSoon: true },
  { src: getCdnImageUrl('loghi-giochi/Disney_Lorcana_480x480%201.png'), alt: 'Disney Lorcana', comingSoon: true },
  {
    src: getCdnImageUrl('star_wars.jpg'),
    alt: 'Star Wars: Unlimited',
    comingSoon: true,
  },
];

const BOUTIQUE_CATEGORIES = [
  { id: 'dadi', label: 'Dadi', href: '/products?category=dadi', imageUrl: getCdnImageUrl('card-3/4978fe1369c0fbf68d42ac63d0582ffc6cf67d60.png') },
  { id: 'buste', label: 'Buste', href: '/products?category=buste', imageUrl: getCdnImageUrl('card-3/8b5d86761fe7404aee02bee1471c3e0fc815d3bb.png') },
  { id: 'tappetini', label: 'Tappetini', href: '/products?category=tappetini', imageUrl: getCdnImageUrl('card-3/a8020835a8ffd96555a4b53cd6ef0d04866ca8b1.png') },
  { id: 'memorabilia', label: 'Memorabilia', href: '/products?category=memorabilia', imageUrl: getCdnImageUrl('acquisti-frames/Frame%20334.jpg') },
  { id: 'albums', label: 'Albums', href: '/products?category=albums', imageUrl: getCdnImageUrl('acquisti-frames/Frame%20335.jpg') },
  { id: 'game-kits', label: 'Game kits', href: '/products?category=game-kits', imageUrl: getCdnImageUrl('acquisti-frames/Frame%20336.jpg') },
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

  const MAIN_GAMES = getMainGames();
  const COMING_SOON_GAMES = getComingSoonGames();
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

        {/* Loghi giochi: 2 grandi quadrati sopra (Magic, Pokemon) + Yu-Gi-Oh rotondo sotto con i coming soon */}
        <section className="px-2 pb-2 sm:px-4 sm:pb-3 md:px-6 md:pb-4">
          {/* Riga 1: Magic e Pokemon — sfondo quadrato (rounded-2xl) */}
          <div className="mx-auto flex w-full max-w-4xl flex-row flex-wrap items-center justify-center gap-4 py-2 sm:gap-6 md:gap-8">
            {MAIN_GAMES.map((game) => (
              <Link
                key={game.alt}
                href={game.homeHref}
                className="group relative flex h-44 w-44 shrink-0 items-center justify-center overflow-visible rounded-2xl border border-white/15 bg-white/5 p-7 shadow-[0_0_30px_rgba(255,255,255,0.15)] transition-all duration-200 hover:border-white/35 hover:bg-white/10 hover:backdrop-blur-md sm:h-48 sm:w-48 sm:p-8 md:h-52 md:w-52 md:p-9"
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
          
          {/* Riga 2: Yu-Gi-Oh + giochi in arrivo — sfondo rotondo */}
          <div className="mx-auto mt-6 flex w-full max-w-lg flex-row items-center justify-center gap-3 rounded-full border border-white/25 bg-white/5 px-4 py-4 backdrop-blur-sm sm:mt-8 sm:gap-4 sm:px-6 sm:py-5 md:mt-10 md:gap-5 md:px-8 md:py-6 relative">
            {/* Badge sopra */}
            <div className="absolute -top-3 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded-full bg-white/90 px-4 py-1.5 text-center font-sans text-[10px] font-semibold uppercase tracking-wide text-[#1D3160] shadow-lg backdrop-blur-sm sm:text-xs">
              PRESTO IN ARRIVO
            </div>
            
            {COMING_SOON_GAMES.map((game) => (
              <Link
                key={game.alt}
                href={game.homeHref ?? '#'}
                className="group relative flex h-20 w-20 shrink-0 items-center justify-center overflow-visible rounded-full border border-white/15 bg-white/5 p-3 transition-all duration-200 hover:border-white/35 hover:bg-white/10 hover:backdrop-blur-md sm:h-24 sm:w-24 sm:p-4 md:h-28 md:w-28 md:p-5"
                aria-label={game.comingSoon ? t('landing.gameAria.soon', { name: game.alt }) : t('landing.gameAria.goHome', { name: game.alt })}
                onClick={() => {
                  if (game.gameSlug === 'clear') setSelectedGame(null);
                  else if (game.gameSlug) setSelectedGame(game.gameSlug);
                }}
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
        {/* Sfondo blur che parte da metà "PRESTO IN ARRIVO" e sfuma dolcissimo verso il basso */}
        {/* Sfondo glass progressivo: blur che aumenta man mano che si scende */}
        {/* Layer 1: blur leggero, parte dall'alto */}
        <div 
          className="absolute inset-x-0 bottom-0 backdrop-blur-sm pointer-events-none z-[1]" 
          style={{ 
            top: 'calc(100% - 450px)',
            WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.1) 15%, rgba(0,0,0,0.3) 30%, rgba(0,0,0,0.5) 50%, black 70%)',
            maskImage: 'linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.1) 15%, rgba(0,0,0,0.3) 30%, rgba(0,0,0,0.5) 50%, black 70%)'
          }} 
        />
        {/* Layer 2: blur medio, parte un po' più sotto */}
        <div 
          className="absolute inset-x-0 bottom-0 backdrop-blur-md pointer-events-none z-[1]" 
          style={{ 
            top: 'calc(100% - 380px)',
            WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.1) 20%, rgba(0,0,0,0.4) 45%, black 70%)',
            maskImage: 'linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.1) 20%, rgba(0,0,0,0.4) 45%, black 70%)'
          }} 
        />
        {/* Layer 3: blur forte + tinta colore, parte dal basso */}
        <div 
          className="absolute inset-x-0 bottom-0 bg-gradient-to-b from-transparent via-header-bg/20 to-header-bg/60 backdrop-blur-xl pointer-events-none z-[1]" 
          style={{ 
            top: 'calc(100% - 300px)',
            WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.15) 25%, rgba(0,0,0,0.5) 50%, black 75%)',
            maskImage: 'linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.15) 25%, rgba(0,0,0,0.5) 50%, black 75%)'
          }} 
        />

        <section className="relative w-full overflow-hidden px-4 pt-8 pb-6 sm:px-5 sm:pt-10 sm:pb-7 md:pt-12 md:pb-8 z-[2]">
          
          <div className="relative z-10 mx-auto max-w-4xl">
            {/* KPI icone — rimpicciolite e integrate */}
            <div className="mb-6 sm:mb-7" aria-labelledby="landing-features-heading">
              <div className="mb-4 text-center sm:mb-6">
                <h2
                  id="landing-features-heading"
                  className="text-base font-normal leading-tight tracking-wide text-white sm:text-lg md:text-xl"
                >
                  {t('landing.feat.sectionTitle')}
                </h2>
              </div>
              <div className="grid w-full grid-cols-2 md:grid-cols-3 justify-items-center gap-x-4 gap-y-6 sm:gap-x-6 sm:gap-y-8">
                {FEATURES.map((f) => {
                  const IconComponent = FEATURE_ICONS[f.iconKey];
                  return (
                    <div
                      key={f.title}
                      className="flex flex-col items-center text-center max-w-[11rem] sm:max-w-[14rem]"
                    >
                      <div className="mb-2 flex shrink-0 items-center justify-center">
                        {IconComponent ? <IconComponent className="h-7 w-7 sm:h-8 sm:w-8 text-[#FF7300]" strokeWidth={1.5} /> : null}
                      </div>
                      <h3 className="text-[10px] font-bold uppercase leading-tight tracking-[0.06em] text-white sm:text-[11px] mb-1">
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

            {/* 3 Pillole espandibili Accordion */}
            <p className="mt-8 sm:mt-10 md:mt-12 text-center text-xs font-normal leading-relaxed text-white/95 sm:text-sm md:text-base">
              {t('landing.howToIntro')}
            </p>
            <div className="mt-3 md:mt-4 flex flex-row flex-nowrap justify-center items-center gap-1 sm:gap-2 md:gap-3 w-full max-w-4xl mx-auto px-1 sm:px-2">
              {HOW_TO_ITEMS.map((item) => {
                const Icon = item.icon;
                const isActive = activePill === item.id;
                const isCollapsed = activePill !== null && !isActive;

                return (
                  <button
                    key={item.id}
                    onClick={() => setActivePill(isActive ? null : item.id)}
                    className={`group relative flex overflow-hidden border border-white/20 bg-white/[0.08] backdrop-blur-md hover:bg-white/[0.15] hover:border-white/30 shadow-[0_0_20px_rgba(0,0,0,0.2)] transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] cursor-pointer h-12 sm:h-14 items-center rounded-full shrink-0 ${
                      isActive 
                        ? 'p-1.5 pl-1.5 sm:p-2 sm:pl-2 w-[220px] sm:w-[340px] md:w-[460px] justify-between bg-white/[0.12] border-white/30' 
                        : isCollapsed 
                          ? 'p-1.5 sm:p-2 w-[44px] sm:w-[48px] md:w-[56px] justify-center' 
                          : 'p-1.5 pr-1 sm:p-2 sm:pr-4 md:pr-5 w-[100px] sm:w-[140px] md:w-[170px] justify-start text-center'
                    }`}
                  >
                    {/* SINISTRA: Icona + Testi (Titolo e Descrizione) */}
                    <div className="flex items-center gap-1.5 sm:gap-2 md:gap-3 overflow-hidden whitespace-nowrap min-w-0">
                      {/* Pallino con Icona */}
                      <div className={`flex shrink-0 items-center justify-center rounded-full transition-colors duration-300 h-9 w-9 sm:h-10 sm:w-10 ${isActive ? 'bg-[#FF7300]/20' : 'bg-white/10 group-hover:bg-white/20'}`}>
                        <Icon className={`h-4 w-4 sm:h-4 sm:w-4 transition-colors duration-300 ${isActive ? 'text-[#FF7300]' : 'text-white'}`} strokeWidth={2.5} />
                      </div>
                      
                      {/* Contenitore Testi */}
                      <div className={`flex flex-col justify-center text-left transition-[max-width,opacity] duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] overflow-hidden ${isCollapsed ? 'opacity-0 max-w-0' : 'opacity-100 max-w-[450px]'}`}>
                        <span className="font-bold text-white uppercase tracking-wide text-[9px] sm:text-xs md:text-sm leading-tight truncate">
                          {item.shortTitle}
                        </span>
                        
                        {/* Descrizione: sempre nel DOM, larghezza animata per non farla scattare */}
                        <span className={`hidden sm:block text-[10px] sm:text-[11px] text-white/70 tracking-wide font-medium leading-tight truncate transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] ${isActive ? 'max-h-8 opacity-100 mt-0.5 max-w-[280px] sm:max-w-[400px]' : 'max-h-0 opacity-0 mt-0 max-w-0'}`}>
                          {item.description}
                        </span>
                      </div>
                    </div>

                    {/* DESTRA: Pulsante Azione (sempre nel DOM animato fluidamente) */}
                    <div className={`shrink-0 overflow-hidden transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] ${isActive ? 'max-w-[150px] opacity-100 pl-1 md:pl-2' : 'max-w-0 opacity-0 pl-0'}`}>
                      <Link
                        href={item.href}
                        className="inline-flex h-8 sm:h-9 md:h-10 items-center justify-center rounded-full bg-[#FF7300] px-3 sm:px-4 md:px-5 text-[9px] sm:text-[10px] md:text-[11px] font-bold uppercase tracking-wide text-white transition-all hover:bg-[#e66700] shadow-[0_2px_10px_rgba(255,115,0,0.3)] hover:scale-105 active:scale-95 whitespace-nowrap"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {item.cta}
                      </Link>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Pulsante CTA "INIZIA ORA" */}
            <div className="mt-8 sm:mt-10 flex w-full justify-center">
              <Link
                href="/login"
                className="group relative inline-flex items-center justify-center overflow-hidden rounded-full border border-white/30 bg-white/10 px-8 py-3.5 sm:px-10 sm:py-4 text-xs sm:text-sm font-bold uppercase tracking-widest text-white shadow-[0_0_20px_rgba(255,255,255,0.1)] backdrop-blur-md transition-all duration-300 hover:border-white/50 hover:bg-white/20 hover:shadow-[0_0_30px_rgba(255,255,255,0.2)] hover:scale-105 active:scale-95"
              >
                <div className="absolute inset-0 flex h-full w-full justify-center [transform:skew(-12deg)_translateX(-150%)] group-hover:duration-1000 group-hover:[transform:skew(-12deg)_translateX(150%)]">
                  <div className="relative h-full w-8 bg-white/20" />
                </div>
                <span>INIZIA ORA</span>
              </Link>
            </div>

            {/* Boutique Cards Piu Piccole */}
            <div className="mt-12 sm:mt-16 text-center">
              <h3 className="mb-4 sm:mb-6 text-xs sm:text-sm font-semibold uppercase tracking-widest text-white/90">
                La Nostra Boutique
              </h3>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 sm:gap-4 max-w-4xl mx-auto px-2">
                {BOUTIQUE_CATEGORIES.map((cat) => (
                  <Link
                    key={cat.id}
                    href={cat.href}
                    className="group flex flex-col items-center gap-2 rounded-xl border border-white/10 bg-white/5 p-2 transition-all duration-300 hover:border-white/30 hover:bg-white/10 shadow-[0_4px_10px_rgba(0,0,0,0.2)] hover:shadow-[0_4px_15px_rgba(0,0,0,0.4)]"
                  >
                    <div className="relative w-full aspect-[4/3] overflow-hidden rounded bg-white/10">
                      {cat.imageUrl ? (
                        <Image
                          src={cat.imageUrl}
                          alt={cat.label}
                          fill
                          className="object-cover transition-transform duration-500 group-hover:scale-110"
                          sizes="(max-width: 640px) 30vw, 15vw"
                          unoptimized
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Package className="h-6 w-6 text-white/40" />
                        </div>
                      )}
                    </div>
                    <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-white/70 transition-colors group-hover:text-white text-center">
                      {cat.label}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </section>

      </div>
    </div>
  );
}
