'use client';

/**
 * Pagina "Proponi scambio" — il tavolo di scambio aperto dalla lista
 * venditori della pagina prodotto (o come controproposta da "I miei scambi").
 *
 * Layout (dall'alto):
 *  - intestazione compatta
 *  - banner equità + "Compensazione rapida" (quando lo scambio non è bilanciato)
 *  - controlli: "Aggiungi differenza" | Invia Proposta | "Richiedi differenza"
 *  - "tavolo": sopra ciò che chiedo, sotto ciò che offro
 *  - due liste verticali: il mio inventario | l'inventario dell'altro utente
 *
 * Regola di equità: valore offerto e richiesto non devono differire più del
 * 15% (venditori professionali) o del 10% (privati).
 */

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Check } from 'lucide-react';
import { ScambiIcon } from '@/components/ui/ScambiIcon';
import { FlagIcon } from '@/components/ui/FlagIcon';
import {
  getTradeProposalContext,
  clearTradeProposalContext,
  type TradeProposalContext,
} from '@/lib/scambi/trade-proposal-context';
import { getMockCardValueEur, tradeBalance } from '@/lib/scambi/card-mock-value';
import { MOCK_INVENTORY_A, MOCK_INVENTORY_B, findMockInventoryItem } from './mock-trade-inventories';
import {
  filterTradeCards,
  formatTradeEuro,
  InventoryPanel,
  mockToTradeCard,
  AnimatedBalanceScale,
  MoneyChip,
  MoneyField,
  TableCard,
  type InventoryFiltersState,
  type TradeCard,
} from './trade-proposal-ui';

/* ------------------------------------------------------------------ */
/*  Pagina                                                             */
/* ------------------------------------------------------------------ */

export function TradeProposalPage() {
  const router = useRouter();
  const [ctx, setCtx] = useState<TradeProposalContext | null>(null);
  const [hydrated, setHydrated] = useState(false);

  const [selectedOfferedIds, setSelectedOfferedIds] = useState<string[]>([]);
  const [selectedRequestedIds, setSelectedRequestedIds] = useState<string[]>([]);
  const [addMoney, setAddMoney] = useState(0); // Aggiungi differenza → aumenta l'offerto
  const [reqMoney, setReqMoney] = useState(0); // Richiedi differenza → aumenta il richiesto
  const [showConfirm, setShowConfirm] = useState(false);
  const [submitted, setSubmitted] = useState(false);
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

  useEffect(() => {
    setCtx(getTradeProposalContext());
    setHydrated(true);
  }, []);

  const myInventory = useMemo(() => MOCK_INVENTORY_A.map(mockToTradeCard), []);
  const otherInventory = useMemo(() => MOCK_INVENTORY_B.map(mockToTradeCard), []);
  const filteredMyInventory = useMemo(
    () => filterTradeCards(myInventory, myFilters),
    [myInventory, myFilters],
  );
  const filteredOtherInventory = useMemo(
    () => filterTradeCards(otherInventory, otherFilters),
    [otherInventory, otherFilters],
  );

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
  const canSubmit = balance.balanced && offeredCards.length + (addMoney > 0 ? 1 : 0) > 0;

  const gap = requestedValue - offeredValue; // >0: offro poco · <0: chiedo poco

  const toggleOffered = (id: string) =>
    setSelectedOfferedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  const toggleRequested = (id: string) =>
    setSelectedRequestedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  /** Compensazione rapida: pareggia la differenza aggiungendo crediti sul lato carente. */
  const quickCompensate = () => {
    if (gap > 0) setAddMoney((m) => m + gap);
    else if (gap < 0) setReqMoney((m) => m - gap);
  };

  const confirmSend = () => {
    clearTradeProposalContext();
    setShowConfirm(false);
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

        <div className="mb-3 flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
          <h1 className="text-xl font-black uppercase tracking-tight text-[#1D3160]">
            {isCounter ? 'Contro proposta' : 'Proponi scambio'}
          </h1>
          <span className="text-xs text-gray-500">
            tieni lo scarto entro il{' '}
            <span className="font-bold text-[#1D3160]">{Math.round(balance.threshold * 100)}%</span>
          </span>
        </div>

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

        {/* Controlli: crediti + invia (sopra il tavolo) */}
        <div className="mb-4 flex flex-col items-stretch gap-3 rounded-xl border border-gray-200 bg-white px-3.5 py-3 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <MoneyField value={addMoney} onChange={setAddMoney} label="Aggiungi differenza" />
          <button
            type="button"
            onClick={() => canSubmit && setShowConfirm(true)}
            disabled={!canSubmit}
            className={`order-first rounded-lg px-6 py-2.5 text-sm font-black uppercase tracking-wide text-white transition sm:order-none ${
              canSubmit
                ? 'bg-[#FF7300] hover:bg-[#e86800] active:scale-95'
                : 'cursor-not-allowed bg-gray-300'
            }`}
          >
            Invia Proposta
          </button>
          <MoneyField value={reqMoney} onChange={setReqMoney} label="Richiedi differenza" />
        </div>

        {/* TAVOLO */}
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          {/* Sopra: ciò che chiedo */}
          <div className="px-3.5 py-3">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500">Chiedi</span>
              <span className="text-sm font-black tabular-nums text-[#1D3160]">{formatTradeEuro(requestedValue)}</span>
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {requestedCards.map((card) => (
                <TableCard
                  key={card.id}
                  card={card}
                  onRemove={card.id === baseCard.id ? undefined : () => toggleRequested(card.id)}
                />
              ))}
              {reqMoney > 0 && <MoneyChip amount={reqMoney} />}
            </div>
          </div>

          <div className="h-px bg-gray-200" />

          {/* Sotto: ciò che offro */}
          <div className="px-3.5 py-3">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500">Offri</span>
              <span className="text-sm font-black tabular-nums text-[#1D3160]">{formatTradeEuro(offeredValue)}</span>
            </div>
            {offeredCards.length === 0 && addMoney === 0 ? (
              <div className="flex items-center justify-center rounded-lg border border-dashed border-gray-300 bg-gray-50 py-5 text-center text-xs text-gray-400">
                Aggiungi le tue carte dall’inventario qui sotto
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

        {/* DUE LISTE */}
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
            title={`Inventario di ${ctx.seller.name}`}
            hint="tocca per chiedere"
            filters={otherFilters}
            onFiltersChange={setOtherFilters}
            cards={otherInventory}
            filteredCards={filteredOtherInventory}
            selectedIds={selectedRequestedIds}
            onToggle={toggleRequested}
          />
        </div>
      </div>

      {/* Modale di conferma finale */}
      {showConfirm && (
        <div className="fixed inset-0 z-[200] flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-4">
          <div className="w-full max-w-md rounded-t-2xl bg-white p-5 shadow-2xl sm:rounded-2xl">
            <h3 className="text-base font-black uppercase tracking-tight text-[#1D3160]">Confermi la proposta?</h3>
            <p className="mt-1 text-sm text-gray-500">
              Invii a <span className="font-bold text-gray-800">{ctx.seller.name}</span>:
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
                onClick={() => setShowConfirm(false)}
                className="flex-1 rounded-lg border border-gray-300 bg-white py-2.5 text-sm font-bold text-gray-700 transition hover:bg-gray-50"
              >
                Annulla
              </button>
              <button
                type="button"
                onClick={confirmSend}
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
