'use client';

/**
 * Meilisearch client per react-instantsearch (Game-First search)
 * Usa MEILISEARCH da config. In produzione su AWS impostare NEXT_PUBLIC_MEILISEARCH_URL.
 * Fallback su localhost:7700 solo in sviluppo (o quando l'app è servita da localhost).
 */

import { instantMeiliSearch } from '@meilisearch/instant-meilisearch';
import { MEILISEARCH } from '@/lib/config';

function getMeiliUrl(): string {
  if (MEILISEARCH.host) return MEILISEARCH.host;
  if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
    return 'http://localhost:7700';
  }
  return '';
}

const MEILI_URL = getMeiliUrl();
const MEILI_KEY = MEILISEARCH.apiKey;

const meiliInstance = instantMeiliSearch(
  MEILI_URL || 'https://meilisearch-not-configured.invalid',
  MEILI_KEY || undefined,
  { primaryKey: 'id', keepZeroFacets: true }
);

export const searchClient = meiliInstance.searchClient;
export const meilisearchInstance = meiliInstance;
