'use client';

import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { AUTH_SPLIT_SUBTITLE_CLASS, AUTH_SPLIT_TITLE_CLASS } from './auth-split-styles';

interface AuthSplitHeaderProps {
  title?: string;
  subtitle?: string;
  /** Allineato a destra del titolo (es. selettore lingua). */
  topSlot?: ReactNode;
  className?: string;
}

export function AuthSplitHeader({ title, subtitle, topSlot, className }: AuthSplitHeaderProps) {
  return (
    <header className={cn('mb-4', className)}>
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          {title ? <h1 className={AUTH_SPLIT_TITLE_CLASS}>{title}</h1> : null}
          {subtitle ? (
            title ? (
              <p className={AUTH_SPLIT_SUBTITLE_CLASS}>{subtitle}</p>
            ) : (
              <h1 className={cn(AUTH_SPLIT_SUBTITLE_CLASS, 'mt-0')}>{subtitle}</h1>
            )
          ) : null}
        </div>
        {topSlot ? <div className="shrink-0 pt-0.5">{topSlot}</div> : null}
      </div>
    </header>
  );
}
