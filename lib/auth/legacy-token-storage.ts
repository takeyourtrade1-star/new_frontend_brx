const LEGACY_LOCAL_KEYS = [
  'ebartex_access_token',
  'ebartex_refresh_token',
  'ebartex_user',
] as const;

export function purgeLegacyMfaStorage(): void {
  if (typeof window === 'undefined') return;
  try {
    window.sessionStorage.removeItem('ebartex_pre_auth_token');
  } catch {
    // Browser storage can be unavailable in hardened/private contexts.
  }
}

/**
 * Remove credentials written by pre-cookie-only releases as soon as client
 * code starts. Keeping them until /me completes leaves reusable credentials
 * exposed to any XSS or third-party script during bootstrap.
 */
export function purgeLegacyAuthStorage(): void {
  if (typeof window === 'undefined') return;
  purgeLegacyMfaStorage();

  try {
    for (const key of LEGACY_LOCAL_KEYS) window.localStorage.removeItem(key);

    const persistedAuth = window.localStorage.getItem('ebartex-auth');
    if (!persistedAuth) return;
    try {
      const parsed = JSON.parse(persistedAuth) as { state?: Record<string, unknown> };
      if (parsed.state && typeof parsed.state === 'object') {
        delete parsed.state.accessToken;
        delete parsed.state.refreshToken;
        delete parsed.state.user;
        delete parsed.state.isAuthenticated;
        window.localStorage.setItem('ebartex-auth', JSON.stringify(parsed));
      } else {
        window.localStorage.removeItem('ebartex-auth');
      }
    } catch {
      // A malformed legacy payload is not useful state and must not survive.
      window.localStorage.removeItem('ebartex-auth');
    }
  } catch {
    // The session remains cookie-only even where localStorage is unavailable.
  }
}
