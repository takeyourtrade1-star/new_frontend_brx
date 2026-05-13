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
 * Value for ``Authorization`` when proxying browser requests to upstream APIs.
 *
 * Precedence: HttpOnly ``ebartex_access_token`` cookie (set by ``/api/auth`` on
 * login/refresh) **before** the incoming ``Authorization`` header. Clients often
 * send ``Bearer`` from localStorage; that copy can lag behind the cookie after
 * refresh or multi-tab use, which previously caused 401s on BFF routes while the
 * session cookie was still valid.
 *
 * If neither cookie nor a non-empty Bearer header is present, returns undefined.
 */
export function getForwardedAuthorization(request: NextRequest): string | undefined {
  const tokenFromCookie = request.cookies.get('ebartex_access_token')?.value;
  if (tokenFromCookie) {
    const decoded = safeDecodeURIComponent(tokenFromCookie).trim();
    if (decoded) return `Bearer ${decoded}`;
  }

  const incoming =
    request.headers.get('authorization') || request.headers.get('Authorization');
  return normalizeBearerHeader(incoming);
}
