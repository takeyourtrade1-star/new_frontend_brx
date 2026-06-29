'use client';

import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import type { MessageKey } from '@/lib/i18n/messages/en';
import { useIntlLocale } from '@/lib/i18n/useIntlLocale';

type T = (key: MessageKey, vars?: Record<string, string | number>) => string;

/** Piano 1.4 — barra di paginazione, estratta da OggettiContent. Presentazionale. */
export function OggettiPagination({
  currentPage,
  totalPages,
  itemsPerPage,
  totalFiltered,
  catalogLoading,
  hasSelection,
  t,
  onPageChange,
}: {
  currentPage: number;
  totalPages: number;
  itemsPerPage: number;
  totalFiltered: number;
  catalogLoading: boolean;
  hasSelection: boolean;
  t: T;
  onPageChange: (updater: (p: number) => number) => void;
}) {
  const intlLocale = useIntlLocale();
  return (
    <div className={`mt-3 flex flex-col gap-2 rounded-xl bg-white p-2.5 shadow-[0_2px_8px_rgba(0,0,0,0.06)] md:mt-6 md:gap-3 md:p-3 md:flex-row md:flex-wrap md:items-center md:justify-between md:gap-4 ${hasSelection ? 'max-md:mb-20' : ''}`}>
      <div className="flex flex-wrap items-center gap-3 text-sm">
        <span className="text-gray-500">
          {t('accountPage.itemsPage')} <span className="font-semibold text-gray-900">{currentPage}</span> {t('accountPage.itemsOf')}{' '}
          <span className="font-semibold text-gray-900">{totalPages.toLocaleString(intlLocale)}</span>
        </span>
        <span className="text-gray-300">·</span>
        <span className="text-xs text-gray-400">
          {itemsPerPage} {t('accountPage.itemsPerPage')}
        </span>
        <span className="text-gray-300">·</span>
        <span className="text-xs text-gray-500 tabular-nums">
          {(totalFiltered === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1).toLocaleString(intlLocale)}
          –
          {Math.min(currentPage * itemsPerPage, totalFiltered).toLocaleString(intlLocale)}{' '}
          {t('accountPage.itemsOf')}{' '}
          {totalFiltered.toLocaleString(intlLocale)}
        </span>
        {catalogLoading && (
          <>
            <span className="text-gray-300">·</span>
            <span className="inline-flex items-center gap-1 text-xs text-gray-400">
              <Loader2 className="h-3 w-3 animate-spin" aria-hidden />
              Catalogo…
            </span>
          </>
        )}
      </div>
      <div className="flex items-center justify-center gap-1 md:justify-end">
        <button
          type="button"
          onClick={() => onPageChange((p) => Math.max(1, p - 1))}
          disabled={currentPage <= 1 || totalPages <= 1}
          className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-600 shadow-sm transition-all hover:bg-gray-50 hover:text-gray-900 active:scale-95 disabled:pointer-events-none disabled:opacity-40 md:h-9 md:w-9 md:rounded-lg"
          aria-label={t('accountPage.itemsPrevPage')}
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <div className={`flex items-center gap-1 px-1 ${totalPages <= 1 ? 'opacity-50 pointer-events-none' : ''}`}>
          {Array.from({ length: Math.min(7, totalPages) }, (_, i) => {
            let pageNum: number;
            if (totalPages <= 7) pageNum = i + 1;
            else if (currentPage <= 4) pageNum = i + 1;
            else if (currentPage >= totalPages - 3) pageNum = totalPages - 6 + i;
            else pageNum = currentPage - 3 + i;
            return (
              <button
                key={pageNum}
                type="button"
                onClick={() => onPageChange(() => pageNum)}
                className={`inline-flex h-11 min-w-[2.75rem] items-center justify-center rounded-xl text-sm font-medium transition-all md:h-9 md:min-w-[2.25rem] md:rounded-lg ${
                  currentPage === pageNum
                    ? 'bg-primary text-white shadow-sm shadow-primary/20'
                    : 'border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
                aria-label={`Pagina ${pageNum}`}
                aria-current={currentPage === pageNum ? 'page' : undefined}
              >
                {pageNum}
              </button>
            );
          })}
        </div>
        <button
          type="button"
          onClick={() => onPageChange((p) => Math.min(totalPages, p + 1))}
          disabled={currentPage >= totalPages || totalPages <= 1}
          className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-600 shadow-sm transition-all hover:bg-gray-50 hover:text-gray-900 active:scale-95 disabled:pointer-events-none disabled:opacity-40 md:h-9 md:w-9 md:rounded-lg"
          aria-label={t('accountPage.itemsNextPage')}
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
