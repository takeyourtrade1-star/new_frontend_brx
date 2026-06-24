'use client';

/**
 * GlobalSearchBar - Game-First UX con Meilisearch (stesso stile e funzionalità di frontend-vecchio)
 * Ricerca 100% server-side su Meilisearch (react-instantsearch + instant-meilisearch).
 * Input disabilitato finché non è selezionato un gioco; filtro rigoroso game_slug.
 */

import { useEffect, useMemo, useState } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { InstantSearch, Configure } from 'react-instantsearch';
import { searchClient } from '@/lib/meilisearchClient';
import { useGame } from '@/lib/contexts/GameContext';
import { MEILISEARCH_PUBLIC_INDEX_NAME } from '@/lib/config';
import { CATEGORY_SLUGS } from '@/lib/product-categories';
import {
  type CategoryKey,
  normalizeGameSlug,
  normalizeCategoryKey,
  getCategoryIds,
  getCategoryIdsAcrossGames,
} from '@/lib/search/category-mapping';
import { FRONTEND_TO_DB_SLUG } from '@/lib/search/global-search-url';
import { SearchWithInstantSearch } from '@/components/layout/search/SearchWithInstantSearch';

export type { CardSearchHit } from '@/lib/search/global-search-types';

export default function GlobalSearchBar({ onOpenChange }: { onOpenChange?: (isOpen: boolean) => void }) {
  const { selectedGame } = useGame();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [productCategory, setProductCategory] = useState<CategoryKey | null>(() => {
    if (typeof window === 'undefined') return 'singles';
    const params = new URLSearchParams(window.location.search);
    const catKey = normalizeCategoryKey(params.get('category_key'));
    if (catKey) return catKey;
    const pathParts = pathname.split('/');
    const pathCategory = pathParts[2] ?? '';
    if (CATEGORY_SLUGS.has(pathCategory)) {
      const normalizedPathCategory = normalizeCategoryKey(pathCategory);
      if (normalizedPathCategory) return normalizedPathCategory;
    }
    return 'singles';
  });

  useEffect(() => {
    const fromQuery = normalizeCategoryKey(searchParams.get('category_key'));
    if (fromQuery) {
      setProductCategory((prev) => (prev === fromQuery ? prev : fromQuery));
      return;
    }
    const pathParts = pathname.split('/');
    const pathCategory = pathParts[2] ?? '';
    if (!CATEGORY_SLUGS.has(pathCategory)) return;
    const fromPath = normalizeCategoryKey(pathCategory);
    if (!fromPath) return;
    setProductCategory((prev) => (prev === fromPath ? prev : fromPath));
  }, [pathname, searchParams]);

  const mappingGameSlug = useMemo(() => normalizeGameSlug(selectedGame), [selectedGame]);

  const gameFilter = useMemo(() => {
    if (!selectedGame) return undefined;
    const realSlug = FRONTEND_TO_DB_SLUG[selectedGame] ?? selectedGame;
    return [`game_slug = "${realSlug}"`];
  }, [selectedGame]);

  const categoryFilter = useMemo(() => {
    const normalizedCategory = normalizeCategoryKey(productCategory);
    if (!normalizedCategory || normalizedCategory === 'all') return [];
    const ids = mappingGameSlug
      ? getCategoryIds(mappingGameSlug, normalizedCategory)
      : getCategoryIdsAcrossGames(normalizedCategory);
    if (ids.length === 0) return [];
    if (ids.length === 1) return [`category_id = ${ids[0]}`];
    return [`category_id IN [${ids.join(', ')}]`];
  }, [mappingGameSlug, productCategory]);

  const allFilters = useMemo(() => {
    const filters: string[] = [];
    if (gameFilter) filters.push(...gameFilter);
    const normalizedCategory = normalizeCategoryKey(productCategory);
    if (normalizedCategory === 'sets') {
      filters.push('category_id = -999');
    } else if (categoryFilter.length > 0) {
      filters.push(...categoryFilter);
    }
    return filters.length > 0 ? filters : undefined;
  }, [gameFilter, categoryFilter, productCategory]);

  return (
    <div
      className="flex w-full justify-center py-0 z-[99] font-sans h-full min-h-0"
      style={{ overflow: 'visible' }}
    >
      <div
        className="flex min-h-0 w-full min-w-0 flex-1 flex-row items-center gap-2 md:gap-3"
        style={{ position: 'relative', overflow: 'visible' }}
      >
        <div className="flex min-h-0 w-full min-w-0 flex-1">
          <InstantSearch
            searchClient={searchClient}
            indexName={MEILISEARCH_PUBLIC_INDEX_NAME}
            future={{ preserveSharedStateOnUnmount: true }}
          >
            <Configure
              {...({
                filter: allFilters?.join(' AND '),
                hitsPerPage: 8,
              } as React.ComponentProps<typeof Configure> & { filter?: string })}
            />
            <SearchWithInstantSearch
              selectedGame={selectedGame}
              productCategory={productCategory}
              setProductCategory={setProductCategory}
              onOpenChange={onOpenChange}
            />
          </InstantSearch>
        </div>
      </div>
    </div>
  );
}
