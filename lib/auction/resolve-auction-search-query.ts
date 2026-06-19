/**
 * Risolve una query di ricerca aste tramite Meilisearch (catalogo MTG)
 * per mappare nomi localizzati → nomi EN e termini di match.
 */

import { getLocalizedName } from '@/lib/card-display-name';
import type { SearchHit } from '@/app/api/search/route';

export type ResolvedAuctionSearch = {
  /** Query da passare all'API aste (nome EN del top hit, o query raw). */
  apiQ: string | undefined;
  /** Termini per filtro client supplementare (titolo / venditore). */
  matchTerms: string[];
};

const MIN_QUERY_LEN = 2;

function collectTermsFromHit(hit: SearchHit, lang: string): string[] {
  const terms: string[] = [];
  if (hit.name?.trim()) terms.push(hit.name.trim());
  const localized = getLocalizedName(hit.keywords_localized, lang);
  if (localized) terms.push(localized);
  if (Array.isArray(hit.keywords_localized)) {
    for (const kw of hit.keywords_localized) {
      if (typeof kw === 'string' && kw.trim()) terms.push(kw.trim());
    }
  }
  return terms;
}

function dedupeLower(terms: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const t of terms) {
    const key = t.toLowerCase();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push(t);
  }
  return out;
}

export async function resolveAuctionSearchQuery(
  rawQuery: string,
  lang: string
): Promise<ResolvedAuctionSearch> {
  const trimmed = rawQuery.trim();
  if (trimmed.length < MIN_QUERY_LEN) {
    return { apiQ: undefined, matchTerms: [] };
  }

  try {
    const params = new URLSearchParams({
      q: trimmed,
      game: 'mtg',
      limit: '8',
    });
    const res = await fetch(`/api/search?${params.toString()}`);
    if (!res.ok) {
      return { apiQ: trimmed, matchTerms: [] };
    }
    const data = (await res.json()) as { hits?: SearchHit[] };
    const hits = data.hits ?? [];
    if (hits.length === 0) {
      return { apiQ: trimmed, matchTerms: [] };
    }

    const allTerms = hits.flatMap((h) => collectTermsFromHit(h, lang));
    const matchTerms = dedupeLower(allTerms);
    const apiQ = hits[0]?.name?.trim() || trimmed;

    return { apiQ, matchTerms };
  } catch {
    return { apiQ: trimmed, matchTerms: [] };
  }
}

export function auctionMatchesSearchTerms(
  auction: { title: string; setName?: string | null; seller: string; sellerDisplayName?: string },
  matchTerms: string[],
  rawQuery: string
): boolean {
  const needle = rawQuery.trim().toLowerCase();
  if (!needle && matchTerms.length === 0) return true;

  const hay = `${auction.title} ${auction.setName ?? ''} ${auction.seller} ${auction.sellerDisplayName ?? ''}`.toLowerCase();
  const tokens = needle.split(/\s+/).filter(Boolean);
  const cardTerms = matchTerms.length > 0 ? matchTerms : needle ? [needle] : [];
  const cardMatched = cardTerms.some((t) => hay.includes(t.toLowerCase()));

  if (cardMatched) {
    const cardTermTokens = new Set(cardTerms.flatMap((t) => t.toLowerCase().split(/\s+/)));
    for (const tok of tokens) {
      if (cardTermTokens.has(tok)) continue;
      if (!hay.includes(tok)) return false;
    }
    return true;
  }
  for (const tok of tokens) {
    if (!hay.includes(tok)) return false;
  }
  return true;
}
