import { describe, expect, it } from 'vitest';

import { getSafeBuyNowUrl } from '@/lib/auction/safe-buy-now-url';

describe('getSafeBuyNowUrl', () => {
  it.each([
    'javascript:alert(document.domain)',
    'JaVaScRiPt:alert(1)',
    'data:text/html,<script>alert(1)</script>',
    'vbscript:msgbox(1)',
    '//attacker.example/checkout',
    '/checkout/42',
    '',
  ])('rejects a non-HTTP(S) buy-now URL: %s', (value) => {
    expect(getSafeBuyNowUrl(value)).toBeNull();
  });

  it('accepts absolute HTTPS URLs', () => {
    expect(getSafeBuyNowUrl('https://shop.example/checkout/42')).toBe(
      'https://shop.example/checkout/42'
    );
  });

  it('accepts HTTP URLs for supported local/development deployments', () => {
    expect(getSafeBuyNowUrl('http://localhost:3000/checkout/42')).toBe(
      'http://localhost:3000/checkout/42'
    );
  });
});
