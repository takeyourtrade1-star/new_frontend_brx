'use client';

/**
 * Adapter InstantSearch same-origin. Host e credenziali Meilisearch restano
 * esclusivamente nella route server `/api/search/autocomplete`.
 */

interface InstantSearchRequest {
  indexName: string;
  params: {
    query?: string;
    filters?: string;
    hitsPerPage?: number;
    page?: number;
    [key: string]: unknown;
  };
}

interface InstantSearchResponse<T> {
  hits: T[];
  nbHits: number;
  page: number;
  hitsPerPage: number;
  nbPages: number;
  exhaustiveNbHits: boolean;
  query: string;
  params: string;
  processingTimeMS: number;
  index?: string;
  index_name?: string;
}

interface MultiSearchResponse<T> {
  results: Array<InstantSearchResponse<T>>;
}

export const searchClient = {
  async search<T>(requests: InstantSearchRequest[]): Promise<MultiSearchResponse<T>> {
    const response = await fetch('/api/search/autocomplete', {
      method: 'POST',
      credentials: 'same-origin',
      headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify({ requests }),
    });
    if (!response.ok) {
      throw new Error('Ricerca temporaneamente non disponibile');
    }
    return response.json() as Promise<MultiSearchResponse<T>>;
  },
};
