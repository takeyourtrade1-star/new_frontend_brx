'use client';

import { useEffect, useRef } from 'react';

/** Oro in gradiente verso il basso */
const MARQUEE_BG = 'linear-gradient(180deg, #F3C76A 0%, #e5b85c 50%, #d4a84b 100%)';
const SCROLL_TO_OFFSET_FACTOR = 0.18;

interface ScrollMarqueeProps {
  label: string;
  direction?: 'left' | 'right';
}

export function ScrollMarquee({ label, direction = 'right' }: ScrollMarqueeProps) {
  const innerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = innerRef.current;
    if (!el) return;

    let rafId = 0;
    let rafScheduled = false;

    const applyTransform = () => {
      rafScheduled = false;
      const node = innerRef.current;
      if (!node) return;
      const scrollY = typeof window !== 'undefined' ? window.scrollY : 0;
      const offsetX = scrollY * SCROLL_TO_OFFSET_FACTOR;
      // Preserve original parallax direction:
      //   right → translateX(calc(-50% + offsetX))
      //   left  → translateX(calc(-50% - offsetX))
      // Use translate3d to promote to its own GPU layer.
      node.style.transform =
        direction === 'right'
          ? `translate3d(calc(-50% + ${offsetX}px), 0, 0)`
          : `translate3d(calc(-50% - ${offsetX}px), 0, 0)`;
    };

    const handleScroll = () => {
      if (rafScheduled) return;
      rafScheduled = true;
      rafId = requestAnimationFrame(applyTransform);
    };

    applyTransform();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [direction]);

  return (
    <div
      className="relative flex w-full items-center overflow-hidden py-2.5 font-display"
      style={{ background: MARQUEE_BG }}
    >
      <div
        ref={innerRef}
        className="flex w-max shrink-0 items-center gap-12 whitespace-nowrap text-lg font-bold uppercase tracking-wide md:gap-14 md:text-xl"
        style={{
          transform: 'translate3d(-50%, 0, 0)',
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
