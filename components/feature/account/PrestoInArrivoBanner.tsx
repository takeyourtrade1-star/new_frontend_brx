'use client';

import { Clock } from 'lucide-react';

interface PrestoInArrivoBannerProps {
  className?: string;
}

export function PrestoInArrivoBanner({ className }: PrestoInArrivoBannerProps) {
  return (
    <div
      className={
        'pointer-events-none sticky top-4 z-40 mx-auto mb-6 flex max-w-fit items-center gap-3 rounded-full border px-6 py-3 shadow-lg' +
        (className ? ` ${className}` : '')
      }
      style={{ backgroundColor: '#FF7300', borderColor: '#878787' }}
    >
      <Clock className="h-5 w-5 text-white" strokeWidth={2} />
      <span className="text-sm font-bold uppercase tracking-wide text-white">
        Presto in arrivo
      </span>
    </div>
  );
}
