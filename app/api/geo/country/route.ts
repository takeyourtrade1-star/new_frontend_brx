import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * Same-origin geo hint for the browser (CSP connect-src stays tight).
 * Uses the caller's IP from trusted proxy headers, then ipapi.co server-side.
 */
function clientIpFromRequest(request: NextRequest): string | null {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    const first = forwarded.split(',')[0]?.trim();
    if (first && isPlausibleClientIp(first)) return first;
  }
  const realIp = request.headers.get('x-real-ip')?.trim();
  if (realIp && isPlausibleClientIp(realIp)) return realIp;
  return null;
}

function isPlausibleClientIp(ip: string): boolean {
  if (!ip || ip.length > 100) return false;
  if (/[\s\r\n@/\\]/.test(ip)) return false;
  return /^[\d.a-fA-F:]+$/.test(ip);
}

export async function GET(request: NextRequest) {
  const ip = clientIpFromRequest(request);
  if (!ip) {
    return NextResponse.json({}, { status: 200 });
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 3000);
  try {
    const upstream = await fetch(`https://ipapi.co/${encodeURIComponent(ip)}/json/`, {
      headers: { Accept: 'application/json' },
      signal: controller.signal,
      cache: 'no-store',
    });
    if (!upstream.ok) {
      return NextResponse.json({}, { status: 200 });
    }
    const data = (await upstream.json()) as Record<string, unknown>;
    const country_code =
      typeof data.country_code === 'string' ? data.country_code : undefined;
    const country_name =
      typeof data.country_name === 'string' ? data.country_name : undefined;
    return NextResponse.json(
      { country_code, country_name },
      { headers: { 'Cache-Control': 'private, max-age=3600' } }
    );
  } catch {
    return NextResponse.json({}, { status: 200 });
  } finally {
    clearTimeout(timeoutId);
  }
}
