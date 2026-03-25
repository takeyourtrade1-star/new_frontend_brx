/**
 * API Route: inoltra la richiesta di reindex al Search Engine (BRX_Search).
 * La chiamata avviene solo lato server; il browser non vede l'URL del backend.
 * Body: { "apiKey": "..." } oppure header X-Admin-API-Key.
 */

import { NextRequest, NextResponse } from 'next/server';

const SEARCH_API_URL =
  process.env.NEXT_PUBLIC_SEARCH_API_URL ||
  process.env.VITE_SEARCH_API_URL ||
  process.env.SEARCH_API_URL ||
  'http://localhost:8000';

export async function POST(request: NextRequest) {
  let apiKey = request.headers.get('X-Admin-API-Key') || '';
  if (!apiKey && request.headers.get('content-type')?.includes('application/json')) {
    try {
      const body = await request.json();
      apiKey = (body?.apiKey ?? '').trim();
    } catch {
      // ignore
    }
  }
  if (!apiKey) {
    return NextResponse.json(
      { error: 'Chiave Admin mancante. Invia X-Admin-API-Key o body { "apiKey": "..." }.' },
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
