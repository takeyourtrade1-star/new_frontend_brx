'use client';

/**
 * Meilisearch client per react-instantsearch (Game-First search).
 * Usa NEXT_PUBLIC_MEILISEARCH_URL e NEXT_PUBLIC_MEILISEARCH_API_KEY da config/Amplify.
 */

import { instantMeiliSearch } from '@meilisearch/instant-meilisearch';
import { MEILISEARCH } from '@/lib/config';

const meiliInstance = instantMeiliSearch(
  MEILISEARCH.host || 'https://meilisearch-not-configured.invalid',
  MEILISEARCH.apiKey || undefined,
  { primaryKey: 'id', keepZeroFacets: true }
);

export const searchClient = meiliInstance.searchClient;
export const meilisearchInstance = meiliInstance;
