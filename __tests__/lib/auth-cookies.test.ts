// @vitest-environment node

import { afterEach, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import {
  getAuthCookieName,
  isSecureRequest,
  serializeAuthCookie,
} from '@/app/api/_lib/auth-cookies';

afterEach(() => vi.unstubAllEnvs());

it('forces __Host and Secure password-reset cookies in production', () => {
  vi.stubEnv('NODE_ENV', 'production');
  const request = new NextRequest('http://internal-runtime/api/auth/password/reset/verify-code');

  expect(isSecureRequest(request)).toBe(true);
  const cookie = serializeAuthCookie(
    'password-reset',
    `reset.${'a'.repeat(48)}`,
    300,
    isSecureRequest(request),
  );

  expect(getAuthCookieName('password-reset')).toBe('__Host-ebartex_password_reset_token');
  expect(cookie).toMatch(
    /^__Host-ebartex_password_reset_token=.*; Path=\/; HttpOnly; SameSite=Lax; Max-Age=300; Secure$/,
  );
  expect(cookie).not.toContain('Domain=');
});
