'use client';

import { useQuery } from '@tanstack/react-query';

interface BuildInfo {
  hash: string;
  timestamp: number | null;
}

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
  const { data: info } = useQuery<BuildInfo>({
    queryKey: ['build-info'],
    queryFn: async () => {
      const res = await fetch('/build-info.json');
      if (!res.ok) throw new Error('Not found');
      return res.json();
    },
    staleTime: Infinity,
    retry: false,
    placeholderData: { hash: 'dev', timestamp: null },
  });

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
