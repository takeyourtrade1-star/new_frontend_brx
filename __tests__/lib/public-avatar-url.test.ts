import { describe, expect, it } from 'vitest';

import { safePublicAvatarUrl } from '@/lib/security/public-avatar-url';

describe('safePublicAvatarUrl', () => {
  it('accepts only HTTPS URLs at an exact trusted avatar origin', () => {
    const good = 'https://cdn.ebartex.com/avatars/u.jpg?version=2';
    expect(safePublicAvatarUrl(good)).toBe(good);
    for (const value of [
      'http://cdn.ebartex.com/avatars/u.jpg',
      'https://cdn.ebartex.com.evil.test/u.jpg',
      'https://evil.test/u.jpg',
      'https://user@cdn.ebartex.com/u.jpg',
      'https://cdn.ebartex.com/u.jpg#tracking',
      'https://cdn.ebartex.com/u.jpg\n',
    ]) {
      expect(safePublicAvatarUrl(value)).toBeNull();
    }
  });
});
