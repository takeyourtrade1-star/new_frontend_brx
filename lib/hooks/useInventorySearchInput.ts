'use client';

import { useCallback, useEffect, useState } from 'react';
import type { InventoryFilters } from '@/components/feature/account/InventoryFiltersPanel';

/** Input ricerca inventario con debounce (condiviso tra sidebar desktop e toolbar mobile). */
export function useInventorySearchInput(
  filters: InventoryFilters,
  onFiltersChange: (filters: InventoryFilters) => void,
  debounceMs = 200
) {
  const [searchValue, setSearchValue] = useState(filters.search);

  useEffect(() => {
    setSearchValue(filters.search);
  }, [filters.search]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchValue !== filters.search) {
        onFiltersChange({ ...filters, search: searchValue });
      }
    }, debounceMs);
    return () => clearTimeout(timer);
  }, [searchValue, filters, onFiltersChange, debounceMs]);

  const clearSearch = useCallback(() => {
    setSearchValue('');
    onFiltersChange({ ...filters, search: '' });
  }, [filters, onFiltersChange]);

  return { searchValue, setSearchValue, clearSearch };
}
