import { afterEach, describe, expect, it, vi } from 'vitest';

import { searchClient } from '@/lib/meilisearchClient';

describe('InstantSearch autocomplete client', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('sends a fresh canonical payload and maps the Algolia filter alias to filters', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ results: [] }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }),
    );
    vi.stubGlobal('fetch', fetchMock);

    const requests = [
      {
        indexName: 'cards',
        params: {
          query: 'black lotus',
          hitsPerPage: 8,
          page: 2,
          filter: 'game_slug = "mtg"',
          highlightPreTag: '__ais-highlight__',
          highlightPostTag: '__/ais-highlight__',
          attributesToHighlight: ['name'],
        },
      },
      {
        indexName: 'cards',
        params: {
          query: 'charizard',
          filters: 'category_id = 42',
          filter: 'game_slug = "pokemon"',
          analytics: true,
        },
      },
    ];

    await searchClient.search(requests);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/search/autocomplete',
      expect.objectContaining({
        method: 'POST',
        credentials: 'same-origin',
      }),
    );
    const init = fetchMock.mock.calls[0]?.[1] as RequestInit;
    expect(JSON.parse(String(init.body))).toEqual({
      requests: [
        {
          indexName: 'cards',
          params: {
            query: 'black lotus',
            hitsPerPage: 8,
            page: 2,
            filters: 'game_slug = "mtg"',
          },
        },
        {
          indexName: 'cards',
          params: {
            query: 'charizard',
            filters: 'category_id = 42',
          },
        },
      ],
    });

    // L'adapter non muta le richieste possedute da InstantSearch.
    expect(requests[0].params.highlightPreTag).toBe('__ais-highlight__');
    expect(requests[1].params.filter).toBe('game_slug = "pokemon"');
  });
});
