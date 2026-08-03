import { describe, expect, it } from 'vitest';

import { buildVerificationPath } from '@/lib/auth/registration-verification';
import { getTournamentsPortalUrl } from '@/lib/config/tournaments';
import { sanitizeInternalReturnPath } from '@/lib/security/internal-return-path';

describe('internal return path sanitizer', () => {
  it('returns only canonical same-origin pathname and search', () => {
    expect(sanitizeInternalReturnPath('/aste/123?tab=offerte#ignored')).toBe(
      '/aste/123?tab=offerte',
    );
  });

  it('rejects network paths, schemes, backslashes, controls and encoded variants', () => {
    for (const value of [
      '//evil.test/path',
      '/\\evil.test/path',
      '/%5cevil.test/path',
      '/%255cevil.test/path',
      '/%2f%2fevil.test/path',
      'https://evil.test/path',
      '/safe\nHeader: value',
    ]) {
      expect(sanitizeInternalReturnPath(value)).toBeNull();
    }
  });

  it('keeps verification and tournament helpers fail-closed', () => {
    expect(buildVerificationPath('flow', '/\\evil.test')).toBe(
      '/registrati/verifica?flow_id=flow',
    );
    expect(getTournamentsPortalUrl('https://evil.test')).toBe(
      'https://tornei.ebartex.com/',
    );
    expect(getTournamentsPortalUrl('/\\evil.test')).toBe(
      'https://tornei.ebartex.com/',
    );
  });
});
