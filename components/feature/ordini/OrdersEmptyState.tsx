import Link from 'next/link';
import type { LucideIcon } from 'lucide-react';
import { ChevronRight, PackageOpen } from 'lucide-react';
import { EmptyState } from '@/components/ui/empty-state';

interface OrdersEmptyStateProps {
  message: string;
  icon?: LucideIcon;
  /** Call-to-action opzionale (es. "Esplora il marketplace"). */
  cta?: { href: string; label: string };
}

/**
 * Stato vuoto condiviso per le liste ordini: icona soft, messaggio
 * e CTA opzionale, su card tratteggiata. Costruito su `EmptyState`.
 */
export function OrdersEmptyState({
  message,
  icon = PackageOpen,
  cta,
}: OrdersEmptyStateProps) {
  return (
    <EmptyState
      icon={icon}
      className="min-h-[280px]"
      description={message}
      action={
        cta ? (
          <Link
            href={cta.href}
            className="inline-flex items-center gap-1 rounded-full bg-[#FF7300] px-4 py-2 text-xs font-bold uppercase tracking-wide text-white shadow-md shadow-[#FF7300]/25 transition-colors hover:bg-[#e56500]"
          >
            {cta.label}
            <ChevronRight className="h-3.5 w-3.5" aria-hidden />
          </Link>
        ) : null
      }
    />
  );
}
