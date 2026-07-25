import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { tradesApi } from '@/lib/api/trades-client';
import { getMarketplaceSyncStatus } from '@/lib/api/marketplace-client';
import { syncClient } from '@/lib/api/sync-client';
import { authApi } from '@/lib/api/auth-client';

function okJson(data: unknown): Response {
  return {
    ok: true,
    status: 200,
    json: async () => data,
  } as Response;
}

function requestHeaders(fetchMock: ReturnType<typeof vi.fn>, callIndex = 0): Headers {
  const init = fetchMock.mock.calls[callIndex]?.[1] as RequestInit | undefined;
  return new Headers(init?.headers);
}

describe('client BFF con cookie HttpOnly', () => {
  beforeEach(() => {
    localStorage.setItem('ebartex_access_token', 'token-che-non-deve-essere-letto');
  });

  afterEach(() => {
    authApi.clearToken();
    localStorage.clear();
    vi.unstubAllGlobals();
  });

  it('trades non costruisce Authorization dal localStorage', async () => {
    const fetchMock = vi.fn().mockResolvedValue(okJson({ items: [], total: 0 }));
    vi.stubGlobal('fetch', fetchMock);

    await tradesApi.list();

    expect(requestHeaders(fetchMock).has('Authorization')).toBe(false);
  });

  it('marketplace non costruisce Authorization dal localStorage', async () => {
    const fetchMock = vi.fn().mockResolvedValue(okJson({}));
    vi.stubGlobal('fetch', fetchMock);

    await getMarketplaceSyncStatus();

    expect(requestHeaders(fetchMock).has('Authorization')).toBe(false);
  });

  it('sync usa il cookie BFF anche se riceve un token in memoria', async () => {
    const fetchMock = vi.fn().mockResolvedValue(okJson({}));
    vi.stubGlobal('fetch', fetchMock);

    await syncClient.getSyncStatus('user-1', 'token-in-memoria');

    expect(requestHeaders(fetchMock).has('Authorization')).toBe(false);
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/sync/status/user-1',
      expect.objectContaining({ credentials: 'same-origin' }),
    );
  });

  it('auth conserva l\'access token solo in memoria e rimuove refresh token legacy', () => {
    localStorage.removeItem('ebartex_access_token');
    localStorage.setItem('ebartex_refresh_token', 'refresh-preesistente');

    authApi.setToken('access-in-memoria', 'refresh-legacy');

    expect(authApi.getToken()).toBe('access-in-memoria');
    expect(localStorage.getItem('ebartex_access_token')).toBeNull();
    expect(localStorage.getItem('ebartex_refresh_token')).toBeNull();
  });
});
