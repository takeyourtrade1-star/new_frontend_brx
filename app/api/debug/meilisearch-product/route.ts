/**
 * Debug: stesso flusso della pagina prodotto (GET doc → se 403/401 fallback search con filter).
 * GET /api/debug/meilisearch-product?id=mtg_57312
 * Mostra esattamente cosa riceve il frontend e perché può mostrare "Carta non trovata".
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
      { error: 'Parametro id mancante. Es: ?id=mtg_57312' },
      { status: 400 }
    );
  }

  if (!MEILI_URL) {
    return NextResponse.json(
      { error: 'Meilisearch non configurato (NEXT_PUBLIC_MEILISEARCH_URL)' },
      { status: 503 }
    );
  }

  const headers: Record<string, string> = {};
  if (MEILI_KEY) headers.Authorization = `Bearer ${MEILI_KEY}`;

  const getDocUrl = `${MEILI_URL}/indexes/${INDEX}/documents/${encodeURIComponent(id)}`;
  const searchUrl = `${MEILI_URL}/indexes/${INDEX}/search`;
  const filter = `id = "${String(id).replace(/"/g, '\\"')}"`;

  const result: {
    debug: true;
    requestedId: string;
    meilisearchBaseUrl: string;
    step1_getDocument: { status: number; ok: boolean; body: unknown };
    step2_searchFallback?: { status: number; ok: boolean; hitsCount: number; firstHitId?: string; bodySnippet?: unknown };
    resolved: boolean;
    message: string;
  } = {
    debug: true,
    requestedId: id,
    meilisearchBaseUrl: MEILI_URL,
    step1_getDocument: { status: 0, ok: false, body: null },
    resolved: false,
    message: '',
  };

  try {
    const res = await fetch(getDocUrl, { method: 'GET', headers });
    const text = await res.text();
    let body: unknown;
    try {
      body = text ? JSON.parse(text) : null;
    } catch {
      body = text;
    }
    result.step1_getDocument = { status: res.status, ok: res.ok, body };

    if (res.ok) {
      result.resolved = true;
      result.message = 'Documento ottenuto con GET (step 1).';
      return NextResponse.json(result);
    }

    if (res.status !== 403 && res.status !== 401) {
      result.message = `GET ha restituito ${res.status} (non 403/401), quindi il fallback search non viene tentato. Se è 404, il documento non esiste su questo Meilisearch.`;
      return NextResponse.json(result);
    }

    const searchRes = await fetch(searchUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...headers },
      body: JSON.stringify({ filter, limit: 1 }),
    });
    const searchText = await searchRes.text();
    let searchBody: unknown;
    try {
      searchBody = searchText ? JSON.parse(searchText) : null;
    } catch {
      searchBody = searchText;
    }

    const hits = Array.isArray((searchBody as { hits?: unknown[] })?.hits) ? (searchBody as { hits: unknown[] }).hits : [];
    const firstHit = hits[0] as { id?: string } | undefined;
    result.step2_searchFallback = {
      status: searchRes.status,
      ok: searchRes.ok,
      hitsCount: hits.length,
      firstHitId: firstHit?.id,
      bodySnippet: searchRes.ok ? { hitsCount: hits.length, firstHitId: firstHit?.id } : searchBody,
    };

    if (searchRes.ok && hits.length > 0) {
      result.resolved = true;
      result.message = 'Fallback search ha restituito un hit; la pagina dovrebbe mostrare la carta.';
    } else if (!searchRes.ok) {
      result.message = `Fallback search ha restituito ${searchRes.status}. Possibili cause: "id" non è filterable su questo indice, o chiave API senza permesso search.`;
    } else {
      result.message = 'Fallback search ok ma 0 hit. Verifica che l’id esista nell’indice (es. reindex su questo Meilisearch).';
    }

    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    result.message = `Errore: ${message}`;
    return NextResponse.json(result, { status: 502 });
  }
}
