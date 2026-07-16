import { afterEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { POST as POST_REPORT } from '@/app/api/marketplace/reports/route';
import { POST as POST_SUPPORT } from '@/app/api/support/cases/route';

const authCookie = 'ebartex_access_token=fake.jwt.token';

afterEach(() => {
  vi.unstubAllGlobals();
  delete process.env.MARKETPLACE_API_URL;
});

describe('BFF segnalazioni e assistenza', () => {
  it('rifiuta richieste cross-origin prima della rete', async () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal('fetch', fetchSpy);
    const request = new NextRequest('https://ebartex.com/api/support/cases', {
      method: 'POST',
      headers: {
        origin: 'https://evil.example',
        host: 'ebartex.com',
        cookie: authCookie,
        'content-type': 'application/json',
      },
      body: '{}',
    });

    expect((await POST_SUPPORT(request)).status).toBe(403);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('inoltra una segnalazione validata con idempotenza', async () => {
    process.env.MARKETPLACE_API_URL = 'https://marketplace-api.ebartex.com';
    const fetchSpy = vi.fn(
      async (_input: RequestInfo | URL, _init?: RequestInit) => Response.json({
        id: '11111111-1111-4111-8111-111111111111',
      }, { status: 201 }),
    );
    vi.stubGlobal('fetch', fetchSpy);
    const request = new NextRequest('https://ebartex.com/api/marketplace/reports', {
      method: 'POST',
      headers: {
        origin: 'https://ebartex.com',
        host: 'ebartex.com',
        cookie: authCookie,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        idempotencyKey: 'report-11111111-1111-4111-8111-111111111111',
        sellerUsername: 'seller',
        sellerId: '22222222-2222-4222-8222-222222222222',
        kind: 'listing',
        referenceId: 'listing-123',
        reason: 'counterfeit',
        details: 'La carta sembra non autentica.',
      }),
    });

    const response = await POST_REPORT(request);
    expect(response.status).toBe(201);
    expect(fetchSpy).toHaveBeenCalledOnce();
    const [url, init] = fetchSpy.mock.calls[0];
    expect(String(url)).toBe('https://marketplace-api.ebartex.com/api/v1/support/cases');
    expect(new Headers(init?.headers).get('x-idempotency-key')).toContain('report-');
    expect(JSON.parse(String(init?.body))).toMatchObject({
      category: 'marketplace_report',
      reference_type: 'listing',
      context: { report_reason: 'counterfeit' },
    });
  });

  it('non accetta log o campi arbitrari nel contesto supporto', async () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal('fetch', fetchSpy);
    const request = new NextRequest('https://ebartex.com/api/support/cases', {
      method: 'POST',
      headers: {
        origin: 'https://ebartex.com',
        host: 'ebartex.com',
        cookie: authCookie,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        idempotencyKey: 'support-11111111-1111-4111-8111-111111111111',
        category: 'bug_report',
        subject: 'Errore pagina',
        description: 'La pagina non si apre.',
        context: { consoleLogs: 'contenuto sensibile' },
      }),
    });

    expect((await POST_SUPPORT(request)).status).toBe(400);
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});
