import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  isTokenNearExpiry,
  tokenManager,
  startProactiveRefresh,
  stopProactiveRefresh,
  refreshAccessToken,
} from '@/lib/api/refresh-token';
import { config } from '@/lib/config';

// La dynamic import dentro performRefresh risolve verso questi mock (vi.mock
// intercetta per id risolto, indipendentemente dallo specifier relativo/alias).
vi.mock('@/lib/api/auth-client', () => ({
  authApi: { setToken: vi.fn(), clearToken: vi.fn() },
}));

/** Costruisce un JWT fittizio con `exp` a N secondi da adesso (header/sig finti). */
function makeJwt(expSecondsFromNow: number): string {
  const payload = { exp: Math.floor(Date.now() / 1000) + expSecondsFromNow };
  return `header.${btoa(JSON.stringify(payload))}.sig`;
}

function okRefreshResponse(access: string, refresh: string) {
  return {
    ok: true,
    json: async () => ({ access_token: access, refresh_token: refresh }),
  } as unknown as Response;
}

describe('refresh-token', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    stopProactiveRefresh();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  describe('isTokenNearExpiry', () => {
    it('è true quando il token scade entro il buffer (5 min)', () => {
      expect(isTokenNearExpiry(makeJwt(60))).toBe(true); // scade tra 1 min
    });

    it('è false quando il token scade ben oltre il buffer', () => {
      expect(isTokenNearExpiry(makeJwt(60 * 60))).toBe(false); // scade tra 1h
    });

    it('tratta un token malformato come scaduto (true)', () => {
      expect(isTokenNearExpiry('non-un-jwt')).toBe(true);
    });

    it('rispetta un buffer personalizzato', () => {
      // scade tra 10 min: near con buffer 15 min, non near con buffer 5 min
      expect(isTokenNearExpiry(makeJwt(10 * 60), 15 * 60 * 1000)).toBe(true);
      expect(isTokenNearExpiry(makeJwt(10 * 60), 5 * 60 * 1000)).toBe(false);
    });
  });

  describe('tokenManager.ensureFreshToken', () => {
    it('senza refresh_token in storage ritorna null e non chiama fetch', async () => {
      const fetchMock = vi.fn();
      vi.stubGlobal('fetch', fetchMock);

      const token = await tokenManager.ensureFreshToken();

      expect(token).toBeNull();
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it('refresh riuscito: aggiorna storage e ritorna il nuovo access token', async () => {
      localStorage.setItem(config.auth.refreshTokenKey, 'old_refresh');
      const fetchMock = vi.fn().mockResolvedValue(okRefreshResponse('new_access', 'new_refresh'));
      vi.stubGlobal('fetch', fetchMock);

      const token = await tokenManager.ensureFreshToken();

      expect(token).toBe('new_access');
      expect(fetchMock).toHaveBeenCalledTimes(1);
      expect(localStorage.getItem(config.auth.tokenKey)).toBe('new_access');
      expect(localStorage.getItem(config.auth.refreshTokenKey)).toBe('new_refresh');
    });

    it('refresh fallito (res non ok) ritorna null e non tocca lo storage', async () => {
      localStorage.setItem(config.auth.refreshTokenKey, 'old_refresh');
      const fetchMock = vi.fn().mockResolvedValue({
        ok: false,
        json: async () => ({}),
      } as unknown as Response);
      vi.stubGlobal('fetch', fetchMock);

      const token = await tokenManager.ensureFreshToken();

      expect(token).toBeNull();
      expect(localStorage.getItem(config.auth.tokenKey)).toBeNull();
    });

    it('chiamate concorrenti condividono un solo refresh in volo', async () => {
      localStorage.setItem(config.auth.refreshTokenKey, 'old_refresh');
      let resolveFetch: (r: Response) => void = () => {};
      const fetchMock = vi.fn().mockImplementation(
        () => new Promise<Response>((resolve) => { resolveFetch = resolve; }),
      );
      vi.stubGlobal('fetch', fetchMock);

      const p1 = tokenManager.ensureFreshToken();
      const p2 = tokenManager.ensureFreshToken();
      // sblocca l'unica fetch in volo
      resolveFetch(okRefreshResponse('shared_access', 'shared_refresh'));

      const [t1, t2] = await Promise.all([p1, p2]);
      expect(t1).toBe('shared_access');
      expect(t2).toBe('shared_access');
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });
  });

  describe('refreshAccessToken (wrapper retro-compat)', () => {
    it('ritorna { accessToken, refreshToken } su successo', async () => {
      localStorage.setItem(config.auth.refreshTokenKey, 'old_refresh');
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue(okRefreshResponse('a2', 'r2')));

      const result = await refreshAccessToken();

      expect(result).toEqual({ accessToken: 'a2', refreshToken: 'r2' });
    });

    it('ritorna null su fallimento', async () => {
      localStorage.setItem(config.auth.refreshTokenKey, 'old_refresh');
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, json: async () => ({}) } as unknown as Response));

      expect(await refreshAccessToken()).toBeNull();
    });
  });

  describe('startProactiveRefresh / stopProactiveRefresh', () => {
    it('rinnova immediatamente se il token è già prossimo alla scadenza', async () => {
      localStorage.setItem(config.auth.tokenKey, makeJwt(60)); // entro il buffer
      localStorage.setItem(config.auth.refreshTokenKey, 'r');
      // Il nuovo token è un JWT lontano: il re-schedule imposta un timer, non rilancia fetch.
      const fetchMock = vi.fn().mockResolvedValue(okRefreshResponse(makeJwt(60 * 60), 'nr'));
      vi.stubGlobal('fetch', fetchMock);

      startProactiveRefresh();

      await vi.waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
      stopProactiveRefresh();
    });

    it('non rinnova subito se il token è lontano dalla scadenza', async () => {
      localStorage.setItem(config.auth.tokenKey, makeJwt(60 * 60));
      localStorage.setItem(config.auth.refreshTokenKey, 'r');
      const fetchMock = vi.fn().mockResolvedValue(okRefreshResponse('na', 'nr'));
      vi.stubGlobal('fetch', fetchMock);

      startProactiveRefresh();
      await Promise.resolve();

      expect(fetchMock).not.toHaveBeenCalled();
      stopProactiveRefresh();
    });

    it('non rinnova e non lancia senza token o con token malformato', () => {
      const fetchMock = vi.fn();
      vi.stubGlobal('fetch', fetchMock);

      expect(() => startProactiveRefresh()).not.toThrow(); // nessun token
      localStorage.setItem(config.auth.tokenKey, 'non-un-jwt');
      expect(() => startProactiveRefresh()).not.toThrow();

      expect(fetchMock).not.toHaveBeenCalled();
      stopProactiveRefresh();
    });
  });
});
