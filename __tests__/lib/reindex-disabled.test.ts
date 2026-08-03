// @vitest-environment node

import { describe, expect, it } from 'vitest';
import { POST } from '@/app/api/reindex/route';

describe('public frontend reindex boundary', () => {
  it('remains unavailable until an authoritative Staff capability is integrated', async () => {
    const response = await POST();
    expect(response.status).toBe(404);
    expect(response.headers.get('cache-control')).toContain('no-store');
  });
});
