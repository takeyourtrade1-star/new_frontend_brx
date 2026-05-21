/**
 * GET /api/reprints?card_id=mtg_40679
 * Ristampe della stessa carta (server-side Meilisearch, niente CORS / chiavi in browser).
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCardDocumentById } from '@/lib/product-detail';
import { getMeilisearchServerConfig } from '@/lib/meilisearch-server-env';
import {
  fetchReprintsForCard,
  isValidReprintCardId,
  type ReprintSearchHit,
  type ReprintsApiResponse,
} from '@/lib/reprints-search';

export async function GET(request: NextRequest) {
  const { url: meiliUrl, apiKey: meiliKey, index } = getMeilisearchServerConfig();

  if (!meiliUrl) {
    return NextResponse.json(
      {
        error:
          'Meilisearch non configurato (MEILISEARCH_URL o NEXT_PUBLIC_MEILISEARCH_URL)',
      },
      { status: 503 }
    );
  }

  const cardId = request.nextUrl.searchParams.get('card_id')?.trim() ?? '';
  if (!cardId) {
    return NextResponse.json({ error: 'Parametro card_id mancante' }, { status: 400 });
  }

  if (!isValidReprintCardId(cardId)) {
    return NextResponse.json(
      {
        error: 'card_id non valido (attesi mtg_|op_|pk_ seguito da numeri)',
        card_id: cardId,
      },
      { status: 400 }
    );
  }

  const card = await getCardDocumentById(cardId);
  if (!card) {
    return NextResponse.json({ error: 'Carta non trovata', card_id: cardId }, { status: 404 });
  }

  const searchUrl = `${meiliUrl}/indexes/${index}/search`;
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (meiliKey) headers.Authorization = `Bearer ${meiliKey}`;

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
    const payload: ReprintsApiResponse = {
      card_id: card.id,
      oracle_id: card.oracle_id ?? null,
      card_entity_id: card.card_id ?? null,
      count: hits.length,
      hits,
    };
    return NextResponse.json(payload);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { error: 'Ricerca ristampe non disponibile', detail: message },
      { status: 502 }
    );
  }
}
