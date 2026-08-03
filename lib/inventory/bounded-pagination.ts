/** Hard resource ceilings for browser-side account inventory aggregation. */
// Matches the backend's launch-safe OFFSET ceiling. Larger inventories must
// move to cursor pagination instead of deep OFFSET scans.
export const INVENTORY_MAX_ITEMS = 10_000;
export const INVENTORY_MAX_PAGES = 100;

export class InventoryPaginationError extends Error {
  constructor(
    public readonly code:
      | 'invalid-page'
      | 'invalid-total'
      | 'item-limit'
      | 'page-limit'
      | 'non-progress'
      | 'overlap',
  ) {
    super('Inventory pagination could not be completed safely.');
    this.name = 'InventoryPaginationError';
  }
}

type Page<T> = {
  items?: readonly T[] | null;
  total?: number | null;
};

type BoundedPageOptions<T> = {
  pageSize: number;
  fetchPage: (pageIndex: number, offset: number) => Promise<Page<T>>;
  itemKey: (item: T) => string | number;
  maxItems?: number;
  maxPages?: number;
};

function normalizedItemKey(key: string | number): string {
  if (
    (typeof key === 'number' && (!Number.isSafeInteger(key) || key <= 0)) ||
    (typeof key === 'string' && (key.length === 0 || key.length > 255))
  ) {
    throw new InventoryPaginationError('invalid-page');
  }
  return `${typeof key}:${key}`;
}

/**
 * Collect offset/page based responses without trusting an upstream `total`.
 *
 * A malformed or moving upstream fails closed instead of issuing unbounded
 * requests, retaining an unbounded array, or silently returning duplicates.
 */
export async function collectBoundedInventoryPages<T>({
  pageSize,
  fetchPage,
  itemKey,
  maxItems = INVENTORY_MAX_ITEMS,
  maxPages = INVENTORY_MAX_PAGES,
}: BoundedPageOptions<T>): Promise<T[]> {
  if (
    !Number.isSafeInteger(pageSize) ||
    pageSize <= 0 ||
    !Number.isSafeInteger(maxItems) ||
    maxItems <= 0 ||
    !Number.isSafeInteger(maxPages) ||
    maxPages <= 0
  ) {
    throw new InventoryPaginationError('invalid-page');
  }

  const items: T[] = [];
  const seenKeys = new Set<string>();
  const effectiveMaxPages = Math.min(maxPages, Math.ceil(maxItems / pageSize));

  for (let pageIndex = 0; pageIndex < effectiveMaxPages; pageIndex += 1) {
    const response = await fetchPage(pageIndex, items.length);
    if (!response || !Array.isArray(response.items) || response.items.length > pageSize) {
      throw new InventoryPaginationError('invalid-page');
    }

    const advertisedTotal = response.total;
    if (
      advertisedTotal != null &&
      (!Number.isSafeInteger(advertisedTotal) || advertisedTotal < 0)
    ) {
      throw new InventoryPaginationError('invalid-total');
    }
    if (advertisedTotal != null && advertisedTotal > maxItems) {
      throw new InventoryPaginationError('item-limit');
    }

    const pageItems = response.items;
    if (pageItems.length === 0) {
      if (advertisedTotal != null && advertisedTotal > items.length) {
        throw new InventoryPaginationError('non-progress');
      }
      return items;
    }

    if (items.length + pageItems.length > maxItems) {
      throw new InventoryPaginationError('item-limit');
    }

    const pageKeys = pageItems.map((item) => normalizedItemKey(itemKey(item)));
    for (const key of pageKeys) {
      if (seenKeys.has(key)) {
        throw new InventoryPaginationError('overlap');
      }
      seenKeys.add(key);
    }
    items.push(...pageItems);

    if (advertisedTotal != null && advertisedTotal < items.length) {
      throw new InventoryPaginationError('invalid-total');
    }

    const completeByTotal = advertisedTotal != null && items.length === advertisedTotal;
    const shortPage = pageItems.length < pageSize;
    if (completeByTotal || (shortPage && advertisedTotal == null)) {
      return items;
    }
    if (shortPage) {
      throw new InventoryPaginationError('non-progress');
    }
    if (items.length === maxItems) {
      throw new InventoryPaginationError('item-limit');
    }
  }

  throw new InventoryPaginationError('page-limit');
}
