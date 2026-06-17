import { describe, expect, it } from 'vitest';
import { safeInternalRedirectPath, withSafeRedirectParam } from '@/lib/auth/redirect';

describe('auth redirect helpers', () => {
  it('allows internal redirect paths with query strings', () => {
    expect(safeInternalRedirectPath('/cart?step=payment')).toBe('/cart?step=payment');
  });

  it('falls back for absolute or protocol-relative targets', () => {
    expect(safeInternalRedirectPath('https://attacker.example')).toBe('/');
    expect(safeInternalRedirectPath('//attacker.example')).toBe('/');
    expect(safeInternalRedirectPath('/checkout://attacker.example')).toBe('/');
    expect(safeInternalRedirectPath('/\\attacker.example')).toBe('/');
  });

  it('adds a safe redirect parameter without dropping existing query params', () => {
    expect(withSafeRedirectParam('/login?accesso=1', '/aste/nuova')).toBe(
      '/login?accesso=1&redirect=%2Faste%2Fnuova'
    );
  });

  it('supports alternate return parameter names', () => {
    expect(withSafeRedirectParam('/registrati', '/cart', 'returnTo')).toBe(
      '/registrati?returnTo=%2Fcart'
    );
  });

  it('does not add a redirect parameter for unsafe targets', () => {
    expect(withSafeRedirectParam('/login?accesso=1', 'https://attacker.example')).toBe(
      '/login?accesso=1'
    );
  });
});
