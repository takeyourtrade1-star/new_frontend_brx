import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';

import { useInventorySelection } from '@/hooks/account/useInventorySelection';
import { deleteInventoryOrListing } from '@/lib/inventory/inventory-item-mutations';
import type { InventoryItemWithCatalog } from '@/lib/sync/inventory-types';

vi.mock('@/lib/inventory/inventory-item-mutations', () => ({
  deleteInventoryOrListing: vi.fn().mockResolvedValue({}),
  updateInventoryOrListing: vi.fn().mockResolvedValue({}),
}));

const items = [
  { id: 1, quantity: 2 },
  { id: 2, quantity: 1 },
] as unknown as InventoryItemWithCatalog[];

function setup(selected: number[] = []) {
  let selectedIds = new Set<number>(selected);
  const setSelectedIds = vi.fn((u: unknown) => {
    selectedIds = typeof u === 'function' ? (u as (p: Set<number>) => Set<number>)(selectedIds) : (u as Set<number>);
  });
  const setError = vi.fn();
  const setToast = vi.fn();
  const refreshInventory = vi.fn().mockResolvedValue(undefined);
  const hook = renderHook(() =>
    useInventorySelection({
      userId: 'u1',
      accessToken: 'tok',
      inventoryRaw: items,
      filteredInventoryItems: items,
      selectedIds,
      setSelectedIds,
      refreshInventory,
      t: ((k: string) => k) as never,
      setError,
      setToast,
    })
  );
  return { hook, setSelectedIds, setError, setToast, refreshInventory };
}

beforeEach(() => vi.clearAllMocks());

describe('useInventorySelection', () => {
  it('allFilteredSelected riflette la selezione completa', () => {
    const { hook } = setup([1, 2]);
    expect(hook.result.current.allFilteredSelected).toBe(true);
  });

  it('onDeselectAll svuota la selezione', () => {
    const { hook, setSelectedIds } = setup([1]);
    act(() => hook.result.current.onDeselectAll());
    expect(setSelectedIds).toHaveBeenCalled();
  });

  it('handleBulkDelete (loop unificato) cancella ogni id selezionato e ricarica', async () => {
    const { hook, refreshInventory, setToast } = setup([1, 2]);
    await act(async () => {
      await hook.result.current.handleBulkDelete(false);
    });
    expect(deleteInventoryOrListing).toHaveBeenCalledTimes(2);
    expect(refreshInventory).toHaveBeenCalled();
    expect(setToast).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'success' })
    );
  });
});
