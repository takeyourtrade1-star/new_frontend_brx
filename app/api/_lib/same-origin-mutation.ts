import type { NextRequest } from 'next/server';

function firstHeaderValue(value: string | null): string | null {
  return value?.split(',')[0]?.trim() || null;
}

/** Fail-closed CSRF check for browser mutations authenticated by cookie. */
export function hasSameOrigin(request: NextRequest): boolean {
  const origin = request.headers.get('origin');
  if (!origin) return false;

  try {
    const parsed = new URL(origin);
    const forwardedHost = firstHeaderValue(request.headers.get('x-forwarded-host'));
    const host = forwardedHost ?? firstHeaderValue(request.headers.get('host'));
    const forwardedProto = firstHeaderValue(request.headers.get('x-forwarded-proto'));
    const protocol = forwardedProto ? `${forwardedProto}:` : request.nextUrl.protocol;

    return Boolean(
      host
      && parsed.host.toLowerCase() === host.toLowerCase()
      && parsed.protocol === protocol,
    );
  } catch {
    return false;
  }
}
