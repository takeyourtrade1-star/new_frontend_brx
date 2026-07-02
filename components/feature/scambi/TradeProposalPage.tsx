'use client';

/**
 * Pagina "Proponi scambio" — flusso in 3 passi:
 *
 *  1. Tavolo    → scegli le carte da offrire/chiedere (niente crediti qui)
 *  2. Crediti   → scelta manuale: offri o chiedi crediti per compensare
 *  3. Riepilogo → riepilogo completo + scelta consegna (diretta / Ebartex
 *                 Guarantee) con le rispettive avvertenze → invio
 *
 * Regola di equità: valore offerto e richiesto non devono differire più del
 * 15% (venditori professionali) o del 10% (privati). La compensazione è
 * manuale (nessun "Compensa" automatico).
 */

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ArrowLeftRight, ArrowRight, Check, Info, ShieldCheck } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ScambiIcon } from '@/components/ui/ScambiIcon';
import { FlagIcon } from '@/components/ui/FlagIcon';
import {
  getTradeProposalContext,
  clearTradeProposalContext,
  type TradeProposalContext,
} from '@/lib/scambi/trade-proposal-context';
import { getMockCardValueEur, tradeBalance } from '@/lib/scambi/card-mock-value';
import { MOCK_INVENTORY_A, MOCK_INVENTORY_B, findMockInventoryItem } from './mock-trade-inventories';
import { formatTradeEuro, mockToTradeCard, MoneyField, type TradeCard } from './trade-proposal-ui';
import { TradeComposer } from './TradeComposer';

type ProposalStep = 'table' | 'credits' | 'review';
type DeliveryMethod = 'direct' | 'intermediary';

const STEP_LABELS: { id: ProposalStep; label: string }[] = [
  { id: 'table', label: 'Tavolo' },
  { id: 'credits', label: 'Crediti' },
  { id: 'review', label: 'Riepilogo' },
];

/* ------------------------------------------------------------------ */
/*  Pagina                                                             */
/* ------------------------------------------------------------------ */

export function TradeProposalPage() {
  const router = useRouter();
  const [ctx, setCtx] = useState<TradeProposalContext | null>(null);
  const [hydrated, setHydrated] = useState(false);

  const [selectedOfferedIds, setSelectedOfferedIds] = useState<string[]>([]);
  const [selectedRequestedIds, setSelectedRequestedIds] = useState<string[]>([]);
  const [addMoney, setAddMoney] = useState(0); // Offri crediti → aumenta l'offerto
  const [reqMoney, setReqMoney] = useState(0); // Chiedi crediti → aumenta il richiesto
  const [step, setStep] = useState<ProposalStep>('table');
  const [method, setMethod] = useState<DeliveryMethod | null>(null);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    setCtx(getTradeProposalContext());
    setHydrated(true);
  }, []);

  const myInventory = useMemo(() => MOCK_INVENTORY_A.map(mockToTradeCard), []);
  const otherInventory = useMemo(() => MOCK_INVENTORY_B.map(mockToTradeCard), []);

  const isCounter = ctx?.mode === 'counter';

  /** Carta base richiesta (quella selezionata dall'altro utente). */
  const baseCard: TradeCard | null = useMemo(() => {
    if (!ctx) return null;
    const fromInventory = findMockInventoryItem(ctx.card.id);
    if (fromInventory) return mockToTradeCard(fromInventory);
    return {
      id: ctx.card.id,
      name: ctx.card.name,
      image: ctx.card.image,
      condition: ctx.card.condition,
      language: 'en',
      printing: 'standard',
      value: getMockCardValueEur(ctx.card.id),
    };
  }, [ctx]);

  const offeredCards = useMemo(
    () => myInventory.filter((c) => selectedOfferedIds.includes(c.id)),
    [myInventory, selectedOfferedIds],
  );
  const requestedExtraCards = useMemo(
    () => otherInventory.filter((c) => selectedRequestedIds.includes(c.id)),
    [otherInventory, selectedRequestedIds],
  );
  const requestedCards = useMemo(
    () => (baseCard ? [baseCard, ...requestedExtraCards] : requestedExtraCards),
    [baseCard, requestedExtraCards],
  );

  const offeredValue = offeredCards.reduce((s, c) => s + c.value, 0) + addMoney;
  const requestedValue = requestedCards.reduce((s, c) => s + c.value, 0) + reqMoney;

  const isPro = ctx?.seller.isPro ?? false;
  const balance = tradeBalance({ offeredValue, requestedValue, isPro });
  const canContinueTable = offeredCards.length > 0;
  const canContinueCredits = balance.balanced && offeredCards.length + (addMoney > 0 ? 1 : 0) > 0;
  const canSubmit = method !== null;

  const gap = requestedValue - offeredValue; // >0: offro poco · <0: chiedo poco

  const toggleOffered = (id: string) =>
    setSelectedOfferedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  const toggleRequested = (id: string) =>
    setSelectedRequestedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const confirmSend = () => {
    clearTradeProposalContext();
    setSubmitted(true);
    window.setTimeout(() => router.push('/scambi'), 1400);
  };

  /* ---- Stati di bordo ---- */

  if (!hydrated) {
    return <div className="min-h-[60vh] bg-[#F5F4F0]" />;
  }

  if (!ctx || !baseCard) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 bg-[#F5F4F0] px-4 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#FFF4EC]">
          <ScambiIcon className="h-7 w-7 text-[#FF7300]" />
        </div>
        <h1 className="text-lg font-bold text-[#1D3160]">Nessuno scambio selezionato</h1>
        <p className="max-w-md text-sm text-gray-500">
          Apri lo scambio dalla lista venditori di una carta usando il bottone “Proponi scambio”.
        </p>
        <button
          type="button"
          onClick={() => router.push('/scambi')}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-full bg-[#FF7300] px-5 text-sm font-semibold text-white transition hover:bg-[#e66800] active:scale-95"
        >
          <ArrowLeft className="h-4 w-4" /> Torna agli scambi
        </button>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 bg-[#F5F4F0] px-4 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100">
          <Check className="h-7 w-7 text-emerald-600" strokeWidth={3} />
        </div>
        <h1 className="text-lg font-bold text-[#1D3160]">{isCounter ? 'Controproposta inviata!' : 'Proposta inviata!'}</h1>
        <p className="max-w-md text-sm text-gray-500">
          Inviata a <span className="font-bold">{ctx.seller.name}</span>. Ti riportiamo agli scambi…
        </p>
      </div>
    );
  }

  /* ---- Pagina ---- */

  return (
    <div className="min-h-screen bg-[#F5F4F0] pb-16">
      <div className="mx-auto max-w-4xl px-4 py-5 sm:px-6">
        {/* Intestazione compatta */}
        <div className="mb-3 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-gray-500 transition hover:text-[#1D3160]"
          >
            <ArrowLeft className="h-4 w-4" /> Indietro
          </button>
          <div className="flex items-center gap-1.5 text-xs text-gray-500">
            <span>con</span>
            {ctx.seller.country && <FlagIcon country={ctx.seller.country} size="xs" />}
            <span className="font-bold text-[#1D3160]">{ctx.seller.name}</span>
            <span className="text-gray-300">·</span>
            <span className="font-medium">{isPro ? 'Professionale' : 'Privato'}</span>
          </div>
        </div>

        <div className="mb-2 flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
          <h1 className="text-xl font-black uppercase tracking-tight text-[#1D3160]">
            {isCounter ? 'Contro proposta' : 'Proponi scambio'}
          </h1>
        </div>

        {/* Stepper minimale: Tavolo → Crediti → Riepilogo */}
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

        {/* ── Passo 1: tavolo (senza crediti) ── */}
        {step === 'table' && (
          <>
            <TradeComposer
              myInventory={myInventory}
              otherInventory={otherInventory}
              otherName={ctx.seller.name}
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
              lockedRequestedId={baseCard.id}
              showCredits={false}
            />
            <div className="mt-4 flex justify-end">
              <button
                type="button"
                onClick={() => canContinueTable && setStep('credits')}
                disabled={!canContinueTable}
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-full px-5 py-2 text-[12px] font-bold uppercase tracking-wide text-white transition active:scale-95',
                  canContinueTable
                    ? 'bg-gradient-to-b from-[#FF8A26] to-[#FF7300] shadow-sm shadow-[#FF7300]/30 hover:shadow-md hover:shadow-[#FF7300]/40 hover:brightness-105'
                    : 'cursor-not-allowed bg-gray-300',
                )}
              >
                Continua <ArrowRight className="h-3.5 w-3.5" strokeWidth={2.5} aria-hidden />
              </button>
            </div>
          </>
        )}

        {/* ── Passo 2: crediti manuali ── */}
        {step === 'credits' && (
          <div className="flex flex-col gap-3">
            <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-[0_1px_2px_rgba(16,24,40,0.06),0_14px_34px_-18px_rgba(29,49,96,0.32)]">
              <div className="border-b border-gray-100 px-4 py-3">
                <h2 className="text-sm font-black uppercase tracking-tight text-[#1D3160]">
                  Vuoi compensare con i crediti?
                </h2>
                <p className="mt-0.5 text-xs text-gray-500">
                  Se i valori non coincidono puoi <span className="font-semibold">offrire</span> crediti a{' '}
                  {ctx.seller.name} o <span className="font-semibold">chiederne</span>. Scegli tu quanto.
                </p>
              </div>

              {/* Totali correnti */}
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

              {/* Stato equità (testuale, senza bilancia) */}
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

            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => setStep('table')}
                className="inline-flex items-center gap-1.5 rounded-full border border-gray-300 bg-white px-4 py-2 text-[12px] font-bold uppercase tracking-wide text-gray-600 transition hover:bg-gray-50"
              >
                <ArrowLeft className="h-3.5 w-3.5" aria-hidden /> Indietro
              </button>
              <button
                type="button"
                onClick={() => canContinueCredits && setStep('review')}
                disabled={!canContinueCredits}
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-full px-5 py-2 text-[12px] font-bold uppercase tracking-wide text-white transition active:scale-95',
                  canContinueCredits
                    ? 'bg-gradient-to-b from-[#FF8A26] to-[#FF7300] shadow-sm shadow-[#FF7300]/30 hover:shadow-md hover:shadow-[#FF7300]/40 hover:brightness-105'
                    : 'cursor-not-allowed bg-gray-300',
                )}
              >
                Continua <ArrowRight className="h-3.5 w-3.5" strokeWidth={2.5} aria-hidden />
              </button>
            </div>
          </div>
        )}

        {/* ── Passo 3: riepilogo + consegna ── */}
        {step === 'review' && (
          <div className="flex flex-col gap-3">
            {/* Riepilogo */}
            <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-[0_1px_2px_rgba(16,24,40,0.06),0_14px_34px_-18px_rgba(29,49,96,0.32)]">
              <div className="border-b border-gray-100 px-4 py-3">
                <h2 className="text-sm font-black uppercase tracking-tight text-[#1D3160]">Riepilogo</h2>
                <p className="mt-0.5 text-xs text-gray-500">
                  Invii a <span className="font-bold text-gray-800">{ctx.seller.name}</span>:
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

            {/* Scelta consegna */}
            <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-[0_1px_2px_rgba(16,24,40,0.06),0_14px_34px_-18px_rgba(29,49,96,0.32)]">
              <div className="border-b border-gray-100 px-4 py-3">
                <h2 className="text-sm font-black uppercase tracking-tight text-[#1D3160]">Come volete scambiarvi le carte?</h2>
              </div>
              <div className="grid gap-3 px-4 py-4 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => setMethod('direct')}
                  className={cn(
                    'group flex flex-col gap-2.5 rounded-2xl border-2 p-4 text-left transition-all hover:-translate-y-0.5 active:translate-y-0',
                    method === 'direct'
                      ? 'border-[#FF7300] bg-orange-50/20 shadow-lg shadow-[#FF7300]/10'
                      : 'border-gray-200 bg-white hover:border-[#FF7300]/50 hover:shadow-md',
                  )}
                >
                  <div className="flex w-full items-center justify-between">
                    <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-[#FF8A26] to-[#FF7300] text-white shadow-sm">
                      <ArrowLeftRight className="h-5 w-5" strokeWidth={2.5} />
                    </span>
                    <span
                      className={cn(
                        'flex h-5 w-5 items-center justify-center rounded-full border transition-all',
                        method === 'direct' ? 'border-[#FF7300] bg-[#FF7300]' : 'border-gray-300 bg-white',
                      )}
                    >
                      {method === 'direct' && <span className="h-1.5 w-1.5 rounded-full bg-white" />}
                    </span>
                  </div>
                  <span className="text-[13px] font-black uppercase tracking-wide text-[#1D3160]">
                    Spedizione diretta 1:1
                  </span>
                  <span className="text-xs leading-relaxed text-gray-500">
                    Tu e {ctx.seller.name} vi spedite le carte direttamente. Il modo più veloce,
                    da collezionista a collezionista.
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setMethod('intermediary')}
                  className={cn(
                    'group relative flex flex-col gap-2.5 rounded-2xl border-2 p-4 text-left transition-all hover:-translate-y-0.5 active:translate-y-0',
                    method === 'intermediary'
                      ? 'border-[#1D3160] bg-[#1D3160]/5 shadow-lg shadow-[#1D3160]/10'
                      : 'border-[#1D3160]/20 bg-[#F8FAFD] hover:border-[#1D3160]/50 hover:shadow-md',
                  )}
                >
                  <div className="flex w-full items-center justify-between">
                    <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-[#2A4480] to-[#1D3160] text-white shadow-sm">
                      <ShieldCheck className="h-5 w-5" strokeWidth={2.5} />
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="rounded-full bg-[#1D3160] px-2 py-0.5 text-[9px] font-black uppercase tracking-wide text-white">
                        Consigliato
                      </span>
                      <span
                        className={cn(
                          'flex h-5 w-5 items-center justify-center rounded-full border transition-all',
                          method === 'intermediary' ? 'border-[#1D3160] bg-[#1D3160]' : 'border-gray-300 bg-white',
                        )}
                      >
                        {method === 'intermediary' && <span className="h-1.5 w-1.5 rounded-full bg-white" />}
                      </span>
                    </div>
                  </div>
                  <span className="flex items-center gap-1.5 text-[13px] font-black uppercase tracking-wide text-[#1D3160]">
                    Ebartex Guarantee
                  </span>
                  <span className="text-xs leading-relaxed text-gray-500">
                    Spedite entrambi le carte a Ebartex: le verifichiamo una a una e completiamo lo
                    scambio solo quando è tutto perfetto. Massima sicurezza.
                  </span>
                </button>
              </div>

              {/* Avvertenza dinamica in base alla scelta */}
              {method === 'direct' && (
                <div className="mx-4 mb-4 flex items-start gap-2 rounded-xl bg-sky-50 px-3 py-2.5 text-[12px] leading-snug text-sky-800 ring-1 ring-sky-200/70">
                  <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                  <span>
                    <span className="font-bold">Scambio in autonomia:</span> con la spedizione diretta
                    siete voi i protagonisti — ogni utente è responsabile del proprio scambio. Per la
                    vostra tranquillità, Ebartex <span className="font-bold">congela gli eventuali
                    crediti</span> e li sblocca solo quando entrambi confermate l&apos;arrivo delle carte.
                  </span>
                </div>
              )}
              {method === 'intermediary' && (
                <div className="mx-4 mb-4 flex items-start gap-2 rounded-xl bg-[#1D3160]/5 px-3 py-2.5 text-[12px] leading-snug text-[#1D3160] ring-1 ring-[#1D3160]/15">
                  <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                  <span>
                    <span className="font-bold">Zero pensieri:</span> riceviamo le carte di entrambi,
                    ne verifichiamo qualità e condizioni e completiamo lo scambio per voi.
                  </span>
                </div>
              )}
            </section>

            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => setStep('credits')}
                className="inline-flex items-center gap-1.5 rounded-full border border-gray-300 bg-white px-4 py-2 text-[12px] font-bold uppercase tracking-wide text-gray-600 transition hover:bg-gray-50"
              >
                <ArrowLeft className="h-3.5 w-3.5" aria-hidden /> Indietro
              </button>
              <button
                type="button"
                onClick={() => canSubmit && confirmSend()}
                disabled={!canSubmit}
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-full px-5 py-2 text-[12px] font-bold uppercase tracking-wide text-white transition active:scale-95',
                  canSubmit
                    ? 'bg-gradient-to-b from-[#FF8A26] to-[#FF7300] shadow-sm shadow-[#FF7300]/30 hover:shadow-md hover:shadow-[#FF7300]/40 hover:brightness-105'
                    : 'cursor-not-allowed bg-gray-300',
                )}
              >
                {isCounter ? 'Invia controproposta' : 'Invia proposta'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
