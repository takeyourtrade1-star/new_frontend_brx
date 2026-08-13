/**
 * Durable bug-report adapter. The browser never receives the support service
 * credential and success is returned only with a backend-issued receipt id.
 * Submissions require an authenticated Ebartex session.
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
import { canonicalEbartexPageUrl } from '@/app/api/_lib/bug-report-input';

export const dynamic = 'force-dynamic';

const MARKETPLACE_API_URL = trustedMarketplaceServiceOrigin(getMarketplaceApiUrlEnv());
const MAX_BODY_BYTES = 2 * 1024 * 1024;
const MAX_RESPONSE_BYTES = 256 * 1024;
const MAX_DESCRIPTION_BYTES = 5_000;
const pageUrlSchema = z
  .string()
  .trim()
  .max(2048)
  .transform((value, context) => {
    const canonical = canonicalEbartexPageUrl(value);
    if (!canonical) {
      context.addIssue({ code: z.ZodIssueCode.custom, message: 'Invalid page URL' });
      return z.NEVER;
    }
    return canonical;
  });

const reportSchema = z.object({
  name: z.string().trim().min(1).max(120),
  email: z.string().trim().email().max(320),
  subject: z.string().trim().min(1).max(200),
  message: z.string().trim().min(1).max(5000),
  bugType: z.enum(['functional', 'visual', 'performance', 'payment', 'other']),
  priority: z.enum(['low', 'medium', 'high']),
  pageUrl: pageUrlSchema.optional(),
});

function extractReceiptId(payload: unknown): string | null {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) return null;
  const record = payload as Record<string, unknown>;
  const value = record.report_id ?? record.reportId ?? record.ticket_id ?? record.ticketId ?? record.id;
  if (typeof value === 'string' || typeof value === 'number') {
    const id = String(value).trim();
    return id ? id.slice(0, 200) : null;
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
    scope: 'support:bug-report',
    limit: 3,
    windowMs: 15 * 60_000,
    userId: extractUserIdForRateLimit(auth),
  });
  if (!rl.allowed) return rateLimitExceededResponse(rl);

  let payload: unknown;
  try {
    const body = await readTextBodyWithLimit(request, MAX_BODY_BYTES);
    if (body.tooLarge) {
      return NextResponse.json(
        { detail: 'Segnalazione non valida.' },
        { status: 413, headers: noStoreHeaders() },
      );
    }
    payload = JSON.parse(body.body || '{}') as unknown;
  } catch {
    return NextResponse.json(
      { detail: 'Segnalazione non valida.' },
      { status: 400, headers: noStoreHeaders() },
    );
  }

  const parsed = reportSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      { detail: 'Segnalazione non valida.' },
      { status: 400, headers: noStoreHeaders() },
    );
  }

  if (!MARKETPLACE_API_URL) {
    return NextResponse.json(
      { detail: 'Servizio segnalazioni temporaneamente non disponibile.' },
      { status: 503, headers: noStoreHeaders() },
    );
  }

  const { name, email, subject, message, bugType, priority, pageUrl } = parsed.data;

  const header = `Nome: ${name}\nEmail: ${email}\n\n`;
  const description = (header + message).slice(0, MAX_DESCRIPTION_BYTES);

  const supportCase = {
    category: 'bug_report',
    subject,
    description,
    context: {
      bug_type: bugType,
      client_priority: priority,
      ...(pageUrl ? { source_path: new URL(pageUrl).pathname } : {}),
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
        'Content-Type': 'application/json',
        Authorization: auth,
        'X-Idempotency-Key': idempotencyKey,
      },
      body: JSON.stringify(supportCase),
      cache: 'no-store',
      redirect: 'error',
    }, 12_000);
    if (!upstream.ok) await upstream.body?.cancel();
    const responsePayload = upstream.ok
      ? await readJsonResponseWithLimit(upstream, MAX_RESPONSE_BYTES)
      : null;
    const reportId = extractReceiptId(responsePayload);
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
