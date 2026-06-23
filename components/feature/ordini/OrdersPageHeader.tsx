import Link from 'next/link';
import type { ReactNode } from 'react';
import { HelpCircle, Info } from 'lucide-react';
import { AppBreadcrumb, type AppBreadcrumbItem } from '@/components/ui/AppBreadcrumb';

interface OrdersPageHeaderProps {
  breadcrumbItems: AppBreadcrumbItem[];
  title: string;
  subtitle?: string;
  /** Icona decorativa accanto al titolo (es. <ShoppingBag />). */
  icon?: ReactNode;
  /** Testo della nota demo. Se assente, il banner non viene mostrato. */
  demoNote?: string;
}

/**
 * Intestazione condivisa per le pagine ordini ("I miei acquisti" / "Le mie vendite").
 * Breadcrumb + link aiuto, titolo con icona, sottotitolo e nota demo.
 */
export function OrdersPageHeader({
  breadcrumbItems,
  title,
  subtitle,
  icon,
  demoNote,
}: OrdersPageHeaderProps) {
  return (
    <header>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <AppBreadcrumb
          items={breadcrumbItems}
          ariaLabel="Breadcrumb"
          variant="default"
          className="w-auto text-sm"
        />
        <Link
          href="/aiuto"
          className="inline-flex items-center gap-1.5 rounded-full bg-white px-3.5 py-1.5 text-xs font-semibold uppercase tracking-wide text-gray-600 ring-1 ring-gray-200 transition-colors hover:text-[#FF7300] hover:ring-[#FF7300]/40"
        >
          <HelpCircle className="h-3.5 w-3.5" aria-hidden />
          Hai bisogno di aiuto?
        </Link>
      </div>

      <div className="mb-5 flex items-center gap-3.5">
        {icon && (
          <div
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#FF7300] to-[#e05a00] text-white shadow-md shadow-[#FF7300]/20"
            aria-hidden
          >
            {icon}
          </div>
        )}
        <div className="min-w-0">
          <h1 className="text-2xl font-bold uppercase tracking-wide text-gray-900 sm:text-3xl">
            {title}
          </h1>
          {subtitle && (
            <p className="mt-0.5 text-sm text-gray-500">{subtitle}</p>
          )}
        </div>
      </div>

      {demoNote && (
        <div
          className="mb-6 flex items-start gap-2.5 rounded-xl border border-blue-100 bg-blue-50/80 px-4 py-3 text-sm text-blue-900"
          role="note"
        >
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" aria-hidden />
          <p>
            <span className="mr-2 inline-flex rounded-full bg-blue-600 px-2 py-0.5 align-middle text-[10px] font-bold uppercase text-white">
              Demo
            </span>
            {demoNote}
          </p>
        </div>
      )}
    </header>
  );
}
