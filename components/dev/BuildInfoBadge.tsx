'use client';

import { queryOptions, useQuery } from '@tanstack/react-query';

interface BuildInfo {
  hash: string;
  timestamp: number | null;
}

export const BUILD_INFO_STALE_TIME_MS = 30_000;
export const BUILD_INFO_REFRESH_INTERVAL_MS = 60_000;

export async function fetchBuildInfo(): Promise<BuildInfo> {
  const cacheBuster = Date.now();
  const res = await fetch(`/build-info.json?v=${cacheBuster}`, {
    cache: 'no-store',
  });
  if (!res.ok) throw new Error('Not found');
  return res.json() as Promise<BuildInfo>;
}

export const buildInfoQueryOptions = queryOptions<BuildInfo>({
  queryKey: ['build-info'],
  queryFn: fetchBuildInfo,
  staleTime: BUILD_INFO_STALE_TIME_MS,
  refetchInterval: BUILD_INFO_REFRESH_INTERVAL_MS,
  refetchIntervalInBackground: false,
  refetchOnWindowFocus: 'always',
  retry: false,
  placeholderData: { hash: 'dev', timestamp: null },
});

function formatTimestamp(ts: number): string {
  return new Intl.DateTimeFormat('it-IT', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date(ts * 1000));
}

export function BuildInfoBadge() {
  const { data: info } = useQuery(buildInfoQueryOptions);

  if (!info) return null;

  const label = info.timestamp ? `${info.hash} • ${formatTimestamp(info.timestamp)}` : info.hash;

  return (
    <div className="fixed bottom-2 left-2 z-50 pointer-events-none">
      <span className="bg-[#1D3160]/80 text-white/70 text-[10px] font-mono px-2 py-0.5 rounded border border-white/10 backdrop-blur-sm">
        {label}
      </span>
    </div>
  );
}
