// @vitest-environment node

import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

import { fetchPublicProfileBio } from '@/lib/user-profile-metadata';

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe('public profile metadata fetch', () => {
  it('uses a trusted exact origin and a bounded, non-redirecting fetch', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('TRUSTED_UPSTREAM_HOSTS', 'auth.example.test');
    vi.stubEnv('AUTH_API_URL', 'https://auth.example.test');
    const upstreamFetch = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ data: { bio: 'Profilo verificato' } }), {
        headers: { 'content-type': 'application/json' },
      }),
    );
    vi.stubGlobal('fetch', upstreamFetch);

    await expect(fetchPublicProfileBio('alice.test')).resolves.toBe(
      'Profilo verificato',
    );
    expect(String(upstreamFetch.mock.calls[0][0])).toBe(
      'https://auth.example.test/api/auth/users/alice.test',
    );
    expect(upstreamFetch.mock.calls[0][1]).toMatchObject({
      cache: 'no-store',
      redirect: 'error',
      headers: {
        Accept: 'application/json',
        'Accept-Encoding': 'identity',
      },
    });
  });

  it('does not turn invalid configuration or usernames into relative fetches', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('TRUSTED_UPSTREAM_HOSTS', 'auth.example.test');
    vi.stubEnv('AUTH_API_URL', 'https://auth.example.test.evil.invalid');
    const upstreamFetch = vi.fn();
    vi.stubGlobal('fetch', upstreamFetch);

    await expect(fetchPublicProfileBio('alice')).resolves.toBeNull();
    await expect(fetchPublicProfileBio('../admin')).resolves.toBeNull();
    expect(upstreamFetch).not.toHaveBeenCalled();
  });

  it('rejects oversized or malformed bio data', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('TRUSTED_UPSTREAM_HOSTS', 'auth.example.test');
    vi.stubEnv('AUTH_API_URL', 'https://auth.example.test');
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ data: { bio: 'x'.repeat(301) } })),
      ),
    );

    await expect(fetchPublicProfileBio('alice')).resolves.toBeNull();
  });
});
