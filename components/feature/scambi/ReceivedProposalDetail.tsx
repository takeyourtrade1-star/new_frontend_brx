'use client';

/**
 * Dettaglio di una proposta di scambio RICEVUTA (lato "venditore").
 * Tavolo editabile con doppio inventario, crediti e compensazione rapida.
 * Accetta · Contro proposta · Rifiuta — con Contro proposta in evidenza
 * quando l'utente modifica carte o crediti.
 */

import { useMemo, useState, type ReactNode } from 'react';
import { ArrowLeft, Check } from 'lucide-react';
import { FlagIcon } from '@/components/ui/FlagIcon';
import { tradeBalance } from '@/lib/scambi/card-mock-value';
import { MOCK_INVENTORY_A, findMockInventoryItem } from './mock-trade-inventories';
import type { ReceivedProposal } from './mock-received-proposals';
import {
  AnimatedBalanceScale,
  filterTradeCards,
  formatTradeEuro,
  idsEqual,
  InventoryPanel,
  mockToTradeCard,
  MoneyChip,
  MoneyField,
  TableCard,
  type InventoryFiltersState,
} from './trade-proposal-ui';

function ActionButton({
  variant,
  onClick,
  disabled,
  emphasized,
  children,
}: {
  variant: 'accept' | 'counter' | 'reject';
  onClick: () => void;
  disabled?: boolean;
  emphasized?: boolean;
  children: ReactNode;
}) {
  const base =
    'rounded-full font-bold uppercase tracking-wide transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50';
  const size = emphasized ? 'px-4 py-2 text-[12px]' : 'px-3.5 py-1.5 text-[11px]';

  const styles = {
    accept: 'bg-emerald-600 text-white hover:bg-emerald-700',
    counter: emphasized
      ? 'bg-[#FF7300] text-white shadow-md shadow-orange-200/80 hover:bg-[#e86800] animate-[pulse_2s_ease-in-out_infinite] scale-105'
      : 'bg-[#FF7300] text-white hover:bg-[#e86800]',
    reject:
      'bg-white text-gray-600 ring-1 ring-inset ring-gray-300 hover:text-red-600 hover:ring-red-300',
  };

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`${base} ${size} ${styles[variant]}`}
    >
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

  const [selectedRequestedIds, setSelectedRequestedIds] = useState<string[]>(initialRequestedIds);
  const [selectedOfferedIds, setSelectedOfferedIds] = useState<string[]>(initialOfferedIds);
  const [addMoney, setAddMoney] = useState(initialAddMoney);
  const [reqMoney, setReqMoney] = useState(initialReqMoney);

  const [myFilters, setMyFilters] = useState<InventoryFiltersState>({
    query: '',
    condition: null,
    language: null,
    printings: [],
  });
  const [otherFilters, setOtherFilters] = useState<InventoryFiltersState>({
    query: '',
    condition: null,
    language: null,
    printings: [],
  });

  const myInventory = useMemo(() => MOCK_INVENTORY_A.map(mockToTradeCard), []);
  const otherInventory = useMemo(
    () =>
      proposal.senderInventory
        .map((c) => findMockInventoryItem(c.id))
        .filter((c): c is NonNullable<typeof c> => c != null)
        .map(mockToTradeCard),
    [proposal.senderInventory],
  );

  const filteredMyInventory = useMemo(
    () => filterTradeCards(myInventory, myFilters),
    [myInventory, myFilters],
  );
  const filteredOtherInventory = useMemo(
    () => filterTradeCards(otherInventory, otherFilters),
    [otherInventory, otherFilters],
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
    <ActionButton variant="accept" onClick={() => setStatus('accepted')}>
      Accetta
    </ActionButton>
  );
  const counterButton = (
    <ActionButton
      variant="counter"
      emphasized={hasModifications}
      disabled={!canCounter}
      onClick={handleCounter}
    >
      Contro proposta
    </ActionButton>
  );
  const rejectButton = (
    <ActionButton variant="reject" onClick={() => setStatus('rejecting')}>
      Rifiuta scambio
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

      {/* Azioni in cima */}
      {status === 'open' && (
        <div className="mb-3 flex flex-wrap items-center gap-2">
          {hasModifications ? (
            <>
              {counterButton}
              {acceptButton}
              {rejectButton}
            </>
          ) : (
            <>
              {acceptButton}
              {counterButton}
              {rejectButton}
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

      {proposal.message && (
        <p className="mb-3 rounded-lg border-l-2 border-[#FF7300] bg-orange-50/60 px-3 py-2 text-[13px] italic text-gray-600">
          &ldquo;{proposal.message}&rdquo;
        </p>
      )}

      {/* Banner equità + compensazione rapida */}
      {!balance.balanced && (
        <div className="mb-3 flex flex-col gap-2 rounded-xl border border-[#FF7300]/40 bg-orange-50 px-3.5 py-2.5 sm:flex-row sm:items-center sm:justify-between">
          <p className="flex items-start gap-2 text-[13px] text-gray-700">
            <AnimatedBalanceScale offeredValue={offeredValue} requestedValue={requestedValue} className="mt-0.5" />
            <span>
              <span className="font-bold text-[#1D3160]">La bilancia pende un po&apos; da una parte</span>{' '}
              {offeredValue === 0
                ? 'Aggiungi qualcosa per iniziare!'
                : `mancano ${formatTradeEuro(Math.abs(gap))} per pareggiare.`}
            </span>
          </p>
          <button
            type="button"
            onClick={quickCompensate}
            className="shrink-0 self-start rounded-full bg-[#1D3160] px-3.5 py-2 text-xs font-bold uppercase tracking-wide text-white transition hover:bg-[#16264d] active:scale-95 sm:self-auto"
          >
            Compensazione rapida
          </button>
        </div>
      )}

      {/* Controlli crediti */}
      <div className="mb-4 flex flex-col items-stretch gap-3 rounded-xl border border-gray-200 bg-white px-3.5 py-3 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <MoneyField value={addMoney} onChange={setAddMoney} label="Aggiungi differenza" />
        <MoneyField value={reqMoney} onChange={setReqMoney} label="Richiedi differenza" />
      </div>

      {/* TAVOLO */}
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="px-3.5 py-3">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500">Chiedi</span>
            <span className="text-sm font-black tabular-nums text-[#1D3160]">{formatTradeEuro(requestedValue)}</span>
          </div>
          {requestedCards.length === 0 && reqMoney === 0 ? (
            <div className="flex items-center justify-center rounded-lg border border-dashed border-gray-300 bg-gray-50 py-5 text-center text-xs text-gray-400">
              Aggiungi carte dall&apos;inventario di {proposal.fromUser.name}
            </div>
          ) : (
            <div className="flex gap-2 overflow-x-auto pb-1">
              {requestedCards.map((card) => (
                <TableCard key={card.id} card={card} onRemove={() => toggleRequested(card.id)} />
              ))}
              {reqMoney > 0 && <MoneyChip amount={reqMoney} />}
            </div>
          )}
        </div>

        <div className="h-px bg-gray-200" />

        <div className="px-3.5 py-3">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500">Offri</span>
            <span className="text-sm font-black tabular-nums text-[#1D3160]">{formatTradeEuro(offeredValue)}</span>
          </div>
          {offeredCards.length === 0 && addMoney === 0 ? (
            <div className="flex items-center justify-center rounded-lg border border-dashed border-gray-300 bg-gray-50 py-5 text-center text-xs text-gray-400">
              Aggiungi le tue carte dall&apos;inventario qui sotto
            </div>
          ) : (
            <div className="flex gap-2 overflow-x-auto pb-1">
              {offeredCards.map((card) => (
                <TableCard key={card.id} card={card} onRemove={() => toggleOffered(card.id)} />
              ))}
              {addMoney > 0 && <MoneyChip amount={addMoney} />}
            </div>
          )}
        </div>
      </div>

      <p className="mt-2 text-center text-xs text-gray-500">
        {balance.balanced
          ? 'Scambio equo ✓'
          : `Scarto del ${Math.round(balance.diffPct * 100)}% (max ${Math.round(balance.threshold * 100)}%)`}
      </p>

      {/* Doppio inventario */}
      <div className="mt-4 grid grid-cols-1 gap-3 lg:grid-cols-2">
        <InventoryPanel
          variant="mine"
          title="Il tuo inventario"
          hint="tocca per offrire"
          filters={myFilters}
          onFiltersChange={setMyFilters}
          cards={myInventory}
          filteredCards={filteredMyInventory}
          selectedIds={selectedOfferedIds}
          onToggle={toggleOffered}
        />
        <InventoryPanel
          variant="other"
          title={`Inventario di ${proposal.fromUser.name}`}
          hint="tocca per chiedere"
          filters={otherFilters}
          onFiltersChange={setOtherFilters}
          cards={otherInventory}
          filteredCards={filteredOtherInventory}
          selectedIds={selectedRequestedIds}
          onToggle={toggleRequested}
        />
      </div>

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
