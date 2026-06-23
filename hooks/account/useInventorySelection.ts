import { useCallback, useMemo, useState, type Dispatch, type SetStateAction } from 'react';
import {
  deleteInventoryOrListing,
  updateInventoryOrListing,
} from '@/lib/inventory/inventory-item-mutations';
import type { InventoryItemWithCatalog } from '@/lib/sync/inventory-types';
import type { MessageKey } from '@/lib/i18n/messages/en';

type Toast = { message: string; type: 'success' | 'error' } | null;

/**
 * Piano 1.4 — seam "selezione + azioni bulk" estratto da OggettiContent.
 * Possiede lo stato di selezione/bulk e gli handler relativi. Il loop di
 * cancellazione bulk (prima duplicato tra `onDeleteSelected` e `handleBulkDelete`)
 * è stato unificato in un unico `runBulkDelete`, eliminando la duplicazione.
 * Comportamento invariato.
 */
export function useInventorySelection({
  userId,
  accessToken,
  inventoryRaw,
  filteredInventoryItems,
  selectedIds,
  setSelectedIds,
  refreshInventory,
  t,
  setError,
  setToast,
}: {
  userId: string | undefined;
  accessToken: string | null;
  inventoryRaw: InventoryItemWithCatalog[];
  filteredInventoryItems: InventoryItemWithCatalog[];
  selectedIds: Set<number>;
  setSelectedIds: Dispatch<SetStateAction<Set<number>>>;
  refreshInventory: () => Promise<void>;
  t: (key: MessageKey, vars?: Record<string, string | number>) => string;
  setError: (message: string | null) => void;
  setToast: (toast: Toast) => void;
}) {
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [bulkDeleteProgress, setBulkDeleteProgress] = useState<{ current: number; total: number } | null>(
    null
  );
  const [isBulkPriceOpen, setIsBulkPriceOpen] = useState(false);
  const [isBulkDeleteOpen, setIsBulkDeleteOpen] = useState(false);

  const allFilteredSelected =
    filteredInventoryItems.length > 0 &&
    filteredInventoryItems.every((i) => selectedIds.has(i.id));

  const onToggleSelect = useCallback((id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const onSelectAll = useCallback(() => {
    setSelectedIds(new Set(filteredInventoryItems.map((i) => i.id)));
  }, [filteredInventoryItems]);

  const onDeselectAll = useCallback(() => setSelectedIds(new Set()), []);

  /** Loop di cancellazione bulk condiviso (ex duplicazione onDeleteSelected/handleBulkDelete). */
  const runBulkDelete = useCallback(
    async (ids: number[]): Promise<void> => {
      if (!userId || !accessToken || ids.length === 0) return;
      setBulkDeleting(true);
      setBulkDeleteProgress({ current: 0, total: ids.length });
      let successCount = 0;
      let failCount = 0;
      const failedIds: number[] = [];
      try {
        for (let i = 0; i < ids.length; i++) {
          const item = inventoryRaw.find((row) => row.id === ids[i]);
          if (!item) {
            failCount++;
            failedIds.push(ids[i]);
            setBulkDeleteProgress({ current: i + 1, total: ids.length });
            continue;
          }
          try {
            await deleteInventoryOrListing(userId, item, accessToken);
            successCount++;
          } catch {
            failCount++;
            failedIds.push(ids[i]);
          }
          setBulkDeleteProgress({ current: i + 1, total: ids.length });
        }
        await refreshInventory();
        setSelectedIds(new Set(failedIds));
        if (failCount > 0) {
          setToast({
            message: t('accountPage.itemsBulkDeletePartial', { success: successCount, failed: failCount }),
            type: 'error',
          });
          setError(t('accountPage.itemsBulkDeleteError'));
        } else {
          setToast({
            message: t('accountPage.itemsBulkDeleteSuccess', { count: successCount }),
            type: 'success',
          });
        }
      } catch (e) {
        const msg = e instanceof Error ? e.message : t('accountPage.itemsBulkDeleteError');
        setError(msg);
      } finally {
        setBulkDeleting(false);
        setBulkDeleteProgress(null);
      }
    },
    [userId, accessToken, inventoryRaw, refreshInventory, t, setError, setToast]
  );

  const onDeleteSelected = useCallback((ids: number[]) => runBulkDelete(ids), [runBulkDelete]);

  // Mantiene la firma (deleteFromPlatforms) attesa da BulkDeleteModal; l'argomento
  // non era usato nemmeno nell'implementazione originale.
  const handleBulkDelete = useCallback(
    async (_deleteFromPlatforms: boolean): Promise<void> => {
      await runBulkDelete(Array.from(selectedIds));
    },
    [runBulkDelete, selectedIds]
  );

  const handleBulkPriceApply = useCallback(
    async (
      ids: number[],
      operation: '+' | '-',
      percent: number,
      _platform: 'ebartex' | 'all'
    ) => {
      if (!userId || !accessToken) return;
      const idSet = new Set(ids);
      const factor = operation === '+' ? 1 + percent / 100 : 1 - percent / 100;

      for (const item of inventoryRaw) {
        if (!idSet.has(item.id)) continue;
        const newPriceCents = Math.round((item.price_cents ?? 0) * factor);
        try {
          await updateInventoryOrListing(userId, item, accessToken, {
            quantity: item.quantity,
            price_cents: newPriceCents,
            condition: (item.properties?.condition as string) ?? 'near_mint',
            mtg_language: (item.properties?.mtg_language as string) ?? 'en',
            description: item.description ?? '',
            graded: item.graded === true,
            properties: item.properties as Record<string, unknown> | undefined,
          });
        } catch {
          /* continue other rows */
        }
      }

      await refreshInventory();

      setToast({
        message: t('accountPage.bulkPriceSuccess', {
          count: ids.length,
          sign: operation === '+' ? '+' : '−',
          pct: percent,
        }),
        type: 'success',
      });
    },
    [userId, accessToken, inventoryRaw, refreshInventory, t, setToast]
  );

  return useMemo(
    () => ({
      bulkDeleting,
      bulkDeleteProgress,
      isBulkPriceOpen,
      setIsBulkPriceOpen,
      isBulkDeleteOpen,
      setIsBulkDeleteOpen,
      allFilteredSelected,
      onToggleSelect,
      onSelectAll,
      onDeselectAll,
      onDeleteSelected,
      handleBulkDelete,
      handleBulkPriceApply,
    }),
    [
      selectedIds,
      bulkDeleting,
      bulkDeleteProgress,
      isBulkPriceOpen,
      isBulkDeleteOpen,
      allFilteredSelected,
      onToggleSelect,
      onSelectAll,
      onDeselectAll,
      onDeleteSelected,
      handleBulkDelete,
      handleBulkPriceApply,
    ]
  );
}
