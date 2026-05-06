import { describe, expect, it } from 'vitest';
import { parseInventoryPriceCents } from '@/components/feature/sync/InventoryEditModal';

describe('parseInventoryPriceCents', () => {
  it('keeps comma decimal cents instead of truncating them', () => {
    expect(parseInventoryPriceCents('10,50')).toBe(1050);
  });

  it('parses dot decimals and whole euro values', () => {
    expect(parseInventoryPriceCents('10.5')).toBe(1050);
    expect(parseInventoryPriceCents('10')).toBe(1000);
  });

  it('rejects malformed values instead of converting them to zero', () => {
    expect(parseInventoryPriceCents('abc')).toBeNull();
    expect(parseInventoryPriceCents('10,50abc')).toBeNull();
    expect(parseInventoryPriceCents('')).toBeNull();
  });
});
