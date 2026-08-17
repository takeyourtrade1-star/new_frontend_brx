'use client';

import { useCallback, useEffect, useMemo, useRef, useState, type Dispatch, type MutableRefObject, type SetStateAction } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { InventoryItemResponse } from '@/lib/api/sync-client';
import type { BlueprintToCardMap } from '@/lib/meilisearch-cards-by-ids';
import { fetchCardsByBlueprintIds } from '@/lib/meilisearch-cards-by-ids';
import type { InventoryItemWithCatalog } from '@/lib/sync/inventory-types';
import { accountInventoryKeys } from '@/lib/inventory/account-inventory-keys';
import { fetchAccountInventoryRaw } from '@/lib/inventory/fetch-account-inventory-raw';
import { isVisibleInventoryGame } from '@/lib/inventory/inventory-filter-utils';
import {
  CATALOG_FETCH_BATCH,
  fetchCatalogBatched,
} from '@/lib/inventory/fetch-catalog-batched';

/** Righe priorità catalogo (allineato a INVENTORY_ITEMS_PER_PAGE in OggettiContent). */
const CATALOG_PRIORITY_PAGE_SIZE = 50;
const CATALOG_STATE_FLUSH_BATCHES = 6;

interface AccountInventoryOptions {
  /** Negli scambi non servono le righe ricevute ma non ancora ripubblicate. */
  catalogScope?: 'all' | 'tradable-listings';
}

async function loadCatalogInBackground(
  allItems: InventoryItemResponse[],
  generation: number,
  catalogLoadGenRef: MutableRefObject<number>,
  setCatalogMap: Dispatch<SetStateAction<BlueprintToCardMap>>,
  setCatalogLoading: Dispatch<SetStateAction<boolean>>
): Promise<void> {
  const allBlueprintIds = [
    ...new Set(allItems.map((i) => i.blueprint_id).filter((id): id is number => Boolean(id))),
  ];
  if (allBlueprintIds.length === 0) return;

  setCatalogLoading(true);
  try {
    const priorityCount = Math.min(CATALOG_PRIORITY_PAGE_SIZE, allItems.length);
    const priorityIds = [
      ...new Set(
        allItems
          .slice(0, priorityCount)
          .map((i) => i.blueprint_id)
          .filter((id): id is number => Boolean(id))
      ),
    ];
    const restIds = allBlueprintIds.filter((id) => !priorityIds.includes(id));

    const priorityMap = await fetchCatalogBatched(priorityIds);
    if (catalogLoadGenRef.current !== generation) return;
    setCatalogMap((prev) => ({ ...prev, ...priorityMap }));

    let pendingMap: BlueprintToCardMap = {};
    for (let i = 0; i < restIds.length; i += CATALOG_FETCH_BATCH) {
      if (catalogLoadGenRef.current !== generation) return;
      const batch = restIds.slice(i, i + CATALOG_FETCH_BATCH);
      const fetched = await fetchCardsByBlueprintIds(batch);
      if (catalogLoadGenRef.current !== generation) return;
      pendingMap = { ...pendingMap, ...fetched };
      const batchIndex = Math.floor(i / CATALOG_FETCH_BATCH);
      const isFlushBoundary = (batchIndex + 1) % CATALOG_STATE_FLUSH_BATCHES === 0;
      const isLastBatch = i + CATALOG_FETCH_BATCH >= restIds.length;
      if (isFlushBoundary || isLastBatch) {
        const nextMap = pendingMap;
        pendingMap = {};
        setCatalogMap((prev) => ({ ...prev, ...nextMap }));
      }
    }
  } finally {
    if (catalogLoadGenRef.current === generation) {
      setCatalogLoading(false);
    }
  }
}

export function useAccountInventory(
  userId: string | undefined,
  accessToken: string | null,
  options: AccountInventoryOptions = {},
) {
  const queryClient = useQueryClient();
  const catalogLoadGenRef = useRef(0);
  const [catalogMap, setCatalogMap] = useState<BlueprintToCardMap>({});
  const [catalogLoading, setCatalogLoading] = useState(false);

  const enabled = Boolean(userId && accessToken);

  const query = useQuery({
    queryKey: userId ? accountInventoryKeys.raw(userId) : ['account-inventory', 'raw', 'none'],
    queryFn: () => fetchAccountInventoryRaw(userId!, accessToken!),
    enabled,
    staleTime: 30_000,
  });

  const inventoryRaw = useMemo(() => query.data?.items ?? [], [query.data?.items]);
  const catalogSourceItems = useMemo(() => {
    if (options.catalogScope !== 'tradable-listings') return inventoryRaw;
    return inventoryRaw.filter((item) => (
      item.listing_source === 'marketplace' && Boolean(item.marketplace_listing_id)
    ) || (
      item.listing_source === 'sync' && item.source === 'cardtrader'
    ));
  }, [inventoryRaw, options.catalogScope]);
  const total = query.data?.total ?? 0;
  const loading = enabled && (query.isLoading || (query.isFetching && inventoryRaw.length === 0));

  useEffect(() => {
    if (!catalogSourceItems.length) {
      setCatalogMap({});
      setCatalogLoading(false);
      return;
    }
    const generation = catalogLoadGenRef.current + 1;
    catalogLoadGenRef.current = generation;
    setCatalogMap({});
    setCatalogLoading(false);
    void loadCatalogInBackground(
      catalogSourceItems,
      generation,
      catalogLoadGenRef,
      setCatalogMap,
      setCatalogLoading
    );
  }, [catalogSourceItems, query.dataUpdatedAt]);

  // Proiezione visibile: per ora solo giochi MTG/sealed (piano CardTrader, Fase 8).
  const inventoryItems = useMemo<InventoryItemWithCatalog[]>(
    () =>
      inventoryRaw
        .map((item) => ({
          ...item,
          card: catalogMap[item.blueprint_id],
        }))
        .filter(isVisibleInventoryGame),
    [inventoryRaw, catalogMap]
  );

  const refetchInventory = useCallback(async () => {
    catalogLoadGenRef.current += 1;
    setCatalogMap({});
    setCatalogLoading(false);
    return query.refetch();
  }, [query]);

  const invalidateInventory = useCallback(async () => {
    if (!userId) return;
    catalogLoadGenRef.current += 1;
    setCatalogMap({});
    await queryClient.invalidateQueries({ queryKey: accountInventoryKeys.raw(userId) });
  }, [queryClient, userId]);

  const mergeCatalogMap = useCallback((fetched: BlueprintToCardMap) => {
    if (Object.keys(fetched).length === 0) return;
    setCatalogMap((prev) => ({ ...prev, ...fetched }));
  }, []);

  return {
    inventoryRaw,
    inventoryItems,
    catalogMap,
    catalogLoading,
    total,
    loading,
    isError: query.isError,
    refetchInventory,
    invalidateInventory,
    mergeCatalogMap,
  };
}
