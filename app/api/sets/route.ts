/**
 * GET /api/sets?q=...&game=...&limit=10
 * Cerca set/edizioni in Meilisearch per nome.
 * Restituisce set unici (deduplicati per set_name) con icon, code, game, release_date.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getMeilisearchServerConfig } from '@/lib/meilisearch-server-env';
import { readJsonResponseWithLimit } from '@/app/api/_lib/bounded-json-response';
import { checkRateLimit, rateLimitExceededResponse } from '@/app/api/_lib/rate-limit';
import { appendQueryWithPolicy } from '@/app/api/_lib/query-policy';
import { safePublicImageUrl } from '@/lib/security/catalog-public-data';

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
  const rateLimit = await checkRateLimit(request, {
    scope: 'catalog:sets',
    limit: 30,
    windowMs: 60_000,
  });
  if (!rateLimit.allowed) return rateLimitExceededResponse(rateLimit);

  const safeQuery = new URL('https://catalog.invalid/');
  if (
    !appendQueryWithPolicy(safeQuery, request.nextUrl, {
      q: (value) => value.length <= 200 && !/[\u0000-\u001f\u007f]/.test(value),
      game: /^(?:mtg|pokemon|one-piece|op|pk|yugioh)?$/,
      limit: /^(?:[1-9]|1\d|20)$/,
    })
  ) {
    return NextResponse.json({ error: 'Query non valida' }, { status: 400 });
  }
  const { url: MEILI_URL, apiKey: MEILI_KEY, index: INDEX } = getMeilisearchServerConfig();

  if (!MEILI_URL || !MEILI_KEY) {
    return NextResponse.json(
      { error: 'Ricerca set non disponibile' },
      { status: 503 }
    );
  }

  const { searchParams } = safeQuery;
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
        'Accept-Encoding': 'identity',
        'Content-Type': 'application/json',
        Authorization: `Bearer ${MEILI_KEY}`,
      },
      body: JSON.stringify(body),
      redirect: 'error',
      signal: AbortSignal.timeout(5_000),
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: 'Ricerca set non disponibile' },
        { status: 502 }
      );
    }

    const data = (await readJsonResponseWithLimit(res, 2 * 1_024 * 1_024)) as {
      hits: MeiliSetDocument[];
    };
    const hits = Array.isArray(data.hits) ? data.hits : [];

    // Deduplicate by set_name, keep first occurrence
    const seen = new Map<string, SetResult>();
    for (const hit of hits) {
      const name = (hit.set_name ?? '').trim();
      if (!name || seen.has(name)) continue;
      seen.set(name, {
        set_name: name,
        set_code: hit.set_code ?? null,
        set_icon_uri: safePublicImageUrl(hit.set_icon_uri, 'set-icon'),
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
  } catch {
    return NextResponse.json(
      { error: 'Ricerca set non disponibile' },
      { status: 502 }
    );
  }
}
