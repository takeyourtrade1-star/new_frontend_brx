import { NextResponse } from 'next/server';

import { noStoreHeaders } from '@/app/api/_lib/proxy-response';
import {
  getBrxMatchBaseUrl,
  getScannerBudgetMode,
  getScannerEdgeModelBytes,
  isScannerEdgeEnabled,
  SCANNER_LIMITS,
  SCANNER_TIMEOUTS,
} from '@/app/api/scanner/_config';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface BrxHealth {
  status?: 'ok' | 'degraded';
  index_size?: number;
  model_loaded?: boolean;
  rerank_loaded?: boolean;
  pipeline_version?: string;
}

async function readHealth(): Promise<BrxHealth | null> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 2_500);
  try {
    const response = await fetch(`${getBrxMatchBaseUrl()}/brx-match/health`, {
      headers: { Accept: 'application/json' },
      cache: 'no-store',
      signal: controller.signal,
    });
    if (!response.ok) return null;
    return (await response.json()) as BrxHealth;
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

export async function GET() {
  const edgeRequested = isScannerEdgeEnabled();
  // Il percorso standard non paga una richiesta health aggiuntiva a ogni apertura.
  const health = edgeRequested ? await readHealth() : null;
  const pipelineVersion = health?.pipeline_version ?? 'unknown';
  const edgeEnabled =
    edgeRequested &&
    health?.status === 'ok' &&
    health.model_loaded === true &&
    pipelineVersion === 'v2';

  return NextResponse.json(
    {
      api_version: 'scanner-bff-v1',
      backend_available: edgeRequested ? health !== null : null,
      backend_probe: edgeRequested ? 'health' : 'skipped_to_save_request',
      pipeline_version: pipelineVersion,
      index_version: pipelineVersion === 'v2' ? 'dinov2-hnsw-v2' : 'legacy-v1',
      preprocess_version: edgeEnabled ? 'browser-imagenet-v1' : 'server-canonical-v1',
      embedding_dim: edgeEnabled ? 384 : null,
      budget_mode: getScannerBudgetMode(),
      edge: {
        enabled: edgeEnabled,
        model_url: edgeEnabled ? '/api/scanner/static/dinov2_small.onnx' : null,
        model_version: edgeEnabled ? 'dinov2-small-v2' : null,
        model_bytes: edgeEnabled ? getScannerEdgeModelBytes() : null,
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
    { headers: noStoreHeaders() },
  );
}
