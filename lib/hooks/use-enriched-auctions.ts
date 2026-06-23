import { useEffect, useState } from 'react';
import type { AuctionUI, BidRowUI } from '@/lib/auction/auction-adapter';
import {
  enrichAuctionsWithPublicUsers,
  enrichBidRowsWithPublicUsers,
} from '@/lib/auction/public-user-enrichment';

/**
 * Risolve i nomi venditore pubblici per una lista di aste.
 * Incapsula il pattern (prima duplicato in 7 file): init `[]`, guard `cancelled`,
 * nessuno svuotamento durante l'await, svuota solo quando `base` è vuoto.
 */
export function useEnrichedAuctions(base: AuctionUI[]): AuctionUI[] {
  const [enriched, setEnriched] = useState<AuctionUI[]>([]);
  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      if (base.length === 0) {
        setEnriched([]);
        return;
      }
      const next = await enrichAuctionsWithPublicUsers(base);
      if (!cancelled) setEnriched(next);
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [base]);
  return enriched;
}

/** Variante per una singola asta (init `null`, fallback `resolved ?? base`). */
export function useEnrichedAuction(base: AuctionUI | null): AuctionUI | null {
  const [enriched, setEnriched] = useState<AuctionUI | null>(null);
  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      if (!base) {
        setEnriched(null);
        return;
      }
      const [resolved] = await enrichAuctionsWithPublicUsers([base]);
      if (!cancelled) setEnriched(resolved ?? base);
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [base]);
  return enriched;
}

/** Risolve i nomi pubblici per le righe di offerta. */
export function useEnrichedBidRows(base: BidRowUI[]): BidRowUI[] {
  const [enriched, setEnriched] = useState<BidRowUI[]>([]);
  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      if (base.length === 0) {
        setEnriched([]);
        return;
      }
      const next = await enrichBidRowsWithPublicUsers(base);
      if (!cancelled) setEnriched(next);
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [base]);
  return enriched;
}
