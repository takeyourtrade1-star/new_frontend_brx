// @vitest-environment node

import { describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

import {
  getAuctionApiUrlEnv,
  getAuthApiUrlEnv,
  getAuthInternalIdentityEnv,
  getMarketplaceApiUrlEnv,
  getMeilisearchSearchApiKeyEnv,
  getMeilisearchUrlEnv,
  getSyncApiUrlEnv,
} from '@/lib/server-runtime-env';

describe('legacy Amplify runtime environment compatibility', () => {
  it('prefers every server-only service URL over its public alias', () => {
    const env = {
      AUTH_API_URL: 'https://auth.internal.test',
      NEXT_PUBLIC_AUTH_API_URL: 'https://auth.legacy.test',
      AUCTION_API_URL: 'https://auction.internal.test',
      NEXT_PUBLIC_AUCTION_API_URL: 'https://auction.legacy.test',
      SYNC_API_URL: 'https://sync.internal.test',
      NEXT_PUBLIC_SYNC_API_URL: 'https://sync.legacy.test',
      MARKETPLACE_API_URL: 'https://marketplace.internal.test',
      NEXT_PUBLIC_MARKETPLACE_API_URL: 'https://marketplace.legacy.test',
    };

    expect(getAuthApiUrlEnv(env)).toBe('https://auth.internal.test');
    expect(getAuctionApiUrlEnv(env)).toBe('https://auction.internal.test');
    expect(getSyncApiUrlEnv(env)).toBe('https://sync.internal.test');
    expect(getMarketplaceApiUrlEnv(env)).toBe('https://marketplace.internal.test');
  });

  it('falls back to the existing Amplify public service URL names', () => {
    const env = {
      NEXT_PUBLIC_AUTH_API_URL: 'https://auth.legacy.test/',
      NEXT_PUBLIC_AUCTION_API_URL: 'https://auction.legacy.test/',
      NEXT_PUBLIC_SYNC_API_URL: 'https://sync.legacy.test/',
      NEXT_PUBLIC_MARKETPLACE_API_URL: 'https://marketplace.legacy.test/',
    };

    expect(getAuthApiUrlEnv(env)).toBe('https://auth.legacy.test/');
    expect(getAuctionApiUrlEnv(env)).toBe('https://auction.legacy.test/');
    expect(getSyncApiUrlEnv(env)).toBe('https://sync.legacy.test/');
    expect(getMarketplaceApiUrlEnv(env)).toBe('https://marketplace.legacy.test/');
  });

  it('prefers server-only Meilisearch config and supports the old search-only names', () => {
    const preferred = {
      MEILISEARCH_URL: 'https://search.internal.test',
      NEXT_PUBLIC_MEILISEARCH_URL: 'https://search.legacy.test',
      MEILISEARCH_SEARCH_API_KEY: 'server-search-key',
      NEXT_PUBLIC_MEILISEARCH_API_KEY: 'legacy-search-key',
    };

    expect(getMeilisearchUrlEnv(preferred)).toBe('https://search.internal.test');
    expect(getMeilisearchSearchApiKeyEnv(preferred)).toBe('server-search-key');

    const legacy = {
      NEXT_PUBLIC_MEILISEARCH_URL: 'https://search.legacy.test',
      NEXT_PUBLIC_MEILISEARCH_API_KEY: 'legacy-search-key',
    };
    expect(getMeilisearchUrlEnv(legacy)).toBe('https://search.legacy.test');
    expect(getMeilisearchSearchApiKeyEnv(legacy)).toBe('legacy-search-key');
  });

  it('never treats the legacy shared Auth token as a scoped identity', () => {
    expect(getAuthInternalIdentityEnv({
      AUTH_INTERNAL_API_TOKEN: 'legacy-shared-token',
    })).toEqual({ caller: '', token: '' });
  });
});
