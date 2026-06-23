import { syncClient, type InventoryItemResponse } from '@/lib/api/sync-client';
import { getMyListings } from '@/lib/api/marketplace-client';
import { mapListingResponseToInventoryItem } from '@/lib/marketplace/listing-map';
import type { InventoryItemWithCatalog } from '@/lib/sync/inventory-types';
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
    allItems.push(
      ...items.map((item) => ({ ...item, listing_source: 'sync' as const }))
    );
    offset += items.length;
    if (items.length < INVENTORY_API_CHUNK || offset >= totalFromApi) break;
  } while (true);

  let marketplaceRows: InventoryItemWithCatalog[] = [];
  try {
    const mkt = await getMyListings({ page: 1, page_size: 200, status_filter: 'active' });
    marketplaceRows = (mkt.items ?? []).map(mapListingResponseToInventoryItem);
  } catch {
    /* marketplace opzionale */
  }

  const merged = [...allItems, ...marketplaceRows];
  return { items: merged, total: merged.length };
}
