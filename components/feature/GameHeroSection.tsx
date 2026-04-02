'use client';

import Image from 'next/image';
import Link from 'next/link';
import { getCdnImageUrl } from '@/lib/config';
import type { GameSlug } from '@/lib/contexts/GameContext';
import { useTranslation } from '@/lib/i18n/useTranslation';

const HERO_STATIC_BACKGROUND = getCdnImageUrl('carousel/slide1.jpg');

const GAME_LOGO: Record<GameSlug, string> = {
  mtg: getCdnImageUrl('loghi-giochi/magic.png'),
  pokemon: getCdnImageUrl('loghi-giochi/pokèmon.png'),
  op: getCdnImageUrl('loghi-giochi/One_Piece_Card_Game_Logo%201.png'),
};

const GAME_ALT_KEY: Record<GameSlug, 'games.alt.mtg' | 'games.alt.pokemon' | 'games.alt.op'> = {
  mtg: 'games.alt.mtg',
  pokemon: 'games.alt.pokemon',
  op: 'games.alt.op',
};

interface GameHeroSectionProps {
  gameSlug: GameSlug;
}

export function GameHeroSection({ gameSlug }: GameHeroSectionProps) {
  const { t } = useTranslation();

  const logoSrc = GAME_LOGO[gameSlug];
  const alt = t(GAME_ALT_KEY[gameSlug]);

  return (
    <section className="relative h-screen min-h-[680px] w-full overflow-hidden">
      <Image
        src={HERO_STATIC_BACKGROUND}
        alt=""
        fill
        className="object-cover object-center"
        sizes="100vw"
        priority
        unoptimized
      />

      {/* Overlay scuro 50% per scurire l'immagine hero */}
      <div className="absolute inset-0 bg-black/50" aria-hidden />

      {/* Gradient vignetta cinematografica — scurisce i bordi, centro luminoso */}
      <div
        className="absolute inset-0 animate-in fade-in duration-1000 bg-[radial-gradient(circle_at_center,transparent_30%,rgba(0,0,0,0.6)_100%)]"
        aria-hidden
      />

      <div
        className="absolute inset-x-0 bottom-0 h-[6%] bg-gradient-to-b from-transparent from-0% via-slate-100/[0.02] via-[8%] via-slate-100/[0.04] via-[16%] via-slate-100/[0.07] via-[24%] via-slate-100/[0.11] via-[30%] via-slate-100/[0.16] via-[36%] via-slate-100/[0.22] via-[42%] via-slate-100/[0.30] via-[48%] via-slate-100/[0.40] via-[54%] via-slate-100/[0.52] via-[60%] via-slate-100/[0.65] via-[66%] via-slate-100/[0.78] via-[72%] via-slate-100/[0.88] via-[78%] via-slate-100/[0.94] via-[84%] via-slate-100/[0.97] via-[90%] via-slate-100/[0.99] via-[96%] to-slate-100 to-100% backdrop-blur-[1px] animate-in fade-in duration-1000"
        aria-hidden
      />

      <div className="absolute inset-x-0 top-0 z-10 flex justify-center pt-20 sm:pt-24 md:pt-28 lg:pt-32 3xl:pt-36" aria-hidden>
        <Image
          src={logoSrc}
          alt={alt}
          width={380}
          height={190}
          className="h-auto w-44 object-contain drop-shadow-lg sm:w-56 md:w-72 lg:w-80"
          sizes="(max-width: 640px) 176px, (max-width: 768px) 224px, (max-width: 1024px) 288px, 320px"
          unoptimized
        />
      </div>

      {gameSlug !== 'mtg' && (
        <div className="absolute inset-x-0 top-40 z-20 flex justify-center px-4 sm:top-44 md:top-48 lg:top-52">
          <div className="max-w-xl rounded-full border border-white/20 bg-black/60 px-5 py-2 text-center text-[10px] font-medium text-white shadow-2xl backdrop-blur-md sm:text-xs md:text-sm">
            Questi giochi sono presto in arrivo, ma intanto puoi curiosare il nostro sito oppure dare un&apos;occhiata a{' '}
            <Link href="/home/magic" className="font-bold text-primary hover:underline">
              MAGIC
            </Link>
          </div>
        </div>
      )}
    </section>
  );
}
