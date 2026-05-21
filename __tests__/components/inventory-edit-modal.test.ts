import { describe, expect, it } from 'vitest';
import { parseInventoryPriceCents } from '@/components/feature/sync/InventoryEditModal';

describe('parseInventoryPriceCents', () => {
  it('parses euro values into cents', () => {
    expect(parseInventoryPriceCents('12.34')).toBe(1234);
    expect(parseInventoryPriceCents('12,34')).toBe(1234);
  });

  it('rejects empty, invalid, and negative prices', () => {
    expect(parseInventoryPriceCents('')).toBeNull();
    expect(parseInventoryPriceCents('not a price')).toBeNull();
    expect(parseInventoryPriceCents('-1')).toBeNull();
  });
});
