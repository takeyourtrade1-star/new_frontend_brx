import type { InventoryItemResponse } from '@/lib/api/sync-client';

type InventoryPage = {
  items?: InventoryItemResponse[] | null;
  total?: number | null;
};

export type InventoryPageFetcher = (limit: number, offset: number) => Promise<InventoryPage>;

const DEFAULT_INVENTORY_PAGE_SIZE = 500;

export async function collectInventoryPages(
  fetchPage: InventoryPageFetcher,
  pageSize = DEFAULT_INVENTORY_PAGE_SIZE
): Promise<{ items: InventoryItemResponse[]; total: number }> {
  const allItems: InventoryItemResponse[] = [];
  let offset = 0;
  let reportedTotal: number | undefined;

  do {
    const res = await fetchPage(pageSize, offset);
    const items = res.items ?? [];
    if (typeof res.total === 'number' && Number.isFinite(res.total)) {
      reportedTotal = res.total;
    }

    allItems.push(...items);
    offset += items.length;

    if (items.length < pageSize) break;
    if (reportedTotal !== undefined && offset >= reportedTotal) break;
  } while (true);

  return {
    items: allItems,
    total: reportedTotal ?? allItems.length,
  };
}

