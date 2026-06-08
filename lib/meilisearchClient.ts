'use client';

/**
 * Search client per react-instantsearch (Game-First search) usato da GlobalSearchBar.
 *
 * SICUREZZA: questo client NON parla più direttamente con Meilisearch (niente
 * instantMeiliSearch + NEXT_PUBLIC_MEILISEARCH_API_KEY nel browser). Ogni richiesta
 * viene inoltrata a /api/search/autocomplete, una route handler server-side che
 * detiene le credenziali Meilisearch (variabili server-only, mai nel bundle) e
 * applica validazione/normalizzazione/limiti prima di interrogare l'istanza.
 *
 * L'oggetto esportato implementa l'interfaccia SearchClient (stile Algolia)
 * richiesta da react-instantsearch: solo `search` è necessario per questa UI.
 */

import type {
  SearchClient,
  SearchOptions,
  SearchResponses,
} from 'algoliasearch-helper/types/algoliasearch.js';
import { MEILISEARCH_PUBLIC_INDEX_NAME } from '@/lib/config';

function emptySearchResult<T>(
  indexName: string,
  params: SearchOptions
): SearchResponses<T>['results'][number] {
  const hitsPerPage = typeof params.hitsPerPage === 'number' ? params.hitsPerPage : 8;
  const page = typeof params.page === 'number' ? params.page : 0;
  const query = typeof params.query === 'string' ? params.query : '';

  return {
    hits: [],
    nbHits: 0,
    page,
    hitsPerPage,
    nbPages: 0,
    exhaustiveNbHits: true,
    query,
    params: '',
    processingTimeMS: 0,
    index: indexName,
  };
}

async function proxySearch<T>(
  requests: Array<{ indexName: string; params: SearchOptions }>
): Promise<SearchResponses<T>> {
  if (requests.length === 0) {
    return { results: [] };
  }

  const payload = {
    requests: requests.map(({ indexName, params }) => ({
      indexName,
      params: {
        query: params.query ?? '',
        filters: params.filters,
        hitsPerPage: params.hitsPerPage,
        page: params.page,
      },
    })),
  };

  const res = await fetch('/api/search/autocomplete', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    return {
      results: requests.map(({ indexName, params }) =>
        emptySearchResult<T>(indexName || MEILISEARCH_PUBLIC_INDEX_NAME, params)
      ),
    };
  }

  return (await res.json()) as SearchResponses<T>;
}

export const searchClient: SearchClient = {
  search: proxySearch,
};
