/**
 * GET /api/reprints?card_id=mtg_40679
 * Ristampe della stessa carta (server-side Meilisearch, niente CORS).
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCardDocumentById } from '@/lib/product-detail';
import {
  fetchReprintsForCard,
  type ReprintSearchHit,
} from '@/lib/reprints-search';

const MEILI_URL = (
  process.env.NEXT_PUBLIC_MEILISEARCH_URL ||
  process.env.NEXT_PUBLIC_MEILISEARCH_HOST ||
  process.env.VITE_MEILISEARCH_URL ||
  ''
).replace(/\/+$/, '');
const MEILI_KEY =
  process.env.NEXT_PUBLIC_MEILISEARCH_API_KEY ||
  process.env.VITE_MEILISEARCH_API_KEY ||
  '';
const INDEX = process.env.NEXT_PUBLIC_MEILISEARCH_INDEX || 'cards';

export async function GET(request: NextRequest) {
  if (!MEILI_URL) {
    return NextResponse.json(
      { error: 'Meilisearch non configurato (NEXT_PUBLIC_MEILISEARCH_URL)' },
      { status: 503 }
    );
  }

  const cardId = request.nextUrl.searchParams.get('card_id')?.trim();
  if (!cardId) {
    return NextResponse.json({ error: 'Parametro card_id mancante' }, { status: 400 });
  }

  const card = await getCardDocumentById(cardId);
  if (!card) {
    return NextResponse.json({ error: 'Carta non trovata', card_id: cardId }, { status: 404 });
  }

  const searchUrl = `${MEILI_URL}/indexes/${INDEX}/search`;
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (MEILI_KEY) headers.Authorization = `Bearer ${MEILI_KEY}`;

  const search = async (body: Record<string, unknown>) => {
    const res = await fetch(searchUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
      cache: 'no-store',
    });
    let hits: ReprintSearchHit[] = [];
    let estimatedTotalHits: number | undefined;
    if (res.ok) {
      const data = (await res.json()) as {
        hits?: ReprintSearchHit[];
        estimatedTotalHits?: number;
      };
      hits = Array.isArray(data.hits) ? data.hits : [];
      estimatedTotalHits = data.estimatedTotalHits;
    }
    return { ok: res.ok, status: res.status, hits, estimatedTotalHits };
  };

  try {
    const hits = await fetchReprintsForCard(card, search);
    return NextResponse.json({
      card_id: card.id,
      oracle_id: card.oracle_id ?? null,
      card_entity_id: card.card_id ?? null,
      count: hits.length,
      hits,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { error: 'Ricerca ristampe non disponibile', detail: message },
      { status: 502 }
    );
  }
}
