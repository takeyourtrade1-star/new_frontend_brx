import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { POST } from '@/app/api/search/availability/route';
import { fetchWithBodyDeadline } from '@/app/api/_lib/upstream-fetch';

vi.mock('@/app/api/_lib/rate-limit', () => ({
  checkRateLimit: vi.fn().mockResolvedValue({ allowed: true }),
  rateLimitExceededResponse: vi.fn(),
}));

vi.mock('@/lib/server-runtime-env', () => ({
  getSyncApiUrlEnv: vi.fn(() => 'http://localhost:8002'),
  getMarketplaceApiUrlEnv: vi.fn(() => 'http://localhost:8004'),
}));

vi.mock('@/app/api/_lib/upstream-fetch', () => ({
  fetchWithBodyDeadline: vi.fn(),
}));

function request(body: unknown, headers?: HeadersInit) {
  return new NextRequest('http://localhost:3000/api/search/availability', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: JSON.stringify(body),
  });
}

describe('Route: POST /api/search/availability', () => {
  beforeEach(() => vi.clearAllMocks());

  it('unisce Sync e Marketplace e conta ogni venditore disponibile una sola volta', async () => {
    vi.mocked(fetchWithBodyDeadline).mockImplementation(async (input) => {
      const url = String(input);
      if (url.includes('/sync/listings/')) {
        return Response.json({
          listings: [
            { seller_id: 'seller-a', quantity: 2, reserved_quantity: 0 },
            { seller_id: 'seller-b', quantity: 1, reserved_quantity: 1 },
          ],
        });
      }
      return Response.json({
        items: [
          { seller_id: 'seller-a', quantity: 1, reserved_quantity: 0 },
          { seller_id: 'seller-c', quantity: 3, reserved_quantity: 1 },
        ],
      });
    });

    const response = await POST(request({
      cards: [{ cardId: 'mtg_123', blueprintId: 123 }],
    }));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      availability: { mtg_123: { sellerCount: 2 } },
    });
    expect(fetchWithBodyDeadline).toHaveBeenCalledTimes(2);
    expect(vi.mocked(fetchWithBodyDeadline).mock.calls.map(([url]) => String(url))).toEqual(
      expect.arrayContaining([
        'http://localhost:8002/api/v1/sync/listings/blueprint/123',
        'http://localhost:8004/api/v1/listings/public/by-blueprint/123?card_id=mtg_123',
      ]),
    );
  });

  it('restituisce null se entrambe le sorgenti falliscono, senza inventare zero venditori', async () => {
    vi.mocked(fetchWithBodyDeadline).mockRejectedValue(new Error('offline'));

    const response = await POST(request({
      cards: [{ cardId: 'mtg_456', blueprintId: 456 }],
    }));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      availability: { mtg_456: { sellerCount: null } },
    });
  });

  it('non espone un conteggio parziale se una sola sorgente fallisce', async () => {
    vi.mocked(fetchWithBodyDeadline).mockImplementation(async (input) => {
      if (String(input).includes('/sync/listings/')) {
        return Response.json({ listings: [{ seller_id: 'seller-a', quantity: 1 }] });
      }
      throw new Error('marketplace offline');
    });

    const response = await POST(request({
      cards: [{ cardId: 'mtg_457', blueprintId: 457 }],
    }));

    await expect(response.json()).resolves.toEqual({
      availability: { mtg_457: { sellerCount: null } },
    });
  });

  it('deduplica il fan-out quando piu risultati condividono lo stesso blueprint', async () => {
    vi.mocked(fetchWithBodyDeadline).mockImplementation(async (input) =>
      String(input).includes('/sync/listings/')
        ? Response.json({ listings: [] })
        : Response.json({ items: [] }),
    );

    const response = await POST(request({
      cards: [
        { cardId: 'mtg_789', blueprintId: 789 },
        { cardId: 'variant_789', blueprintId: 789 },
      ],
    }));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      availability: {
        mtg_789: { sellerCount: 0 },
        variant_789: { sellerCount: 0 },
      },
    });
    expect(fetchWithBodyDeadline).toHaveBeenCalledTimes(2);
  });

  it('indica se il venditore richiesto ha quella stampa realmente disponibile', async () => {
    const sellerId = '019c003d-44a9-7047-afff-de22c9476227';
    vi.mocked(fetchWithBodyDeadline).mockImplementation(async (input) =>
      String(input).includes('/sync/listings/')
        ? Response.json({
            listings: [{ seller_id: sellerId, quantity: 2, reserved_quantity: 0 }],
          })
        : Response.json({ items: [] }),
    );

    const response = await POST(request({
      cards: [{ cardId: 'mtg_123', blueprintId: 123 }],
      sellerId,
    }));

    await expect(response.json()).resolves.toEqual({
      availability: {
        mtg_123: { sellerCount: 1, sellerAvailable: true },
      },
    });
  });

  it('rifiuta un identificativo venditore non UUID', async () => {
    const response = await POST(request({
      cards: [{ cardId: 'mtg_123', blueprintId: 123 }],
      sellerId: '../admin',
    }));

    expect(response.status).toBe(400);
    expect(fetchWithBodyDeadline).not.toHaveBeenCalled();
  });

  it('rifiuta ID non validi prima di interrogare i servizi', async () => {
    const response = await POST(request({
      cards: [{ cardId: '../admin', blueprintId: 1 }],
    }));

    expect(response.status).toBe(400);
    expect(fetchWithBodyDeadline).not.toHaveBeenCalled();
  });

  it('rifiuta richieste cross-site prima di leggere il body', async () => {
    const response = await POST(request(
      { cards: [{ cardId: 'mtg_123', blueprintId: 123 }] },
      { Origin: 'https://attacker.example', 'Sec-Fetch-Site': 'cross-site' },
    ));

    expect(response.status).toBe(403);
    expect(fetchWithBodyDeadline).not.toHaveBeenCalled();
  });
});
