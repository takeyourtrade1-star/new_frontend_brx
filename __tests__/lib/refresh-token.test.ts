import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { refreshSession, tokenManager } from '@/lib/api/refresh-token';

function refreshResponse(ok: boolean, body: unknown): Response {
  return {
    ok,
    status: ok ? 200 : 401,
    json: async () => body,
  } as Response;
}

describe('refresh cookie-only', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('ritorna false quando il BFF rifiuta il refresh', async () => {
    const fetchMock = vi.fn().mockResolvedValue(refreshResponse(false, {}));
    vi.stubGlobal('fetch', fetchMock);

    await expect(tokenManager.ensureFreshSession()).resolves.toBe(false);
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/auth/refresh',
      expect.objectContaining({
        method: 'POST',
        body: '{}',
        credentials: 'same-origin',
      }),
    );
  });

  it('accetta soltanto il flag authenticated e non salva token', async () => {
    localStorage.setItem('ebartex_access_token', 'legacy-access');
    localStorage.setItem('ebartex_refresh_token', 'legacy');
    localStorage.setItem('ebartex_user', '{"email":"legacy@example.test"}');
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(
      refreshResponse(true, { authenticated: true }),
    ));

    await expect(tokenManager.ensureFreshSession()).resolves.toBe(true);
    expect(localStorage.getItem('ebartex_access_token')).toBeNull();
    expect(localStorage.getItem('ebartex_refresh_token')).toBeNull();
    expect(localStorage.getItem('ebartex_user')).toBeNull();
  });

  it('cancella le credenziali legacy prima di attendere la rete', async () => {
    localStorage.setItem('ebartex_refresh_token', 'legacy');
    let resolveFetch: (response: Response) => void = () => {};
    vi.stubGlobal('fetch', vi.fn().mockImplementation(
      () => new Promise<Response>((resolve) => { resolveFetch = resolve; }),
    ));

    const refresh = tokenManager.ensureFreshSession();
    expect(localStorage.getItem('ebartex_refresh_token')).toBeNull();
    resolveFetch(refreshResponse(false, {}));
    await expect(refresh).resolves.toBe(false);
  });

  it('non tratta un token restituito nel JSON come sessione valida', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(
      refreshResponse(true, { access_token: 'must-not-be-used' }),
    ));

    await expect(tokenManager.ensureFreshSession()).resolves.toBe(false);
  });

  it('deduplica refresh concorrenti', async () => {
    let resolveFetch: (response: Response) => void = () => {};
    const fetchMock = vi.fn().mockImplementation(
      () => new Promise<Response>((resolve) => { resolveFetch = resolve; }),
    );
    vi.stubGlobal('fetch', fetchMock);

    const first = tokenManager.ensureFreshSession();
    const second = tokenManager.ensureFreshSession();
    resolveFetch(refreshResponse(true, { authenticated: true }));

    await expect(Promise.all([first, second])).resolves.toEqual([true, true]);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('refreshSession è un wrapper booleano', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(
      refreshResponse(true, { authenticated: true }),
    ));
    await expect(refreshSession()).resolves.toBe(true);
  });
});
