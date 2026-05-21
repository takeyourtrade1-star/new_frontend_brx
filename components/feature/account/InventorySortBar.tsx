'use client';

import { Grid3X3, List } from 'lucide-react';
import type { InventoryFilters } from '@/components/feature/account/InventoryFiltersPanel';

type SortBy = InventoryFilters['sortBy'];

interface SortPill {
  value: SortBy;
  label: string;
}

const SORT_PILLS: SortPill[] = [
  { value: 'price-desc', label: 'Prezzo ↓' },
  { value: 'price-asc', label: 'Prezzo ↑' },
  { value: 'condition-desc', label: 'Cond. ↓' },
  { value: 'condition-asc', label: 'Cond. ↑' },
  { value: 'name-asc', label: 'Nome A→Z' },
  { value: 'date-desc', label: 'Recenti' },
];

interface InventorySortBarProps {
  sortBy: SortBy;
  onSortChange: (sortBy: SortBy) => void;
  viewMode: 'table' | 'cards';
  onViewModeChange: (mode: 'table' | 'cards') => void;
  itemCount: number;
}

export function InventorySortBar({
  sortBy,
  onSortChange,
  viewMode,
  onViewModeChange,
  itemCount,
}: InventorySortBarProps) {
  return (
    <div className="mb-4 flex flex-wrap items-center gap-3 rounded-xl border border-gray-200/70 bg-white/80 px-4 py-2.5 shadow-sm backdrop-blur-sm">
      <span className="shrink-0 text-sm text-gray-500">
        <span className="font-semibold tabular-nums text-gray-900">
          {itemCount.toLocaleString('it-IT')}
        </span>{' '}
        carte trovate
      </span>

      <div className="mx-2 hidden h-4 w-px bg-gray-200 sm:block" />

      <div className="flex flex-1 flex-wrap items-center gap-1.5">
        {SORT_PILLS.map((pill) => (
          <button
            key={pill.value}
            type="button"
            onClick={() => onSortChange(pill.value)}
            className={`rounded-full px-3 py-1.5 text-xs font-medium transition-all duration-150 ${
              sortBy === pill.value
                ? 'bg-primary text-white shadow-sm'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-900'
            }`}
          >
            {pill.label}
          </button>
        ))}
      </div>

      <div className="flex items-center rounded-lg bg-gray-100 p-1">
        <button
          type="button"
          onClick={() => onViewModeChange('table')}
          className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-all duration-150 ${
            viewMode === 'table'
              ? 'bg-white text-primary shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          }`}
          aria-label="Vista lista"
          title="Vista lista"
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
          aria-label="Vista card"
          title="Vista card"
        >
          <Grid3X3 className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
