import { describe, expect, it } from 'vitest';
import { classifySyncStatusLoadFailure } from '@/lib/sync/sync-status-load';

describe('classifySyncStatusLoadFailure', () => {
  it('considera solo il 404 come integrazione non configurata', () => {
    expect(classifySyncStatusLoadFailure({ status: 404 })).toBe('not_configured');
  });

  it.each([undefined, 401, 408, 500, 502, 504])(
    'non trasforma lo stato %s in un falso non collegato',
    (status) => {
      expect(classifySyncStatusLoadFailure({ status })).toBe('unavailable');
    },
  );
});
