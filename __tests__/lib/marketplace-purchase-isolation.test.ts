// @vitest-environment node

import { afterEach, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { marketplaceProxyPolicy } from '@/app/api/_lib/marketplace-proxy-policy';

afterEach(() => {
  vi.resetModules();
  vi.unstubAllGlobals();
  delete process.env.MARKETPLACE_API_URL;
});

it('hard-denies marketplace purchase creation without contacting the service', async () => {
  expect(marketplaceProxyPolicy('orders', 'GET')).toEqual({
    allowed: true,
    public: false,
  });
  expect(marketplaceProxyPolicy('orders', 'POST')).toEqual({
    allowed: false,
    public: false,
  });

  process.env.MARKETPLACE_API_URL = 'http://127.0.0.1:8003';
  const fetchMock = vi.fn();
  vi.stubGlobal('fetch', fetchMock);
  const { POST } = await import('@/app/api/marketplace/[...path]/route');
  const response = await POST(
    new NextRequest('http://localhost:3000/api/marketplace/orders', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        cookie: 'ebartex_access_token=opaque-session',
      },
      body: JSON.stringify({ listing_id: 'listing-1' }),
    }),
    { params: Promise.resolve({ path: ['orders'] }) },
  );

  expect(response.status).toBe(404);
  expect(response.headers.get('cache-control')).toMatch(/no-store/);
  expect(fetchMock).not.toHaveBeenCalled();
});
