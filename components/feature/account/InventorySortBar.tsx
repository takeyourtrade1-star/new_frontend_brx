'use client';

import { useMemo } from 'react';
import { Grid3X3, List } from 'lucide-react';
import type { InventoryFilters } from '@/components/feature/account/InventoryFiltersPanel';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { useIntlLocale } from '@/lib/i18n/useIntlLocale';

type SortBy = InventoryFilters['sortBy'];

interface SortPill {
  value: SortBy;
  label: string;
}

interface InventorySortBarProps {
  sortBy: SortBy;
  onSortChange: (sortBy: SortBy) => void;
  viewMode: 'table' | 'cards';
  onViewModeChange: (mode: 'table' | 'cards') => void;
  itemCount: number;
  /** Vista compatta mobile: select ordinamento invece dei pill. */
  compact?: boolean;
}

export function InventorySortBar({
  sortBy,
  onSortChange,
  viewMode,
  onViewModeChange,
  itemCount,
  compact = false,
}: InventorySortBarProps) {
  const { t } = useTranslation();
  const intlLocale = useIntlLocale();

  const SORT_PILLS: SortPill[] = useMemo(
    () => [
      { value: 'price-desc', label: t('search.sort.priceDesc') },
      { value: 'price-asc', label: t('search.sort.priceAsc') },
      { value: 'condition-desc', label: t('search.sort.conditionDesc') },
      { value: 'condition-asc', label: t('search.sort.conditionAsc') },
      { value: 'name-asc', label: t('search.sort.nameAsc') },
      { value: 'date-desc', label: t('search.sort.dateDesc') },
    ],
    [t]
  );

  if (compact) {
    return (
      <div className="mb-3 flex items-center gap-2 md:hidden">
        <label className="sr-only" htmlFor="inventory-sort-mobile">
          {t('common.sortBy')}
        </label>
        <select
          id="inventory-sort-mobile"
          value={sortBy}
          onChange={(e) => onSortChange(e.target.value as SortBy)}
          className="min-h-[44px] flex-1 rounded-xl border border-gray-200 bg-white px-3 text-sm font-medium text-gray-900 shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
        >
          {SORT_PILLS.map((pill) => (
            <option key={pill.value} value={pill.value}>
              {pill.label}
            </option>
          ))}
        </select>
        <span className="shrink-0 text-xs tabular-nums text-gray-500">
          {itemCount.toLocaleString(intlLocale)}
        </span>
      </div>
    );
  }

  return (
    <div className="mb-4 hidden flex-col gap-2.5 rounded-2xl border border-gray-200/70 bg-white/80 px-3 py-2.5 shadow-sm backdrop-blur-sm md:mb-4 md:flex md:flex-row md:flex-wrap md:items-center md:gap-3 md:rounded-xl md:px-4">
      <div className="flex min-w-0 items-center justify-between gap-2 md:contents">
        <span className="shrink-0 text-sm text-gray-500">
          <span className="font-semibold tabular-nums text-gray-900">
            {itemCount.toLocaleString(intlLocale)}
          </span>{' '}
          <span>{t('accountPage.itemsCardsFound', { count: itemCount })}</span>
        </span>

        <div className="hidden items-center rounded-lg bg-gray-100 p-1 md:flex">
          <button
            type="button"
            onClick={() => onViewModeChange('table')}
            className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-all duration-150 ${
              viewMode === 'table'
                ? 'bg-white text-primary shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
            aria-label={t('accountPage.itemsViewTableAria')}
            title={t('accountPage.itemsViewTableAria')}
          >
            <List className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => onViewModeChange('cards')}
            className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-all duration-150 ${
              viewMode === 'cards'
                ? 'bg-white text-primary shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
            aria-label={t('accountPage.itemsViewCardsAria')}
            title={t('accountPage.itemsViewCardsAria')}
          >
            <Grid3X3 className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="mx-2 hidden h-4 w-px bg-gray-200 md:block" />

      <div className="-mx-1 flex flex-nowrap items-center gap-1.5 overflow-x-auto overscroll-x-contain px-1 pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] md:mx-0 md:flex-1 md:flex-wrap md:overflow-visible md:pb-0 [&::-webkit-scrollbar]:hidden">
        {SORT_PILLS.map((pill) => (
          <button
            key={pill.value}
            type="button"
            onClick={() => onSortChange(pill.value)}
            className={`shrink-0 rounded-full px-3 py-2 text-xs font-medium transition-all duration-150 md:py-1.5 ${
              sortBy === pill.value
                ? 'bg-primary text-white shadow-sm'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-900'
            }`}
          >
            {pill.label}
          </button>
        ))}
      </div>
    </div>
  );
}
