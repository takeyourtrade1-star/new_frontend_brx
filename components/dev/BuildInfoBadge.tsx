'use client';

import { useEffect, useState } from 'react';

interface BuildInfo {
  hash: string;
  date: string | null;
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
      .catch(() => setInfo({ hash: 'dev', date: null }));
  }, []);

  if (!info) return null;

  const label = info.date ? `${info.hash} • ${info.date}` : info.hash;

  return (
    <div className="fixed bottom-2 left-2 z-50 pointer-events-none">
      <span className="bg-[#1D3160]/80 text-white/70 text-[10px] font-mono px-2 py-0.5 rounded border border-white/10 backdrop-blur-sm">
        {label}
      </span>
    </div>
  );
}
