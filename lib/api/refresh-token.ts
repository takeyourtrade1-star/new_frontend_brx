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
  refreshToken: string;
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
    const storedRefreshToken = localStorage.getItem(config.auth.refreshTokenKey);
    if (!storedRefreshToken) return null;

    try {
      const res = await fetch('/api/auth/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ refresh_token: storedRefreshToken }),
        credentials: 'same-origin',
      });
      const data = await res.json().catch(() => ({}));
      const accessToken = (data?.data?.access_token ?? data?.access_token) as string | undefined;
      const newRefreshToken = (data?.data?.refresh_token ?? data?.refresh_token) as string | undefined;

      if (accessToken && newRefreshToken && res.ok) {
        localStorage.setItem(config.auth.tokenKey, accessToken);
        localStorage.setItem(config.auth.refreshTokenKey, newRefreshToken);

        // Update auth-client in-memory cache (dynamic import avoids circular dep)
        try {
          const { authApi } = await import('./auth-client');
          authApi.setToken(accessToken, newRefreshToken);
        } catch { /* SSR or import error — localStorage update is sufficient */ }

        // Update Zustand auth store
        try {
          const { useAuthStore } = await import('../stores/auth-store');
          useAuthStore.getState().setToken(accessToken, newRefreshToken);
        } catch { /* SSR or import error */ }

        return { accessToken, refreshToken: newRefreshToken };
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

/**
 * Schedules a token refresh 5 minutes before the current access token expires.
 * Call once after a successful login / initializeAuth. The function is
 * self-rescheduling: after each refresh it calls itself to set up the next timer.
 */
export function startProactiveRefresh(): void {
  if (typeof window === 'undefined') return;

  if (proactiveRefreshTimer !== null) {
    clearTimeout(proactiveRefreshTimer);
    proactiveRefreshTimer = null;
  }

  const token = localStorage.getItem(config.auth.tokenKey);
  if (!token) return;

  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const exp = payload.exp as number | undefined;
    if (!exp) return;

    const msUntilRefresh = exp * 1000 - Date.now() - 5 * 60 * 1000;

    if (msUntilRefresh <= 0) {
      // Token already near/past expiry — refresh immediately then reschedule.
      tokenManager.ensureFreshToken().then(() => startProactiveRefresh());
      return;
    }

    proactiveRefreshTimer = setTimeout(async () => {
      proactiveRefreshTimer = null;
      await tokenManager.ensureFreshToken();
      startProactiveRefresh();
    }, msUntilRefresh);
  } catch {
    // Malformed token — nothing to schedule.
  }
}

/** Cancels any pending proactive-refresh timer (call on logout). */
export function stopProactiveRefresh(): void {
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
  if (newToken) {
    const newRefreshToken = localStorage.getItem(config.auth.refreshTokenKey) ?? '';
    return { accessToken: newToken, refreshToken: newRefreshToken };
  }
  return null;
}
