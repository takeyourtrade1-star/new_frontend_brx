'use client';

import { useEffect, useState } from 'react';

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
  const [info, setInfo] = useState<BuildInfo | null>(null);

  useEffect(() => {
    fetch('/build-info.json')
      .then((res) => {
        if (!res.ok) throw new Error('Not found');
        return res.json();
      })
      .then((data: BuildInfo) => setInfo(data))
      .catch(() => setInfo({ hash: 'dev', timestamp: null }));
  }, []);

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
