import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';
import { GET as searchGET } from '@/app/api/search/route';
import { POST as autocompletePOST } from '@/app/api/search/autocomplete/route';
import { POST as scannerCandidatesPOST } from '@/app/api/search/scanner-candidates/route';
import * as meiliServerEnv from '@/lib/meilisearch-server-env';
import * as searchUtils from '@/lib/search/search-request-utils';

// Mock getMeilisearchServerConfig
vi.mock('@/lib/meilisearch-server-env', async () => {
  const actual = await vi.importActual<typeof meiliServerEnv>('@/lib/meilisearch-server-env');
  return {
    ...actual,
    getMeilisearchServerConfig: vi.fn(),
  };
});

// Mock fetchMeiliWithTimeout
vi.mock('@/lib/search/search-request-utils', async () => {
  const actual = await vi.importActual<typeof searchUtils>('@/lib/search/search-request-utils');
  return {
    ...actual,
    fetchMeiliWithTimeout: vi.fn(),
  };
});

describe('Search request normalizations', () => {
  describe('normalizeQuery', () => {
    it('strips control characters and trims/slices query', () => {
      const queryWithControls = '\x00Hello\x1f \x7fWorld!\n';
      expect(searchUtils.normalizeQuery(queryWithControls)).toBe('Hello World!');

      const longQuery = 'a'.repeat(300);
      expect(searchUtils.normalizeQuery(longQuery)).toHaveLength(200);
    });

    it('returns empty string for empty input', () => {
      expect(searchUtils.normalizeQuery(null)).toBe('');
      expect(searchUtils.normalizeQuery(undefined)).toBe('');
      expect(searchUtils.normalizeQuery('')).toBe('');
    });
  });

  describe('normalizeLimit', () => {
    it('clamps limit to bounds', () => {
      expect(searchUtils.normalizeLimit('10')).toBe(10);
      expect(searchUtils.normalizeLimit('0')).toBe(1);
      expect(searchUtils.normalizeLimit('-5')).toBe(1);
      expect(searchUtils.normalizeLimit('100')).toBe(60); // MAX_LIMIT = 60
      expect(searchUtils.normalizeLimit('invalid')).toBe(20); // DEFAULT_LIMIT = 20
    });
  });

  describe('normalizePage', () => {
    it('clamps page to bounds', () => {
      expect(searchUtils.normalizePage('5')).toBe(5);
      expect(searchUtils.normalizePage('0')).toBe(1);
      expect(searchUtils.normalizePage('-10')).toBe(1);
      expect(searchUtils.normalizePage('invalid')).toBe(1);
    });
  });

  describe('normalizeBoolean', () => {
    it('accepts only the literal true value', () => {
      expect(searchUtils.normalizeBoolean('true')).toBe(true);
      expect(searchUtils.normalizeBoolean(' true ')).toBe(true);
      expect(searchUtils.normalizeBoolean('TRUE')).toBe(false);
      expect(searchUtils.normalizeBoolean('1')).toBe(false);
      expect(searchUtils.normalizeBoolean(null)).toBe(false);
    });
  });

  describe('normalizeCategoryIds', () => {
    it('filters, deduplicates, and limits category IDs', () => {
      const raw = '1,2,2,3,invalid,9999999,10';
      expect(searchUtils.normalizeCategoryIds(raw)).toEqual([1, 2, 3, 10]);

      // Checks MAX_CATEGORY_IDS limit
      const manyIds = Array.from({ length: 30 }, (_, i) => i + 1).join(',');
      const result = searchUtils.normalizeCategoryIds(manyIds);
      expect(result).toHaveLength(20); // MAX_CATEGORY_IDS = 20
    });
  });
});

describe('Route: GET /api/search', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(meiliServerEnv.getMeilisearchServerConfig).mockReturnValue({
      url: 'https://meili.local',
      apiKey: 'test-key',
      index: 'cards',
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('performs normal search request successfully', async () => {
    const mockHits = [{ id: 'mtg_123', name: 'Lightning Bolt', game_slug: 'mtg', category_id: 1, set_name: 'Alpha' }];
    vi.mocked(searchUtils.fetchMeiliWithTimeout).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        hits: mockHits,
        estimatedTotalHits: 1,
        offset: 0,
        limit: 20,
      }),
    } as Response);

    const req = new NextRequest('http://localhost:3000/api/search?q=lightning&game=mtg&limit=10&page=1');
    const res = await searchGET(req);
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.hits).toEqual(mockHits);
    expect(data.total).toBe(1);
    expect(data.page).toBe(1);
    expect(data.limit).toBe(10);
    expect(data).not.toHaveProperty('hasExactMatch');
    expect(data).not.toHaveProperty('exactHits');
    expect(data).not.toHaveProperty('similarHits');
  });

  it('returns only additive exact-match metadata when exact mode is active', async () => {
    const mockHits = [
      { id: 'mtg_1', name: 'Black Lotus', game_slug: 'mtg', category_id: 1, set_name: 'Alpha' },
      { id: 'mtg_2', name: ' black lotus ', game_slug: 'mtg', category_id: 1, set_name: 'Beta' },
      { id: 'mtg_3', name: 'Blacker Lotus', game_slug: 'mtg', category_id: 1, set_name: 'Custom' },
    ];
    vi.mocked(searchUtils.fetchMeiliWithTimeout).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ hits: mockHits, estimatedTotalHits: mockHits.length }),
    } as Response);

    const req = new NextRequest(
      'http://localhost:3000/api/search?q=BLACK%20LOTUS&exact_mode=true'
    );
    const res = await searchGET(req);
    const data = await res.json();

    expect(data.hits).toEqual(mockHits);
    expect(data.hasExactMatch).toBe(true);
    expect(data.exactHits).toEqual(mockHits.slice(0, 2));
    expect(data).not.toHaveProperty('similarHits');
  });

  it('returns fuzzy hits separately only when show_similar is active', async () => {
    const exactHit = { id: 'mtg_1', name: 'Black Lotus' };
    const fuzzyHit = { id: 'mtg_2', name: 'Blacker Lotus' };
    vi.mocked(searchUtils.fetchMeiliWithTimeout).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ hits: [exactHit, fuzzyHit], estimatedTotalHits: 2 }),
    } as Response);

    const req = new NextRequest(
      'http://localhost:3000/api/search?q=Black%20Lotus&exact_mode=true&show_similar=true'
    );
    const res = await searchGET(req);
    const data = await res.json();

    expect(data.hasExactMatch).toBe(true);
    expect(data.exactHits).toEqual([exactHit]);
    expect(data.similarHits).toEqual([fuzzyHit]);
  });

  it('keeps the full hit list usable when exact mode finds no exact name', async () => {
    const mockHits = [
      { id: 'mtg_1', name: 'Black Lotus' },
      { id: 'mtg_2', name: 'Blacker Lotus' },
    ];
    vi.mocked(searchUtils.fetchMeiliWithTimeout).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ hits: mockHits, estimatedTotalHits: 2 }),
    } as Response);

    const req = new NextRequest(
      'http://localhost:3000/api/search?q=Black%20Lot&exact_mode=true'
    );
    const res = await searchGET(req);
    const data = await res.json();

    expect(data.hits).toEqual(mockHits);
    expect(data.hasExactMatch).toBe(false);
    expect(data.exactHits).toEqual([]);
    expect(data).not.toHaveProperty('similarHits');
  });

  it('falls back to search without sort if Meilisearch returns 400', async () => {
    // 1st request with sort fails with 400
    vi.mocked(searchUtils.fetchMeiliWithTimeout)
      .mockResolvedValueOnce({
        ok: false,
        status: 400,
      } as Response)
      // 2nd request without sort succeeds
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          hits: [{ id: 'mtg_123', name: 'Lightning Bolt' }],
          estimatedTotalHits: 1,
        }),
      } as Response);

    const req = new NextRequest('http://localhost:3000/api/search?q=lightning&sort=price_asc');
    const res = await searchGET(req);
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.hits).toHaveLength(1);
    expect(data.hits[0].name).toBe('Lightning Bolt');
    expect(vi.mocked(searchUtils.fetchMeiliWithTimeout)).toHaveBeenCalledTimes(2);
  });

  it('maps Meilisearch 5xx/other error codes properly', async () => {
    vi.mocked(searchUtils.fetchMeiliWithTimeout).mockResolvedValueOnce({
      ok: false,
      status: 500,
    } as Response);

    const req = new NextRequest('http://localhost:3000/api/search?q=lightning');
    const res = await searchGET(req);
    expect(res.status).toBe(503); // publicStatusForMeiliStatus(500) -> 503
  });

  it('handles network / fetch timeout error (504)', async () => {
    vi.mocked(searchUtils.fetchMeiliWithTimeout).mockRejectedValueOnce(
      new searchUtils.MeiliFetchError('Meilisearch timeout', 504)
    );

    const req = new NextRequest('http://localhost:3000/api/search?q=lightning');
    const res = await searchGET(req);
    expect(res.status).toBe(504);
  });
});

describe('Route: POST /api/search/autocomplete', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(meiliServerEnv.getMeilisearchServerConfig).mockReturnValue({
      url: 'https://meili.local',
      apiKey: 'test-key',
      index: 'cards',
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns valid multi-query autocomplete response', async () => {
    vi.mocked(searchUtils.fetchMeiliWithTimeout).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        hits: [{ id: 'mtg_123', name: 'Lightning Bolt' }],
        estimatedTotalHits: 1,
      }),
    } as Response);

    const payload = {
      requests: [
        {
          indexName: 'cards',
          params: {
            query: 'light',
            filters: 'game_slug = "mtg"',
          },
        },
      ],
    };

    const req = new NextRequest('http://localhost:3000/api/search/autocomplete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const res = await autocompletePOST(req);
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.results).toHaveLength(1);
    expect(data.results[0].hits).toHaveLength(1);
    expect(data.results[0].hits[0].id).toBe('mtg_123');
  });

  it('rejects query if requests array is too large', async () => {
    const payload = {
      requests: Array.from({ length: 10 }, () => ({
        indexName: 'cards',
        params: { query: 'test' },
      })),
    };

    const req = new NextRequest('http://localhost:3000/api/search/autocomplete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const res = await autocompletePOST(req);
    expect(res.status).toBe(400);
  });
});

describe('Route: POST /api/search/scanner-candidates', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(meiliServerEnv.getMeilisearchServerConfig).mockReturnValue({
      url: 'https://meili.local',
      apiKey: 'test-key',
      index: 'cards',
    });
  });

  it('risolve in una sola multi-search le stampe ufficiali del lotto', async () => {
    vi.mocked(searchUtils.fetchMeiliWithTimeout).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        results: [{
          hits: [{
            id: 'mtg_123',
            cardtrader_id: 456,
            name: 'Lightning Bolt',
            set_name: 'Magic 2011',
            set_code: 'm11',
            collector_number: '149',
            image: '/cards/bolt.webp',
            available_languages: ['EN', 'it'],
            market_price: '2.50',
          }],
        }],
      }),
    } as Response);

    const request = new NextRequest('http://localhost:3000/api/search/scanner-candidates', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        items: [{
          id: 'scan-1',
          cardName: 'Lightning Bolt',
          setName: 'Magic 2011',
          setCode: 'm11',
          collectorNumber: '149',
        }],
      }),
    });

    const response = await scannerCandidatesPOST(request);
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.results['scan-1'][0]).toMatchObject({
      cardId: 'mtg_123',
      blueprintId: 456,
      availableLanguages: ['en', 'it'],
      marketPrice: 2.5,
    });
    expect(searchUtils.fetchMeiliWithTimeout).toHaveBeenCalledTimes(1);
  });

  it('non interroga il catalogo per un lotto vuoto o non valido', async () => {
    const request = new NextRequest('http://localhost:3000/api/search/scanner-candidates', {
      method: 'POST',
      body: JSON.stringify({ items: [{ id: 'scan-1', cardName: '' }] }),
    });
    const response = await scannerCandidatesPOST(request);
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ results: {} });
    expect(searchUtils.fetchMeiliWithTimeout).not.toHaveBeenCalled();
  });
});
