import { syncClient } from '@/lib/api/sync-client';
import { collectInventoryPages } from '@/lib/sync/inventory-pagination';
import type { InventoryItemResponse } from '@/lib/api/sync-client';

export function fetchAllInventoryItems(
  userId: string,
  accessToken: string,
  pageSize = 500
): Promise<{ items: InventoryItemResponse[]; total: number }> {
  return collectInventoryPages(
    (limit, offset) => syncClient.getInventory(userId, accessToken, limit, offset),
    pageSize
  );
}
