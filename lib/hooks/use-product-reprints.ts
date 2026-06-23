import { useQuery } from '@tanstack/react-query';
import type { CardDocument } from '@/lib/product-detail';
import { mapReprintHit } from '@/lib/product-detail/map-reprint-hit';
import { productDetailKeys } from '@/lib/product-detail/product-detail-keys';
import type { ReprintCard } from '@/lib/product-detail/product-detail-view-types';
import { shouldFetchReprints, type ReprintSearchHit } from '@/lib/reprints-search';

async function fetchProductReprints(card: CardDocument): Promise<ReprintCard[]> {
  const res = await fetch(`/api/reprints?card_id=${encodeURIComponent(card.id)}`, {
    cache: 'no-store',
  });
  if (!res.ok) {
    throw new Error('reprints_fetch_failed');
  }
  const data = (await res.json()) as { hits?: ReprintSearchHit[]; error?: string };
  if (data.error) {
    throw new Error(data.error);
  }
  const hits = Array.isArray(data.hits) ? data.hits : [];
  const mapped = hits
    .map((hit) => mapReprintHit(hit, card.game_slug))
    .filter((item): item is ReprintCard => item != null);
  return Array.from(new Map(mapped.map((item) => [item.id, item])).values());
}

export function useProductReprints(card: CardDocument | undefined) {
  const enabled = Boolean(card && shouldFetchReprints(card));
  const query = useQuery({
    queryKey: productDetailKeys.reprints(card),
    queryFn: () => fetchProductReprints(card!),
    enabled,
    staleTime: 60_000,
    retry: false,
  });

  return {
    reprints: query.data ?? [],
    reprintsLoading: query.isLoading,
    reprintsDegraded: query.isError,
  };
}
