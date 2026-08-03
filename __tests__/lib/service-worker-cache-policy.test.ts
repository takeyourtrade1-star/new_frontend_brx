import { describe, expect, it } from 'vitest';

import {
  isLegacyPrivateRuntimeCache,
  mustBypassServiceWorkerCache,
} from '@/lib/security/service-worker-cache-policy';

const match = (
  pathname: string,
  request: Partial<{ mode: string; destination: string; headers: Headers }> = {},
) =>
  mustBypassServiceWorkerCache({
    url: new URL(pathname, 'https://ebartex.com'),
    sameOrigin: true,
    request: {
      mode: request.mode,
      destination: request.destination,
      headers: request.headers ?? new Headers(),
    },
  });

describe('service worker account-isolation cache policy', () => {
  it('bypasses every API and personalized Next transport', () => {
    expect(match('/api/search?q=card')).toBe(true);
    expect(match('/account', { mode: 'navigate' })).toBe(true);
    expect(match('/account', { destination: 'document' })).toBe(true);
    expect(match('/_next/data/build/account.json')).toBe(true);
    expect(match('/account', { headers: new Headers({ rsc: '1' }) })).toBe(true);
    expect(
      match('/account', { headers: new Headers({ 'next-router-prefetch': '1' }) }),
    ).toBe(true);
  });

  it('leaves immutable static assets eligible for default caching', () => {
    expect(match('/_next/static/chunks/app.js')).toBe(false);
  });

  it('recognizes private legacy runtime cache buckets for deletion', () => {
    expect(isLegacyPrivateRuntimeCache('pages')).toBe(true);
    expect(isLegacyPrivateRuntimeCache('serwist-pages-rsc-prefetch-v2')).toBe(true);
    expect(isLegacyPrivateRuntimeCache('next-data-v1')).toBe(true);
    expect(isLegacyPrivateRuntimeCache('apis-v3')).toBe(true);
    expect(isLegacyPrivateRuntimeCache('others-v3')).toBe(true);
    expect(isLegacyPrivateRuntimeCache('serwist-precache-v4')).toBe(false);
  });
});
