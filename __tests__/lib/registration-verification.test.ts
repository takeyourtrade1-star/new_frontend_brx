import { beforeEach, describe, expect, it } from 'vitest';
import {
  buildVerificationPath,
  clearPendingRegistration,
  readAndScrubVerificationToken,
  readPendingRegistration,
  savePendingRegistration,
} from '@/lib/auth/registration-verification';
import type { RegistrationPendingResponse } from '@/types';

const pending: RegistrationPendingResponse = {
  status: 'verification_pending',
  flow_id: '0198f65d-88e7-7f38-9c71-6b28ea26eb9d',
  destination: 't***@example.com',
  expires_at: '2026-07-13T15:20:00Z',
  resend_available_at: '2026-07-13T15:01:00Z',
  delivery_status: 'queued',
};

describe('registration verification metadata', () => {
  beforeEach(() => {
    sessionStorage.clear();
    window.history.replaceState(null, '', '/registrati/verifica');
  });

  it('stores only non-secret pending metadata for the current tab', () => {
    savePendingRegistration({
      ...pending,
      password: 'correct horse battery staple',
      access_token: 'reusable-access-token',
      refresh_token: 'reusable-refresh-token',
      token: 'reusable-verification-token',
      code: '123456',
      idempotency_key: 'reusable-idempotency-key',
    } as RegistrationPendingResponse);

    expect(readPendingRegistration(pending.flow_id)).toEqual(pending);
    const raw = sessionStorage.getItem(
      `ebartex-registration-verification:${pending.flow_id}`
    );
    expect(JSON.parse(raw!)).toEqual(pending);
    expect(raw).not.toContain('password');
    expect(raw).not.toContain('reusable-');
    expect(raw).not.toContain('idempotency');
  });

  it('scrubs unexpected fields from an existing browser entry', () => {
    const key = `ebartex-registration-verification:${pending.flow_id}`;
    sessionStorage.setItem(
      key,
      JSON.stringify({ ...pending, token: 'legacy-secret', password: 'legacy-password' })
    );

    expect(readPendingRegistration(pending.flow_id)).toEqual(pending);
    expect(JSON.parse(sessionStorage.getItem(key)!)).toEqual(pending);
  });

  it('clears pending metadata after verification', () => {
    savePendingRegistration(pending);
    clearPendingRegistration(pending.flow_id);
    expect(readPendingRegistration(pending.flow_id)).toBeNull();
  });

  it('keeps only safe internal return paths', () => {
    expect(buildVerificationPath(pending.flow_id, '/aste/123')).toBe(
      `/registrati/verifica?flow_id=${pending.flow_id}&returnTo=%2Faste%2F123`
    );
    expect(buildVerificationPath(pending.flow_id, '//attacker.example')).toBe(
      `/registrati/verifica?flow_id=${pending.flow_id}`
    );
  });

  it('copies a valid fragment token into memory and scrubs it immediately', () => {
    const token = 'a'.repeat(43);
    window.history.replaceState(
      null,
      '',
      `/registrati/verifica?flow_id=${pending.flow_id}#token=${token}`
    );

    expect(readAndScrubVerificationToken()).toBe(token);
    expect(window.location.pathname + window.location.search).toBe(
      `/registrati/verifica?flow_id=${pending.flow_id}`
    );
    expect(window.location.hash).toBe('');
  });

  it('rejects malformed or oversized tokens while still scrubbing the fragment', () => {
    for (const token of ['short', 'a'.repeat(257), `${'a'.repeat(40)}%0A`]) {
      window.history.replaceState(
        null,
        '',
        `/registrati/verifica?flow_id=${pending.flow_id}#token=${token}`
      );

      expect(readAndScrubVerificationToken()).toBeNull();
      expect(window.location.hash).toBe('');
    }
  });
});
