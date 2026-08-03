import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  BUILD_INFO_REFRESH_INTERVAL_MS,
  BUILD_INFO_STALE_TIME_MS,
  buildInfoQueryOptions,
  fetchBuildInfo,
} from '@/components/dev/BuildInfoBadge';

describe('BuildInfoBadge', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('always requests mutable build metadata outside browser and service-worker caches', async () => {
    vi.spyOn(Date, 'now').mockReturnValue(1_786_000_000_000);
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ hash: 'abc1234', timestamp: 1_786_000_000 }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }),
    );
    vi.stubGlobal('fetch', fetchMock);

    await expect(fetchBuildInfo()).resolves.toEqual({
      hash: 'abc1234',
      timestamp: 1_786_000_000,
    });
    expect(fetchMock).toHaveBeenCalledWith(
      '/build-info.json?v=1786000000000',
      { cache: 'no-store' },
    );
  });

  it('keeps build metadata fresh for long-lived tabs', () => {
    expect(BUILD_INFO_STALE_TIME_MS).toBe(30_000);
    expect(BUILD_INFO_REFRESH_INTERVAL_MS).toBe(60_000);
    expect(buildInfoQueryOptions).toMatchObject({
      staleTime: 30_000,
      refetchInterval: 60_000,
      refetchIntervalInBackground: false,
      refetchOnWindowFocus: 'always',
      retry: false,
    });
  });
});
