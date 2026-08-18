import type { NextRequest } from 'next/server';

const ACCESS_COOKIE_BASENAME = 'ebartex_access_token';
const REFRESH_COOKIE_BASENAME = 'ebartex_refresh_token';
const PREAUTH_COOKIE_BASENAME = 'ebartex_pre_auth_token';
const PASSWORD_RESET_COOKIE_BASENAME = 'ebartex_password_reset_token';
const PASSWORD_RESET_CONFIRM_COOKIE_BASENAME = 'ebartex_password_reset_confirm_token';

export type AuthCookieKind =
  | 'access'
  | 'refresh'
  | 'preauth'
  | 'password-reset'
  | 'password-reset-confirm';

const AUTH_COOKIE_BASENAMES: Readonly<Record<AuthCookieKind, string>> = {
  access: ACCESS_COOKIE_BASENAME,
  refresh: REFRESH_COOKIE_BASENAME,
  preauth: PREAUTH_COOKIE_BASENAME,
  'password-reset': PASSWORD_RESET_COOKIE_BASENAME,
  'password-reset-confirm': PASSWORD_RESET_CONFIRM_COOKIE_BASENAME,
};

/**
 * `__Host-` impedisce a qualunque sottodominio di impostare o sovrascrivere la
 * sessione del sito principale. In locale HTTP il prefisso non e' supportato,
 * quindi i test e `next dev` mantengono il nome storico host-only.
 */
export function getAuthCookieName(kind: AuthCookieKind): string {
  const basename = AUTH_COOKIE_BASENAMES[kind];
  return process.env.NODE_ENV === 'production' ? `__Host-${basename}` : basename;
}

export function readAuthCookie(request: NextRequest, kind: AuthCookieKind): string | undefined {
  const hostValue = request.cookies.get(getAuthCookieName(kind))?.value?.trim();
  if (hostValue) return hostValue;
  const legacyValue = request.cookies.get(AUTH_COOKIE_BASENAMES[kind])?.value?.trim();
  return legacyValue || undefined;
}

export function serializeAuthCookie(
  kind: AuthCookieKind,
  value: string,
  maxAge: number,
  secure: boolean,
): string {
  const secureFlag = secure ? '; Secure' : '';
  return `${getAuthCookieName(kind)}=${encodeURIComponent(value)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${Math.max(0, Math.floor(maxAge))}${secureFlag}`;
}

/**
 * Cancella i cookie legacy senza mai scrivere nuovi token sul parent domain.
 * `AUTH_COOKIE_DOMAIN` resta letto soltanto per poter revocare la vecchia
 * configurazione durante il rollout; non viene usato da `serializeAuthCookie`.
 */
export function legacyAuthCookieDeletions(secure: boolean): string[] {
  if (process.env.NODE_ENV !== 'production') return [];
  const secureFlag = secure ? '; Secure' : '';
  const domain = process.env.AUTH_COOKIE_DOMAIN?.trim();
  const names = [ACCESS_COOKIE_BASENAME, REFRESH_COOKIE_BASENAME, PREAUTH_COOKIE_BASENAME];
  const deletions = names.map(
    (name) => `${name}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${secureFlag}`,
  );
  if (domain) {
    for (const name of names) {
      deletions.push(
        `${name}=; Path=/; Domain=${domain}; HttpOnly; SameSite=Lax; Max-Age=0${secureFlag}`,
      );
    }
  }
  return deletions;
}

export function isSecureRequest(request: NextRequest): boolean {
  return (
    process.env.NODE_ENV === 'production' ||
    request.nextUrl.protocol === 'https:' ||
    request.headers.get('x-forwarded-proto')?.split(',')[0]?.trim() === 'https'
  );
}
