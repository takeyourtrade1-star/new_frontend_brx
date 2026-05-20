import { describe, expect, it } from 'vitest';

import { getProductCategoryIds } from '@/lib/product-categories';

describe('getProductCategoryIds', () => {
  it('maps category pages to game-specific search category IDs', () => {
    expect(getProductCategoryIds('mtg', 'singles')).toEqual([1, 2, 3]);
    expect(getProductCategoryIds('pokemon', 'boosters')).toEqual([66, 190]);
    expect(getProductCategoryIds('one-piece', 'booster-boxes')).toEqual([193]);
  });

  it('aggregates sealed category pages without duplicates', () => {
    expect(getProductCategoryIds('mtg', 'sigillati')).toEqual([
      5,
      4,
      7,
      17,
      6,
      10,
      13,
      23,
      24,
      271,
    ]);
  });

  it('returns no IDs for categories without catalog search filters', () => {
    expect(getProductCategoryIds('mtg', 'boutique')).toEqual([]);
    expect(getProductCategoryIds(null, 'singles')).toEqual([]);
  });
});
