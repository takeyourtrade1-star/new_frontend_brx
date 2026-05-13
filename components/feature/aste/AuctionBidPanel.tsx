'use client';

import { useMemo, useState, useCallback, useEffect } from 'react';
import { HelpCircle, X, CheckCircle, AlertTriangle } from 'lucide-react';
import { minNextBidEur, parseLocaleMoneyInput, roundUpToHalfStep } from '@/lib/auction/bid-math';
import { usePlaceBid } from '@/lib/hooks/use-auctions';
import { useTranslation } from '@/lib/i18n/useTranslation';

type AuctionBidPanelProps = {
  auctionId: number;
  currentBidEur: number;
  isWinning: boolean;
  reserveMet: boolean;
  maxBidEur: number | null;
  proxyBidOutbid: boolean;
  buyNowEnabled: boolean;
  buyNowPrice: number | null;
  buyNowUrl: string | null;
  isAuthenticated: boolean;
  onRequireAuth: () => void;
  onOpenMaxBid: () => void;
  onSubmitOffer: (amountEur: number) => void;
  onSubmitMaxBid: (amountEur: number) => void;
};

type PendingAction = { type: 'direct' | 'max'; amount: number };

function BidConfirmPopup({
  action,
  minBid,
  fmtEur,
  isLoading,
  onConfirm,
  onCancel,
}: {
  action: PendingAction;
  minBid: number;
  fmtEur: (n: number) => string;
  isLoading: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isLoading) onCancel();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isLoading, onCancel]);

  const isDirect = action.type === 'direct';
  const displayAmount = isDirect ? action.amount : action.amount;
  const effectiveAmount = isDirect ? action.amount : minBid;

  return (
    <div
      className="fixed inset-0 z-[400] flex items-end justify-center bg-black/40 p-4 sm:items-center"
      onClick={(e) => { if (e.target === e.currentTarget && !isLoading) onCancel(); }}
    >
      <div className="w-full max-w-sm animate-[slide-up_0.2s_ease-out] rounded-2xl border border-gray-200 bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
          <h3 className="text-base font-extrabold text-[#1D3160]">
            {isDirect ? 'Conferma offerta' : 'Conferma offerta massima'}
          </h3>
          {!isLoading && (
            <button
              type="button"
              onClick={onCancel}
              className="rounded-full p-1 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Body */}
        <div className="px-5 py-4">
          {isDirect ? (
            <>
              <p className="text-sm text-gray-600">Stai per fare un&apos;offerta di:</p>
              <p className="mt-1 text-3xl font-extrabold tracking-tight text-[#FF7300]">
                {fmtEur(displayAmount)}
              </p>
              <p className="mt-2 text-xs text-gray-500">
                Il tuo importo verrà immediatamente registrato come offerta.
              </p>
            </>
          ) : (
            <>
              <p className="text-sm text-gray-600">Stai per impostare un&apos;offerta massima di:</p>
              <p className="mt-1 text-3xl font-extrabold tracking-tight text-[#FF7300]">
                {fmtEur(displayAmount)}
              </p>
              <div className="mt-3 rounded-xl border border-[#FF7300]/20 bg-[#FF7300]/8 px-3 py-2">
                <p className="text-xs font-semibold text-[#1D3160]">
                  Prima puntata automatica:{' '}
                  <span className="text-[#FF7300]">{fmtEur(effectiveAmount)}</span>
                </p>
                <p className="mt-0.5 text-xs text-gray-500">
                  Il sistema rilancerà per te fino al tetto scelto.
                </p>
              </div>
            </>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2.5 border-t border-gray-100 px-5 py-4">
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="flex-1 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:pointer-events-none disabled:opacity-40"
          >
            Annulla
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-[#FF7300] px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-[#e86800] disabled:pointer-events-none disabled:opacity-60"
          >
            {isLoading ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                Invio…
              </>
            ) : (
              <>
                <CheckCircle className="h-4 w-4" />
                {isDirect ? 'Sì, offri' : 'Sì, imposta max'}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export function AuctionBidPanel({
  auctionId,
  currentBidEur,
  isWinning,
  reserveMet,
  maxBidEur,
  proxyBidOutbid,
  buyNowEnabled,
  buyNowPrice,
  buyNowUrl,
  isAuthenticated,
  onRequireAuth,
  onOpenMaxBid,
  onSubmitOffer,
  onSubmitMaxBid,
}: AuctionBidPanelProps) {
  const { t } = useTranslation();
  const placeBidMutation = usePlaceBid(auctionId);
  const minBid = useMemo(() => minNextBidEur(currentBidEur), [currentBidEur]);
  const [input, setInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [outbidWarning, setOutbidWarning] = useState<string | null>(null);
  const [showMaxInfo, setShowMaxInfo] = useState(false);
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);

  const quickAmounts = useMemo(() => {
    if (currentBidEur <= 100) {
      return [minBid, roundUpToHalfStep(minBid + 4), roundUpToHalfStep(minBid + 9)];
    }
    return [minBid, roundUpToHalfStep(minBid + 10), roundUpToHalfStep(minBid + 25)];
  }, [currentBidEur, minBid]);

  const parsedInput = useMemo(() => {
    const n = parseLocaleMoneyInput(input);
    return Number.isFinite(n) ? roundUpToHalfStep(n) : NaN;
  }, [input]);

  const normalizeInputOnBlur = () => {
    const parsed = parseLocaleMoneyInput(input);
    if (!Number.isFinite(parsed)) return;
    const normalized = roundUpToHalfStep(parsed);
    const normalizedText = Number.isInteger(normalized)
      ? String(normalized)
      : normalized.toFixed(1).replace('.', ',');
    setInput(normalizedText);
    setError(null);
  };

  const fmtEur = (n: number) => n.toLocaleString('it-IT', { style: 'currency', currency: 'EUR' });

  const minBidHint = useMemo(() => {
    const dynamic = minBid.toLocaleString('it-IT', {
      minimumFractionDigits: Number.isInteger(minBid) ? 0 : 1,
      maximumFractionDigits: 2,
    });
    return `€ ${dynamic} o più`;
  }, [minBid]);

  const validateInput = (): boolean => {
    if (!Number.isFinite(parsedInput)) {
      setError(t('auctions.bidErrorInvalid'));
      return false;
    }
    if (parsedInput < minBid) {
      setError(`Importo minimo: ${fmtEur(minBid)} o più.`);
      return false;
    }
    return true;
  };

  const translateApiError = (msg: string): string => {
    const minMatch = msg.match(/Minimum bid is ([\d.]+)/i);
    if (minMatch) {
      const val = parseFloat(minMatch[1]);
      if (Number.isFinite(val)) return t('auctions.bidErrorTooLow', { min: fmtEur(val) });
    }
    if (/not active|has ended/i.test(msg)) return t('auctions.bidErrorEnded');
    if (/token|unauthorized|expired/i.test(msg)) return t('auctions.bidErrorAuth');
    if (/connessione non riuscita|load failed|failed to fetch|network request failed|networkerror|the network connection was lost/i.test(msg)) {
      return 'Connessione non riuscita. Verifica la rete e riprova.';
    }
    return msg;
  };

  const requestDirectBid = () => {
    if (!isAuthenticated) {
      onRequireAuth();
      return;
    }
    if (!validateInput()) return;
    setError(null);
    setOutbidWarning(null);
    setPendingAction({ type: 'direct', amount: parsedInput });
  };

  const requestMaxBid = () => {
    if (!isAuthenticated) {
      onRequireAuth();
      return;
    }
    if (!validateInput()) return;
    setError(null);
    setOutbidWarning(null);
    setPendingAction({ type: 'max', amount: parsedInput });
  };

  const cancelPending = useCallback(() => {
    if (placeBidMutation.isPending) return;
    setPendingAction(null);
  }, [placeBidMutation.isPending]);

  const executeBid = useCallback(async () => {
    if (!pendingAction) return;
    const { type, amount } = pendingAction;

    try {
      const payload =
        type === 'direct'
          ? { amount }
          : { amount: minBid, maxAmount: amount };
      const res = await placeBidMutation.mutateAsync(payload);
      setPendingAction(null);
      if (res?.data?.outbid) {
        setOutbidWarning(res.data.outbid_message || t('auctions.bidOutbidGeneric'));
        return;
      }
      if (type === 'direct') {
        onSubmitOffer(amount);
      } else {
        onSubmitMaxBid(amount);
      }
    } catch (err) {
      setPendingAction(null);
      const msg = err instanceof Error ? err.message : "Errore durante l'offerta";
      setError(translateApiError(msg));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingAction, minBid, placeBidMutation, t]);

  return (
    <>
      {/* Confirmation popup */}
      {pendingAction && (
        <BidConfirmPopup
          action={pendingAction}
          minBid={minBid}
          fmtEur={fmtEur}
          isLoading={placeBidMutation.isPending}
          onConfirm={executeBid}
          onCancel={cancelPending}
        />
      )}

      <div className="rounded-2xl border border-black/5 bg-white/70 p-4 sm:p-5">
        <div
          className={`rounded-xl px-4 py-3 ${
            isWinning ? 'border border-emerald-400/80 bg-emerald-50/65' : 'border border-black/10 bg-white'
          }`}
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className={`text-[10px] font-semibold uppercase tracking-wide ${isWinning ? 'text-emerald-700' : 'text-gray-500'}`}>
                {t('auctions.currentBid')}
              </p>
              <p className={`mt-1 text-3xl font-extrabold tracking-tight ${isWinning ? 'text-emerald-800' : 'text-gray-900'}`}>
                {fmtEur(currentBidEur)}
              </p>
            </div>
            {isWinning && (
              <span className="inline-flex rounded-full border border-emerald-300 bg-white/80 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-emerald-700">
                Stai vincendo
              </span>
            )}
          </div>
        </div>

        <p className={`mt-3 text-xs font-semibold ${reserveMet ? 'text-emerald-700' : 'text-amber-700'}`}>
          {reserveMet ? t('auctions.detailReserveYes') : t('auctions.detailReserveNo')}
        </p>

        {maxBidEur != null && (
          <button
            type="button"
            onClick={onOpenMaxBid}
            className={`mt-3 flex w-full items-center justify-between rounded-xl border px-3 py-2 text-left transition ${
              proxyBidOutbid
                ? 'border-red-200 bg-red-50/80 text-red-800 hover:bg-red-50'
                : 'border-[#FF7300]/20 bg-[#FF7300]/10 text-[#1D3160] hover:bg-[#FF7300]/15'
            }`}
          >
            <span className="text-xs font-bold uppercase tracking-wide">Offerta massima attiva</span>
            <span className={`text-sm font-extrabold ${proxyBidOutbid ? 'text-red-700' : 'text-[#FF7300]'}`}>
              {fmtEur(maxBidEur)}
            </span>
          </button>
        )}

        <div className="mt-4">
          <p className="mb-2 text-center text-[10px] font-semibold uppercase tracking-wide text-gray-600">
            {t('auctions.suggestedBids')}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2">
            {quickAmounts.map((amt) => (
              <button
                key={amt}
                type="button"
                onClick={() => {
                  setInput(String(amt).replace('.', ','));
                  setError(null);
                }}
                className="min-w-[84px] rounded-full border border-[#C8CED6] bg-white px-3 py-2 text-center text-xs font-bold text-gray-900 transition hover:border-[#AAB3BF] hover:bg-[#FAFBFC]"
              >
                {fmtEur(amt)}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-4">
          <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-gray-600">
            Importo personalizzato
          </label>
          <input
            type="text"
            inputMode="decimal"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onBlur={normalizeInputOnBlur}
            className="w-full rounded-md border border-[#DEE3EA] bg-[#F5F6F8] px-3 py-3 text-lg font-bold text-gray-900 placeholder:font-semibold placeholder:text-gray-500 focus:border-[#B7C0CB] focus:bg-[#F8F9FB] focus:outline-none focus:ring-0"
            placeholder={minBidHint}
          />
        </div>

        {error && (
          <div className="mt-3 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2">
            <AlertTriangle className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-red-500" />
            <p className="text-xs text-red-700">{error}</p>
          </div>
        )}
        {outbidWarning && (
          <p className="mt-3 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-800">
            {outbidWarning}
          </p>
        )}

        <div className="mt-4 flex flex-col gap-2.5 sm:flex-row sm:items-stretch sm:gap-3">
          <button
            type="button"
            onClick={requestDirectBid}
            disabled={placeBidMutation.isPending}
            className="inline-flex min-h-[44px] w-full flex-1 items-center justify-center rounded-lg border border-[#FF7300] bg-[#FF7300] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#e86800] hover:shadow disabled:pointer-events-none disabled:opacity-50 sm:min-h-0 sm:py-3"
          >
            Fai offerta
          </button>
          <button
            type="button"
            onClick={requestMaxBid}
            disabled={placeBidMutation.isPending}
            title="Imposta il tetto massimo: il sistema rilancia per te fino a quel importo"
            className="inline-flex min-h-[44px] w-full flex-1 items-center justify-center rounded-lg border-2 border-[#FF7300] bg-white px-4 py-2.5 text-sm font-semibold text-[#FF7300] transition hover:bg-orange-50/90 disabled:pointer-events-none disabled:opacity-50 sm:min-h-0 sm:py-3"
          >
            Offerta massima
          </button>
        </div>

        <button
          type="button"
          onClick={() => setShowMaxInfo(true)}
          className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-[#1D3160] hover:text-[#FF7300]"
        >
          <HelpCircle className="h-3.5 w-3.5" />
          Come funziona un&apos;offerta max?
        </button>

        {buyNowEnabled && buyNowPrice != null && (
          <>
            <div className="my-4 flex items-center gap-2">
              <span className="h-px flex-1 bg-gray-200" />
              <span className="text-[10px] font-semibold uppercase tracking-wide text-gray-500">Oppure</span>
              <span className="h-px flex-1 bg-gray-200" />
            </div>
            {buyNowUrl ? (
              <a
                href={buyNowUrl}
                className="block w-full rounded-xl border border-[#1D3160] bg-[#1D3160] px-3 py-3 text-center text-xs font-bold uppercase tracking-wide text-white transition hover:bg-[#15264b]"
              >
                Acquista subito a {fmtEur(buyNowPrice)}
              </a>
            ) : (
              <button
                type="button"
                className="w-full rounded-xl border border-[#1D3160] bg-[#1D3160] px-3 py-3 text-xs font-bold uppercase tracking-wide text-white"
              >
                Acquista subito a {fmtEur(buyNowPrice)}
              </button>
            )}
          </>
        )}

        {showMaxInfo && (
          <div className="fixed inset-0 z-[310] flex items-center justify-center bg-black/35 p-4">
            <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-5 shadow-2xl">
              <h4 className="text-base font-extrabold text-[#1D3160]">Come funziona l&apos;offerta massima</h4>
              <p className="mt-2 text-sm text-gray-700">
                Imposti il tuo tetto massimo. Il sistema rilancia automaticamente solo lo stretto necessario per mantenerti in testa,
                fino al limite impostato.
              </p>
              <p className="mt-2 text-sm text-gray-700">
                Se altri superano il tuo limite, riceverai un avviso e potrai alzarlo.
              </p>
              <button
                type="button"
                onClick={() => setShowMaxInfo(false)}
                className="mt-4 w-full rounded-lg bg-[#1D3160] px-4 py-2.5 text-xs font-bold uppercase tracking-wide text-white transition hover:bg-[#15264b]"
              >
                Ho capito
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
