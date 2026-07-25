/**
 * Centralized token management — singleton TokenManager with request queuing.
 *
 * Guarantees:
 *  - Only one /api/auth/refresh call in flight at any time across the whole app.
 *  - All callers that arrive while a refresh is in progress are queued and
 *    resolved (not rejected) with the new token once the refresh completes.
 *  - On refresh failure every queued caller receives null and must handle it
 *    (e.g. force-logout).
 *  - After a successful refresh, auth-client, all fetch-based clients, and the
 *    Zustand auth store are updated via dynamic imports (avoiding circular deps).
 *  - Proactive refresh is scheduled 5 min before the JWT expires so that users
 *    never experience a mid-session "token expired" error.
 */

import { config } from '@/lib/config';

export interface RefreshResult {
  accessToken: string;
}

/**
 * Returns true when the JWT access token will expire within `bufferMs`
 * milliseconds (default: 5 minutes). Treats parse errors as expired.
 */
export function isTokenNearExpiry(token: string, bufferMs = 5 * 60 * 1000): boolean {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.exp * 1000 - Date.now() < bufferMs;
  } catch {
    return true;
  }
}

class TokenManager {
  private refreshPromise: Promise<RefreshResult | null> | null = null;
  private requestQueue: Array<(token: string | null) => void> = [];

  /**
   * Returns the current (possibly just-refreshed) access token, or null if
   * refresh failed. Safe to call from multiple concurrent code paths — all
   * concurrent callers share one refresh call and are resolved together.
   */
  async ensureFreshToken(): Promise<string | null> {
    if (this.refreshPromise) {
      return new Promise<string | null>((resolve) => {
        this.requestQueue.push(resolve);
      });
    }

    this.refreshPromise = this.performRefresh();
    let newToken: string | null = null;
    try {
      const result = await this.refreshPromise;
      newToken = result?.accessToken ?? null;
    } catch {
      newToken = null;
    } finally {
      this.refreshPromise = null;
      this.requestQueue.forEach((resolve) => resolve(newToken));
      this.requestQueue = [];
    }
    return newToken;
  }

  private async performRefresh(): Promise<RefreshResult | null> {
    if (typeof window === 'undefined') return null;
    localStorage.removeItem(config.auth.refreshTokenKey);

    try {
      const res = await fetch('/api/auth/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({}),
        credentials: 'same-origin',
      });
      const data = await res.json().catch(() => ({}));
      const accessToken = (data?.data?.access_token ?? data?.access_token) as string | undefined;

      if (accessToken && res.ok) {
        // Update auth-client in-memory cache (dynamic import avoids circular dep)
        try {
          const { authApi } = await import('./auth-client');
          authApi.setToken(accessToken);
        } catch { /* SSR or import error */ }

        // Update Zustand auth store
        try {
          const { useAuthStore } = await import('../stores/auth-store');
          useAuthStore.getState().setToken(accessToken);
        } catch { /* SSR or import error */ }

        return { accessToken };
      }
      return null;
    } catch {
      return null;
    }
  }
}

export const tokenManager = new TokenManager();

// ─── Proactive refresh ────────────────────────────────────────────────────────

let proactiveRefreshTimer: ReturnType<typeof setTimeout> | null = null;
/** Invalidates in-flight reschedules when stop/start is called (prevents zombie loops). */
let proactiveRefreshGeneration = 0;

function scheduleProactiveRefresh(delayMs: number, accessToken: string): void {
  proactiveRefreshTimer = setTimeout(() => {
    proactiveRefreshTimer = null;
    startProactiveRefresh(accessToken);
  }, delayMs);
}

/**
 * Schedules a token refresh 5 minutes before the current access token expires.
 * Call once after a successful login / initializeAuth. The function is
 * self-rescheduling: after each refresh it calls itself to set up the next timer.
 * On failure it retries with a fixed backoff instead of looping immediately —
 * a revoked/expired refresh token must not hammer /api/auth/refresh.
 */
export function startProactiveRefresh(accessToken?: string | null): void {
  if (typeof window === 'undefined') return;

  if (proactiveRefreshTimer !== null) {
    clearTimeout(proactiveRefreshTimer);
    proactiveRefreshTimer = null;
  }
  const generation = ++proactiveRefreshGeneration;

  const token = accessToken;
  if (!token) return;

  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const exp = payload.exp as number | undefined;
    if (!exp) return;

    const msUntilRefresh = exp * 1000 - Date.now() - 5 * 60 * 1000;

    if (msUntilRefresh <= 0) {
      // Token already near/past expiry — refresh immediately then reschedule.
      tokenManager.ensureFreshToken().then((newToken) => {
        // stop/start intervenuti durante il refresh: non ri-schedulare.
        if (generation !== proactiveRefreshGeneration) return;
        if (newToken && !isTokenNearExpiry(newToken)) {
          startProactiveRefresh(newToken);
          return;
        }
        // Refresh fallito o token ancora prossimo alla scadenza: non creare un
        // loop su un cookie revocato. La prossima richiesta protetta gestirà il
        // 401 tramite l'interceptor e il logout fail-closed.
      });
      return;
    }

    scheduleProactiveRefresh(msUntilRefresh, token);
  } catch {
    // Malformed token — nothing to schedule.
  }
}

/** Cancels any pending proactive-refresh timer (call on logout). */
export function stopProactiveRefresh(): void {
  proactiveRefreshGeneration++;
  if (proactiveRefreshTimer !== null) {
    clearTimeout(proactiveRefreshTimer);
    proactiveRefreshTimer = null;
  }
}

// ─── Backward-compat wrapper ─────────────────────────────────────────────────

/**
 * @deprecated Prefer `tokenManager.ensureFreshToken()` directly.
 * Kept for external callers that expect a `RefreshResult | null` shape.
 */
export async function refreshAccessToken(): Promise<RefreshResult | null> {
  if (typeof window === 'undefined') return null;
  const newToken = await tokenManager.ensureFreshToken();
  if (newToken) return { accessToken: newToken };
  return null;
}
