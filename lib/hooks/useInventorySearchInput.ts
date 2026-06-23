'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { InventoryFilters } from '@/components/feature/account/InventoryFiltersPanel';

/** Input ricerca inventario con debounce (condiviso tra sidebar desktop e toolbar mobile). */
export function useInventorySearchInput(
  filters: InventoryFilters,
  onFiltersChange: (filters: InventoryFilters) => void,
  debounceMs = 200
) {
  const [searchValue, setSearchValue] = useState(filters.search);

  // Refs sui valori "latest": l'effect debounce non deve dipendere dall'identità
  // di `filters`/`onFiltersChange` (ricreati a ogni render dal parent) altrimenti
  // il timer si resetta di continuo e il debounce non scatta mai.
  const filtersRef = useRef(filters);
  filtersRef.current = filters;
  const onFiltersChangeRef = useRef(onFiltersChange);
  onFiltersChangeRef.current = onFiltersChange;

  useEffect(() => {
    setSearchValue(filters.search);
  }, [filters.search]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchValue !== filtersRef.current.search) {
        onFiltersChangeRef.current({ ...filtersRef.current, search: searchValue });
      }
    }, debounceMs);
    return () => clearTimeout(timer);
  }, [searchValue, filters.search, debounceMs]);

  const clearSearch = useCallback(() => {
    setSearchValue('');
    onFiltersChange({ ...filters, search: '' });
  }, [filters, onFiltersChange]);

  return { searchValue, setSearchValue, clearSearch };
}
