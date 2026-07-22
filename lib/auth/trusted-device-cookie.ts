/**
 * Contratto cookie per i dispositivi MFA attendibili.
 *
 * Il prefisso `__Host-` impone Secure, Path=/ e assenza di Domain: la fiducia
 * resta confinata a questo host e non viene condivisa con altri sottodomini.
 */
export const MFA_TRUST_COOKIE = '__Host-ebartex_mfa_trust';
export const MFA_TRUST_MAX_AGE = 60 * 60 * 24 * 30;

export interface TrustedDeviceCookieUpdate {
  value: string;
  maxAge: number;
}

export interface TrustedDeviceAuthPolicy {
  forwardCookie: boolean;
  forwardUserAgent: boolean;
  acceptSetCookie: boolean;
}

const TRUST_COOKIE_CONSUMERS = new Set([
  '/api/auth/login',
  '/api/auth/login/code/verify',
]);

const TRUST_COOKIE_ISSUERS = new Set([
  ...TRUST_COOKIE_CONSUMERS,
  '/api/auth/verify-mfa',
]);

/** Allowlist a confronto esatto: nessun sotto-path eredita credenziali MFA. */
export function getTrustedDeviceAuthPolicy(path: string): TrustedDeviceAuthPolicy {
  return {
    forwardCookie: TRUST_COOKIE_CONSUMERS.has(path),
    forwardUserAgent: TRUST_COOKIE_ISSUERS.has(path),
    acceptSetCookie: TRUST_COOKIE_ISSUERS.has(path),
  };
}

/** RFC 6265 cookie-octet, senza virgolette: evita anche header injection. */
function isSafeCookieValue(value: string): boolean {
  return (
    value.length > 0 &&
    value.length <= 4096 &&
    /^[\x21\x23-\x2B\x2D-\x3A\x3C-\x5B\x5D-\x7E]+$/.test(value)
  );
}

/** Header Cookie minimo: non inoltriamo al backend gli altri cookie del sito. */
export function buildTrustedDeviceRequestCookie(value: string | undefined): string | null {
  if (!value || !isSafeCookieValue(value)) return null;
  return `${MFA_TRUST_COOKIE}=${value}`;
}

/**
 * Legge soltanto il cookie trusted-device dalle risposte del backend.
 * Max-Age viene limitato al massimo concordato; un valore vuoto/zero lo cancella.
 */
export function parseTrustedDeviceSetCookies(
  setCookieHeaders: readonly string[]
): TrustedDeviceCookieUpdate | null {
  const prefix = `${MFA_TRUST_COOKIE}=`;

  for (const header of setCookieHeaders) {
    if (!header.startsWith(prefix)) continue;

    const parts = header.split(';').map((part) => part.trim());
    const value = parts[0]?.slice(prefix.length) ?? '';
    const maxAgePart = parts.find((part) => /^max-age=/i.test(part));
    const parsedMaxAge = maxAgePart
      ? Number.parseInt(maxAgePart.slice(maxAgePart.indexOf('=') + 1), 10)
      : MFA_TRUST_MAX_AGE;

    if (!value || !isSafeCookieValue(value) || !Number.isFinite(parsedMaxAge) || parsedMaxAge <= 0) {
      return { value: '', maxAge: 0 };
    }

    return {
      value,
      maxAge: Math.min(parsedMaxAge, MFA_TRUST_MAX_AGE),
    };
  }

  return null;
}

export function getSetCookieHeaders(headers: Headers): string[] {
  const withGetSetCookie = headers as Headers & { getSetCookie?: () => string[] };
  const values = withGetSetCookie.getSetCookie?.();
  if (values?.length) return values;

  const single = headers.get('set-cookie');
  return single ? [single] : [];
}

/** Serializzazione canonica: il backend non può allargare scope o durata. */
export function serializeTrustedDeviceCookie(update: TrustedDeviceCookieUpdate): string {
  return [
    `${MFA_TRUST_COOKIE}=${update.value}`,
    'Path=/',
    'HttpOnly',
    'Secure',
    'SameSite=Lax',
    `Max-Age=${update.maxAge}`,
  ].join('; ');
}
