/**
 * Proxy to Auction microservice (auction.ebartex.com).
 * Maps /api/auctions/* → AUCTION_API_URL/auctions/*
 *
 * Sicurezza: cookie-first, 401 fail-closed, no-store, rate limit, timeout.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getForwardedAuthorization, extractUserIdForRateLimit } from '@/app/api/_lib/forwarded-authorization';
import { noStoreHeaders, unauthorizedResponse } from '@/app/api/_lib/proxy-response';
import { checkRateLimit, rateLimitExceededResponse } from '@/app/api/_lib/rate-limit';

export const dynamic = 'force-dynamic';

const PROXY_TIMEOUT_MS = 12_000;

const AUCTION_API_URL = (
  process.env.AUCTION_API_URL ||
  process.env.NEXT_PUBLIC_AUCTION_API_URL ||
  ''
).replace(/\/+$/, '');

/**
 * Flusso QR "foto da telefono" senza login.
 *
 * Il telefono non ha cookie di sessione: si autentica presso il microservizio
 * auction con la coppia pairing_session_id + pairing_upload_token (il "pass"
 * contenuto nel QR, breve scadenza, revocabile, limitato al solo upload foto
 * di quella sessione). Il proxy lascia passare SOLO questi tre endpoint senza
 * Authorization e SOLO se il formato di sessione e token è plausibile; la
 * verifica crittografica del token resta al backend. Tutto il resto rimane
 * fail-closed.
 */
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const PAIRING_TOKEN_RE = /^[A-Za-z0-9_-]{16,256}$/;
const GUEST_PAIRING_POST_PATHS = new Set(['photos/init', 'photos/finalize']);
const GUEST_PAIRING_GET_RE = /^photos\/pairing-sessions\/[0-9a-f-]{36}$/i;
const PUBLIC_AUCTION_DETAIL_GET_RE = /^\d+$/;
const PUBLIC_AUCTION_CHILD_GET_RE = /^\d+\/(?:bids|minimum-bid)$/;
const PUBLIC_LISTING_PHOTO_GET_RE = /^photos\/by-listing\/[^/]+$/;

function isPublicAuctionGetPath(path: string): boolean {
  return (
    PUBLIC_AUCTION_DETAIL_GET_RE.test(path) ||
    PUBLIC_AUCTION_CHILD_GET_RE.test(path) ||
    PUBLIC_LISTING_PHOTO_GET_RE.test(path) ||
    path === 'photos/by-listings'
  );
}

function isGuestPairingRequest(
  request: NextRequest,
  path: string,
  body: string | undefined
): boolean {
  if (request.method === 'GET') {
    if (!GUEST_PAIRING_GET_RE.test(path)) return false;
    const token =
      request.headers.get('x-pairing-upload-token') ||
      request.headers.get('X-Pairing-Upload-Token') ||
      '';
    return PAIRING_TOKEN_RE.test(token.trim());
  }
  if (request.method === 'POST' && GUEST_PAIRING_POST_PATHS.has(path)) {
    if (!body) return false;
    try {
      const parsed = JSON.parse(body) as {
        pairing_session_id?: unknown;
        pairing_upload_token?: unknown;
      };
      return (
        typeof parsed.pairing_session_id === 'string' &&
        UUID_RE.test(parsed.pairing_session_id) &&
        typeof parsed.pairing_upload_token === 'string' &&
        PAIRING_TOKEN_RE.test(parsed.pairing_upload_token)
      );
    } catch {
      return false;
    }
  }
  return false;
}

async function fetchWithTimeout(url: string, init: RequestInit, timeoutMs: number): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: controller.signal, cache: 'no-store' });
  } finally {
    clearTimeout(id);
  }
}

async function proxy(request: NextRequest, pathSegments: string[]) {
  if (!AUCTION_API_URL) {
    return NextResponse.json(
      { detail: 'AUCTION_API_URL is not configured' },
      { status: 503, headers: noStoreHeaders() }
    );
  }

  const path = pathSegments.join('/');

  // Il body serve prima del check auth per validare le richieste guest QR.
  let body: string | undefined;
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    body = await request.text();
  }

  const auth = getForwardedAuthorization(request);
  const publicGet = request.method === 'GET' && isPublicAuctionGetPath(path);
  const guestPairing = !auth && isGuestPairingRequest(request, path, body);
  if (!auth && !publicGet && !guestPairing) return unauthorizedResponse();

  const userId = auth ? extractUserIdForRateLimit(auth) : undefined;
  const rl = checkRateLimit(request, {
    scope: guestPairing ? 'auctions-guest-pairing' : 'auctions',
    limit: guestPairing ? 30 : 60,
    windowMs: 60_000,
    userId,
  });
  if (!rl.allowed) return rateLimitExceededResponse(rl);

  const targetPath = `/auctions${path ? `/${path}` : ''}`;
  const url = new URL(targetPath, AUCTION_API_URL);
  request.nextUrl.searchParams.forEach((value, key) => {
    url.searchParams.set(key, value);
  });

  const idempotencyKey =
    request.headers.get('idempotency-key') ||
    request.headers.get('Idempotency-Key');
  const requestId =
    request.headers.get('x-request-id') ||
    request.headers.get('X-Request-ID');
  const pairingUploadToken =
    request.headers.get('x-pairing-upload-token') ||
    request.headers.get('X-Pairing-Upload-Token');
  const headers: Record<string, string> = {
    Accept: 'application/json',
    'Content-Type': 'application/json',
    ...(auth ? { Authorization: auth } : {}),
    ...(idempotencyKey ? { 'Idempotency-Key': idempotencyKey } : {}),
    ...(requestId ? { 'X-Request-ID': requestId } : {}),
    ...(pairingUploadToken ? { 'X-Pairing-Upload-Token': pairingUploadToken } : {}),
  };

  if (body) {
    headers['Content-Type'] = request.headers.get('content-type') || 'application/json';
  }

  const isAttachListing = path === 'photos/attach-listing';
  if (isAttachListing) {
    // eslint-disable-next-line no-console
    console.log('[auction proxy] attach-listing request', { targetUrl: url.toString(), body: body ? JSON.parse(body) : undefined });
  }

  try {
    const res = await fetchWithTimeout(url.toString(), { method: request.method, headers, body }, PROXY_TIMEOUT_MS);
    const data = await res.json().catch(() => ({}));
    if (isAttachListing) {
      // eslint-disable-next-line no-console
      console.log('[auction proxy] attach-listing response', { status: res.status, data });
    }
    return NextResponse.json(data, { status: res.status, headers: noStoreHeaders() });
  } catch (err) {
    const isTimeout = err instanceof Error && err.name === 'AbortError';
    if (isAttachListing) {
      // eslint-disable-next-line no-console
      console.error('[auction proxy] attach-listing fetch error', err);
    } else if (!isTimeout) {
      console.error('[auction proxy] fetch error');
    }
    return NextResponse.json(
      { detail: isTimeout ? 'Timeout: auction service non ha risposto.' : 'Auction proxy request failed' },
      { status: isTimeout ? 504 : 502, headers: noStoreHeaders() }
    );
  }
}

type RouteContext = { params: Promise<{ path: string[] }> };

export async function GET(request: NextRequest, context: RouteContext) {
  const { path } = await context.params;
  return proxy(request, path);
}

export async function POST(request: NextRequest, context: RouteContext) {
  const { path } = await context.params;
  return proxy(request, path);
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  const { path } = await context.params;
  return proxy(request, path);
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  const { path } = await context.params;
  return proxy(request, path);
}
