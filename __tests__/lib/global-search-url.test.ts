import { describe, expect, it } from 'vitest';
import { buildSearchUrl, searchResultsPath } from '@/lib/search/global-search-url';

describe('global search result URLs', () => {
  it('adds exact_mode only when explicitly requested for a non-empty query', () => {
    expect(buildSearchUrl('Black Lotus', 'mtg', 'singles', true)).toBe(
      '/search?q=Black+Lotus&game=mtg&category_key=singles&exact_mode=true'
    );
    expect(buildSearchUrl('Black Lotus', 'mtg', 'singles')).not.toContain('exact_mode');
    expect(buildSearchUrl('   ', 'mtg', 'singles', true)).not.toContain('exact_mode');
  });

  it('preserves exact mode together with the guided sell flow', () => {
    expect(searchResultsPath('Black Lotus', 'mtg', 'singles', true, true)).toBe(
      '/search?q=Black+Lotus&game=mtg&category_key=singles&exact_mode=true&flow=sell'
    );
  });
});
