import { NextRequest, NextResponse } from 'next/server';

import {
  extractUserIdForRateLimit,
  getForwardedAuthorization,
} from '@/app/api/_lib/forwarded-authorization';
import { noStoreHeaders } from '@/app/api/_lib/proxy-response';
import { checkRateLimit, rateLimitExceededResponse } from '@/app/api/_lib/rate-limit';
import {
  getBrxMatchBaseUrl,
  getScannerBudgetMode,
  SCANNER_LIMITS,
} from '@/app/api/scanner/_config';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type ScannerPath = 'scan' | 'search-vector' | 'verify' | 'static/dinov2_small.onnx';

const ALLOWED_METHODS: Record<ScannerPath, 'GET' | 'POST'> = {
  scan: 'POST',
  'search-vector': 'POST',
  verify: 'POST',
  'static/dinov2_small.onnx': 'GET',
};

const MAX_BODY_BYTES: Partial<Record<ScannerPath, number>> = {
  scan: SCANNER_LIMITS.maxScanBytes,
  'search-vector': SCANNER_LIMITS.maxVectorBytes,
  verify: SCANNER_LIMITS.maxVerifyBytes,
};

const TIMEOUT_MS: Record<ScannerPath, number> = {
  scan: 8_000,
  'search-vector': 4_000,
  verify: 5_000,
  'static/dinov2_small.onnx': 60_000,
};

function parsePath(segments: string[]): ScannerPath | null {
  const path = segments.join('/');
  return path in ALLOWED_METHODS ? (path as ScannerPath) : null;
}

function errorResponse(detail: string, status: number): NextResponse {
  return NextResponse.json({ detail }, { status, headers: noStoreHeaders() });
}

async function proxyScanner(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> },
): Promise<Response> {
  const { path: segments } = await context.params;
  const path = parsePath(segments);
  if (!path) return errorResponse('Endpoint scanner non disponibile', 404);
  if (request.method !== ALLOWED_METHODS[path]) {
    return errorResponse('Metodo non consentito', 405);
  }

  const budgetMode = getScannerBudgetMode();
  if (budgetMode === 'edge_only' && (path === 'scan' || path === 'verify')) {
    return errorResponse('Verifica server sospesa: completa la revisione manualmente', 503);
  }

  const auth = getForwardedAuthorization(request);
  const rateLimit = checkRateLimit(request, {
    scope: path === 'static/dinov2_small.onnx' ? 'scanner-model' : 'scanner-recognition',
    limit: path === 'static/dinov2_small.onnx' ? 4 : SCANNER_LIMITS.requestsPerMinute,
    windowMs: path === 'static/dinov2_small.onnx' ? 60 * 60_000 : 60_000,
    userId: extractUserIdForRateLimit(auth),
  });
  if (!rateLimit.allowed) return rateLimitExceededResponse(rateLimit);

  const maxBodyBytes = MAX_BODY_BYTES[path];
  const declaredLength = Number(request.headers.get('content-length'));
  if (maxBodyBytes && Number.isFinite(declaredLength) && declaredLength > maxBodyBytes) {
    return errorResponse('Payload scanner troppo grande', 413);
  }

  let body: ArrayBuffer | undefined;
  if (request.method === 'POST') {
    body = await request.arrayBuffer();
    if (maxBodyBytes && body.byteLength > maxBodyBytes) {
      return errorResponse('Payload scanner troppo grande', 413);
    }
  }

  const upstreamUrl = new URL(`/brx-match/${path}`, getBrxMatchBaseUrl());
  if (path === 'scan') {
    const mode = request.nextUrl.searchParams.get('mode');
    if (mode === 'auto' || mode === 'fast' || mode === 'full') {
      upstreamUrl.searchParams.set('mode', mode);
    }
  }

  const headers = new Headers({ Accept: request.headers.get('accept') || 'application/json' });
  const contentType = request.headers.get('content-type');
  if (contentType) headers.set('Content-Type', contentType);
  if (auth) headers.set('Authorization', auth);
  const requestId = request.headers.get('x-request-id');
  if (requestId) headers.set('X-Request-ID', requestId);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS[path]);
  try {
    const response = await fetch(upstreamUrl, {
      method: request.method,
      headers,
      body,
      cache: 'no-store',
      signal: controller.signal,
    });
    const responseHeaders = noStoreHeaders({
      'Content-Type': response.headers.get('content-type') || 'application/json',
    });
    return new Response(response.body, {
      status: response.status,
      headers: responseHeaders,
    });
  } catch (error) {
    const timedOut = error instanceof Error && error.name === 'AbortError';
    return errorResponse(
      timedOut ? 'Timeout del riconoscimento carta' : 'Servizio di riconoscimento non disponibile',
      timedOut ? 504 : 502,
    );
  } finally {
    clearTimeout(timeout);
  }
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> },
) {
  return proxyScanner(request, context);
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> },
) {
  return proxyScanner(request, context);
}
