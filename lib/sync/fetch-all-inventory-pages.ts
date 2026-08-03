import { syncClient, type InventoryItemResponse } from '@/lib/api/sync-client';
import { collectBoundedInventoryPages } from '@/lib/inventory/bounded-pagination';

const PAGE_SIZE = 500;

/** Scarica tutte le pagine inventario Sync per un utente. */
export async function fetchAllInventoryPages(
  userId: string,
  accessToken: string
): Promise<InventoryItemResponse[]> {
  return collectBoundedInventoryPages({
    pageSize: PAGE_SIZE,
    fetchPage: (_pageIndex, offset) =>
      syncClient.getInventory(userId, accessToken, PAGE_SIZE, offset),
    itemKey: (item) => item.id,
  });
}
