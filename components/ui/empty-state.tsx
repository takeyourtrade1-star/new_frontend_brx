import * as React from 'react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EmptyStateProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> {
  /** Icona soft mostrata in un cerchio in alto. */
  icon?: LucideIcon;
  title?: React.ReactNode;
  description?: React.ReactNode;
  /** Call-to-action o contenuto extra (es. bottone/link). */
  action?: React.ReactNode;
  /** Override del cerchio icona. */
  iconClassName?: string;
}

/**
 * Stato vuoto condiviso: icona soft in cerchio, titolo/descrizione opzionali e
 * azione opzionale, su card tratteggiata. Default sovrascrivibili via `className`
 * (tailwind-merge risolve i conflitti).
 */
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
  iconClassName,
  children,
  ...props
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed border-gray-200 bg-white/70 px-6 py-14 text-center',
        className
      )}
      {...props}
    >
      {Icon && (
        <div
          className={cn(
            'flex h-14 w-14 items-center justify-center rounded-full bg-[#F5F4F0] text-gray-400',
            iconClassName
          )}
        >
          <Icon className="h-7 w-7" aria-hidden />
        </div>
      )}
      {title && <h3 className="text-base font-semibold text-gray-900">{title}</h3>}
      {description && <p className="max-w-sm text-sm font-medium text-gray-500">{description}</p>}
      {action}
      {children}
    </div>
  );
}
