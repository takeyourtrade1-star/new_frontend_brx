import type { NextRequest } from 'next/server';

/**
 * Value for ``Authorization`` when proxying browser requests to upstream APIs.
 * Prefer the incoming Bearer header (set by clients from localStorage); if absent,
 * fall back to the HttpOnly ``ebartex_access_token`` cookie set by the auth proxy
 * on login so server-side proxies still authenticate when LS is missing or cleared.
 */
export function getForwardedAuthorization(request: NextRequest): string | undefined {
  const incoming =
    request.headers.get('authorization') || request.headers.get('Authorization');
  if (incoming) return incoming;
  const tokenFromCookie = request.cookies.get('ebartex_access_token')?.value;
  if (tokenFromCookie) {
    return `Bearer ${decodeURIComponent(tokenFromCookie)}`;
  }
  return undefined;
}
