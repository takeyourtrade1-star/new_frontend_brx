'use client';

import { Loader2 } from 'lucide-react';
import type { ListingItem } from '@/lib/api/sync-client';
import type { MessageKey } from '@/lib/i18n/messages/en';

/**
 * Piano 1.3 — modale demo "compra ora" estratto da ProductDetailView.
 * Puramente presentazionale: riceve stato e callback dal flusso useProductCart.
 */
interface ProductDetailPurchaseModalProps {
  purchaseListing: ListingItem;
  cardName: string | undefined;
  purchaseQty: number;
  purchaseSubmitting: boolean;
  t: (key: MessageKey) => string;
  onClose: () => void;
  onQtyChange: (value: number) => void;
  onConfirm: () => void;
}

export function ProductDetailPurchaseModal({
  purchaseListing,
  cardName,
  purchaseQty,
  purchaseSubmitting,
  t,
  onClose,
  onQtyChange,
  onConfirm,
}: ProductDetailPurchaseModalProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="pd-purchase-modal-title"
    >
      <div className="w-full max-w-sm rounded-lg border border-gray-200 bg-white p-5 shadow-xl">
        <h2 id="pd-purchase-modal-title" className="mb-1 text-lg font-semibold text-gray-900">
          {t('mockCheckout.confirmOrder')}
        </h2>
        <div className="mb-3 rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-xs text-blue-900">
          <span className="mr-1 inline-flex rounded-full bg-blue-600 px-1.5 py-0.5 text-[9px] font-bold uppercase text-white">
            DEMO
          </span>
          {t('mockCheckout.demoDisclaimer')}
        </div>
        <p className="mb-4 text-sm text-gray-600">
          {cardName ?? purchaseListing.seller_display_name}
        </p>
        <div className="mb-3 text-sm text-gray-600">
          Carte in vendita: <span className="font-semibold">{purchaseListing.quantity}</span>
        </div>
        <label className="mb-1 block text-sm font-medium text-gray-700">Quantità</label>
        <input
          type="number"
          min={1}
          max={purchaseListing.quantity}
          value={purchaseQty}
          onChange={(e) => onQtyChange(Number(e.target.value) || 1)}
          className="mb-4 w-full rounded border border-gray-300 px-3 py-2 text-sm"
        />
        <div className="flex justify-end gap-2 border-t border-gray-200 pt-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            disabled={purchaseSubmitting}
          >
            Annulla
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={purchaseSubmitting}
            className="rounded bg-[#FF7300] px-4 py-2 text-sm font-medium text-white hover:bg-[#e56500] disabled:opacity-50"
          >
            {purchaseSubmitting ? <Loader2 className="mr-2 inline h-4 w-4 animate-spin" /> : null}
            {t('mockCheckout.confirmOrder')}
          </button>
        </div>
      </div>
    </div>
  );
}
