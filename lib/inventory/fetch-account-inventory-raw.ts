import { syncClient, type InventoryItemResponse } from '@/lib/api/sync-client';
import { getMyListings, type ListingResponse } from '@/lib/api/marketplace-client';
import { composeAccountInventory } from '@/lib/inventory/compose-account-inventory';
import {
  collectBoundedInventoryPages,
  InventoryPaginationError,
} from '@/lib/inventory/bounded-pagination';
import { INVENTORY_API_CHUNK } from '@/lib/inventory/fetch-catalog-batched';
import type { InventoryItemWithCatalog } from '@/lib/sync/inventory-types';

export type AccountInventoryRawResult = {
  items: InventoryItemWithCatalog[];
  total: number;
};

/** Sync inventario paginato + listing marketplace attive (fase 1, senza catalogo Meili). */
export async function fetchAccountInventoryRaw(
  userId: string,
  accessToken: string
): Promise<AccountInventoryRawResult> {
  const allItems = await collectBoundedInventoryPages<InventoryItemResponse>({
    pageSize: INVENTORY_API_CHUNK,
    fetchPage: (_pageIndex, offset) =>
      syncClient.getInventory(userId, accessToken, INVENTORY_API_CHUNK, offset),
    itemKey: (item) => item.id,
  });

  let marketplaceListings: ListingResponse[] = [];
  try {
    const pageSize = 200;
    marketplaceListings = await collectBoundedInventoryPages<ListingResponse>({
      pageSize,
      fetchPage: async (pageIndex) => {
        const requestedPage = pageIndex + 1;
        const response = await getMyListings({
          page: requestedPage,
          page_size: pageSize,
          status_filter: 'active',
        });
        if (response.page !== requestedPage) {
          throw new InventoryPaginationError('non-progress');
        }
        return response;
      },
      itemKey: (item) => item.id,
    });
  } catch (error) {
    if (error instanceof InventoryPaginationError) throw error;
    /* marketplace opzionale */
  }

  const merged = composeAccountInventory(allItems, marketplaceListings);
  return { items: merged, total: merged.length };
}
