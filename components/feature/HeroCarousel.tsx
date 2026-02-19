'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Immagini del carousel (in public/carousel/).
 */
const SLIDES = [
  { src: '/carousel/slide1.jpg', alt: 'Carte da collezione e monete su tavolo' },
  { src: '/carousel/slide2.jpg', alt: 'Carte fantasy e accessori da gioco' },
  { src: '/carousel/slide3.jpg', alt: 'Tavolo di gioco in paesaggio fantasy' },
];

const AUTO_PLAY_INTERVAL_MS = 4500;

export function HeroCarousel() {
  const [current, setCurrent] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const goNext = useCallback(() => {
    setCurrent((prev) => (prev + 1) % SLIDES.length);
  }, []);

  const goPrev = useCallback(() => {
    setCurrent((prev) => (prev - 1 + SLIDES.length) % SLIDES.length);
  }, []);

  useEffect(() => {
    if (isPaused) return;
    const t = setInterval(goNext, AUTO_PLAY_INTERVAL_MS);
    return () => clearInterval(t);
  }, [goNext, isPaused]);

  return (
    <section
      className="relative w-full overflow-hidden"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onFocus={() => setIsPaused(true)}
      onBlur={() => setIsPaused(false)}
    >
      <div className="relative aspect-[1200/480] w-full max-h-[480px]">
        {SLIDES.map((slide, index) => (
          <div
            key={slide.src}
            className={cn(
              'absolute inset-0 transition-opacity duration-500 ease-out',
              index === current ? 'opacity-100 z-10' : 'opacity-0 z-0'
            )}
          >
            <Image
              src={slide.src}
              alt={slide.alt}
              fill
              className="object-cover"
              sizes="100vw"
              priority={index === 0}
            />
          </div>
        ))}
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
        {SLIDES.map((_, index) => (
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
    </section>
  );
}
