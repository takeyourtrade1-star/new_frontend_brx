'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Image from 'next/image';
import { ArrowRight, Minus, Plus, TrendingDown, TrendingUp, X } from 'lucide-react';
import type { InventoryItemWithCatalog } from '@/lib/sync/inventory-types';
import { getCdnImageUrl } from '@/lib/config';
import { buildImageUrl, formatEurCents } from '@/lib/utils';

interface BulkPriceModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedItems: InventoryItemWithCatalog[];
  syncStatus: 'active' | 'inactive' | 'syncing';
  onApply: (operation: '+' | '-', percent: number, target: 'local' | 'cardmarket' | 'all') => void;
}

type TargetPlatform = 'local' | 'cardmarket' | 'all';

const TARGET_OPTIONS: { value: TargetPlatform; label: string; desc: string; syncOnly: boolean }[] = [
  { value: 'local', label: 'Solo inventario locale', desc: 'Nessuna sincronizzazione esterna', syncOnly: false },
  { value: 'cardmarket', label: 'Cardmarket', desc: 'Sincronizza solo su Cardmarket', syncOnly: true },
  { value: 'all', label: 'Tutti i siti collegati', desc: 'Tutte le piattaforme sync attive', syncOnly: true },
];

export function BulkPriceModal({
  isOpen,
  onClose,
  selectedItems,
  syncStatus,
  onApply,
}: BulkPriceModalProps) {
  const [operation, setOperation] = useState<'+' | '-'>('+');
  const [percent, setPercent] = useState(10);
  const [target, setTarget] = useState<TargetPlatform>('local');

  const defaultImage = getCdnImageUrl('Logo%20Principale%20EBARTEX.png');
  const syncActive = syncStatus === 'active' || syncStatus === 'syncing';

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const preview = useMemo(() => {
    return selectedItems.map((item) => {
      const currentCents = item.price_cents ?? 0;
      const factor = operation === '+' ? 1 + percent / 100 : 1 - percent / 100;
      const newCents = Math.round(currentCents * factor);
      return { item, currentCents, newCents };
    });
  }, [selectedItems, operation, percent]);

  const totalCurrent = preview.reduce((s, p) => s + p.currentCents, 0);
  const totalNew = preview.reduce((s, p) => s + p.newCents, 0);
  const totalDelta = totalNew - totalCurrent;

  const handleApply = useCallback(() => {
    onApply(operation, percent, target);
    onClose();
  }, [operation, percent, target, onApply, onClose]);

  const visibleTargets = TARGET_OPTIONS.filter((opt) => !opt.syncOnly || syncActive);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="bulk-price-modal-title"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl overflow-hidden rounded-2xl border border-white/20 bg-white/95 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.3)] backdrop-blur-xl transition-all duration-200 opacity-100 scale-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 text-primary">
              <TrendingUp className="h-5 w-5" />
            </div>
            <div>
              <h2 id="bulk-price-modal-title" className="text-base font-bold text-gray-900">
                Modifica prezzi selezionati
              </h2>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
              {selectedItems.length} carte
            </span>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-2 text-gray-400 transition-all hover:bg-gray-100 hover:text-gray-600"
              aria-label="Chiudi"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="max-h-[75vh] overflow-y-auto">
          <div className="space-y-6 p-6">
            {/* Step 1 — Configurazione */}
            <div className="space-y-5">
              {/* Operazione */}
              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-700">Operazione</label>
                <div className="inline-flex rounded-xl border border-gray-200 bg-gray-50 p-1 gap-1">
                  <button
                    type="button"
                    onClick={() => setOperation('+')}
                    className={`inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold transition-all duration-150 ${
                      operation === '+' ? 'bg-emerald-500 text-white shadow-sm' : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    <TrendingUp className="h-4 w-4" />
                    +% Aumenta
                  </button>
                  <button
                    type="button"
                    onClick={() => setOperation('-')}
                    className={`inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold transition-all duration-150 ${
                      operation === '-' ? 'bg-red-500 text-white shadow-sm' : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    <TrendingDown className="h-4 w-4" />
                    −% Diminuisci
                  </button>
                </div>
              </div>

              {/* Percentuale */}
              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-700">
                  Percentuale modifica
                </label>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setPercent((p) => Math.max(1, p - 1))}
                    className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-600 shadow-sm transition-all hover:bg-gray-50 active:scale-95"
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
                      className={`h-12 w-full rounded-xl border bg-white pr-10 text-center text-2xl font-bold shadow-sm focus:outline-none focus:ring-2 transition-all ${
                        operation === '+'
                          ? 'border-emerald-200 text-emerald-600 focus:border-emerald-400 focus:ring-emerald-400/20'
                          : 'border-red-200 text-red-600 focus:border-red-400 focus:ring-red-400/20'
                      }`}
                    />
                    <span
                      className={`pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-2xl font-bold ${
                        operation === '+' ? 'text-emerald-400' : 'text-red-400'
                      }`}
                    >
                      %
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setPercent((p) => Math.min(99, p + 1))}
                    className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-600 shadow-sm transition-all hover:bg-gray-50 active:scale-95"
                  >
                    <Plus className="h-5 w-5" />
                  </button>
                </div>
              </div>

              {/* Target piattaforme */}
              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-700">
                  Target piattaforme
                </label>
                <div className={`grid gap-2 ${visibleTargets.length === 1 ? 'grid-cols-1' : visibleTargets.length === 2 ? 'grid-cols-2' : 'grid-cols-3'}`}>
                  {visibleTargets.map((opt) => (
                    <label
                      key={opt.value}
                      className={`flex cursor-pointer flex-col gap-1 rounded-xl border p-3 transition-all ${
                        target === opt.value
                          ? 'border-primary bg-primary/5 shadow-sm'
                          : 'border-gray-200 bg-white hover:border-primary/40'
                      }`}
                    >
                      <input
                        type="radio"
                        name="bulk-price-target"
                        value={opt.value}
                        checked={target === opt.value}
                        onChange={() => setTarget(opt.value)}
                        className="sr-only"
                      />
                      <span className="text-sm font-semibold text-gray-900">{opt.label}</span>
                      <span className="text-xs text-gray-500">{opt.desc}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {/* Step 2 — Anteprima */}
            <div>
              <h3 className="mb-2 text-sm font-semibold text-gray-700">Anteprima</h3>
              <div className="overflow-hidden rounded-xl border border-gray-200">
                <div className="max-h-64 divide-y divide-gray-100 overflow-y-auto">
                  {preview.map(({ item, currentCents, newCents }) => {
                    const imgRaw = item.card?.image;
                    const imgUrl = imgRaw ? buildImageUrl(imgRaw) ?? defaultImage : defaultImage;
                    const name = item.card?.name ?? `Carta #${item.blueprint_id}`;
                    const delta = newCents - currentCents;
                    return (
                      <div key={item.id} className="flex items-center gap-3 px-3 py-2.5">
                        <div className="relative h-8 w-8 shrink-0 overflow-hidden rounded-md bg-gray-100">
                          <Image src={imgUrl} alt="" fill className="object-cover" sizes="32px" unoptimized />
                        </div>
                        <span className="min-w-0 flex-1 truncate text-sm text-gray-800">{name}</span>
                        <span className="text-xs text-gray-400 tabular-nums">{formatEurCents(currentCents)}</span>
                        <ArrowRight className="h-3.5 w-3.5 shrink-0 text-gray-300" />
                        <span
                          className={`min-w-[64px] text-right text-sm font-bold tabular-nums ${
                            delta > 0 ? 'text-emerald-600' : delta < 0 ? 'text-red-600' : 'text-gray-600'
                          }`}
                        >
                          {formatEurCents(newCents)}
                        </span>
                      </div>
                    );
                  })}
                </div>
                <div className="flex items-center justify-between border-t border-gray-200 bg-gray-50 px-3 py-2.5 text-xs font-medium text-gray-600">
                  <span>Totale valore:</span>
                  <span className="flex items-center gap-1.5">
                    <span className="text-gray-400 tabular-nums">{formatEurCents(totalCurrent)}</span>
                    <ArrowRight className="h-3 w-3 text-gray-300" />
                    <span className="font-bold text-gray-900 tabular-nums">{formatEurCents(totalNew)}</span>
                    <span
                      className={`font-semibold tabular-nums ${
                        totalDelta > 0 ? 'text-emerald-600' : totalDelta < 0 ? 'text-red-600' : 'text-gray-500'
                      }`}
                    >
                      ({totalDelta >= 0 ? '+' : ''}{formatEurCents(totalDelta)})
                    </span>
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 border-t border-gray-100 bg-gray-50/50 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-gray-200 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 shadow-sm transition-all hover:bg-gray-50"
          >
            Annulla
          </button>
          <button
            type="button"
            onClick={handleApply}
            disabled={percent === 0}
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-white shadow-sm shadow-primary/20 transition-all hover:bg-primary/90 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50 active:scale-95"
          >
            <TrendingUp className="h-4 w-4" />
            Applica a {selectedItems.length} carte
          </button>
        </div>
      </div>
    </div>
  );
}
