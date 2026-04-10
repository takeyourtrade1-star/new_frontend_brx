'use client';

import { useState, useEffect } from 'react';

/** Oro in gradiente verso il basso */
const MARQUEE_BG = 'linear-gradient(180deg, #F3C76A 0%, #e5b85c 50%, #d4a84b 100%)';
const SCROLL_TO_OFFSET_FACTOR = 0.18;

interface ScrollMarqueeProps {
  label: string;
  direction?: 'left' | 'right';
}

export function ScrollMarquee({ label, direction = 'right' }: ScrollMarqueeProps) {
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

  // Calculate transform based on direction
  // Base is -50% to center the duplicated content
  // Right: add offsetX (moves right as you scroll down)
  // Left: subtract offsetX (moves left as you scroll down)
  const transformValue = direction === 'right'
    ? `translateX(calc(-50% + ${offsetX}px))`
    : `translateX(calc(-50% - ${offsetX}px))`;

  return (
    <div
      className="relative flex w-full items-center overflow-hidden py-2.5 font-display"
      style={{ background: MARQUEE_BG }}
    >
      <div
        className="flex w-max shrink-0 items-center gap-12 whitespace-nowrap text-lg font-bold uppercase tracking-wide md:gap-14 md:text-xl"
        style={{
          transform: transformValue,
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
