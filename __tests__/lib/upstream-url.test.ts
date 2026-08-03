// @vitest-environment node

import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  trustedAuthServiceOrigin,
  trustedAuctionServiceOrigin,
  trustedMarketplaceServiceOrigin,
  trustedMeilisearchServiceOrigin,
  trustedServiceOrigin,
  trustedSyncServiceOrigin,
} from '@/app/api/_lib/upstream-url';

afterEach(() => vi.unstubAllEnvs());

describe('trusted service origin', () => {
  it('requires an exact configured production hostname', () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('TRUSTED_UPSTREAM_HOSTS', 'auth.ebartex.com');
    expect(trustedServiceOrigin('https://auth.ebartex.com')).toBe(
      'https://auth.ebartex.com',
    );
    expect(trustedServiceOrigin('https://abandoned.ebartex.com')).toBe('');
    expect(trustedServiceOrigin('https://auth.ebartex.com.evil.test')).toBe('');
    expect(trustedServiceOrigin('https://auth.ebartex.com:444')).toBe('');
  });

  it('accepts only an exact HTTPS origin from the matching public service URL', () => {
    const env = {
      NODE_ENV: 'production',
      NEXT_PUBLIC_AUTH_API_URL: 'https://auth.ebartex.com',
      NEXT_PUBLIC_AUCTION_API_URL: 'https://auction.ebartex.com',
      NEXT_PUBLIC_SYNC_API_URL: 'https://sync.ebartex.com',
      NEXT_PUBLIC_MARKETPLACE_API_URL: 'https://marketplace.ebartex.com',
      NEXT_PUBLIC_MEILISEARCH_URL: 'https://search.ebartex.com',
    };

    expect(trustedAuthServiceOrigin('https://auth.ebartex.com', env)).toBe(
      'https://auth.ebartex.com',
    );
    expect(trustedAuctionServiceOrigin('https://auction.ebartex.com', env)).toBe(
      'https://auction.ebartex.com',
    );
    expect(trustedSyncServiceOrigin('https://sync.ebartex.com', env)).toBe(
      'https://sync.ebartex.com',
    );
    expect(trustedMarketplaceServiceOrigin('https://marketplace.ebartex.com', env)).toBe(
      'https://marketplace.ebartex.com',
    );
    expect(trustedMeilisearchServiceOrigin('https://search.ebartex.com', env)).toBe(
      'https://search.ebartex.com',
    );
  });

  it('does not let Auth inherit another service alias or accept port, path or suffix variants', () => {
    const env = {
      NODE_ENV: 'production',
      NEXT_PUBLIC_AUTH_API_URL: 'https://auth.ebartex.com',
      NEXT_PUBLIC_MARKETPLACE_API_URL: 'https://marketplace.ebartex.com',
    };

    expect(trustedAuthServiceOrigin('https://marketplace.ebartex.com', env)).toBe('');
    expect(trustedAuthServiceOrigin('https://auth.ebartex.com:444', env)).toBe('');
    expect(trustedAuthServiceOrigin('https://auth.ebartex.com/api', env)).toBe('');
    expect(trustedAuthServiceOrigin('https://auth.ebartex.com.evil.test', env)).toBe('');
  });

  it('does not trust malformed public compatibility entries', () => {
    for (const configured of [
      'http://auth.ebartex.com',
      'https://user:password@auth.ebartex.com',
      'https://auth.ebartex.com:444',
      'https://auth.ebartex.com/api',
      'https://auth.ebartex.com?target=other',
    ]) {
      expect(trustedAuthServiceOrigin('https://auth.ebartex.com', {
        NODE_ENV: 'production',
        NEXT_PUBLIC_AUTH_API_URL: configured,
      })).toBe('');
    }
  });
});
