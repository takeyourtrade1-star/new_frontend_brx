// @vitest-environment node

import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

import { getMeilisearchServerConfig } from '@/lib/meilisearch-server-env';

afterEach(() => vi.unstubAllEnvs());

describe('Meilisearch server configuration', () => {
  it('fails closed on a missing or invalid production index UID', () => {
    vi.stubEnv('NODE_ENV', 'production');
    for (const name of [
      'MEILISEARCH_INDEX',
      'MEILISEARCH_INDEX_NAME',
      'MEILI_INDEX',
      'NEXT_PUBLIC_MEILISEARCH_INDEX',
    ]) {
      vi.stubEnv(name, '');
    }
    expect(getMeilisearchServerConfig().index).toBe('');

    for (const invalid of [
      '../cards',
      '/cards',
      'cards/other',
      ' cards',
      'cards?tenant=other',
      'a'.repeat(129),
    ]) {
      vi.stubEnv('MEILISEARCH_INDEX', invalid);
      expect(getMeilisearchServerConfig().index).toBe('');
    }
  });

  it('accepts one bounded UID and never trusts a browser fallback', () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('NEXT_PUBLIC_MEILISEARCH_INDEX', 'browser-index');
    vi.stubEnv('MEILISEARCH_INDEX', 'cards-prod_2026');
    expect(getMeilisearchServerConfig().index).toBe('cards-prod_2026');

    vi.stubEnv('MEILISEARCH_INDEX', '');
    expect(getMeilisearchServerConfig().index).toBe('');
  });
});
