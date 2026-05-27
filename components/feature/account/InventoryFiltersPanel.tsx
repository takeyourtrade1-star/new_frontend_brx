'use client';

import { useState, useCallback, useEffect, type CSSProperties } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, SlidersHorizontal, X } from 'lucide-react';
import { ConditionBadge } from '@/components/ui/ConditionBadge';
import type { ConditionCode } from '@/components/ui/ConditionBadge';
import { CardLanguageFlag } from '@/components/ui/CardLanguageFlag';
import { InventorySearchBar } from '@/components/feature/account/InventorySearchBar';
import { useHeaderStickyOffset } from '@/lib/hooks/useHeaderStickyOffset';
import { useTranslation } from '@/lib/i18n/useTranslation';
import type { InventoryFacets } from '@/lib/inventory/inventory-filter-utils';

export interface InventoryFilters {
  search: string;
  game: string;
  kind: 'all' | 'singole' | 'oggetti';
  conditions: ConditionCode[];
  languages: string[];
  rarities: string[];
  priceMin: number | null;
  priceMax: number | null;
  smartFilter: 'all' | 'duplicates';
  sortBy:
    | 'price-desc'
    | 'price-asc'
    | 'condition-desc'
    | 'condition-asc'
    | 'name-asc'
    | 'name-desc'
    | 'date-desc';
}

export const DEFAULT_FILTERS: InventoryFilters = {
  search: '',
  game: 'all',
  kind: 'all',
  conditions: [],
  languages: [],
  rarities: [],
  priceMin: null,
  priceMax: null,
  smartFilter: 'all',
  sortBy: 'date-desc',
};

export interface InventoryFiltersPanelProps {
  filters: InventoryFilters;
  onFiltersChange: (filters: InventoryFilters) => void;
  itemCount: number;
  totalCount: number;
  syncStatus: 'active' | 'inactive' | 'syncing';
  facets: InventoryFacets;
  disabled?: boolean;
  searchValue: string;
  onSearchChange: (value: string) => void;
  onClearSearch: () => void;
  mobileFiltersOpen?: boolean;
  onMobileFiltersOpenChange?: (open: boolean) => void;
}

function countActiveFilters(f: InventoryFilters): number {
  return [
    f.search.trim().length > 0,
    f.game !== 'all',
    f.kind !== 'all',
    f.conditions.length > 0,
    f.languages.length > 0,
    f.rarities.length > 0,
    f.priceMin !== null || f.priceMax !== null,
    f.smartFilter !== 'all',
  ].filter(Boolean).length;
}

function SectionHeader({
  label,
  expanded,
  onToggle,
}: {
  label: string;
  expanded: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="flex w-full items-center justify-between py-2 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-400 transition-colors hover:text-gray-700"
    >
      {label}
      <ChevronRight
        className={`h-3.5 w-3.5 shrink-0 transition-transform duration-200 ${expanded ? 'rotate-90' : ''}`}
      />
    </button>
  );
}

export function InventoryFiltersPanel({
  filters,
  onFiltersChange,
  itemCount,
  totalCount,
  syncStatus,
  facets,
  disabled = false,
  searchValue,
  onSearchChange,
  onClearSearch,
  mobileFiltersOpen,
  onMobileFiltersOpenChange,
}: InventoryFiltersPanelProps) {
  const { t } = useTranslation();
  const { stickyTopWithGap } = useHeaderStickyOffset();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpenInternal, setMobileOpenInternal] = useState(false);
  const mobileOpen = mobileFiltersOpen ?? mobileOpenInternal;
  const setMobileOpen = onMobileFiltersOpenChange ?? setMobileOpenInternal;
  const [sections, setSections] = useState({
    tipo: true,
    conditions: true,
    languages: false,
    rarities: false,
    price: false,
    game: false,
    smart: false,
  });

  useEffect(() => {
    if (!mobileOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [mobileOpen]);

  const toggleSection = useCallback((key: keyof typeof sections) => {
    setSections((prev) => ({ ...prev, [key]: !prev[key] }));
  }, []);

  const update = useCallback(
    <K extends keyof InventoryFilters>(key: K, value: InventoryFilters[K]) => {
      onFiltersChange({ ...filters, [key]: value });
    },
    [filters, onFiltersChange]
  );

  const toggleMulti = useCallback(
    <K extends 'conditions' | 'languages' | 'rarities'>(
      key: K,
      value: string
    ) => {
      const current = filters[key] as string[];
      const next = current.includes(value)
        ? current.filter((v) => v !== value)
        : [...current, value];
      onFiltersChange({ ...filters, [key]: next as InventoryFilters[K] });
    },
    [filters, onFiltersChange]
  );

  const clearAll = useCallback(() => {
    onClearSearch();
    onFiltersChange(DEFAULT_FILTERS);
  }, [onClearSearch, onFiltersChange]);

  const activeCount = countActiveFilters(filters);

  const panelContent = (options?: { showSearch?: boolean }) => {
    const showSearch = options?.showSearch !== false;
    return (
    <div
      className={`flex min-h-0 flex-1 flex-col overflow-hidden ${disabled ? 'pointer-events-none opacity-60' : ''}`}
    >
      {showSearch && (
        <div className="p-4 pb-2">
          <InventorySearchBar
            value={searchValue}
            onChange={onSearchChange}
            onClear={onClearSearch}
            disabled={disabled}
            inputClassName="rounded-xl border-gray-200 bg-white py-2.5 pl-9 pr-8 text-sm shadow-none backdrop-blur-none"
          />
        </div>
      )}

      {activeCount > 0 && (
        <div className="px-4 pb-2">
          <div className="flex flex-wrap items-center gap-1.5 rounded-xl bg-gray-50 p-2.5">
            {filters.search.trim() && (
              <span className="inline-flex items-center gap-1 rounded-full bg-white border border-gray-200 px-2.5 py-1 text-xs font-medium text-gray-700 shadow-sm">
                &ldquo;{filters.search.trim()}&rdquo;
                <button
                  type="button"
                  onClick={onClearSearch}
                  className="ml-0.5 text-gray-400 hover:text-red-500 transition-colors"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}
            {filters.kind !== 'all' && (
              <span className="inline-flex items-center gap-1 rounded-full bg-white border border-gray-200 px-2.5 py-1 text-xs font-medium text-gray-700 shadow-sm">
                {filters.kind}
                <button
                  type="button"
                  onClick={() => update('kind', 'all')}
                  className="ml-0.5 text-gray-400 hover:text-red-500 transition-colors"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}
            {filters.game !== 'all' && (
              <span className="inline-flex items-center gap-1 rounded-full bg-white border border-gray-200 px-2.5 py-1 text-xs font-medium text-gray-700 shadow-sm">
                {facets.games.find((g) => g.key === filters.game)?.label ?? filters.game}
                <button
                  type="button"
                  onClick={() => update('game', 'all')}
                  className="ml-0.5 text-gray-400 hover:text-red-500 transition-colors"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}
            {filters.conditions.map((c) => (
              <span
                key={c}
                className="inline-flex items-center gap-1 rounded-full bg-white border border-gray-200 px-2.5 py-1 text-xs font-medium text-gray-700 shadow-sm"
              >
                {c}
                <button
                  type="button"
                  onClick={() => toggleMulti('conditions', c)}
                  className="ml-0.5 text-gray-400 hover:text-red-500 transition-colors"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
            {filters.languages.map((l) => (
              <span
                key={l}
                className="inline-flex items-center gap-1.5 rounded-full bg-white border border-gray-200 px-2.5 py-1 text-xs font-medium text-gray-700 shadow-sm"
              >
                <CardLanguageFlag code={l} size="xs" title={l} />
                <button
                  type="button"
                  onClick={() => toggleMulti('languages', l)}
                  className="ml-0.5 text-gray-400 hover:text-red-500 transition-colors"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
            {filters.rarities.map((r) => (
              <span
                key={r}
                className="inline-flex items-center gap-1 rounded-full bg-white border border-gray-200 px-2.5 py-1 text-xs font-medium text-gray-700 shadow-sm"
              >
                {r}
                <button
                  type="button"
                  onClick={() => toggleMulti('rarities', r)}
                  className="ml-0.5 text-gray-400 hover:text-red-500 transition-colors"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
            {filters.smartFilter === 'duplicates' && (
              <span className="inline-flex items-center gap-1 rounded-full bg-white border border-gray-200 px-2.5 py-1 text-xs font-medium text-gray-700 shadow-sm">
                {t('accountPage.itemsFiltersDuplicates')}
                <button
                  type="button"
                  onClick={() => update('smartFilter', 'all')}
                  className="ml-0.5 text-gray-400 hover:text-red-500 transition-colors"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}
            <button
              type="button"
              onClick={clearAll}
              className="ml-auto text-xs font-medium text-primary hover:underline"
            >
              {t('accountPage.itemsFiltersClearAll')}
            </button>
          </div>
        </div>
      )}

      <div className="flex-1 divide-y divide-gray-100 overflow-y-auto px-4">
        <div className="py-1">
          <SectionHeader
            label={t('accountPage.itemsFiltersSectionTipo')}
            expanded={sections.tipo}
            onToggle={() => toggleSection('tipo')}
          />
          {sections.tipo && (
            <div className="flex flex-wrap gap-1.5 pb-2">
              {(['all', 'singole', 'oggetti'] as const)
                .filter((k) => {
                  if (k === 'all') return facets.kinds.all > 0;
                  if (k === 'singole') return facets.kinds.singole > 0;
                  return facets.kinds.oggetti > 0;
                })
                .map((k) => {
                  const count =
                    k === 'all'
                      ? facets.kinds.all
                      : k === 'singole'
                        ? facets.kinds.singole
                        : facets.kinds.oggetti;
                  const label =
                    k === 'all'
                      ? t('accountPage.itemsFilterTabAll', { count })
                      : k === 'singole'
                        ? t('accountPage.itemsFilterTabSingles', { count })
                        : t('accountPage.itemsFilterTabSealed', { count });
                  return (
                    <button
                      key={k}
                      type="button"
                      onClick={() => update('kind', k)}
                      className={`rounded-full px-3 py-1.5 text-xs font-medium transition-all ${
                        filters.kind === k
                          ? 'bg-primary text-white shadow-sm'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-900'
                      }`}
                    >
                      {label}
                    </button>
                  );
                })}
            </div>
          )}
        </div>

        {facets.conditions.length > 0 && (
          <div className="py-1">
            <SectionHeader
              label={t('accountPage.itemsFiltersSectionCondition')}
              expanded={sections.conditions}
              onToggle={() => toggleSection('conditions')}
            />
            {sections.conditions && (
              <div className="space-y-2.5 pb-2">
                {facets.conditions.map(({ code, count }) => (
                  <label
                    key={code}
                    className="flex cursor-pointer items-center gap-3 rounded-lg px-1 py-0.5 transition-colors hover:bg-gray-50"
                  >
                    <input
                      type="checkbox"
                      checked={filters.conditions.includes(code)}
                      onChange={() => toggleMulti('conditions', code)}
                      className="h-4 w-4 shrink-0 rounded border-gray-300 accent-primary"
                    />
                    <ConditionBadge condition={code} size="sm" />
                    <span className="ml-auto text-xs tabular-nums text-gray-400">{count}</span>
                  </label>
                ))}
              </div>
            )}
          </div>
        )}

        {facets.languages.length > 0 && (
          <div className="py-1">
            <SectionHeader
              label={t('accountPage.itemsFiltersSectionLanguage')}
              expanded={sections.languages}
              onToggle={() => toggleSection('languages')}
            />
            {sections.languages && (
              <div className="space-y-2 pb-2">
                {facets.languages.map(({ code, label, count }) => (
                  <label
                    key={code}
                    className="flex cursor-pointer items-center gap-2.5 rounded-lg px-1 py-0.5 transition-colors hover:bg-gray-50"
                  >
                    <input
                      type="checkbox"
                      checked={filters.languages.includes(code)}
                      onChange={() => toggleMulti('languages', code)}
                      className="h-4 w-4 shrink-0 rounded border-gray-300 accent-primary"
                    />
                    <CardLanguageFlag code={code} size="xs" title={label} />
                    <span className="flex-1 text-sm text-gray-700">{label}</span>
                    <span className="text-xs tabular-nums text-gray-400">{count}</span>
                  </label>
                ))}
              </div>
            )}
          </div>
        )}

        {facets.rarities.length > 0 && (
          <div className="py-1">
            <SectionHeader
              label={t('accountPage.itemsFiltersSectionRarity')}
              expanded={sections.rarities}
              onToggle={() => toggleSection('rarities')}
            />
            {sections.rarities && (
              <div className="space-y-2 pb-2">
                {facets.rarities.map(({ value, count }) => (
                  <label
                    key={value}
                    className="flex cursor-pointer items-center gap-2.5 rounded-lg px-1 py-0.5 transition-colors hover:bg-gray-50"
                  >
                    <input
                      type="checkbox"
                      checked={filters.rarities.includes(value)}
                      onChange={() => toggleMulti('rarities', value)}
                      className="h-4 w-4 shrink-0 rounded border-gray-300 accent-primary"
                    />
                    <span className="flex-1 text-sm text-gray-700">{value}</span>
                    <span className="text-xs tabular-nums text-gray-400">{count}</span>
                  </label>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="py-1">
          <SectionHeader
            label={t('accountPage.itemsFiltersSectionPrice')}
            expanded={sections.price}
            onToggle={() => toggleSection('price')}
          />
          {sections.price && (
            <div className="pb-2">
              {(filters.priceMin !== null || filters.priceMax !== null) && (
                <p className="mb-2 text-xs text-gray-500">
                  €{filters.priceMin ?? 0} —{' '}
                  {filters.priceMax !== null ? `€${filters.priceMax}` : '∞'}
                </p>
              )}
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={0}
                  placeholder={t('accountPage.itemsFiltersPriceMin')}
                  value={filters.priceMin ?? ''}
                  onChange={(e) =>
                    update('priceMin', e.target.value ? Number(e.target.value) : null)
                  }
                  className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                />
                <span className="shrink-0 text-gray-300">—</span>
                <input
                  type="number"
                  min={0}
                  placeholder={t('accountPage.itemsFiltersPriceMax')}
                  value={filters.priceMax ?? ''}
                  onChange={(e) =>
                    update('priceMax', e.target.value ? Number(e.target.value) : null)
                  }
                  className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                />
              </div>
            </div>
          )}
        </div>

        {facets.games.length > 0 && (
          <div className="py-1">
            <SectionHeader
              label={t('accountPage.itemsFiltersSectionGame')}
              expanded={sections.game}
              onToggle={() => toggleSection('game')}
            />
            {sections.game && (
              <div className="space-y-1.5 pb-2">
                <label className="flex cursor-pointer items-center gap-2.5 rounded-lg px-1 py-1 transition-colors hover:bg-gray-50">
                  <input
                    type="radio"
                    name="game-filter"
                    checked={filters.game === 'all'}
                    onChange={() => update('game', 'all')}
                    className="h-4 w-4 shrink-0 border-gray-300 accent-primary"
                  />
                  <span className="flex-1 text-sm text-gray-700">
                    {t('accountPage.itemsFilterAll')}
                  </span>
                  <span className="text-xs tabular-nums text-gray-400">{facets.kinds.all}</span>
                </label>
                {facets.games.map(({ key, label, count }) => (
                  <label
                    key={key}
                    className="flex cursor-pointer items-center gap-2.5 rounded-lg px-1 py-1 transition-colors hover:bg-gray-50"
                  >
                    <input
                      type="radio"
                      name="game-filter"
                      checked={filters.game === key}
                      onChange={() => update('game', key)}
                      className="h-4 w-4 shrink-0 border-gray-300 accent-primary"
                    />
                    <span className="flex-1 text-sm text-gray-700">{label}</span>
                    <span className="text-xs tabular-nums text-gray-400">{count}</span>
                  </label>
                ))}
              </div>
            )}
          </div>
        )}

        {totalCount > 0 && (
          <div className="py-1">
            <SectionHeader
              label={t('accountPage.itemsFilters')}
              expanded={sections.smart}
              onToggle={() => toggleSection('smart')}
            />
            {sections.smart && (
              <div className="pb-2">
                <button
                  type="button"
                  onClick={() =>
                    update(
                      'smartFilter',
                      filters.smartFilter === 'duplicates' ? 'all' : 'duplicates'
                    )
                  }
                  className={`rounded-full px-3 py-1.5 text-xs font-medium transition-all ${
                    filters.smartFilter === 'duplicates'
                      ? 'bg-primary text-white shadow-sm'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-900'
                  }`}
                >
                  {t('accountPage.itemsFilterDuplicates')}
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="shrink-0 border-t border-gray-100 p-4">
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-gray-400">
          {t('accountPage.itemsFiltersSyncSection')}
        </p>
        <Link
          href="/account/sincronizzazione"
          className="flex items-center gap-2.5 rounded-xl p-2.5 transition-all hover:bg-gray-50"
        >
          <span className="relative flex h-2.5 w-2.5 shrink-0">
            {syncStatus === 'active' ? (
              <>
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
              </>
            ) : syncStatus === 'syncing' ? (
              <>
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-amber-500" />
              </>
            ) : (
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-gray-300" />
            )}
          </span>
          <span
            className={`flex-1 text-xs font-medium ${
              syncStatus === 'active'
                ? 'text-emerald-700'
                : syncStatus === 'syncing'
                  ? 'text-amber-700'
                  : 'text-gray-500'
            }`}
          >
            {syncStatus === 'active'
              ? t('accountPage.itemsFiltersSyncActive')
              : syncStatus === 'syncing'
                ? t('accountPage.itemsFiltersSyncSyncing')
                : t('accountPage.itemsFiltersSyncInactive')}
          </span>
          <span className="text-xs font-medium text-gray-400">
            {t('accountPage.itemsFiltersSyncManage')}
          </span>
          <ChevronRight className="h-3.5 w-3.5 shrink-0 text-gray-400" />
        </Link>
        <p className="mt-2 text-center text-[11px] text-gray-400">
          {t('accountPage.itemsFiltersCardsCount', {
            filtered: itemCount,
            total: totalCount,
          })}
        </p>
      </div>
    </div>
    );
  };

  const panelWidth = collapsed ? 48 : 280;

  const stickyPanelStyle: CSSProperties = {
    top: stickyTopWithGap,
    width: panelWidth,
  };

  const panelMaxHeight = `calc(100vh - ${stickyTopWithGap}px)`;

  return (
    <>
      <aside
        className="sticky z-30 hidden shrink-0 self-start flex-col transition-all duration-300 md:flex"
        style={stickyPanelStyle}
      >
        <div
          className="flex min-h-0 flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white/70 shadow-sm backdrop-blur-md"
          style={{ maxHeight: panelMaxHeight }}
        >
          <div className="flex shrink-0 items-center justify-between border-b border-gray-100 px-4 py-3">
            {!collapsed && (
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="h-4 w-4 text-gray-500" />
                <span className="text-sm font-semibold text-gray-900">
                  {t('accountPage.itemsFiltersPanelTitle')}
                </span>
                {activeCount > 0 && (
                  <span className="inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-primary px-1.5 text-[10px] font-bold text-white">
                    {activeCount}
                  </span>
                )}
              </div>
            )}
            <button
              type="button"
              onClick={() => setCollapsed((c) => !c)}
              className={`rounded-lg p-1.5 text-gray-400 transition-all hover:bg-gray-100 hover:text-gray-700 ${
                collapsed ? 'mx-auto' : 'ml-auto'
              }`}
              aria-label={
                collapsed
                  ? t('accountPage.itemsFiltersExpand')
                  : t('accountPage.itemsFiltersCollapse')
              }
            >
              <ChevronLeft
                className={`h-4 w-4 transition-transform duration-200 ${collapsed ? 'rotate-180' : ''}`}
              />
            </button>
          </div>

          {!collapsed ? (
            panelContent()
          ) : (
            <div className="flex flex-1 flex-col items-center gap-3 pt-4">
              {activeCount > 0 && (
                <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-white">
                  {activeCount}
                </span>
              )}
            </div>
          )}
        </div>
      </aside>

      {mobileOpen && (
        <div
          className="fixed inset-0 z-50 flex md:hidden"
          role="dialog"
          aria-modal="true"
          aria-labelledby="inventory-filters-sheet-title"
        >
          <button
            type="button"
            className="absolute inset-0 bg-black/45 backdrop-blur-sm transition-opacity"
            aria-label={t('accountPage.itemsClose')}
            onClick={() => setMobileOpen(false)}
          />
          <div className="absolute bottom-0 left-0 right-0 flex max-h-[min(88vh,720px)] flex-col overflow-hidden rounded-t-[1.75rem] border border-white/30 bg-white/90 shadow-[0_-12px_48px_rgba(0,0,0,0.18)] backdrop-blur-2xl animate-in slide-in-from-bottom duration-300">
            <div className="flex shrink-0 justify-center pt-2 pb-1" aria-hidden>
              <span className="h-1 w-10 rounded-full bg-gray-300/80" />
            </div>
            <div className="flex shrink-0 items-center justify-between border-b border-gray-200/60 px-5 py-3">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="h-4 w-4 text-gray-500" aria-hidden />
                <h2 id="inventory-filters-sheet-title" className="font-semibold text-gray-900">
                  {t('accountPage.itemsFiltersPanelTitle')}
                </h2>
                {activeCount > 0 && (
                  <span className="inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-primary px-1.5 text-[10px] font-bold text-white">
                    {activeCount}
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                className="flex h-11 w-11 items-center justify-center rounded-full text-gray-500 transition-colors hover:bg-gray-100/80 active:scale-95"
                aria-label={t('accountPage.itemsClose')}
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
              {panelContent({ showSearch: false })}
            </div>
            <div className="shrink-0 border-t border-gray-200/60 bg-white/70 p-4 pb-[max(1rem,env(safe-area-inset-bottom))] backdrop-blur-md">
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                className="min-h-[48px] w-full rounded-2xl bg-primary py-3 text-sm font-bold text-white shadow-lg shadow-primary/25 transition-all hover:bg-primary/90 active:scale-[0.98]"
              >
                {t('accountPage.itemsFiltersShowResults', { count: itemCount })}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
