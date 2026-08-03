import { NextRequest, NextResponse } from 'next/server';
import {
  extractUserIdForRateLimit,
  getForwardedAuthorization,
} from '@/app/api/_lib/forwarded-authorization';
import { noStoreHeaders, unauthorizedResponse } from '@/app/api/_lib/proxy-response';
import { checkRateLimit, rateLimitExceededResponse } from '@/app/api/_lib/rate-limit';
import { readTextBodyWithLimit } from '@/app/api/_lib/request-body';
import { enforceSameOrigin } from '@/app/api/_lib/request-security';
import { normalizeProxyPathSegments } from '@/app/api/_lib/safe-proxy-path';
import { readJsonResponseWithLimit } from '@/app/api/_lib/bounded-json-response';
import { trustedServiceOrigin } from '@/app/api/_lib/upstream-url';
import { fetchWithBodyDeadline } from '@/app/api/_lib/upstream-fetch';
import { appendQueryWithPolicy, QUERY_INTEGER, QUERY_POSITIVE_INTEGER, type QueryRules } from '@/app/api/_lib/query-policy';

const PROXY_TIMEOUT_MS = 12_000;
const MAX_TRADE_BODY_BYTES = 256 * 1024;
const MAX_TRADE_RESPONSE_BYTES = 2 * 1024 * 1024;
const AUCTION_API_URL = trustedServiceOrigin(
  process.env.AUCTION_API_URL
);

function isAllowedTradePath(path: string, method: string): boolean {
  if (!path) return method === 'GET' || method === 'POST';
  if (method === 'GET' && /^\d{1,18}(?:\/history)?$/.test(path)) return true;
  if (method !== 'POST') return false;
  return /^\d{1,18}\/(?:accept|decline|cancel|counter|ship|confirm-receipt|request-cancel|confirm-cancel|assistance)$/.test(path);
}

export async function proxyTrade(request: NextRequest, pathSegments: string[]) {
  const path = normalizeProxyPathSegments(pathSegments);
  if (path === null) {
    return NextResponse.json(
      { detail: 'Percorso scambi non valido' },
      { status: 400, headers: noStoreHeaders() },
    );
  }

  if (!isAllowedTradePath(path, request.method)) {
    return NextResponse.json(
      { detail: 'Not found' },
      { status: 404, headers: noStoreHeaders() },
    );
  }

  const originViolation = enforceSameOrigin(request);
  if (originViolation) return originViolation;

  const auth = getForwardedAuthorization(request);
  if (!auth) return unauthorizedResponse();
  if (!AUCTION_API_URL) {
    return NextResponse.json(
      { detail: 'Servizio scambi non disponibile' },
      { status: 503, headers: noStoreHeaders() },
    );
  }
  const limit = await checkRateLimit(request, {
    scope: 'trades',
    limit: 60,
    windowMs: 60_000,
    userId: extractUserIdForRateLimit(auth),
  });
  if (!limit.allowed) return rateLimitExceededResponse(limit);

  const url = new URL(`/trades${path ? `/${path}` : ''}`, AUCTION_API_URL);
  const queryRules: QueryRules = request.method === 'GET' && !path
    ? {
        role: /^(?:sent|received)$/,
        status: /^[a-z_]{1,32}(?:,[a-z_]{1,32})*$/,
        limit: QUERY_POSITIVE_INTEGER,
        offset: QUERY_INTEGER,
      }
    : {};
  if (!appendQueryWithPolicy(url, request.nextUrl, queryRules)) {
    return NextResponse.json({ detail: 'Invalid query parameters' }, { status: 400, headers: noStoreHeaders() });
  }
  const headers: Record<string, string> = {
    Accept: 'application/json',
    'Content-Type': 'application/json',
    Authorization: auth,
  };
  const idempotencyKey = request.headers.get('idempotency-key');
  if (idempotencyKey && /^[A-Za-z0-9._:-]{8,128}$/.test(idempotencyKey)) {
    headers['Idempotency-Key'] = idempotencyKey;
  }

  let body: string | undefined;
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    const bodyResult = await readTextBodyWithLimit(request, MAX_TRADE_BODY_BYTES);
    if (bodyResult.tooLarge) {
      return NextResponse.json(
        { detail: 'Request body too large' },
        { status: 413, headers: noStoreHeaders() },
      );
    }
    body = bodyResult.body;
  }
  try {
    const response = await fetchWithBodyDeadline(url.toString(), {
      method: request.method,
      headers: { ...headers, 'Accept-Encoding': 'identity' },
      body,
      cache: 'no-store',
      redirect: 'error',
    }, PROXY_TIMEOUT_MS);
    if (!response.ok) {
      const payload = (await readJsonResponseWithLimit(response, MAX_TRADE_RESPONSE_BYTES).catch(() => null)) as
        | { code?: unknown }
        | null;
      const code =
        typeof payload?.code === 'string' && /^[A-Z0-9_.-]{1,64}$/i.test(payload.code)
          ? payload.code
          : undefined;
      const status = response.status >= 500 ? 502 : response.status;
      const detail =
        response.status === 401
          ? 'Autenticazione richiesta'
          : response.status === 403
            ? 'Permessi insufficienti'
            : response.status === 404
              ? 'Scambio non trovato'
              : response.status === 409
                ? 'Operazione in conflitto'
                : response.status === 422
                  ? 'Dati richiesta non validi'
                  : 'Operazione scambio non riuscita';
      return NextResponse.json(
        { detail, ...(code ? { code } : {}) },
        { status, headers: noStoreHeaders() },
      );
    }
    const data = await readJsonResponseWithLimit(response, MAX_TRADE_RESPONSE_BYTES);
    return NextResponse.json(data, { status: response.status, headers: noStoreHeaders() });
  } catch (error) {
    const timedOut = error instanceof Error && error.name === 'AbortError';
    if (!timedOut) console.error('[trades proxy] fetch error');
    return NextResponse.json(
      { detail: timedOut ? 'Timeout: trades service non ha risposto.' : 'Trades proxy request failed' },
      { status: timedOut ? 504 : 502, headers: noStoreHeaders() },
    );
  }
}
