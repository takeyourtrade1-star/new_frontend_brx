// @vitest-environment node

import { afterEach, describe, expect, it, vi } from 'vitest';

import { trustedServiceOrigin } from '@/app/api/_lib/upstream-url';

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
});
