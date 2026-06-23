'use client';

import { Loader2, TrendingUp, Trash2 } from 'lucide-react';
import type { MessageKey } from '@/lib/i18n/messages/en';

type T = (key: MessageKey, vars?: Record<string, string | number>) => string;

/** Piano 1.4 — barra azioni sticky (mobile) per la selezione, estratta da OggettiContent. */
export function OggettiStickyActionBar({
  selectedCount,
  bulkDeleteProgress,
  bulkDeleting,
  t,
  onDeselectAll,
  onBulkPrice,
  onBulkDelete,
}: {
  selectedCount: number;
  bulkDeleteProgress: { current: number; total: number } | null;
  bulkDeleting: boolean;
  t: T;
  onDeselectAll: () => void;
  onBulkPrice: () => void;
  onBulkDelete: () => void;
}) {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-gray-200/80 bg-white/90 px-4 py-3 shadow-2xl backdrop-blur-xl pb-[max(0.75rem,env(safe-area-inset-bottom))] md:px-6 md:py-4">
      <div className="mx-auto flex max-w-screen-xl flex-col gap-3 md:flex-row md:items-center md:justify-between md:gap-4">
        <div className="flex items-center gap-3">
          <span className="text-sm font-bold text-gray-900">
            {t('accountPage.itemsSelectedCount', { count: selectedCount })}
          </span>
          <button
            type="button"
            onClick={onDeselectAll}
            className="text-sm text-gray-400 transition-colors hover:text-gray-700"
          >
            {t('accountPage.itemsDeselectAll')}
          </button>
        </div>
        {bulkDeleteProgress && (
          <span className="text-xs text-gray-500">
            {t('accountPage.itemsBulkDeleteProgress', {
              current: bulkDeleteProgress.current,
              total: bulkDeleteProgress.total,
            })}
          </span>
        )}
        <div className="flex flex-col gap-2 sm:flex-row md:contents">
          <button
            type="button"
            onClick={onBulkPrice}
            className="inline-flex min-h-[48px] flex-1 items-center justify-center gap-2 rounded-2xl bg-primary px-5 py-3 text-sm font-bold text-white shadow-sm shadow-primary/20 transition-all hover:bg-primary/90 hover:shadow-md active:scale-[0.98] md:min-h-0 md:flex-none md:rounded-xl md:py-2.5"
          >
            <TrendingUp className="h-4 w-4" />
            {t('accountPage.itemsModifyPrices')}
          </button>
          <button
            type="button"
            onClick={onBulkDelete}
            disabled={bulkDeleting}
            className="inline-flex min-h-[48px] flex-1 items-center justify-center gap-2 rounded-2xl border border-red-300 bg-white px-5 py-3 text-sm font-bold text-red-500 transition-all hover:border-red-400 hover:bg-red-50 active:scale-[0.98] disabled:opacity-50 md:min-h-0 md:flex-none md:rounded-xl md:py-2.5"
          >
            {bulkDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
            {t('accountPage.itemsDeleteSelected')}
          </button>
        </div>
      </div>
    </div>
  );
}
