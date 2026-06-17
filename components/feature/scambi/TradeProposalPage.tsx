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
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Check, Minus, Plus, Search } from 'lucide-react';
import { ScambiIcon } from '@/components/ui/ScambiIcon';
import { formatEuroNoSpace } from '@/lib/utils';
import { FlagIcon } from '@/components/ui/FlagIcon';
import {
  getTradeProposalContext,
  clearTradeProposalContext,
  type TradeProposalContext,
} from '@/lib/scambi/trade-proposal-context';
import { getMockCardValueEur, tradeBalance } from '@/lib/scambi/card-mock-value';
import { MOCK_INVENTORY_A, MOCK_INVENTORY_B } from './mock-trade-inventories';

interface TradeCard {
  id: string;
  name: string;
  image: string;
  condition: string;
  game: string;
  value: number;
}

interface InventoryFiltersState {
  query: string;
  game: string | null;
  condition: string | null;
}

const GAME_LABELS: Record<string, string> = {
  mtg: 'MTG',
  pokemon: 'PKM',
  op: 'OP',
  ygo: 'YGO',
  lorcana: 'LOR',
};

function formatEuro(n: number): string {
  return formatEuroNoSpace(n, 'it-IT');
}

function mockToTradeCard(item: {
  id: string;
  name: string;
  image: string;
  condition: string;
  game: string;
}): TradeCard {
  return {
    id: item.id,
    name: item.name,
    image: item.image,
    condition: item.condition,
    game: item.game,
    value: getMockCardValueEur(item.id),
  };
}

function filterTradeCards(cards: TradeCard[], filters: InventoryFiltersState): TradeCard[] {
  const q = filters.query.trim().toLowerCase();
  return cards.filter((card) => {
    if (filters.game && card.game !== filters.game) return false;
    if (filters.condition && card.condition !== filters.condition) return false;
    if (q && !card.name.toLowerCase().includes(q)) return false;
    return true;
  });
}

function uniqueValues(cards: TradeCard[], key: 'game' | 'condition'): string[] {
  return [...new Set(cards.map((c) => c[key]))].sort();
}

/* ------------------------------------------------------------------ */
/*  Pezzi UI                                                           */
/* ------------------------------------------------------------------ */

/** Carta sul tavolo (compatta), con eventuale pulsante di rimozione. */
function TableCard({ card, onRemove }: { card: TradeCard; onRemove?: () => void }) {
  return (
    <div className="group relative w-16 shrink-0 sm:w-[4.5rem]">
      <div className="relative aspect-[200/280] w-full overflow-hidden rounded-lg bg-gray-200 ring-1 ring-black/10">
        <Image src={card.image} alt={card.name} fill unoptimized className="object-cover" sizes="72px" />
        {onRemove && (
          <button
            type="button"
            onClick={onRemove}
            className="absolute right-0.5 top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-black/55 text-white transition hover:bg-red-500"
            aria-label={`Rimuovi ${card.name}`}
          >
            <Minus className="h-3 w-3" strokeWidth={3} />
          </button>
        )}
      </div>
      <p className="mt-0.5 truncate text-[9px] font-semibold leading-tight text-gray-700" title={card.name}>
        {card.name}
      </p>
      <p className="text-[10px] font-bold tabular-nums text-[#1D3160]">{formatEuro(card.value)}</p>
    </div>
  );
}

/** Chip "differenza in crediti" sul tavolo. */
function MoneyChip({ amount }: { amount: number }) {
  return (
    <div className="flex w-16 shrink-0 flex-col items-center justify-center rounded-lg border border-dashed border-[#FF7300]/50 bg-orange-50/60 py-2 sm:w-[4.5rem]">
      <span className="text-sm font-bold tabular-nums text-[#1D3160]">+{formatEuro(amount)}</span>
      <span className="text-[8px] font-semibold uppercase text-gray-500">crediti</span>
    </div>
  );
}

/** Ricerca e filtri compatti per una lista inventario. */
function InventoryToolbar({
  filters,
  onChange,
  cards,
}: {
  filters: InventoryFiltersState;
  onChange: (next: InventoryFiltersState) => void;
  cards: TradeCard[];
}) {
  const games = uniqueValues(cards, 'game');
  const conditions = uniqueValues(cards, 'condition');
  const showGameFilters = games.length > 1;
  const showConditionFilters = conditions.length > 1;

  const chipClass = (active: boolean) =>
    `shrink-0 rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide transition ${
      active
        ? 'bg-[#1D3160] text-white'
        : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
    }`;

  return (
    <div className="mb-1.5 space-y-1">
      <div className="relative">
        <Search className="pointer-events-none absolute left-2 top-1/2 h-3 w-3 -translate-y-1/2 text-gray-400" />
        <input
          type="search"
          value={filters.query}
          onChange={(e) => onChange({ ...filters, query: e.target.value })}
          placeholder="Cerca..."
          className="h-7 w-full rounded-full border border-gray-200 bg-gray-50 pl-7 pr-2.5 text-[11px] text-gray-800 outline-none placeholder:text-gray-400 focus:border-[#FF7300]/50 focus:bg-white"
        />
      </div>
      {(showGameFilters || showConditionFilters) && (
        <div className="flex gap-1 overflow-x-auto pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {showGameFilters && (
            <>
              <button
                type="button"
                onClick={() => onChange({ ...filters, game: null })}
                className={chipClass(filters.game === null)}
              >
                Tutti
              </button>
              {games.map((game) => (
                <button
                  key={game}
                  type="button"
                  onClick={() => onChange({ ...filters, game })}
                  className={chipClass(filters.game === game)}
                >
                  {GAME_LABELS[game] ?? game}
                </button>
              ))}
            </>
          )}
          {showGameFilters && showConditionFilters && (
            <span className="mx-0.5 shrink-0 self-center text-[9px] text-gray-300">|</span>
          )}
          {showConditionFilters && (
            <>
              <button
                type="button"
                onClick={() => onChange({ ...filters, condition: null })}
                className={chipClass(filters.condition === null)}
              >
                Tutte
              </button>
              {conditions.map((condition) => (
                <button
                  key={condition}
                  type="button"
                  onClick={() => onChange({ ...filters, condition })}
                  className={chipClass(filters.condition === condition)}
                >
                  {condition}
                </button>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}

/** Riga selezionabile nelle liste inventario. */
function InventoryRow({
  card,
  selected,
  onToggle,
}: {
  card: TradeCard;
  selected: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={`group flex w-full items-center gap-2.5 rounded-lg border p-1.5 text-left transition ${
        selected ? 'border-[#FF7300] bg-orange-50/70' : 'border-gray-200 bg-white hover:border-orange-200'
      }`}
    >
      <div className="relative h-12 w-9 shrink-0 overflow-hidden rounded bg-gray-200">
        <Image src={card.image} alt={card.name} fill unoptimized className="object-cover" sizes="36px" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[13px] font-semibold text-gray-900">{card.name}</p>
        <p className="text-[11px] font-bold tabular-nums text-[#1D3160]">
          {formatEuro(card.value)} <span className="font-medium text-gray-400">· {card.condition}</span>
        </p>
      </div>
      <span
        className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full transition ${
          selected ? 'bg-[#FF7300] text-white' : 'bg-gray-100 text-gray-400 group-hover:bg-orange-100 group-hover:text-[#FF7300]'
        }`}
      >
        {selected ? <Check className="h-3.5 w-3.5" strokeWidth={3} /> : <Plus className="h-3.5 w-3.5" strokeWidth={2.5} />}
      </span>
    </button>
  );
}

/** Campo monetario compatto (differenza in euro). */
function MoneyField({
  value,
  onChange,
  label,
}: {
  value: number;
  onChange: (v: number) => void;
  label: string;
}) {
  return (
    <label className="flex items-center gap-2">
      <span className="whitespace-nowrap text-[11px] font-bold uppercase tracking-wide text-gray-500">{label}</span>
      <span className="flex items-center overflow-hidden rounded-lg border border-gray-300 bg-white focus-within:border-[#FF7300]">
        <button
          type="button"
          onClick={() => onChange(Math.max(0, value - 5))}
          className="flex h-8 w-7 items-center justify-center text-gray-500 hover:bg-gray-50"
          aria-label="Diminuisci"
        >
          <Minus className="h-3 w-3" />
        </button>
        <span className="relative">
          <span className="pointer-events-none absolute left-1.5 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400">€</span>
          <input
            type="number"
            min={0}
            value={value || ''}
            onChange={(e) => onChange(Math.max(0, parseInt(e.target.value, 10) || 0))}
            placeholder="0"
            className="h-8 w-14 border-x border-gray-200 bg-transparent pl-4 pr-1 text-center text-sm font-bold tabular-nums text-gray-900 outline-none"
          />
        </span>
        <button
          type="button"
          onClick={() => onChange(value + 5)}
          className="flex h-8 w-7 items-center justify-center text-gray-500 hover:bg-gray-50"
          aria-label="Aumenta"
        >
          <Plus className="h-3 w-3" />
        </button>
      </span>
    </label>
  );
}

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
    game: null,
    condition: null,
  });
  const [otherFilters, setOtherFilters] = useState<InventoryFiltersState>({
    query: '',
    game: null,
    condition: null,
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
    return {
      id: ctx.card.id,
      name: ctx.card.name,
      image: ctx.card.image,
      condition: ctx.card.condition,
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
            <p className="text-[13px] text-gray-700">
              <span className="font-bold text-[#1D3160]">La bilancia pende un po’ da una parte ⚖️</span>{' '}
              {offeredValue === 0
                ? 'Aggiungi qualcosa per iniziare!'
                : `mancano ${formatEuro(Math.abs(gap))} per pareggiare.`}
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
              <span className="text-sm font-black tabular-nums text-[#1D3160]">{formatEuro(requestedValue)}</span>
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
              <span className="text-sm font-black tabular-nums text-[#1D3160]">{formatEuro(offeredValue)}</span>
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
          <section className="rounded-xl border border-gray-200 bg-white p-2.5 shadow-sm">
            <div className="mb-1.5 flex items-center justify-between border-b border-gray-100 pb-1.5">
              <h2 className="text-[13px] font-bold uppercase tracking-tight text-[#1D3160]">Il tuo inventario</h2>
              <span className="text-[10px] font-medium text-gray-400">tocca per offrire</span>
            </div>
            <InventoryToolbar filters={myFilters} onChange={setMyFilters} cards={myInventory} />
            <div className="flex max-h-[380px] flex-col gap-1.5 overflow-y-auto pr-1">
              {filteredMyInventory.length === 0 ? (
                <p className="py-4 text-center text-[11px] text-gray-400">Nessuna carta trovata</p>
              ) : (
                filteredMyInventory.map((card) => (
                  <InventoryRow
                    key={card.id}
                    card={card}
                    selected={selectedOfferedIds.includes(card.id)}
                    onToggle={() => toggleOffered(card.id)}
                  />
                ))
              )}
            </div>
          </section>

          <section className="rounded-xl border border-gray-200 bg-white p-2.5 shadow-sm">
            <div className="mb-1.5 flex items-center justify-between border-b border-gray-100 pb-1.5">
              <h2 className="truncate text-[13px] font-bold uppercase tracking-tight text-[#1D3160]">
                Inventario di {ctx.seller.name}
              </h2>
              <span className="shrink-0 text-[10px] font-medium text-gray-400">tocca per chiedere</span>
            </div>
            <InventoryToolbar filters={otherFilters} onChange={setOtherFilters} cards={otherInventory} />
            <div className="flex max-h-[380px] flex-col gap-1.5 overflow-y-auto pr-1">
              {filteredOtherInventory.length === 0 ? (
                <p className="py-4 text-center text-[11px] text-gray-400">Nessuna carta trovata</p>
              ) : (
                filteredOtherInventory.map((card) => (
                  <InventoryRow
                    key={card.id}
                    card={card}
                    selected={selectedRequestedIds.includes(card.id)}
                    onToggle={() => toggleRequested(card.id)}
                  />
                ))
              )}
            </div>
          </section>
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
                  {addMoney > 0 ? ` + ${formatEuro(addMoney)}` : ''} · {formatEuro(offeredValue)}
                </span>
              </div>
              <div className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2">
                <span className="text-gray-600">Chiedi</span>
                <span className="font-bold text-[#1D3160]">
                  {requestedCards.length} {requestedCards.length === 1 ? 'carta' : 'carte'}
                  {reqMoney > 0 ? ` + ${formatEuro(reqMoney)}` : ''} · {formatEuro(requestedValue)}
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
