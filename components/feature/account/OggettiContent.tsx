'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { ViewToggle } from '@/components/shared/ViewToggle';
import Link from 'next/link';
import {
  Download,
  Grid3X3,
  List,
  Loader2,
  RefreshCw,
  SlidersHorizontal,
  X,
} from 'lucide-react';
import { useAuthStore } from '@/lib/stores/auth-store';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { useAccountInventory } from '@/lib/hooks/use-account-inventory';
import { useInventorySync } from '@/hooks/account/useInventorySync';
import { useInventorySelection } from '@/hooks/account/useInventorySelection';
import { useInventoryExport } from '@/hooks/account/useInventoryExport';
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
import { OggettiSyncBanner } from '@/components/feature/account/oggetti/OggettiSyncBanner';
import { OggettiSelectionBar } from '@/components/feature/account/oggetti/OggettiSelectionBar';
import { OggettiPagination } from '@/components/feature/account/oggetti/OggettiPagination';
import { OggettiStickyActionBar } from '@/components/feature/account/oggetti/OggettiStickyActionBar';
import { OggettiExportModal } from '@/components/feature/account/oggetti/OggettiExportModal';
import {
  buildImageUrl,
  DEFAULT_IMAGE,
} from '@/lib/inventory/inventory-export-utils';

/** Righe massime renderizzate per pagina (performance UI). */
const INVENTORY_ITEMS_PER_PAGE = 50;

export function OggettiContent() {
  const { t } = useTranslation();
  const isMobile = useMobileViewport();
  const user = useAuthStore((s) => s.user);
  const accessToken = useAuthStore((s) => s.accessToken);

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
  const [filters, setFilters] = useState<InventoryFilters>(DEFAULT_FILTERS);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [viewMode, setViewMode] = useState<OggettiViewMode>('table');
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [showFloatingBar, setShowFloatingBar] = useState(false);
  const { searchValue, setSearchValue, clearSearch } = useInventorySearchInput(filters, setFilters);


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



  const refreshInventory = useCallback(async (): Promise<void> => {
    const result = await refetchInventory();
    if (!result.isError) setError(null);
  }, [refetchInventory]);

  const {
    syncStatus,
    syncStatusLoading,
    syncBanner,
    setSyncBanner,
    setSyncPending,
    syncNowPending,
    syncEnabled,
    integrationConnected,
    syncAnyPending,
    canSyncNow,
    handleSyncNow,
  } = useInventorySync({ userId: user?.id, accessToken, refreshInventory, t });

  const {
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
  } = useInventorySelection({
    userId: user?.id,
    accessToken,
    inventoryRaw,
    filteredInventoryItems,
    selectedIds,
    setSelectedIds,
    refreshInventory,
    t,
    setError,
    setToast,
  });

  const {
    exportModalOpen,
    setExportModalOpen,
    handleExportSelectionCSV,
    handleExportCSV,
    handleExportJSON,
  } = useInventoryExport({ filteredInventoryItems, selectedIds });

  useEffect(() => {
    if (inventoryLoadError) {
      setError(t('accountPage.itemsLoadError'));
    }
  }, [inventoryLoadError, t]);



  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(timer);
  }, [toast]);


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
        {/* Intestazione pagina: breadcrumb + titolo + conteggio (gerarchia chiara). */}
        <div className="mb-3 md:mb-5">
          <nav
            className="mb-2 hidden items-center gap-1.5 px-0.5 text-sm text-gray-500 md:flex"
            aria-label={t('accountPage.breadcrumbNav')}
          >
            <Link href="/account" className="transition-colors hover:text-gray-900">
              {t('breadcrumb.account')}
            </Link>
            <span className="text-gray-300">/</span>
            <span className="font-medium text-gray-900">{t('accountPage.itemsTitle')}</span>
          </nav>
          <div className="flex items-end justify-between gap-3 px-0.5">
            <h1 className="text-xl font-bold tracking-tight text-gray-900 sm:text-2xl">
              {t('accountPage.itemsTitle')}
            </h1>
            {!loading && inventoryRaw.length > 0 && (
              <span className="shrink-0 pb-0.5 text-sm font-semibold tabular-nums text-gray-500">
                {filteredInventoryItems.length}
                <span className="font-normal text-gray-400">/{inventoryItems.length}</span>
              </span>
            )}
          </div>
        </div>

        {/* Barra ricerca + azioni in un unico container */}
        <div className="mb-3 md:mb-4">
          <div className="flex items-center gap-1.5 rounded-2xl border border-gray-200 bg-white p-1.5 shadow-sm md:gap-2">
            <div className="min-w-0 flex-1">
              <InventorySearchBar
                value={searchValue}
                onChange={setSearchValue}
                onClear={clearSearch}
                disabled={loading}
                inputClassName="rounded-xl border-0 bg-gray-50 py-2 pl-9 pr-9 text-sm shadow-none backdrop-blur-none md:rounded-lg md:py-2.5"
                className="w-full"
              />
            </div>

            <div className="hidden h-6 w-px bg-gray-200 md:block" />

            <div className="flex shrink-0 items-center gap-1 md:gap-1.5">
              <button
                type="button"
                onClick={() => setMobileFiltersOpen(true)}
                disabled={loading}
                className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-2.5 text-xs font-semibold text-gray-800 shadow-sm transition-all hover:bg-gray-50 active:scale-[0.98] disabled:opacity-50 md:h-9 md:px-3"
                aria-label={t('accountPage.itemsFiltersPanelTitle')}
              >
                <SlidersHorizontal className="h-3.5 w-3.5 shrink-0 text-gray-500" />
                <span>{t('accountPage.itemsFiltersPanelTitle')}</span>
                {activeFilterCount > 0 && (
                  <span className="rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-bold text-white leading-none">
                    {activeFilterCount}
                  </span>
                )}
              </button>

              {!syncStatusLoading && (
                <button
                  type="button"
                  onClick={() => void handleSyncNow()}
                  disabled={!integrationConnected || !canSyncNow || syncAnyPending}
                  className="inline-flex h-8 items-center gap-1 rounded-lg bg-primary px-2 text-xs font-medium text-white shadow-sm transition-all hover:bg-primary/90 active:scale-[0.98] disabled:opacity-50 md:h-9 md:px-2.5"
                  aria-label={t('accountPage.itemsSyncNow')}
                >
                  {syncNowPending ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <RefreshCw className="h-3.5 w-3.5" />
                  )}
                  <span className="hidden sm:inline">{t('accountPage.itemsSyncNow')}</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => setExportModalOpen(true)}
                disabled={loading || filteredInventoryItems.length === 0}
                className="inline-flex h-8 items-center gap-1 rounded-lg border border-gray-200 bg-white px-2 text-xs font-medium text-gray-700 shadow-sm transition-all hover:bg-gray-50 active:scale-[0.98] disabled:opacity-50 md:h-9 md:px-2.5"
                aria-label={t('accountPage.itemsExport')}
              >
                <Download className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">{t('accountPage.itemsExport')}</span>
              </button>

              <ViewToggle
                className="hidden md:flex"
                current={viewMode}
                onChange={setViewMode}
                listValue="table"
                gridValue="cards"
                listLabel={t('accountPage.itemsViewTable')}
                gridLabel={t('accountPage.itemsViewGrid')}
              />
            </div>
          </div>

          <div className="mt-2 flex items-center gap-2 md:mt-3">
            <InventoryMobileQuickBar
              filters={filters}
              onFiltersChange={setFilters}
              facets={facets}
              itemCount={filteredInventoryItems.length}
              activeFilterCount={activeFilterCount}
              onOpenFilters={() => setMobileFiltersOpen(true)}
              disabled={loading}
              className="min-w-0 flex-1"
              showFilterButton={false}
            />
          </div>
        </div>

        {syncBanner && (
          <OggettiSyncBanner banner={syncBanner} onClose={() => setSyncBanner(null)} />
        )}

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
            <OggettiSelectionBar
              selectedCount={selectedIds.size}
              filteredCount={filteredInventoryItems.length}
              bulkDeleting={bulkDeleting}
              bulkDeleteProgress={bulkDeleteProgress}
              t={t}
              onSelectAll={onSelectAll}
              onDeselectAll={onDeselectAll}
              onBulkPrice={() => setIsBulkPriceOpen(true)}
              onBulkDelete={() => setIsBulkDeleteOpen(true)}
              onExportSelection={handleExportSelectionCSV}
            />
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
            <OggettiPagination
              currentPage={currentPage}
              totalPages={totalPages}
              itemsPerPage={INVENTORY_ITEMS_PER_PAGE}
              totalFiltered={filteredInventoryItems.length}
              catalogLoading={catalogLoading}
              hasSelection={selectedIds.size > 0}
              t={t}
              onPageChange={setCurrentPage}
            />
          )}
        </>
      )}

      </main>

      {showFloatingBar && (
        <div className="animate-slide-up-bounce fixed bottom-0 left-0 right-0 z-40 overflow-x-clip border-t border-gray-200 bg-white/95 backdrop-blur-md md:left-[312px] lg:left-[328px]">
          <div className="mx-auto flex max-w-screen-xl flex-col gap-2 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 md:gap-3 md:px-6">
            <div className="flex items-center gap-1.5 rounded-2xl border border-gray-200 bg-white p-1.5 shadow-sm md:gap-2">
              <div className="min-w-0 flex-1">
                <InventorySearchBar
                  value={searchValue}
                  onChange={setSearchValue}
                  onClear={clearSearch}
                  disabled={loading}
                  inputClassName="rounded-xl border-0 bg-gray-50 py-2 pl-9 pr-9 text-sm shadow-none backdrop-blur-none md:rounded-lg md:py-2.5"
                  className="w-full"
                />
              </div>

              <div className="hidden h-6 w-px bg-gray-200 md:block" />

              <div className="flex shrink-0 items-center gap-1 md:gap-1.5">
                <button
                  type="button"
                  onClick={() => setMobileFiltersOpen(true)}
                  disabled={loading}
                  className="inline-flex h-8 items-center gap-1 rounded-lg border border-gray-200 bg-white px-2 text-xs font-medium text-gray-700 shadow-sm transition-all hover:bg-gray-50 active:scale-[0.98] disabled:opacity-50 md:h-9 md:px-2.5"
                  aria-label={t('accountPage.itemsFiltersPanelTitle')}
                >
                  <SlidersHorizontal className="h-3.5 w-3.5 shrink-0 text-gray-500" />
                  <span className="hidden sm:inline">{t('accountPage.itemsFiltersPanelTitle')}</span>
                  {activeFilterCount > 0 && (
                    <span className="rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-bold text-white leading-none">
                      {activeFilterCount}
                    </span>
                  )}
                </button>

                {!syncStatusLoading && (
                  <button
                    type="button"
                    onClick={() => void handleSyncNow()}
                    disabled={!integrationConnected || !canSyncNow || syncAnyPending}
                    className="inline-flex h-8 items-center gap-1 rounded-lg bg-primary px-2 text-xs font-medium text-white shadow-sm transition-all hover:bg-primary/90 active:scale-[0.98] disabled:opacity-50 md:h-9 md:px-2.5"
                    aria-label={t('accountPage.itemsSyncNow')}
                  >
                    {syncNowPending ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <RefreshCw className="h-3.5 w-3.5" />
                    )}
                    <span className="hidden sm:inline">{t('accountPage.itemsSyncNow')}</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setExportModalOpen(true)}
                  disabled={loading || filteredInventoryItems.length === 0}
                  className="inline-flex h-8 items-center gap-1 rounded-lg border border-gray-200 bg-white px-2 text-xs font-medium text-gray-700 shadow-sm transition-all hover:bg-gray-50 active:scale-[0.98] disabled:opacity-50 md:h-9 md:px-2.5"
                  aria-label={t('accountPage.itemsExport')}
                >
                  <Download className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">{t('accountPage.itemsExport')}</span>
                </button>

                <ViewToggle
                  className="hidden md:flex"
                  current={viewMode}
                  onChange={setViewMode}
                  listValue="table"
                  gridValue="cards"
                  listLabel="Tabella"
                  gridLabel="Griglia"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <InventoryMobileQuickBar
                filters={filters}
                onFiltersChange={setFilters}
                facets={facets}
                itemCount={filteredInventoryItems.length}
                activeFilterCount={activeFilterCount}
                onOpenFilters={() => setMobileFiltersOpen(true)}
                disabled={loading}
                className="min-w-0 flex-1"
                showFilterButton={false}
              />
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

      {selectedIds.size > 0 && (
        <OggettiStickyActionBar
          selectedCount={selectedIds.size}
          bulkDeleteProgress={bulkDeleteProgress}
          bulkDeleting={bulkDeleting}
          t={t}
          onDeselectAll={onDeselectAll}
          onBulkPrice={() => setIsBulkPriceOpen(true)}
          onBulkDelete={() => setIsBulkDeleteOpen(true)}
        />
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
        <OggettiExportModal
          itemCount={filteredInventoryItems.length}
          t={t}
          onClose={() => setExportModalOpen(false)}
          onExportCSV={handleExportCSV}
          onExportJSON={handleExportJSON}
        />
      )}
    </div>
  );
}
