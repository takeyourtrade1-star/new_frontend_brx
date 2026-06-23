import { useQuery } from '@tanstack/react-query';
import type { AuctionUI } from '@/lib/auction/auction-adapter';
import { enrichAuctionsWithPublicUsers } from '@/lib/auction/public-user-enrichment';
import { productDetailKeys } from '@/lib/product-detail/product-detail-keys';

export function useEnrichedCardAuctions(baseAuctions: AuctionUI[]) {
  const auctionIds = baseAuctions.map((a) => a.id).sort();

  const query = useQuery({
    queryKey: productDetailKeys.enrichedAuctions(auctionIds),
    queryFn: () => enrichAuctionsWithPublicUsers(baseAuctions),
    enabled: baseAuctions.length > 0,
    staleTime: 30_000,
  });

  return query.data ?? [];
}
