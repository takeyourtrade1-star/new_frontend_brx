'use client';

import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import type { InventoryItemWithCatalog } from '@/lib/sync/inventory-types';

export const INVENTORY_CONDITION_OPTIONS = [
  'Mint',
  'Near Mint',
  'Excellent',
  'Good',
  'Light Played',
  'Played',
  'Poor',
];

export const INVENTORY_LANG_OPTIONS_EDIT = [
  { code: 'en', label: 'English' },
  { code: 'it', label: 'Italiano' },
  { code: 'de', label: 'Deutsch' },
  { code: 'fr', label: 'Français' },
  { code: 'es', label: 'Español' },
  { code: 'pt', label: 'Português' },
  { code: 'ja', label: '日本語' },
];

const fieldClass =
  'w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm placeholder:text-gray-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/25';

export function parseInventoryPriceCents(value: string): number | null {
  const normalized = value.trim().replace(/\s+/g, '').replace(',', '.');
  if (!/^\d+(?:\.\d{0,2})?$/.test(normalized)) return null;

  const price = Number(normalized);
  if (!Number.isFinite(price)) return null;

  return Math.round(price * 100);
}

export function InventoryEditModal({
  item,
  onClose,
  onSubmit,
  saving,
  conditionOptions = INVENTORY_CONDITION_OPTIONS,
  langOptions = INVENTORY_LANG_OPTIONS_EDIT,
}: {
  item: InventoryItemWithCatalog;
  onClose: () => void;
  onSubmit: (form: {
    quantity: number;
    price_cents: number;
    condition: string;
    mtg_language: string;
    description: string;
    graded: boolean;
    signed?: boolean;
    altered?: boolean;
    mtg_foil?: boolean;
  }) => void;
  saving: boolean;
  conditionOptions?: string[];
  langOptions?: { code: string; label: string }[];
}) {
  const props = item.properties as Record<string, unknown> | undefined;
  const [quantity, setQuantity] = useState(item.quantity);
  const [priceEuro, setPriceEuro] = useState((item.price_cents / 100).toFixed(2));
  const [condition, setCondition] = useState(
    (typeof props?.condition === 'string' ? props.condition : '') || conditionOptions[0] || ''
  );
  const [mtgLanguage, setMtgLanguage] = useState(
    (typeof props?.mtg_language === 'string' ? props.mtg_language : '') || 'en'
  );
  const [description, setDescription] = useState(item.description ?? '');
  const [graded, setGraded] = useState(!!item.graded);
  const [signed, setSigned] = useState(!!props?.signed);
  const [altered, setAltered] = useState(!!props?.altered);
  const [mtgFoil, setMtgFoil] = useState(!!props?.mtg_foil);
  const [priceError, setPriceError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const priceCents = parseInventoryPriceCents(priceEuro);
    if (priceCents === null) {
      setPriceError('Inserisci un prezzo valido con al massimo due decimali.');
      return;
    }
    setPriceError(null);
    onSubmit({
      quantity,
      price_cents: priceCents,
      condition,
      mtg_language: mtgLanguage,
      description,
      graded,
      signed,
      altered,
      mtg_foil: mtgFoil,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" role="dialog" aria-modal="true" aria-labelledby="edit-modal-title">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-gray-200 bg-white text-gray-900 shadow-xl">
        <div className="sticky top-0 z-[1] rounded-t-2xl border-b border-gray-200 bg-white px-4 py-3">
          <h2 id="edit-modal-title" className="text-lg font-semibold text-gray-900">
            Modifica oggetto
          </h2>
          <p className="text-sm text-gray-600">
            {item.card?.name ?? `Carta #${item.blueprint_id}`}
          </p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4 p-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Quantità</label>
              <input
                type="number"
                min={0}
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value) || 0)}
                className={fieldClass}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Prezzo (€)</label>
              <input
                type="text"
                inputMode="decimal"
                value={priceEuro}
                onChange={(e) => {
                  setPriceEuro(e.target.value);
                  if (priceError) setPriceError(null);
                }}
                aria-invalid={priceError ? true : undefined}
                aria-describedby={priceError ? 'inventory-edit-price-error' : undefined}
                className={fieldClass}
              />
              {priceError ? (
                <p id="inventory-edit-price-error" className="mt-1 text-xs font-medium text-red-600">
                  {priceError}
                </p>
              ) : null}
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Condizione</label>
            <select value={condition} onChange={(e) => setCondition(e.target.value)} className={fieldClass}>
              <option value="">—</option>
              {conditionOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Lingua</label>
            <select value={mtgLanguage} onChange={(e) => setMtgLanguage(e.target.value)} className={fieldClass}>
              {langOptions.map((opt) => (
                <option key={opt.code} value={opt.code}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Descrizione</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className={fieldClass}
            />
          </div>
          <div className="flex flex-wrap gap-4">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={graded}
                onChange={(e) => setGraded(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary/30"
              />
              <span className="text-sm text-gray-700">Graded</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={mtgFoil}
                onChange={(e) => setMtgFoil(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary/30"
              />
              <span className="text-sm text-gray-700">Foil</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={signed}
                onChange={(e) => setSigned(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary/30"
              />
              <span className="text-sm text-gray-700">Firmata</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={altered}
                onChange={(e) => setAltered(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary/30"
              />
              <span className="text-sm text-gray-700">Alterata</span>
            </label>
          </div>
          <div className="flex justify-end gap-2 border-t border-gray-200 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50"
            >
              Annulla
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-primary/90 disabled:opacity-50"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
              {saving ? 'Salvataggio...' : 'Salva'}
            </button>
          </div>
        </form>
      </div>
      <button type="button" onClick={onClose} className="absolute inset-0 -z-10" aria-label="Chiudi" />
    </div>
  );
}
