import { describe, expect, it } from 'vitest';
import { isProtectedRoutePath } from '@/lib/auth/protected-routes';

describe('protected route matcher', () => {
  it('keeps the landing and other public paths public', () => {
    expect(isProtectedRoutePath('/')).toBe(false);
    expect(isProtectedRoutePath('/home/magic')).toBe(false);
    expect(isProtectedRoutePath('/accounting')).toBe(false);
  });

  it('matches protected paths and their descendants', () => {
    expect(isProtectedRoutePath('/account')).toBe(true);
    expect(isProtectedRoutePath('/account/profilo')).toBe(true);
    expect(isProtectedRoutePath('/scambi')).toBe(true);
    expect(isProtectedRoutePath('/scambi/nuova')).toBe(true);
  });
});
