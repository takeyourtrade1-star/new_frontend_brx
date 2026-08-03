import { useQuery, useQueryClient } from '@tanstack/react-query';
import { syncClient, type InventoryItemResponse } from '@/lib/api/sync-client';
import { fetchCardsByBlueprintIds } from '@/lib/meilisearch-cards-by-ids';
import type { CardCatalogHit } from '@/lib/meilisearch-cards-by-ids';
import { productDetailKeys } from '@/lib/product-detail/product-detail-keys';
import { collectBoundedInventoryPages } from '@/lib/inventory/bounded-pagination';
import type { InventoryItemWithCatalog } from '@/lib/sync/inventory-types';

async function fetchAuctionBlueprintInventory(
  userId: string,
  accessToken: string,
  blueprintId: number
): Promise<InventoryItemWithCatalog[]> {
  const pageSize = 500;
  const allItems = await collectBoundedInventoryPages<InventoryItemResponse>({
    pageSize,
    fetchPage: (_pageIndex, offset) =>
      syncClient.getInventory(userId, accessToken, pageSize, offset),
    itemKey: (item) => item.id,
  });

  const filtered = allItems.filter((i) => i.blueprint_id === blueprintId);
  let blueprintToCard: Record<number, CardCatalogHit> = {};
  if (filtered.length > 0) {
    blueprintToCard = { ...(await fetchCardsByBlueprintIds([blueprintId])) };
  }

  return filtered.map((item) => ({
    ...item,
    card: blueprintToCard[item.blueprint_id],
  }));
}

export function useAuctionBlueprintInventory(
  userId: string | undefined,
  accessToken: string | null,
  blueprintId: number | null
) {
  const queryClient = useQueryClient();
  const enabled = Boolean(userId && accessToken && blueprintId != null);

  const query = useQuery({
    queryKey:
      userId && blueprintId != null
        ? productDetailKeys.auctionInventory(userId, blueprintId)
        : ['product-detail', 'auction-inventory', 'none'],
    queryFn: () => fetchAuctionBlueprintInventory(userId!, accessToken!, blueprintId!),
    enabled,
    staleTime: 0,
  });

  const invalidateAuctionInventory = async () => {
    if (!userId || blueprintId == null) return;
    await queryClient.invalidateQueries({
      queryKey: productDetailKeys.auctionInventory(userId, blueprintId),
    });
  };

  return {
    auctionInventoryItems: query.data ?? [],
    auctionInventoryLoading: query.isLoading,
    invalidateAuctionInventory,
  };
}
