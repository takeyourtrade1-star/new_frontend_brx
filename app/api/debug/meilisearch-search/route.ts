/**
 * Debug: risposta raw di Meilisearch per una ricerca.
 * GET /api/debug/meilisearch-search?q=mare&limit=5
 * Mostra esattamente gli hit restituiti: id, tutti i campi, formato.
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
  const q = request.nextUrl.searchParams.get('q') ?? '';
  const limit = Math.min(20, Math.max(1, parseInt(request.nextUrl.searchParams.get('limit') ?? '5', 10) || 5));

  if (!MEILI_URL) {
    return NextResponse.json(
      { error: 'Meilisearch non configurato (NEXT_PUBLIC_MEILISEARCH_URL)' },
      { status: 503 }
    );
  }

  const url = `${MEILI_URL}/indexes/${INDEX}/search`;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (MEILI_KEY) headers.Authorization = `Bearer ${MEILI_KEY}`;

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify({ q: q.trim() || undefined, limit }),
    });
    const data = (await res.json()) as {
      hits?: unknown[];
      estimatedTotalHits?: number;
      query?: string;
      limit?: number;
      [key: string]: unknown;
    };

    const hits = Array.isArray(data.hits) ? data.hits : [];
    const hitIds = hits.map((h: unknown) => (h && typeof h === 'object' && 'id' in h ? (h as { id: unknown }).id : null));
    const firstHitKeys = hits.length > 0 && typeof hits[0] === 'object' && hits[0] !== null
      ? Object.keys(hits[0] as object)
      : [];

    return NextResponse.json({
      debug: true,
      query: q || '(vuoto)',
      limit,
      meilisearchStatus: res.status,
      ok: res.ok,
      estimatedTotalHits: data.estimatedTotalHits,
      hitIds,
      firstHitKeys,
      hitsCount: hits.length,
      rawHits: hits,
      message: hits.length === 0
        ? 'Nessun hit. Prova un altro termine o verifica che l’indice sia popolato (reindex).'
        : `Trovati ${hits.length} hit. Controlla hitIds e rawHits per il formato degli id e dei campi.`,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { debug: true, error: 'Fetch fallito', detail: message },
      { status: 502 }
    );
  }
}
