'use client';

/**
 * Dettaglio di una proposta di scambio RICEVUTA (lato "venditore").
 * Tavolo editabile con doppio inventario, crediti e compensazione rapida.
 * Accetta · Contro proposta · Rifiuta — con Contro proposta in evidenza
 * quando l'utente modifica carte o crediti.
 */

import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { ArrowLeft, ArrowLeftRight, Check, X } from 'lucide-react';
import { FlagIcon } from '@/components/ui/FlagIcon';
import { tradeBalance } from '@/lib/scambi/card-mock-value';
import { MOCK_INVENTORY_A, findMockInventoryItem } from './mock-trade-inventories';
import type { ReceivedProposal } from './mock-received-proposals';
import { formatTradeEuro, idsEqual, mockToTradeCard } from './trade-proposal-ui';
import { TradeComposer } from './TradeComposer';

function ActionButton({
  variant,
  onClick,
  disabled,
  icon,
  children,
}: {
  variant: 'accept' | 'counter' | 'reject';
  onClick: () => void;
  disabled?: boolean;
  icon?: ReactNode;
  children: ReactNode;
}) {
  const base =
    'inline-flex items-center justify-center gap-1.5 rounded-full px-4 py-2 text-[11px] font-bold uppercase tracking-wide transition-all duration-200 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none';

  const styles = {
    accept:
      'bg-gradient-to-b from-emerald-500 to-emerald-600 text-white shadow-sm shadow-emerald-500/30 hover:shadow-md hover:shadow-emerald-500/40 hover:brightness-105',
    counter:
      'bg-gradient-to-b from-[#FF8A26] to-[#FF7300] text-white shadow-sm shadow-[#FF7300]/30 hover:shadow-md hover:shadow-[#FF7300]/40 hover:brightness-105',
    reject:
      'border border-gray-200 bg-white text-gray-500 hover:border-red-300 hover:bg-red-50 hover:text-red-600',
  };

  return (
    <button type="button" onClick={onClick} disabled={disabled} className={`${base} ${styles[variant]}`}>
      {icon}
      {children}
    </button>
  );
}

export function ReceivedProposalDetail({
  proposal,
  onBack,
}: {
  proposal: ReceivedProposal;
  onBack: () => void;
}) {
  const initialRequestedIds = useMemo(
    () => proposal.offeredCards.map((c) => c.id),
    [proposal.offeredCards],
  );
  const initialOfferedIds = useMemo(
    () => proposal.requestedCards.map((c) => c.id),
    [proposal.requestedCards],
  );
  const initialAddMoney = proposal.requestedCredits;
  const initialReqMoney = proposal.offeredCredits;

  const [status, setStatus] = useState<
    'open' | 'accepted' | 'rejecting' | 'rejected' | 'counterSent'
  >('open');
  const [blockFuture, setBlockFuture] = useState(false);
  const [showCounterConfirm, setShowCounterConfirm] = useState(false);
  /** Di default si vede solo la proposta sul tavolo; le due liste inventario
   * compaiono solo entrando in modalità controproposta. */
  const [counterMode, setCounterMode] = useState(false);
  const inventoriesRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!counterMode) return;
    const frame = requestAnimationFrame(() => {
      inventoriesRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
    return () => cancelAnimationFrame(frame);
  }, [counterMode]);

  const [selectedRequestedIds, setSelectedRequestedIds] = useState<string[]>(initialRequestedIds);
  const [selectedOfferedIds, setSelectedOfferedIds] = useState<string[]>(initialOfferedIds);
  const [addMoney, setAddMoney] = useState(initialAddMoney);
  const [reqMoney, setReqMoney] = useState(initialReqMoney);

  const myInventory = useMemo(() => MOCK_INVENTORY_A.map(mockToTradeCard), []);
  const otherInventory = useMemo(
    () =>
      proposal.senderInventory
        .map((c) => findMockInventoryItem(c.id))
        .filter((c): c is NonNullable<typeof c> => c != null)
        .map(mockToTradeCard),
    [proposal.senderInventory],
  );

  const requestedCards = useMemo(
    () => otherInventory.filter((c) => selectedRequestedIds.includes(c.id)),
    [otherInventory, selectedRequestedIds],
  );
  const offeredCards = useMemo(
    () => myInventory.filter((c) => selectedOfferedIds.includes(c.id)),
    [myInventory, selectedOfferedIds],
  );

  const offeredValue = offeredCards.reduce((s, c) => s + c.value, 0) + addMoney;
  const requestedValue = requestedCards.reduce((s, c) => s + c.value, 0) + reqMoney;
  const balance = tradeBalance({ offeredValue, requestedValue, isPro: proposal.fromUser.isPro });
  const gap = requestedValue - offeredValue;

  const hasModifications =
    addMoney !== initialAddMoney ||
    reqMoney !== initialReqMoney ||
    !idsEqual(selectedRequestedIds, initialRequestedIds) ||
    !idsEqual(selectedOfferedIds, initialOfferedIds);

  const canCounter =
    hasModifications && balance.balanced && (offeredCards.length > 0 || addMoney > 0);

  const toggleOffered = (id: string) =>
    setSelectedOfferedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  const toggleRequested = (id: string) =>
    setSelectedRequestedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const quickCompensate = () => {
    if (gap > 0) setAddMoney((m) => m + gap);
    else if (gap < 0) setReqMoney((m) => m - gap);
  };

  const exitCounter = () => {
    setSelectedRequestedIds(initialRequestedIds);
    setSelectedOfferedIds(initialOfferedIds);
    setAddMoney(initialAddMoney);
    setReqMoney(initialReqMoney);
    setCounterMode(false);
  };

  const handleCounter = () => {
    if (!canCounter) return;
    setShowCounterConfirm(true);
  };

  const confirmCounter = () => {
    setShowCounterConfirm(false);
    setStatus('counterSent');
  };

  /* ---- Esiti ---- */

  if (status === 'accepted') {
    return (
      <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100">
          <Check className="h-7 w-7 text-emerald-600" strokeWidth={3} />
        </div>
        <h2 className="text-lg font-bold text-[#1D3160]">Scambio accettato!</h2>
        <p className="max-w-sm text-sm text-gray-500">
          Hai accettato la proposta di <span className="font-bold">{proposal.fromUser.name}</span>. Ti contatteremo per
          finalizzare la spedizione.
        </p>
        <button
          type="button"
          onClick={onBack}
          className="mt-1 inline-flex h-10 items-center justify-center rounded-full bg-[#FF7300] px-5 text-sm font-semibold text-white transition hover:bg-[#e66800]"
        >
          Torna ai miei scambi
        </button>
      </div>
    );
  }

  if (status === 'counterSent') {
    return (
      <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100">
          <Check className="h-7 w-7 text-emerald-600" strokeWidth={3} />
        </div>
        <h2 className="text-lg font-bold text-[#1D3160]">Controproposta inviata!</h2>
        <p className="max-w-sm text-sm text-gray-500">
          La tua controproposta è stata inviata a{' '}
          <span className="font-bold">{proposal.fromUser.name}</span>.
        </p>
        <button
          type="button"
          onClick={onBack}
          className="mt-1 inline-flex h-10 items-center justify-center rounded-full bg-[#FF7300] px-5 text-sm font-semibold text-white transition hover:bg-[#e66800]"
        >
          Torna ai miei scambi
        </button>
      </div>
    );
  }

  if (status === 'rejected') {
    return (
      <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 text-center">
        <h2 className="text-lg font-bold text-[#1D3160]">Proposta rifiutata</h2>
        <p className="max-w-sm text-sm text-gray-500">
          Hai rifiutato la proposta di <span className="font-bold">{proposal.fromUser.name}</span>.
          {blockFuture && ' Non riceverai altre sue proposte per le prossime 24 ore.'}
        </p>
        <button
          type="button"
          onClick={onBack}
          className="mt-1 inline-flex h-10 items-center justify-center rounded-full bg-[#FF7300] px-5 text-sm font-semibold text-white transition hover:bg-[#e66800]"
        >
          Torna ai miei scambi
        </button>
      </div>
    );
  }

  const acceptButton = (
    <ActionButton variant="accept" icon={<Check className="h-3.5 w-3.5" strokeWidth={3} />} onClick={() => setStatus('accepted')}>
      Accetta
    </ActionButton>
  );
  const counterButton = (
    <ActionButton variant="counter" icon={<ArrowLeftRight className="h-3.5 w-3.5" strokeWidth={2.5} />} onClick={() => setCounterMode(true)}>
      Contro proposta
    </ActionButton>
  );
  const rejectButton = (
    <ActionButton variant="reject" icon={<X className="h-3.5 w-3.5" strokeWidth={3} />} onClick={() => setStatus('rejecting')}>
      Rifiuta
    </ActionButton>
  );
  const sendCounterButton = (
    <ActionButton variant="counter" icon={<Check className="h-3.5 w-3.5" strokeWidth={3} />} disabled={!canCounter} onClick={handleCounter}>
      Invia controproposta
    </ActionButton>
  );
  const cancelCounterButton = (
    <ActionButton variant="reject" icon={<X className="h-3.5 w-3.5" strokeWidth={3} />} onClick={exitCounter}>
      Annulla modifiche
    </ActionButton>
  );

  /* ---- Vista principale ---- */

  return (
    <div>
      {/* Intestazione */}
      <div className="mb-3 flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-gray-500 transition hover:text-[#1D3160]"
        >
          <ArrowLeft className="h-4 w-4" /> Tutte le richieste
        </button>
        <div className="flex items-center gap-1.5 text-xs text-gray-500">
          <span>da</span>
          <FlagIcon country={proposal.fromUser.country} size="xs" />
          <span className="font-bold text-[#1D3160]">{proposal.fromUser.name}</span>
          <span className="text-gray-300">·</span>
          <span className="font-medium">{proposal.fromUser.isPro ? 'Professionale' : 'Privato'}</span>
          <span className="text-gray-300">·</span>
          <span>{proposal.createdAtLabel}</span>
        </div>
      </div>

      {/* Azioni (allineate a destra) */}
      {status === 'open' && (
        <div className="mb-3 flex flex-wrap items-center justify-end gap-2">
          {counterMode ? (
            <>
              {cancelCounterButton}
              {sendCounterButton}
            </>
          ) : (
            <>
              {rejectButton}
              {counterButton}
              {acceptButton}
            </>
          )}
        </div>
      )}

      {status === 'rejecting' && (
        <div className="mb-3 rounded-2xl border border-red-200 bg-red-50 px-3.5 py-2.5">
          <p className="text-xs font-bold text-red-700">Vuoi davvero rifiutare questa proposta?</p>
          <label className="mt-1.5 flex items-center gap-2 text-[12px] text-gray-700">
            <input
              type="checkbox"
              checked={blockFuture}
              onChange={(e) => setBlockFuture(e.target.checked)}
              className="h-3.5 w-3.5 rounded border-gray-300 text-[#FF7300] accent-[#FF7300]"
            />
            Rifiuta altre proposte di scambio da {proposal.fromUser.name} per 24h
          </label>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setStatus('open')}
              className="rounded-full bg-white px-3.5 py-1.5 text-[11px] font-bold text-gray-700 ring-1 ring-inset ring-gray-300 transition hover:bg-gray-50"
            >
              Annulla
            </button>
            <button
              type="button"
              onClick={() => setStatus('rejected')}
              className="rounded-full bg-red-600 px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-wide text-white transition hover:bg-red-700 active:scale-[0.98]"
            >
              Conferma rifiuto
            </button>
          </div>
        </div>
      )}

      {/* Blocco scambio unificato — in sola lettura finché non si entra in controproposta */}
      <TradeComposer
        myInventory={myInventory}
        otherInventory={otherInventory}
        otherName={proposal.fromUser.name}
        selectedOfferedIds={selectedOfferedIds}
        selectedRequestedIds={selectedRequestedIds}
        offeredCards={offeredCards}
        requestedCards={requestedCards}
        onToggleOffered={toggleOffered}
        onToggleRequested={toggleRequested}
        addMoney={addMoney}
        reqMoney={reqMoney}
        onAddMoneyChange={setAddMoney}
        onReqMoneyChange={setReqMoney}
        offeredValue={offeredValue}
        requestedValue={requestedValue}
        balance={balance}
        onQuickCompensate={quickCompensate}
        editable={counterMode}
        inventoriesSectionRef={inventoriesRef}
      />

      {/* Modale conferma controproposta */}
      {showCounterConfirm && (
        <div className="fixed inset-0 z-[200] flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-4">
          <div className="w-full max-w-md rounded-t-2xl bg-white p-5 shadow-2xl sm:rounded-2xl">
            <h3 className="text-base font-black uppercase tracking-tight text-[#1D3160]">Confermi la controproposta?</h3>
            <p className="mt-1 text-sm text-gray-500">
              Invii a <span className="font-bold text-gray-800">{proposal.fromUser.name}</span>:
            </p>
            <div className="mt-3 space-y-2 text-sm">
              <div className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2">
                <span className="text-gray-600">Offri</span>
                <span className="font-bold text-[#1D3160]">
                  {offeredCards.length} {offeredCards.length === 1 ? 'carta' : 'carte'}
                  {addMoney > 0 ? ` + ${formatTradeEuro(addMoney)}` : ''} · {formatTradeEuro(offeredValue)}
                </span>
              </div>
              <div className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2">
                <span className="text-gray-600">Chiedi</span>
                <span className="font-bold text-[#1D3160]">
                  {requestedCards.length} {requestedCards.length === 1 ? 'carta' : 'carte'}
                  {reqMoney > 0 ? ` + ${formatTradeEuro(reqMoney)}` : ''} · {formatTradeEuro(requestedValue)}
                </span>
              </div>
            </div>
            <div className="mt-5 flex gap-2">
              <button
                type="button"
                onClick={() => setShowCounterConfirm(false)}
                className="flex-1 rounded-lg border border-gray-300 bg-white py-2.5 text-sm font-bold text-gray-700 transition hover:bg-gray-50"
              >
                Annulla
              </button>
              <button
                type="button"
                onClick={confirmCounter}
                className="flex-1 rounded-lg bg-[#FF7300] py-2.5 text-sm font-bold uppercase tracking-wide text-white transition hover:bg-[#e86800] active:scale-95"
              >
                Conferma e invia
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
