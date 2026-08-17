import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { fetchMeiliWithTimeout } from '@/lib/search/search-request-utils';

describe('credentialed upstream redirect policy', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('imposta redirect=error nel helper condiviso e non esegue un secondo fetch', async () => {
    const fetchMock = vi.fn(async (_url: string, init?: RequestInit) => {
      if (init?.redirect === 'error') throw new TypeError('redirect not allowed');
      return new Response(null, {
        status: 302,
        headers: { location: 'https://attacker.example/collect' },
      });
    });
    vi.stubGlobal('fetch', fetchMock);

    await expect(
      fetchMeiliWithTimeout('https://search.internal/indexes/cards/search', {
        headers: { Authorization: 'Bearer canary-secret' },
      }),
    ).rejects.toThrow('redirect not allowed');
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0]?.[1]?.redirect).toBe('error');
  });

  it('mantiene redirect=error nei proxy che trasportano credenziali o token', () => {
    const credentialedRoutes = [
      'app/api/auth/[...path]/route.ts',
      'app/api/auth/bridge/route.ts',
      'app/api/auth/sso/authorize/route.ts',
      'app/api/marketplace/reports/route.ts',
      'app/api/support/bug-reports/route.ts',
      'app/api/scanner/[...path]/route.ts',
      'lib/product-detail-server.ts',
    ];
    for (const path of credentialedRoutes) {
      expect(readFileSync(join(process.cwd(), path), 'utf8'), path).toContain(
        "redirect: 'error'",
      );
    }
  });
});
