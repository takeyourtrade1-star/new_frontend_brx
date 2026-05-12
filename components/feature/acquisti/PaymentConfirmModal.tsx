'use client';

import { useEffect, useRef } from 'react';
import { CheckCircle2, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { OrderAPI } from '@/types/order';

interface PaymentConfirmModalProps {
  order: OrderAPI | null;
  isPaying: boolean;
  errorMessage: string | null;
  onClose: () => void;
  onConfirm: () => void;
}

const eurFmt = new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' });

export function PaymentConfirmModal({
  order,
  isPaying,
  errorMessage,
  onClose,
  onConfirm,
}: PaymentConfirmModalProps) {
  const closeBtn = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (!order) return;
    closeBtn.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isPaying) onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [order, isPaying, onClose]);

  if (!order) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="payment-confirm-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
    >
      <div className="w-full max-w-md rounded-lg bg-white shadow-xl">
        <div className="flex items-start justify-between border-b border-gray-200 px-5 py-4">
          <h2 id="payment-confirm-title" className="text-lg font-bold text-gray-900">
            Conferma pagamento
          </h2>
          <button
            ref={closeBtn}
            type="button"
            onClick={onClose}
            disabled={isPaying}
            className="rounded p-1 text-gray-500 hover:bg-gray-100 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#FF7300]/40 disabled:opacity-50"
            aria-label="Chiudi"
          >
            <X className="h-5 w-5" aria-hidden />
          </button>
        </div>

        <div className="space-y-4 px-5 py-5 text-sm text-gray-700">
          <p>
            Stai per pagare l&apos;ordine{' '}
            <strong>#{order.id}</strong>
            {order.auction_title ? <> relativo all&apos;asta <strong>{order.auction_title}</strong></> : null}.
          </p>
          <div className="flex items-center justify-between rounded-lg bg-gray-50 px-4 py-3">
            <span className="text-gray-500">Totale da pagare</span>
            <span className="text-xl font-bold text-gray-900">{eurFmt.format(order.total_amount)}</span>
          </div>
          <p className="text-xs text-gray-500">
            <em>
              Modalità simulata: per ora il pagamento non passa da un gateway reale.
              Premendo Approva l&apos;ordine viene marcato come pagato e il venditore
              viene avvisato.
            </em>
          </p>
          {errorMessage && (
            <div className="flex items-start gap-2 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
              <span className="mt-0.5">⚠</span>
              <span>{errorMessage}</span>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-2 border-t border-gray-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            disabled={isPaying}
            className="inline-flex items-center justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-300 disabled:opacity-50"
          >
            Annulla
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isPaying}
            className={cn(
              'inline-flex items-center justify-center gap-2 rounded-md bg-[#FF7300] px-4 py-2 text-sm font-bold uppercase tracking-wide text-white transition-colors hover:bg-[#e56500] focus:outline-none focus:ring-2 focus:ring-[#FF7300]/40 disabled:opacity-60',
            )}
          >
            <CheckCircle2 className="h-4 w-4" aria-hidden />
            {isPaying ? 'Approvazione…' : 'Approva pagamento'}
          </button>
        </div>
      </div>
    </div>
  );
}
