'use client';

import React, { useRef, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Tag, RefreshCw, Gavel } from 'lucide-react';
import { getCdnImageUrl, getCdnVideoUrl } from '@/lib/config';

const BRAND_ORANGE = '#FF7300';

const HOW_TO_ITEMS = [
  { id: 'vendere', title: 'Come vendere', description: 'Vendi le tue carte con prezzi aggiornati e commissioni chiare.', href: '/home', cta: 'Vendi', icon: Tag },
  { id: 'scambiare', title: 'Come scambiare', description: 'Scambia carte in sicurezza con altri utenti.', href: '/scambi', cta: 'Scambia', icon: RefreshCw },
  { id: 'asta', title: 'Come mettere all\'asta', description: 'Metti all\'incanto o partecipa alle aste.', href: '/scambi', cta: 'Aste', icon: Gavel },
];

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

const getFeatures = () => [
  { iconKey: 'prezzi', title: 'Prezzi Migliori', description: 'Più di 2.000.000 acquirenti da più di 30 paesi.' },
  { iconKey: 'sicuro', title: 'Sistema Sicuro', description: 'Sistema Trust verificato per il massimo della protezione.' },
  { iconKey: 'gestione', title: 'Gestione Semplice', description: 'Mercato online di carte collezionabili con conti virtuali per transazioni semplici.' },
  { iconKey: 'domanda', title: 'Grande Domanda', description: 'Più di 2.000.000 acquirenti da più di 30 paesi.' },
  { iconKey: 'vendite', title: 'Vendite Semplici', description: 'Vendi in pochi click, grazie al nostro database sempre aggiornato su carte e spese di spedizione.' },
  { iconKey: 'commissioni', title: 'Commissioni Leggere', description: 'Nessun limite di tempo, solo il 5% quando vendi.' },
];

const getGameLogos = () => [
  { src: getCdnImageUrl('loghi-giochi/magic.png'), alt: 'Magic The Gathering', homeHref: '/home/magic' },
  { src: getCdnImageUrl('loghi-giochi/yu-gi-oh.png'), alt: 'Yu-Gi-Oh! Trading Card Game', homeHref: '/home' },
  { src: getCdnImageUrl('loghi-giochi/pokèmon.png'), alt: 'Pokémon Trading Card Game', homeHref: '/home/pokemon' },
  { src: getCdnImageUrl('loghi-giochi/One_Piece_Card_Game_Logo%201.png'), alt: 'One Piece Card Game', comingSoon: true },
  { src: getCdnImageUrl('loghi-giochi/Disney_Lorcana_480x480%201.png'), alt: 'Disney Lorcana', comingSoon: true },
];

export function LandingWelcome() {
  const FEATURES = getFeatures();
  const GAME_LOGOS = getGameLogos();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [hoveredCardId, setHoveredCardId] = React.useState<string | null>(null);

  useEffect(() => {
    videoRef.current?.play().catch(() => {});
  }, []);

  return (
    <div className="relative min-h-screen w-full overflow-x-hidden text-white">
      {/* Sfondo video: loop, muto, senza controlli (stessa logica CDN delle immagini per S3) */}
      <video
        ref={videoRef}
        src={getCdnVideoUrl(LANDING_BG_VIDEO)}
        className="absolute inset-0 h-full w-full object-cover object-center"
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
      <div className="relative z-10 flex min-h-screen flex-col">
        {/* Hero: logo + tagline + griglia giochi, con più altezza */}
        <header className="flex items-center justify-center px-4 pt-10 pb-1 sm:pt-12 md:pt-16">
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
        <div className="text-center px-4 pb-8 pt-2 sm:pb-10 md:pb-12">
          <h2 className="text-xl font-bold uppercase tracking-[0.12em] text-white drop-shadow-sm sm:text-2xl md:text-3xl lg:text-4xl">
            COMPRA, VENDI E SCAMBIA
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-sm font-medium uppercase tracking-[0.08em] text-white/85 sm:text-base md:mt-4">
            Scopri le migliori opportunità del mercato
          </p>
        </div>

        {/* Loghi giochi - stile Cardmarket/Cardtrader: 3 per riga, box bassi tipo 16:9, logo ben centrato */}
        <section className="px-4 pb-10 sm:pb-12 md:pb-16">
          <div className="mx-auto grid max-w-4xl grid-cols-1 gap-[2px] sm:grid-cols-3">
            {GAME_LOGOS.map((game, index) => (
              <Link
                key={game.alt}
                href={game.comingSoon ? '#' : (game.homeHref ?? '/home')}
                className={`group relative flex aspect-[16/9] min-h-0 w-full flex-col items-center justify-center border border-white/15 bg-white/5 py-4 px-4 transition-all duration-200 hover:border-white/35 hover:bg-white/10 hover:backdrop-blur-md sm:py-5 sm:px-5 ${index === 3 ? 'sm:col-start-auto' : ''}`}
                style={{ borderRadius: 0 }}
                aria-label={game.comingSoon ? `${game.alt} - Presto in arrivo` : `${game.alt} - Vai alla home`}
              >
                <div className="flex min-h-0 flex-1 items-center justify-center">
                  <Image
                    src={game.src}
                    alt={game.alt}
                    width={160}
                    height={100}
                    className="max-h-[60px] max-w-full object-contain object-center transition-opacity group-hover:opacity-95 sm:max-h-[72px]"
                    unoptimized
                  />
                </div>
                {game.comingSoon && (
                  <span className="mt-2 shrink-0 rounded-full bg-white/15 px-2 py-0.5 font-sans text-[10px] font-semibold tracking-tight text-white backdrop-blur-md sm:text-xs">
                    Presto in arrivo
                  </span>
                )}
              </Link>
            ))}
          </div>
        </section>

        {/* Come vendere / scambiare / asta - CTA al centro in overlay; altre card vetro smerigliato al hover */}
        <section className="w-full bg-white px-4 py-8 sm:py-10">
          <div className="mx-auto max-w-4xl">
            <p className="text-center text-sm text-gray-500 sm:text-base">
              Vendere, scambiare e mettere all&apos;asta le tue carte in modo semplice.
            </p>
            <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3 sm:gap-6">
              {HOW_TO_ITEMS.map((item) => {
                const Icon = item.icon;
                const isHovered = hoveredCardId === item.id;
                return (
                  <Link
                    key={item.id}
                    href={item.href}
                    className="relative flex min-h-[140px] flex-col rounded-xl border border-gray-100 bg-white p-5 transition-all duration-200 hover:border-gray-200 hover:shadow-[0_4px_20px_rgba(0,0,0,0.06)] sm:min-h-[160px] sm:p-6"
                    onMouseEnter={() => setHoveredCardId(item.id)}
                    onMouseLeave={() => setHoveredCardId(null)}
                  >
                    <div className="flex flex-col">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gray-50 text-gray-600">
                        <Icon className="h-5 w-5" strokeWidth={1.8} aria-hidden />
                      </div>
                      <h3 className="mt-3 font-semibold text-gray-900 sm:text-lg">
                        {item.title}
                      </h3>
                      <p className="mt-1 text-sm leading-snug text-gray-500">
                        {item.description}
                      </p>
                      {/* Su mobile il CTA resta visibile in fondo (niente hover) */}
                      <span
                        className="mt-4 inline-flex w-full items-center justify-center rounded-lg px-3 py-2.5 text-sm font-semibold text-white md:hidden"
                        style={{ backgroundColor: BRAND_ORANGE }}
                      >
                        {item.cta}
                      </span>
                    </div>
                    {/* Solo la card in hover: effetto vetro satinato stile Apple (testo sotto visibile ma opaco) */}
                    {isHovered && (
                      <>
                        <div
                          className="absolute inset-0 z-10 rounded-xl transition-all duration-200"
                          style={{
                            background: 'rgba(255,255,255,0.45)',
                            backdropFilter: 'saturate(180%) blur(20px)',
                            WebkitBackdropFilter: 'saturate(180%) blur(20px)',
                          }}
                          aria-hidden
                        />
                        <div className="absolute inset-0 z-20 flex items-center justify-center rounded-xl">
                          <span
                            className="inline-flex items-center justify-center rounded-lg px-5 py-3 text-sm font-semibold text-white shadow-lg"
                            style={{ backgroundColor: BRAND_ORANGE }}
                          >
                            {item.cta}
                          </span>
                        </div>
                      </>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        </section>

        {/* 6 KPI - icone SVG arancioni, testo a filo con i bordi */}
        <section className="flex-1 px-4 pb-6 mt-10 sm:mt-12">
          <div className="mx-auto grid max-w-5xl grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f) => {
              const IconComponent = FEATURE_ICONS[f.iconKey];
              return (
                <div
                  key={f.title}
                  className="flex w-full max-w-[14rem] flex-col items-center gap-4 self-center p-4 text-center sm:max-w-[16rem] md:max-w-[18rem]"
                >
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center sm:h-[4.5rem] sm:w-[4.5rem] md:h-20 md:w-20">
                    {IconComponent ? <IconComponent /> : null}
                  </div>
                  <div className="w-full">
                    <h3 className="text-lg font-bold uppercase tracking-wide sm:text-xl">
                      {f.title}
                    </h3>
                    <p className="mt-2 text-base leading-snug text-white/90">
                      {f.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Barra sotto le icone: 60px altezza, full width */}
        <nav
          className="relative mt-auto w-full pt-16"
          aria-label="Menu principale"
        >
          {/* Barra 60px altezza, bordo 1px, sfondo Rectangle 30 */}
          <div
            className="flex h-[60px] w-full items-center justify-center border border-[#2c1810]"
            style={{
              backgroundImage: `url(${getCdnImageUrl('rectangle-30.jpg')})`,
              backgroundRepeat: 'repeat-x',
              backgroundSize: 'auto 100%',
            }}
          >
            <div className="flex flex-wrap items-center justify-center gap-12 px-4 sm:gap-16 md:gap-20 lg:gap-24">
            <Link
              href="/account-business"
              className="font-display text-[36px] font-normal not-italic leading-[100%] tracking-normal uppercase text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.4)] hover:opacity-95"
            >
              VENDI
            </Link>
            <Link
              href="/home"
              className="font-display text-[36px] font-normal not-italic leading-[100%] tracking-normal uppercase text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.4)] hover:opacity-95"
            >
              GUADAGNA
            </Link>
            <Link
              href="/home"
              className="font-display text-[36px] font-normal not-italic leading-[100%] tracking-normal uppercase text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.4)] hover:opacity-95"
            >
              COMPRA
            </Link>
            <Link
              href="/home"
              className="font-display text-[36px] font-normal not-italic leading-[100%] tracking-normal uppercase text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.4)] hover:opacity-95"
            >
              RISPARMIA
            </Link>
            <Link
              href="/home"
              className="font-display text-[36px] font-normal not-italic leading-[100%] tracking-normal uppercase text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.4)] hover:opacity-95"
            >
              COLLEZIONA
            </Link>
            </div>
          </div>
        </nav>

      </div>
    </div>
  );
}
