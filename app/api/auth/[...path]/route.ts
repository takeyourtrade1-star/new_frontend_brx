/**
 * Proxy to Auth microservice.
 * Avoids CORS: browser calls same-origin /api/auth/... and this route forwards to AUTH_API_URL.
 *
 * IMPORTANT: fetch verso l'auth API deve essere sempre no-store. Altrimenti Next può cachare GET
 * come /me e si vedono dati utente obsoleti (es. mfa_enabled false dopo MFA abilitata con successo).
 */

import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const AUTH_API_URL = (
  process.env.NEXT_PUBLIC_AUTH_API_URL ||
  process.env.AUTH_API_URL ||
  process.env.VITE_AWS_AUTH_URL ||
  ''
).replace(/\/+$/, '');

const ALLOWED_AUTH_PATHS = [
  'login',
  'register',
  'refresh',
  'me',
  'logout',
  'mfa/enable',
  'mfa/verify',
  'mfa/disable',
  'mfa/status',
  'password/reset',
  'password/reset/confirm',
  'verify-email',
  'resend-verification',
];

function isAllowedPath(segments: string[]): boolean {
  const joined = segments.join('/');
  return ALLOWED_AUTH_PATHS.some(
    (allowed) => joined === allowed || joined.startsWith(`${allowed}/`) || joined.startsWith(`${allowed}?`)
  );
}

async function proxy(request: NextRequest, pathSegments: string[]) {
  if (!AUTH_API_URL) {
    return NextResponse.json(
      { detail: 'NEXT_PUBLIC_AUTH_API_URL is not configured' },
      { status: 503 }
    );
  }

  if (!isAllowedPath(pathSegments)) {
    return NextResponse.json(
      { detail: 'Not found' },
      { status: 404 }
    );
  }

  const path = pathSegments.join('/');
  const targetPath = `/api/auth${path ? `/${path}` : ''}`;
  const url = new URL(targetPath, AUTH_API_URL);
  request.nextUrl.searchParams.forEach((value, key) => {
    url.searchParams.set(key, value);
  });

  const auth = request.headers.get('authorization') || request.headers.get('Authorization');
  const headers: Record<string, string> = {
    Accept: 'application/json',
    'Content-Type': 'application/json',
    ...(auth ? { Authorization: auth } : {}),
  };

  let body: string | undefined;
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    body = await request.text();
    if (body) headers['Content-Type'] = request.headers.get('content-type') || 'application/json';
  }

  try {
    const res = await fetch(url.toString(), {
      method: request.method,
      headers,
      body,
      cache: 'no-store',
      next: { revalidate: 0 },
    });
    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, {
      status: res.status,
      headers: {
        'Cache-Control': 'private, no-store, max-age=0, must-revalidate',
      },
    });
  } catch (err) {
    console.error('[auth proxy]', err);
    return NextResponse.json(
      { detail: err instanceof Error ? err.message : 'Proxy request failed' },
      { status: 502 }
    );
  }
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  const { path } = await context.params;
  return proxy(request, path);
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  const { path } = await context.params;
  return proxy(request, path);
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  const { path } = await context.params;
  return proxy(request, path);
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  const { path } = await context.params;
  return proxy(request, path);
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  const { path } = await context.params;
  return proxy(request, path);
}
