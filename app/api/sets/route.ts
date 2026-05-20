/**
 * GET /api/sets?q=...&game=...&limit=10
 * Cerca set/edizioni in Meilisearch per nome.
 * Restituisce set unici (deduplicati per set_name) con icon, code, game, release_date.
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

const ALLOWED_GAMES = new Set(['mtg', 'pokemon', 'one-piece', 'op', 'pk', 'yugioh', '']);

export interface SetResult {
  set_name: string;
  set_code: string | null;
  set_icon_uri: string | null;
  game_slug: string;
  release_date: string | null;
}

interface MeiliSetDocument {
  set_name?: string;
  set_code?: string | null;
  set_icon_uri?: string | null;
  game_slug?: string;
  release_date?: string | null;
}

export async function GET(request: NextRequest) {
  if (!MEILI_URL || !MEILI_KEY) {
    return NextResponse.json(
      { error: 'Meilisearch non configurato (NEXT_PUBLIC_MEILISEARCH_URL / API_KEY)' },
      { status: 503 }
    );
  }

  const { searchParams } = new URL(request.url);
  const q = (searchParams.get('q') ?? '').trim().slice(0, 200);
  const gameRaw = (searchParams.get('game') ?? '').trim().toLowerCase();
  const game = ALLOWED_GAMES.has(gameRaw) ? gameRaw : '';
  const limit = Math.min(20, Math.max(1, parseInt(searchParams.get('limit') ?? '10', 10) || 10));

  const filterParts: string[] = [];
  if (game) {
    filterParts.push(`game_slug = "${game.replace(/"/g, '\\"')}"`);
  }
  const filter = filterParts.length ? filterParts.join(' AND ') : undefined;

  const url = `${MEILI_URL}/indexes/${INDEX}/search`;
  const body: Record<string, unknown> = {
    q: q || undefined,
    limit: 100,
    attributesToRetrieve: ['set_name', 'set_code', 'set_icon_uri', 'game_slug', 'release_date'],
  };
  if (filter) body.filter = filter;

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${MEILI_KEY}`,
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const text = await res.text();
      return NextResponse.json(
        { error: `Meilisearch error: ${res.status}`, detail: text },
        { status: 502 }
      );
    }

    const data = (await res.json()) as { hits: MeiliSetDocument[] };
    const hits = Array.isArray(data.hits) ? data.hits : [];

    // Deduplicate by set_name, keep first occurrence
    const seen = new Map<string, SetResult>();
    for (const hit of hits) {
      const name = (hit.set_name ?? '').trim();
      if (!name || seen.has(name)) continue;
      seen.set(name, {
        set_name: name,
        set_code: hit.set_code ?? null,
        set_icon_uri: hit.set_icon_uri ?? null,
        game_slug: hit.game_slug ?? '',
        release_date: hit.release_date ?? null,
      });
      if (seen.size >= limit) break;
    }

    // Sort by release_date descending (most recent first)
    const results = Array.from(seen.values()).sort((a, b) => {
      if (!a.release_date && !b.release_date) return 0;
      if (!a.release_date) return 1;
      if (!b.release_date) return -1;
      return b.release_date.localeCompare(a.release_date);
    });

    return NextResponse.json(results, {
      headers: {
        'Cache-Control': 'public, max-age=60, stale-while-revalidate=300',
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { error: 'Ricerca set non disponibile', detail: message },
      { status: 502 }
    );
  }
}
