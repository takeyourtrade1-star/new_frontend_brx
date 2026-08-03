import { afterEach, describe, expect, it, vi } from 'vitest';

import { auctionApi, createIdempotencyKey } from '@/lib/api/auction-client';

vi.mock('@/lib/api/refresh-token', () => ({
  tokenManager: {
    ensureFreshToken: vi.fn(async () => null),
  },
  refreshAccessToken: vi.fn(async () => null),
}));

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('createIdempotencyKey', () => {
  it('uses crypto.randomUUID when available', () => {
    vi.stubGlobal('crypto', { randomUUID: () => 'uuid-test-1' });
    expect(createIdempotencyKey()).toBe('uuid-test-1');
  });

  it('fails closed when Web Crypto is unavailable', () => {
    vi.stubGlobal('crypto', undefined);
    expect(() => createIdempotencyKey()).toThrow(/Secure randomness is unavailable/);
  });

  it('uses getRandomValues as a cryptographic compatibility fallback', () => {
    vi.stubGlobal('crypto', {
      getRandomValues: (bytes: Uint8Array) => {
        bytes.fill(0xab);
        return bytes;
      },
    });
    expect(createIdempotencyKey()).toBe('abababab-abab-4bab-abab-abababababab');
  });
});

describe('auctionApi.placeBid', () => {
  it('sends Idempotency-Key header', async () => {
    const fetchMock = vi.fn(async (_input: RequestInfo | URL, _init?: RequestInit) => {
      void _input;
      void _init;
      return {
        ok: true,
        json: async () => ({ success: true, data: { auction: {}, bids: [] } }),
      };
    });
    vi.stubGlobal('fetch', fetchMock);
    vi.stubGlobal('crypto', { randomUUID: () => 'idem-123' });

    await auctionApi.placeBid(42, { amount: 11 });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [, options] = fetchMock.mock.calls[0];
    const headers = (options?.headers ?? {}) as Record<string, string>;
    expect(headers['Idempotency-Key']).toBe('idem-123');
  });
});
