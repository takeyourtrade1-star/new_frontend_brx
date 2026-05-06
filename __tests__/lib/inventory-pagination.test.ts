import { describe, expect, it } from 'vitest';
import { collectInventoryPages } from '@/lib/sync/inventory-pagination';
import type { InventoryItemResponse } from '@/lib/api/sync-client';

function item(id: number): InventoryItemResponse {
  return {
    id,
    blueprint_id: id,
    quantity: 1,
    price_cents: 100,
    updated_at: '2026-05-06T00:00:00.000Z',
  };
}

describe('collectInventoryPages', () => {
  it('continues past a full first page when total is omitted', async () => {
    const calls: Array<{ limit: number; offset: number }> = [];
    const result = await collectInventoryPages(async (limit, offset) => {
      calls.push({ limit, offset });
      if (offset === 0) return { items: [item(1), item(2)] };
      return { items: [item(3)] };
    }, 2);

    expect(result.items.map((i) => i.id)).toEqual([1, 2, 3]);
    expect(result.total).toBe(3);
    expect(calls).toEqual([
      { limit: 2, offset: 0 },
      { limit: 2, offset: 2 },
    ]);
  });

  it('stops at the reported total when present', async () => {
    const calls: number[] = [];
    const result = await collectInventoryPages(async (_limit, offset) => {
      calls.push(offset);
      return {
        items: offset === 0 ? [item(1), item(2)] : [item(3), item(4)],
        total: 4,
      };
    }, 2);

    expect(result.items.map((i) => i.id)).toEqual([1, 2, 3, 4]);
    expect(result.total).toBe(4);
    expect(calls).toEqual([0, 2]);
  });
});
