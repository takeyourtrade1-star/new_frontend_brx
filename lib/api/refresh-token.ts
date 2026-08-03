/**
 * Refresh cookie-only centralizzato.
 *
 * Il browser non riceve e non analizza JWT: il BFF ruota i cookie HttpOnly e
 * risponde soltanto con `{ authenticated: true }`. Le chiamate concorrenti
 * condividono la stessa richiesta per evitare replay/race del refresh token.
 */

import { purgeLegacyAuthStorage } from '@/lib/auth/legacy-token-storage';

class SessionManager {
  private refreshPromise: Promise<boolean> | null = null;

  async ensureFreshSession(): Promise<boolean> {
    // Eliminate readable credentials before any network await or dedupe path.
    purgeLegacyAuthStorage();
    if (this.refreshPromise) return this.refreshPromise;
    this.refreshPromise = this.performRefresh();
    try {
      return await this.refreshPromise;
    } finally {
      this.refreshPromise = null;
    }
  }

  private async performRefresh(): Promise<boolean> {
    if (typeof window === 'undefined') return false;
    try {
      const response = await fetch('/api/auth/refresh', {
        method: 'POST',
        headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
        body: '{}',
        credentials: 'same-origin',
      });
      if (!response.ok) return false;
      const data = (await response.json().catch(() => ({}))) as {
        authenticated?: unknown;
      };
      return data.authenticated === true;
    } catch {
      return false;
    }
  }
}
export const tokenManager = new SessionManager();

/** Compatibilita' nominale: rinnova la sessione, non restituisce token. */
export async function refreshSession(): Promise<boolean> {
  return tokenManager.ensureFreshSession();
}
