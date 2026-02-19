'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';

const FEATURES = [
  {
    icon: '/landing/sale%201.png',
    title: 'Prezzi Migliori',
    description: 'Più di 2.000.000 acquirenti da più di 30 paesi.',
  },
  {
    icon: '/landing/security-lock%201.png',
    title: 'Sistema Sicuro',
    description: 'Sistema Trust verificato per il massimo della protezione.',
  },
  {
    icon: '/landing/swap%201.png',
    title: 'Gestione Semplice',
    description:
      'Mercato online di carte collezionabili con conti virtuali per transazioni semplici.',
  },
  {
    icon: '/landing/justice%201.png',
    title: 'Grande Domanda',
    description: 'Più di 2.000.000 acquirenti da più di 30 paesi.',
  },
  {
    icon: '/landing/sold-out%201.png',
    title: 'Vendite Semplici',
    description:
      'Vendi in pochi click, grazie al nostro database sempre aggiornato su carte e spese di spedizione.',
  },
  {
    icon: '/landing/economic-growth%201.png',
    title: 'Commissioni Leggere',
    description: 'Nessun limite di tempo, solo il 5% quando vendi.',
  },
];

const GAME_LOGOS = [
  { src: '/loghi-giochi/magic.png', alt: 'Magic The Gathering' },
  { src: '/loghi-giochi/yu-gi-oh.png', alt: 'Yu-Gi-Oh! Trading Card Game' },
  { src: '/loghi-giochi/pokèmon.png', alt: 'Pokémon Trading Card Game' },
  { src: '/loghi-giochi/One_Piece_Card_Game_Logo%201.png', alt: 'One Piece Card Game' },
  { src: '/loghi-giochi/Disney_Lorcana_480x480%201.png', alt: 'Disney Lorcana' },
];

export function LandingWelcome() {
  return (
    <div
      className="relative min-h-screen w-full overflow-x-hidden text-white"
      style={{
        backgroundImage:
          'linear-gradient(rgba(61, 101, 198, 0.85), rgba(29, 49, 96, 0.85)), url("/brx_bg.png"), linear-gradient(180deg, #3D65C6 0%, #1D3160 100%)',
        backgroundRepeat: 'no-repeat, repeat, no-repeat',
        backgroundSize: 'cover, auto, cover',
        backgroundAttachment: 'fixed',
      }}
    >
      <div className="relative z-10 flex min-h-screen flex-col">
        {/* Top: logo centrato (pt ridotto per dare spazio con header in pagina) */}
        <header className="flex items-center justify-center px-4 pt-4 pb-1">
          <div className="relative flex w-full max-w-5xl items-center justify-center">
            <Image
              src="/landing/Logo%20Principale%20EBARTEX.png"
              alt="ebartex"
              width={800}
              height={300}
              className="h-80 w-auto max-w-full object-contain object-center sm:h-96 md:h-[28rem] lg:h-[32rem] xl:h-[36rem]"
              priority
            />
          </div>
        </header>

        {/* Tagline */}
        <div className="text-center px-4 pb-4 pt-1">
          <p className="text-lg font-bold uppercase tracking-wide sm:text-xl">
            COMPRA, VENDI E SCAMBIA
          </p>
          <p className="mt-1 text-sm uppercase tracking-wide text-white/90 sm:text-base">
            SCOPRI LE MIGLIORI OPPORTUNITÀ DEL MERCATO
          </p>
        </div>

        {/* Loghi giochi - sezione in fila, scroll orizzontale */}
        <section className="px-4 pb-6">
          <div className="mx-auto max-w-[90rem] rounded-3xl border-2 border-white/90 px-10 py-8 sm:px-14 sm:py-10 md:px-20 md:py-12">
            <div className="scrollbar-hide flex flex-nowrap items-center justify-center gap-10 overflow-x-auto sm:gap-14 md:gap-20 lg:gap-24">
              {GAME_LOGOS.map((game) => (
                <Link
                  key={game.alt}
                  href="/home"
                  className="flex h-20 w-32 shrink-0 items-center justify-center transition-opacity hover:opacity-90 focus:opacity-90 sm:h-24 sm:w-40 md:h-28 md:w-44"
                  aria-label={`${game.alt} - Vai alla home`}
                >
                  <Image
                    src={game.src}
                    alt={game.alt}
                    width={176}
                    height={112}
                    className="max-h-20 w-auto max-w-full object-contain sm:max-h-24 md:max-h-28"
                  />
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* 6 KPI - ingranditi, testo a filo con i bordi delle icone */}
        <section className="flex-1 px-4 pb-6">
          <div className="mx-auto grid max-w-5xl grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className="flex w-full max-w-[14rem] flex-col items-center gap-4 self-center p-4 text-center sm:max-w-[16rem] md:max-w-[18rem]"
              >
                <div className="flex h-16 w-16 shrink-0 items-center justify-center sm:h-[4.5rem] sm:w-[4.5rem] md:h-20 md:w-20">
                  <Image
                    src={f.icon}
                    alt=""
                    width={80}
                    height={80}
                    className="h-full w-full object-contain"
                  />
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
            ))}
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
              backgroundImage: 'url("/rectangle-30.jpg")',
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
