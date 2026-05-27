import type { SearchHit } from '@/app/api/search/route';
import { getCardImageUrl } from '@/lib/assets';

export interface PreviewCard {
  id: string;
  name: string;
  imageUrl: string;
  setName: string;
  gameSlug: string;
  rarity?: string;
}

type SearchHitWithImageFields = SearchHit & {
  image_path?: string | null;
  image_uri_normal?: string | null;
  image_uri_small?: string | null;
};

function resolveImageUrl(hit: SearchHitWithImageFields): string | null {
  const raw =
    hit.image ?? hit.image_path ?? hit.image_uri_normal ?? hit.image_uri_small ?? null;
  return getCardImageUrl(raw);
}

/** Maps a Meilisearch hit to a preview card, or null if name/image are missing. */
export function hitToPreviewCard(hit: SearchHit): PreviewCard | null {
  const imageUrl = resolveImageUrl(hit as SearchHitWithImageFields);
  if (!imageUrl) return null;
  const name = hit.name?.trim();
  if (!name) return null;
  return {
    id: hit.id,
    name,
    imageUrl,
    setName: hit.set_name ?? '',
    gameSlug: hit.game_slug ?? '',
    rarity: hit.rarity,
  };
}

const RANDOM_QUERY_SEEDS = [
  'a', 'e', 'i', 'o', 'u', 'dr', 'bl', 'ex', 'th', 'st', 'ph', 'ar', 'el', 'or', 'ka',
];

function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

async function searchHits(q: string, page: number, limit: number): Promise<SearchHit[]> {
  const params = new URLSearchParams({
    q,
    limit: String(limit),
    page: String(page),
    sort: 'name_asc',
  });
  const res = await fetch(`/api/search?${params.toString()}`);
  if (!res.ok) return [];
  const json = (await res.json()) as { hits?: SearchHit[] };
  return Array.isArray(json.hits) ? json.hits : [];
}

/**
 * Fetches catalog cards with valid image URLs from Meilisearch (randomized queries).
 * Returns more than `targetCount` so the UI can drop cards whose images fail to load.
 */
export async function fetchPreviewCards(targetCount: number): Promise<PreviewCard[]> {
  const collected = new Map<string, PreviewCard>();
  const goal = Math.max(targetCount * 2, 24);
  const seeds = shuffle(RANDOM_QUERY_SEEDS);

  for (const seed of seeds) {
    if (collected.size >= goal) break;
    const page = 1 + Math.floor(Math.random() * 50);
    const hits = await searchHits(seed, page, 40);
    for (const hit of hits) {
      const card = hitToPreviewCard(hit);
      if (card) collected.set(card.id, card);
      if (collected.size >= goal) break;
    }
  }

  if (collected.size < goal) {
    const page = 1 + Math.floor(Math.random() * 100);
    const hits = await searchHits('', page, 50);
    for (const hit of hits) {
      const card = hitToPreviewCard(hit);
      if (card) collected.set(card.id, card);
    }
  }

  return shuffle(Array.from(collected.values()));
}
