import { QueryClient } from '@tanstack/react-query';
import { describe, expect, it } from 'vitest';

import { principalTransitionRequiresPurge } from '@/lib/auth/principal-isolation';

describe('cross-account query isolation', () => {
  it('clears account A data before account B can address the cache', () => {
    const client = new QueryClient();
    client.setQueryData(['orders', 'buyer'], { owner: 'user-a', secret: 'A' });

    expect(principalTransitionRequiresPurge('user-a', null, false, false)).toBe(true);
    client.clear();
    expect(client.getQueryData(['orders', 'buyer'])).toBeUndefined();

    expect(principalTransitionRequiresPurge(null, 'user-b', false, false)).toBe(false);
    expect(client.getQueryData(['orders', 'buyer'])).toBeUndefined();
  });

  it('purges on direct principal switch and first session-expiry edge', () => {
    expect(principalTransitionRequiresPurge('user-a', 'user-b', false, false)).toBe(true);
    expect(principalTransitionRequiresPurge('user-a', 'user-a', false, true)).toBe(true);
    expect(principalTransitionRequiresPurge(null, null, true, true)).toBe(false);
  });
});
