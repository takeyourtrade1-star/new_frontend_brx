'use client';

/**
 * Dettaglio di una proposta di scambio RICEVUTA (lato "venditore").
 * Tavolo editabile con doppio inventario, crediti e compensazione rapida.
 * Accetta · Contro proposta · Rifiuta — con Contro proposta in evidenza
 * quando l'utente modifica carte o crediti.
 */

import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { AlertTriangle, ArrowLeft, ArrowLeftRight, ArrowRight, Check, Handshake, Info, ShieldCheck, Sparkles, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { FlagIcon } from '@/components/ui/FlagIcon';
import { tradeBalance } from '@/lib/scambi/card-mock-value';

/** Sopra questo valore (in €), una carta può richiedere l'intermediazione Ebartex. */
const HIGH_VALUE_THRESHOLD = 100;
import { MOCK_INVENTORY_A, findMockInventoryItem } from './mock-trade-inventories';
import type { ReceivedProposal } from './mock-received-proposals';
import { formatTradeEuro, idsEqual, mockToTradeCard, MoneyField } from './trade-proposal-ui';
import { TradeComposer } from './TradeComposer';

const STEP_LABELS: { id: 'table' | 'credits' | 'review'; label: string }[] = [
  { id: 'table', label: 'Tavolo' },
  { id: 'credits', label: 'Crediti' },
  { id: 'review', label: 'Riepilogo' },
];

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

/**
 * Barra di navigazione step della controproposta, fissa in basso allo schermo.
 * Fluttua sopra il contenuto (sticky) così Indietro/Continua restano sempre
 * raggiungibili; scorre via col contenitore quando si esce dal flusso, senza
 * coprire ciò che sta sotto la pagina.
 */
function StepFooter({
  backLabel,
  backIcon,
  onBack,
  nextLabel,
  nextIcon,
  nextDisabled,
  onNext,
}: {
  backLabel: string;
  backIcon?: ReactNode;
  onBack: () => void;
  nextLabel: string;
  nextIcon?: ReactNode;
  nextDisabled?: boolean;
  onNext: () => void;
}) {
  return (
    <div className="sticky bottom-0 z-30 -mx-4 mt-4 border-t border-gray-200/70 bg-[#F5F4F0]/85 px-4 pt-3 pb-[calc(env(safe-area-inset-bottom,0px)+0.9rem)] backdrop-blur-md sm:-mx-6 sm:px-6">
      <div className="mx-auto flex max-w-2xl items-center justify-between gap-3">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 rounded-full border border-gray-300 bg-white px-4 py-2.5 text-[12px] font-bold uppercase tracking-wide text-gray-600 shadow-sm transition hover:bg-gray-50 active:scale-95"
        >
          {backIcon}
          {backLabel}
        </button>
        <button
          type="button"
          onClick={onNext}
          disabled={nextDisabled}
          className={cn(
            'inline-flex items-center gap-1.5 rounded-full px-5 py-2.5 text-[12px] font-bold uppercase tracking-wide text-white shadow-sm transition active:scale-95',
            nextDisabled
              ? 'cursor-not-allowed bg-gray-300'
              : 'bg-gradient-to-b from-[#FF8A26] to-[#FF7300] shadow-[#FF7300]/30 hover:shadow-md hover:shadow-[#FF7300]/40 hover:brightness-105',
          )}
        >
          {nextLabel}
          {nextIcon}
        </button>
      </div>
    </div>
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
  /** Modalità con cui lo scambio è stato finalizzato (per il messaggio d'esito). */
  const [acceptMethod, setAcceptMethod] = useState<'direct' | 'intermediary'>('direct');
  const [selectedMethod, setSelectedMethod] = useState<'direct' | 'intermediary' | null>(null);
  const [showAcceptChoice, setShowAcceptChoice] = useState(false);
  const [blockFuture, setBlockFuture] = useState(false);
  const [showCounterConfirm, setShowCounterConfirm] = useState(false);
  /** Di default si vede solo la proposta sul tavolo; le due liste inventario
   * compaiono solo entrando in modalità controproposta. */
  const [counterMode, setCounterMode] = useState(false);
  const [step, setStep] = useState<'table' | 'credits' | 'review'>('table');
  const inventoriesRef = useRef<HTMLElement>(null);
  const flowRef = useRef<HTMLDivElement>(null);

  // All'ingresso in controproposta e a ogni cambio step, riporta la vista in cima
  // al flusso (stepper): ogni passo parte da una posizione prevedibile, invece di
  // ereditare lo scroll del passo precedente (che finiva in punti casuali).
  useEffect(() => {
    if (!counterMode) return;
    const frame = requestAnimationFrame(() => {
      flowRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
    return () => cancelAnimationFrame(frame);
  }, [counterMode, step]);

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
  const gap = requestedValue - offeredValue;
  const balance = tradeBalance({ offeredValue, requestedValue, isPro: proposal.fromUser.isPro });

  // Soglia di valore: se una carta nello scambio supera HIGH_VALUE_THRESHOLD,
  // l'utente sceglie tra scambio diretto 1:1 o intermediazione Ebartex.
  // Sotto soglia lo scambio è sempre diretto 1:1.
  const tradeCards = useMemo(
    () => [...offeredCards, ...requestedCards],
    [offeredCards, requestedCards],
  );
  const maxCardValue = useMemo(
    () => tradeCards.reduce((max, c) => Math.max(max, c.value), 0),
    [tradeCards],
  );
  const hasHighValueCard = maxCardValue > HIGH_VALUE_THRESHOLD;

  const handleAccept = () => {
    if (hasHighValueCard) {
      setSelectedMethod(null);
      setShowAcceptChoice(true);
      return;
    }
    // Sotto soglia: scambio diretto 1:1.
    setAcceptMethod('direct');
    setStatus('accepted');
  };

  const chooseAccept = (method: 'direct' | 'intermediary') => {
    setAcceptMethod(method);
    setShowAcceptChoice(false);
    setStatus('accepted');
  };

  const hasModifications =
    addMoney !== initialAddMoney ||
    reqMoney !== initialReqMoney ||
    !idsEqual(selectedRequestedIds, initialRequestedIds) ||
    !idsEqual(selectedOfferedIds, initialOfferedIds);

  const canCounter =
    hasModifications && balance.balanced && (offeredCards.length > 0 || addMoney > 0);

  const canContinueTable = offeredCards.length > 0;
  const canContinueCredits = balance.balanced && offeredCards.length + (addMoney > 0 ? 1 : 0) > 0;

  const toggleOffered = (id: string) =>
    setSelectedOfferedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  const toggleRequested = (id: string) =>
    setSelectedRequestedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const exitCounter = () => {
    setSelectedRequestedIds(initialRequestedIds);
    setSelectedOfferedIds(initialOfferedIds);
    setAddMoney(initialAddMoney);
    setReqMoney(initialReqMoney);
    setSelectedMethod(null);
    setStep('table');
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
    const isIntermediary = acceptMethod === 'intermediary';
    return (
      <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 text-center">
        <div
          className={cn(
            'flex h-14 w-14 items-center justify-center rounded-full',
            isIntermediary ? 'bg-[#1D3160]/10' : 'bg-emerald-100',
          )}
        >
          {isIntermediary ? (
            <ShieldCheck className="h-7 w-7 text-[#1D3160]" strokeWidth={2.5} />
          ) : (
            <Check className="h-7 w-7 text-emerald-600" strokeWidth={3} />
          )}
        </div>
        <h2 className="text-lg font-bold text-[#1D3160]">Scambio accettato!</h2>
        <p className="max-w-sm text-sm text-gray-500">
          {isIntermediary ? (
            <>
              Hai scelto <span className="font-bold">Ebartex Guarantee</span>. Entrambi spedirete le
              carte a Ebartex, che ne verificherà qualità e condizioni prima di completare lo scambio
              con <span className="font-bold">{proposal.fromUser.name}</span>.
            </>
          ) : (
            <>
              Hai accettato la proposta di <span className="font-bold">{proposal.fromUser.name}</span> con
              scambio diretto 1:1: vi spedite le carte in autonomia, sotto la vostra responsabilità.
              Gli eventuali crediti restano congelati da Ebartex finché entrambi non confermate
              l&apos;arrivo delle carte. Ti contatteremo per finalizzare la spedizione.
            </>
          )}
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
    <ActionButton variant="accept" icon={<Check className="h-3.5 w-3.5" strokeWidth={3} />} onClick={handleAccept}>
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

      {/* Azioni per proposta originale (solo quando non siamo in controproposta) */}
      {status === 'open' && !counterMode && (
        <div className="mb-3 flex flex-wrap items-center justify-end gap-2">
          {rejectButton}
          {counterButton}
          {acceptButton}
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

      {/* Se siamo in controproposta, mostriamo il flusso a 3 step */}
      {status === 'open' && counterMode ? (
        <div ref={flowRef} className="mt-2 scroll-mt-28">
          {/* Stepper minimale */}
          <div className="mb-4 flex items-center gap-2" aria-label="Avanzamento proposta">
            {STEP_LABELS.map(({ id, label }, i) => {
              const activeIdx = STEP_LABELS.findIndex((s) => s.id === step);
              const isDone = i < activeIdx;
              const isActive = id === step;
              return (
                <div key={id} className="flex items-center gap-2">
                  {i > 0 && <span className="h-px w-5 bg-gray-300" aria-hidden />}
                  <span
                    className={cn(
                      'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide',
                      isActive
                        ? 'bg-[#1D3160] text-white'
                        : isDone
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-gray-100 text-gray-400',
                    )}
                  >
                    {isDone && <Check className="h-3 w-3" strokeWidth={3} aria-hidden />}
                    {i + 1}. {label}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Step 1: Tavolo */}
          {step === 'table' && (
            <>
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
                editable={true}
                showCredits={false}
                inventoriesSectionRef={inventoriesRef}
              />
              <StepFooter
                backLabel="Annulla modifiche"
                onBack={exitCounter}
                nextLabel="Continua"
                nextIcon={<ArrowRight className="h-3.5 w-3.5" strokeWidth={2.5} aria-hidden />}
                nextDisabled={!canContinueTable}
                onNext={() => canContinueTable && setStep('credits')}
              />
            </>
          )}

          {/* Step 2: Crediti */}
          {step === 'credits' && (
            <div className="flex flex-col gap-3">
              <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-[0_1px_2px_rgba(16,24,40,0.06),0_14px_34px_-18px_rgba(29,49,96,0.32)]">
                <div className="border-b border-gray-100 px-4 py-3">
                  <h2 className="text-sm font-black uppercase tracking-tight text-[#1D3160]">
                    Vuoi compensare con i crediti?
                  </h2>
                  <p className="mt-0.5 text-xs text-gray-500">
                    Se i valori non coincidono puoi <span className="font-semibold">offrire</span> crediti a{' '}
                    {proposal.fromUser.name} o <span className="font-semibold">chiederne</span>. Scegli tu quanto.
                  </p>
                </div>

                <div className="grid grid-cols-3 divide-x divide-gray-100 bg-[#FAFAF7] text-center">
                  <div className="px-2 py-2.5">
                    <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400">Offri</p>
                    <p className="text-sm font-black tabular-nums text-[#1D3160]">{formatTradeEuro(offeredValue)}</p>
                  </div>
                  <div className="px-2 py-2.5">
                    <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400">Chiedi</p>
                    <p className="text-sm font-black tabular-nums text-[#1D3160]">{formatTradeEuro(requestedValue)}</p>
                  </div>
                  <div className="px-2 py-2.5">
                    <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400">Differenza</p>
                    <p
                      className={cn(
                        'text-sm font-black tabular-nums',
                        gap === 0 ? 'text-emerald-600' : 'text-[#FF7300]',
                      )}
                    >
                      {formatTradeEuro(Math.abs(gap))}
                    </p>
                  </div>
                </div>

                <div className="flex flex-col gap-2 border-t border-gray-100 px-3 py-3 sm:flex-row sm:items-center sm:justify-between">
                  <MoneyField value={addMoney} onChange={setAddMoney} label="Offri crediti" />
                  <MoneyField value={reqMoney} onChange={setReqMoney} label="Chiedi crediti" />
                </div>

                <div
                  className={cn(
                    'flex items-start gap-2 border-t px-4 py-2.5 text-xs',
                    balance.balanced
                      ? 'border-emerald-100 bg-emerald-50 text-emerald-700'
                      : 'border-amber-100 bg-amber-50 text-amber-700',
                  )}
                >
                  {balance.balanced ? (
                    <>
                      <Check className="mt-0.5 h-3.5 w-3.5 shrink-0" strokeWidth={3} aria-hidden />
                      <span className="font-semibold">Scambio equo: puoi continuare.</span>
                    </>
                  ) : (
                    <>
                      <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
                      <span>
                        Scarto attuale {Math.round(balance.diffPct * 100)}% — tienilo entro il{' '}
                        <span className="font-bold">{Math.round(balance.threshold * 100)}%</span>
                        {gap !== 0 && (
                          <> ({formatTradeEuro(Math.abs(gap))} {gap > 0 ? 'in meno sul tuo lato' : 'in più sul tuo lato'})</>
                        )}
                        .
                      </span>
                    </>
                  )}
                </div>
              </section>

              <StepFooter
                backLabel="Indietro"
                backIcon={<ArrowLeft className="h-3.5 w-3.5" aria-hidden />}
                onBack={() => setStep('table')}
                nextLabel="Continua"
                nextIcon={<ArrowRight className="h-3.5 w-3.5" strokeWidth={2.5} aria-hidden />}
                nextDisabled={!canContinueCredits}
                onNext={() => canContinueCredits && setStep('review')}
              />
            </div>
          )}

          {/* Step 3: Riepilogo */}
          {step === 'review' && (
            <div className="flex flex-col gap-3">
              <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-[0_1px_2px_rgba(16,24,40,0.06),0_14px_34px_-18px_rgba(29,49,96,0.32)]">
                <div className="border-b border-gray-100 px-4 py-3">
                  <h2 className="text-sm font-black uppercase tracking-tight text-[#1D3160]">Riepilogo Scambio</h2>
                  <p className="mt-0.5 text-xs text-gray-500">
                    Invii a <span className="font-bold text-gray-800">{proposal.fromUser.name}</span>:
                  </p>
                </div>
                <div className="space-y-2 px-3 py-3 text-sm">
                  <div className="rounded-lg bg-gray-50 px-3 py-2">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Offri</span>
                      <span className="font-bold text-[#1D3160]">
                        {offeredCards.length} {offeredCards.length === 1 ? 'carta' : 'carte'}
                        {addMoney > 0 ? ` + ${formatTradeEuro(addMoney)} in crediti` : ''} · {formatTradeEuro(offeredValue)}
                      </span>
                    </div>
                    {offeredCards.length > 0 && (
                      <ul className="mt-1.5 space-y-1 border-t border-gray-200 pt-1.5">
                        {offeredCards.map((c) => (
                          <li key={c.id} className="flex items-center justify-between gap-2 text-xs text-gray-600">
                            <span className="truncate">{c.name}</span>
                            <span className="shrink-0 font-semibold text-gray-700">{formatTradeEuro(c.value)}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                  <div className="rounded-lg bg-gray-50 px-3 py-2">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Chiedi</span>
                      <span className="font-bold text-[#1D3160]">
                        {requestedCards.length} {requestedCards.length === 1 ? 'carta' : 'carte'}
                        {reqMoney > 0 ? ` + ${formatTradeEuro(reqMoney)} in crediti` : ''} · {formatTradeEuro(requestedValue)}
                      </span>
                    </div>
                    {requestedCards.length > 0 && (
                      <ul className="mt-1.5 space-y-1 border-t border-gray-200 pt-1.5">
                        {requestedCards.map((c) => (
                          <li key={c.id} className="flex items-center justify-between gap-2 text-xs text-gray-600">
                            <span className="truncate">{c.name}</span>
                            <span className="shrink-0 font-semibold text-gray-700">{formatTradeEuro(c.value)}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              </section>

              <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-[0_1px_2px_rgba(16,24,40,0.06),0_14px_34px_-18px_rgba(29,49,96,0.32)]">
                <div className="border-b border-gray-100 px-4 py-3">
                  <h2 className="text-sm font-black uppercase tracking-tight text-[#1D3160]">Come volete scambiarvi le carte?</h2>
                </div>
                <div className="grid gap-3 px-4 py-4 sm:grid-cols-2">
                  {/* Ebartex Guarantee — opzione premium/consigliata, arancione brand */}
                  <button
                    type="button"
                    onClick={() => setSelectedMethod('intermediary')}
                    className={cn(
                      'group relative flex flex-col gap-2.5 overflow-hidden rounded-2xl border-2 p-4 text-left text-white transition-all hover:-translate-y-0.5 active:translate-y-0',
                      'bg-gradient-to-br from-[#FF9838] via-[#FF7300] to-[#EA5F05]',
                      selectedMethod === 'intermediary'
                        ? 'border-white shadow-xl shadow-[#FF7300]/45 ring-4 ring-[#FF7300]/25'
                        : 'border-white/40 shadow-lg shadow-[#FF7300]/25 hover:shadow-xl hover:shadow-[#FF7300]/35',
                    )}
                  >
                    {/* Glow decorativo + shine */}
                    <span
                      className="pointer-events-none absolute -right-8 -top-10 h-28 w-28 rounded-full bg-white/25 blur-2xl"
                      aria-hidden
                    />
                    <span
                      className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/10 to-transparent"
                      aria-hidden
                    />
                    <div className="relative flex w-full items-center justify-between">
                      <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/20 text-white shadow-sm ring-1 ring-white/40 backdrop-blur-sm">
                        <ShieldCheck className="h-5 w-5" strokeWidth={2.5} />
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center gap-1 rounded-full bg-white px-2 py-0.5 text-[9px] font-black uppercase tracking-wide text-[#EA5F05] shadow-sm">
                          <Sparkles className="h-2.5 w-2.5" strokeWidth={2.5} aria-hidden />
                          Consigliato
                        </span>
                        <span
                          className={cn(
                            'flex h-5 w-5 items-center justify-center rounded-full border-2 transition-all',
                            selectedMethod === 'intermediary' ? 'border-white bg-white' : 'border-white/70 bg-white/15',
                          )}
                        >
                          {selectedMethod === 'intermediary' && <span className="h-1.5 w-1.5 rounded-full bg-[#FF7300]" />}
                        </span>
                      </div>
                    </div>
                    <span className="relative flex items-center gap-1.5 text-[13px] font-black uppercase tracking-wide text-white">
                      Ebartex Guarantee
                    </span>
                    <span className="relative text-xs leading-relaxed text-white/85">
                      Spedite entrambi le carte a Ebartex: le verifichiamo una a una e completiamo lo
                      scambio solo quando è tutto perfetto. Massima sicurezza.
                    </span>
                  </button>

                  {/* Spedizione diretta — opzione base, tono spento */}
                  <button
                    type="button"
                    onClick={() => setSelectedMethod('direct')}
                    className={cn(
                      'group flex flex-col gap-2.5 rounded-2xl border-2 p-4 text-left transition-all hover:-translate-y-0.5 active:translate-y-0',
                      selectedMethod === 'direct'
                        ? 'border-gray-400 bg-white shadow-md ring-1 ring-gray-300'
                        : 'border-gray-200 bg-gray-50 hover:border-gray-300 hover:bg-white hover:shadow-sm',
                    )}
                  >
                    <div className="flex w-full items-center justify-between">
                      <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-gray-200 text-gray-500 ring-1 ring-gray-300">
                        <Handshake className="h-5 w-5" strokeWidth={2} />
                      </span>
                      <span
                        className={cn(
                          'flex h-5 w-5 items-center justify-center rounded-full border-2 transition-all',
                          selectedMethod === 'direct' ? 'border-gray-500 bg-gray-500' : 'border-gray-300 bg-white',
                        )}
                      >
                        {selectedMethod === 'direct' && <span className="h-1.5 w-1.5 rounded-full bg-white" />}
                      </span>
                    </div>
                    <span className="text-[13px] font-black uppercase tracking-wide text-gray-600">
                      Spedizione diretta 1:1
                    </span>
                    <span className="text-xs leading-relaxed text-gray-400">
                      Tu e {proposal.fromUser.name} vi spedite le carte direttamente. Il modo più veloce,
                      da collezionista a collezionista.
                    </span>
                  </button>
                </div>

                {selectedMethod === 'intermediary' && (
                  <div className="mx-4 mb-4 flex items-start gap-2 rounded-xl bg-[#FF7300]/8 px-3 py-2.5 text-[12px] leading-snug text-[#B24E04] ring-1 ring-[#FF7300]/20">
                    <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                    <span>
                      <span className="font-bold">Zero pensieri:</span> riceviamo le carte di entrambi,
                      ne verifichiamo qualità e condizioni e completiamo lo scambio per voi.
                    </span>
                  </div>
                )}
                {selectedMethod === 'direct' && (
                  <div className="mx-4 mb-4 flex items-start gap-2 rounded-xl bg-gray-100 px-3 py-2.5 text-[12px] leading-snug text-gray-600 ring-1 ring-gray-200">
                    <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                    <span>
                      <span className="font-bold">Scambio in autonomia:</span> con la spedizione diretta
                      siete voi i protagonisti — ogni utente è responsabile del proprio scambio. Per la
                      vostra tranquillità, Ebartex <span className="font-bold">congela gli eventuali
                      crediti</span> e li sblocca solo quando entrambi confermate l&apos;arrivo delle carte.
                    </span>
                  </div>
                )}
              </section>

              <StepFooter
                backLabel="Indietro"
                backIcon={<ArrowLeft className="h-3.5 w-3.5" aria-hidden />}
                onBack={() => setStep('credits')}
                nextLabel="Invia controproposta"
                nextDisabled={!selectedMethod}
                onNext={() => selectedMethod && confirmCounter()}
              />
            </div>
          )}
        </div>
      ) : (
        /* Altrimenti, vista in sola lettura della proposta ricevuta */
        <>
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
            editable={false}
            showCredits={true}
            inventoriesSectionRef={inventoriesRef}
          />
        </>
      )}

      {/* Modale scelta modalità scambio per carte di alto valore (> soglia) */}
      {showAcceptChoice && (
        <div className="fixed inset-0 z-[200] flex items-end justify-center bg-[#1D3160]/60 p-0 backdrop-blur-sm sm:items-center sm:p-4">
          <div className="w-full max-w-xl overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:rounded-3xl">
            {/* Header */}
            <div className="flex items-start gap-3 bg-gradient-to-br from-amber-50 via-amber-50/60 to-white px-5 pb-4 pt-5">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-amber-100 text-amber-600 ring-1 ring-amber-200/80">
                <AlertTriangle className="h-6 w-6" />
              </span>
              <div className="min-w-0">
                <h3 className="text-lg font-black tracking-tight text-[#1D3160]">
                  Scambio di alto valore
                </h3>
                <p className="mt-0.5 text-sm leading-snug text-gray-500">
                  Carta fino a{' '}
                  <span className="font-bold text-amber-600">{formatTradeEuro(maxCardValue)}</span> nello
                  scambio (soglia {formatTradeEuro(HIGH_VALUE_THRESHOLD)}). Come vuoi procedere?
                </p>
              </div>
            </div>

            {/* Opzioni */}
            <div className="grid gap-3 px-5 py-4 sm:grid-cols-2">
              {/* Ebartex Guarantee — opzione premium/consigliata, arancione brand */}
              <button
                type="button"
                onClick={() => setSelectedMethod('intermediary')}
                className={cn(
                  "group relative flex flex-col gap-2.5 overflow-hidden rounded-2xl border-2 p-4 text-left text-white transition-all hover:-translate-y-0.5 active:translate-y-0",
                  "bg-gradient-to-br from-[#FF9838] via-[#FF7300] to-[#EA5F05]",
                  selectedMethod === 'intermediary'
                    ? "border-white shadow-xl shadow-[#FF7300]/45 ring-4 ring-[#FF7300]/25"
                    : "border-white/40 shadow-lg shadow-[#FF7300]/25 hover:shadow-xl hover:shadow-[#FF7300]/35"
                )}
              >
                <span
                  className="pointer-events-none absolute -right-8 -top-10 h-28 w-28 rounded-full bg-white/25 blur-2xl"
                  aria-hidden
                />
                <span
                  className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/10 to-transparent"
                  aria-hidden
                />
                <div className="relative flex w-full items-center justify-between">
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/20 text-white shadow-sm ring-1 ring-white/40 backdrop-blur-sm">
                    <ShieldCheck className="h-5 w-5" strokeWidth={2.5} />
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1 rounded-full bg-white px-2 py-0.5 text-[9px] font-black uppercase tracking-wide text-[#EA5F05] shadow-sm">
                      <Sparkles className="h-2.5 w-2.5" strokeWidth={2.5} aria-hidden />
                      Consigliato
                    </span>
                    <div
                      className={cn(
                        "flex h-5 w-5 items-center justify-center rounded-full border-2 transition-all",
                        selectedMethod === 'intermediary'
                          ? "border-white bg-white"
                          : "border-white/70 bg-white/15"
                      )}
                    >
                      {selectedMethod === 'intermediary' && (
                        <div className="h-1.5 w-1.5 rounded-full bg-[#FF7300]" />
                      )}
                    </div>
                  </div>
                </div>
                <span className="relative flex items-center gap-1.5 text-[13px] font-black uppercase tracking-wide text-white">
                  <ShieldCheck className="h-4 w-4 shrink-0 text-white" aria-hidden />
                  Ebartex Guarantee
                </span>
                <span className="relative text-xs leading-relaxed text-white/85">
                  Spedite entrambi le carte a Ebartex: le verifichiamo una a una e completiamo lo
                  scambio solo quando è tutto perfetto. Massima sicurezza, zero pensieri.
                </span>
              </button>

              {/* Scambio diretto — opzione base, tono spento */}
              <button
                type="button"
                onClick={() => setSelectedMethod('direct')}
                className={cn(
                  "group flex flex-col gap-2.5 rounded-2xl border-2 p-4 text-left transition-all hover:-translate-y-0.5 active:translate-y-0",
                  selectedMethod === 'direct'
                    ? "border-gray-400 bg-white shadow-md ring-1 ring-gray-300"
                    : "border-gray-200 bg-gray-50 hover:border-gray-300 hover:bg-white hover:shadow-sm"
                )}
              >
                <div className="flex w-full items-center justify-between">
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-gray-200 text-gray-500 ring-1 ring-gray-300">
                    <Handshake className="h-5 w-5" strokeWidth={2} />
                  </span>
                  <div
                    className={cn(
                      "flex h-5 w-5 items-center justify-center rounded-full border-2 transition-all",
                      selectedMethod === 'direct'
                        ? "border-gray-500 bg-gray-500"
                        : "border-gray-300 bg-white"
                    )}
                  >
                    {selectedMethod === 'direct' && (
                      <div className="h-1.5 w-1.5 rounded-full bg-white" />
                    )}
                  </div>
                </div>
                <span className="text-[13px] font-black uppercase tracking-wide text-gray-600">
                  Scambio diretto 1:1
                </span>
                <span className="text-xs leading-relaxed text-gray-400">
                  Tu e {proposal.fromUser.name} vi spedite le carte direttamente. Veloce e senza
                  intermediari: ogni utente è responsabile del proprio scambio, e Ebartex congela gli
                  eventuali crediti finché entrambi non confermate l&apos;arrivo delle carte.
                </span>
                <span className="mt-1 flex items-start gap-1.5 rounded-lg bg-gray-100 px-2.5 py-1.5 text-[11px] font-medium leading-snug text-gray-600 ring-1 ring-gray-200">
                  <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
                  Consiglio: trattandosi di carte di valore, puoi chiedere qualche foto e video e dare
                  un&apos;occhiata alle condizioni prima di confermare.
                </span>
              </button>
            </div>

            <div className="flex gap-3 px-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-2 sm:pb-5">
              <button
                type="button"
                onClick={() => {
                  setSelectedMethod(null);
                  setShowAcceptChoice(false);
                }}
                className="flex-1 rounded-xl border border-gray-300 bg-white py-3 text-sm font-bold text-gray-600 transition hover:bg-gray-50 sm:py-2.5"
              >
                Annulla
              </button>
              <button
                type="button"
                disabled={!selectedMethod}
                onClick={() => {
                  if (selectedMethod) {
                    chooseAccept(selectedMethod);
                  }
                }}
                className={cn(
                  "flex-1 rounded-xl py-3 text-sm font-bold uppercase tracking-wide text-white transition sm:py-2.5 active:scale-95",
                  selectedMethod
                    ? "bg-[#FF7300] hover:bg-[#e86800]"
                    : "bg-gray-200 text-gray-400 cursor-not-allowed"
                )}
              >
                Conferma
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
