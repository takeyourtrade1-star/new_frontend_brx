'use client';

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import { RarityLegendModal } from '@/components/ui/RarityLegendModal';

type RarityLegendContextValue = {
  openLegend: () => void;
};

const RarityLegendContext = createContext<RarityLegendContextValue | null>(null);

export function RarityLegendProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const openLegend = useCallback(() => setOpen(true), []);

  const value = useMemo(() => ({ openLegend }), [openLegend]);

  return (
    <RarityLegendContext.Provider value={value}>
      {children}
      <RarityLegendModal open={open} onClose={() => setOpen(false)} />
    </RarityLegendContext.Provider>
  );
}

export function useRarityLegend(): RarityLegendContextValue {
  const ctx = useContext(RarityLegendContext);
  if (!ctx) {
    throw new Error('useRarityLegend must be used within RarityLegendProvider');
  }
  return ctx;
}

/** Versione opzionale: se fuori provider, apre comunque la legenda locale. */
export function useRarityLegendOptional(): RarityLegendContextValue | null {
  return useContext(RarityLegendContext);
}
