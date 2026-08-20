import { useMemo } from 'react';
import type { CardDocument } from '@/lib/product-detail';
import { useAuctionList } from '@/lib/hooks/use-auctions';
import { apiToAuctionUI } from '@/lib/auction/auction-adapter';
import { useEnrichedCardAuctions } from '@/lib/hooks/use-enriched-card-auctions';

function retryTransientAuctionListError(failureCount: number, error: Error): boolean {
  const status = 'status' in error
    ? (error as Error & { status?: number }).status
    : undefined;

  // La lista aste arricchisce quella venditori in background: un errore client
  // non va ritentato, mentre per rete/5xx basta un solo secondo tentativo.
  return failureCount < 1 && (status == null || status >= 500);
}

/**
 * Piano 1.3 — seam "aste correlate" estratto da ProductDetailView.
 * Incapsula la query delle aste attive per nome carta e l'arricchimento
 * con i profili pubblici dei venditori. Comportamento identico all'inline
 * precedente: stessa query, stesso adapter, stesso hook di enrichment.
 */
export function useProductAuctions(card: CardDocument | undefined) {
  const cardNameForAuctions = card?.name?.trim() ?? '';

  const cardAuctionsQuery = useAuctionList(
    { q: cardNameForAuctions || undefined, status: 'ACTIVE', limit: 20 },
    {
      enabled: cardNameForAuctions.length > 0,
      retry: retryTransientAuctionListError,
    }
  );

  const baseCardAuctions = useMemo(
    () => (cardAuctionsQuery.data?.data ?? []).map((a) => apiToAuctionUI(a)),
    [cardAuctionsQuery.data]
  );

  const enrichedCardAuctions = useEnrichedCardAuctions(baseCardAuctions);

  return {
    enrichedCardAuctions,
  };
}
