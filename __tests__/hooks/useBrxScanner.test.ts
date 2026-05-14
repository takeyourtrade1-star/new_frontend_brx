import { describe, expect, it } from 'vitest';

import { normalizeScannerSearchUrl } from '@/hooks/useBrxScanner';

describe('normalizeScannerSearchUrl', () => {
  const origin = 'https://www.ebartex.com';

  it('keeps same-origin search paths as relative router destinations', () => {
    expect(normalizeScannerSearchUrl('/search?q=Black+Lotus&game=mtg', 'Black Lotus', origin)).toBe(
      '/search?q=Black+Lotus&game=mtg',
    );
    expect(normalizeScannerSearchUrl(`${origin}/search?q=Mox`, 'Mox', origin)).toBe('/search?q=Mox');
  });

  it('rejects external and executable URLs', () => {
    expect(
      normalizeScannerSearchUrl('https://attacker.example/phish', 'Black Lotus', origin),
    ).toBe('/search?q=Black+Lotus&game=mtg');
    expect(normalizeScannerSearchUrl('//attacker.example/phish', 'Mox Sapphire', origin)).toBe(
      '/search?q=Mox+Sapphire&game=mtg',
    );
    expect(normalizeScannerSearchUrl('javascript:alert(1)', 'Ancestral Recall', origin)).toBe(
      '/search?q=Ancestral+Recall&game=mtg',
    );
  });

  it('rejects same-origin non-search paths', () => {
    expect(normalizeScannerSearchUrl('/login?next=https://attacker.example', 'Sol Ring', origin)).toBe(
      '/search?q=Sol+Ring&game=mtg',
    );
  });
});
