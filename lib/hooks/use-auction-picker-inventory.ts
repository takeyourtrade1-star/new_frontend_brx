'use client';

import { useQuery } from '@tanstack/react-query';
import type { InventoryItemResponse } from '@/lib/api/sync-client';
import { fetchCardsByBlueprintIds, type CardCatalogHit } from '@/lib/meilisearch-cards-by-ids';
import { auctionCreateKeys } from '@/lib/auction/auction-create-keys';
import { fetchAllInventoryPages } from '@/lib/sync/fetch-all-inventory-pages';

export type InventoryWithCard = InventoryItemResponse & { card?: CardCatalogHit | null };

/** Solo singole (carte), come in OggettiContent / AuctionCreateCardPicker. */
export function isSingoleInventoryItem(item: InventoryWithCard): boolean {
  const id = item.card?.id;
  const gameSlug = item.card?.game_slug;
  if (typeof id === 'string' && id.startsWith('sealed_')) return false;
  if (gameSlug === 'sealed' || gameSlug === 'sealed_products') return false;
  return true;
}

async function fetchPickerInventory(
  userId: string,
  accessToken: string
): Promise<InventoryWithCard[]> {
  const allItems = await fetchAllInventoryPages(userId, accessToken);
  const blueprintIds = [...new Set(allItems.map((i) => i.blueprint_id).filter(Boolean))] as number[];
  let blueprintToCard: Record<number, CardCatalogHit> = {};
  if (blueprintIds.length > 0) {
    blueprintToCard = await fetchCardsByBlueprintIds(blueprintIds);
  }
  const merged: InventoryWithCard[] = allItems.map((item) => ({
    ...item,
    card: blueprintToCard[item.blueprint_id],
  }));
  return merged.filter(isSingoleInventoryItem);
}

export function useAuctionPickerInventory(
  userId: string | undefined,
  accessToken: string | null,
  enabled: boolean
) {
  const shouldFetch = enabled && Boolean(userId && accessToken);

  const query = useQuery({
    queryKey: userId ? auctionCreateKeys.pickerInventory(userId) : ['auction-create', 'picker-inventory', 'none'],
    queryFn: () => fetchPickerInventory(userId!, accessToken!),
    enabled: shouldFetch,
    staleTime: 60_000,
  });

  return {
    inventoryItems: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error instanceof Error ? query.error.message : query.error ? String(query.error) : null,
    refetch: query.refetch,
  };
}
