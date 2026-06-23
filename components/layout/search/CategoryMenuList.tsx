'use client';

import { useMemo } from 'react';
import {
  type CategoryKey,
  type GameSlug as MappingGameSlug,
  getCategoryKeys,
  getCategoryLabel,
  CATEGORY_KEY_ORDER,
} from '@/lib/search/category-mapping';

export function CategoryMenuList({
  selectedCategory,
  onSelect,
  gameSlug,
  onClose,
}: {
  selectedCategory: CategoryKey | null;
  onSelect: (cat: CategoryKey | null) => void;
  gameSlug: MappingGameSlug | null;
  onClose?: () => void;
}) {
  const availableKeys = useMemo(() => {
    if (!gameSlug) return CATEGORY_KEY_ORDER;
    return getCategoryKeys(gameSlug);
  }, [gameSlug]);

  return (
    <div className="search-composite-panel__category py-1" role="listbox" aria-label="Categorie prodotto">
      {availableKeys.map((key) => {
        const label = gameSlug ? getCategoryLabel(gameSlug, key, 'it') : key;
        return (
          <button
            key={key}
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onSelect(key === 'all' ? null : key);
              onClose?.();
            }}
            className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm font-medium font-sans hover:bg-[#FF7300]/10 transition-colors ${
              selectedCategory === key || (!selectedCategory && key === 'all')
                ? 'text-[#FF7300] bg-orange-50/50'
                : 'text-gray-700'
            }`}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
