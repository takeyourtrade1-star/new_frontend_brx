import { NextRequest } from 'next/server';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { countryFromTrustedEdge } from '@/app/api/_lib/trusted-country';

describe('trusted edge country', () => {
  afterEach(() => vi.unstubAllEnvs());

  it('ignora header geografici non configurati o non consentiti', () => {
    const request = new NextRequest('https://www.ebartex.com/api/geo/country', {
      headers: { 'cloudfront-viewer-country': 'IT' },
    });
    expect(countryFromTrustedEdge(request)).toBeNull();

    vi.stubEnv('TRUSTED_COUNTRY_HEADER', 'x-attacker-country');
    expect(countryFromTrustedEdge(request)).toBeNull();
  });

  it('accetta soltanto un codice ISO2 dal trusted edge configurato', () => {
    vi.stubEnv('TRUSTED_COUNTRY_HEADER', 'cloudfront-viewer-country');
    expect(
      countryFromTrustedEdge(
        new NextRequest('https://www.ebartex.com/api/geo/country', {
          headers: { 'cloudfront-viewer-country': 'it' },
        }),
      ),
    ).toBe('IT');
    expect(
      countryFromTrustedEdge(
        new NextRequest('https://www.ebartex.com/api/geo/country', {
          headers: { 'cloudfront-viewer-country': 'not-a-country' },
        }),
      ),
    ).toBeNull();
  });
});
