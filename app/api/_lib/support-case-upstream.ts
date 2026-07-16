import { noStoreHeaders } from '@/app/api/_lib/proxy-response';

const DEFAULT_MARKETPLACE_API_URL = 'https://marketplace-api.ebartex.com';
const SUPPORT_TIMEOUT_MS = 8_000;

function getMarketplaceApiUrl(): string {
  return (
    process.env.MARKETPLACE_API_URL
    || process.env.NEXT_PUBLIC_MARKETPLACE_API_URL
    || DEFAULT_MARKETPLACE_API_URL
  ).replace(/\/+$/, '');
}

export interface SupportCaseUpstreamResult {
  readonly status: number;
  readonly data: Record<string, unknown>;
}

export async function createSupportCaseUpstream(
  authorization: string,
  idempotencyKey: string,
  payload: Record<string, unknown>,
): Promise<SupportCaseUpstreamResult> {
  const response = await fetch(`${getMarketplaceApiUrl()}/api/v1/support/cases`, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      Authorization: authorization,
      'Content-Type': 'application/json',
      'X-Idempotency-Key': idempotencyKey,
    },
    body: JSON.stringify(payload),
    cache: 'no-store',
    signal: AbortSignal.timeout(SUPPORT_TIMEOUT_MS),
  });
  const data = (await response.json().catch(() => ({}))) as Record<string, unknown>;
  return { status: response.status, data };
}

export function supportCaseErrorResponse(
  status: number,
  data: Record<string, unknown>,
): Response {
  const safeStatus = status >= 400 && status < 500 ? status : 502;
  const detail =
    safeStatus === status && typeof data.detail === 'string'
      ? data.detail
      : 'Servizio assistenza temporaneamente non disponibile.';
  return Response.json({ detail }, { status: safeStatus, headers: noStoreHeaders() });
}
