import { beforeEach, describe, expect, it } from 'vitest';
import {
  buildVerificationPath,
  clearPendingRegistration,
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
  });

  it('stores only non-secret pending metadata for the current tab', () => {
    savePendingRegistration(pending);

    expect(readPendingRegistration(pending.flow_id)).toEqual(pending);
    const raw = sessionStorage.getItem(
      `ebartex-registration-verification:${pending.flow_id}`
    );
    expect(raw).not.toContain('token');
    expect(raw).not.toContain('code');
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
});
