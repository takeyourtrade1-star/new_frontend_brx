'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Minus,
  Plus,
  Search,
  TrendingDown,
  TrendingUp,
  X,
} from 'lucide-react';
import type { InventoryItemWithCatalog } from '@/lib/sync/inventory-types';
import { matchInventorySearch } from '@/lib/inventory/inventory-filter-utils';
import { formatEurCents } from '@/lib/utils';
import { useTranslation } from '@/lib/i18n/useTranslation';
import type { MessageKey } from '@/lib/i18n/messages/en';

type ScopeMode = 'all' | 'manual';
type PlatformMode = 'ebartex' | 'all';

interface BulkPriceWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
  filteredInventoryItems: InventoryItemWithCatalog[];
  onApply: (
    ids: number[],
    operation: '+' | '-',
    percent: number,
    platform: PlatformMode
  ) => void;
}

const STEPS: MessageKey[] = [
  'accountPage.bulkPriceStepScope',
  'accountPage.bulkPriceStepPick',
  'accountPage.bulkPriceStepPlatform',
  'accountPage.bulkPriceStepPercent',
  'accountPage.bulkPriceStepConfirm',
];

export function BulkPriceWizardModal({
  isOpen,
  onClose,
  filteredInventoryItems,
  onApply,
}: BulkPriceWizardModalProps) {
  const { t } = useTranslation();
  const [step, setStep] = useState(0);
  const [scope, setScope] = useState<ScopeMode>('all');
  const [wizardSelectedIds, setWizardSelectedIds] = useState<Set<number>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [platform, setPlatform] = useState<PlatformMode>('ebartex');
  const [operation, setOperation] = useState<'+' | '-'>('+');
  const [percent, setPercent] = useState(10);

  const reset = useCallback(() => {
    setStep(0);
    setScope('all');
    setWizardSelectedIds(new Set());
    setSearchQuery('');
    setPlatform('ebartex');
    setOperation('+');
    setPercent(10);
  }, []);

  useEffect(() => {
    if (!isOpen) {
      reset();
      return;
    }
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, reset]);

  const effectiveIds = useMemo(() => {
    if (scope === 'all') {
      return new Set(filteredInventoryItems.map((i) => i.id));
    }
    return wizardSelectedIds;
  }, [scope, filteredInventoryItems, wizardSelectedIds]);

  const searchResults = useMemo(() => {
    const q = searchQuery.trim();
    if (!q) return [];
    return filteredInventoryItems.filter((item) => matchInventorySearch(item, q)).slice(0, 50);
  }, [filteredInventoryItems, searchQuery]);

  const visibleSteps = useMemo(() => {
    if (scope === 'all') {
      return STEPS.filter((_, i) => i !== 1);
    }
    return STEPS;
  }, [scope]);

  const currentStepKey = visibleSteps[step] ?? STEPS[0];

  const toggleWizardSelect = (id: number) => {
    setWizardSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const canGoNext = (): boolean => {
    switch (currentStepKey) {
      case 'accountPage.bulkPriceStepScope':
        return scope === 'all' || scope === 'manual';
      case 'accountPage.bulkPriceStepPick':
        return wizardSelectedIds.size > 0;
      case 'accountPage.bulkPriceStepPlatform':
        return true;
      case 'accountPage.bulkPriceStepPercent':
        return percent >= 1 && percent <= 99;
      default:
        return true;
    }
  };

  const handleNext = () => {
    if (currentStepKey === 'accountPage.bulkPriceStepScope' && scope === 'all') {
      setWizardSelectedIds(new Set(filteredInventoryItems.map((i) => i.id)));
    }
    if (step < visibleSteps.length - 1) {
      setStep((s) => s + 1);
    }
  };

  const handleBack = () => {
    if (step > 0) setStep((s) => s - 1);
  };

  const handleConfirm = () => {
    const ids = Array.from(effectiveIds);
    if (ids.length === 0) return;
    onApply(ids, operation, percent, platform);
    onClose();
  };

  if (!isOpen) return null;

  const count = effectiveIds.size;
  const factor = operation === '+' ? 1 + percent / 100 : 1 - percent / 100;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="bulk-price-wizard-title"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-xl overflow-hidden rounded-2xl border border-white/20 bg-white/95 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.3)] backdrop-blur-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 text-primary">
              <TrendingUp className="h-5 w-5" />
            </div>
            <div>
              <h2 id="bulk-price-wizard-title" className="text-base font-bold text-gray-900">
                {t('accountPage.bulkPriceWizardTitle')}
              </h2>
              <p className="text-xs text-gray-500">
                {t(currentStepKey)} · {step + 1}/{visibleSteps.length}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-gray-400 transition-all hover:bg-gray-100 hover:text-gray-600"
            aria-label={t('accountPage.itemsClose')}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex gap-1 px-6 pt-4">
          {visibleSteps.map((_, i) => (
            <div
              key={i}
              className={`h-1 flex-1 rounded-full transition-colors ${
                i <= step ? 'bg-primary' : 'bg-gray-200'
              }`}
            />
          ))}
        </div>

        <div className="max-h-[60vh] overflow-y-auto p-6">
          {currentStepKey === 'accountPage.bulkPriceStepScope' && (
            <div className="space-y-4">
              <p className="text-sm text-gray-700">{t('accountPage.bulkPriceScopeQuestion')}</p>
              <div className="grid gap-3">
                <label
                  className={`flex cursor-pointer flex-col gap-1 rounded-xl border p-4 transition-all ${
                    scope === 'all'
                      ? 'border-primary bg-primary/5 shadow-sm'
                      : 'border-gray-200 hover:border-primary/40'
                  }`}
                >
                  <input
                    type="radio"
                    name="bulk-price-scope"
                    checked={scope === 'all'}
                    onChange={() => setScope('all')}
                    className="sr-only"
                  />
                  <span className="text-sm font-semibold text-gray-900">
                    {t('accountPage.bulkPriceScopeAll')}
                  </span>
                  <span className="text-xs text-gray-500">
                    {filteredInventoryItems.length.toLocaleString()} {t('accountPage.itemsItemsInView')}
                  </span>
                </label>
                <label
                  className={`flex cursor-pointer flex-col gap-1 rounded-xl border p-4 transition-all ${
                    scope === 'manual'
                      ? 'border-primary bg-primary/5 shadow-sm'
                      : 'border-gray-200 hover:border-primary/40'
                  }`}
                >
                  <input
                    type="radio"
                    name="bulk-price-scope"
                    checked={scope === 'manual'}
                    onChange={() => {
                      setScope('manual');
                      setWizardSelectedIds(new Set());
                    }}
                    className="sr-only"
                  />
                  <span className="text-sm font-semibold text-gray-900">
                    {t('accountPage.bulkPriceScopeManual')}
                  </span>
                  <span className="text-xs text-gray-500">{t('accountPage.bulkPricePickHint')}</span>
                </label>
              </div>
            </div>
          )}

          {currentStepKey === 'accountPage.bulkPriceStepPick' && (
            <div className="space-y-4">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t('accountPage.bulkPriceSearchPlaceholder')}
                  className="h-11 w-full rounded-xl border border-gray-200 bg-white pl-10 pr-4 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
              {wizardSelectedIds.size > 0 && (
                <p className="text-xs font-medium text-primary">
                  {t('accountPage.bulkPriceSelectedCount', { count: wizardSelectedIds.size })}
                </p>
              )}
              <div className="overflow-hidden rounded-xl border border-gray-200">
                {searchQuery.trim() === '' ? (
                  <p className="px-4 py-8 text-center text-sm text-gray-500">
                    {t('accountPage.bulkPriceSearchHint')}
                  </p>
                ) : searchResults.length === 0 ? (
                  <p className="px-4 py-8 text-center text-sm text-gray-500">
                    {t('accountPage.itemsNoResults', { query: searchQuery })}
                  </p>
                ) : (
                  <ul className="max-h-64 divide-y divide-gray-100 overflow-y-auto">
                    {searchResults.map((item) => {
                      const name = item.card?.name ?? `Carta #${item.blueprint_id}`;
                      const setName = item.card?.set_name ?? '—';
                      const selected = wizardSelectedIds.has(item.id);
                      return (
                        <li key={item.id}>
                          <button
                            type="button"
                            onClick={() => toggleWizardSelect(item.id)}
                            className={`flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors hover:bg-gray-50 ${
                              selected ? 'bg-primary/5' : ''
                            }`}
                          >
                            <span
                              className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border ${
                                selected
                                  ? 'border-primary bg-primary text-white'
                                  : 'border-gray-300 bg-white'
                              }`}
                            >
                              {selected && <Check className="h-3 w-3" />}
                            </span>
                            <span className="min-w-0 flex-1 truncate text-sm font-medium text-gray-900">
                              {name}
                            </span>
                            <span className="hidden max-w-[120px] shrink-0 truncate text-xs text-gray-500 sm:block">
                              {setName}
                            </span>
                            <span className="shrink-0 text-sm font-semibold tabular-nums text-gray-700">
                              {formatEurCents(item.price_cents ?? 0)}
                            </span>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            </div>
          )}

          {currentStepKey === 'accountPage.bulkPriceStepPlatform' && (
            <div className="space-y-4">
              <p className="text-sm text-gray-700">{t('accountPage.bulkPricePlatformQuestion')}</p>
              <div className="grid gap-3">
                <label
                  className={`flex cursor-pointer flex-col gap-1 rounded-xl border p-4 transition-all ${
                    platform === 'ebartex'
                      ? 'border-primary bg-primary/5 shadow-sm'
                      : 'border-gray-200 hover:border-primary/40'
                  }`}
                >
                  <input
                    type="radio"
                    name="bulk-price-platform"
                    checked={platform === 'ebartex'}
                    onChange={() => setPlatform('ebartex')}
                    className="sr-only"
                  />
                  <span className="text-sm font-semibold text-gray-900">
                    {t('accountPage.bulkPricePlatformEbartex')}
                  </span>
                </label>
                <label
                  className={`flex cursor-pointer flex-col gap-1 rounded-xl border p-4 transition-all ${
                    platform === 'all'
                      ? 'border-primary bg-primary/5 shadow-sm'
                      : 'border-gray-200 hover:border-primary/40'
                  }`}
                >
                  <input
                    type="radio"
                    name="bulk-price-platform"
                    checked={platform === 'all'}
                    onChange={() => setPlatform('all')}
                    className="sr-only"
                  />
                  <span className="text-sm font-semibold text-gray-900">
                    {t('accountPage.bulkPricePlatformAll')}
                  </span>
                  <span className="text-xs text-gray-500">{t('accountPage.bulkPricePlatformAllHint')}</span>
                </label>
              </div>
            </div>
          )}

          {currentStepKey === 'accountPage.bulkPriceStepPercent' && (
            <div className="space-y-5">
              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-700">
                  {t('accountPage.itemsPriceChangePercent')}
                </label>
                <div className="inline-flex gap-1 rounded-xl border border-gray-200 bg-gray-50 p-1">
                  <button
                    type="button"
                    onClick={() => setOperation('+')}
                    className={`inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold transition-all ${
                      operation === '+' ? 'bg-emerald-500 text-white shadow-sm' : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    <TrendingUp className="h-4 w-4" />
                    {t('accountPage.itemsPriceIncrease')}
                  </button>
                  <button
                    type="button"
                    onClick={() => setOperation('-')}
                    className={`inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold transition-all ${
                      operation === '-' ? 'bg-red-500 text-white shadow-sm' : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    <TrendingDown className="h-4 w-4" />
                    {t('accountPage.itemsPriceDecrease')}
                  </button>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setPercent((p) => Math.max(1, p - 1))}
                  className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-600 shadow-sm transition-all hover:bg-gray-50"
                >
                  <Minus className="h-5 w-5" />
                </button>
                <div className="relative flex-1">
                  <input
                    type="number"
                    min={1}
                    max={99}
                    value={percent}
                    onChange={(e) => {
                      const v = Math.min(99, Math.max(1, Number(e.target.value) || 1));
                      setPercent(v);
                    }}
                    className={`h-12 w-full rounded-xl border bg-white pr-10 text-center text-2xl font-bold shadow-sm focus:outline-none focus:ring-2 ${
                      operation === '+'
                        ? 'border-emerald-200 text-emerald-600 focus:border-emerald-400 focus:ring-emerald-400/20'
                        : 'border-red-200 text-red-600 focus:border-red-400 focus:ring-red-400/20'
                    }`}
                  />
                  <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-2xl font-bold text-gray-400">
                    %
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setPercent((p) => Math.min(99, p + 1))}
                  className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-600 shadow-sm transition-all hover:bg-gray-50"
                >
                  <Plus className="h-5 w-5" />
                </button>
              </div>
              <p className="rounded-xl bg-primary/5 px-4 py-3 text-sm font-medium text-primary">
                {t('accountPage.bulkPricePreviewCount', { count })}
              </p>
              <p className="text-xs text-gray-500">
                {t('accountPage.bulkPriceFormulaHint', {
                  sign: operation === '+' ? '+' : '−',
                  pct: percent,
                  example: formatEurCents(Math.round(1000 * factor)),
                })}
              </p>
            </div>
          )}

          {currentStepKey === 'accountPage.bulkPriceStepConfirm' && (
            <div className="space-y-4">
              <p className="text-sm font-semibold text-gray-900">{t('accountPage.bulkPriceConfirmQuestion')}</p>
              <dl className="space-y-3 rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm">
                <div className="flex justify-between gap-4">
                  <dt className="text-gray-500">{t('accountPage.bulkPriceSummaryScope')}</dt>
                  <dd className="text-right font-medium text-gray-900">
                    {scope === 'all'
                      ? t('accountPage.bulkPriceSummaryScopeAll')
                      : t('accountPage.bulkPriceSummaryScopeManual')}
                  </dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-gray-500">{t('accountPage.bulkPriceSummaryCount')}</dt>
                  <dd className="font-medium text-gray-900">{count}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-gray-500">{t('accountPage.bulkPriceSummaryPercent')}</dt>
                  <dd className="font-medium text-gray-900">
                    {operation === '+' ? '+' : '−'}
                    {percent}%
                  </dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-gray-500">{t('accountPage.bulkPriceSummaryPlatform')}</dt>
                  <dd className="text-right font-medium text-gray-900">
                    {platform === 'ebartex'
                      ? t('accountPage.bulkPricePlatformEbartex')
                      : t('accountPage.bulkPricePlatformAll')}
                  </dd>
                </div>
              </dl>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-gray-100 bg-gray-50/50 px-6 py-4">
          <button
            type="button"
            onClick={step === 0 ? onClose : handleBack}
            className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm transition-all hover:bg-gray-50"
          >
            {step === 0 ? (
              t('accountPage.bulkPriceCancel')
            ) : (
              <>
                <ArrowLeft className="h-4 w-4" />
                {t('accountPage.bulkPriceBack')}
              </>
            )}
          </button>
          {currentStepKey === 'accountPage.bulkPriceStepConfirm' ? (
            <button
              type="button"
              onClick={handleConfirm}
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-white shadow-sm shadow-primary/20 transition-all hover:bg-primary/90 active:scale-95"
            >
              <Check className="h-4 w-4" />
              {t('accountPage.bulkPriceConfirm')}
            </button>
          ) : (
            <button
              type="button"
              onClick={handleNext}
              disabled={!canGoNext()}
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-white shadow-sm shadow-primary/20 transition-all hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50 active:scale-95"
            >
              {t('accountPage.bulkPriceNext')}
              <ArrowRight className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
