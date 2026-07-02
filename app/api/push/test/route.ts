/**
 * POST /api/push/test — notifica Web Push di prova.
 *
 * Riceve la subscription del browser, attende `delaySeconds` lato server e poi
 * invia la push via VAPID: l'attesa server-side fa arrivare la notifica anche
 * con la PWA in background o chiusa (su iOS è l'unico canale possibile).
 * Il contenuto della notifica è fisso lato server: l'endpoint non deve poter
 * essere usato per inviare testo arbitrario con l'identità VAPID del sito.
 */

import { NextRequest, NextResponse } from 'next/server';
import webpush from 'web-push';
import { z } from 'zod';
import { noStoreHeaders } from '@/app/api/_lib/proxy-response';
import { checkRateLimit, rateLimitExceededResponse } from '@/app/api/_lib/rate-limit';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
// L'handler resta aperto per tutta l'attesa: serve più del timeout di default.
export const maxDuration = 120;

const MAX_DELAY_SECONDS = 90;

const bodySchema = z.object({
  subscription: z.object({
    endpoint: z.string().url(),
    keys: z.object({
      p256dh: z.string().min(1),
      auth: z.string().min(1),
    }),
  }),
  delaySeconds: z.number().int().min(0).max(MAX_DELAY_SECONDS).default(60),
});

export async function POST(request: NextRequest) {
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT || 'mailto:info@ebartex.com';
  if (!publicKey || !privateKey) {
    return NextResponse.json(
      { detail: 'Chiavi VAPID non configurate (NEXT_PUBLIC_VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY).' },
      { status: 503, headers: noStoreHeaders() }
    );
  }

  const rl = checkRateLimit(request, { scope: 'push-test', limit: 5, windowMs: 60_000 });
  if (!rl.allowed) return rateLimitExceededResponse(rl);

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { detail: 'Body non valido: attesi { subscription, delaySeconds? }.' },
      { status: 400, headers: noStoreHeaders() }
    );
  }
  const { subscription, delaySeconds } = parsed.data;

  webpush.setVapidDetails(subject, publicKey, privateKey);

  if (delaySeconds > 0) {
    await new Promise((resolve) => setTimeout(resolve, delaySeconds * 1000));
  }

  const payload = JSON.stringify({
    title: 'EbarteX 🔔',
    body: `Notifica di prova arrivata dopo ${delaySeconds}s. Le push funzionano anche in background!`,
    url: '/',
  });

  try {
    await webpush.sendNotification(subscription, payload, { TTL: 300, urgency: 'high' });
    return NextResponse.json({ ok: true, delaySeconds }, { headers: noStoreHeaders() });
  } catch (err) {
    const statusCode = (err as { statusCode?: number }).statusCode;
    // 404/410 = subscription scaduta o revocata dal push service.
    const expired = statusCode === 404 || statusCode === 410;
    console.error('[push test] invio fallito', statusCode ?? err);
    return NextResponse.json(
      {
        detail: expired
          ? 'Subscription scaduta: riprova per registrarne una nuova.'
          : 'Invio push fallito.',
      },
      { status: expired ? 410 : 502, headers: noStoreHeaders() }
    );
  }
}
