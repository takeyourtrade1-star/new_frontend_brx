import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';

import { useInventoryExport } from '@/hooks/account/useInventoryExport';
import * as exportUtils from '@/lib/inventory/inventory-export-utils';
import type { InventoryItemWithCatalog } from '@/lib/sync/inventory-types';

vi.spyOn(exportUtils, 'downloadBlob').mockImplementation(() => {});

const items = [
  { id: 1, quantity: 2 },
  { id: 2, quantity: 1 },
] as unknown as InventoryItemWithCatalog[];

beforeEach(() => vi.clearAllMocks());

describe('useInventoryExport', () => {
  it('non scarica nulla se la selezione è vuota', () => {
    const { result } = renderHook(() =>
      useInventoryExport({ filteredInventoryItems: items, selectedIds: new Set<number>() })
    );
    act(() => result.current.handleExportSelectionCSV());
    expect(exportUtils.downloadBlob).not.toHaveBeenCalled();
  });

  it('esporta CSV dell\'inventario filtrato e chiude il menu', () => {
    const { result } = renderHook(() =>
      useInventoryExport({ filteredInventoryItems: items, selectedIds: new Set<number>() })
    );
    act(() => result.current.setExportModalOpen(true));
    act(() => result.current.handleExportCSV());
    expect(exportUtils.downloadBlob).toHaveBeenCalledTimes(1);
    expect(result.current.exportModalOpen).toBe(false);
  });

  it('esporta JSON', () => {
    const { result } = renderHook(() =>
      useInventoryExport({ filteredInventoryItems: items, selectedIds: new Set<number>() })
    );
    act(() => result.current.handleExportJSON());
    expect(exportUtils.downloadBlob).toHaveBeenCalledTimes(1);
  });
});
