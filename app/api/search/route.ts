/**
 * API Route: ricerca su Meilisearch (server-side, niente CORS).
 * GET /api/search?q=...&game=mtg&set=...&category_id=...&page=1&limit=20&sort=...
 */

import { NextRequest, NextResponse } from 'next/server';

const MEILI_URL =
  (process.env.NEXT_PUBLIC_MEILISEARCH_URL || process.env.VITE_MEILISEARCH_URL || '').replace(
    /\/+$/,
    ''
  );
const MEILI_KEY =
  process.env.NEXT_PUBLIC_MEILISEARCH_API_KEY || process.env.VITE_MEILISEARCH_API_KEY || '';
const INDEX = process.env.NEXT_PUBLIC_MEILISEARCH_INDEX || 'cards';

export interface SearchHit {
  id: string;
  name: string;
  set_name: string;
  game_slug: string;
  category_id: number;
  category_name?: string;
  image?: string | null;
  keywords_localized?: string[];
}

export interface SearchApiResponse {
  hits: SearchHit[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

function buildFilter(game?: string, set?: string, categoryId?: string): string[] {
  const parts: string[] = [];
  if (game?.trim()) parts.push(`game_slug = "${game.trim()}"`);
  if (set?.trim()) parts.push(`set_name = "${set.trim().replace(/"/g, '\\"')}"`);
  if (categoryId?.trim()) parts.push(`category_id = ${categoryId.trim()}`);
  return parts;
}

function buildSort(sortBy?: string): string[] {
  switch (sortBy) {
    case 'name_asc':
      return ['name:asc'];
    case 'name_desc':
      return ['name:desc'];
    case 'set_asc':
      return ['set_name:asc'];
    case 'set_desc':
      return ['set_name:desc'];
    case 'price_asc':
    case 'price_desc':
      // Meilisearch index potrebbe non avere sort su prezzo; usiamo name come fallback
      return ['name:asc'];
    default:
      return ['name:asc'];
  }
}

export async function GET(request: NextRequest) {
  if (!MEILI_URL || !MEILI_KEY) {
    return NextResponse.json(
      { error: 'Meilisearch non configurato (NEXT_PUBLIC_MEILISEARCH_URL / API_KEY)' },
      { status: 503 }
    );
  }

  const { searchParams } = new URL(request.url);
  const q = (searchParams.get('q') ?? '').trim();
  const game = searchParams.get('game') ?? '';
  const set = searchParams.get('set') ?? '';
  const categoryId = searchParams.get('category_id') ?? '';
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') ?? '20', 10) || 20));
  const sortBy = searchParams.get('sort') ?? 'name_asc';

  const offset = (page - 1) * limit;
  const filterParts = buildFilter(game, set, categoryId);
  const filter = filterParts.length ? filterParts.join(' AND ') : undefined;
  const sort = buildSort(sortBy);

  const url = `${MEILI_URL}/indexes/${INDEX}/search`;
  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${MEILI_KEY}`,
  };

  const doSearch = (includeSort: boolean) => {
    const body: Record<string, unknown> = {
      q: q || undefined,
      limit,
      offset,
    };
    if (filter) body.filter = filter;
    if (includeSort) body.sort = sort;
    return fetch(url, { method: 'POST', headers, body: JSON.stringify(body) });
  };

  try {
    let res = await doSearch(true);
    // Se 400 (es. sortable non configurati), riprova senza sort (ordinamento per rilevanza)
    if (res.status === 400) {
      res = await doSearch(false);
    }
    if (!res.ok) {
      const text = await res.text();
      return NextResponse.json(
        { error: `Meilisearch error: ${res.status}`, detail: text },
        { status: 502 }
      );
    }

    const data = (await res.json()) as {
      hits: SearchHit[];
      estimatedTotalHits?: number;
      offset?: number;
      limit?: number;
    };

    const hits = Array.isArray(data.hits) ? data.hits : [];
    const total =
      typeof data.estimatedTotalHits === 'number' ? data.estimatedTotalHits : hits.length;
    const totalPages = Math.ceil(total / limit) || 1;

    const response: SearchApiResponse = {
      hits,
      total,
      page,
      limit,
      totalPages,
    };

    return NextResponse.json(response);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { error: 'Ricerca non disponibile', detail: message },
      { status: 502 }
    );
  }
}
