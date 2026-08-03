// @vitest-environment node

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const VALID_COOKIE =
  'ebartex_access_token=eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyXzEyMyIsImV4cCI6OTk5OTk5OTk5OX0.sig';

function jsonResponse(payload: unknown): Response {
  return new Response(JSON.stringify(payload), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}

function request(path: string, authenticated = false): NextRequest {
  return new NextRequest(`http://localhost:3000${path}`, {
    headers: authenticated ? { cookie: VALID_COOKIE } : undefined,
  });
}

beforeEach(() => {
  vi.resetModules();
  (process.env as Record<string, string>).NODE_ENV = 'development';
  process.env.AUCTION_API_URL = 'http://127.0.0.1:8001';
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  delete (process.env as Record<string, string | undefined>).NODE_ENV;
  delete process.env.AUCTION_API_URL;
});

describe('/api/auctions query contract', () => {
  it.each(['ACTIVE', 'DRAFT', 'CLOSED'])('forwards the supported %s status', async (status) => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ items: [] }));
    vi.stubGlobal('fetch', fetchMock);
    const { GET } = await import('@/app/api/auctions/route');

    const response = await GET(request(`/api/auctions?status=${status}`));

    expect(response.status).toBe(200);
    expect(fetchMock).toHaveBeenCalledOnce();
    const upstreamUrl = new URL(String(fetchMock.mock.calls[0]?.[0]));
    expect(upstreamUrl.searchParams.get('status')).toBe(status);
  });

  it.each([
    'active',
    'UNKNOWN',
    'ACTIVE,CLOSED',
    'ACTIVE%27%20OR%201%3D1--',
  ])('rejects unsupported or malformed status %s', async (status) => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    const { GET } = await import('@/app/api/auctions/route');

    const response = await GET(request(`/api/auctions?status=${status}`));

    expect(response.status).toBe(400);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe('/api/orders query contract', () => {
  it('forwards a comma-separated list of supported uppercase statuses', async () => {
    const statuses = [
      'PAYMENT_PENDING',
      'PAYMENT_OVERDUE',
      'DISPUTED',
      'PAID',
      'SHIPPED',
      'DELIVERED',
      'CANCELLED',
      'REASSIGNED',
    ].join(',');
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ items: [] }));
    vi.stubGlobal('fetch', fetchMock);
    const { GET } = await import('@/app/api/orders/[...path]/route');

    const response = await GET(request(`/api/orders/buyer?status=${statuses}`, true), {
      params: Promise.resolve({ path: ['buyer'] }),
    });

    expect(response.status).toBe(200);
    expect(fetchMock).toHaveBeenCalledOnce();
    const upstreamUrl = new URL(String(fetchMock.mock.calls[0]?.[0]));
    expect(upstreamUrl.searchParams.get('status')).toBe(statuses);
  });

  it.each([
    'payment_pending',
    'PAYMENT_PENDING,',
    'PAYMENT_PENDING,,PAID',
    'PAYMENT_PENDING,PAYMENT_PENDING',
    'PAYMENT_PENDING,UNKNOWN',
    'PAYMENT_PENDING%2C%20OR%201%3D1',
  ])('rejects unsupported or malformed status list %s', async (status) => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    const { GET } = await import('@/app/api/orders/[...path]/route');

    const response = await GET(request(`/api/orders/seller?status=${status}`, true), {
      params: Promise.resolve({ path: ['seller'] }),
    });

    expect(response.status).toBe(400);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe('/api/trades query contract', () => {
  it('forwards a comma-separated list of supported uppercase statuses', async () => {
    const statuses = [
      'PROPOSED',
      'ACCEPTING',
      'ACCEPTED',
      'DECLINED',
      'CANCELLED',
      'EXPIRED',
      'COUNTERED',
      'COMPLETED',
      'DISPUTED',
    ].join(',');
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ items: [] }));
    vi.stubGlobal('fetch', fetchMock);
    const { GET } = await import('@/app/api/trades/route');

    const response = await GET(request(`/api/trades?role=received&status=${statuses}`, true));

    expect(response.status).toBe(200);
    expect(fetchMock).toHaveBeenCalledOnce();
    const upstreamUrl = new URL(String(fetchMock.mock.calls[0]?.[0]));
    expect(upstreamUrl.searchParams.get('role')).toBe('received');
    expect(upstreamUrl.searchParams.get('status')).toBe(statuses);
  });

  it.each([
    'proposed',
    'PROPOSED,',
    'PROPOSED,,ACCEPTED',
    'PROPOSED,PROPOSED',
    'PROPOSED,UNKNOWN',
    'PROPOSED%2C%20OR%201%3D1',
  ])('rejects unsupported or malformed status list %s', async (status) => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    const { GET } = await import('@/app/api/trades/route');

    const response = await GET(request(`/api/trades?status=${status}`, true));

    expect(response.status).toBe(400);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
