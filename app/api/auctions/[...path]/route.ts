/**
 * Proxy to Auction microservice (auction.ebartex.com).
 * Maps /api/auctions/* → AUCTION_API_URL/auctions/*
 *
 * Sicurezza: cookie-first, 401 fail-closed, no-store, rate limit, timeout.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getForwardedAuthorization, extractUserIdForRateLimit } from '@/app/api/_lib/forwarded-authorization';
import { noStoreHeaders, redactedUpstreamErrorResponse, unauthorizedResponse } from '@/app/api/_lib/proxy-response';
import { checkRateLimit, rateLimitExceededResponse } from '@/app/api/_lib/rate-limit';
import { normalizeProxyPathSegments } from '@/app/api/_lib/safe-proxy-path';
import {
  isAllowedAuctionProxyPath,
  isPublicAuctionProxyGet,
} from '@/app/api/_lib/auction-proxy-policy';
import { enforceSameOrigin } from '@/app/api/_lib/request-security';
import { readTextBodyWithLimit } from '@/app/api/_lib/request-body';
import { readJsonResponseWithLimit } from '@/app/api/_lib/bounded-json-response';
import { trustedAuctionServiceOrigin } from '@/app/api/_lib/upstream-url';
import { fetchWithBodyDeadline } from '@/app/api/_lib/upstream-fetch';
import { appendQueryWithPolicy, QUERY_INTEGER, QUERY_POSITIVE_INTEGER, type QueryRules } from '@/app/api/_lib/query-policy';
import { getAuctionApiUrlEnv } from '@/lib/server-runtime-env';

export const dynamic = 'force-dynamic';

const PROXY_TIMEOUT_MS = 12_000;
const MAX_PROXY_BODY_BYTES = 256 * 1024;
const MAX_PROXY_RESPONSE_BYTES = 2 * 1024 * 1024;

const AUCTION_API_URL = trustedAuctionServiceOrigin(
  getAuctionApiUrlEnv()
);

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
const GUEST_PAIRING_GET_RE = new RegExp(`^photos/pairing-sessions/${UUID_RE.source.slice(1, -1)}$`, 'i');

function auctionQueryRules(path: string, method: string): QueryRules {
  if (method !== 'GET') return {};
  if (/^[A-Za-z0-9_%.-]{1,128}\/bids$/.test(path)) {
    return { limit: QUERY_POSITIVE_INTEGER, offset: QUERY_INTEGER };
  }
  if (path === 'photos/by-listings') {
    return { ids: /^[A-Za-z0-9._~%-]{1,2048}(?:,[A-Za-z0-9._~%-]{1,2048})*$/ };
  }
  return {};
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
  const headers = new Headers(init.headers);
  headers.set('Accept-Encoding', 'identity');
  return fetchWithBodyDeadline(url, {
    ...init,
    headers,
    cache: 'no-store',
    redirect: 'error',
  }, timeoutMs);
}

async function proxy(request: NextRequest, pathSegments: string[]) {
  if (!AUCTION_API_URL) {
    return NextResponse.json(
      { detail: 'Servizio aste non disponibile' },
      { status: 503, headers: noStoreHeaders() }
    );
  }

  const path = normalizeProxyPathSegments(pathSegments);
  if (path === null) {
    return NextResponse.json(
      { detail: 'Percorso non valido' },
      { status: 400, headers: noStoreHeaders() },
    );
  }
  if (!isAllowedAuctionProxyPath('auctions', request.method, path)) {
    return NextResponse.json(
      { detail: 'Not found' },
      { status: 404, headers: noStoreHeaders() },
    );
  }

  const originViolation = enforceSameOrigin(request);
  if (originViolation) return originViolation;

  const auth = getForwardedAuthorization(request);
  const publicGet = request.method === 'GET' && isPublicAuctionProxyGet(path);
  const guestGet = !auth && request.method === 'GET' && isGuestPairingRequest(request, path, undefined);
  const guestPostCandidate =
    !auth && request.method === 'POST' && GUEST_PAIRING_POST_PATHS.has(path);
  if (!auth && !publicGet && !guestGet && !guestPostCandidate) return unauthorizedResponse();

  const userId = auth ? extractUserIdForRateLimit(auth) : undefined;
  const rl = await checkRateLimit(request, {
    scope: guestGet || guestPostCandidate ? 'auctions-guest-pairing' : 'auctions',
    limit: guestGet || guestPostCandidate ? 30 : 60,
    windowMs: 60_000,
    userId,
  });
  if (!rl.allowed) return rateLimitExceededResponse(rl);

  let body: string | undefined;
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    const bodyResult = await readTextBodyWithLimit(request, MAX_PROXY_BODY_BYTES);
    if (bodyResult.tooLarge) {
      return NextResponse.json(
        { detail: 'Request body too large' },
        { status: 413, headers: noStoreHeaders() },
      );
    }
    body = bodyResult.body;
  }

  const guestPairing = !auth && isGuestPairingRequest(request, path, body);
  if (!auth && guestPostCandidate && !guestPairing) return unauthorizedResponse();

  const targetPath = `/auctions${path ? `/${path}` : ''}`;
  const url = new URL(targetPath, AUCTION_API_URL);
  if (!appendQueryWithPolicy(url, request.nextUrl, auctionQueryRules(path, request.method))) {
    return NextResponse.json(
      { detail: 'Invalid query parameters' },
      { status: 400, headers: noStoreHeaders() },
    );
  }

  const idempotencyKey =
    request.headers.get('idempotency-key') ||
    request.headers.get('Idempotency-Key');
  const pairingUploadToken =
    request.headers.get('x-pairing-upload-token') ||
    request.headers.get('X-Pairing-Upload-Token');
  const headers: Record<string, string> = {
    Accept: 'application/json',
    'Content-Type': 'application/json',
    ...(auth ? { Authorization: auth } : {}),
    ...(idempotencyKey && /^[A-Za-z0-9._:-]{8,128}$/.test(idempotencyKey)
      ? { 'Idempotency-Key': idempotencyKey }
      : {}),
    ...(guestPairing && pairingUploadToken
      ? { 'X-Pairing-Upload-Token': pairingUploadToken }
      : {}),
  };

  if (body) {
    headers['Content-Type'] = request.headers.get('content-type') || 'application/json';
  }

  const isAttachListing = path === 'photos/attach-listing';

  try {
    const res = await fetchWithTimeout(url.toString(), { method: request.method, headers, body }, PROXY_TIMEOUT_MS);
    if (!res.ok) return redactedUpstreamErrorResponse(res.status, 'Operazione asta non riuscita');
    const data = await readJsonResponseWithLimit(res, MAX_PROXY_RESPONSE_BYTES);
    return NextResponse.json(data, { status: res.status, headers: noStoreHeaders() });
  } catch (err) {
    const isTimeout = err instanceof Error && err.name === 'AbortError';
    if (isAttachListing) {
      // eslint-disable-next-line no-console
      console.error('[auction proxy] attach-listing fetch error');
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
