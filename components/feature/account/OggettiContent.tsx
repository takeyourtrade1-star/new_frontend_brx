'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import Link from 'next/link';
import {
  CheckSquare,
  ChevronLeft,
  ChevronRight,
  Download,
  FileJson,
  FileSpreadsheet,
  Grid3X3,
  List,
  Loader2,
  RefreshCw,
  Trash2,
  TrendingUp,
  X,
} from 'lucide-react';
import { useAuthStore } from '@/lib/stores/auth-store';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { syncClient } from '@/lib/api/sync-client';
import type { SyncStatusResponse } from '@/lib/api/sync-client';
import { useAccountInventory } from '@/lib/hooks/use-account-inventory';
import {
  deleteInventoryOrListing,
  updateInventoryOrListing,
} from '@/lib/inventory/inventory-item-mutations';
import { fetchCatalogBatched } from '@/lib/inventory/fetch-catalog-batched';
import { InventoryFiltersPanel, DEFAULT_FILTERS } from '@/components/feature/account/InventoryFiltersPanel';
import type { InventoryFilters } from '@/components/feature/account/InventoryFiltersPanel';
import { InventorySearchBar } from '@/components/feature/account/InventorySearchBar';
import { useInventorySearchInput } from '@/lib/hooks/useInventorySearchInput';
import { useMobileViewport } from '@/lib/hooks/useMobileViewport';
import {
  applyInventoryFilters,
  buildInventoryFacets,
  sanitizeInventoryFilters,
} from '@/lib/inventory/inventory-filter-utils';
import { BulkPriceWizardModal } from '@/components/feature/account/BulkPriceWizardModal';
import { BulkDeleteModal } from '@/components/feature/account/BulkDeleteModal';
import { InventoryMobileQuickBar } from '@/components/feature/account/InventoryMobileQuickBar';
import { OggettiTable } from '@/components/feature/account/oggetti/OggettiTable';
import type { OggettiViewMode } from '@/components/feature/account/oggetti/OggettiTable';
import {
  buildImageUrl,
  DEFAULT_IMAGE,
  downloadBlob,
  escapeCsvCell,
  itemToExportRow,
} from '@/lib/inventory/inventory-export-utils';

/** Righe massime renderizzate per pagina (performance UI). */
const INVENTORY_ITEMS_PER_PAGE = 50;

export function OggettiContent() {
  const { t } = useTranslation();
  const isMobile = useMobileViewport();
  const user = useAuthStore((s) => s.user);
  // FE-REV-018: selector puro; il fallback localStorage va nel useMemo, non dentro il selector Zustand.
  const accessTokenFromStore = useAuthStore((s) => s.accessToken);
  const accessToken = useMemo(
    () =>
      accessTokenFromStore ??
      (typeof window !== 'undefined' ? localStorage.getItem('ebartex_access_token') : null),
    [accessTokenFromStore]
  );

  const {
    inventoryRaw,
    inventoryItems,
    catalogMap,
    catalogLoading,
    total,
    loading,
    isError: inventoryLoadError,
    refetchInventory,
    mergeCatalogMap,
  } = useAccountInventory(user?.id, accessToken);

  const [error, setError] = useState<string | null>(null);
  const [syncBanner, setSyncBanner] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);
  const [syncPending, setSyncPending] = useState(false);
  const [syncNowPending, setSyncNowPending] = useState(false);
  const [filters, setFilters] = useState<InventoryFilters>(DEFAULT_FILTERS);
  const [isBulkPriceOpen, setIsBulkPriceOpen] = useState(false);
  const [isBulkDeleteOpen, setIsBulkDeleteOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [bulkDeleteProgress, setBulkDeleteProgress] = useState<{ current: number; total: number } | null>(
    null
  );
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState<OggettiViewMode>('table');
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [showFloatingBar, setShowFloatingBar] = useState(false);
  const { searchValue, setSearchValue, clearSearch } = useInventorySearchInput(filters, setFilters);

  /** Verifica lato frontend: chiamate al sync service solo se integrazione marketplace attiva. */
  const [syncStatus, setSyncStatus] = useState<SyncStatusResponse | null>(null);
  const [syncStatusLoading, setSyncStatusLoading] = useState(true);
  
  const syncEnabled =
    Boolean(syncStatus && !syncStatus.disconnected) &&
    (syncStatus?.sync_status === 'active' || syncStatus?.sync_status === 'initial_sync');
  const isDisconnected = syncStatus?.disconnected === true;
  const integrationConnected = Boolean(syncStatus && !isDisconnected);
  const syncAnyPending = syncPending || syncNowPending;
  const canSyncNow = integrationConnected && syncStatus?.sync_status !== 'initial_sync';

  const facets = useMemo(() => buildInventoryFacets(inventoryItems), [inventoryItems]);

  const filteredInventoryItems = useMemo(
    () => applyInventoryFilters(inventoryItems, filters, inventoryItems),
    [inventoryItems, filters]
  );

  useEffect(() => {
    setFilters((prev) => {
      const sanitized = sanitizeInventoryFilters(prev, facets);
      return JSON.stringify(sanitized) === JSON.stringify(prev) ? prev : sanitized;
    });
  }, [facets]);

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY || document.documentElement.scrollTop;
      setShowFloatingBar(scrollY > 300);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);



  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(filteredInventoryItems.length / INVENTORY_ITEMS_PER_PAGE));
  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * INVENTORY_ITEMS_PER_PAGE;
    return filteredInventoryItems.slice(start, start + INVENTORY_ITEMS_PER_PAGE);
  }, [filteredInventoryItems, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
    // FE-REV-004: al cambio filtri la selezione deve restare coerente con la vista corrente,
    // altrimenti bulk delete/export agirebbe su item non più visibili e il contatore mente.
    setSelectedIds((prev) => {
      if (prev.size === 0) return prev;
      const visibleIds = new Set(filteredInventoryItems.map((i) => i.id));
      let changed = false;
      const next = new Set<number>();
      prev.forEach((id) => {
        if (visibleIds.has(id)) next.add(id);
        else changed = true;
      });
      return changed ? next : prev;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intersezione voluta solo al cambio filtri; filteredInventoryItems è già aggiornato in questo render
  }, [filters]);

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(Math.max(1, totalPages));
  }, [currentPage, totalPages]);

  const paginatedBlueprintKey = useMemo(
    () => paginatedItems.map((i) => `${i.id}:${i.blueprint_id}`).join(','),
    [paginatedItems]
  );

  const prevPageRef = useRef(currentPage);
  useEffect(() => {
    if (prevPageRef.current !== currentPage) {
      prevPageRef.current = currentPage;
      if (typeof window !== 'undefined') {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }
  }, [currentPage]);

  /** Arricchisce subito le carte della pagina corrente se mancano nel cache. */
  useEffect(() => {
    if (paginatedItems.length === 0) return;
    const missing = [
      ...new Set(
        paginatedItems
          .map((i) => i.blueprint_id)
          .filter((id): id is number => Boolean(id) && !catalogMap[id])
      ),
    ];
    if (missing.length === 0) return;
    let cancelled = false;
    void fetchCatalogBatched(missing).then((fetched) => {
      if (cancelled || Object.keys(fetched).length === 0) return;
      mergeCatalogMap(fetched);
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- catalogMap letto per missing; key evita loop
  }, [paginatedBlueprintKey]);


  // 1) Verifica stato sync con il marketplace (una sola chiamata, prima di qualsiasi altra al sync service)
  useEffect(() => {
    if (!user?.id || !accessToken) {
      setSyncStatusLoading(false);
      return;
    }
    let cancelled = false;
    setSyncStatusLoading(true);
    syncClient
      .getSyncStatus(user.id, accessToken)
      .then((res) => {
        if (!cancelled) setSyncStatus(res);
      })
      .catch(() => {
        if (!cancelled) setSyncStatus(null);
      })
      .finally(() => {
        if (!cancelled) setSyncStatusLoading(false);
      });
    return () => { cancelled = true; };
  }, [user?.id, accessToken]);

  const refreshInventory = useCallback(async (): Promise<void> => {
    const result = await refetchInventory();
    if (!result.isError) setError(null);
  }, [refetchInventory]);

  useEffect(() => {
    if (inventoryLoadError) {
      setError(t('accountPage.itemsLoadError'));
    }
  }, [inventoryLoadError, t]);

  const handleSyncNow = useCallback(async () => {
    if (!user?.id || !accessToken || !syncStatus) return;
    if (isDisconnected) return;

    setSyncNowPending(true);
    setSyncBanner(null);

    const pollTaskUntilReady = async (taskId: string) => {
      const pollIntervalMs = 2500;
      const maxPolls = 240; // ~10 min
      let lastTask: Awaited<ReturnType<typeof syncClient.getTaskStatus>> | null = null;
      for (let polls = 0; polls < maxPolls; polls++) {
        lastTask = await syncClient.getTaskStatus(taskId, accessToken);
        if (lastTask.ready) break;
        await new Promise((r) => setTimeout(r, pollIntervalMs));
      }
      if (!lastTask?.ready) throw new Error(t('accountPage.syncErrTimeout'));
      return lastTask;
    };

    const applyTaskResult = async (
      task: Awaited<ReturnType<typeof syncClient.getTaskStatus>> | null
    ): Promise<void> => {
      const [nextStatus] = await Promise.all([
        syncClient.getSyncStatus(user.id, accessToken).catch(() => syncStatus),
      ]);
      setSyncStatus(nextStatus);
      await refreshInventory();

      if (!task) return;

      if (task.status === 'SUCCESS') {
        const r = (task.result ?? {}) as {
          processed?: number;
          total_products?: number;
          created?: number;
          updated?: number;
          skipped?: number;
        };
        const parts: string[] = [];
        if (typeof r.processed === 'number') {
          parts.push(
            `Processati ${r.processed}${typeof r.total_products === 'number' && r.total_products > 0 ? `/${r.total_products}` : ''}`
          );
        }
        if (
          typeof r.created === 'number' ||
          typeof r.updated === 'number' ||
          typeof r.skipped === 'number'
        ) {
          parts.push(`C:${r.created ?? 0} U:${r.updated ?? 0} S:${r.skipped ?? 0}`);
        }
        setSyncBanner({ type: 'success', message: parts.join(' · ') });
      } else {
        const msg =
          (typeof task.error === 'string' && task.error) ||
          task.message ||
          t('accountPage.syncErrFailed');
        setSyncBanner({ type: 'error', message: msg });
      }
    };

    const attachOrRecoverRunningSync = async () => {
      setSyncBanner({ type: 'info', message: 'Sincronizzazione già in corso: mi aggancio al task attivo…' });
      const progressRes = await syncClient.getSyncProgress(user.id, accessToken);
      const opId = progressRes.operation_id;
      if (opId) {
        const task = await pollTaskUntilReady(opId);
        await applyTaskResult(task);
        return;
      }

      // Stato incoerente: backend segnala sync in corso ma non espone operation_id.
      // Proviamo un avvio forzato per riallineare lo stato.
      const forced = await syncClient.startSync(user.id, accessToken, true);
      if (!forced?.task_id) throw new Error(t('accountPage.syncErrStart'));
      const forcedTask = await pollTaskUntilReady(forced.task_id);
      await applyTaskResult(forcedTask);
    };

    try {
      if (syncStatus.sync_status === 'initial_sync') {
        await attachOrRecoverRunningSync();
        return;
      }

      const startRes = await syncClient.startSync(user.id, accessToken);
      const taskId = startRes?.task_id;
      if (!taskId) throw new Error(t('accountPage.syncErrStart'));

      const lastTask = await pollTaskUntilReady(taskId);
      await applyTaskResult(lastTask);
    } catch (e) {
      const errStatus = (e as { status?: unknown })?.status;
      const errMsg = e instanceof Error ? e.message : (e as { message?: unknown })?.message;
      const isConflict =
        errStatus === 409 || (typeof errMsg === 'string' && errMsg.toLowerCase().includes('conflict'));

      if (isConflict) {
        try {
          await attachOrRecoverRunningSync();
        } catch (innerErr: unknown) {
          const innerMsg = innerErr instanceof Error ? innerErr.message : t('accountPage.syncErrFailed');
          setSyncBanner({ type: 'error', message: innerMsg });
        }
      } else {
        const msg = e instanceof Error ? e.message : t('accountPage.syncErrFailed');
        setSyncBanner({ type: 'error', message: msg });
      }
    } finally {
      setSyncNowPending(false);
    }
  }, [user?.id, accessToken, syncStatus, isDisconnected, refreshInventory, t]);

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

  const onDeleteSelected = useCallback(
    async (ids: number[]) => {
      if (!user?.id || !accessToken || ids.length === 0) return;
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
            await deleteInventoryOrListing(user.id, item, accessToken);
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
    [user?.id, accessToken, inventoryRaw, refreshInventory, t]
  );

  const handleBulkPriceApply = useCallback(
    async (
      ids: number[],
      operation: '+' | '-',
      percent: number,
      platform: 'ebartex' | 'all'
    ) => {
      if (!user?.id || !accessToken) return;
      const idSet = new Set(ids);
      const factor = operation === '+' ? 1 + percent / 100 : 1 - percent / 100;

      for (const item of inventoryRaw) {
        if (!idSet.has(item.id)) continue;
        const newPriceCents = Math.round((item.price_cents ?? 0) * factor);
        try {
          await updateInventoryOrListing(user.id, item, accessToken, {
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
    [user?.id, accessToken, inventoryRaw, refreshInventory, t]
  );

  const handleBulkDelete = useCallback(
    async (deleteFromPlatforms: boolean): Promise<void> => {
      if (!user?.id || !accessToken) return;
      const ids = Array.from(selectedIds);
      if (ids.length === 0) return;

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
            await deleteInventoryOrListing(user.id, item, accessToken);
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
    [user?.id, accessToken, selectedIds, inventoryRaw, refreshInventory, t]
  );

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(timer);
  }, [toast]);

  /** Export selezione in CSV. */
  const handleExportSelectionCSV = useCallback(() => {
    const selectedItems = filteredInventoryItems.filter(item => selectedIds.has(item.id));
    if (selectedItems.length === 0) return;
    
    const rows = selectedItems.map(itemToExportRow);
    const headers = Object.keys(rows[0] as object);
    const csvLines = [
      headers.map(escapeCsvCell).join(','),
      ...rows.map((r) => headers.map((h) => escapeCsvCell((r as Record<string, unknown>)[h])).join(',')),
    ];
    const csv = csvLines.join('\r\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' });
    const filename = `selezione-ebartex-${new Date().toISOString().slice(0, 10)}.csv`;
    downloadBlob(blob, filename);
  }, [filteredInventoryItems, selectedIds]);

  /** Export in CSV (tutto l'inventario filtrato). */
  const handleExportCSV = useCallback(() => {
    const rows = filteredInventoryItems.map(itemToExportRow);
    if (rows.length === 0) {
      return;
    }
    const headers = Object.keys(rows[0] as object);
    const csvLines = [
      headers.map(escapeCsvCell).join(','),
      ...rows.map((r) => headers.map((h) => escapeCsvCell((r as Record<string, unknown>)[h])).join(',')),
    ];
    const csv = csvLines.join('\r\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' });
    const filename = `collezione-ebartex-${new Date().toISOString().slice(0, 10)}.csv`;
    downloadBlob(blob, filename);
    setExportModalOpen(false);
  }, [filteredInventoryItems, setExportModalOpen]);

  /** Export in JSON (solo dati in memoria, nessuna chiamata API). */
  const handleExportJSON = useCallback(() => {
    const data = {
      exported_at: new Date().toISOString(),
      total_items: filteredInventoryItems.length,
      total_quantity: filteredInventoryItems.reduce((s, i) => s + (i.quantity ?? 0), 0),
      items: filteredInventoryItems.map(itemToExportRow),
    };
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json;charset=utf-8' });
    const filename = `collezione-ebartex-${new Date().toISOString().slice(0, 10)}.json`;
    downloadBlob(blob, filename);
    setExportModalOpen(false);
  }, [filteredInventoryItems]);

  if (!user || !accessToken) {
    return (
      <div className="text-gray-900">
      <div className="mt-8 flex justify-center">
          <div className="flex w-full max-w-3xl items-center justify-center rounded-xl border border-gray-200 bg-white p-10 shadow-sm">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-[#FF7300]" />
              <p className="text-sm text-gray-600">{t('accountPage.itemsLoading')}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const activeFilterCount = [
    filters.game !== 'all',
    filters.kind !== 'all',
    filters.conditions.length > 0,
    filters.languages.length > 0,
    filters.rarities.length > 0,
    filters.priceMin !== null || filters.priceMax !== null,
    filters.smartFilter !== 'all',
  ].filter(Boolean).length;

  return (
    <div className="flex w-full max-w-[100vw] flex-col gap-0 overflow-x-clip bg-[#F5F4F0] p-2 md:flex-row md:items-start md:gap-4 md:p-4 lg:gap-6 lg:p-6">
      <InventoryFiltersPanel
        filters={filters}
        onFiltersChange={setFilters}
        itemCount={filteredInventoryItems.length}
        totalCount={inventoryItems.length}
        syncStatus={syncAnyPending ? 'syncing' : syncEnabled ? 'active' : 'inactive'}
        facets={facets}
        disabled={loading}
        searchValue={searchValue}
        onSearchChange={setSearchValue}
        onClearSearch={clearSearch}
        mobileFiltersOpen={mobileFiltersOpen}
        onMobileFiltersOpenChange={setMobileFiltersOpen}
        inventoryItems={inventoryItems}
      />
      <main className="w-full min-w-0 max-w-full flex-1 overflow-x-clip p-0 md:p-6">
        <div className="mb-3 flex flex-col gap-2 md:mb-4 md:flex-row md:items-center md:gap-3">
          <InventorySearchBar
            value={searchValue}
            onChange={setSearchValue}
            onClear={clearSearch}
            disabled={loading}
            inputClassName="rounded-lg border-gray-200 bg-white py-1.5 pl-9 pr-9 text-sm shadow-none backdrop-blur-none md:py-2 md:text-sm"
            className="md:max-w-xs md:flex-1"
          />
          <div className="flex shrink-0 items-center gap-2 md:ml-auto">
            {!syncStatusLoading && (
              <button
                type="button"
                onClick={() => void handleSyncNow()}
                disabled={!integrationConnected || !canSyncNow || syncAnyPending}
                className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-primary px-2.5 text-xs font-medium text-white shadow-sm transition-all hover:bg-primary/90 active:scale-[0.98] disabled:opacity-50"
                aria-label="Sync"
              >
                {syncNowPending ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <RefreshCw className="h-3.5 w-3.5" />
                )}
                Sync
              </button>
            )}
            <button
              type="button"
              onClick={() => setExportModalOpen(true)}
              disabled={loading || filteredInventoryItems.length === 0}
              className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-2.5 text-xs font-medium text-gray-700 shadow-sm transition-all hover:bg-gray-50 active:scale-[0.98] disabled:opacity-50"
              aria-label={t('accountPage.itemsExport')}
            >
              <Download className="h-3.5 w-3.5" />
              {t('accountPage.itemsExport')}
            </button>
          </div>
        </div>

        <nav
          className="mb-3 hidden items-center gap-1.5 px-0.5 text-sm text-gray-500 md:mb-5 md:flex"
          aria-label="Breadcrumb"
        >
          <Link href="/account" className="transition-colors hover:text-gray-900">
            Account
          </Link>
          <span className="text-gray-300">/</span>
          <span className="font-medium text-gray-900">{t('accountPage.itemsTitle')}</span>
        </nav>

        {syncBanner && (
          <div
            className={`mb-4 flex items-center justify-between gap-3 rounded-xl border px-4 py-3 text-sm font-medium ${
              syncBanner.type === 'success'
                ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                : syncBanner.type === 'error'
                  ? 'border-red-200 bg-red-50 text-red-700'
                  : 'border-sky-200 bg-sky-50 text-sky-700'
            }`}
          >
            <span>
              {syncBanner.message ||
                (syncBanner.type === 'success' ? 'Sincronizzazione completata' : '')}
            </span>
            <button
              type="button"
              onClick={() => setSyncBanner(null)}
              className="rounded p-1 opacity-60 transition-opacity hover:opacity-100"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        <div className="mb-3 flex items-center gap-2 md:mb-4">
          <InventoryMobileQuickBar
            filters={filters}
            onFiltersChange={setFilters}
            facets={facets}
            itemCount={filteredInventoryItems.length}
            activeFilterCount={activeFilterCount}
            onOpenFilters={() => setMobileFiltersOpen(true)}
            disabled={loading}
            className="min-w-0 flex-1"
          />
          <div className="hidden shrink-0 items-center rounded-lg bg-gray-100 p-1 md:flex">
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`inline-flex h-7 w-7 items-center justify-center rounded-md text-sm font-medium transition-all duration-150 ${
                viewMode === 'table' ? 'bg-white text-primary shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
              aria-label="Tabella"
              title="Tabella"
            >
              <List className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('cards')}
              className={`inline-flex h-7 w-7 items-center justify-center rounded-md text-sm font-medium transition-all duration-150 ${
                viewMode === 'cards' ? 'bg-white text-primary shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
              aria-label="Griglia"
              title="Griglia"
            >
              <Grid3X3 className="h-4 w-4" />
            </button>
          </div>
        </div>

      {error && (
        <div className="mb-6 border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <div className="border border-gray-200 bg-white shadow-sm">
          <div className="flex items-center justify-center gap-3 p-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="text-gray-600">
              {t('accountPage.itemsLoadingInventory')}
            </span>
          </div>
        </div>
      ) : inventoryRaw.length === 0 ? (
        <div className="border border-gray-200 bg-white p-10 shadow-sm">
          <p className="text-center text-gray-600">
            {t('accountPage.itemsEmptyLine1')}
            <Link href="/account/sincronizzazione" className="font-medium text-primary hover:underline">
              {t('breadcrumb.sincronizzazione')}
            </Link>
            {t('accountPage.itemsEmptyLine2')}
          </p>
        </div>
      ) : filteredInventoryItems.length === 0 ? (
        <div className="border border-gray-200 bg-white p-10 shadow-sm">
          <p className="text-center text-gray-600">
            {t('accountPage.itemsNoResults', { query: filters.search })}{' '}
            <button
              type="button"
              onClick={() => setFilters((prev) => ({ ...prev, search: '' }))}
              className="font-medium text-primary hover:underline"
            >
              {t('accountPage.itemsClearSearch')}
            </button>
            .
          </p>
        </div>
      ) : (
        <>
          {filteredInventoryItems.length > 0 && (
            <div className="mb-4 hidden overflow-hidden rounded-2xl border border-stroke-grey bg-white shadow-[0_2px_12px_rgba(0,0,0,0.06)] md:mb-5 md:block">
              <div className="flex flex-col gap-3 px-3 py-3 md:flex-row md:flex-wrap md:items-center md:justify-between md:px-4">
                {/* Counter */}
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100">
                      <CheckSquare className="h-4 w-4 text-gray-500" />
                    </span>
                    <div className="flex flex-col">
                      <span className="text-xs text-gray-500">{t('accountPage.itemsSelected')}</span>
                      <span className="text-sm font-bold text-gray-900">
                        {selectedIds.size}{' '}
                        <span className="text-xs font-normal text-gray-400">/ {filteredInventoryItems.length}</span>
                      </span>
                    </div>
                  </div>
                  <div className="h-8 w-px bg-gray-200" />
                  <div className="flex flex-wrap gap-1.5 max-md:w-full">
                    <button
                      type="button"
                      onClick={onSelectAll}
                      className="inline-flex min-h-[44px] flex-1 items-center justify-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-600 transition-all hover:border-primary hover:text-primary active:scale-[0.98] md:min-h-0 md:flex-none md:rounded-lg md:py-1.5"
                    >
                      {t('accountPage.itemsSelectAll')} ({filteredInventoryItems.length})
                    </button>
                    <button
                      type="button"
                      onClick={onDeselectAll}
                      disabled={selectedIds.size === 0}
                      className="inline-flex min-h-[44px] flex-1 items-center justify-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-600 transition-all hover:border-red-400 hover:text-red-500 active:scale-[0.98] disabled:opacity-40 md:min-h-0 md:flex-none md:rounded-lg md:py-1.5"
                    >
                      {t('accountPage.itemsSelectNone')}
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsBulkPriceOpen(true)}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-primary/30 bg-primary/5 px-3 py-1.5 text-xs font-medium text-primary transition-all hover:bg-primary/10"
                    >
                      <TrendingUp className="h-3.5 w-3.5" />
                      {t('accountPage.itemsModifyPrices')}
                    </button>
                    {selectedIds.size > 0 && (
                      <button
                        type="button"
                        onClick={() => setIsBulkDeleteOpen(true)}
                        disabled={bulkDeleting}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-medium text-red-600 transition-all hover:border-red-300 hover:bg-red-100 disabled:opacity-50"
                      >
                        {bulkDeleting ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Trash2 className="h-3.5 w-3.5" />
                        )}
                        {t('accountPage.itemsDeleteSelected')} ({selectedIds.size})
                      </button>
                    )}
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {bulkDeleteProgress && (
                    <span className="text-xs text-gray-500">
                      {t('accountPage.itemsBulkDeleteProgress', {
                        current: bulkDeleteProgress.current,
                        total: bulkDeleteProgress.total,
                      })}
                    </span>
                  )}
                  {selectedIds.size > 0 && (
                    <button
                      type="button"
                      onClick={handleExportSelectionCSV}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-600 transition-all hover:border-emerald-400 hover:text-emerald-600"
                    >
                      <Download className="h-3.5 w-3.5" />
                      {t('accountPage.itemsExport')} ({selectedIds.size})
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
          <OggettiTable
            items={paginatedItems}
            buildImageUrl={buildImageUrl}
            defaultImage={DEFAULT_IMAGE}
            userId={user.id}
            accessToken={accessToken}
            onRefresh={refreshInventory}
            onSyncResult={(result) => {
              setSyncPending(false);
              setSyncBanner(
                result.success
                  ? { type: 'success', message: '' }
                  : { type: 'error', message: result.message ?? '' }
              );
            }}
            onSyncPending={() => setSyncPending(true)}
            syncEnabled={syncEnabled}
            mutationsDisabled={syncAnyPending}
            selectedIds={selectedIds}
            onToggleSelect={onToggleSelect}
            onSelectAll={onSelectAll}
            onDeselectAll={onDeselectAll}
            allFilteredSelected={allFilteredSelected}
            onDeleteSelected={(ids) => onDeleteSelected(ids)}
            bulkDeleting={bulkDeleting}
            viewMode={viewMode}
            isMobile={isMobile}
            t={t}
          />
          {filteredInventoryItems.length > 0 && (
            <div className={`mt-3 flex flex-col gap-2 rounded-xl bg-white p-2.5 shadow-[0_2px_8px_rgba(0,0,0,0.06)] md:mt-6 md:gap-3 md:p-3 md:flex-row md:flex-wrap md:items-center md:justify-between md:gap-4 ${selectedIds.size > 0 ? 'max-md:mb-20' : ''}`}>
              <div className="flex flex-wrap items-center gap-3 text-sm">
                <span className="text-gray-500">
                  {t('accountPage.itemsPage')} <span className="font-semibold text-gray-900">{currentPage}</span> {t('accountPage.itemsOf')}{' '}
                  <span className="font-semibold text-gray-900">{totalPages.toLocaleString()}</span>
                </span>
                <span className="text-gray-300">·</span>
                <span className="text-xs text-gray-400">
                  {INVENTORY_ITEMS_PER_PAGE} {t('accountPage.itemsPerPage')}
                </span>
                <span className="text-gray-300">·</span>
                <span className="text-xs text-gray-500 tabular-nums">
                  {(filteredInventoryItems.length === 0
                    ? 0
                    : (currentPage - 1) * INVENTORY_ITEMS_PER_PAGE + 1
                  ).toLocaleString('it-IT')}
                  –
                  {Math.min(currentPage * INVENTORY_ITEMS_PER_PAGE, filteredInventoryItems.length).toLocaleString('it-IT')}{' '}
                  {t('accountPage.itemsOf')}{' '}
                  {filteredInventoryItems.length.toLocaleString('it-IT')}
                </span>
                {catalogLoading && (
                  <>
                    <span className="text-gray-300">·</span>
                    <span className="inline-flex items-center gap-1 text-xs text-gray-400">
                      <Loader2 className="h-3 w-3 animate-spin" aria-hidden />
                      Catalogo…
                    </span>
                  </>
                )}
              </div>
              <div className="flex items-center justify-center gap-1 md:justify-end">
                <button
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage <= 1 || totalPages <= 1}
                  className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-600 shadow-sm transition-all hover:bg-gray-50 hover:text-gray-900 active:scale-95 disabled:pointer-events-none disabled:opacity-40 md:h-9 md:w-9 md:rounded-lg"
                  aria-label={t('accountPage.itemsPrevPage')}
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <div className={`flex items-center gap-1 px-1 ${totalPages <= 1 ? 'opacity-50 pointer-events-none' : ''}`}>
                  {Array.from({ length: Math.min(7, totalPages) }, (_, i) => {
                    let pageNum: number;
                    if (totalPages <= 7) pageNum = i + 1;
                    else if (currentPage <= 4) pageNum = i + 1;
                    else if (currentPage >= totalPages - 3) pageNum = totalPages - 6 + i;
                    else pageNum = currentPage - 3 + i;
                    return (
                      <button
                        key={pageNum}
                        type="button"
                        onClick={() => setCurrentPage(pageNum)}
                        className={`inline-flex h-11 min-w-[2.75rem] items-center justify-center rounded-xl text-sm font-medium transition-all md:h-9 md:min-w-[2.25rem] md:rounded-lg ${
                          currentPage === pageNum
                            ? 'bg-primary text-white shadow-sm shadow-primary/20'
                            : 'border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                        }`}
                        aria-label={`Pagina ${pageNum}`}
                        aria-current={currentPage === pageNum ? 'page' : undefined}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>
                <button
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage >= totalPages || totalPages <= 1}
                  className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-600 shadow-sm transition-all hover:bg-gray-50 hover:text-gray-900 active:scale-95 disabled:pointer-events-none disabled:opacity-40 md:h-9 md:w-9 md:rounded-lg"
                  aria-label={t('accountPage.itemsNextPage')}
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </>
      )}

      </main>

      {showFloatingBar && (
        <div className="animate-slide-up-bounce fixed bottom-0 left-0 right-0 z-40 overflow-x-clip border-t border-gray-200 bg-white/95 backdrop-blur-md">
          <div className="mx-auto flex max-w-screen-xl flex-col gap-2 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 md:flex-row md:items-center md:gap-3 md:px-6">
            <InventorySearchBar
              value={searchValue}
              onChange={setSearchValue}
              onClear={clearSearch}
              disabled={loading}
              inputClassName="rounded-lg border-gray-200 bg-white py-1.5 pl-9 pr-9 text-sm shadow-none backdrop-blur-none md:py-2 md:text-sm"
              className="md:max-w-xs md:flex-1"
            />
            <InventoryMobileQuickBar
              filters={filters}
              onFiltersChange={setFilters}
              facets={facets}
              itemCount={filteredInventoryItems.length}
              activeFilterCount={activeFilterCount}
              onOpenFilters={() => setMobileFiltersOpen(true)}
              disabled={loading}
            />
            <div className="flex shrink-0 items-center gap-2 md:ml-auto">
              {!syncStatusLoading && (
                <button
                  type="button"
                  onClick={() => void handleSyncNow()}
                  disabled={!integrationConnected || !canSyncNow || syncAnyPending}
                  className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-primary px-2.5 text-xs font-medium text-white shadow-sm transition-all hover:bg-primary/90 active:scale-[0.98] disabled:opacity-50"
                >
                  {syncNowPending ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <RefreshCw className="h-3.5 w-3.5" />
                  )}
                  Sync
                </button>
              )}
              <button
                type="button"
                onClick={() => setExportModalOpen(true)}
                disabled={loading || filteredInventoryItems.length === 0}
                className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-2.5 text-xs font-medium text-gray-700 shadow-sm transition-all hover:bg-gray-50 active:scale-[0.98] disabled:opacity-50"
              >
                <Download className="h-3.5 w-3.5" />
                {t('accountPage.itemsExport')}
              </button>
            </div>
          </div>
        </div>
      )}

      <BulkPriceWizardModal
        isOpen={isBulkPriceOpen}
        onClose={() => setIsBulkPriceOpen(false)}
        filteredInventoryItems={filteredInventoryItems}
        onApply={handleBulkPriceApply}
      />
      <BulkDeleteModal
        isOpen={isBulkDeleteOpen}
        onClose={() => setIsBulkDeleteOpen(false)}
        selectedItems={inventoryItems.filter((item) => selectedIds.has(item.id))}
        syncStatus={syncAnyPending ? 'syncing' : syncEnabled ? 'active' : 'inactive'}
        deleteProgress={bulkDeleteProgress}
        onConfirm={handleBulkDelete}
      />

      {/* Sticky action bar */}
      {selectedIds.size > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-gray-200/80 bg-white/90 px-4 py-3 shadow-2xl backdrop-blur-xl pb-[max(0.75rem,env(safe-area-inset-bottom))] md:px-6 md:py-4">
          <div className="mx-auto flex max-w-screen-xl flex-col gap-3 md:flex-row md:items-center md:justify-between md:gap-4">
            {/* Left */}
            <div className="flex items-center gap-3">
              <span className="text-sm font-bold text-gray-900">
                {t('accountPage.itemsSelectedCount', { count: selectedIds.size })}
              </span>
              <button
                type="button"
                onClick={onDeselectAll}
                className="text-sm text-gray-400 transition-colors hover:text-gray-700"
              >
                {t('accountPage.itemsDeselectAll')}
              </button>
            </div>
            {bulkDeleteProgress && (
              <span className="text-xs text-gray-500">
                {t('accountPage.itemsBulkDeleteProgress', {
                  current: bulkDeleteProgress.current,
                  total: bulkDeleteProgress.total,
                })}
              </span>
            )}
            <div className="flex flex-col gap-2 sm:flex-row md:contents">
            <button
              type="button"
              onClick={() => setIsBulkPriceOpen(true)}
              className="inline-flex min-h-[48px] flex-1 items-center justify-center gap-2 rounded-2xl bg-primary px-5 py-3 text-sm font-bold text-white shadow-sm shadow-primary/20 transition-all hover:bg-primary/90 hover:shadow-md active:scale-[0.98] md:min-h-0 md:flex-none md:rounded-xl md:py-2.5"
            >
              <TrendingUp className="h-4 w-4" />
              {t('accountPage.itemsModifyPrices')}
            </button>
            <button
              type="button"
              onClick={() => setIsBulkDeleteOpen(true)}
              disabled={bulkDeleting}
              className="inline-flex min-h-[48px] flex-1 items-center justify-center gap-2 rounded-2xl border border-red-300 bg-white px-5 py-3 text-sm font-bold text-red-500 transition-all hover:border-red-400 hover:bg-red-50 active:scale-[0.98] disabled:opacity-50 md:min-h-0 md:flex-none md:rounded-xl md:py-2.5"
            >
              {bulkDeleting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
              {t('accountPage.itemsDeleteSelected')}
            </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast notification */}
      {toast && (
        <div className="fixed right-5 top-5 z-[60] flex items-center gap-3 rounded-xl border border-emerald-200 bg-white px-4 py-3 shadow-lg transition-all duration-300">
          <span
            className={`h-2 w-2 shrink-0 rounded-full ${toast.type === 'success' ? 'bg-emerald-500' : 'bg-red-500'}`}
          />
          <span className="text-sm font-medium text-gray-800">{toast.message}</span>
          <button
            type="button"
            onClick={() => setToast(null)}
            className="ml-1 rounded-full p-0.5 text-gray-400 transition-colors hover:text-gray-600"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}
      {exportModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm transition-opacity duration-200"
          role="dialog"
          aria-modal="true"
          aria-labelledby="export-modal-title"
          onClick={() => setExportModalOpen(false)}
        >
          <div
            className="relative w-full max-w-md overflow-hidden rounded-2xl border border-white/20 bg-white/95 p-6 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.3)] backdrop-blur-xl animate-in fade-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="mb-6 flex items-start justify-between">
              <div>
                <div className="mb-2 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500/20 to-emerald-500/5 text-emerald-600">
                  <Download className="h-5 w-5" />
                </div>
                <h2 id="export-modal-title" className="text-lg font-bold text-gray-900">
                  {t('accountPage.itemsExport')}
                </h2>
                <p className="text-sm text-gray-500">
                  {filteredInventoryItems.length.toLocaleString()} {t('accountPage.itemsItemsInView')}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setExportModalOpen(false)}
                className="rounded-lg p-2 text-gray-400 transition-all hover:bg-gray-100 hover:text-gray-600"
                aria-label={t('accountPage.itemsClose')}
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Options */}
            <div className="mb-6 grid gap-3">
              <button
                type="button"
                onClick={handleExportCSV}
                className="group flex items-center gap-4 rounded-xl border border-gray-200 bg-white p-4 text-left shadow-sm transition-all hover:border-emerald-300 hover:shadow-md"
              >
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 transition-colors group-hover:bg-emerald-100">
                  <FileSpreadsheet className="h-6 w-6" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-gray-900">{t('accountPage.itemsExportCSV')}</p>
                  <p className="text-xs text-gray-500">{t('accountPage.itemsExportCSVDesc')}</p>
                </div>
                <ChevronRight className="h-5 w-5 text-gray-400" />
              </button>
              <button
                type="button"
                onClick={handleExportJSON}
                className="group flex items-center gap-4 rounded-xl border border-gray-200 bg-white p-4 text-left shadow-sm transition-all hover:border-amber-300 hover:shadow-md"
              >
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600 transition-colors group-hover:bg-amber-100">
                  <FileJson className="h-6 w-6" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-gray-900">{t('accountPage.itemsExportJSON')}</p>
                  <p className="text-xs text-gray-500">{t('accountPage.itemsExportJSONDesc')}</p>
                </div>
                <ChevronRight className="h-5 w-5 text-gray-400" />
              </button>
            </div>

            <p className="text-xs text-center text-gray-400">
              {t('accountPage.itemsExportHint')}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
