/**
 * Debug: risposta raw di Meilisearch per un singolo documento.
 * GET /api/debug/meilisearch-doc?id=mtg_32
 * Utile per capire: status, formato id, campi restituiti, 404/403.
 */

import { NextRequest, NextResponse } from 'next/server';

const MEILI_URL = (
  process.env.NEXT_PUBLIC_MEILISEARCH_URL ||
  process.env.VITE_MEILISEARCH_URL ||
  ''
).replace(/\/+$/, '');
const MEILI_KEY =
  process.env.NEXT_PUBLIC_MEILISEARCH_API_KEY ||
  process.env.VITE_MEILISEARCH_API_KEY ||
  '';
const INDEX = process.env.NEXT_PUBLIC_MEILISEARCH_INDEX || 'cards';

export async function GET(request: NextRequest) {
  const id = request.nextUrl.searchParams.get('id')?.trim();
  if (!id) {
    return NextResponse.json(
      { error: 'Parametro id mancante. Es: ?id=mtg_32' },
      { status: 400 }
    );
  }

  if (!MEILI_URL) {
    return NextResponse.json(
      { error: 'Meilisearch non configurato (NEXT_PUBLIC_MEILISEARCH_URL)' },
      { status: 503 }
    );
  }

  const url = `${MEILI_URL}/indexes/${INDEX}/documents/${encodeURIComponent(id)}`;
  const headers: Record<string, string> = {};
  if (MEILI_KEY) headers.Authorization = `Bearer ${MEILI_KEY}`;

  try {
    const res = await fetch(url, { method: 'GET', headers });
    const text = await res.text();
    let body: unknown;
    try {
      body = text ? JSON.parse(text) : null;
    } catch {
      body = text;
    }

    return NextResponse.json({
      debug: true,
      requestedId: id,
      meilisearchUrl: `${MEILI_URL}/indexes/${INDEX}/documents/${id}`,
      status: res.status,
      ok: res.ok,
      body,
      message:
        res.status === 404
          ? 'Documento non trovato in Meilisearch (id inesistente o indice vuoto)'
          : !res.ok
            ? `Meilisearch ha risposto con errore (es. 403 = chiave API errata)`
            : 'OK',
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { debug: true, error: 'Fetch fallito', detail: message },
      { status: 502 }
    );
  }
}
