import { afterEach, describe, expect, it, vi } from 'vitest';

import { auctionApi, createIdempotencyKey } from '@/lib/api/auction-client';

vi.mock('@/lib/api/refresh-token', () => ({
  refreshAccessToken: vi.fn(async () => null),
}));

vi.mock('@/lib/api/auth-client', () => ({
  authApi: {
    setToken: vi.fn(),
  },
}));

vi.mock('@/lib/stores/auth-store', () => ({
  useAuthStore: {
    getState: () => ({
      setToken: vi.fn(),
    }),
  },
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

  it('falls back to generated key when crypto is unavailable', () => {
    vi.stubGlobal('crypto', undefined);
    const key = createIdempotencyKey();
    expect(key.startsWith('bid-')).toBe(true);
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

  it('retries network failures with the same Idempotency-Key', async () => {
    const fetchMock = vi
      .fn()
      .mockRejectedValueOnce(new TypeError('Failed to fetch'))
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: { auction: {}, bids: [] } }),
      });
    vi.stubGlobal('fetch', fetchMock);
    vi.stubGlobal('crypto', { randomUUID: () => 'idem-retry-123' });

    await auctionApi.placeBid(42, { amount: 11 });

    expect(fetchMock).toHaveBeenCalledTimes(2);
    for (const [, options] of fetchMock.mock.calls) {
      const headers = (options?.headers ?? {}) as Record<string, string>;
      expect(headers['Idempotency-Key']).toBe('idem-retry-123');
    }
  });
});

describe('auctionApi.createAuction', () => {
  it('does not retry non-idempotent creates after a network failure', async () => {
    const fetchMock = vi.fn().mockRejectedValueOnce(new TypeError('Failed to fetch'));
    vi.stubGlobal('fetch', fetchMock);

    await expect(
      auctionApi.createAuction({
        title: 'Test auction',
        description: 'Test description',
        starting_price: 10,
        start_time: '2026-05-13T12:00:00.000Z',
        end_time: '2026-05-20T12:00:00.000Z',
        image_front: 'https://example.com/front.jpg',
        image_back: 'https://example.com/back.jpg',
      }),
    ).rejects.toThrow('Connessione non riuscita');

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
