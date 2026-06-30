'use client';

import { cn } from '@/lib/utils';

interface CardFoilOverlayProps {
  className?: string;
}

/**
 * Overlay olografico "foil" (stile CardTrader) da sovrapporre all'immagine di
 * una carta. Tre strati animati, tarati per restare eleganti senza bruciare
 * l'immagine:
 *  1. bande prismatiche sottili in `color-dodge`, domate da brightness/contrast,
 *     che scorrono avanti/indietro (animate-foil-shimmer);
 *  2. micro-scintillii "glitter" che traslano e luccicano (animate-foil-sparkle);
 *  3. una passata di luce morbida in `overlay` che attraversa la carta
 *     (animate-foil-sweep) — il vero tocco "premium".
 *
 * È puramente decorativo: `pointer-events-none` + `aria-hidden`, e si disattiva
 * con `prefers-reduced-motion`. Va montato dentro un contenitore `relative
 * overflow-hidden` (lo stesso dell'immagine) così da seguirne i bordi arrotondati.
 */
export function CardFoilOverlay({ className }: CardFoilOverlayProps) {
  return (
    <div
      aria-hidden
      className={cn('pointer-events-none absolute inset-0 z-[2] overflow-hidden', className)}
    >
      {/* Strato 1 — bande prismatiche sottili (color-dodge domato) */}
      <div
        className="absolute inset-0 mix-blend-color-dodge opacity-[0.4] animate-foil-shimmer motion-reduce:animate-none"
        style={{
          filter: 'brightness(0.85) contrast(1.6)',
          backgroundImage:
            'repeating-linear-gradient(110deg, hsla(0,90%,68%,0.85) 0%, hsla(45,95%,70%,0.85) 7%, hsla(140,85%,65%,0.85) 14%, hsla(190,90%,68%,0.85) 21%, hsla(255,85%,70%,0.85) 28%, hsla(320,90%,70%,0.85) 35%, hsla(0,90%,68%,0.85) 42%)',
          backgroundSize: '300% 300%',
        }}
      />
      {/* Strato 2 — micro-scintillii glitter */}
      <div
        className="absolute inset-0 mix-blend-color-dodge animate-foil-sparkle motion-reduce:hidden"
        style={{
          backgroundImage:
            'radial-gradient(circle at 20% 25%, #fff 0, transparent 1.2%), radial-gradient(circle at 70% 15%, #fff 0, transparent 1%), radial-gradient(circle at 82% 60%, #fff 0, transparent 1.2%), radial-gradient(circle at 35% 72%, #fff 0, transparent 1%), radial-gradient(circle at 55% 45%, #fff 0, transparent 1%), radial-gradient(circle at 12% 85%, #fff 0, transparent 1%)',
          backgroundSize: '200% 200%',
        }}
      />
      {/* Strato 3 — passata di luce morbida */}
      <div
        className="absolute -inset-[40%] mix-blend-overlay opacity-90 animate-foil-sweep motion-reduce:hidden"
        style={{
          backgroundImage:
            'linear-gradient(105deg, transparent 38%, rgba(255,255,255,0.75) 48%, rgba(255,255,255,0.95) 50%, rgba(255,255,255,0.75) 52%, transparent 62%)',
          backgroundSize: '250% 250%',
        }}
      />
    </div>
  );
}
