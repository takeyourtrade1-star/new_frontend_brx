/**
 * Legacy cleanup shim. MFA pre-auth credentials are now stored exclusively in
 * an HttpOnly host-only cookie by the BFF and are never readable by JavaScript.
 */
export const MFA_PRE_AUTH_SESSION_KEY = 'ebartex_pre_auth_token';

/** @deprecated The BFF owns the MFA session. */
export function saveMfaPreAuthToken(_token: string): void {
  clearMfaPreAuthToken();
}

/** @deprecated HttpOnly credentials are intentionally not readable here. */
export function readMfaPreAuthToken(): null {
  return null;
}

export function clearMfaPreAuthToken(): void {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.removeItem(MFA_PRE_AUTH_SESSION_KEY);
  } catch {
    // Ignore unavailable browser storage.
  }
}
