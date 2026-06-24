'use client';

import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface MissingPageProps {
  title: string;
  description: ReactNode;
  actions: ReactNode;
  className?: string;
}

export function MissingPage({
  title,
  description,
  actions,
  className,
}: MissingPageProps) {
  return (
    <div
      className={cn(
        'flex min-h-[60vh] flex-col items-center justify-center gap-6 px-4 py-16 text-center',
        className
      )}
    >
      <div className="relative w-full max-w-2xl aspect-[1400/781]">
        <video
          src="/videos/404-animation.webm"
          autoPlay
          muted
          loop
          playsInline
          className="h-full w-full object-contain"
          aria-label={title}
        />
      </div>

      <div className="max-w-md">
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">
          {title}
        </h1>
        <div className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          {description}
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-3">
        {actions}
      </div>
    </div>
  );
}
