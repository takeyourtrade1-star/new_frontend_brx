import { syncClient, type InventoryItemResponse } from '@/lib/api/sync-client';

const PAGE_SIZE = 500;

/** Scarica tutte le pagine inventario Sync per un utente. */
export async function fetchAllInventoryPages(
  userId: string,
  accessToken: string
): Promise<InventoryItemResponse[]> {
  const allItems: InventoryItemResponse[] = [];
  let offset = 0;
  let totalFromApi = 0;
  do {
    const res = await syncClient.getInventory(userId, accessToken, PAGE_SIZE, offset);
    const items = res.items ?? [];
    totalFromApi = res.total ?? allItems.length + items.length;
    allItems.push(...items);
    offset += items.length;
    if (items.length < PAGE_SIZE || offset >= totalFromApi) break;
  } while (true);
  return allItems;
}
