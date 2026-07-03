/**
 * BFF — accetta segnalazioni venditori/inserzioni (in attesa di microservizio dedicato).
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getForwardedAuthorization, extractUserIdForRateLimit } from '@/app/api/_lib/forwarded-authorization';
import { noStoreHeaders, unauthorizedResponse } from '@/app/api/_lib/proxy-response';
import { checkRateLimit, rateLimitExceededResponse } from '@/app/api/_lib/rate-limit';
import { MARKETPLACE_REPORT_REASONS } from '@/lib/marketplace/report-reasons';

export const dynamic = 'force-dynamic';

const bodySchema = z.object({
  sellerUsername: z.string().trim().min(1).max(120),
  sellerId: z.string().trim().max(120).optional(),
  kind: z.enum(['listing', 'auction']),
  referenceId: z.string().trim().min(1).max(120),
  referenceLabel: z.string().trim().max(200).optional(),
  reason: z.enum(MARKETPLACE_REPORT_REASONS),
  details: z.string().trim().max(2000).optional(),
});

export async function POST(request: NextRequest) {
  const auth = getForwardedAuthorization(request);
  if (!auth) return unauthorizedResponse();

  const userId = extractUserIdForRateLimit(auth);
  const rl = checkRateLimit(request, { scope: 'marketplace-reports', limit: 10, windowMs: 60_000, userId });
  if (!rl.allowed) return rateLimitExceededResponse(rl);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ detail: 'Corpo richiesta non valido.' }, { status: 400, headers: noStoreHeaders() });
  }

  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ detail: 'Dati segnalazione non validi.' }, { status: 400, headers: noStoreHeaders() });
  }

  // TODO: inoltrare al servizio trust & safety quando disponibile.
  console.info('[marketplace/reports]', parsed.data);

  return NextResponse.json({ ok: true }, { status: 202, headers: noStoreHeaders() });
}
