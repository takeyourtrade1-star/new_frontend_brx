/**
 * Refresh token centralizzato - un solo refresh alla volta per tutta l'app.
 * Usato da auth-client e sync-client per evitare due chiamate parallele a /api/auth/refresh
 * (il backend ruota il refresh token: la seconda fallirebbe e forzerebbe logout).
 */

import { config } from '@/lib/config';

export interface RefreshResult {
  accessToken: string;
  refreshToken: string;
}

/** Promise del refresh in corso; le richieste che ricevono 401 attendono questa invece di lanciare un secondo refresh. */
let refreshPromise: Promise<RefreshResult | null> | null = null;

/**
 * Esegue un solo refresh alla volta. Ritorna i nuovi token o null se fallisce.
 * I chiamanti (auth-client, sync-client) devono aggiornare authApi e store con il risultato.
 */
export async function refreshAccessToken(): Promise<RefreshResult | null> {
  if (typeof window === 'undefined') return null;

  if (refreshPromise) {
    return refreshPromise;
  }

  const refreshToken = localStorage.getItem(config.auth.refreshTokenKey);
  if (!refreshToken) return null;

  refreshPromise = (async (): Promise<RefreshResult | null> => {
    try {
      const res = await fetch('/api/auth/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ refresh_token: refreshToken }),
        credentials: 'same-origin',
      });
      const data = await res.json().catch(() => ({}));
      const accessToken = (data?.data?.access_token ?? data?.access_token) as string | undefined;
      const newRefreshToken = (data?.data?.refresh_token ?? data?.refresh_token) as string | undefined;
      if (accessToken && newRefreshToken && res.ok) {
        return { accessToken, refreshToken: newRefreshToken };
      }
      return null;
    } catch {
      return null;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}
