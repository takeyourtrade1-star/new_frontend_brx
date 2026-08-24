/**
 * Durable BFF for assistance cases (order_support / general_support).
 * Success only with an upstream receipt id. Browser never sees Marketplace URLs.
 */

import { createHash } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getForwardedAuthorization, extractUserIdForRateLimit } from '@/app/api/_lib/forwarded-authorization';
import { noStoreHeaders, unauthorizedResponse } from '@/app/api/_lib/proxy-response';
import { checkRateLimit, rateLimitExceededResponse } from '@/app/api/_lib/rate-limit';
import { readTextBodyWithLimit } from '@/app/api/_lib/request-body';
import { enforceSameOrigin } from '@/app/api/_lib/request-security';
import { readJsonResponseWithLimit } from '@/app/api/_lib/bounded-json-response';
import { trustedMarketplaceServiceOrigin } from '@/app/api/_lib/upstream-url';
import { fetchWithBodyDeadline } from '@/app/api/_lib/upstream-fetch';
import { getMarketplaceApiUrlEnv } from '@/lib/server-runtime-env';

export const dynamic = 'force-dynamic';

const MARKETPLACE_API_URL = trustedMarketplaceServiceOrigin(getMarketplaceApiUrlEnv());
const MAX_BODY_BYTES = 32 * 1024;
const MAX_RESPONSE_BYTES = 256 * 1024;

const schema = z.object({
  category: z.enum(['order_support', 'general_support']),
  subject: z.string().trim().min(3).max(200),
  description: z.string().trim().min(1).max(5000),
  referenceType: z.enum(['order', 'page', 'account', 'other']).optional(),
  referenceId: z.string().trim().min(1).max(128).optional(),
  referenceLabel: z.string().trim().min(1).max(200).optional(),
  context: z.object({
    sourcePath: z.string().regex(/^\/[^?#]*$/).max(500).optional(),
    consultedFaqIds: z.array(z.string().trim().min(1).max(100)).max(20).optional(),
  }).strict().optional(),
}).strict().superRefine((value, ctx) => {
  if (value.category === 'order_support') {
    if (value.referenceType !== 'order' || !value.referenceId) {
      ctx.addIssue({ code: 'custom', message: 'Riferimento ordine richiesto.' });
    }
  }
});

function extractReceiptId(payload: unknown): string | null {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) return null;
  const record = payload as Record<string, unknown>;
  const value = record.id ?? record.caseId ?? record.case_id;
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
    scope: 'support-case-create',
    limit: 8,
    windowMs: 10 * 60_000,
    userId: extractUserIdForRateLimit(auth),
  });
  if (!rl.allowed) return rateLimitExceededResponse(rl);

  let body: unknown;
  try {
    const bodyResult = await readTextBodyWithLimit(request, MAX_BODY_BYTES);
    if (bodyResult.tooLarge) {
      return NextResponse.json(
        { detail: 'Dati richiesta assistenza non validi.' },
        { status: 413, headers: noStoreHeaders() },
      );
    }
    body = JSON.parse(bodyResult.body || '{}') as unknown;
  } catch {
    return NextResponse.json(
      { detail: 'Dati richiesta assistenza non validi.' },
      { status: 400, headers: noStoreHeaders() },
    );
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { detail: 'Dati richiesta assistenza non validi.' },
      { status: 400, headers: noStoreHeaders() },
    );
  }

  if (!MARKETPLACE_API_URL) {
    return NextResponse.json(
      { detail: 'Servizio assistenza temporaneamente non disponibile.' },
      { status: 503, headers: noStoreHeaders() },
    );
  }

  const { category, subject, description, referenceType, referenceId, referenceLabel, context } = parsed.data;
  const supportCase = {
    category,
    subject,
    description,
    ...(referenceType ? { reference_type: referenceType } : {}),
    ...(referenceId ? { reference_id: referenceId } : {}),
    ...(referenceLabel ? { reference_label: referenceLabel } : {}),
    context: {
      ...(context?.sourcePath ? { source_path: context.sourcePath } : {}),
      consulted_faq_ids: context?.consultedFaqIds ?? [],
    },
  };

  const userId = extractUserIdForRateLimit(auth) ?? 'anonymous';
  const idempotencyKey = createHash('sha256')
    .update(`${userId}:${JSON.stringify(supportCase)}`)
    .digest('hex');

  try {
    const upstream = await fetchWithBodyDeadline(`${MARKETPLACE_API_URL}/api/v1/support/cases`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Accept-Encoding': 'identity',
        Authorization: auth,
        'Content-Type': 'application/json',
        'X-Idempotency-Key': idempotencyKey,
      },
      body: JSON.stringify(supportCase),
      cache: 'no-store',
      redirect: 'error',
    }, 10_000);
    if (!upstream.ok) await upstream.body?.cancel();
    const payload = upstream.ok
      ? await readJsonResponseWithLimit(upstream, MAX_RESPONSE_BYTES)
      : null;
    const caseId = extractReceiptId(payload);
    if (!upstream.ok || !caseId) {
      return NextResponse.json(
        { detail: 'Invio richiesta non riuscito.' },
        { status: upstream.status === 429 ? 429 : 502, headers: noStoreHeaders() },
      );
    }
    return NextResponse.json({ ok: true, caseId }, { status: 201, headers: noStoreHeaders() });
  } catch {
    return NextResponse.json(
      { detail: 'Servizio assistenza temporaneamente non disponibile.' },
      { status: 502, headers: noStoreHeaders() },
    );
  }
}
