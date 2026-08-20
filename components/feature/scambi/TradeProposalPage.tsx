'use client';

import { memo, useDeferredValue, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronDown,
  Clock3,
  Coins,
  Info,
  Loader2,
  LockKeyhole,
  Minus,
  Plus,
  Search,
  Send,
  SlidersHorizontal,
  Sparkles,
} from 'lucide-react';
import { cn, formatEurCents } from '@/lib/utils';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { useIntlLocale } from '@/lib/i18n/useIntlLocale';
import { useAuthStore } from '@/lib/stores/auth-store';
import { useAccountInventory } from '@/lib/hooks/use-account-inventory';
import { useInfinitePublicUserCollection } from '@/lib/hooks/use-public-user-collection';
import { useMeilisearchCards } from '@/lib/hooks/use-meilisearch-cards';
import { getCardLanguageLabel } from '@/lib/card-languages';
import { useCounterTrade, useCreateTrade } from '@/lib/hooks/use-trades';
import {
  clearTradeProposalContext,
  getTradeProposalContext,
  type TradeProposalContext,
} from '@/lib/scambi/trade-proposal-context';
import type { TradeItemInput } from '@/types/trade';
import { ScambiShell, TradeCardThumb, scambiGlass } from './ScambiShell';
import { TradeBalanceIndicator } from './TradeBalanceIndicator';

type ProposalStep = 'cards' | 'review';
type StepDirection = 'forward' | 'backward';
type PrivateCashSide = 'none' | 'offered' | 'requested';

const PROPOSAL_STEP_ORDER: ProposalStep[] = ['cards', 'review'];

interface PickerItem {
  id: string;
  inventoryItemId?: number;
  marketplaceListingId?: string;
  blueprintId: number;
  quantity: number;
  name: string;
  image?: string | null;
  setName?: string;
  condition?: string;
  language?: string;
  foil?: boolean;
  signed?: boolean;
  altered?: boolean;
  graded?: boolean;
  priceCents: number;
  source: 'cardtrader' | 'marketplace';
}

type PickerSort = 'default' | 'price-desc' | 'price-asc' | 'name-asc' | 'name-desc';
type PickerTraitFilter = 'all' | 'foil' | 'non-foil' | 'altered' | 'signed' | 'graded';

const PICKER_INITIAL_ITEMS = 32;
const PICKER_ITEMS_STEP = 32;

export function parsePrivateCashInput(value: string): number | null {
  const normalized = value.trim().replace(',', '.');
  if (normalized === '') return 0;
  if (normalized === '.') return 0;
  if (!/^(?:\d+(?:\.\d{0,2})?|\.\d{1,2})$/.test(normalized)) return null;

  const cents = Math.round(Number(normalized) * 100);
  if (!Number.isFinite(cents) || cents < 0) return null;
  return cents;
}

function privateCashInputValue(amountCents: number): string {
  return amountCents > 0 ? (amountCents / 100).toFixed(2) : '';
}

export function privateCashCoinCount(amountCents: number): number {
  if (amountCents <= 0) return 0;
  return Math.min(8, Math.max(1, Math.ceil(amountCents / 500)));
}

function proposalItemKey(item: {
  source: 'sync' | 'marketplace';
  inventoryItemId?: number;
  marketplaceListingId?: string;
}): string | null {
  if (item.source === 'marketplace' && item.marketplaceListingId) {
    return `marketplace:${item.marketplaceListingId}`;
  }
  if (item.source === 'sync' && item.inventoryItemId) {
    return `sync:${item.inventoryItemId}`;
  }
  return null;
}

function toTradeItems(selected: Record<string, number>, items: PickerItem[]): TradeItemInput[] {
  const byId = new Map(items.map((item) => [item.id, item]));
  const result: TradeItemInput[] = [];
  for (const [id, selectedQuantity] of Object.entries(selected)) {
    const item = byId.get(id);
    if (!item) continue;
    const quantity = Math.max(1, Math.min(item.quantity, selectedQuantity));
    if (item.marketplaceListingId) {
      result.push({ marketplace_listing_id: item.marketplaceListingId, quantity });
    } else if (item.inventoryItemId) {
      result.push({ inventory_item_id: item.inventoryItemId, quantity });
    }
  }
  return result;
}

function inventoryProperty(
  properties: Record<string, unknown> | null | undefined,
  ...keys: string[]
): string | undefined {
  if (!properties) return undefined;
  for (const key of keys) {
    const value = properties[key];
    if (typeof value === 'string' && value.trim()) return value.trim();
  }
  return undefined;
}

function inventoryBoolProperty(
  properties: Record<string, unknown> | null | undefined,
  ...keys: string[]
): boolean {
  if (!properties) return false;
  for (const key of keys) {
    const value = properties[key];
    if (value === true || value === 'true' || value === 1 || value === '1') return true;
  }
  return false;
}

function selectedValueCents(selected: Record<string, number>, items: PickerItem[]): number {
  return items.reduce((total, item) => total + item.priceCents * (selected[item.id] ?? 0), 0);
}

const ItemPicker = memo(function ItemPicker({
  title,
  empty,
  items,
  selected,
  locked,
  totalCount,
  hasMore = false,
  loadingMore = false,
  onLoadMore,
  onChange,
}: {
  title: string;
  empty: string;
  items: PickerItem[];
  selected: Record<string, number>;
  locked?: Set<string>;
  totalCount?: number;
  hasMore?: boolean;
  loadingMore?: boolean;
  onLoadMore?: () => void;
  onChange: (next: Record<string, number>) => void;
}) {
  const { t } = useTranslation();
  const locale = useIntlLocale();
  const [query, setQuery] = useState('');
  const [setFilter, setSetFilter] = useState('all');
  const [condition, setCondition] = useState('all');
  const [language, setLanguage] = useState('all');
  const [traitFilter, setTraitFilter] = useState<PickerTraitFilter>('all');
  const [sort, setSort] = useState<PickerSort>('default');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [visibleLimit, setVisibleLimit] = useState(PICKER_INITIAL_ITEMS);
  const deferredQuery = useDeferredValue(query.trim().toLocaleLowerCase(locale));
  const selectedCount = Object.values(selected).reduce((sum, quantity) => sum + quantity, 0);

  const sets = useMemo(
    () => [...new Set(items.flatMap((item) => (item.setName ? [item.setName] : [])))].sort((a, b) =>
      a.localeCompare(b, locale),
    ),
    [items, locale],
  );
  const conditions = useMemo(
    () => [...new Set(items.flatMap((item) => (item.condition ? [item.condition] : [])))].sort(),
    [items],
  );
  const languages = useMemo(
    () =>
      [...new Set(items.flatMap((item) => (item.language ? [item.language] : [])))].sort((left, right) =>
        getCardLanguageLabel(left).localeCompare(getCardLanguageLabel(right), locale),
      ),
    [items, locale],
  );

  const filteredItems = useMemo(() => {
    const matches = items.filter((item) => {
      if (setFilter !== 'all' && item.setName !== setFilter) return false;
      if (condition !== 'all' && item.condition !== condition) return false;
      if (language !== 'all' && item.language !== language) return false;
      if (traitFilter === 'foil' && !item.foil) return false;
      if (traitFilter === 'non-foil' && item.foil) return false;
      if (traitFilter === 'altered' && !item.altered) return false;
      if (traitFilter === 'signed' && !item.signed) return false;
      if (traitFilter === 'graded' && !item.graded) return false;
      if (!deferredQuery) return true;
      return `${item.name} ${item.setName ?? ''}`.toLocaleLowerCase(locale).includes(deferredQuery);
    });
    if (sort === 'price-desc') return [...matches].sort((a, b) => b.priceCents - a.priceCents);
    if (sort === 'price-asc') return [...matches].sort((a, b) => a.priceCents - b.priceCents);
    if (sort === 'name-asc') return [...matches].sort((a, b) => a.name.localeCompare(b.name, locale));
    if (sort === 'name-desc') return [...matches].sort((a, b) => b.name.localeCompare(a.name, locale));
    return matches;
  }, [condition, deferredQuery, items, language, locale, setFilter, sort, traitFilter]);

  const visibleItems = filteredItems.slice(0, visibleLimit);
  const activeFilterCount =
    Number(query.trim().length > 0) +
    Number(setFilter !== 'all') +
    Number(condition !== 'all') +
    Number(language !== 'all') +
    Number(traitFilter !== 'all') +
    Number(sort !== 'default');

  useEffect(() => {
    setVisibleLimit(PICKER_INITIAL_ITEMS);
  }, [deferredQuery, setFilter, condition, language, traitFilter, sort]);

  const toggle = (item: PickerItem) => {
    if (locked?.has(item.id)) return;
    const next = { ...selected };
    if (next[item.id]) delete next[item.id];
    else next[item.id] = 1;
    onChange(next);
  };

  return (
    <section className="flex h-full flex-col overflow-hidden rounded-[1.3rem] border border-white/10 bg-[#09152E]/28 backdrop-blur-lg shadow-[0_12px_32px_rgba(0,0,0,0.2)]">
      <div className="flex min-h-[58px] items-center justify-between gap-3 border-b border-white/10 px-4 py-3.5 sm:px-5">
        <div>
          <h2 className="text-sm font-black uppercase tracking-wide text-white">{title}</h2>
          <p className="mt-0.5 text-[11px] font-semibold text-white/40">
            {t('trades.inventoryResults', { shown: filteredItems.length, total: totalCount ?? items.length })}
          </p>
        </div>
        <span
          className={cn(
            'rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-wide',
            selectedCount ? 'bg-[#FF7300] text-white shadow-sm' : 'bg-white/10 text-white/40',
          )}
          aria-live="polite"
          aria-atomic="true"
        >
          {t('trades.selectedCount', { count: selectedCount })}
        </span>
      </div>

      <div className="border-b border-white/10 bg-black/10 p-3 sm:p-4">
        <div className="flex gap-2">
          <label className="relative min-w-0 flex-1">
            <span className="sr-only">{t('trades.searchInventory')}</span>
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/35" aria-hidden />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={t('trades.searchInventory')}
              className="h-10 w-full rounded-xl border border-white/10 bg-white/[0.07] pl-9 pr-3 text-sm font-semibold text-white outline-none placeholder:text-white/30 focus:border-[#FF8A26]/60 focus:ring-2 focus:ring-[#FF7300]/15"
            />
          </label>
          <button
            type="button"
            onClick={() => setFiltersOpen((current) => !current)}
            aria-expanded={filtersOpen}
            className={cn(
              'relative inline-flex h-10 items-center gap-1.5 rounded-xl border px-3 text-xs font-black uppercase tracking-wide outline-none transition-colors focus-visible:ring-2 focus-visible:ring-[#FF8A26]/60',
              filtersOpen || activeFilterCount > 0
                ? 'border-[#FF8A26]/55 bg-[#FF7300]/15 text-orange-100'
                : 'border-white/10 bg-white/[0.07] text-white/55 hover:bg-white/[0.1]',
            )}
          >
            <SlidersHorizontal className="h-4 w-4" aria-hidden />
            <span className="hidden xl:inline">{t('trades.filters')}</span>
            {activeFilterCount > 0 && (
              <span className="rounded-full bg-[#FF7300] px-1.5 py-0.5 text-[9px] text-white">
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>

        {filtersOpen && (
          <div className="mt-2 grid gap-2 animate-in fade-in slide-in-from-top-1 duration-200 motion-reduce:animate-none grid-cols-2 sm:grid-cols-3 lg:grid-cols-5">
            {sets.length > 0 && (
              <label className="relative col-span-2 sm:col-span-1">
                <span className="sr-only">{t('trades.filterSet')}</span>
                <select
                  value={setFilter}
                  onChange={(event) => setSetFilter(event.target.value)}
                  className="h-10 w-full appearance-none rounded-xl border border-white/10 bg-[#13213D] px-3 pr-8 text-xs font-bold text-white outline-none focus:border-[#FF8A26]/60"
                >
                  <option value="all">{t('trades.allSets')}</option>
                  {sets.map((value) => (
                    <option key={value} value={value}>
                      {value}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-white/40" aria-hidden />
              </label>
            )}
            <label className="relative">
              <span className="sr-only">{t('trades.filterCondition')}</span>
              <select
                value={condition}
                onChange={(event) => setCondition(event.target.value)}
                className="h-10 w-full appearance-none rounded-xl border border-white/10 bg-[#13213D] px-3 pr-8 text-xs font-bold text-white outline-none focus:border-[#FF8A26]/60"
              >
                <option value="all">{t('trades.allConditions')}</option>
                {conditions.map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-white/40" aria-hidden />
            </label>
            <label className="relative">
              <span className="sr-only">{t('trades.filterLanguage')}</span>
              <select
                value={language}
                onChange={(event) => setLanguage(event.target.value)}
                className="h-10 w-full appearance-none rounded-xl border border-white/10 bg-[#13213D] px-3 pr-8 text-xs font-bold text-white outline-none focus:border-[#FF8A26]/60"
              >
                <option value="all">{t('trades.allLanguages')}</option>
                {languages.map((value) => (
                  <option key={value} value={value}>
                    {getCardLanguageLabel(value)}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-white/40" aria-hidden />
            </label>
            <label className="relative">
              <span className="sr-only">{t('trades.filterTrait')}</span>
              <select
                value={traitFilter}
                onChange={(event) => setTraitFilter(event.target.value as PickerTraitFilter)}
                className="h-10 w-full appearance-none rounded-xl border border-white/10 bg-[#13213D] px-3 pr-8 text-xs font-bold text-white outline-none focus:border-[#FF8A26]/60"
              >
                <option value="all">{t('trades.allTraits')}</option>
                <option value="foil">{t('trades.onlyFoil')}</option>
                <option value="non-foil">{t('trades.nonFoil')}</option>
                <option value="altered">{t('trades.onlyAltered')}</option>
                <option value="signed">{t('trades.onlySigned')}</option>
                <option value="graded">{t('trades.onlyGraded')}</option>
              </select>
              <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-white/40" aria-hidden />
            </label>
            <label className="relative col-span-2 sm:col-span-1">
              <span className="sr-only">{t('trades.sortInventory')}</span>
              <select
                value={sort}
                onChange={(event) => setSort(event.target.value as PickerSort)}
                className="h-10 w-full appearance-none rounded-xl border border-white/10 bg-[#13213D] px-3 pr-8 text-xs font-bold text-white outline-none focus:border-[#FF8A26]/60"
              >
                <option value="default">{t('trades.sortDefault')}</option>
                <option value="price-desc">{t('trades.sortPriceDesc')}</option>
                <option value="price-asc">{t('trades.sortPriceAsc')}</option>
                <option value="name-asc">{t('trades.sortNameAsc')}</option>
                <option value="name-desc">{t('trades.sortNameDesc')}</option>
              </select>
              <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-white/40" aria-hidden />
            </label>
          </div>
        )}
      </div>

      {items.length === 0 ? (
        <div className="flex flex-1 min-h-[360px] sm:min-h-[420px] items-center justify-center p-6 text-center">
          <p className="max-w-xs text-sm font-semibold text-white/45">{empty}</p>
        </div>
      ) : (
        <div className="flex-1 h-[360px] sm:h-[420px] space-y-2 overflow-y-auto p-3 sm:p-4">
          {visibleItems.length === 0 && (
            <div className="flex h-full items-center justify-center py-10 text-center">
              <p className="text-sm font-semibold text-white/45">{t('trades.noFilterResults')}</p>
            </div>
          )}
          {visibleItems.map((item) => {
            const quantity = selected[item.id] ?? 0;
            const isSelected = quantity > 0;
            const isLocked = Boolean(locked?.has(item.id));
            return (
              <div
                key={item.id}
                className={cn(
                  'flex items-center gap-3 rounded-xl border p-2.5 transition-all duration-200 motion-reduce:transform-none',
                  isSelected
                    ? 'scambi-selection-live border-[#FF8A26]/60 bg-[#FF7300]/12 shadow-[0_6px_18px_rgba(255,115,0,0.08)]'
                    : 'border-white/10 bg-white/[0.055]',
                  !isSelected && !isLocked && 'hover:-translate-y-px hover:border-white/20 hover:bg-white/[0.09]',
                )}
              >
                <button
                  type="button"
                  onClick={() => toggle(item)}
                  aria-disabled={isLocked}
                  aria-pressed={isSelected}
                  className={cn(
                    'flex min-w-0 flex-1 items-center gap-3 rounded-lg text-left outline-none focus-visible:ring-2 focus-visible:ring-[#FF8A26]/60',
                    isLocked && 'cursor-default',
                  )}
                >
                  <TradeCardThumb image={item.image} name={item.name} className="h-[58px] w-[42px] shrink-0" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-black text-white">{item.name}</span>
                    <span className="mt-0.5 block truncate text-[11px] font-semibold text-white/40">
                      {[item.setName, item.condition, item.language ? getCardLanguageLabel(item.language) : null]
                        .filter(Boolean)
                        .join(' · ') || t('trades.availableCount', { count: item.quantity })}
                    </span>
                    <div className="mt-1 flex flex-wrap items-center gap-1.5">
                      <span className="text-[10px] font-black tabular-nums text-orange-200/75">
                        {formatEurCents(item.priceCents, locale)}
                      </span>
                      {item.foil && (
                        <span className="rounded bg-violet-500/25 px-1.5 py-0.5 text-[9px] font-black uppercase text-violet-200">
                          Foil
                        </span>
                      )}
                      {item.signed && (
                        <span className="rounded bg-sky-500/25 px-1.5 py-0.5 text-[9px] font-black uppercase text-sky-200">
                          Firmata
                        </span>
                      )}
                      {item.altered && (
                        <span className="rounded bg-rose-500/25 px-1.5 py-0.5 text-[9px] font-black uppercase text-rose-200">
                          Alterata
                        </span>
                      )}
                      {item.graded && (
                        <span className="rounded bg-emerald-500/25 px-1.5 py-0.5 text-[9px] font-black uppercase text-emerald-200">
                          Gradata
                        </span>
                      )}
                    </div>
                    {isLocked && (
                      <span className="mt-1 inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wide text-[#FF7300]">
                        <LockKeyhole className="h-3 w-3" aria-hidden /> {t('trades.lockedCard')}
                      </span>
                    )}
                  </span>
                  <span
                    className={cn(
                      'flex h-6 w-6 shrink-0 items-center justify-center rounded-full border transition-colors duration-200',
                      isSelected ? 'border-[#FF7300] bg-[#FF7300] text-white' : 'border-white/25 bg-white/5 text-transparent',
                    )}
                  >
                    <Check className="h-3.5 w-3.5" strokeWidth={3} aria-hidden />
                  </span>
                </button>

                {isSelected && (
                  <input
                    type="number"
                    min={1}
                    max={item.quantity}
                    value={quantity}
                    onChange={(event) =>
                      onChange({
                        ...selected,
                        [item.id]: Math.max(1, Math.min(item.quantity, Number(event.target.value) || 1)),
                      })
                    }
                    onFocus={(event) => event.currentTarget.select()}
                    className="h-9 w-14 rounded-xl border border-white/15 bg-white/90 px-1 text-center text-sm font-black text-[#1D3160] outline-none focus:ring-2 focus:ring-[#FF7300]/35"
                    aria-label={t('trades.quantityFor', { card: item.name })}
                  />
                )}
              </div>
            );
          })}
          {(visibleLimit < filteredItems.length || hasMore) && (
            <button
              type="button"
              disabled={loadingMore}
              onClick={() => {
                if (visibleLimit < filteredItems.length) {
                  setVisibleLimit((current) => current + PICKER_ITEMS_STEP);
                } else {
                  onLoadMore?.();
                }
              }}
              className="mt-2 inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.06] px-4 text-xs font-black uppercase tracking-wide text-white/65 transition-colors hover:bg-white/[0.1] hover:text-white disabled:cursor-wait disabled:opacity-50"
            >
              {loadingMore && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
              {t('trades.showMoreCards')}
            </button>
          )}
        </div>
      )}
    </section>
  );
});

export function PrivateCashControls({
  side,
  amountCents,
  onSideChange,
  onAmountChange,
  isFused = false,
  className,
}: {
  side: PrivateCashSide;
  amountCents: number;
  onSideChange: (side: PrivateCashSide) => void;
  onAmountChange: (amountCents: number) => void;
  isFused?: boolean;
  className?: string;
}) {
  const { t } = useTranslation();
  const locale = useIntlLocale();
  const [amountInput, setAmountInput] = useState(() => privateCashInputValue(amountCents));
  const [showDisclaimer, setShowDisclaimer] = useState(false);

  const setSide = (next: Exclude<PrivateCashSide, 'none'>) => {
    if (side === next) {
      onSideChange('none');
      onAmountChange(0);
      setAmountInput('');
      return;
    }
    onSideChange(next);
  };

  const changeAmount = (next: number) => {
    const safeAmount = Math.max(0, Math.round(next));
    onAmountChange(safeAmount);
    setAmountInput(privateCashInputValue(safeAmount));
  };

  const addQuickPreset = (deltaCents: number) => {
    changeAmount(amountCents + deltaCents);
  };

  return (
    <section
      className={cn(
        isFused
          ? 'border-t border-[#C08A57]/30 bg-[#160B08]/92 p-3 sm:p-4 backdrop-blur-md transition-colors'
          : 'mb-4 overflow-hidden rounded-[1.3rem] border border-amber-200/20 bg-amber-300/[0.07] p-4',
        className,
      )}
    >
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-amber-400/20 text-amber-300">
              <Coins className="h-3.5 w-3.5" aria-hidden />
            </span>
            <span className="text-xs font-black uppercase tracking-[0.14em] text-amber-100">
              {t('trades.privateCash.title')}
            </span>
            <button
              type="button"
              onClick={() => setShowDisclaimer((current) => !current)}
              aria-label="Info conguaglio"
              className="rounded p-1 text-amber-300/60 transition-colors hover:bg-amber-300/10 hover:text-amber-200"
            >
              <Info className="h-3.5 w-3.5" aria-hidden />
            </button>
          </div>
          {(!isFused || showDisclaimer) && (
            <p className="mt-1 max-w-xl text-xs leading-relaxed text-amber-50/65 animate-in fade-in duration-200">
              {t('trades.privateCash.warning')}
            </p>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <div className="grid grid-cols-2 rounded-xl border border-white/10 bg-black/25 p-1">
            {([
              ['offered', t('trades.privateCash.offer')],
              ['requested', t('trades.privateCash.request')],
            ] as const).map(([value, label]) => {
              const active = side === value;
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => setSide(value)}
                  aria-pressed={active}
                  className={cn(
                    'rounded-lg px-3 py-1.5 text-[10px] font-black uppercase tracking-wide transition-all duration-200',
                    active
                      ? 'bg-gradient-to-r from-[#FF8A26] to-[#FF7300] text-white shadow-[0_2px_10px_rgba(255,115,0,0.35)]'
                      : 'text-white/45 hover:bg-white/[0.06] hover:text-white/75',
                  )}
                >
                  {label}
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-1.5">
            <div
              className={cn(
                'flex h-10 items-center overflow-hidden rounded-xl border transition-all duration-200',
                side === 'none'
                  ? 'border-white/10 bg-white/[0.06] opacity-40'
                  : 'border-amber-300/60 bg-white/95 shadow-[0_0_12px_rgba(245,158,11,0.15)]',
              )}
            >
              <button
                type="button"
                disabled={side === 'none'}
                onClick={() => changeAmount(amountCents - 500)}
                className="flex h-full w-8 items-center justify-center text-slate-600 transition-colors hover:bg-slate-200 disabled:cursor-not-allowed"
                aria-label={t('common.decrease')}
              >
                <Minus className="h-3.5 w-3.5" aria-hidden />
              </button>
              <label className="relative border-x border-slate-200">
                <span className="sr-only">{t('trades.privateCash.amount')}</span>
                <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-black text-slate-400" aria-hidden>€</span>
                <input
                  type="text"
                  inputMode="decimal"
                  disabled={side === 'none'}
                  value={amountInput}
                  onChange={(event) => {
                    const nextInput = event.target.value;
                    const parsedCents = parsePrivateCashInput(nextInput);
                    if (parsedCents === null) return;
                    setAmountInput(nextInput);
                    onAmountChange(parsedCents);
                  }}
                  onBlur={() => setAmountInput(privateCashInputValue(amountCents))}
                  placeholder="0,00"
                  className="h-10 w-20 bg-transparent pl-6 pr-2 text-right text-xs font-black tabular-nums text-slate-800 outline-none"
                />
              </label>
              <button
                type="button"
                disabled={side === 'none'}
                onClick={() => changeAmount(amountCents + 500)}
                className="flex h-full w-8 items-center justify-center text-slate-600 transition-colors hover:bg-slate-200 disabled:cursor-not-allowed"
                aria-label={t('common.increase')}
              >
                <Plus className="h-3.5 w-3.5" aria-hidden />
              </button>
            </div>

            {side !== 'none' && (
              <div className="hidden items-center gap-1 sm:flex">
                {[500, 1000, 2000].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => addQuickPreset(preset)}
                    className="rounded-lg border border-amber-300/30 bg-amber-400/10 px-2 py-1.5 text-[10px] font-black text-amber-200 transition-colors hover:bg-amber-400/20"
                  >
                    +{preset / 100}€
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {side !== 'none' && amountCents > 0 && (
        <div className="mt-2.5 flex items-center justify-between rounded-lg border border-amber-300/20 bg-amber-400/10 px-3 py-1.5 text-[11px] font-bold text-amber-100" aria-live="polite">
          <span>
            {side === 'offered'
              ? t('trades.privateCash.offerSummary', { amount: formatEurCents(amountCents, locale) })
              : t('trades.privateCash.requestSummary', { amount: formatEurCents(amountCents, locale) })}
          </span>
          <span className="text-[10px] uppercase tracking-wider text-amber-300/70">
            {t('trades.privateCash.privateAgreement')}
          </span>
        </div>
      )}
    </section>
  );
}

function GoldCoin({
  index,
  active,
  total,
}: {
  index: number;
  active: boolean;
  total: number;
}) {
  const wobbleDeg = ((index % 3) - 1) * 3;
  const shiftX = ((index % 2) - 0.5) * 2;

  return (
    <div
      className={cn(
        'absolute left-1/2 -translate-x-1/2 transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] motion-reduce:transition-none',
        active
          ? 'scale-100 opacity-100'
          : 'translate-y-6 scale-50 opacity-0 pointer-events-none',
      )}
      style={{
        bottom: `${index * 5.5}px`,
        transform: active
          ? `translateX(calc(-50% + ${shiftX}px)) rotate(${wobbleDeg}deg) scale(1)`
          : `translateX(-50%) translateY(24px) scale(0.5)`,
        transitionDelay: `${active ? index * 40 : (total - index) * 20}ms`,
        zIndex: index + 1,
      }}
    >
      <svg
        viewBox="0 0 46 20"
        className="h-5 w-12 filter drop-shadow-[0_3px_5px_rgba(0,0,0,0.5)]"
        aria-hidden
      >
        <defs>
          <linearGradient id={`coin-rim-${index}`} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#92400E" />
            <stop offset="20%" stopColor="#F59E0B" />
            <stop offset="45%" stopColor="#FEF3C7" />
            <stop offset="70%" stopColor="#F59E0B" />
            <stop offset="100%" stopColor="#78350F" />
          </linearGradient>
          <linearGradient id={`coin-face-${index}`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FEF08A" />
            <stop offset="35%" stopColor="#FBBF24" />
            <stop offset="85%" stopColor="#D97706" />
            <stop offset="100%" stopColor="#92400E" />
          </linearGradient>
          <linearGradient id={`coin-inner-${index}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFFBEB" stopOpacity="0.85" />
            <stop offset="100%" stopColor="#B45309" stopOpacity="0.4" />
          </linearGradient>
        </defs>

        {/* 3D Coin Edge / Cylinder Wall */}
        <path
          d="M3 8 C3 14 43 14 43 8 L43 12 C43 18 3 18 3 12 Z"
          fill={`url(#coin-rim-${index})`}
        />

        {/* Edge Vertical Ribbing (Milled Edge) */}
        <path
          d="M8 11.5 L8 15.5 M14 12.5 L14 16.5 M23 13 L23 17 M32 12.5 L32 16.5 M38 11.5 L38 15.5"
          stroke="#78350F"
          strokeWidth="0.8"
          strokeOpacity="0.7"
        />

        {/* Top Coin Face */}
        <ellipse
          cx="23"
          cy="8"
          rx="20"
          ry="6"
          fill={`url(#coin-face-${index})`}
          stroke="#FEF3C7"
          strokeWidth="0.6"
        />

        {/* Inner Embossed Ring */}
        <ellipse
          cx="23"
          cy="8"
          rx="15"
          ry="4.2"
          fill="none"
          stroke={`url(#coin-inner-${index})`}
          strokeWidth="0.7"
          strokeDasharray="2.5 1.2"
        />

        {/* Center Embossed Currency Motif */}
        <path
          d="M21 6.5 H25.5 M21 8 H25 M20.5 9.5 H25"
          stroke="#78350F"
          strokeWidth="0.7"
          strokeLinecap="round"
          opacity="0.8"
        />
      </svg>
    </div>
  );
}

function TableCashPile({ amountCents, side }: { amountCents: number; side: 'offered' | 'requested' }) {
  const { t } = useTranslation();
  const locale = useIntlLocale();
  const count = privateCashCoinCount(amountCents);
  const isOffered = side === 'offered';

  return (
    <div
      className={cn(
        'group absolute z-20 flex items-center gap-2.5 transition-all duration-500 ease-out motion-reduce:transition-none',
        isOffered
          ? 'left-4 top-14 sm:left-6 sm:top-12 flex-row'
          : 'right-4 top-14 sm:right-6 sm:top-12 flex-row-reverse',
        amountCents > 0
          ? 'scale-100 opacity-100 translate-y-0'
          : 'translate-y-2 pointer-events-none scale-75 opacity-0',
      )}
      data-cash-side={side}
    >
      {/* 3D Coins Stack with Ambient Glow */}
      <div className="relative h-16 w-14 select-none" aria-hidden>
        {/* Warm Golden Felt Light Spill */}
        <div
          className={cn(
            'absolute -bottom-1 left-1/2 -translate-x-1/2 h-6 w-16 rounded-full bg-amber-400/25 blur-md transition-all duration-500',
            amountCents > 0 ? 'opacity-100 scale-100' : 'opacity-0 scale-50',
          )}
        />

        {/* Stack of Individual 3D Gold Coins */}
        <div className="relative h-full w-full">
          {Array.from({ length: 8 }, (_, coin) => (
            <GoldCoin
              key={coin}
              index={coin}
              active={coin < count}
              total={count}
            />
          ))}
        </div>
      </div>

      {/* Floating Shiny Glass Badge */}
      <div
        className={cn(
          'flex flex-col rounded-xl border border-amber-300/45 bg-gradient-to-br from-[#24130A]/95 via-[#1A0C06]/95 to-[#0F0703]/95 px-2.5 py-1 shadow-[0_8px_20px_rgba(0,0,0,0.55),0_0_12px_rgba(245,158,11,0.22)] backdrop-blur-md transition-all duration-300 group-hover:scale-105 group-hover:border-amber-300/70',
          isOffered ? 'text-left' : 'text-right',
        )}
      >
        <div className={cn('flex items-center gap-1 text-[8.5px] font-black uppercase tracking-wider text-amber-300', !isOffered && 'flex-row-reverse')}>
          <Coins className="h-2.5 w-2.5 text-amber-400 motion-safe:animate-bounce" aria-hidden />
          <span>{isOffered ? t('trades.privateCash.offer') : t('trades.privateCash.request')}</span>
        </div>
        <span className="text-[11px] font-black tabular-nums tracking-wide text-amber-100 drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
          {formatEurCents(amountCents, locale)}
        </span>
      </div>
    </div>
  );
}

function TradeTableSide({
  items,
  selected,
  label,
  side,
  valueCents,
  cashCents,
}: {
  items: PickerItem[];
  selected: Record<string, number>;
  label: string;
  side: 'offered' | 'requested';
  valueCents: number;
  cashCents: number;
}) {
  const { t } = useTranslation();
  const locale = useIntlLocale();
  const visibleItems = items.slice(0, 5);
  const totalCards = items.reduce((sum, item) => sum + (selected[item.id] ?? 0), 0);

  return (
    <div className="relative h-full min-w-0">
      <TableCashPile amountCents={cashCents} side={side} />
      <div className={cn(
        'absolute inset-x-8 bottom-5 flex items-center gap-3',
        side === 'requested' && 'flex-row-reverse text-right',
      )}>
        <span className={cn(
          'h-px flex-1',
          side === 'offered' ? 'bg-gradient-to-r from-transparent to-sky-200/35' : 'bg-gradient-to-l from-transparent to-orange-200/40',
        )} aria-hidden />
        <div>
          <p className={cn(
            'text-[10px] font-black uppercase tracking-[0.16em]',
            side === 'offered' ? 'text-sky-100/75' : 'text-orange-100/80',
          )}>{label}</p>
          <p className="mt-0.5 text-xs font-black text-white/90">
            {t('trades.cardsCount', { count: totalCards })} · {formatEurCents(valueCents, locale)}
          </p>
        </div>
      </div>

      <div className="absolute inset-x-5 bottom-16 top-12">
        {visibleItems.length === 0 ? (
          <div className="absolute inset-0 flex items-center justify-center gap-3" aria-hidden>
            {[-1, 0, 1].map((slot) => (
              <span
                key={slot}
                className="block h-[102px] w-[72px] rounded-xl border border-dashed border-white/15 bg-black/5 shadow-inner"
                style={{ transform: `rotate(${slot * 5}deg) translateY(${Math.abs(slot) * 5}px)` }}
              />
            ))}
          </div>
        ) : visibleItems.map((item, index) => {
          const centerOffset = index - (visibleItems.length - 1) / 2;
          const rotation = centerOffset * (side === 'offered' ? 6 : -6);
          return (
            <div
              key={item.id}
              className="absolute bottom-1 left-1/2 origin-bottom"
              style={{
                zIndex: index + 1,
                transform: `translateX(calc(-50% + ${centerOffset * 48}px)) rotate(${rotation}deg) translateY(${Math.abs(centerOffset) * 5}px)`,
              }}
            >
              <div className="group/card relative transition-transform duration-200 hover:-translate-y-3 hover:scale-105 motion-reduce:transform-none" title={item.name}>
                <TradeCardThumb
                  image={item.image}
                  name={item.name}
                  className="h-[112px] w-20 rounded-xl border-white/70 shadow-[0_14px_28px_rgba(0,0,0,0.38)] ring-1 ring-black/20"
                />
                <span className={cn(
                  'absolute -right-2 -top-2 flex h-7 min-w-7 items-center justify-center rounded-full border-2 border-white px-1.5 text-[10px] font-black text-white shadow-lg',
                  side === 'offered' ? 'bg-[#1D5E9A]' : 'bg-[#FF7300]',
                )}>
                  ×{selected[item.id] ?? 0}
                </span>
              </div>
            </div>
          );
        })}
        {items.length > visibleItems.length && (
          <span className={cn(
            'absolute bottom-3 rounded-full border border-white/15 bg-black/25 px-2.5 py-1 text-[10px] font-black text-white/80 backdrop-blur-sm',
            side === 'offered' ? 'right-2' : 'left-2',
          )}>+{items.length - visibleItems.length}</span>
        )}
      </div>
    </div>
  );
}

function TradeProposalTable({
  offeredItems,
  requestedItems,
  offered,
  requested,
  offeredValueCents,
  requestedValueCents,
  offeredCashCents,
  requestedCashCents,
  otherName,
  cashSide,
  cashCents,
  onCashSideChange,
  onCashAmountChange,
}: {
  offeredItems: PickerItem[];
  requestedItems: PickerItem[];
  offered: Record<string, number>;
  requested: Record<string, number>;
  offeredValueCents: number;
  requestedValueCents: number;
  offeredCashCents: number;
  requestedCashCents: number;
  otherName: string;
  cashSide: PrivateCashSide;
  cashCents: number;
  onCashSideChange: (side: PrivateCashSide) => void;
  onCashAmountChange: (amountCents: number) => void;
}) {
  const { t } = useTranslation();
  const locale = useIntlLocale();
  const totalOfferedCards = offeredItems.reduce((sum, item) => sum + (offered[item.id] ?? 0), 0);
  const totalRequestedCards = requestedItems.reduce((sum, item) => sum + (requested[item.id] ?? 0), 0);

  return (
    <section
      className="relative mb-5 overflow-hidden rounded-[1.75rem] border border-[#C08A57]/45 bg-[#25130D] p-2 shadow-[0_24px_55px_rgba(0,0,0,0.28),inset_0_1px_0_rgba(255,255,255,0.12)]"
      aria-label={t('trades.tableAria')}
    >
      <div className="pointer-events-none absolute inset-0 opacity-45 [background-image:repeating-linear-gradient(8deg,transparent_0,transparent_7px,rgba(255,255,255,.035)_8px,transparent_9px)]" aria-hidden />

      {/* Main Felt Play Surface */}
      <div className="relative overflow-hidden rounded-[1.35rem] border border-emerald-100/15 bg-[radial-gradient(ellipse_at_center,rgba(39,121,107,.9)_0%,rgba(16,77,72,.96)_48%,rgba(7,45,45,1)_100%)] shadow-[inset_0_0_55px_rgba(0,0,0,.42)]">
        <div className="pointer-events-none absolute inset-0 opacity-[0.06] [background-image:linear-gradient(rgba(255,255,255,.9)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.9)_1px,transparent_1px)] [background-size:24px_24px]" aria-hidden />

        {/* Header inside felt */}
        <div className="pointer-events-none absolute inset-x-5 top-4 sm:inset-x-8 sm:top-5 flex items-start justify-between z-10" aria-hidden>
          <div>
            <p className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.18em] text-white/85">
              <Sparkles className="h-3.5 w-3.5 text-orange-300" /> {t('trades.tableTitle')}
            </p>
            <p className="mt-0.5 text-[10px] font-semibold text-white/40">{t('trades.tableHint')}</p>
          </div>
        </div>

        {/* Desktop Fanned Arena */}
        <div className="relative hidden h-[260px] lg:block">
          <div className="absolute inset-y-14 left-1/2 w-px -translate-x-1/2 bg-gradient-to-b from-transparent via-white/18 to-transparent" aria-hidden />
          <TradeBalanceIndicator
            offeredCents={offeredValueCents}
            requestedCents={requestedValueCents}
            otherName={otherName}
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
          />

          <div className="grid h-full grid-cols-2">
            <TradeTableSide items={offeredItems} selected={offered} label={t('trades.youOffer')} side="offered" valueCents={offeredValueCents} cashCents={offeredCashCents} />
            <TradeTableSide items={requestedItems} selected={requested} label={t('trades.youReceive')} side="requested" valueCents={requestedValueCents} cashCents={requestedCashCents} />
          </div>

          {[[18, 18], [82, 18], [18, 82], [82, 82]].map(([left, top]) => (
            <span
              key={`${left}-${top}`}
              className="pointer-events-none absolute h-2 w-2 rounded-full border border-white/15 bg-black/25 shadow-inner"
              style={{ left: `${left}%`, top: `${top}%` }}
              aria-hidden
            />
          ))}
        </div>

        {/* Compact Mobile/Tablet Arena */}
        <div className="relative flex flex-col items-center justify-center p-4 pt-12 pb-5 lg:hidden">
          <TradeBalanceIndicator
            offeredCents={offeredValueCents}
            requestedCents={requestedValueCents}
            otherName={otherName}
            className="mb-3"
          />
          <div className="flex w-full items-center justify-between gap-4 px-2 sm:px-6">
            <div className="min-w-0 text-left">
              <p className="text-[10px] font-black uppercase tracking-wider text-sky-100/75">{t('trades.youOffer')}</p>
              <p className="mt-0.5 text-xs font-black text-white">
                {t('trades.cardsCount', { count: totalOfferedCards })} · {formatEurCents(offeredValueCents, locale)}
              </p>
              {offeredCashCents > 0 && (
                <span className="mt-1 inline-flex items-center gap-1 rounded-full border border-amber-300/30 bg-amber-400/20 px-2 py-0.5 text-[9px] font-black text-amber-200">
                  <Coins className="h-2.5 w-2.5" /> +{formatEurCents(offeredCashCents, locale)}
                </span>
              )}
            </div>

            <span className="h-8 w-px bg-white/15" aria-hidden />

            <div className="min-w-0 text-right">
              <p className="text-[10px] font-black uppercase tracking-wider text-orange-100/80">{t('trades.youReceive')}</p>
              <p className="mt-0.5 text-xs font-black text-white">
                {t('trades.cardsCount', { count: totalRequestedCards })} · {formatEurCents(requestedValueCents, locale)}
              </p>
              {requestedCashCents > 0 && (
                <span className="mt-1 inline-flex items-center gap-1 rounded-full border border-amber-300/30 bg-amber-400/20 px-2 py-0.5 text-[9px] font-black text-amber-200">
                  <Coins className="h-2.5 w-2.5" /> +{formatEurCents(requestedCashCents, locale)}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Fused Private Cash Controls Dock */}
        <PrivateCashControls
          side={cashSide}
          amountCents={cashCents}
          onSideChange={onCashSideChange}
          onAmountChange={onCashAmountChange}
          isFused={true}
        />
      </div>
    </section>
  );
}

export function TradeProposalPage() {
  const { t } = useTranslation();
  const locale = useIntlLocale();
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const accessToken = useAuthStore((state) => state.accessToken);
  const [ctx, setCtx] = useState<TradeProposalContext | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [offered, setOffered] = useState<Record<string, number>>({});
  const [requested, setRequested] = useState<Record<string, number>>({});
  const [privateCashSide, setPrivateCashSide] = useState<PrivateCashSide>('none');
  const [privateCashCents, setPrivateCashCents] = useState(0);
  const [message, setMessage] = useState('');
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [step, setStep] = useState<ProposalStep>('cards');
  const [stepDirection, setStepDirection] = useState<StepDirection>('forward');
  const [mobileTab, setMobileTab] = useState<'offered' | 'requested'>('offered');
  const stepPanelRef = useRef<HTMLDivElement>(null);
  const focusNextStepRef = useRef(false);
  const createTrade = useCreateTrade();
  const counterTrade = useCounterTrade();

  useEffect(() => {
    const stored = user?.id ? getTradeProposalContext(user.id) : null;
    setCtx(stored);
    if (stored) {
      const initial: Record<string, number> = {};
      if (stored.requestedItems?.length) {
        for (const item of stored.requestedItems) {
          const key = proposalItemKey(item);
          if (key) initial[key] = Math.max(1, item.quantity);
        }
      } else if (stored.listing.quantity > 0) {
        const key = stored.listing.source === 'marketplace'
          ? `marketplace:${stored.listing.id.replace(/^mkt:/, '')}`
          : `sync:${stored.listing.id.replace(/^sync:/, '')}`;
        initial[key] = 1;
      }
      setRequested(initial);
    }
    setHydrated(true);
  }, [user?.id]);

  useEffect(() => {
    if (!focusNextStepRef.current) return;
    focusNextStepRef.current = false;
    const frame = window.requestAnimationFrame(() => stepPanelRef.current?.focus());
    return () => window.cancelAnimationFrame(frame);
  }, [step]);

  const isCounter = ctx?.mode === 'counter';
  const inventory = useAccountInventory(user?.id, accessToken, { catalogScope: 'tradable-listings' });
  const publicCollection = useInfinitePublicUserCollection(
    ctx?.seller.name ?? '',
    Boolean(ctx && !isCounter),
  );

  const publicItems = useMemo(() => publicCollection.data?.pages.flatMap((page) => page.items) ?? [], [publicCollection.data?.pages]);
  const publicTotal = publicCollection.data?.pages[0]?.total ?? publicItems.length;

  const requestedBlueprintIds = useMemo(() => [
    ...publicItems.map((item) => item.blueprint_id),
    ...(ctx?.requestedItems ?? []).map((item) => item.blueprintId),
  ].filter((id) => id > 0), [ctx?.requestedItems, publicItems]);
  const uniqueRequestedBlueprintIds = useMemo(() => [...new Set(requestedBlueprintIds)], [requestedBlueprintIds]);
  const { data: requestedCatalog = {} } = useMeilisearchCards(
    uniqueRequestedBlueprintIds,
    'cardtrader_id',
    { placeholderData: (previous) => previous ?? {} },
  );

  const myItems = useMemo<PickerItem[]>(() => inventory.inventoryRaw
    .filter((item) => item.quantity > 0)
    .filter((item) => (
      item.listing_source === 'marketplace' && Boolean(item.marketplace_listing_id)
    ) || (
      item.listing_source === 'sync' && item.source === 'cardtrader'
    ))
    .map((item) => {
      const isMarketplace = item.listing_source === 'marketplace' && Boolean(item.marketplace_listing_id);
      const card = inventory.catalogMap[item.blueprint_id];
      return {
        id: isMarketplace ? `marketplace:${item.marketplace_listing_id}` : `sync:${item.id}`,
        inventoryItemId: isMarketplace ? undefined : item.id,
        marketplaceListingId: isMarketplace ? item.marketplace_listing_id : undefined,
        blueprintId: item.blueprint_id,
        quantity: item.quantity,
        name: card?.name || item.description || t('trades.cardFallback', { id: item.blueprint_id }),
        image: card?.image,
        setName: card?.set_name || inventoryProperty(item.properties, 'set_name', 'set'),
        condition: inventoryProperty(item.properties, 'condition', 'mtg_condition'),
        language: inventoryProperty(item.properties, 'mtg_language', 'language', 'lang'),
        foil: inventoryBoolProperty(item.properties, 'mtg_foil', 'foil'),
        signed: inventoryBoolProperty(item.properties, 'signed'),
        altered: inventoryBoolProperty(item.properties, 'altered'),
        graded: item.graded === true || inventoryBoolProperty(item.properties, 'graded'),
        priceCents: Math.max(0, item.price_cents),
        source: isMarketplace ? 'marketplace' : 'cardtrader',
      };
    }), [inventory.catalogMap, inventory.inventoryRaw, t]);

  const otherItems = useMemo<PickerItem[]>(() => {
    if (ctx?.requestedItems?.length) {
      return ctx.requestedItems.flatMap((item) => {
        const id = proposalItemKey(item);
        if (!id || item.quantity <= 0) return [];
        const card = requestedCatalog[item.blueprintId];
        return [{
          id,
          inventoryItemId: item.inventoryItemId,
          marketplaceListingId: item.marketplaceListingId,
          blueprintId: item.blueprintId,
          quantity: item.quantity,
          name: item.name || card?.name || t('trades.cardFallback', { id: item.blueprintId }),
          image: card?.image,
          setName: card?.set_name || inventoryProperty(item.properties, 'set_name', 'set'),
          condition: inventoryProperty(item.properties, 'condition', 'mtg_condition'),
          language: inventoryProperty(item.properties, 'mtg_language', 'language', 'lang'),
          foil: inventoryBoolProperty(item.properties, 'mtg_foil', 'foil'),
          signed: inventoryBoolProperty(item.properties, 'signed'),
          altered: inventoryBoolProperty(item.properties, 'altered'),
          graded: inventoryBoolProperty(item.properties, 'graded'),
          priceCents: Math.max(0, item.priceCents ?? 0),
          source: item.source === 'marketplace' ? 'marketplace' as const : 'cardtrader' as const,
        }];
      });
    }
    const items: PickerItem[] = publicItems
      .filter((item) => item.quantity > 0)
      .map((item) => {
      const card = requestedCatalog[item.blueprint_id];
      return {
        id: `sync:${item.id}`,
        inventoryItemId: item.id,
        blueprintId: item.blueprint_id,
        quantity: item.quantity,
        name: card?.name || t('trades.cardFallback', { id: item.blueprint_id }),
        image: card?.image,
        setName: card?.set_name || inventoryProperty(item.properties, 'set_name', 'set'),
        condition: inventoryProperty(item.properties, 'condition', 'mtg_condition'),
        language: inventoryProperty(item.properties, 'mtg_language', 'language', 'lang'),
        foil: inventoryBoolProperty(item.properties, 'mtg_foil', 'foil'),
        signed: inventoryBoolProperty(item.properties, 'signed'),
        altered: inventoryBoolProperty(item.properties, 'altered'),
        graded: inventoryBoolProperty(item.properties, 'graded'),
        priceCents: Math.max(0, item.price_cents),
        source: 'cardtrader',
      };
    });
    if (ctx && ctx.listing.quantity > 0) {
      const isMarketplace = ctx.listing.source === 'marketplace';
      const marketplaceListingId = isMarketplace ? ctx.listing.id.replace(/^mkt:/, '') : undefined;
      const inventoryItemId = isMarketplace ? undefined : Number(ctx.listing.id.replace(/^sync:/, ''));
      const baseId = isMarketplace ? `marketplace:${marketplaceListingId}` : `sync:${inventoryItemId}`;
      if (!items.some((item) => item.id === baseId)) {
        items.unshift({
          id: baseId,
          inventoryItemId,
          marketplaceListingId,
          blueprintId: ctx.card.blueprintId || Number(ctx.card.id) || 0,
          quantity: ctx.listing.quantity,
          name: ctx.card.name,
          image: ctx.card.image,
          setName: (ctx.card as { setName?: string }).setName,
          condition: ctx.card.condition || undefined,
          language: (ctx.card as { language?: string }).language,
          foil: Boolean((ctx.card as { foil?: boolean }).foil),
          signed: Boolean((ctx.card as { signed?: boolean }).signed),
          altered: Boolean((ctx.card as { altered?: boolean }).altered),
          graded: Boolean((ctx.card as { graded?: boolean }).graded),
          priceCents: Math.max(0, Math.round(ctx.card.priceEur * 100)),
          source: isMarketplace ? 'marketplace' : 'cardtrader',
        });
      }
    }
    return items;
  }, [ctx, publicItems, requestedCatalog, t]);

  const lockedRequested = useMemo(() => {
    if (ctx?.mode === 'counter') return new Set<string>();
    if (ctx?.requestedItems?.length) {
      return new Set(ctx.requestedItems.flatMap((item) => {
        const key = proposalItemKey(item);
        return key ? [key] : [];
      }));
    }
    if (!ctx || ctx.listing.quantity <= 0) return new Set<string>();
    const id = ctx.listing.source === 'marketplace'
      ? `marketplace:${ctx.listing.id.replace(/^mkt:/, '')}`
      : `sync:${ctx.listing.id.replace(/^sync:/, '')}`;
    return new Set([id]);
  }, [ctx]);

  const offeredPayload = useMemo(() => toTradeItems(offered, myItems), [myItems, offered]);
  const requestedPayload = useMemo(() => toTradeItems(requested, otherItems), [otherItems, requested]);
  const offeredCount = offeredPayload.reduce((sum, item) => sum + item.quantity, 0);
  const requestedCount = requestedPayload.reduce((sum, item) => sum + item.quantity, 0);
  const offeredCardsValueCents = useMemo(() => selectedValueCents(offered, myItems), [myItems, offered]);
  const requestedCardsValueCents = useMemo(() => selectedValueCents(requested, otherItems), [otherItems, requested]);
  const offeredCashCents = privateCashSide === 'offered' ? privateCashCents : 0;
  const requestedCashCents = privateCashSide === 'requested' ? privateCashCents : 0;
  const offeredValueCents = offeredCardsValueCents + offeredCashCents;
  const requestedValueCents = requestedCardsValueCents + requestedCashCents;
  const canSubmit = Boolean(ctx && offeredPayload.length && requestedPayload.length);
  const busy = createTrade.isPending || counterTrade.isPending;

  const submit = async () => {
    if (!ctx || !canSubmit || busy) return;
    setSubmitError(null);
    const privateCashNote = privateCashCents > 0 && privateCashSide !== 'none'
      ? t(
          privateCashSide === 'offered'
            ? 'trades.privateCash.messageOffered'
            : 'trades.privateCash.messageRequested',
          { amount: formatEurCents(privateCashCents, locale) },
        )
      : '';
    const submittedMessage = [message.trim(), privateCashNote].filter(Boolean).join('\n\n');
    const common = {
      offered: offeredPayload,
      requested: requestedPayload,
      message: submittedMessage || undefined,
      offered_credits_cents: 0 as const,
      requested_credits_cents: 0 as const,
    };
    try {
      const response = isCounter && ctx.parentTradeId
        ? await counterTrade.mutateAsync({ tradeId: ctx.parentTradeId, input: common })
        : await createTrade.mutateAsync({ ...common, receiver_id: ctx.listing.sellerId, delivery_method: 'direct' });
      clearTradeProposalContext();
      router.replace(`/scambi/${response.data.id}`);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : t('trades.actionError'));
    }
  };

  if (!hydrated) return <ScambiShell className="min-h-[60vh]">{null}</ScambiShell>;
  if (!ctx) {
    return (
      <ScambiShell>
        <div className="container-content flex min-h-[65vh] items-center justify-center py-12">
          <div className={cn(scambiGlass, 'flex max-w-lg flex-col items-center rounded-[2rem] p-8 text-center')}>
            <h1 className="mt-5 text-xl font-black uppercase text-white">{t('trades.noSelection')}</h1>
            <p className="mt-2 text-sm text-white/60">{t('trades.selectRealListing')}</p>
            <button type="button" onClick={() => router.push('/scambi')} className="mt-6 rounded-full bg-white px-5 py-2.5 text-sm font-black text-[#1D3160]">{t('trades.back')}</button>
          </div>
        </div>
      </ScambiShell>
    );
  }

  const steps: Array<{ id: ProposalStep; label: string; ready: boolean }> = [
    { id: 'cards', label: t('trades.stepCards'), ready: offeredCount > 0 && requestedCount > 0 },
    { id: 'review', label: t('trades.stepSend'), ready: canSubmit },
  ];
  const activeStepIndex = steps.findIndex((item) => item.id === step);
  const goToStep = (nextStep: ProposalStep) => {
    const currentIndex = PROPOSAL_STEP_ORDER.indexOf(step);
    const nextIndex = PROPOSAL_STEP_ORDER.indexOf(nextStep);
    setStepDirection(nextIndex >= currentIndex ? 'forward' : 'backward');
    focusNextStepRef.current = true;
    setStep(nextStep);
  };
  const stepMotionClass = stepDirection === 'forward'
    ? 'slide-in-from-right-3'
    : 'slide-in-from-left-3';
  const selectedOfferedItems = myItems.filter((item) => offered[item.id]);
  const selectedRequestedItems = otherItems.filter((item) => requested[item.id]);

  return (
    <ScambiShell>
      <div className="container-content mx-auto max-w-6xl pb-20 pt-6 md:pt-8">
        <button type="button" onClick={() => router.back()} className="mb-4 inline-flex items-center gap-2 text-sm font-bold text-white/60 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40">
          <ArrowLeft className="h-4 w-4" /> {t('trades.back')}
        </button>

        <section className={cn(scambiGlass, 'animate-in overflow-hidden rounded-[1.75rem] fade-in slide-in-from-bottom-2 duration-500 motion-reduce:animate-none')}>
          <div className="flex flex-col gap-5 p-5 sm:p-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <p className="text-xs font-bold text-white/55">{t('trades.withUser', { user: ctx.seller.name })}</p>
              <h1 className="mt-2 text-2xl font-black uppercase tracking-tight text-white sm:text-3xl">
                {isCounter ? t('trades.counterTitle') : t('trades.proposeTitle')}
              </h1>
            </div>

            <nav aria-label={t('trades.progressLabel')}>
              <div className="relative overflow-hidden rounded-xl border border-white/10 bg-white/[0.045] p-1 backdrop-blur-md">
                <span className="pointer-events-none absolute inset-1" aria-hidden>
                  <span
                    className="block h-full w-1/2 rounded-lg bg-white shadow-sm transition-transform duration-300 ease-out motion-reduce:transition-none"
                    style={{ transform: `translateX(${activeStepIndex * 100}%)` }}
                  />
                </span>
                <div className="relative grid grid-cols-2">
                  {steps.map(({ id, label, ready }, index) => {
                    const active = step === id;
                    const accessible = index <= activeStepIndex || (index === 1 && steps[0].ready);
                    return (
                      <button
                        key={id}
                        type="button"
                        disabled={!accessible}
                        onClick={() => goToStep(id)}
                        aria-current={active ? 'step' : undefined}
                        className={cn(
                          'relative min-w-0 rounded-lg px-2.5 py-2.5 text-left outline-none transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-[#FF8A26]/60 sm:min-w-32 sm:px-3',
                          active ? 'text-[#1D3160]' : 'text-white/50 hover:text-white disabled:cursor-default disabled:opacity-40',
                        )}
                      >
                        <span className={cn('block text-[10px] font-black uppercase tracking-[0.14em]', active ? 'text-[#FF7300]' : ready ? 'text-emerald-300' : 'text-white/35')}>
                          {ready && index < activeStepIndex ? <Check className="h-3 w-3" strokeWidth={3} aria-hidden /> : `0${index + 1}`}
                        </span>
                        <span className="mt-0.5 block truncate text-[10px] font-black uppercase tracking-wide sm:text-[11px]">{label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </nav>
          </div>

          <div className="border-t border-white/10 bg-[#071226]/14 p-4 sm:p-6">
            {(inventory.loading || publicCollection.isLoading) && (
              <div className="mb-4 flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.06] p-3 text-sm text-white/60" role="status">
                <Loader2 className="h-4 w-4 animate-spin text-[#FF8A26]" aria-hidden /> {t('trades.loadingInventory')}
              </div>
            )}
            {(inventory.isError || publicCollection.isError) && (
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-red-300/20 bg-red-400/10 p-3 text-sm text-red-100" role="alert">
                <span>{t('trades.inventoryLoadError')}</span>
                <button
                  type="button"
                  onClick={() => {
                    if (inventory.isError) void inventory.refetchInventory();
                    if (publicCollection.isError) void publicCollection.refetch();
                  }}
                  className="rounded-lg bg-white/10 px-3 py-1.5 text-xs font-black uppercase tracking-wide transition-colors hover:bg-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
                >
                  {t('trades.retry')}
                </button>
              </div>
            )}

            <div ref={stepPanelRef} tabIndex={-1} className="outline-none">
              {step === 'cards' && (
              <div className={cn('animate-in fade-in duration-300 motion-reduce:animate-none', stepMotionClass)}>
                <TradeProposalTable
                  offeredItems={selectedOfferedItems}
                  requestedItems={selectedRequestedItems}
                  offered={offered}
                  requested={requested}
                  offeredValueCents={offeredValueCents}
                  requestedValueCents={requestedValueCents}
                  offeredCashCents={offeredCashCents}
                  requestedCashCents={requestedCashCents}
                  otherName={ctx.seller.name}
                  cashSide={privateCashSide}
                  cashCents={privateCashCents}
                  onCashSideChange={setPrivateCashSide}
                  onCashAmountChange={setPrivateCashCents}
                />

                {/* Mobile Tab Switcher */}
                <div className="mb-3 grid grid-cols-2 gap-1 rounded-xl border border-white/10 bg-black/25 p-1 md:hidden">
                  <button
                    type="button"
                    onClick={() => setMobileTab('offered')}
                    className={cn(
                      'flex items-center justify-center gap-1.5 rounded-lg py-2.5 text-center text-xs font-black uppercase tracking-wide transition-colors',
                      mobileTab === 'offered'
                        ? 'bg-[#FF7300] text-white shadow-sm'
                        : 'text-white/50 hover:bg-white/[0.06] hover:text-white',
                    )}
                  >
                    <span>{t('trades.chooseOffered')}</span>
                    {offeredCount > 0 && (
                      <span className="rounded-full bg-white/20 px-1.5 py-0.2 text-[9px] font-black text-white">
                        {offeredCount}
                      </span>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => setMobileTab('requested')}
                    className={cn(
                      'flex items-center justify-center gap-1.5 rounded-lg py-2.5 text-center text-xs font-black uppercase tracking-wide transition-colors',
                      mobileTab === 'requested'
                        ? 'bg-[#FF7300] text-white shadow-sm'
                        : 'text-white/50 hover:bg-white/[0.06] hover:text-white',
                    )}
                  >
                    <span>{t('trades.chooseRequested')}</span>
                    {requestedCount > 0 && (
                      <span className="rounded-full bg-white/20 px-1.5 py-0.2 text-[9px] font-black text-white">
                        {requestedCount}
                      </span>
                    )}
                  </button>
                </div>

                {/* 2 Inventories Side by Side on the exact same row */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-stretch">
                  <div className={cn(mobileTab === 'offered' ? 'block' : 'hidden md:block', 'h-full min-w-0')}>
                    <ItemPicker
                      title={t('trades.chooseOffered')}
                      empty={t('trades.noTradableInventory')}
                      items={myItems}
                      selected={offered}
                      onChange={setOffered}
                      totalCount={myItems.length}
                    />
                  </div>
                  <div className={cn(mobileTab === 'requested' ? 'block' : 'hidden md:block', 'h-full min-w-0')}>
                    <ItemPicker
                      title={t('trades.chooseRequested')}
                      empty={t('trades.noRequestedInventory')}
                      items={otherItems}
                      selected={requested}
                      locked={lockedRequested}
                      onChange={setRequested}
                      totalCount={isCounter ? otherItems.length : Math.max(publicTotal, otherItems.length)}
                      hasMore={Boolean(publicCollection.hasNextPage)}
                      loadingMore={publicCollection.isFetchingNextPage}
                      onLoadMore={() => { void publicCollection.fetchNextPage(); }}
                    />
                  </div>
                </div>
                <div className="mt-5 flex justify-end">
                  <button
                    type="button"
                    disabled={!steps[0].ready}
                    onClick={() => goToStep('review')}
                    className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-xs font-black uppercase tracking-wide text-[#1D3160] shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF8A26]/60 disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-white/30 disabled:shadow-none motion-reduce:transform-none"
                  >
                    {t('trades.continue')} <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
              )}

              {step === 'review' && (
              <form
                className={cn('mx-auto max-w-4xl animate-in fade-in duration-300 motion-reduce:animate-none', stepMotionClass)}
                onSubmit={(event) => {
                  event.preventDefault();
                  void submit();
                }}
              >
                <div className="grid gap-4 md:grid-cols-2">
                  {[
                    { label: t('trades.youOffer'), items: selectedOfferedItems, quantities: offered, count: offeredCount, valueCents: offeredValueCents, cashCents: offeredCashCents },
                    { label: t('trades.youReceive'), items: selectedRequestedItems, quantities: requested, count: requestedCount, valueCents: requestedValueCents, cashCents: requestedCashCents },
                  ].map((group) => (
                    <section key={group.label} className="rounded-[1.3rem] border border-white/10 bg-white/[0.05] p-4">
                      <div className="flex items-center justify-between gap-3">
                        <h2 className="text-sm font-black uppercase tracking-wide text-white">{group.label}</h2>
                        <span className="rounded-full bg-white/10 px-2.5 py-1 text-[10px] font-black text-white/60">
                          {t('trades.cardsCount', { count: group.count })} · {formatEurCents(group.valueCents, locale)}
                        </span>
                      </div>
                      <div className="mt-3 space-y-2">
                        {group.items.map((item) => (
                          <div key={item.id} className="flex items-center gap-3 rounded-xl border border-white/10 bg-[#09152E]/35 p-2">
                            <TradeCardThumb image={item.image} name={item.name} className="h-12 w-[35px] shrink-0" />
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-bold text-white">{item.name}</p>
                              <p className="truncate text-[11px] text-white/40">{item.setName}</p>
                            </div>
                            <span className="rounded-full bg-white/10 px-2 py-1 text-xs font-black text-white">× {group.quantities[item.id]}</span>
                          </div>
                        ))}
                        {group.cashCents > 0 && (
                          <div className="flex items-center gap-3 rounded-xl border border-amber-200/20 bg-amber-300/10 p-2.5 text-amber-100">
                            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-300/15">
                              <Coins className="h-5 w-5" aria-hidden />
                            </span>
                            <div className="min-w-0 flex-1">
                              <p className="text-xs font-black uppercase tracking-wide">{t('trades.privateCash.privateAgreement')}</p>
                              <p className="text-[10px] text-amber-50/55">{t('trades.privateCash.notProcessed')}</p>
                            </div>
                            <span className="text-sm font-black tabular-nums">{formatEurCents(group.cashCents, locale)}</span>
                          </div>
                        )}
                      </div>
                    </section>
                  ))}
                </div>

                <div className="mt-4 rounded-[1.3rem] border border-white/10 bg-white/[0.05] p-4">
                  <label className="block text-[10px] font-black uppercase tracking-wide text-white/50">
                    {t('trades.message')}
                    <textarea value={message} maxLength={1000} onChange={(event) => setMessage(event.target.value)} className="mt-1.5 min-h-24 w-full rounded-xl border border-white/10 bg-white/[0.07] p-3 text-sm font-semibold normal-case tracking-normal text-white outline-none transition-all duration-200 hover:bg-white/[0.10] focus:border-[#FF8A26]/60 focus:bg-white/[0.12] focus:ring-2 focus:ring-[#FF7300]/15" />
                  </label>
                  <p className="mt-1 text-right text-[10px] font-semibold tabular-nums text-white/35">{message.length}/1000</p>
                </div>

                {privateCashCents > 0 && privateCashSide !== 'none' && (
                  <div className="mt-4 flex items-start gap-3 rounded-[1.3rem] border border-amber-200/20 bg-amber-300/10 p-4 text-amber-50">
                    <Coins className="mt-0.5 h-5 w-5 shrink-0 text-amber-300" aria-hidden />
                    <p className="text-xs font-semibold leading-relaxed">{t('trades.privateCash.warning')}</p>
                  </div>
                )}

                <div className="mt-4 flex items-start gap-3 rounded-[1.3rem] border border-sky-200/20 bg-sky-300/10 p-4 text-sky-50">
                  <Clock3 className="mt-0.5 h-5 w-5 shrink-0 text-sky-300" aria-hidden />
                  <div>
                    <p className="text-xs font-black uppercase tracking-wide">{t('trades.expiry48Title')}</p>
                    <p className="mt-1 text-xs leading-relaxed text-sky-50/65">{t('trades.expiry48Notice')}</p>
                  </div>
                </div>

                <p className="mt-4 text-center text-[11px] leading-relaxed text-white/45">{t('trades.directOnly')}</p>
                {submitError && <p className="mt-4 rounded-xl border border-red-300/20 bg-red-400/15 p-3 text-xs text-red-100" role="alert">{submitError}</p>}
                <div className="mt-5 flex items-center justify-between gap-3">
                  <button type="button" onClick={() => goToStep('cards')} className="rounded-xl border border-white/10 px-4 py-3 text-xs font-black uppercase tracking-wide text-white/60 transition-colors hover:bg-white/[0.06] hover:text-white">
                    {t('trades.previous')}
                  </button>
                  <button
                    type="submit"
                    disabled={!canSubmit || busy}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#FF8A26] to-[#FF7300] px-6 py-3.5 text-xs font-black uppercase tracking-wide text-white shadow-md shadow-[#FF7300]/15 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-40 motion-reduce:transform-none"
                  >
                    {busy ? <Loader2 className="h-5 w-5 animate-spin" /> : <>
                      {isCounter ? t('trades.sendCounter') : t('trades.sendProposal')}
                      <Send className="h-4 w-4" />
                    </>}
                  </button>
                </div>
              </form>
              )}
            </div>
          </div>
        </section>
      </div>
    </ScambiShell>
  );
}
