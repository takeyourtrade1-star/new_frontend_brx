/**
 * Durable marketplace report adapter. A report is acknowledged only when the
 * trust-and-safety backend returns a receipt id; otherwise this route fails
 * closed and the UI must not claim success.
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getForwardedAuthorization, extractUserIdForRateLimit } from '@/app/api/_lib/forwarded-authorization';
import { noStoreHeaders, unauthorizedResponse } from '@/app/api/_lib/proxy-response';
import { checkRateLimit, rateLimitExceededResponse } from '@/app/api/_lib/rate-limit';
import { readTextBodyWithLimit } from '@/app/api/_lib/request-body';
import { enforceSameOrigin } from '@/app/api/_lib/request-security';
import { readJsonResponseWithLimit } from '@/app/api/_lib/bounded-json-response';
import { MARKETPLACE_REPORT_REASONS } from '@/lib/marketplace/report-reasons';
import { trustedMarketplaceServiceOrigin } from '@/app/api/_lib/upstream-url';
import { fetchWithBodyDeadline } from '@/app/api/_lib/upstream-fetch';
import { getMarketplaceApiUrlEnv } from '@/lib/server-runtime-env';

export const dynamic = 'force-dynamic';

const MARKETPLACE_API_URL = trustedMarketplaceServiceOrigin(getMarketplaceApiUrlEnv());
const MAX_REPORT_BODY_BYTES = 32 * 1024;
const MAX_REPORT_RESPONSE_BYTES = 256 * 1024;

const bodySchema = z.object({
  sellerUsername: z.string().trim().min(1).max(120),
  sellerId: z.string().trim().max(120).optional(),
  kind: z.enum(['listing', 'auction']),
  referenceId: z.string().trim().min(1).max(120),
  referenceLabel: z.string().trim().max(200).optional(),
  reason: z.enum(MARKETPLACE_REPORT_REASONS),
  details: z.string().trim().max(2000).optional(),
});

function extractReceiptId(payload: unknown): string | null {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) return null;
  const record = payload as Record<string, unknown>;
  const value = record.report_id ?? record.reportId ?? record.ticket_id ?? record.ticketId ?? record.id;
  if (typeof value === 'string' || typeof value === 'number') {
    const receipt = String(value).trim();
    return receipt ? receipt.slice(0, 200) : null;
  }
  if (record.data) return extractReceiptId(record.data);
  return null;
}

export async function POST(request: NextRequest) {
  const originViolation = enforceSameOrigin(request);
  if (originViolation) return originViolation;

  const auth = getForwardedAuthorization(request);
  if (!auth) return unauthorizedResponse();

  const rl = await checkRateLimit(request, {
    scope: 'marketplace-reports',
    limit: 10,
    windowMs: 60_000,
    userId: extractUserIdForRateLimit(auth),
  });
  if (!rl.allowed) return rateLimitExceededResponse(rl);

  let body: unknown;
  try {
    const bodyResult = await readTextBodyWithLimit(request, MAX_REPORT_BODY_BYTES);
    if (bodyResult.tooLarge) {
      return NextResponse.json(
        { detail: 'Dati segnalazione non validi.' },
        { status: 413, headers: noStoreHeaders() },
      );
    }
    body = JSON.parse(bodyResult.body || '{}') as unknown;
  } catch {
    return NextResponse.json(
      { detail: 'Dati segnalazione non validi.' },
      { status: 400, headers: noStoreHeaders() },
    );
  }

  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { detail: 'Dati segnalazione non validi.' },
      { status: 400, headers: noStoreHeaders() },
    );
  }

  if (!MARKETPLACE_API_URL) {
    return NextResponse.json(
      { detail: 'Servizio segnalazioni temporaneamente non disponibile.' },
      { status: 503, headers: noStoreHeaders() },
    );
  }

  try {
    const upstream = await fetchWithBodyDeadline(`${MARKETPLACE_API_URL}/api/v1/reports`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Accept-Encoding': 'identity',
        Authorization: auth,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(parsed.data),
      cache: 'no-store',
      redirect: 'error',
    }, 10_000);
    if (!upstream.ok) await upstream.body?.cancel();
    const payload = upstream.ok
      ? await readJsonResponseWithLimit(upstream, MAX_REPORT_RESPONSE_BYTES)
      : null;
    const reportId = extractReceiptId(payload);

    if (!upstream.ok || !reportId) {
      return NextResponse.json(
        { detail: 'Invio segnalazione non riuscito.' },
        { status: upstream.status === 429 ? 429 : 502, headers: noStoreHeaders() },
      );
    }

    return NextResponse.json(
      { ok: true, reportId },
      { status: 202, headers: noStoreHeaders() },
    );
  } catch {
    return NextResponse.json(
      { detail: 'Servizio segnalazioni temporaneamente non disponibile.' },
      { status: 502, headers: noStoreHeaders() },
    );
  }
}
