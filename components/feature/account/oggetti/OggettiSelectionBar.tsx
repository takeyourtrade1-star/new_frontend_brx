'use client';

import { CheckSquare, Download, Loader2, TrendingUp, Trash2 } from 'lucide-react';
import type { MessageKey } from '@/lib/i18n/messages/en';

type T = (key: MessageKey, vars?: Record<string, string | number>) => string;

/** Piano 1.4 — barra selezione + azioni bulk (desktop), estratta da OggettiContent. */
export function OggettiSelectionBar({
  selectedCount,
  filteredCount,
  bulkDeleting,
  bulkDeleteProgress,
  t,
  onSelectAll,
  onDeselectAll,
  onBulkPrice,
  onBulkDelete,
  onExportSelection,
}: {
  selectedCount: number;
  filteredCount: number;
  bulkDeleting: boolean;
  bulkDeleteProgress: { current: number; total: number } | null;
  t: T;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  onBulkPrice: () => void;
  onBulkDelete: () => void;
  onExportSelection: () => void;
}) {
  return (
    <div className="mb-4 hidden overflow-hidden rounded-2xl border border-stroke-grey bg-white shadow-[0_2px_12px_rgba(0,0,0,0.06)] md:mb-5 md:block">
      <div className="flex flex-col gap-3 px-3 py-3 md:flex-row md:flex-wrap md:items-center md:justify-between md:px-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100">
              <CheckSquare className="h-4 w-4 text-gray-500" />
            </span>
            <div className="flex flex-col">
              <span className="text-xs text-gray-500">{t('accountPage.itemsSelected')}</span>
              <span className="text-sm font-bold text-gray-900">
                {selectedCount}{' '}
                <span className="text-xs font-normal text-gray-400">/ {filteredCount}</span>
              </span>
            </div>
          </div>
          <div className="h-8 w-px bg-gray-200" />
          <div className="flex flex-wrap gap-1.5 max-md:w-full">
            <button
              type="button"
              onClick={onSelectAll}
              className="inline-flex min-h-[44px] flex-1 items-center justify-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-600 transition-all hover:border-primary hover:text-primary active:scale-[0.98] md:min-h-0 md:flex-none md:rounded-lg md:py-1.5"
            >
              {t('accountPage.itemsSelectAll')} ({filteredCount})
            </button>
            <button
              type="button"
              onClick={onDeselectAll}
              disabled={selectedCount === 0}
              className="inline-flex min-h-[44px] flex-1 items-center justify-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-600 transition-all hover:border-red-400 hover:text-red-500 active:scale-[0.98] disabled:opacity-40 md:min-h-0 md:flex-none md:rounded-lg md:py-1.5"
            >
              {t('accountPage.itemsSelectNone')}
            </button>
            <button
              type="button"
              onClick={onBulkPrice}
              className="inline-flex items-center gap-1.5 rounded-lg border border-primary/30 bg-primary/5 px-3 py-1.5 text-xs font-medium text-primary transition-all hover:bg-primary/10"
            >
              <TrendingUp className="h-3.5 w-3.5" />
              {t('accountPage.itemsModifyPrices')}
            </button>
            {selectedCount > 0 && (
              <button
                type="button"
                onClick={onBulkDelete}
                disabled={bulkDeleting}
                className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-medium text-red-600 transition-all hover:border-red-300 hover:bg-red-100 disabled:opacity-50"
              >
                {bulkDeleting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                {t('accountPage.itemsDeleteSelected')} ({selectedCount})
              </button>
            )}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {bulkDeleteProgress && (
            <span className="text-xs text-gray-500">
              {t('accountPage.itemsBulkDeleteProgress', {
                current: bulkDeleteProgress.current,
                total: bulkDeleteProgress.total,
              })}
            </span>
          )}
          {selectedCount > 0 && (
            <button
              type="button"
              onClick={onExportSelection}
              className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-600 transition-all hover:border-emerald-400 hover:text-emerald-600"
            >
              <Download className="h-3.5 w-3.5" />
              {t('accountPage.itemsExport')} ({selectedCount})
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
