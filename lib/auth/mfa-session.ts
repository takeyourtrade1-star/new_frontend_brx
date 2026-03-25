/** Chiave sessionStorage per il token pre-auth MFA (breve durata). Non è in localStorage per ridurre la superficie. */
export const MFA_PRE_AUTH_SESSION_KEY = 'ebartex_pre_auth_token';

export function saveMfaPreAuthToken(token: string): void {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.setItem(MFA_PRE_AUTH_SESSION_KEY, token);
  } catch {
    // storage pieno o modalità privata
  }
}

export function readMfaPreAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return sessionStorage.getItem(MFA_PRE_AUTH_SESSION_KEY);
  } catch {
    return null;
  }
}

export function clearMfaPreAuthToken(): void {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.removeItem(MFA_PRE_AUTH_SESSION_KEY);
  } catch {
    // ignore
  }
}
