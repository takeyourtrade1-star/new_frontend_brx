'use client';

import { formatAuctionEur } from '@/lib/auction/auction-detail-utils';
import { useFocusTrap } from '@/hooks/useFocusTrap';

export function ProxyLimitModal({
  maxBidEur,
  proxyInput,
  proxyInputError,
  onChangeInput,
  onIncrease,
  onStop,
  onClose,
  isUpdating,
  isCancelling,
}: {
  maxBidEur: number;
  proxyInput: string;
  proxyInputError: string | null;
  onChangeInput: (value: string) => void;
  onIncrease: () => void;
  onStop: () => void;
  onClose: () => void;
  isUpdating: boolean;
  isCancelling: boolean;
}) {
  const fmtEur = (n: number) => formatAuctionEur(n);
  const trapRef = useFocusTrap<HTMLDivElement>(true);

  return (
    <div className="fixed inset-0 z-[220] flex items-center justify-center bg-black/45 p-4">
      <div
        ref={trapRef}
        role="dialog"
        aria-modal="true"
        aria-label="Gestisci il tuo limite massimo"
        className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-5 shadow-2xl"
      >
        <p className="text-xs font-bold uppercase tracking-wide text-gray-500">Proxy bidding</p>
        <h3 className="mt-1 text-lg font-extrabold text-[#1D3160]">Gestisci il tuo limite massimo</h3>
        <p className="mt-2 text-sm text-gray-600">
          Puoi aumentare il limite senza inviare una nuova offerta manuale. Il sistema aggiorna solo il tuo tetto massimo.
        </p>

        <div className="mt-4 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">Limite attuale</p>
          <p className="text-xl font-extrabold text-[#FF7300]">{fmtEur(maxBidEur)}</p>
        </div>

        <div className="mt-4">
          <label htmlFor="proxy-limit-input" className="mb-1 block text-xs font-bold uppercase tracking-wide text-gray-600">
            Nuovo limite massimo
          </label>
          <input
            id="proxy-limit-input"
            type="text"
            inputMode="decimal"
            value={proxyInput}
            onChange={(e) => onChangeInput(e.target.value)}
            placeholder="Es. 24,5"
            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-base font-semibold text-gray-900 focus:border-[#FF7300] focus:outline-none focus:ring-2 focus:ring-[#FF7300]/20"
          />
          {proxyInputError && (
            <p className="mt-1 text-xs font-medium text-red-600">{proxyInputError}</p>
          )}
        </div>

        <div className="mt-5 flex items-center gap-2">
          <button
            type="button"
            onClick={onIncrease}
            disabled={isUpdating || isCancelling}
            className="flex-1 rounded-lg bg-[#FF7300] px-4 py-2.5 text-xs font-bold uppercase tracking-wide text-white transition hover:bg-[#e86800]"
          >
            {isUpdating ? 'Salvataggio...' : 'Salva nuovo limite'}
          </button>
          <button
            type="button"
            onClick={onClose}
            disabled={isUpdating || isCancelling}
            className="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-xs font-bold uppercase tracking-wide text-gray-700 transition hover:bg-gray-50"
          >
            Chiudi
          </button>
        </div>

        <button
          type="button"
          onClick={onStop}
          disabled={isUpdating || isCancelling}
          className="mt-3 w-full rounded-lg border border-red-300 bg-red-50 px-4 py-2.5 text-xs font-bold uppercase tracking-wide text-red-700 transition hover:bg-red-100"
        >
          {isCancelling ? 'Disattivazione...' : 'Interrompi proxy bidding'}
        </button>
      </div>
    </div>
  );
}
