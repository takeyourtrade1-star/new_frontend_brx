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

export const dynamic = 'force-dynamic';

const schema = z.object({
  idempotencyKey: z.string().regex(/^[A-Za-z0-9._:-]{16,128}$/),
  category: z.enum(['order_support', 'bug_report', 'general_support']),
  subject: z.string().trim().min(3).max(200),
  description: z.string().trim().min(1).max(5000),
  referenceType: z.enum(['order', 'page', 'account', 'other']).optional(),
  referenceId: z.string().trim().min(1).max(128).optional(),
  referenceLabel: z.string().trim().min(1).max(200).optional(),
  context: z.object({
    bugType: z.enum(['functional', 'visual', 'performance', 'payment', 'other']).optional(),
    clientPriority: z.enum(['low', 'medium', 'high']).optional(),
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

export async function POST(request: NextRequest) {
  if (!hasSameOrigin(request)) {
    return NextResponse.json(
      { detail: 'Origine richiesta non valida.' },
      { status: 403, headers: noStoreHeaders() },
    );
  }

  const authorization = getForwardedAuthorization(request);
  if (!authorization) return unauthorizedResponse();

  const rateLimit = checkRateLimit(request, {
    scope: 'support-case-create',
    limit: 8,
    windowMs: 10 * 60_000,
    userId: extractUserIdForRateLimit(authorization),
  });
  if (!rateLimit.allowed) return rateLimitExceededResponse(rateLimit);

  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { detail: 'Dati richiesta assistenza non validi.' },
      { status: 400, headers: noStoreHeaders() },
    );
  }

  const { idempotencyKey, referenceType, referenceId, referenceLabel, context, ...fields } = parsed.data;
  const payload = {
    ...fields,
    reference_type: referenceType,
    reference_id: referenceId,
    reference_label: referenceLabel,
    context: {
      bug_type: context?.bugType,
      client_priority: context?.clientPriority,
      source_path: context?.sourcePath,
      consulted_faq_ids: context?.consultedFaqIds ?? [],
    },
  };

  try {
    const result = await createSupportCaseUpstream(
      authorization,
      idempotencyKey,
      payload,
    );
    if (result.status < 200 || result.status >= 300) {
      return supportCaseErrorResponse(result.status, result.data);
    }
    return NextResponse.json(
      { ok: true, caseId: result.data.id },
      { status: 201, headers: noStoreHeaders() },
    );
  } catch {
    return NextResponse.json(
      { detail: 'Servizio assistenza temporaneamente non disponibile.' },
      { status: 502, headers: noStoreHeaders() },
    );
  }
}
