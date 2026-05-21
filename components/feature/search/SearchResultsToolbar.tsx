'use client';

import { Rows3, Grid2x2 } from 'lucide-react';
import type { MessageKey } from '@/lib/i18n/messages/en';
import { cn } from '@/lib/utils';

export type ViewMode = 'list' | 'grid';

type SearchResultsToolbarProps = {
  total: number;
  sortParam: string;
  sortOptions: { value: string; label: string }[];
  viewMode: ViewMode;
  onSortChange: (value: string) => void;
  onViewModeChange: (mode: ViewMode) => void;
  t: (k: MessageKey, vars?: Record<string, string | number>) => string;
  advancedHint?: boolean;
  className?: string;
};

export function SearchResultsToolbar({
  total,
  sortParam,
  sortOptions,
  viewMode,
  onSortChange,
  onViewModeChange,
  t,
  advancedHint = true,
  className,
}: SearchResultsToolbarProps) {
  return (
    <div
      className={cn(
        'flex flex-col gap-2 rounded-xl border border-gray-200/80 bg-white px-3 py-2 shadow-sm sm:flex-row sm:items-center sm:justify-between',
        className
      )}
    >
      <p className="min-w-0 text-xs text-gray-700">
        <strong className="font-bold tabular-nums">{total}</strong>{' '}
        <span className="uppercase tracking-wide">{t('search.results')}</span>
        {total > 0 && advancedHint && (
          <span className="mt-0.5 block text-[10px] font-normal normal-case text-gray-500 sm:ml-2 sm:mt-0 sm:inline">
            {t('search.advancedHint')}
          </span>
        )}
      </p>
      <div className="flex w-full min-w-0 flex-wrap items-center justify-end gap-2 sm:w-auto">
        <div className="flex min-w-0 flex-1 items-center gap-2 sm:flex-initial">
          <span className="shrink-0 text-[10px] font-semibold uppercase tracking-wide text-gray-500">
            {t('search.sortBy')}
          </span>
          <select
            className="min-h-[32px] min-w-0 flex-1 rounded-[10px] border border-gray-200 bg-[#f2f2f7] px-2 py-1 text-xs font-semibold text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#5AC8FA]/30 sm:min-w-[10rem] sm:flex-initial"
            value={sortParam}
            onChange={(e) => onSortChange(e.target.value)}
          >
            {sortOptions.map((o) => (
              <option key={o.value} value={o.value} className="bg-white text-gray-900">
                {o.label}
              </option>
            ))}
          </select>
        </div>
        <div className="flex h-9 shrink-0 overflow-hidden rounded-full border border-gray-200 bg-[#f2f2f7]">
          <button
            type="button"
            onClick={() => onViewModeChange('list')}
            aria-label={t('search.viewList')}
            title={t('search.viewList')}
            className={cn(
              'flex h-9 w-10 items-center justify-center transition-colors',
              viewMode === 'list' ? 'bg-primary text-white' : 'text-gray-500 hover:bg-gray-200/80'
            )}
          >
            <Rows3 className="h-4 w-4 shrink-0" aria-hidden />
          </button>
          <button
            type="button"
            onClick={() => onViewModeChange('grid')}
            aria-label={t('search.viewGrid')}
            title={t('search.viewGrid')}
            className={cn(
              'flex h-9 w-10 items-center justify-center transition-colors',
              viewMode === 'grid' ? 'bg-primary text-white' : 'text-gray-500 hover:bg-gray-200/80'
            )}
          >
            <Grid2x2 className="h-4 w-4 shrink-0" aria-hidden />
          </button>
        </div>
      </div>
    </div>
  );
}
