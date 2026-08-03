import { describe, expect, it, vi } from 'vitest';

import {
  collectBoundedInventoryPages,
  InventoryPaginationError,
} from '@/lib/inventory/bounded-pagination';

type Item = { id: number };

const ids = (...values: number[]): Item[] => values.map((id) => ({ id }));

describe('collectBoundedInventoryPages', () => {
  it('collects finite non-overlapping pages', async () => {
    const fetchPage = vi
      .fn()
      .mockResolvedValueOnce({ items: ids(1, 2), total: 3 })
      .mockResolvedValueOnce({ items: ids(3), total: 3 });

    await expect(
      collectBoundedInventoryPages<Item>({
        pageSize: 2,
        fetchPage,
        itemKey: (item) => item.id,
      }),
    ).resolves.toEqual(ids(1, 2, 3));
    expect(fetchPage).toHaveBeenNthCalledWith(1, 0, 0);
    expect(fetchPage).toHaveBeenNthCalledWith(2, 1, 2);
  });

  it.each([
    [{ items: [], total: 1 }, 'non-progress'],
    [{ items: ids(1), total: Number.NaN }, 'invalid-total'],
    [{ items: ids(1, 2, 3), total: 3 }, 'invalid-page'],
    [{ items: ids(1), total: 21 }, 'item-limit'],
  ] as const)('rejects malformed or unsafe page %#', async (page, code) => {
    await expect(
      collectBoundedInventoryPages({
        pageSize: 2,
        maxItems: 20,
        fetchPage: vi.fn(async () => page),
        itemKey: (item) => item.id,
      }),
    ).rejects.toMatchObject({ code } satisfies Partial<InventoryPaginationError>);
  });

  it('rejects overlap between pages instead of looping over repeated data', async () => {
    const fetchPage = vi
      .fn()
      .mockResolvedValueOnce({ items: ids(1, 2), total: 4 })
      .mockResolvedValueOnce({ items: ids(2, 3), total: 4 });

    await expect(
      collectBoundedInventoryPages<Item>({
        pageSize: 2,
        fetchPage,
        itemKey: (item) => item.id,
      }),
    ).rejects.toMatchObject({ code: 'overlap' });
    expect(fetchPage).toHaveBeenCalledTimes(2);
  });

  it('stops at the page ceiling even when totals are omitted', async () => {
    const fetchPage = vi.fn(async (page: number) => ({
      items: ids(page * 2 + 1, page * 2 + 2),
      total: null,
    }));

    await expect(
      collectBoundedInventoryPages({
        pageSize: 2,
        maxItems: 100,
        maxPages: 3,
        fetchPage,
        itemKey: (item) => item.id,
      }),
    ).rejects.toMatchObject({ code: 'page-limit' });
    expect(fetchPage).toHaveBeenCalledTimes(3);
  });

  it('does not retain a page that would cross the item ceiling', async () => {
    const fetchPage = vi.fn(async () => ({ items: ids(1, 2), total: null }));
    await expect(
      collectBoundedInventoryPages({
        pageSize: 2,
        maxItems: 1,
        fetchPage,
        itemKey: (item) => item.id,
      }),
    ).rejects.toMatchObject({ code: 'item-limit' });
  });
});
