import { describe, expect, it } from 'vitest';

import {
  appendQueryWithPolicy,
  QUERY_INTEGER,
} from '@/app/api/_lib/query-policy';

describe('BFF query policy', () => {
  it('copies only one allowlisted bounded value', () => {
    const target = new URL('https://upstream.test/resource');
    const source = new URL('https://site.test/api?limit=10');
    expect(appendQueryWithPolicy(target, source, { limit: QUERY_INTEGER })).toBe(true);
    expect(target.search).toBe('?limit=10');
  });

  it('rejects unexpected, duplicate and oversized parameters atomically', () => {
    for (const source of [
      new URL('https://site.test/api?admin=true'),
      new URL('https://site.test/api?limit=1&limit=2'),
      new URL(`https://site.test/api?limit=${'1'.repeat(3_000)}`),
    ]) {
      const target = new URL('https://upstream.test/resource');
      expect(appendQueryWithPolicy(target, source, { limit: QUERY_INTEGER })).toBe(false);
      expect(target.search).toBe('');
    }
  });
});
