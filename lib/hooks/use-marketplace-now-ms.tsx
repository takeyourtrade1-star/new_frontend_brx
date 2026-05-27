'use client';

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

const MarketplaceNowContext = createContext<number>(Date.now());

/** PERF: isolates 1s marketplace timer from ProductDetailView / table body re-renders. */
export function MarketplaceNowProvider({ children }: { children: ReactNode }) {
  const [nowMs, setNowMs] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNowMs(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  return <MarketplaceNowContext.Provider value={nowMs}>{children}</MarketplaceNowContext.Provider>;
}

export function useMarketplaceNowMs(): number {
  return useContext(MarketplaceNowContext);
}
