// @vitest-environment node

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

import {
  checkRateLimit,
  getRateLimitClientIp,
  rateLimitExceededResponse,
} from '@/app/api/_lib/rate-limit';

const KEY_SECRET = '0123456789abcdef0123456789abcdef';

function request(
  ip = '203.0.113.10',
  extraHeaders: Record<string, string> = {},
): NextRequest {
  const viewerAddress = ip.includes(':') ? `[${ip}]:43120` : `${ip}:43120`;
  return new NextRequest('https://www.ebartex.com/api/search', {
    headers: {
      'cloudfront-viewer-address': viewerAddress,
      ...extraHeaders,
    },
  });
}

function useProductionRedis(): void {
  vi.stubEnv('NODE_ENV', 'production');
  vi.stubEnv('TRUSTED_CLIENT_IP_HEADER', 'cloudfront-viewer-address');
  vi.stubEnv('RATE_LIMIT_REDIS_REST_URL', 'https://redis.example.test');
  vi.stubEnv('RATE_LIMIT_REDIS_REST_TOKEN', 'redis-rest-token-for-tests-32-bytes');
  vi.stubEnv('RATE_LIMIT_REDIS_ALLOWED_HOSTS', 'redis.example.test');
  vi.stubEnv('RATE_LIMIT_KEY_SECRET', KEY_SECRET);
}

function commandFromFetch(mock: ReturnType<typeof vi.fn>, index = 0): unknown[] {
  const init = mock.mock.calls[index]?.[1] as RequestInit | undefined;
  if (typeof init?.body !== 'string') throw new Error('Missing Redis command body');
  return JSON.parse(init.body) as unknown[];
}

describe('distributed BFF rate limiter', () => {
  beforeEach(() => {
    useProductionRedis();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it('uses one atomic Lua command and enforces the quota under concurrent calls', async () => {
    let counter = 0;
    const redisFetch = vi.fn().mockImplementation(async () => {
      await Promise.resolve();
      counter += 1;
      return Response.json({ result: [counter, 60_000] });
    });
    vi.stubGlobal('fetch', redisFetch);

    const results = await Promise.all(
      Array.from({ length: 40 }, () =>
        checkRateLimit(request(), {
          scope: 'concurrency',
          limit: 10,
          windowMs: 60_000,
        }),
      ),
    );

    expect(results.filter((result) => result.allowed)).toHaveLength(10);
    expect(results.filter((result) => !result.allowed)).toHaveLength(30);
    expect(redisFetch).toHaveBeenCalledTimes(40);
    const command = commandFromFetch(redisFetch);
    expect(command[0]).toBe('EVAL');
    expect(command[1]).toContain("redis.call('INCR', KEYS[1])");
    expect(command[1]).toContain("redis.call('PEXPIRE', KEYS[1], ARGV[1])");
    expect(command[2]).toBe(1);
    const init = redisFetch.mock.calls[0]?.[1] as RequestInit;
    expect(init.headers).toMatchObject({ 'Accept-Encoding': 'identity' });
  });

  it('uses the backend TTL for Retry-After and sends the exact window to Lua', async () => {
    const redisFetch = vi.fn().mockResolvedValue(
      Response.json({ result: [2, 1_250] }),
    );
    vi.stubGlobal('fetch', redisFetch);

    const result = await checkRateLimit(request(), {
      scope: 'ttl',
      limit: 5,
      windowMs: 45_000,
    });

    expect(result).toMatchObject({ allowed: true, remaining: 3, retryAfterSec: 2 });
    expect(commandFromFetch(redisFetch)[4]).toBe(45_000);
  });

  it('never places IP or caller-controlled JWT subject in the Redis key', async () => {
    const redisFetch = vi.fn().mockResolvedValue(
      Response.json({ result: [1, 60_000] }),
    );
    vi.stubGlobal('fetch', redisFetch);

    await checkRateLimit(request('198.51.100.42'), {
      scope: 'key-privacy',
      limit: 5,
      windowMs: 60_000,
      userId: 'private-user@example.test',
    });
    await checkRateLimit(request('198.51.100.42'), {
      scope: 'key-privacy',
      limit: 5,
      windowMs: 60_000,
      userId: 'forged-rotated-subject',
    });

    const firstKey = String(commandFromFetch(redisFetch, 0)[3]);
    const secondKey = String(commandFromFetch(redisFetch, 1)[3]);
    expect(firstKey).toMatch(/^brx:bff:rl:v1:key-privacy:[A-Za-z0-9_-]{43}$/);
    expect(firstKey).not.toContain('198.51.100.42');
    expect(firstKey).not.toContain('private-user');
    expect(firstKey).toBe(secondKey);
  });

  it('shares one private scope across dynamic username routes', async () => {
    vi.stubEnv('AUTH_API_URL', 'https://auth.example.test');
    vi.stubEnv('TRUSTED_UPSTREAM_HOSTS', 'auth.example.test');
    let counter = 0;
    const fetchMock = vi.fn().mockImplementation(async (input: RequestInfo | URL) => {
      if (String(input) === 'https://redis.example.test') {
        counter += 1;
        return Response.json({ result: [counter, 300_000] });
      }
      return Response.json({ username: 'redacted-test-user' });
    });
    vi.stubGlobal('fetch', fetchMock);
    const { GET } = await import('@/app/api/auth/[...path]/route');

    for (const username of ['alice-private', 'bob-private']) {
      const req = new NextRequest(`https://www.ebartex.com/api/auth/users/${username}`, {
        headers: { 'cloudfront-viewer-address': '203.0.113.10:43120' },
      });
      const response = await GET(req, {
        params: Promise.resolve({ path: ['users', username] }),
      });
      expect(response.status).toBe(200);
    }

    const redisCalls = fetchMock.mock.calls.filter(
      ([input]) => String(input) === 'https://redis.example.test',
    );
    expect(redisCalls).toHaveLength(2);
    const redisKeys = redisCalls.map(([, init]) => {
      if (typeof init?.body !== 'string') throw new Error('Missing Redis command body');
      return String((JSON.parse(init.body) as unknown[])[3]);
    });
    expect(redisKeys[0]).toBe(redisKeys[1]);
    expect(redisKeys[0]).toContain(':auth:users-public:');
    expect(redisKeys[0]).not.toContain('alice-private');
    expect(redisKeys[0]).not.toContain('bob-private');
  });

  it('fails closed with 503 when Redis rejects, times out, or returns malformed data', async () => {
    const failures = [
      vi.fn().mockRejectedValue(new Error('secret backend detail')),
      vi.fn().mockResolvedValue(new Response('', { status: 503 })),
      vi.fn().mockResolvedValue(Response.json({ result: ['NaN', -1] })),
    ];

    for (const redisFetch of failures) {
      vi.stubGlobal('fetch', redisFetch);
      const result = await checkRateLimit(request(), {
        scope: 'backend-failure',
        limit: 10,
        windowMs: 60_000,
      });
      expect(result).toMatchObject({ allowed: false, unavailable: true });
      const response = rateLimitExceededResponse(result);
      expect(response.status).toBe(503);
      expect(response.headers.get('cache-control')).toContain('no-store');
      expect(await response.text()).not.toContain('secret backend detail');
    }
  });

  it('uses the bounded production compatibility limiter only when Redis is entirely absent', async () => {
    vi.stubEnv('RATE_LIMIT_REDIS_REST_URL', '');
    vi.stubEnv('RATE_LIMIT_REDIS_REST_TOKEN', '');
    vi.stubEnv('UPSTASH_REDIS_REST_URL', '');
    vi.stubEnv('UPSTASH_REDIS_REST_TOKEN', '');
    vi.stubEnv('TRUSTED_CLIENT_IP_HEADER', '');
    vi.stubEnv('TRUSTED_PROXY_HOPS', '');
    const warning = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const scope = `production-memory-${Date.now()}`;
    const amplifyRequest = request('203.0.113.10', {
      'x-forwarded-for': '6.6.6.6, 203.0.113.10',
    });
    const results = await Promise.all(
      Array.from({ length: 4 }, () =>
        checkRateLimit(amplifyRequest, { scope, limit: 3, windowMs: 60_000 }),
      ),
    );
    expect(results.map((result) => result.allowed)).toEqual([true, true, true, false]);
    expect(results[3]).toMatchObject({ remaining: 0 });
    expect(rateLimitExceededResponse(results[3]).status).toBe(429);
    expect(warning).toHaveBeenCalledTimes(1);
    expect(warning).toHaveBeenCalledWith(
      '[rate-limit] Redis non configurato: fallback temporaneo per-instance attivo.',
    );
    warning.mockRestore();
  });

  it('fails closed for partial Redis configuration and missing or invalid viewer IPs', async () => {
    const redisFetch = vi.fn();
    vi.stubGlobal('fetch', redisFetch);
    vi.stubEnv('RATE_LIMIT_REDIS_REST_TOKEN', '');
    let result = await checkRateLimit(request(), {
      scope: 'partial-redis',
      limit: 5,
      windowMs: 60_000,
    });
    expect(result).toMatchObject({ allowed: false, unavailable: true });
    expect(redisFetch).not.toHaveBeenCalled();

    useProductionRedis();
    vi.stubEnv('TRUSTED_CLIENT_IP_HEADER', 'x-client-ip');
    result = await checkRateLimit(request(), {
      scope: 'missing-ip',
      limit: 5,
      windowMs: 60_000,
    });
    expect(result).toMatchObject({ allowed: false, unavailable: true });

    vi.stubEnv('TRUSTED_CLIENT_IP_HEADER', 'cloudfront-viewer-address');
    result = await checkRateLimit(
      new NextRequest('https://www.ebartex.com/api/search'),
      { scope: 'missing-ip', limit: 5, windowMs: 60_000 },
    );
    expect(result).toMatchObject({ allowed: false, unavailable: true });
    expect(redisFetch).not.toHaveBeenCalled();
  });

  it('never sends the bearer token to a custom path or untrusted host', async () => {
    const redisFetch = vi.fn();
    vi.stubGlobal('fetch', redisFetch);

    vi.stubEnv('RATE_LIMIT_REDIS_REST_URL', 'https://redis.example.test/collect');
    let result = await checkRateLimit(request(), {
      scope: 'host-validation',
      limit: 5,
      windowMs: 60_000,
    });
    expect(result).toMatchObject({ allowed: false, unavailable: true });
    expect(redisFetch).not.toHaveBeenCalled();

    vi.stubEnv('RATE_LIMIT_REDIS_REST_URL', 'https://attacker.example/');
    result = await checkRateLimit(request(), {
      scope: 'host-validation',
      limit: 5,
      windowMs: 60_000,
    });
    expect(result).toMatchObject({ allowed: false, unavailable: true });
    expect(redisFetch).not.toHaveBeenCalled();

    vi.stubEnv('RATE_LIMIT_REDIS_REST_URL', '');
    vi.stubEnv('RATE_LIMIT_REDIS_REST_TOKEN', '');
    vi.stubEnv('UPSTASH_REDIS_REST_URL', 'https://tenant.upstash.io/');
    vi.stubEnv('UPSTASH_REDIS_REST_TOKEN', 'redis-rest-token-for-tests-32-bytes');
    vi.stubEnv('RATE_LIMIT_REDIS_ALLOWED_HOSTS', '');
    const siblingFetch = vi.fn().mockResolvedValue(Response.json({ result: [1, 60_000] }));
    vi.stubGlobal('fetch', siblingFetch);
    result = await checkRateLimit(request(), {
      scope: 'host-validation',
      limit: 5,
      windowMs: 60_000,
    });
    expect(result).toMatchObject({ allowed: true, remaining: 4 });
    expect(siblingFetch).toHaveBeenCalledOnce();
  });

  it('trusts only the configured proxy boundary and validates the selected IP', () => {
    const req = request('203.0.113.9', {
      'x-forwarded-for': '6.6.6.6, 192.0.2.20',
    });
    expect(getRateLimitClientIp(req)).toBe('203.0.113.9');

    vi.stubEnv('TRUSTED_CLIENT_IP_HEADER', '');
    vi.stubEnv('TRUSTED_PROXY_HOPS', '');
    expect(getRateLimitClientIp(req)).toBe('192.0.2.20');

    const spoofedLeftmost = request('203.0.113.9', {
      'x-forwarded-for': '6.6.6.6, 198.51.100.44',
    });
    expect(getRateLimitClientIp(spoofedLeftmost)).toBe('198.51.100.44');

    vi.stubEnv('TRUSTED_PROXY_HOPS', '11');
    expect(getRateLimitClientIp(req)).toBe('unknown');

    vi.stubEnv('TRUSTED_CLIENT_IP_HEADER', 'cloudfront-viewer-address');
    expect(getRateLimitClientIp(request('999.10.10.10'))).toBe('unknown');
    expect(getRateLimitClientIp(request('2001:db8:::1'))).toBe('unknown');
    expect(getRateLimitClientIp(request('2001:db8::1'))).toBe('2001:db8::1');
    expect(getRateLimitClientIp(request('2001:0DB8:0:0:0:0:0:1'))).toBe('2001:db8::1');
    expect(getRateLimitClientIp(request('::FFFF:192.0.2.1'))).toBe('::ffff:c000:201');
  });

  it('uses the same bounded fallback semantics in development', async () => {
    vi.stubEnv('NODE_ENV', 'development');
    vi.stubEnv('RATE_LIMIT_REDIS_REST_URL', '');
    vi.stubEnv('RATE_LIMIT_REDIS_REST_TOKEN', '');
    vi.stubEnv('UPSTASH_REDIS_REST_URL', '');
    vi.stubEnv('UPSTASH_REDIS_REST_TOKEN', '');

    const scope = `dev-fallback-${Date.now()}`;
    const results = await Promise.all(
      Array.from({ length: 4 }, () =>
        checkRateLimit(request(), { scope, limit: 3, windowMs: 60_000 }),
      ),
    );
    expect(results.map((result) => result.allowed)).toEqual([true, true, true, false]);
  });
});
