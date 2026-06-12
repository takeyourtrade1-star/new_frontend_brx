import { describe, expect, it, vi, afterEach } from 'vitest';
import { refreshTournamentsSsoCookies } from '@/lib/tournaments/navigate-to-portal';

describe('refreshTournamentsSsoCookies', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('waits for the refresh request before resolving', async () => {
    let resolveFetch: ((response: Response) => void) | undefined;
    const fetchPromise = new Promise<Response>((resolve) => {
      resolveFetch = resolve;
    });
    const fetchMock = vi.fn(() => fetchPromise);
    vi.stubGlobal('fetch', fetchMock);

    const refreshPromise = refreshTournamentsSsoCookies('refresh-token');
    let settled = false;
    void refreshPromise.then(() => {
      settled = true;
    });

    await Promise.resolve();

    expect(fetchMock).toHaveBeenCalledWith('/api/auth/refresh', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ refresh_token: 'refresh-token' }),
      credentials: 'same-origin',
      signal: expect.any(AbortSignal),
    });
    expect(settled).toBe(false);

    resolveFetch?.(new Response('{}', { status: 200 }));
    await refreshPromise;

    expect(settled).toBe(true);
  });

  it('continues when refresh fails', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network down')));

    await expect(refreshTournamentsSsoCookies('refresh-token')).resolves.toBeUndefined();
  });
});
