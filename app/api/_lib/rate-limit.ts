/**
 * Rate limiting "best effort" per i proxy BFF sensibili.
 *
 * Implementazione in-memory (fixed window) chiave su `ip:userId` (o `ip:anon`
 * quando l'utente non è autenticato). È pensata per mitigare abusi/scraping e
 * resource-exhaustion lato singola istanza, in linea con OWASP API Security
 * (rate limiting come mitigazione di base).
 *
 * LIMITE NOTO: lo stato è in-memory e quindi per-istanza. Su deploy
 * multi-istanza/multi-regione (es. Amplify con più funzioni concorrenti) ogni
 * istanza ha il proprio contatore: il limite reale è "N richieste per istanza"
 * non globale. Per un limite realmente globale serve uno store condiviso
 * (Redis/Upstash/DynamoDB). Qui copriamo comunque il caso comune (singolo
 * runtime, traffico solo-frontend) e rendiamo la mitigazione esplicita e
 * uniforme, pronta a essere sostituita con uno store distribuito.
 */

import { NextRequest, NextResponse } from 'next/server';

interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();

/** Tetto alla mappa per evitare crescita illimitata della memoria. */
const MAX_TRACKED_KEYS = 5000;

function getClientIp(request: NextRequest): string {
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) {
    const first = forwardedFor.split(',')[0]?.trim();
    if (first) return first;
  }
  const realIp = request.headers.get('x-real-ip');
  if (realIp) return realIp.trim();
  return 'unknown';
}

function evictIfNeeded(): void {
  if (buckets.size < MAX_TRACKED_KEYS) return;
  // Eviction grezza: rimuove la entry più vecchia incontrata nell'iterazione
  // (Map mantiene l'ordine di inserimento). Sufficiente per limitare la memoria
  // senza introdurre una struttura LRU dedicata.
  const oldestKey = buckets.keys().next().value;
  if (oldestKey !== undefined) buckets.delete(oldestKey);
}

export interface RateLimitOptions {
  /** Numero massimo di richieste consentite nella finestra. */
  limit: number;
  /** Durata della finestra in millisecondi. */
  windowMs: number;
  /**
   * Identificatore utente quando disponibile (es. user id estratto dal JWT/sessione).
   * Se assente, il limite si applica per sola IP (`ip:anon`).
   */
  userId?: string | number | null;
  /** Prefisso per separare i bucket di proxy diversi (es. "marketplace", "sync"). */
  scope: string;
}

export interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  retryAfterSec: number;
}

/**
 * Verifica ed incrementa il contatore per la chiave `scope:ip:userId`.
 * Ritorna `allowed: false` quando il limite della finestra corrente è superato.
 */
export function checkRateLimit(request: NextRequest, options: RateLimitOptions): RateLimitResult {
  const ip = getClientIp(request);
  const identity = options.userId != null && options.userId !== '' ? `u:${options.userId}` : 'anon';
  const key = `${options.scope}:${ip}:${identity}`;

  const now = Date.now();
  let bucket = buckets.get(key);

  if (!bucket || bucket.resetAt <= now) {
    bucket = { count: 0, resetAt: now + options.windowMs };
    evictIfNeeded();
    buckets.set(key, bucket);
  }

  bucket.count += 1;

  const allowed = bucket.count <= options.limit;
  const remaining = Math.max(0, options.limit - bucket.count);
  const retryAfterSec = Math.max(1, Math.ceil((bucket.resetAt - now) / 1000));

  return { allowed, limit: options.limit, remaining, retryAfterSec };
}

/** Risposta 429 uniforme con header `Retry-After` e nessun dato sensibile. */
export function rateLimitExceededResponse(result: RateLimitResult): NextResponse {
  return NextResponse.json(
    { detail: 'Troppe richieste. Riprova tra qualche secondo.' },
    {
      status: 429,
      headers: {
        'Retry-After': String(result.retryAfterSec),
        'X-RateLimit-Limit': String(result.limit),
        'X-RateLimit-Remaining': String(result.remaining),
        'Cache-Control': 'private, no-store, max-age=0, must-revalidate',
      },
    },
  );
}
