import { useEffect, useState } from 'react';
import type { AuctionUI, BidRowUI } from '@/lib/auction/auction-adapter';
import {
  enrichAuctionsWithPublicUsers,
  enrichBidRowsWithPublicUsers,
} from '@/lib/auction/public-user-enrichment';

type EnrichedState<T> = {
  source: T;
  value: T;
};

/**
 * Risolve i nomi venditore pubblici per una lista di aste.
 * Incapsula il pattern (prima duplicato in 7 file): init `[]`, guard `cancelled`,
 * nessuno svuotamento durante l'await, svuota solo quando `base` è vuoto.
 */
export function useEnrichedAuctions(base: AuctionUI[]): AuctionUI[] {
  const [enriched, setEnriched] = useState<EnrichedState<AuctionUI[]> | null>(null);
  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      if (base.length === 0) {
        setEnriched({ source: base, value: [] });
        return;
      }
      const next = await enrichAuctionsWithPublicUsers(base);
      if (!cancelled) setEnriched({ source: base, value: next });
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [base]);
  return enriched?.source === base ? enriched.value : base;
}

/** Variante per una singola asta (init `null`, fallback `resolved ?? base`). */
export function useEnrichedAuction(base: AuctionUI | null): AuctionUI | null {
  const [enriched, setEnriched] = useState<EnrichedState<AuctionUI> | null>(null);
  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      if (!base) {
        setEnriched(null);
        return;
      }
      const [resolved] = await enrichAuctionsWithPublicUsers([base]);
      if (!cancelled) setEnriched({ source: base, value: resolved ?? base });
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [base]);
  return base && enriched?.source === base ? enriched.value : base;
}

/** Risolve i nomi pubblici per le righe di offerta. */
export function useEnrichedBidRows(base: BidRowUI[]): BidRowUI[] {
  const [enriched, setEnriched] = useState<EnrichedState<BidRowUI[]> | null>(null);
  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      if (base.length === 0) {
        setEnriched({ source: base, value: [] });
        return;
      }
      const next = await enrichBidRowsWithPublicUsers(base);
      if (!cancelled) setEnriched({ source: base, value: next });
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [base]);
  return enriched?.source === base ? enriched.value : base;
}
