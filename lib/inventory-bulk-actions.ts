import type { InventoryItemWithCatalog } from '@/lib/sync/inventory-types';

export type BulkPriceOperation = '+' | '-';

export interface BulkPriceUpdate {
  item: InventoryItemWithCatalog;
  price_cents: number;
}

export function calculateBulkPriceCents(
  currentCents: number | null | undefined,
  operation: BulkPriceOperation,
  percent: number
): number {
  const safeCurrentCents = Math.max(0, currentCents ?? 0);
  const safePercent = Math.min(99, Math.max(0, percent));
  const factor = operation === '+' ? 1 + safePercent / 100 : 1 - safePercent / 100;
  return Math.max(0, Math.round(safeCurrentCents * factor));
}

export function buildBulkPriceUpdates(
  items: InventoryItemWithCatalog[],
  selectedIds: Set<number>,
  operation: BulkPriceOperation,
  percent: number
): BulkPriceUpdate[] {
  return items
    .filter((item) => selectedIds.has(item.id))
    .map((item) => ({
      item,
      price_cents: calculateBulkPriceCents(item.price_cents, operation, percent),
    }));
}
