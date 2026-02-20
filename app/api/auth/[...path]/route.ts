/**
 * Proxy to Auth microservice.
 * Avoids CORS: browser calls same-origin /api/auth/... and this route forwards to AUTH_API_URL.
 */

import { NextRequest, NextResponse } from 'next/server';

const AUTH_API_URL = (
  process.env.NEXT_PUBLIC_AUTH_API_URL ||
  process.env.AUTH_API_URL ||
  process.env.VITE_AWS_AUTH_URL ||
  ''
).replace(/\/+$/, '');

async function proxy(request: NextRequest, pathSegments: string[]) {
  if (!AUTH_API_URL) {
    return NextResponse.json(
      { detail: 'NEXT_PUBLIC_AUTH_API_URL is not configured' },
      { status: 503 }
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
    });
    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
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
