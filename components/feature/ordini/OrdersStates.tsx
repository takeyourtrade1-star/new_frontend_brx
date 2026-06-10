'use client';

import { AlertCircle, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

/** Skeleton di caricamento a forma di card ordine. */
export function OrdersSkeleton({
  count = 3,
  className,
}: {
  count?: number;
  className?: string;
}) {
  return (
    <div className={cn('space-y-3', className)} aria-busy="true">
      <span className="sr-only">Caricamento…</span>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="animate-pulse rounded-2xl border border-gray-200/70 bg-white p-4"
        >
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 shrink-0 rounded-full bg-gray-100" />
            <div className="flex-1 space-y-2.5">
              <div className="flex items-center justify-between gap-4">
                <div className="h-3.5 w-2/5 rounded-full bg-gray-100" />
                <div className="h-3.5 w-16 rounded-full bg-gray-100" />
              </div>
              <div className="h-3 w-1/4 rounded-full bg-gray-100" />
              <div className="flex gap-2">
                <div className="h-4 w-20 rounded-full bg-gray-100" />
                <div className="h-4 w-14 rounded-full bg-gray-100" />
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

/** Stato di errore condiviso con pulsante "Riprova". */
export function OrdersErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) {
  return (
    <div className="flex min-h-[280px] flex-col items-center justify-center gap-4 rounded-2xl border border-red-100 bg-red-50/70 px-6 py-12 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-red-500 ring-1 ring-red-100">
        <AlertCircle className="h-6 w-6" aria-hidden />
      </div>
      <p className="max-w-sm text-sm font-semibold text-red-800">{message}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="inline-flex items-center gap-1.5 rounded-full bg-white px-4 py-2 text-xs font-bold uppercase tracking-wide text-red-700 ring-1 ring-red-200 transition-colors hover:bg-red-100"
        >
          <RefreshCw className="h-3.5 w-3.5" aria-hidden />
          Riprova
        </button>
      )}
    </div>
  );
}

/** Piè di lista con conteggio elementi. */
export function OrdersCountFooter({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex justify-center pt-1">
      <p className="inline-flex items-center rounded-full bg-white px-3.5 py-1.5 text-xs font-medium tabular-nums text-gray-500 ring-1 ring-gray-200">
        {children}
      </p>
    </div>
  );
}
