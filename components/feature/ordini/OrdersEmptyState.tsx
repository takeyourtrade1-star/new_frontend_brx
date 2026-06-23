import Link from 'next/link';
import type { LucideIcon } from 'lucide-react';
import { ChevronRight, PackageOpen } from 'lucide-react';

interface OrdersEmptyStateProps {
  message: string;
  icon?: LucideIcon;
  /** Call-to-action opzionale (es. "Esplora il marketplace"). */
  cta?: { href: string; label: string };
}

/**
 * Stato vuoto condiviso per le liste ordini: icona soft, messaggio
 * e CTA opzionale, su card tratteggiata.
 */
export function OrdersEmptyState({
  message,
  icon: Icon = PackageOpen,
  cta,
}: OrdersEmptyStateProps) {
  return (
    <div className="flex min-h-[280px] flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed border-gray-200 bg-white/70 px-6 py-14 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#F5F4F0] text-gray-400">
        <Icon className="h-7 w-7" aria-hidden />
      </div>
      <p className="max-w-sm text-sm font-medium text-gray-500">{message}</p>
      {cta && (
        <Link
          href={cta.href}
          className="inline-flex items-center gap-1 rounded-full bg-[#FF7300] px-4 py-2 text-xs font-bold uppercase tracking-wide text-white shadow-md shadow-[#FF7300]/25 transition-colors hover:bg-[#e56500]"
        >
          {cta.label}
          <ChevronRight className="h-3.5 w-3.5" aria-hidden />
        </Link>
      )}
    </div>
  );
}
