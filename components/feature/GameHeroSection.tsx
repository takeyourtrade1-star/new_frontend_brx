'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getCdnImageUrl } from '@/lib/config';
import type { GameSlug } from '@/lib/contexts/GameContext';

const SLIDE_COUNT = 3;
const AUTO_PLAY_INTERVAL_MS = 4500;

const HERO_SLIDES = [
  getCdnImageUrl('carousel/slide1.jpg'),
  getCdnImageUrl('carousel/slide2.jpg'),
  getCdnImageUrl('carousel/slide3.jpg'),
];

const GAME_LOGO: Record<GameSlug, string> = {
  mtg: getCdnImageUrl('loghi-giochi/magic.png'),
  pokemon: getCdnImageUrl('loghi-giochi/pokèmon.png'),
  op: getCdnImageUrl('loghi-giochi/One_Piece_Card_Game_Logo%201.png'),
};

const GAME_ALT: Record<GameSlug, string> = {
  mtg: 'Magic: The Gathering',
  pokemon: 'Pokémon Trading Card Game',
  op: 'One Piece Card Game',
};

interface GameHeroSectionProps {
  gameSlug: GameSlug;
}

export function GameHeroSection({ gameSlug }: GameHeroSectionProps) {
  const [current, setCurrent] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const goNext = useCallback(() => {
    setCurrent((prev) => (prev + 1) % SLIDE_COUNT);
  }, []);

  const goPrev = useCallback(() => {
    setCurrent((prev) => (prev - 1 + SLIDE_COUNT) % SLIDE_COUNT);
  }, []);

  useEffect(() => {
    if (isPaused) return;
    const t = setInterval(goNext, AUTO_PLAY_INTERVAL_MS);
    return () => clearInterval(t);
  }, [goNext, isPaused]);

  const logoSrc = GAME_LOGO[gameSlug];
  const alt = GAME_ALT[gameSlug];

  return (
    <section
      className="relative w-full overflow-hidden"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onFocus={() => setIsPaused(true)}
      onBlur={() => setIsPaused(false)}
    >
      <div className="relative aspect-[1200/480] w-full max-h-[480px]">
        {/* Carosello di sfondo (come nella home generica) */}
        {Array.from({ length: SLIDE_COUNT }).map((_, index) => (
          <div
            key={index}
            className={cn(
              'absolute inset-0 transition-opacity duration-500 ease-out',
              index === current ? 'opacity-100 z-0' : 'opacity-0 z-0'
            )}
            aria-hidden={index !== current}
          >
            <Image
              src={HERO_SLIDES[index]}
              alt=""
              fill
              className="object-cover"
              sizes="(max-width: 1200px) 100vw, 1200px"
              priority={index === 0}
              unoptimized
            />
          </div>
        ))}

        {/* Logo del gioco sopra il carosello */}
        <div
          className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none"
          aria-hidden
        >
          <Image
            src={logoSrc}
            alt={alt}
            width={320}
            height={160}
            className="max-h-[100px] w-auto object-contain drop-shadow-lg sm:max-h-[140px] md:max-h-[180px]"
            sizes="(max-width: 640px) 180px, (max-width: 1024px) 240px, 320px"
            unoptimized
          />
        </div>

        {/* Frecce */}
        <button
          type="button"
          onClick={goPrev}
          className="absolute left-2 top-1/2 z-20 -translate-y-1/2 rounded-full bg-black/40 p-2 text-white transition hover:bg-black/60 md:left-4"
          aria-label="Slide precedente"
        >
          <ChevronLeft className="h-6 w-6 md:h-8 md:w-8" />
        </button>
        <button
          type="button"
          onClick={goNext}
          className="absolute right-2 top-1/2 z-20 -translate-y-1/2 rounded-full bg-black/40 p-2 text-white transition hover:bg-black/60 md:right-4"
          aria-label="Slide successiva"
        >
          <ChevronRight className="h-6 w-6 md:h-8 md:w-8" />
        </button>

        {/* Pallini */}
        <div className="absolute bottom-4 left-1/2 z-20 flex -translate-x-1/2 gap-2">
          {Array.from({ length: SLIDE_COUNT }).map((_, index) => (
            <button
              key={index}
              type="button"
              onClick={() => setCurrent(index)}
              className={cn(
                'h-2 w-2 rounded-full transition-all md:h-2.5 md:w-2.5',
                index === current
                  ? 'bg-white scale-110'
                  : 'bg-white/60 hover:bg-white/80'
              )}
              aria-label={`Vai allo slide ${index + 1}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
