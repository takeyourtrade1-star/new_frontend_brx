import { afterEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const ORIGIN = 'https://ebartex.com';
const AUTH_COOKIE = 'ebartex_access_token=fake.jwt.token';

function request(path: string, body: object): NextRequest {
  return new NextRequest(`${ORIGIN}${path}`, {
    method: 'POST',
    headers: {
      origin: ORIGIN,
      host: 'ebartex.com',
      cookie: AUTH_COOKIE,
      'content-type': 'application/json',
      'x-forwarded-for': '203.0.113.10',
    },
    body: JSON.stringify(body),
  });
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.resetModules();
  delete process.env.MARKETPLACE_API_URL;
});

describe('BFF segnalazioni persistenti', () => {
  it('inoltra la segnalazione marketplace alla coda Support e richiede una ricevuta', async () => {
    process.env.MARKETPLACE_API_URL = 'https://marketplace-api.ebartex.com';
    const fetchSpy = vi.fn(async (_input: RequestInfo | URL, _init?: RequestInit) =>
      Response.json({ id: '11111111-1111-4111-8111-111111111111' }, { status: 201 }));
    vi.stubGlobal('fetch', fetchSpy);
    const { POST } = await import('@/app/api/marketplace/reports/route');

    const response = await POST(request('/api/marketplace/reports', {
      sellerUsername: 'seller',
      sellerId: '22222222-2222-4222-8222-222222222222',
      kind: 'listing',
      referenceId: 'listing-123',
      reason: 'counterfeit',
      details: 'La carta sembra non autentica.',
    }));

    expect(response.status).toBe(202);
    expect(await response.json()).toEqual({
      ok: true,
      reportId: '11111111-1111-4111-8111-111111111111',
    });
    const [url, init] = fetchSpy.mock.calls[0];
    expect(String(url)).toBe('https://marketplace-api.ebartex.com/api/v1/support/cases');
    expect(new Headers(init?.headers).get('x-idempotency-key')).toMatch(/^[a-f0-9]{64}$/);
    expect(JSON.parse(String(init?.body))).toMatchObject({
      category: 'marketplace_report',
      reference_type: 'listing',
      context: { report_reason: 'counterfeit', seller_username: 'seller' },
    });
  });

  it('inoltra il bug report autenticato alla coda assistenza Staff', async () => {
    process.env.MARKETPLACE_API_URL = 'https://marketplace-api.ebartex.com';
    const fetchSpy = vi.fn(async (_input: RequestInfo | URL, _init?: RequestInit) =>
      Response.json({ id: '33333333-3333-4333-8333-333333333333' }, { status: 201 }));
    vi.stubGlobal('fetch', fetchSpy);
    const { POST } = await import('@/app/api/support/bug-reports/route');

    const response = await POST(request('/api/support/bug-reports', {
      name: 'Mario Rossi',
      email: 'mario@example.com',
      subject: 'Pagina bloccata',
      message: 'La pagina non risponde dopo il salvataggio.',
      bugType: 'functional',
      priority: 'high',
      pageUrl: 'https://ebartex.com/account/profilo?ignored=1',
    }));

    expect(response.status).toBe(202);
    const [url, init] = fetchSpy.mock.calls[0];
    expect(String(url)).toBe('https://marketplace-api.ebartex.com/api/v1/support/cases');
    expect(JSON.parse(String(init?.body))).toMatchObject({
      category: 'bug_report',
      context: {
        bug_type: 'functional',
        client_priority: 'high',
        source_path: '/account/profilo',
      },
    });
  });

  it('non dichiara successo se il Support non restituisce una ricevuta', async () => {
    process.env.MARKETPLACE_API_URL = 'https://marketplace-api.ebartex.com';
    vi.stubGlobal('fetch', vi.fn(async () => Response.json({}, { status: 201 })));
    const { POST } = await import('@/app/api/marketplace/reports/route');

    const response = await POST(request('/api/marketplace/reports', {
      sellerUsername: 'seller',
      kind: 'auction',
      referenceId: 'auction-123',
      reason: 'other',
    }));

    expect(response.status).toBe(502);
  });

  it('inoltra assistenza ordine e richiesta generale alla coda Staff', async () => {
    process.env.MARKETPLACE_API_URL = 'https://marketplace-api.ebartex.com';
    const fetchSpy = vi.fn(async () =>
      Response.json({ id: '55555555-5555-4555-8555-555555555555' }, { status: 201 }));
    vi.stubGlobal('fetch', fetchSpy);
    const { POST } = await import('@/app/api/support/cases/route');

    const orderResponse = await POST(request('/api/support/cases', {
      category: 'order_support',
      subject: 'Merce non arrivata',
      description: 'L’ordine non è stato consegnato.',
      referenceType: 'order',
      referenceId: '11111111-1111-4111-8111-111111111111',
      referenceLabel: 'Ordine marketplace',
      context: { sourcePath: '/acquisti' },
    }));
    expect(orderResponse.status).toBe(201);
    expect(JSON.parse(String(fetchSpy.mock.calls[0]?.[1]?.body))).toMatchObject({
      category: 'order_support',
      reference_type: 'order',
    });

    const helpResponse = await POST(request('/api/support/cases', {
      category: 'general_support',
      subject: '[Account] Richiesta assistenza',
      description: 'Non riesco ad accedere.',
      referenceType: 'page',
      referenceId: 'help:account',
      context: { sourcePath: '/aiuto', consultedFaqIds: ['faq-1'] },
    }));
    expect(helpResponse.status).toBe(201);
    expect(JSON.parse(String(fetchSpy.mock.calls[1]?.[1]?.body))).toMatchObject({
      category: 'general_support',
      reference_type: 'page',
      context: { source_path: '/aiuto', consulted_faq_ids: ['faq-1'] },
    });
  });
});
