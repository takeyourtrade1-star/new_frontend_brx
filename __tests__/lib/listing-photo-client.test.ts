import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  fetchListingCoverPhotos,
  getListingPhotos,
  ListingPhotoApiError,
} from '@/lib/api/listing-photo-client';

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('fetchListingCoverPhotos', () => {
  it('deduplica e ordina gli ID, conservando anche le inserzioni senza foto', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse({
        data: {
          covers: {
            a: { id: 1, cdn_url: 'https://cdn.ebartex.com/a.jpg', position: 0 },
          },
        },
      }),
    );
    vi.stubGlobal('fetch', fetchMock);

    await expect(fetchListingCoverPhotos(['b', 'a', 'a'])).resolves.toEqual({
      a: { id: 1, cdn_url: 'https://cdn.ebartex.com/a.jpg', position: 0 },
      b: null,
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const requestedUrl = new URL(String(fetchMock.mock.calls[0]?.[0]), 'https://www.ebartex.com');
    expect(requestedUrl.searchParams.get('ids')).toBe('a,b');
  });

  it('limita a due le richieste batch contemporanee', async () => {
    let activeRequests = 0;
    let maxActiveRequests = 0;
    const fetchMock = vi.fn(async () => {
      activeRequests += 1;
      maxActiveRequests = Math.max(maxActiveRequests, activeRequests);
      await new Promise((resolve) => setTimeout(resolve, 5));
      activeRequests -= 1;
      return jsonResponse({ data: { covers: {} } });
    });
    vi.stubGlobal('fetch', fetchMock);

    const ids = Array.from({ length: 81 }, (_, index) => `listing-${String(index).padStart(2, '0')}`);
    const result = await fetchListingCoverPhotos(ids);

    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(maxActiveRequests).toBe(2);
    expect(Object.keys(result)).toHaveLength(81);
    expect(Object.values(result).every((photo) => photo === null)).toBe(true);
  });

  it('espone lo status HTTP per applicare il retry selettivo', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(jsonResponse({ detail: 'Richiesta non valida' }, 400)),
    );

    const error = await fetchListingCoverPhotos(['listing-1']).catch((caught: unknown) => caught);

    expect(error).toBeInstanceOf(ListingPhotoApiError);
    expect(error).toMatchObject({ status: 400, message: 'Richiesta non valida' });
  });
});

describe('cache foto inserzione', () => {
  it('non tratta la cover batch come una galleria completa', async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes('/photos/by-listing/')) {
        return jsonResponse({
          data: {
            photos: [
              { id: 2, cdn_url: 'https://cdn.ebartex.com/front.jpg', position: 0 },
              { id: 3, cdn_url: 'https://cdn.ebartex.com/back.jpg', position: 1 },
            ],
          },
        });
      }
      return jsonResponse({
        data: {
          covers: {
            shared: { id: 2, cdn_url: 'https://cdn.ebartex.com/front.jpg', position: 0 },
          },
        },
      });
    });
    vi.stubGlobal('fetch', fetchMock);

    await fetchListingCoverPhotos(['shared']);
    const fullGallery = await getListingPhotos('shared');

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fullGallery).toHaveLength(2);
    expect(fullGallery[1]?.cdn_url).toBe('https://cdn.ebartex.com/back.jpg');
  });
});
