import { describe, expect, it } from 'vitest';
import { buildBulkPriceUpdates, calculateBulkPriceCents } from '@/lib/inventory-bulk-actions';
import type { InventoryItemWithCatalog } from '@/lib/sync/inventory-types';

function item(id: number, priceCents: number): InventoryItemWithCatalog {
  return {
    id,
    blueprint_id: id + 1000,
    quantity: 1,
    price_cents: priceCents,
    updated_at: '2026-05-21T00:00:00.000Z',
  };
}

describe('inventory bulk actions', () => {
  it('calculates percentage price updates in cents', () => {
    expect(calculateBulkPriceCents(1250, '+', 10)).toBe(1375);
    expect(calculateBulkPriceCents(1250, '-', 10)).toBe(1125);
  });

  it('only builds updates for selected inventory rows', () => {
    const updates = buildBulkPriceUpdates([item(1, 1000), item(2, 2000)], new Set([2]), '+', 25);

    expect(updates).toEqual([
      {
        item: item(2, 2000),
        price_cents: 2500,
      },
    ]);
  });

  it('does not produce negative prices', () => {
    expect(calculateBulkPriceCents(500, '-', 150)).toBe(5);
  });
});
