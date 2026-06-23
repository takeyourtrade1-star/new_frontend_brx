import * as React from 'react';
import { cn } from '@/lib/utils';

/**
 * Skeleton primitivo (shadcn). Placeholder animato per stati di caricamento.
 * Default: `animate-pulse rounded-md bg-muted`. Sovrascrivibile via `className`
 * (tailwind-merge risolve i conflitti di colore/arrotondamento).
 */
function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('animate-pulse rounded-md bg-muted', className)} {...props} />;
}

export { Skeleton };
