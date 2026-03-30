'use client';

import React, { useRef, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Tag, RefreshCw, Gavel, CircleDollarSign, ShieldCheck, ArrowRightLeft, Scale, Package, TrendingUp, X, Mail, CheckCircle2 } from 'lucide-react';
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

/** Giochi principali: Solo Magic (ora a tutta larghezza) */
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

/** Giochi in arrivo + Pokemon + Yu-Gi-Oh (sfondo rotondo, riga inferiore) */
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

const BOUTIQUE_CATEGORIES = [
  { id: 'dadi', label: 'Dadi', href: '/products?category=dadi', imageUrl: getCdnImageUrl('dadi-boutique.png') },
  { id: 'buste', label: 'Buste', href: '/products?category=buste', imageUrl: getCdnImageUrl('buste-boutique.png') },
  { id: 'tappetini', label: 'Tappetini', href: '/products?category=tappetini', imageUrl: getCdnImageUrl('tappetini-boutique.png') },
  { id: 'memorabilia', label: 'Memorabilia', href: '/products?category=memorabilia', imageUrl: getCdnImageUrl('memorabilia-boutique.png') },
  { id: 'albums', label: 'Albums', href: '/products?category=albums', imageUrl: getCdnImageUrl('albums-boutique.png') },
  { id: 'game-kits', label: 'Game kits', href: '/products?category=game-kits', imageUrl: getCdnImageUrl('gamekits-boutique.png') },
];

export function LandingWelcome() {
  const { t } = useTranslation();
  const { setSelectedGame } = useGame();
  const [activePill, setActivePill] = React.useState<'vendere' | 'scambiare' | 'asta' | null>(null);
  const [notifyGame, setNotifyGame] = React.useState<{ src: string; alt: string } | null>(null);
  const [email, setEmail] = React.useState('');
  const [isNotifySuccess, setIsNotifySuccess] = React.useState(false);

  const handleNotifySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    // Mocking an API call
    setTimeout(() => {
      setIsNotifySuccess(true);
      setTimeout(() => {
        setNotifyGame(null);
        setIsNotifySuccess(false);
        setEmail('');
      }, 2000);
    }, 800);
  };

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
        href: '/scambi?video=1',
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
        {/* Hero: logo + tagline + griglia giochi, più compatto in alto */}
        <header className="flex items-center justify-center px-4 pb-1 pt-0 sm:pb-2 sm:pt-1 md:pb-2 md:pt-2">
          <div className="relative flex w-full max-w-5xl items-center justify-center">
            <Image
              src={getCdnImageUrl('Logo%20Principale%20EBARTEX.png')}
              alt="Ebartex"
              width={700}
              height={263}
              className="h-36 w-auto max-w-[95vw] object-contain object-center sm:h-44 md:h-52 lg:h-56 xl:h-64 2xl:h-72"
              sizes="(max-width: 640px) 95vw, (max-width: 1024px) 60vw, 800px"
              priority
              unoptimized
            />
          </div>
        </header>

        {/* Tagline: titolo + CTA su stessa riga */}
        <div className="px-3 pb-3 sm:px-4 sm:pb-4 md:pb-5">
          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row sm:items-center sm:justify-center sm:gap-6 md:gap-8">
            <h2 className="text-lg font-semibold uppercase tracking-[0.06em] text-white drop-shadow-sm sm:text-xl md:text-2xl md:tracking-[0.05em] lg:text-3xl">
              {t('landing.heroTitle')}
            </h2>
            
            {/* Pulsante CTA "INIZIA ORA" - Ridotto per mobile */}
            <Link
              href="/login"
              className="group relative inline-flex items-center justify-center overflow-hidden rounded-full border border-white/30 bg-white/10 px-4 py-2 sm:px-7 sm:py-3 text-[11px] sm:text-xs font-bold uppercase tracking-widest text-white shadow-[0_0_20px_rgba(255,255,255,0.1)] backdrop-blur-md transition-all duration-300 hover:border-white/50 hover:bg-white/20 hover:shadow-[0_0_30px_rgba(255,255,255,0.2)] hover:scale-105 active:scale-95"
            >
              <div className="absolute inset-0 flex h-full w-full justify-center [transform:skew(-12deg)_translateX(-150%)] group-hover:duration-1000 group-hover:[transform:skew(-12deg)_translateX(150%)]">
                <div className="relative h-full w-8 bg-white/20" />
              </div>
              <span>INIZIA ORA</span>
            </Link>
          </div>
          
          <p className="mx-auto mt-6 max-w-lg text-center text-xs font-normal leading-relaxed tracking-wide text-white/80 sm:mt-8 md:mt-10 sm:text-sm">
            {t('landing.heroSubtitle')}
          </p>
        </div>

        {/* Loghi giochi: Magic grande a tutta larghezza + Altri sotto nel PRESTO IN ARRIVO */}
        <section className="px-2 pt-14 pb-10 sm:px-4 sm:pt-8 sm:pb-3 md:px-6 md:pt-10 md:pb-4">
          <div className="mx-auto flex w-full max-w-lg flex-col items-center gap-6">
            {/* Riga 1: Magic — sfondo rettangolare/"allungato" (rounded-2xl) a tutta larghezza (max-w-lg) */}
            {MAIN_GAMES.map((game) => (
              <Link
                key={game.alt}
                href={game.homeHref}
                className="group relative flex w-full h-32 sm:h-40 md:h-48 items-center justify-center overflow-visible rounded-3xl border border-white/20 bg-white/10 p-8 shadow-[0_0_30px_rgba(255,255,255,0.15)] transition-all duration-300 hover:border-white/40 hover:bg-white/15 hover:backdrop-blur-md hover:scale-[1.02]"
                aria-label={t('landing.gameAria.goHome', { name: game.alt })}
                onClick={() => {
                  if (game.gameSlug === 'clear') setSelectedGame(null);
                  else if (game.gameSlug) setSelectedGame(game.gameSlug);
                }}
              >
                {/* Banner glass sopra - Citazione Magic centrata - DESKTOP */}
                <div className="hidden sm:flex absolute -top-3 left-0 right-0 z-10 items-center justify-center px-2">
                  <div className="text-center font-sans text-sm font-medium italic tracking-wide text-white drop-shadow-md truncate">
                    <span className="text-[#FF7300] not-italic">"</span>La battaglia non ha bisogno di uno scopo<span className="text-[#FF7300] not-italic">"</span>
                  </div>
                </div>
                {/* Badge Disponibile DESKTOP - in alto a destra mezzo fuori */}
                <span className="hidden sm:block absolute -top-3 right-0 z-10 translate-x-1/2 whitespace-nowrap rounded-full bg-[#FF7300] px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-white shadow-[0_2px_8px_rgba(255,115,0,0.4)]">Disponibile da ora!</span>
                {/* Badge Disponibile MOBILE - in basso centrato mezzo fuori */}
                <span className="sm:hidden absolute bottom-0 left-1/2 z-10 -translate-x-1/2 translate-y-1/2 whitespace-nowrap rounded-full bg-[#FF7300] px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-white shadow-[0_2px_8px_rgba(255,115,0,0.4)]">Disponibile da ora!</span>
                <img
                  src={game.src}
                  alt={game.alt}
                  className="transition-transform duration-500 group-hover:scale-110"
                  style={{ display: 'block', maxWidth: '85%', maxHeight: '75%', width: 'auto', height: 'auto', objectFit: 'contain' }}
                />
              </Link>
            ))}
            
            {/* Spacer per distanziare dalla sezione giochi */}
            <div className="h-4 sm:h-6" />
            
            {/* Giochi in arrivo — scorrimento libero senza container */}
            {/* Banner glass "PRESTO IN ARRIVO" - posizionato vicino ai giochi */}
            <div className="relative w-full mb-8 sm:mb-10">
              <div className="absolute top-2 sm:top-4 left-1/2 z-50 -translate-x-1/2 whitespace-nowrap rounded-full bg-[#8B5CF6]/20 px-[1.15rem] sm:px-8 py-2.5 sm:py-3.5 text-center font-sans text-xs sm:text-sm font-bold uppercase tracking-widest text-white shadow-[0_0_25px_rgba(139,92,246,0.5)] backdrop-blur-md">
                Presto in Arrivo
              </div>
            </div>
            
            <div className="games-marquee-track items-center gap-5 sm:gap-6 md:gap-8 py-6 w-full">
              {/* 10 copie dei giochi per loop infinito fluido */}
              {[...Array(10)].map((_, i) => (
                COMING_SOON_GAMES.map((game) => (
                  <button
                    key={`${i}-${game.alt}`}
                    type="button"
                    onClick={() => setNotifyGame({ src: game.src, alt: game.alt })}
                    className="group relative flex h-32 w-32 sm:h-28 sm:w-28 md:h-36 md:w-36 lg:h-36 lg:w-36 xl:h-36 xl:w-36 shrink-0 items-center justify-center overflow-visible rounded-full border border-white/10 bg-white/5 p-2 sm:p-4 transition-opacity duration-300 hover:opacity-100 opacity-60"
                  >
                    <img
                      src={game.src}
                      alt={game.alt}
                      style={{ display: 'block', maxWidth: '90%', maxHeight: '90%', width: 'auto', height: 'auto', objectFit: 'contain' }}
                    />
                  </button>
                ))
              ))}
            </div>
          </div>
        </section>

        {/* Modal "Avvisami" stile Glass */}
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
                      className="w-full rounded-2xl bg-[#FF7300] py-4 text-sm font-bold uppercase tracking-widest text-white shadow-[0_4px_15px_rgba(255,115,0,0.3)] transition-all hover:bg-[#e66700] hover:scale-[1.02] active:scale-95"
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

        {/* Come vendere / scambiare / asta — forte glass effect, video che si intravede */}
        {/* Sfondo blur che parte da metà "PRESTO IN ARRIVO" e sfuma dolcissimo verso il basso */}
        {/* Sfondo glass progressivo: blur che aumenta man mano che si scende */}
        {/* Layer 1: blur leggero, parte più in alto dai punti di forza */}
        <div 
          className="absolute inset-x-0 bottom-0 backdrop-blur-md pointer-events-none z-[1]" 
          style={{ 
            top: 'calc(100% - 520px)',
            WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.15) 10%, rgba(0,0,0,0.35) 25%, rgba(0,0,0,0.55) 45%, black 65%)',
            maskImage: 'linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.15) 10%, rgba(0,0,0,0.35) 25%, rgba(0,0,0,0.55) 45%, black 65%)'
          }} 
        />
        {/* Layer 2: blur medio, transizione più visibile */}
        <div 
          className="absolute inset-x-0 bottom-0 backdrop-blur-xl pointer-events-none z-[1]" 
          style={{ 
            top: 'calc(100% - 420px)',
            WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.2) 15%, rgba(0,0,0,0.5) 40%, black 65%)',
            maskImage: 'linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.2) 15%, rgba(0,0,0,0.5) 40%, black 65%)'
          }} 
        />
        {/* Layer 3: blur forte + tinta colore più intensa */}
        <div 
          className="absolute inset-x-0 bottom-0 bg-gradient-to-b from-transparent via-header-bg/35 to-header-bg/80 backdrop-blur-2xl pointer-events-none z-[1]" 
          style={{ 
            top: 'calc(100% - 320px)',
            WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.2) 20%, rgba(0,0,0,0.6) 45%, black 70%)',
            maskImage: 'linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.2) 20%, rgba(0,0,0,0.6) 45%, black 70%)'
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
              <div className="grid w-full grid-cols-2 md:grid-cols-3 gap-x-3 gap-y-4 sm:gap-x-6 sm:gap-y-8">
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

            {/* Divisore linea tra sezioni */}
            <div className="mx-auto my-6 sm:my-8 h-px w-2/3 max-w-lg bg-gradient-to-r from-transparent via-white/30 to-transparent" />

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
                        ? 'p-1.5 pl-1.5 sm:p-2 sm:pl-2 w-auto justify-between bg-white/[0.12] border-white/30 transition-[width] duration-300 ease-out' 
                        : isCollapsed 
                          ? 'p-1.5 sm:p-2 w-[44px] sm:w-[48px] md:w-[56px] justify-center transition-[width] duration-500 delay-75' 
                          : 'p-1.5 pr-1 sm:p-2 sm:pr-4 md:pr-5 w-[100px] sm:w-[140px] md:w-[170px] justify-start text-center transition-[width] duration-500 delay-75'
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

            {/* Divisore linea tra sezioni */}
            <div className="mx-auto my-8 sm:my-10 h-px w-2/3 max-w-lg bg-gradient-to-r from-transparent via-white/30 to-transparent" />

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
                    className="group flex flex-col items-center gap-2 rounded-xl border border-white/10 bg-white/5 p-2 transition-all duration-300 hover:border-white/30 hover:bg-white/10 shadow-[0_4px_10px_rgba(0,0,0,0.2)] hover:shadow-[0_4px_15px_rgba(0,0,0,0.4)] overflow-hidden"
                  >
                    <div 
                      className="relative w-full aspect-[4/3] overflow-hidden rounded bg-cover bg-center transition-transform duration-500 group-hover:scale-110"
                      style={{ backgroundImage: `url(${cat.imageUrl})` }}
                    >
                      <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors" />
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
