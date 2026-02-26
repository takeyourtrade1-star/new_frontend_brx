'use client';

import { useState, useEffect } from 'react';

/** Oro in gradiente verso il basso */
const MARQUEE_BG = 'linear-gradient(180deg, #F3C76A 0%, #e5b85c 50%, #d4a84b 100%)';
const SCROLL_TO_OFFSET_FACTOR = 0.18;

export function ScrollMarquee({ label }: { label: string }) {
  const [offsetX, setOffsetX] = useState(0);

  useEffect(() => {
    let rafId: number;
    const handleScroll = () => {
      rafId = requestAnimationFrame(() => {
        const scrollY = typeof window !== 'undefined' ? window.scrollY : 0;
        setOffsetX(scrollY * SCROLL_TO_OFFSET_FACTOR);
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
      className="relative flex w-full items-center overflow-hidden py-2.5 font-display"
      style={{ background: MARQUEE_BG }}
    >
      <div
        className="flex w-max shrink-0 items-center gap-10 whitespace-nowrap text-lg font-bold uppercase tracking-wide md:gap-12 md:text-xl"
        style={{
          transform: `translateX(calc(-50% + ${offsetX}px))`,
          color: '#1a1a1a',
        }}
        aria-hidden
      >
        {Array.from({ length: 20 }).map((_, i) => (
          <span key={i}>{label}</span>
        ))}
        {Array.from({ length: 20 }).map((_, i) => (
          <span key={`b-${i}`}>{label}</span>
        ))}
      </div>
    </div>
  );
}
