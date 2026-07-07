'use client';

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { calibrateServerClock, serverNowMs } from '@/lib/server-clock';

const MarketplaceNowContext = createContext<number>(Date.now());

/** PERF: isolates 1s marketplace timer from ProductDetailView / table body re-renders. */
export function MarketplaceNowProvider({ children }: { children: ReactNode }) {
  const [nowMs, setNowMs] = useState(() => serverNowMs());
  useEffect(() => {
    calibrateServerClock();
    const id = setInterval(() => setNowMs(serverNowMs()), 1000);
    return () => clearInterval(id);
  }, []);
  return <MarketplaceNowContext.Provider value={nowMs}>{children}</MarketplaceNowContext.Provider>;
}

export function useMarketplaceNowMs(): number {
  return useContext(MarketplaceNowContext);
}
