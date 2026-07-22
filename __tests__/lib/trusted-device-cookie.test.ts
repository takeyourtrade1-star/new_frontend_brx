import { describe, expect, it } from 'vitest';
import {
  buildTrustedDeviceRequestCookie,
  getTrustedDeviceAuthPolicy,
  MFA_TRUST_COOKIE,
  MFA_TRUST_MAX_AGE,
  parseTrustedDeviceSetCookies,
  serializeTrustedDeviceCookie,
} from '@/lib/auth/trusted-device-cookie';

describe('trusted-device MFA cookie', () => {
  it('applica una allowlist esatta a consumer e issuer', () => {
    expect(getTrustedDeviceAuthPolicy('/api/auth/login')).toEqual({
      forwardCookie: true,
      forwardUserAgent: true,
      acceptSetCookie: true,
    });
    expect(getTrustedDeviceAuthPolicy('/api/auth/login/code/verify')).toEqual({
      forwardCookie: true,
      forwardUserAgent: true,
      acceptSetCookie: true,
    });
    expect(getTrustedDeviceAuthPolicy('/api/auth/verify-mfa')).toEqual({
      forwardCookie: false,
      forwardUserAgent: true,
      acceptSetCookie: true,
    });
    expect(getTrustedDeviceAuthPolicy('/api/auth/login/extra')).toEqual({
      forwardCookie: false,
      forwardUserAgent: false,
      acceptSetCookie: false,
    });
  });

  it('costruisce solo cookie con valore RFC 6265 sicuro e limitato', () => {
    expect(buildTrustedDeviceRequestCookie('opaque-token_123')).toBe(
      `${MFA_TRUST_COOKIE}=opaque-token_123`
    );
    expect(buildTrustedDeviceRequestCookie('bad;other=value')).toBeNull();
    expect(buildTrustedDeviceRequestCookie('bad\r\nX-Injected: yes')).toBeNull();
    expect(buildTrustedDeviceRequestCookie('x'.repeat(4097))).toBeNull();
  });

  it('accetta solo il cookie atteso e limita Max-Age a 30 giorni', () => {
    expect(
      parseTrustedDeviceSetCookies([
        'backend_session=ignore; Max-Age=99999999',
        `${MFA_TRUST_COOKIE}=opaque-token; Domain=.ebartex.com; Path=/other; Max-Age=99999999`,
      ])
    ).toEqual({ value: 'opaque-token', maxAge: MFA_TRUST_MAX_AGE });
  });

  it('propaga la cancellazione per valore vuoto o Max-Age non positivo', () => {
    expect(
      parseTrustedDeviceSetCookies([
        `${MFA_TRUST_COOKIE}=; Path=/; Max-Age=0`,
      ])
    ).toEqual({ value: '', maxAge: 0 });
    expect(
      parseTrustedDeviceSetCookies([
        `${MFA_TRUST_COOKIE}=expired-token; Path=/; Max-Age=-1`,
      ])
    ).toEqual({ value: '', maxAge: 0 });
  });

  it('serializza sempre attributi host-only sicuri e canonici', () => {
    const serialized = serializeTrustedDeviceCookie({
      value: 'opaque-token',
      maxAge: MFA_TRUST_MAX_AGE,
    });

    expect(serialized).toBe(
      `${MFA_TRUST_COOKIE}=opaque-token; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${MFA_TRUST_MAX_AGE}`
    );
    expect(serialized).not.toContain('Domain=');
  });
});
