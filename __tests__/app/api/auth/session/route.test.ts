import { describe, expect, it } from 'vitest';
import { DELETE } from '@/app/api/auth/session/route';

describe('auth session route', () => {
  it('expires every cookie that can admit protected routes', async () => {
    const response = await DELETE();
    const setCookieHeaders = response.headers.getSetCookie();

    expect(response.status).toBe(200);
    expect(setCookieHeaders).toEqual(
      expect.arrayContaining([
        expect.stringMatching(/^ebartex_access_token=;/),
        expect.stringMatching(/^ebartex_refresh_token=;/),
        expect.stringMatching(/^ebartex-auth=;/),
      ])
    );
    expect(setCookieHeaders.every((cookie) => cookie.includes('Max-Age=0'))).toBe(true);
  });
});
