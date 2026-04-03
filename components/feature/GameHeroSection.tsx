'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';
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
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const logoSrc = GAME_LOGO[gameSlug];
  const alt = t(GAME_ALT_KEY[gameSlug]);

  return (
    <section className="relative h-screen min-h-[680px] w-full overflow-hidden">
      <Image
        src={HERO_STATIC_BACKGROUND}
        alt=""
        fill
        className="object-cover object-center"
        style={{ transform: `translateY(${scrollY * 0.3}px)` }}
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
        className="absolute inset-x-0 bottom-0 h-[22%] bg-gradient-to-b from-slate-100/0 via-slate-100/10 via-55% to-slate-100/28 backdrop-blur-[1px] animate-in fade-in duration-1000"
        aria-hidden
      />

      <div
        className="absolute inset-x-0 bottom-0 h-[14%] bg-[linear-gradient(to_bottom,transparent_0%,rgb(241_245_249_/_0.01)_16%,rgb(241_245_249_/_0.03)_30%,rgb(241_245_249_/_0.07)_44%,rgb(241_245_249_/_0.13)_56%,rgb(241_245_249_/_0.22)_68%,rgb(241_245_249_/_0.36)_78%,rgb(241_245_249_/_0.54)_86%,rgb(241_245_249_/_0.72)_92%,rgb(241_245_249_/_0.87)_96%,rgb(241_245_249_/_0.95)_98%,rgb(241_245_249)_100%)] backdrop-blur-[2px] animate-in fade-in duration-1000"
        aria-hidden
      />

      <div className="absolute inset-x-0 top-0 z-10 flex justify-center pt-28 sm:pt-32 md:pt-28 lg:pt-32 3xl:pt-36" aria-hidden>
        <Image
          src={logoSrc}
          alt={alt}
          width={420}
          height={210}
          className="h-auto w-60 object-contain drop-shadow-lg sm:w-64 md:w-72 lg:w-80"
          sizes="(max-width: 640px) 240px, (max-width: 768px) 256px, (max-width: 1024px) 288px, 320px"
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
