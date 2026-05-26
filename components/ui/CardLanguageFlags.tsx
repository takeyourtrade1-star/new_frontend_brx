'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { buildCardLanguageOptions } from '@/lib/card-languages';
import { CardLanguageFlag } from '@/components/ui/CardLanguageFlag';

type CardLanguageFlagsProps = {
  languages: string[] | undefined | null;
  size?: 'xs' | 'sm' | 'md';
  className?: string;
  /** Mostra etichetta sotto la riga di bandiere al tap (mobile). */
  showActiveLabel?: boolean;
};

export function CardLanguageFlags({
  languages,
  size = 'sm',
  className,
  showActiveLabel = false,
}: CardLanguageFlagsProps) {
  const options = buildCardLanguageOptions(languages);
  const [activeCode, setActiveCode] = useState<string | null>(null);

  if (options.length === 0) {
    return <span className="text-[12px] font-semibold text-zinc-500">—</span>;
  }

  const active = activeCode ? options.find((o) => o.code === activeCode) : null;

  return (
    <div className={cn('flex min-w-0 flex-col gap-1', className)}>
      <div className="flex flex-wrap items-center gap-1.5">
        {options.map((opt) => (
          <button
            key={opt.canonical}
            type="button"
            className={cn(
              'rounded-md p-0.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40',
              showActiveLabel && activeCode === opt.code && 'bg-primary/10 ring-1 ring-primary/25'
            )}
            title={opt.label}
            aria-label={opt.label}
            onClick={() => setActiveCode((prev) => (prev === opt.code ? null : opt.code))}
          >
            <CardLanguageFlag code={opt.code} size={size} title={opt.label} />
          </button>
        ))}
      </div>
      {showActiveLabel && active && (
        <p className="text-[11px] font-medium text-zinc-600">{active.label}</p>
      )}
    </div>
  );
}
