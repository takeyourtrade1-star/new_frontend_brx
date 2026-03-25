'use client';

import { useState, useEffect } from 'react';

/**
 * Card "Nuove Occasioni": barra arancione in alto, gradient magenta→indigo,
 * griglia 2 colonne con 6 righe ciascuna (numero, icona pill, testo, prezzo).
 * Il testo nella barra scorre verso sinistra quando si scrolla la pagina verso l'alto.
 */
const ROW_LABEL = 'Il gattopardo magico';
const ROW_PRICE = '3$';
const ROW_NUMBER = 4;
const ROWS_PER_COLUMN = 6;
const TOTAL_ITEMS = ROWS_PER_COLUMN * 2;
/** Quanto si sposta il testo (px) per ogni pixel di scroll della pagina */
const SCROLL_TO_OFFSET_FACTOR = 0.4;

const listItem = {
  number: ROW_NUMBER,
  label: ROW_LABEL,
  price: ROW_PRICE,
};
const listItems = Array(TOTAL_ITEMS).fill(listItem);

export function NuoveOccasioniCard() {
  const [barOffsetX, setBarOffsetX] = useState(0);

  useEffect(() => {
    let rafId: number;
    const handleScroll = () => {
      rafId = requestAnimationFrame(() => {
        const scrollY = typeof window !== 'undefined' ? window.scrollY : 0;
        setBarOffsetX(scrollY * SCROLL_TO_OFFSET_FACTOR);
      });
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => {
      window.removeEventListener('scroll', handleScroll);
      cancelAnimationFrame(rafId);
    };
  }, []);

  return (
    <div
      className="overflow-hidden rounded-2xl shadow-lg"
      style={{
        background: 'linear-gradient(180deg, #7e2e6e 0%, #251842 100%)',
      }}
    >
      {/* Barra arancione: il testo scorre verso sinistra quando scrolli la pagina verso l'alto */}
      <div
        className="relative flex w-full items-center overflow-hidden py-2.5"
        style={{ backgroundColor: '#ff6b00' }}
      >
        <div
          className="flex w-max shrink-0 items-center gap-10 whitespace-nowrap text-lg font-bold uppercase tracking-wide text-white md:gap-12 md:text-xl"
          style={{
            transform: `translateX(calc(-50% + ${barOffsetX}px))`,
          }}
          aria-hidden
        >
          {Array.from({ length: 20 }).map((_, i) => (
            <span key={i}>NUOVE OCCASIONI</span>
          ))}
          {Array.from({ length: 20 }).map((_, i) => (
            <span key={`dup-${i}`}>NUOVE OCCASIONI</span>
          ))}
        </div>
      </div>

      {/* Content: 2-column grid */}
      <div className="grid grid-cols-2 gap-x-8 gap-y-3 p-4 md:p-5">
        {listItems.map((item, i) => (
          <div
            key={i}
            className="flex items-center justify-between gap-3 rounded-xl px-3 py-2.5"
            style={{ backgroundColor: '#522b64' }}
          >
            <span className="mr-1 shrink-0 text-sm font-bold text-white">
              {item.number}
            </span>
            {/* Light grey vertical rounded rectangle (pill placeholder) */}
            <div
              className="h-8 w-3 shrink-0 rounded-full"
              style={{ backgroundColor: '#bfbfbf' }}
              aria-hidden
            />
            <span className="min-w-0 flex-1 truncate text-center text-sm font-bold text-white">
              {item.label}
            </span>
            <span className="shrink-0 text-sm font-bold text-white">
              {item.price}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
