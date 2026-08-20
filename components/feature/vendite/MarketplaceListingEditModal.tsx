'use client';

import { useState } from 'react';
import { Loader2, X } from 'lucide-react';
import { sanitizePriceInput } from '@/lib/marketplace/sell-single-draft';

const fieldClass =
  'w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/25';

export type MarketplaceListingEditTarget = {
  id: string;
  title: string;
  price: string;
  quantity: number;
};

export function MarketplaceListingEditModal({
  listing,
  onClose,
  onSubmit,
  saving,
}: {
  listing: MarketplaceListingEditTarget;
  onClose: () => void;
  onSubmit: (form: { price: number; quantity: number }) => void | Promise<void>;
  saving: boolean;
}) {
  const [priceEuro, setPriceEuro] = useState(() => {
    const n = Number.parseFloat(listing.price);
    return Number.isFinite(n) ? n.toFixed(2) : '0.00';
  });
  const [quantity, setQuantity] = useState(listing.quantity);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const price = Number.parseFloat(priceEuro.replace(',', '.'));
    if (!Number.isFinite(price) || price < 0) return;
    void onSubmit({ price, quantity: Math.max(0, quantity) });
  };

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 p-4"
      role="presentation"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="mkt-listing-edit-title"
        className="w-full max-w-md rounded-xl border border-gray-200 bg-white p-5 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <h2 id="mkt-listing-edit-title" className="text-lg font-bold text-gray-900">
            Modifica inserzione
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded p-1 text-gray-500 hover:bg-gray-100"
            aria-label="Chiudi"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <p className="mb-4 truncate text-sm text-gray-600">{listing.title}</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="block text-sm font-medium text-gray-700">
            Prezzo (€)
            <input
              type="text"
              inputMode="decimal"
              value={priceEuro}
              onChange={(e) => setPriceEuro(sanitizePriceInput(e.target.value))}
              className={`${fieldClass} mt-1`}
              required
            />
          </label>
          <label className="block text-sm font-medium text-gray-700">
            Quantità
            <input
              type="number"
              min={0}
              max={9999}
              value={quantity}
              onChange={(e) => setQuantity(Number.parseInt(e.target.value, 10) || 0)}
              className={`${fieldClass} mt-1`}
              required
            />
          </label>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              Annulla
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-bold text-white hover:bg-primary/90 disabled:opacity-50"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
              Salva
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
