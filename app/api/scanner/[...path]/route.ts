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
  SCANNER_TIMEOUTS,
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
  scan: SCANNER_TIMEOUTS.recognitionUpstreamMs,
  'search-vector': SCANNER_TIMEOUTS.recognitionUpstreamMs,
  verify: SCANNER_TIMEOUTS.recognitionUpstreamMs,
  'static/dinov2_small.onnx': SCANNER_TIMEOUTS.modelUpstreamMs,
};

type AbortCause = 'client' | 'timeout';

interface ProxyTimings {
  requestBodyMs: number;
  upstreamTtfbMs?: number;
  upstreamBodyMs?: number;
  upstreamTotalMs?: number;
  responsePrepMs?: number;
  totalMs?: number;
}

function parsePath(segments: string[]): ScannerPath | null {
  const path = segments.join('/');
  return path in ALLOWED_METHODS ? (path as ScannerPath) : null;
}

function timingHeader(timings: ProxyTimings): string {
  const metrics: string[] = [`request_body;dur=${timings.requestBodyMs.toFixed(1)}`];
  if (timings.upstreamTtfbMs !== undefined) {
    metrics.push(`upstream_ttfb;dur=${timings.upstreamTtfbMs.toFixed(1)}`);
  }
  if (timings.upstreamBodyMs !== undefined) {
    metrics.push(`upstream_body;dur=${timings.upstreamBodyMs.toFixed(1)}`);
  }
  if (timings.upstreamTotalMs !== undefined) {
    metrics.push(`upstream_total;dur=${timings.upstreamTotalMs.toFixed(1)}`);
  }
  if (timings.responsePrepMs !== undefined) {
    metrics.push(`response_prep;dur=${timings.responsePrepMs.toFixed(1)}`);
  }
  if (timings.totalMs !== undefined) {
    metrics.push(`bff_total;dur=${timings.totalMs.toFixed(1)}`);
  }
  return metrics.join(', ');
}

function diagnosticHeaders(
  timeoutMs: number,
  timings: ProxyTimings,
  responseMode: 'buffered' | 'streamed',
  extra?: HeadersInit,
): Headers {
  const headers = noStoreHeaders(extra);
  headers.set('Server-Timing', timingHeader(timings));
  headers.set('X-Scanner-Upstream-Timeout-Ms', String(timeoutMs));
  headers.set('X-Scanner-Response-Mode', responseMode);
  return headers;
}

function errorResponse(
  detail: string,
  status: number,
  options?: {
    abortCause?: AbortCause;
    timeoutMs?: number;
    timings?: ProxyTimings;
  },
): NextResponse {
  const body: {
    detail: string;
    code?: 'SCANNER_CLIENT_ABORTED' | 'SCANNER_UPSTREAM_TIMEOUT';
    timeout_ms?: number;
  } = { detail };
  if (options?.abortCause === 'client') body.code = 'SCANNER_CLIENT_ABORTED';
  if (options?.abortCause === 'timeout') {
    body.code = 'SCANNER_UPSTREAM_TIMEOUT';
    body.timeout_ms = options.timeoutMs;
  }

  const headers =
    options?.timeoutMs !== undefined && options.timings
      ? diagnosticHeaders(options.timeoutMs, options.timings, 'buffered')
      : noStoreHeaders();
  if (options?.abortCause) headers.set('X-Scanner-Abort-Cause', options.abortCause);
  return NextResponse.json(body, { status, headers });
}

async function proxyScanner(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> },
): Promise<Response> {
  const startedAt = performance.now();
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

  const timeoutMs = TIMEOUT_MS[path];
  const controller = new AbortController();
  let abortCause: AbortCause | undefined;
  const abortFromClient = () => {
    if (abortCause) return;
    abortCause = 'client';
    controller.abort(new DOMException('Client disconnected', 'AbortError'));
  };

  let body: ArrayBuffer | undefined;
  const bodyStartedAt = performance.now();
  try {
    if (request.method === 'POST') {
      // Il buffering resta intenzionale: consente di applicare il limite anche
      // quando Content-Length manca, prima di inviare dati al matcher.
      body = await request.arrayBuffer();
      if (maxBodyBytes && body.byteLength > maxBodyBytes) {
        return errorResponse('Payload scanner troppo grande', 413);
      }
    }
  } catch {
    if (request.signal.aborted) {
      return errorResponse('Richiesta scanner annullata dal client', 499, {
        abortCause: 'client',
        timeoutMs,
        timings: { requestBodyMs: performance.now() - bodyStartedAt },
      });
    }
    return errorResponse('Payload scanner non leggibile', 400);
  }
  const requestBodyMs = performance.now() - bodyStartedAt;

  request.signal.addEventListener('abort', abortFromClient, { once: true });
  if (request.signal.aborted) abortFromClient();
  if (abortCause === 'client') {
    request.signal.removeEventListener('abort', abortFromClient);
    return errorResponse('Richiesta scanner annullata dal client', 499, {
      abortCause,
      timeoutMs,
      timings: { requestBodyMs },
    });
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

  const upstreamStartedAt = performance.now();
  const timeout = setTimeout(() => {
    if (abortCause) return;
    abortCause = 'timeout';
    controller.abort(new DOMException('Scanner upstream timeout', 'TimeoutError'));
  }, timeoutMs);
  let upstreamHeadersAt: number | undefined;
  try {
    const response = await fetch(upstreamUrl, {
      method: request.method,
      headers,
      body,
      cache: 'no-store',
      signal: controller.signal,
    });
    upstreamHeadersAt = performance.now();
    const upstreamTtfbMs = upstreamHeadersAt - upstreamStartedAt;

    // Il modello può essere molto grande e resta in streaming. Le risposte di
    // riconoscimento sono JSON piccole: bufferizzarle permette di misurare
    // separatamente TTFB, lettura upstream e durata totale.
    if (path === 'static/dinov2_small.onnx') {
      const responsePrepStartedAt = performance.now();
      const proxiedResponse = new Response(response.body, {
        status: response.status,
        headers: diagnosticHeaders(
          timeoutMs,
          {
            requestBodyMs,
            upstreamTtfbMs,
          },
          'streamed',
          {
            'Content-Type': response.headers.get('content-type') || 'application/octet-stream',
          },
        ),
      });
      const responsePreparedAt = performance.now();
      proxiedResponse.headers.set(
        'Server-Timing',
        timingHeader({
          requestBodyMs,
          upstreamTtfbMs,
          responsePrepMs: responsePreparedAt - responsePrepStartedAt,
          totalMs: responsePreparedAt - startedAt,
        }),
      );
      return proxiedResponse;
    }

    const upstreamBody = await response.arrayBuffer();
    const upstreamFinishedAt = performance.now();
    const responsePrepStartedAt = performance.now();
    const responseHeaders = diagnosticHeaders(timeoutMs, {
      requestBodyMs,
      upstreamTtfbMs,
      upstreamBodyMs: upstreamFinishedAt - upstreamHeadersAt,
      upstreamTotalMs: upstreamFinishedAt - upstreamStartedAt,
    }, 'buffered', {
      'Content-Type': response.headers.get('content-type') || 'application/json',
    });
    const proxiedResponse = new Response(upstreamBody, {
      status: response.status,
      headers: responseHeaders,
    });
    const responsePreparedAt = performance.now();
    proxiedResponse.headers.set(
      'Server-Timing',
      timingHeader({
        requestBodyMs,
        upstreamTtfbMs,
        upstreamBodyMs: upstreamFinishedAt - upstreamHeadersAt,
        upstreamTotalMs: upstreamFinishedAt - upstreamStartedAt,
        responsePrepMs: responsePreparedAt - responsePrepStartedAt,
        totalMs: responsePreparedAt - startedAt,
      }),
    );
    return proxiedResponse;
  } catch (error) {
    const failedAt = performance.now();
    const timings = {
      requestBodyMs,
      ...(upstreamHeadersAt !== undefined
        ? {
            upstreamTtfbMs: upstreamHeadersAt - upstreamStartedAt,
            upstreamBodyMs: failedAt - upstreamHeadersAt,
          }
        : {}),
      upstreamTotalMs: failedAt - upstreamStartedAt,
      totalMs: failedAt - startedAt,
    };
    // Il listener può mutare la causa durante l'await di fetch; il cast rende
    // esplicita al type checker questa mutazione asincrona.
    const finalAbortCause = abortCause as AbortCause | undefined;
    if (finalAbortCause === 'client') {
      return errorResponse('Richiesta scanner annullata dal client', 499, {
        abortCause: finalAbortCause,
        timeoutMs,
        timings,
      });
    }
    if (finalAbortCause === 'timeout') {
      return errorResponse('Timeout del riconoscimento carta', 504, {
        abortCause: finalAbortCause,
        timeoutMs,
        timings,
      });
    }
    console.error('[scanner proxy]', error);
    return errorResponse('Servizio di riconoscimento non disponibile', 502, {
      timeoutMs,
      timings,
    });
  } finally {
    clearTimeout(timeout);
    request.signal.removeEventListener('abort', abortFromClient);
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
