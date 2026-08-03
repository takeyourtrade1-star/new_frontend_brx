import { NextRequest, NextResponse } from 'next/server';

import { noStoreHeaders } from '@/app/api/_lib/proxy-response';
import { readJsonResponseWithLimit } from '@/app/api/_lib/bounded-json-response';
import { checkRateLimit, rateLimitExceededResponse } from '@/app/api/_lib/rate-limit';
import {
  getBrxMatchBaseUrl,
  getBrxMatchServiceToken,
  getScannerBudgetMode,
  getScannerEdgeModelBytes,
  getScannerEdgeModelSha256,
  isScannerEdgeEnabled,
  MAX_EDGE_MODEL_BYTES,
  SCANNER_LIMITS,
  SCANNER_TIMEOUTS,
} from '@/app/api/scanner/_config';
import { enforceScannerBrowserFetch } from '@/app/api/scanner/_request-security';
import { fetchWithBodyDeadline } from '@/app/api/_lib/upstream-fetch';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface BrxCapabilities {
  status: 'ok';
  pipeline_version: 'v2';
  model_loaded: true;
  index_ready: true;
  edge_model: {
    size: number;
    sha256: string;
  };
}

function parseCapabilities(value: unknown): BrxCapabilities | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const candidate = value as Partial<BrxCapabilities>;
  const edge = candidate.edge_model;
  if (
    candidate.status !== 'ok' ||
    candidate.pipeline_version !== 'v2' ||
    candidate.model_loaded !== true ||
    candidate.index_ready !== true ||
    !edge ||
    !Number.isSafeInteger(edge.size) ||
    edge.size < 100_000 ||
    edge.size > MAX_EDGE_MODEL_BYTES ||
    !/^[0-9a-f]{64}$/i.test(edge.sha256)
  ) {
    return null;
  }
  return {
    status: 'ok',
    pipeline_version: 'v2',
    model_loaded: true,
    index_ready: true,
    edge_model: { size: edge.size, sha256: edge.sha256.toLowerCase() },
  };
}

async function readCapabilities(): Promise<BrxCapabilities | null> {
  const baseUrl = getBrxMatchBaseUrl();
  const serviceToken = getBrxMatchServiceToken();
  if (!baseUrl || (process.env.NODE_ENV === 'production' && serviceToken.length < 32)) {
    return null;
  }
  try {
    const response = await fetchWithBodyDeadline(`${baseUrl}/brx-match/capabilities`, {
      headers: {
        Accept: 'application/json',
        'Accept-Encoding': 'identity',
        'X-Internal-Caller': 'web-bff',
        ...(serviceToken ? { 'X-Internal-Token': serviceToken } : {}),
      },
      cache: 'no-store',
      redirect: 'error',
    }, 2_500);
    if (!response.ok) {
      await response.body?.cancel();
      return null;
    }
    return parseCapabilities(await readJsonResponseWithLimit(response, 16 * 1_024));
  } catch {
    return null;
  }
}

export async function GET(request: NextRequest) {
  const resourceViolation = enforceScannerBrowserFetch(request);
  if (resourceViolation) return resourceViolation;

  const rateLimit = await checkRateLimit(request, {
    scope: 'scanner-capabilities',
    limit: 30,
    windowMs: 60_000,
  });
  if (!rateLimit.allowed) return rateLimitExceededResponse(rateLimit);

  const edgeRequested = isScannerEdgeEnabled();
  const capabilities = edgeRequested ? await readCapabilities() : null;
  const pipelineVersion = capabilities?.pipeline_version ?? 'unknown';
  const configuredBytes = getScannerEdgeModelBytes();
  const configuredSha256 = getScannerEdgeModelSha256();
  const edgeEnabled =
    edgeRequested &&
    capabilities !== null &&
    capabilities.edge_model.size === configuredBytes &&
    (!configuredSha256 || capabilities.edge_model.sha256 === configuredSha256);

  return NextResponse.json(
    {
      api_version: 'scanner-bff-v1',
      backend_available: edgeRequested ? capabilities !== null : null,
      backend_probe: edgeRequested ? 'authenticated_capabilities' : 'skipped_to_save_request',
      pipeline_version: pipelineVersion,
      index_version: pipelineVersion === 'v2' ? 'dinov2-hnsw-v2' : 'legacy-v1',
      preprocess_version: edgeEnabled ? 'browser-imagenet-v1' : 'server-canonical-v1',
      embedding_dim: edgeEnabled ? 384 : null,
      budget_mode: getScannerBudgetMode(),
      edge: {
        enabled: edgeEnabled,
        model_url: edgeEnabled ? '/api/scanner/static/dinov2_small.onnx' : null,
        model_version: edgeEnabled ? 'dinov2-small-v2' : null,
        model_bytes: edgeEnabled ? capabilities.edge_model.size : null,
        model_sha256: edgeEnabled ? capabilities.edge_model.sha256 : null,
      },
      limits: {
        requests_per_minute: SCANNER_LIMITS.requestsPerMinute,
        max_scan_bytes: SCANNER_LIMITS.maxScanBytes,
        max_verify_bytes: SCANNER_LIMITS.maxVerifyBytes,
      },
      timeouts: {
        client_request_ms: SCANNER_TIMEOUTS.clientRequestMs,
        recognition_upstream_ms: SCANNER_TIMEOUTS.recognitionUpstreamMs,
        model_upstream_ms: SCANNER_TIMEOUTS.modelUpstreamMs,
      },
    },
    {
      headers: noStoreHeaders({
        'Cross-Origin-Resource-Policy': 'same-origin',
        'X-Content-Type-Options': 'nosniff',
      }),
    },
  );
}
