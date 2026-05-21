'use client';

import { useEffect, useState } from 'react';

const DEFAULT_HEADER_OFFSET = 80;
const STICKY_GAP = 16;

/**
 * Misura l'altezza dell'header fixed (ResizeObserver) per sticky sidebar / nav account.
 */
export function useHeaderStickyOffset(gap = STICKY_GAP) {
  const [stickyTop, setStickyTop] = useState(DEFAULT_HEADER_OFFSET);

  useEffect(() => {
    const header = document.querySelector('header');
    if (!header) return;

    const measure = () => {
      const height = header.getBoundingClientRect().height;
      setStickyTop(height > 0 ? height : DEFAULT_HEADER_OFFSET);
    };

    measure();
    const ro = new ResizeObserver(() => measure());
    ro.observe(header);
    window.addEventListener('resize', measure);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', measure);
    };
  }, []);

  const stickyTopWithGap = stickyTop + gap;

  return { stickyTop, stickyTopWithGap, gap };
}
