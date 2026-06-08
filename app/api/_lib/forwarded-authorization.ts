import type { NextRequest } from 'next/server';

function safeDecodeURIComponent(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function normalizeBearerHeader(value: string | null): string | undefined {
  if (!value) return undefined;
  const v = value.trim();
  if (!v) return undefined;
  if (/^Bearer\s*$/i.test(v)) return undefined;
  return v;
}

/**
 * Restituisce il nome del cookie di sessione al momento della chiamata (lazy).
 * In produzione (HTTPS) usa il prefisso `__Host-` per massima sicurezza.
 * In sviluppo/test usa il nome semplice (HTTP localhost non supporta __Host-).
 * La valutazione è lazy per evitare problemi con il caching dei moduli in test.
 */
function getSessionCookieName(): string {
  const isDev = process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test';
  return isDev ? 'ebartex_access_token' : '__Host-ebartex_access_token';
}

/**
 * Value for ``Authorization`` when proxying browser requests to upstream APIs.
 *
 * Cookie-first: legge esclusivamente il cookie HttpOnly impostato dal BFF
 * /api/auth al login/refresh. Il nome del cookie viene determinato a runtime
 * (lazy) per supportare sia produzione (__Host-) che sviluppo/test (plain).
 *
 * Se il cookie è assente, ritorna `undefined` e il proxy deve rispondere 401.
 */
export function getForwardedAuthorization(request: NextRequest): string | undefined {
  const cookieName = getSessionCookieName();
  const tokenFromCookie = request.cookies.get(cookieName)?.value;
  if (tokenFromCookie) {
    const decoded = safeDecodeURIComponent(tokenFromCookie).trim();
    if (decoded) return `Bearer ${decoded}`;
  }

  // Fallback: Authorization header (es. chiamate programmatiche server-side).
  // Non deve prevalere sul cookie: già verificato sopra che il cookie è assente.
  const incoming =
    request.headers.get('authorization') || request.headers.get('Authorization');
  return normalizeBearerHeader(incoming);
}

/**
 * Best-effort extraction of the JWT subject (user id) for rate-limiting keys.
 * NOT for authorization decisions — the signature is not verified here, the
 * backend remains the source of truth for identity. Returns `undefined` on
 * any parse failure so callers fall back to IP-only limiting.
 */
export function extractUserIdForRateLimit(authorization: string | undefined): string | undefined {
  if (!authorization) return undefined;
  const match = /^Bearer\s+(.+)$/i.exec(authorization.trim());
  if (!match) return undefined;
  const token = match[1];
  const parts = token.split('.');
  if (parts.length < 2) return undefined;
  try {
    const payloadJson = Buffer.from(
      parts[1].replace(/-/g, '+').replace(/_/g, '/'),
      'base64'
    ).toString('utf8');
    const payload = JSON.parse(payloadJson) as Record<string, unknown>;
    const sub = payload.sub ?? payload.user_id ?? payload.uid ?? payload.id;
    if (typeof sub === 'string' || typeof sub === 'number') return String(sub);
    return undefined;
  } catch {
    return undefined;
  }
}
