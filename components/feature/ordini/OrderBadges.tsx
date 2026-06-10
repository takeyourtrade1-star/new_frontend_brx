'use client';

import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

export type BadgeTone =
  | 'amber'
  | 'orange'
  | 'red'
  | 'emerald'
  | 'blue'
  | 'sky'
  | 'purple'
  | 'gray';

const STATUS_TONE_CLS: Record<BadgeTone, string> = {
  amber: 'bg-amber-50 text-amber-700 ring-amber-200/70',
  orange: 'bg-orange-50 text-orange-700 ring-orange-200/70',
  red: 'bg-red-50 text-red-700 ring-red-200/70',
  emerald: 'bg-emerald-50 text-emerald-700 ring-emerald-200/70',
  blue: 'bg-blue-50 text-blue-700 ring-blue-200/70',
  sky: 'bg-sky-50 text-sky-700 ring-sky-200/70',
  purple: 'bg-purple-50 text-purple-700 ring-purple-200/70',
  gray: 'bg-gray-50 text-gray-600 ring-gray-200',
};

const TAG_TONE_CLS: Record<BadgeTone, string> = {
  amber: 'text-amber-600',
  orange: 'text-orange-600',
  red: 'text-red-500',
  emerald: 'text-emerald-600',
  blue: 'text-blue-500',
  sky: 'text-sky-600',
  purple: 'text-purple-500',
  gray: 'text-gray-400',
};

/**
 * Badge di stato principale (es. DA PAGARE, SPEDITO, COMPLETATO).
 * Pillola con tinta soft e anello sottile: una sola per card, a sinistra.
 */
export function StatusBadge({
  tone,
  icon: Icon,
  children,
  className,
}: {
  tone: BadgeTone;
  icon?: LucideIcon;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ring-1',
        STATUS_TONE_CLS[tone],
        className,
      )}
    >
      {Icon && <Icon className="h-3 w-3" aria-hidden />}
      {children}
    </span>
  );
}

/**
 * Tag di metadato secondario (es. ASTA, MARKETPLACE, DEMO).
 * Solo testo con puntino colorato: discreto, da allineare a destra
 * nella riga badge per non competere con lo stato.
 */
export function ChannelTag({
  tone = 'gray',
  children,
  className,
}: {
  tone?: BadgeTone;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider',
        TAG_TONE_CLS[tone],
        className,
      )}
    >
      <span className="h-1 w-1 rounded-full bg-current opacity-70" aria-hidden />
      {children}
    </span>
  );
}

/**
 * Badge di allerta (es. SCADUTO, IN RITARDO): accanto allo stato
 * che qualifica, sempre in rosso soft.
 */
export function AlertBadge({
  icon: Icon,
  children,
  className,
}: {
  icon?: LucideIcon;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-md bg-red-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-red-600 ring-1 ring-red-200/70',
        className,
      )}
    >
      {Icon && <Icon className="h-3 w-3" aria-hidden />}
      {children}
    </span>
  );
}
