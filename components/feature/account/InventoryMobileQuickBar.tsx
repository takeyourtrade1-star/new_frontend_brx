'use client';

import { SlidersHorizontal } from 'lucide-react';
import type { InventoryFilters } from '@/components/feature/account/InventoryFiltersPanel';
import type { InventoryFacets } from '@/lib/inventory/inventory-filter-utils';
import { useTranslation } from '@/lib/i18n/useTranslation';

type SortBy = InventoryFilters['sortBy'];

const SORT_PILLS: { value: SortBy; label: string }[] = [
  { value: 'date-desc', label: 'Recenti' },
  { value: 'price-desc', label: 'Prezzo ↓' },
  { value: 'price-asc', label: 'Prezzo ↑' },
  { value: 'name-asc', label: 'Nome A→Z' },
  { value: 'condition-desc', label: 'Cond. ↓' },
];

interface InventoryMobileQuickBarProps {
  filters: InventoryFilters;
  onFiltersChange: (filters: InventoryFilters) => void;
  facets: InventoryFacets;
  itemCount: number;
  activeFilterCount: number;
  onOpenFilters: () => void;
  disabled?: boolean;
  className?: string;
  showFilterButton?: boolean;
}

export function InventoryMobileQuickBar({
  filters,
  onFiltersChange,
  facets,
  itemCount,
  activeFilterCount,
  onOpenFilters,
  disabled = false,
  className = '',
  showFilterButton = true,
}: InventoryMobileQuickBarProps) {
  const { t } = useTranslation();

  const kindOptions = (['all', 'singole', 'oggetti'] as const).filter((k) => {
    if (k === 'all') return facets.kinds.all > 0;
    if (k === 'singole') return facets.kinds.singole > 0;
    return facets.kinds.oggetti > 0;
  });

  return (
    <div className={`space-y-1.5 ${className}`}>
      <div className="flex items-center gap-1.5">
        <div className="-mx-0.5 flex min-w-0 flex-1 gap-1.5 overflow-x-auto overscroll-x-contain pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {kindOptions.map((k) => {
            const label =
              k === 'all'
                ? t('accountPage.itemsFilterAll')
                : k === 'singole'
                  ? t('accountPage.itemsFilterSingles')
                  : t('accountPage.itemsFilterSealed');
            return (
              <button
                key={k}
                type="button"
                disabled={disabled}
                onClick={() => onFiltersChange({ ...filters, kind: k })}
                className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold transition-all ${
                  filters.kind === k
                    ? 'bg-gray-900 text-white shadow-sm'
                    : 'bg-white text-gray-600 ring-1 ring-gray-200'
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
        {showFilterButton && (
          <button
            type="button"
            disabled={disabled}
            onClick={onOpenFilters}
            className="flex h-8 shrink-0 items-center justify-center gap-1.5 rounded-full border border-gray-200 bg-white px-2.5 text-xs font-semibold text-gray-800 shadow-sm active:scale-[0.99] disabled:opacity-50"
            aria-label={t('accountPage.itemsFiltersPanelTitle')}
          >
            <SlidersHorizontal className="h-3.5 w-3.5 shrink-0 text-gray-500" aria-hidden />
            {activeFilterCount > 0 ? (
              <span className="rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-bold text-white leading-none">
                {activeFilterCount}
              </span>
            ) : null}
          </button>
        )}
      </div>

      <div className="-mx-0.5 flex gap-1.5 overflow-x-auto overscroll-x-contain pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {SORT_PILLS.map((pill) => (
          <button
            key={pill.value}
            type="button"
            disabled={disabled}
            onClick={() => onFiltersChange({ ...filters, sortBy: pill.value })}
            className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium transition-all ${
              filters.sortBy === pill.value
                ? 'bg-primary text-white shadow-sm'
                : 'bg-white text-gray-600 ring-1 ring-gray-200'
            }`}
          >
            {pill.label}
          </button>
        ))}
        <span className="shrink-0 self-center text-xs font-medium tabular-nums text-gray-400">
          {itemCount.toLocaleString('it-IT')}
        </span>
      </div>
    </div>
  );
}
