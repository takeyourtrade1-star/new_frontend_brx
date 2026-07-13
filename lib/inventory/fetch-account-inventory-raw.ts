import { syncClient, type InventoryItemResponse } from '@/lib/api/sync-client';
import { getMyListings, type ListingResponse } from '@/lib/api/marketplace-client';
import { composeAccountInventory } from '@/lib/inventory/compose-account-inventory';
import { INVENTORY_API_CHUNK } from '@/lib/inventory/fetch-catalog-batched';

export type AccountInventoryRawResult = {
  items: InventoryItemResponse[];
  total: number;
};

/** Sync inventario paginato + listing marketplace attive (fase 1, senza catalogo Meili). */
export async function fetchAccountInventoryRaw(
  userId: string,
  accessToken: string
): Promise<AccountInventoryRawResult> {
  const allItems: InventoryItemResponse[] = [];
  let offset = 0;
  let totalFromApi = 0;

  do {
    const res = await syncClient.getInventory(userId, accessToken, INVENTORY_API_CHUNK, offset);
    const items = res.items ?? [];
    totalFromApi = res.total ?? allItems.length + items.length;
    allItems.push(...items);
    offset += items.length;
    if (items.length < INVENTORY_API_CHUNK || offset >= totalFromApi) break;
  } while (true);

  let marketplaceListings: ListingResponse[] = [];
  try {
    const mkt = await getMyListings({ page: 1, page_size: 200, status_filter: 'active' });
    marketplaceListings = mkt.items ?? [];
  } catch {
    /* marketplace opzionale */
  }

  const merged = composeAccountInventory(allItems, marketplaceListings);
  return { items: merged, total: merged.length };
}
