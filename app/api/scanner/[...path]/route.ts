import { NextRequest, NextResponse } from 'next/server';

import { noStoreHeaders } from '@/app/api/_lib/proxy-response';
import { enforceSameOrigin } from '@/app/api/_lib/request-security';
import {
  checkRateLimit,
  getRateLimitClientIp,
  rateLimitExceededResponse,
} from '@/app/api/_lib/rate-limit';
import { readBinaryBodyWithLimit } from '@/app/api/_lib/request-body';
import { readJsonResponseWithLimit } from '@/app/api/_lib/bounded-json-response';
import {
  getBrxMatchBaseUrl,
  getBrxMatchServiceToken,
  getScannerBudgetMode,
  getScannerEdgeModelBytes,
  MAX_EDGE_MODEL_BYTES,
  SCANNER_LIMITS,
  SCANNER_TIMEOUTS,
} from '@/app/api/scanner/_config';
import { enforceScannerBrowserFetch } from '@/app/api/scanner/_request-security';

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
const MAX_RECOGNITION_RESPONSE_BYTES = 2 * 1024 * 1024;
const ALLOWED_MODEL_CONTENT_TYPES = new Set([
  'application/octet-stream',
  'application/onnx',
  'application/x-onnx',
]);

function boundedModelStream(
  body: ReadableStream<Uint8Array>,
  expectedBytes: number,
  lifecycle: {
    signal: AbortSignal;
    deadlineAt: number;
    onDeadline: () => void;
    onConsumerCancel: () => void;
    onFinalize: () => void;
  },
): ReadableStream<Uint8Array> {
  const reader = body.getReader();
  let received = 0;
  let finished = false;
  let cancelPromise: Promise<void> | null = null;
  let streamController: ReadableStreamDefaultController<Uint8Array> | null = null;

  const releaseReader = () => {
    try {
      reader.releaseLock();
    } catch {
      // A pending read keeps the lock until cancellation settles.
    }
  };
  const finalize = () => {
    lifecycle.signal.removeEventListener('abort', abortStream);
    lifecycle.onFinalize();
  };
  const cancelReader = (reason?: unknown): Promise<void> => {
    if (!cancelPromise) {
      cancelPromise = reader
        .cancel(reason)
        .catch(() => undefined)
        .then(() => {
          releaseReader();
        });
    }
    return cancelPromise;
  };
  const fail = (message: string, reason?: unknown) => {
    if (finished) return;
    finished = true;
    try {
      streamController?.error(new Error(message));
    } finally {
      // Never leave a rejected cancellation promise unobserved.
      void cancelReader(reason);
      finalize();
    }
  };
  function abortStream() {
    fail('Scanner model stream aborted', lifecycle.signal.reason);
  }

  return new ReadableStream<Uint8Array>({
    start(controller) {
      streamController = controller;
      lifecycle.signal.addEventListener('abort', abortStream, { once: true });
      if (lifecycle.signal.aborted) abortStream();
    },
    async pull(controller) {
      if (finished) return;
      if (performance.now() >= lifecycle.deadlineAt) {
        lifecycle.onDeadline();
        if (!lifecycle.signal.aborted) {
          fail('Scanner model stream timed out');
        }
        return;
      }
      try {
        const { done, value } = await reader.read();
        if (finished || lifecycle.signal.aborted) return;
        if (done) {
          finished = true;
          if (received !== expectedBytes) {
            controller.error(new Error('Scanner model size mismatch'));
          } else {
            controller.close();
          }
          releaseReader();
          finalize();
          return;
        }
        received += value.byteLength;
        if (received > expectedBytes || received > MAX_EDGE_MODEL_BYTES) {
          fail('Scanner model exceeds configured size');
          return;
        }
        controller.enqueue(value);
      } catch {
        fail('Scanner model stream failed');
      }
    },
    async cancel(reason) {
      if (!finished) {
        finished = true;
        lifecycle.onConsumerCancel();
        finalize();
      }
      await cancelReader(reason);
    },
  });
}

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
  headers.set('X-Content-Type-Options', 'nosniff');
  headers.set('Cross-Origin-Resource-Policy', 'same-origin');
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
  headers.set('X-Content-Type-Options', 'nosniff');
  headers.set('Cross-Origin-Resource-Policy', 'same-origin');
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
  if (request.method === 'POST') {
    const originViolation = enforceSameOrigin(request);
    if (originViolation) return originViolation;
  }
  if (path === 'static/dinov2_small.onnx') {
    const resourceViolation = enforceScannerBrowserFetch(request);
    if (resourceViolation) return resourceViolation;
  }

  const budgetMode = getScannerBudgetMode();
  if (budgetMode === 'edge_only' && (path === 'scan' || path === 'verify')) {
    return errorResponse('Verifica server sospesa: completa la revisione manualmente', 503);
  }

  const brxMatchBaseUrl = getBrxMatchBaseUrl();
  const brxMatchServiceToken = getBrxMatchServiceToken();
  if (
    !brxMatchBaseUrl ||
    (process.env.NODE_ENV === 'production' && brxMatchServiceToken.length < 32)
  ) {
    return errorResponse('Servizio di riconoscimento non disponibile', 503);
  }

  // This value comes only from the infrastructure header policy used by the
  // fail-closed local limiter.  Never derive a trusted downstream subject from
  // the unverified JWT payload.
  const rateClientIp = getRateLimitClientIp(request);
  const rateLimit = await checkRateLimit(request, {
    scope: path === 'static/dinov2_small.onnx' ? 'scanner-model' : 'scanner-recognition',
    limit: path === 'static/dinov2_small.onnx' ? 4 : SCANNER_LIMITS.requestsPerMinute,
    windowMs: path === 'static/dinov2_small.onnx' ? 60 * 60_000 : 60_000,
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
      const result = await readBinaryBodyWithLimit(request, maxBodyBytes || 1);
      if (result.tooLarge) {
        return errorResponse('Payload scanner troppo grande', 413);
      }
      body = result.body?.buffer;
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

  const upstreamUrl = new URL(`/brx-match/${path}`, brxMatchBaseUrl);
  if (path === 'scan') {
    const mode = request.nextUrl.searchParams.get('mode');
    if (mode === 'auto' || mode === 'fast' || mode === 'full') {
      upstreamUrl.searchParams.set('mode', mode);
    }
  }

  const headers = new Headers({ Accept: request.headers.get('accept') || 'application/json' });
  headers.set('X-Internal-Caller', 'web-bff');
  headers.set('Accept-Encoding', 'identity');
  if (brxMatchServiceToken) headers.set('X-Internal-Token', brxMatchServiceToken);
  // BRX Match has no user-authorized operation: do not grant it the access
  // bearer.  The subject is a canonical peer identity resolved from explicitly
  // trusted infrastructure headers, never an attacker-selected JWT `sub`.
  if (rateClientIp !== 'unknown') {
    headers.set('X-Internal-Rate-Subject', `ip:${rateClientIp}`);
  }
  const contentType = request.headers.get('content-type');
  if (contentType) headers.set('Content-Type', contentType);

  const upstreamStartedAt = performance.now();
  const upstreamDeadlineAt = upstreamStartedAt + timeoutMs;
  let timeout: ReturnType<typeof setTimeout> | undefined;
  let lifecycleHandedToStream = false;
  let cleanupComplete = false;
  const cleanupUpstreamLifecycle = () => {
    if (cleanupComplete) return;
    cleanupComplete = true;
    if (timeout !== undefined) clearTimeout(timeout);
    request.signal.removeEventListener('abort', abortFromClient);
  };
  const abortFromTimeout = () => {
    if (abortCause) return;
    abortCause = 'timeout';
    controller.abort(new DOMException('Scanner upstream timeout', 'TimeoutError'));
  };
  timeout = setTimeout(abortFromTimeout, timeoutMs);
  let upstreamHeadersAt: number | undefined;
  try {
    const response = await fetch(upstreamUrl, {
      method: request.method,
      headers,
      body,
      cache: 'no-store',
      redirect: 'error',
      signal: controller.signal,
    });
    upstreamHeadersAt = performance.now();
    const upstreamTtfbMs = upstreamHeadersAt - upstreamStartedAt;

    if (!response.ok) {
      try { await response.body?.cancel(); } catch { /* already closed */ }
      const publicStatus = response.status >= 500 ? 502 : response.status;
      return errorResponse(
        path === 'static/dinov2_small.onnx'
          ? 'Modello scanner non disponibile'
          : 'Riconoscimento carta non disponibile',
        publicStatus,
      );
    }

    // Il modello può superare 80 MiB: resta streaming con un contatore rigido.
    // Le risposte di riconoscimento sono JSON piccole e vengono bufferizzate.
    if (path === 'static/dinov2_small.onnx') {
      const contentType = (response.headers.get('content-type') || '')
        .split(';', 1)[0]
        .trim()
        .toLowerCase();
      if (!ALLOWED_MODEL_CONTENT_TYPES.has(contentType)) {
        try { await response.body?.cancel(); } catch { /* already closed */ }
        return errorResponse('Modello scanner non disponibile', 502);
      }
      const expectedBytes = getScannerEdgeModelBytes();
      const declaredLength = response.headers.get('content-length');
      const contentEncoding = response.headers.get('content-encoding')?.trim().toLowerCase();
      if (
        !response.body ||
        expectedBytes < 100_000 ||
        expectedBytes > MAX_EDGE_MODEL_BYTES ||
        (contentEncoding && contentEncoding !== 'identity') ||
        (declaredLength && (!/^\d+$/.test(declaredLength) || Number(declaredLength) !== expectedBytes))
      ) {
        try { await response.body?.cancel(); } catch { /* already closed */ }
        return errorResponse('Modello scanner non disponibile', 502);
      }
      const responsePrepStartedAt = performance.now();
      const modelStream = boundedModelStream(response.body, expectedBytes, {
        signal: controller.signal,
        deadlineAt: upstreamDeadlineAt,
        onDeadline: abortFromTimeout,
        onConsumerCancel: abortFromClient,
        onFinalize: cleanupUpstreamLifecycle,
      });
      lifecycleHandedToStream = true;
      const proxiedResponse = new Response(modelStream, {
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
            'Content-Disposition': 'attachment; filename="dinov2_small.onnx"',
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

    const recognitionContentType = (response.headers.get('content-type') || '')
      .split(';', 1)[0]
      .trim()
      .toLowerCase();
    if (recognitionContentType !== 'application/json') {
      try { await response.body?.cancel(); } catch { /* already closed */ }
      return errorResponse('Riconoscimento carta non disponibile', 502);
    }
    const upstreamJson = await readJsonResponseWithLimit(
      response,
      MAX_RECOGNITION_RESPONSE_BYTES,
    );
    const upstreamFinishedAt = performance.now();
    const responsePrepStartedAt = performance.now();
    const responseHeaders = diagnosticHeaders(timeoutMs, {
      requestBodyMs,
      upstreamTtfbMs,
      upstreamBodyMs: upstreamFinishedAt - upstreamHeadersAt,
      upstreamTotalMs: upstreamFinishedAt - upstreamStartedAt,
    }, 'buffered', {
      'Content-Type': 'application/json; charset=utf-8',
    });
    const proxiedResponse = new Response(JSON.stringify(upstreamJson), {
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
    console.error(
      '[scanner proxy] upstream failure',
      error instanceof Error ? error.name : 'UnknownError',
    );
    return errorResponse('Servizio di riconoscimento non disponibile', 502, {
      timeoutMs,
      timings,
    });
  } finally {
    if (!lifecycleHandedToStream) cleanupUpstreamLifecycle();
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
