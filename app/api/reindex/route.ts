/**
 * API Route: inoltra la richiesta di reindex al Search Engine (BRX_Search).
 * La chiamata avviene solo lato server; il browser non vede l'URL del backend.
 * Auth: solo header `X-Admin-API-Key` (la chiave non passa più nel body per
 * evitare che finisca in log/cronologia). Protetta da rate limit per IP.
 */

import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit, rateLimitExceededResponse } from '@/app/api/_lib/rate-limit';

const SEARCH_API_URL =
  process.env.NEXT_PUBLIC_SEARCH_API_URL ||
  process.env.VITE_SEARCH_API_URL ||
  process.env.SEARCH_API_URL ||
  'http://localhost:8000';

export async function POST(request: NextRequest) {
  // Rate limit per IP: endpoint admin sensibile, mitiga brute-force della chiave.
  const rl = checkRateLimit(request, { scope: 'reindex', limit: 5, windowMs: 60_000 });
  if (!rl.allowed) {
    return rateLimitExceededResponse(rl);
  }

  const apiKey = (request.headers.get('X-Admin-API-Key') || '').trim();
  if (!apiKey) {
    return NextResponse.json(
      { error: 'Chiave Admin mancante. Invia l\'header X-Admin-API-Key.' },
      { status: 400 }
    );
  }

  const baseUrl = SEARCH_API_URL.replace(/\/+$/, '');
  const url = `${baseUrl}/api/admin/reindex`;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Admin-API-Key': apiKey,
      },
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    const text = await res.text();
    if (res.status === 202) {
      return NextResponse.json(
        { status: 'accepted', message: 'Reindexing started in background.' },
        { status: 202 }
      );
    }
    if (res.status === 403) {
      return NextResponse.json({ error: 'Chiave Admin non valida.' }, { status: 403 });
    }
    return NextResponse.json(
      { error: text || `Errore ${res.status}` },
      { status: res.status >= 400 ? res.status : 502 }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Errore di rete';
    const isAbort = message.includes('abort') || (err instanceof Error && err.name === 'AbortError');
    const hint = isAbort
      ? ' Timeout 15s: il servizio non risponde. Verifica che il Search Engine (BRX_Search) sia avviato sulla porta corretta (es. 8001).'
      : ' Verifica che (1) il Search Engine sia in esecuzione, (2) la porta sia aperta nel firewall/security group, (3) se Next.js gira in locale, l\'IP del Search sia raggiungibile (altrimenti usa http://localhost:8001 se il Search è in locale).';
    return NextResponse.json(
      {
        error: `Impossibile raggiungere il Search Engine.${hint} Dettaglio: ${message}`,
      },
      { status: 502 }
    );
  }
}
