'use client';

import { useEffect, useRef, useState } from 'react';

/** Bounce badge when cart item count increases. */
export function useCartBadgeBounce(cartCount: number) {
  const [badgeBounce, setBadgeBounce] = useState(false);
  const prevCountRef = useRef(0);

  useEffect(() => {
    if (cartCount > prevCountRef.current && cartCount > 0) {
      setBadgeBounce(true);
      const timer = setTimeout(() => setBadgeBounce(false), 400);
      prevCountRef.current = cartCount;
      return () => clearTimeout(timer);
    }
    prevCountRef.current = cartCount;
  }, [cartCount]);

  return badgeBounce;
}
