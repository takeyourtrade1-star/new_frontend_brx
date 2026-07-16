/** BFF esplicito per segnalazioni marketplace persistenti. */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import {
  extractUserIdForRateLimit,
  getForwardedAuthorization,
} from '@/app/api/_lib/forwarded-authorization';
import { noStoreHeaders, unauthorizedResponse } from '@/app/api/_lib/proxy-response';
import { checkRateLimit, rateLimitExceededResponse } from '@/app/api/_lib/rate-limit';
import { hasSameOrigin } from '@/app/api/_lib/same-origin-mutation';
import {
  createSupportCaseUpstream,
  supportCaseErrorResponse,
} from '@/app/api/_lib/support-case-upstream';
import { MARKETPLACE_REPORT_REASONS } from '@/lib/marketplace/report-reasons';

export const dynamic = 'force-dynamic';

const bodySchema = z.object({
  idempotencyKey: z.string().regex(/^[A-Za-z0-9._:-]{16,128}$/),
  sellerUsername: z.string().trim().min(1).max(120),
  sellerId: z.string().uuid().optional(),
  kind: z.enum(['listing', 'auction']),
  referenceId: z.string().trim().min(1).max(120),
  referenceLabel: z.string().trim().max(200).optional(),
  reason: z.enum(MARKETPLACE_REPORT_REASONS),
  details: z.string().trim().max(2000).optional(),
}).strict();

export async function POST(request: NextRequest) {
  if (!hasSameOrigin(request)) {
    return NextResponse.json(
      { detail: 'Origine richiesta non valida.' },
      { status: 403, headers: noStoreHeaders() },
    );
  }

  const auth = getForwardedAuthorization(request);
  if (!auth) return unauthorizedResponse();

  const userId = extractUserIdForRateLimit(auth);
  const rateLimit = checkRateLimit(request, {
    scope: 'marketplace-reports',
    limit: 10,
    windowMs: 60_000,
    userId,
  });
  if (!rateLimit.allowed) return rateLimitExceededResponse(rateLimit);

  const body = await request.json().catch(() => null);
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { detail: 'Dati segnalazione non validi.' },
      { status: 400, headers: noStoreHeaders() },
    );
  }

  const data = parsed.data;
  try {
    const result = await createSupportCaseUpstream(auth, data.idempotencyKey, {
      category: 'marketplace_report',
      subject: `Segnalazione ${data.kind}: ${data.referenceLabel ?? data.referenceId}`,
      description: data.details ?? 'Segnalazione inviata senza dettagli aggiuntivi.',
      reference_type: data.kind,
      reference_id: data.referenceId,
      reference_label: data.referenceLabel,
      reported_user_id: data.sellerId,
      context: {
        seller_username: data.sellerUsername,
        report_reason: data.reason,
        consulted_faq_ids: [],
      },
    });
    if (result.status < 200 || result.status >= 300) {
      return supportCaseErrorResponse(result.status, result.data);
    }
    return NextResponse.json(
      { ok: true, caseId: result.data.id },
      { status: 201, headers: noStoreHeaders() },
    );
  } catch {
    return NextResponse.json(
      { detail: 'Servizio segnalazioni temporaneamente non disponibile.' },
      { status: 502, headers: noStoreHeaders() },
    );
  }
}
