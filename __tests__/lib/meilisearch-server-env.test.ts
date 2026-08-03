// @vitest-environment node

import { describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

import { getMeilisearchServerConfig } from '@/lib/meilisearch-server-env';

describe('Meilisearch server configuration', () => {
  it('fails closed on a missing or invalid production index UID', () => {
    expect(getMeilisearchServerConfig({ NODE_ENV: 'production' }).index).toBe('');

    for (const invalid of [
      '../cards',
      '/cards',
      'cards/other',
      ' cards',
      'cards?tenant=other',
      'a'.repeat(129),
    ]) {
      expect(getMeilisearchServerConfig({
        NODE_ENV: 'production',
        MEILISEARCH_INDEX: invalid,
      }).index).toBe('');
    }
  });

  it('prefers the server-only UID and accepts the bounded legacy public UID', () => {
    expect(getMeilisearchServerConfig({
      NODE_ENV: 'production',
      NEXT_PUBLIC_MEILISEARCH_INDEX: 'browser-index',
      MEILISEARCH_INDEX: 'cards-prod_2026',
    }).index).toBe('cards-prod_2026');

    expect(getMeilisearchServerConfig({
      NODE_ENV: 'production',
      NEXT_PUBLIC_MEILISEARCH_INDEX: 'browser-index',
    }).index).toBe('browser-index');

    expect(getMeilisearchServerConfig({
      NODE_ENV: 'production',
      NEXT_PUBLIC_MEILISEARCH_INDEX: '../other-index',
    }).index).toBe('');
  });

  it('uses only the explicit public search-key compatibility alias', () => {
    expect(getMeilisearchServerConfig({
      NODE_ENV: 'production',
      NEXT_PUBLIC_MEILISEARCH_URL: 'https://search.example.test',
      NEXT_PUBLIC_MEILISEARCH_API_KEY: 'legacy-search-only-key',
      NEXT_PUBLIC_MEILISEARCH_INDEX: 'cards',
      MEILISEARCH_API_KEY: 'generic-key-must-not-win',
      MEILI_API_KEY: 'generic-key-must-not-win-either',
    })).toEqual({
      url: 'https://search.example.test',
      apiKey: 'legacy-search-only-key',
      index: 'cards',
    });
  });
});
