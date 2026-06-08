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
 * L'oggetto esportato implementa solo la porzione dell'interfaccia SearchClient
 * (stile Algolia) usata da react-instantsearch in questo progetto: `search`.
 * `searchForFacetValues` non è utilizzato dalla UI (nessun widget a faccette),
 * quindi restituisce un array vuoto per restare un no-op sicuro.
 */

interface ProxySearchRequest {
  indexName?: string;
  params?: {
    query?: string;
    filters?: string;
    hitsPerPage?: number;
    page?: number;
    [key: string]: unknown;
  };
}

async function proxySearch(requests: readonly ProxySearchRequest[]): Promise<{ results: unknown[] }> {
  if (!requests || requests.length === 0) {
    return { results: [] };
  }

  const payload = {
    requests: requests.map((req) => ({
      indexName: req.indexName,
      params: {
        query: req.params?.query ?? '',
        filters: req.params?.filters,
        hitsPerPage: req.params?.hitsPerPage,
        page: req.params?.page,
      },
    })),
  };

  const res = await fetch('/api/search/autocomplete', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    // Restituisce risultati vuoti invece di far crollare la UI: la search bar
    // mostrerà semplicemente "nessun risultato" finché il servizio non torna disponibile.
    return {
      results: requests.map((req) => ({
        hits: [],
        nbHits: 0,
        page: req.params?.page ?? 0,
        hitsPerPage: req.params?.hitsPerPage ?? 8,
        nbPages: 0,
        exhaustiveNbHits: true,
        query: req.params?.query ?? '',
        params: '',
        processingTimeMS: 0,
        index: req.indexName ?? 'cards',
      })),
    };
  }

  return (await res.json()) as { results: unknown[] };
}

export const searchClient = {
  search: proxySearch,
  // No-op: nessun widget di faccette nella UI; evita che react-instantsearch
  // tenti di colpire un endpoint che non esiste.
  searchForFacetValues: async () => [],
};
