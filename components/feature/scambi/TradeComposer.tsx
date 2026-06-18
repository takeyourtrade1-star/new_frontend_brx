'use client';

/**
 * Blocco scambio riutilizzabile — un'unica "scheda" coerente e gerarchica che
 * raccoglie tutto ciò che prima era sparso in più card separate:
 *
 *   1. barra equilibrio  → bilancia animata + stato + "Compensa"
 *   2. tavolo            → "Chiedi" (sopra) / "Offri" (sotto) con totali
 *   3. crediti           → differenza da aggiungere / richiedere
 *   4. inventari         → il mio | dell'altro utente (due colonne)
 *
 * Usato sia da TradeProposalPage (proposta/controproposta) sia da
 * ReceivedProposalDetail (proposta ricevuta). Lo stato di business (carte
 * selezionate, crediti, valori, equità) resta nel genitore; il composer
 * possiede solo i filtri locali delle due liste.
 */

import { useMemo, useState } from 'react';
import { Check, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { TradeBalanceResult } from '@/lib/scambi/card-mock-value';
import {
  AnimatedBalanceScale,
  filterTradeCards,
  formatTradeEuro,
  InventoryPanel,
  MoneyChip,
  MoneyField,
  TableCard,
  type InventoryFiltersState,
  type TradeCard,
} from './trade-proposal-ui';

const EMPTY_FILTERS: InventoryFiltersState = { query: '', condition: null, language: null, printings: [] };

export interface TradeComposerProps {
  /** Inventari completi (non filtrati). */
  myInventory: TradeCard[];
  otherInventory: TradeCard[];
  /** Nome dell'altro utente (titolo lista + placeholder). */
  otherName: string;

  /** Selezioni e carte risolte sul tavolo. */
  selectedOfferedIds: string[];
  selectedRequestedIds: string[];
  offeredCards: TradeCard[];
  requestedCards: TradeCard[];
  onToggleOffered: (id: string) => void;
  onToggleRequested: (id: string) => void;

  /** Crediti di compensazione. */
  addMoney: number;
  reqMoney: number;
  onAddMoneyChange: (v: number) => void;
  onReqMoneyChange: (v: number) => void;

  /** Valori e regola di equità (calcolati dal genitore). */
  offeredValue: number;
  requestedValue: number;
  balance: TradeBalanceResult;
  onQuickCompensate: () => void;

  /** Carta richiesta "base" non rimovibile (es. quella scelta dal venditore). */
  lockedRequestedId?: string | null;
  /**
   * In sola lettura (default true = modificabile). Quando false mostra solo
   * il tavolo: niente inventari, crediti, "Compensa" o tasti di rimozione.
   */
  editable?: boolean;
}

/** Grana fine del feltro: rumore frattale monocromatico in un'unica tile SVG.
 * Applicata in sovrimpressione con blend "soft-light" dà materia vera al
 * tessuto, senza il look "a righe" delle trame CSS. */
const FELT_GRAIN =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")";

/** Superficie del "tavolo": feltro navy profondo con luce zenitale morbida
 * dall'alto, corpo centrale leggermente sollevato, tepore tenue verso il basso
 * (il tuo lato) e vignettatura ricca agli angoli. La grana è un layer a parte. */
const FELT_STYLE = {
  backgroundColor: '#1B2C54',
  backgroundImage:
    // luce zenitale morbida dall'alto
    'radial-gradient(110% 70% at 50% -25%, rgba(146,176,232,0.22), rgba(27,44,84,0) 58%),' +
    // tepore tenue verso il basso (lato "Offri")
    'radial-gradient(110% 62% at 50% 125%, rgba(255,140,56,0.09), rgba(27,44,84,0) 55%),' +
    // corpo centrale leggermente sollevato
    'radial-gradient(72% 52% at 50% 48%, rgba(42,68,124,0.45), rgba(20,33,66,0) 72%),' +
    // vignettatura profonda agli angoli
    'radial-gradient(130% 112% at 50% 50%, rgba(0,0,0,0) 42%, rgba(6,12,33,0.55) 100%)',
};

/** Inclinazioni leggere per far sembrare le carte "appoggiate" sul tavolo. */
const CARD_TILTS = [-3, 2.5, -1.5, 3, -2, 1.5, -2.5, 2];

function FeltSide({
  label,
  accent,
  owner,
  value,
  cards,
  money,
  emptyHint,
  lockedId,
  onRemove,
}: {
  label: string;
  accent: 'offer' | 'request';
  owner: string;
  value: number;
  cards: TradeCard[];
  money: number;
  emptyHint: string;
  lockedId?: string | null;
  onRemove?: (id: string) => void;
}) {
  const isEmpty = cards.length === 0 && money === 0;
  const isOffer = accent === 'offer';
  const cardCount = cards.length;
  const cfg = isOffer
    ? { bar: 'bg-[#FF7300]', label: 'text-[#FFB066]', chip: 'bg-[#FF7300] text-white ring-[#FF7300]', glow: 'bg-gradient-to-t from-[#FF7300]/15 to-transparent' }
    : { bar: 'bg-[#6E86B5]', label: 'text-[#B9C6DC]', chip: 'bg-white/10 text-[#E2E8F2] ring-white/25', glow: 'bg-gradient-to-b from-white/[0.07] to-transparent' };

  return (
    <div className="relative py-3 pl-4 pr-3">
      {/* alone caldo/freddo verso il bordo del lato */}
      <span className={cn('pointer-events-none absolute inset-x-0 h-10', isOffer ? 'bottom-0' : 'top-0', cfg.glow)} aria-hidden />
      <span className={cn('absolute inset-y-1 left-1.5 w-1 rounded-full', cfg.bar)} aria-hidden />
      <div className="relative mb-2 flex items-center justify-between gap-2 [text-shadow:0_1px_2px_rgba(0,0,0,0.45)]">
        <span className="flex min-w-0 items-center gap-1.5">
          <span className={cn('text-[10px] font-bold uppercase tracking-wider', cfg.label)}>{label}</span>
          <span
            className={cn(
              'inline-flex max-w-[8rem] shrink items-center truncate rounded-full px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide ring-1 [text-shadow:none]',
              cfg.chip,
            )}
          >
            {owner}
          </span>
        </span>
        <span className="flex shrink-0 items-center gap-2">
          {cardCount > 0 && (
            <span className="text-[10px] font-semibold tabular-nums text-white/55 [text-shadow:none]">
              {cardCount} {cardCount === 1 ? 'carta' : 'carte'}
            </span>
          )}
          <span className="rounded-md bg-black/25 px-1.5 py-0.5 text-sm font-black tabular-nums text-white ring-1 ring-inset ring-white/10 [text-shadow:0_1px_1px_rgba(0,0,0,0.5)]">
            {formatTradeEuro(value)}
          </span>
        </span>
      </div>
      {isEmpty ? (
        <div className="relative flex items-center gap-2.5 px-1 pb-1 pt-0.5">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="flex aspect-[200/280] w-[3.25rem] shrink-0 items-center justify-center rounded-[5px] border border-dashed border-white/20 bg-white/[0.03] shadow-[inset_0_1px_6px_rgba(0,0,0,0.25)] sm:w-[3.6rem]"
              style={{ transform: `rotate(${CARD_TILTS[i]}deg)` }}
              aria-hidden
            >
              <Plus className="h-3.5 w-3.5 text-white/20" strokeWidth={2.5} />
            </div>
          ))}
          <span className="pl-1 text-[11px] text-white/55 [text-shadow:0_1px_2px_rgba(0,0,0,0.4)]">{emptyHint}</span>
        </div>
      ) : (
        <div className="relative flex gap-2.5 overflow-x-auto px-1 pb-2.5 pt-2">
          {cards.map((card, i) => (
            <TableCard
              key={card.id}
              card={card}
              tiltDeg={CARD_TILTS[i % CARD_TILTS.length]}
              onRemove={onRemove && card.id !== lockedId ? () => onRemove(card.id) : undefined}
            />
          ))}
          {money > 0 && <MoneyChip amount={money} tiltDeg={CARD_TILTS[cards.length % CARD_TILTS.length]} />}
        </div>
      )}
    </div>
  );
}

export function TradeComposer({
  myInventory,
  otherInventory,
  otherName,
  selectedOfferedIds,
  selectedRequestedIds,
  offeredCards,
  requestedCards,
  onToggleOffered,
  onToggleRequested,
  addMoney,
  reqMoney,
  onAddMoneyChange,
  onReqMoneyChange,
  offeredValue,
  requestedValue,
  balance,
  onQuickCompensate,
  lockedRequestedId,
  editable = true,
}: TradeComposerProps) {
  const [myFilters, setMyFilters] = useState<InventoryFiltersState>(EMPTY_FILTERS);
  const [otherFilters, setOtherFilters] = useState<InventoryFiltersState>(EMPTY_FILTERS);

  const filteredMy = useMemo(() => filterTradeCards(myInventory, myFilters), [myInventory, myFilters]);
  const filteredOther = useMemo(() => filterTradeCards(otherInventory, otherFilters), [otherInventory, otherFilters]);

  const gap = requestedValue - offeredValue;

  return (
    <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-[0_1px_2px_rgba(16,24,40,0.06),0_14px_34px_-18px_rgba(29,49,96,0.32)]">
      {/* 1. Barra equilibrio */}
      <div className="flex items-center gap-2.5 border-b border-gray-100 bg-[#FAFAF7] px-3 py-2">
        <AnimatedBalanceScale offeredValue={offeredValue} requestedValue={requestedValue} className="shrink-0" />
        <div className="min-w-0 flex-1 text-[12px] leading-snug">
          {balance.balanced ? (
            <span className="flex items-center gap-1 font-bold text-emerald-600">
              <Check className="h-3.5 w-3.5" strokeWidth={3} aria-hidden /> Scambio equo
            </span>
          ) : (
            <span className="text-gray-700">
              <span className="font-bold text-[#1D3160]">La bilancia pende un po&apos; troppo da una parte.</span>{' '}
              {offeredValue === 0
                ? "Aggiungi qualcos'altro o richiedi."
                : `Mancano ${formatTradeEuro(Math.abs(gap))} per pareggiare · scarto ${Math.round(
                    balance.diffPct * 100,
                  )}% (max ${Math.round(balance.threshold * 100)}%).`}
            </span>
          )}
        </div>
        {editable && !balance.balanced && (
          <button
            type="button"
            onClick={onQuickCompensate}
            className="shrink-0 rounded-full bg-[#1D3160] px-3 py-1.5 text-[10px] font-bold uppercase tracking-wide text-white transition hover:bg-[#16264d] active:scale-95"
          >
            Compensa
          </button>
        )}
      </div>

      {/* 2. Tavolo da gioco: feltro profondo con grana vera, cornice incassata e i due lati (loro sopra / tu sotto) */}
      <div
        className="relative isolate shadow-[inset_0_1px_0_rgba(255,255,255,0.1),inset_0_0_0_1px_rgba(0,0,0,0.5),inset_0_22px_44px_-16px_rgba(0,0,0,0.5),inset_0_-18px_36px_-16px_rgba(0,0,0,0.55)]"
        style={FELT_STYLE}
      >
        {/* grana del feltro */}
        <span
          className="pointer-events-none absolute inset-0 opacity-[0.14] mix-blend-soft-light"
          style={{ backgroundImage: FELT_GRAIN, backgroundSize: '200px 200px' }}
          aria-hidden
        />
        {/* cornice incassata premium: solco scuro + filo di luce + sottile filo d'ottone */}
        <span
          className="pointer-events-none absolute inset-[0.55rem] rounded-[15px] ring-1 ring-inset ring-[#C9A24B]/15 shadow-[inset_0_0_0_1px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.07)]"
          aria-hidden
        />
        <FeltSide
          label="Chiedi"
          accent="request"
          owner={otherName}
          value={requestedValue}
          cards={requestedCards}
          money={reqMoney}
          emptyHint={`Aggiungi carte dall'inventario di ${otherName}`}
          lockedId={lockedRequestedId}
          onRemove={editable ? onToggleRequested : undefined}
        />
        {/* linea di mezzeria del tavolo: filo inciso che sfuma ai bordi + medaglione intarsiato */}
        <div className="relative mx-3 h-px" aria-hidden>
          <span className="absolute inset-0 bg-gradient-to-r from-transparent via-black/45 to-transparent" />
          <span className="absolute inset-0 translate-y-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
          <span className="absolute left-1/2 top-1/2 flex h-6 w-6 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-gradient-to-b from-[#22386C] to-[#12224A] shadow-[inset_0_1px_1px_rgba(255,255,255,0.16),inset_0_-1px_2px_rgba(0,0,0,0.55),0_2px_5px_rgba(0,0,0,0.45)] ring-1 ring-[#C9A24B]/30">
            <span className="h-2 w-2 rotate-45 rounded-[2px] bg-gradient-to-br from-[#FFB066] to-[#FF7300] shadow-[inset_0_1px_0_rgba(255,255,255,0.6)]" />
          </span>
        </div>
        <FeltSide
          label="Offri"
          accent="offer"
          owner="Tu"
          value={offeredValue}
          cards={offeredCards}
          money={addMoney}
          emptyHint="Aggiungi le tue carte qui sotto"
          onRemove={editable ? onToggleOffered : undefined}
        />
      </div>

      {/* 3. Crediti di compensazione */}
      {editable && (
        <div className="flex flex-col gap-2 border-t border-gray-100 bg-[#FAFAF7] px-3 py-2 sm:flex-row sm:items-center sm:justify-between">
          <MoneyField value={addMoney} onChange={onAddMoneyChange} label="Aggiungi differenza" />
          <MoneyField value={reqMoney} onChange={onReqMoneyChange} label="Richiedi differenza" />
        </div>
      )}

      {/* 4. Inventari: il mio (TU) | dell'altro utente */}
      {editable && (
        <div className="grid grid-cols-1 border-t border-gray-200 sm:grid-cols-2">
          <div className="border-b-2 border-[#FF7300]/30 sm:border-b-0 sm:border-r-2">
            <InventoryPanel
              embedded
              variant="mine"
              title="Il tuo inventario"
              hint="tocca per offrire"
              ownerBadge="Tu"
              filters={myFilters}
              onFiltersChange={setMyFilters}
              cards={myInventory}
              filteredCards={filteredMy}
              selectedIds={selectedOfferedIds}
              onToggle={onToggleOffered}
            />
          </div>
          <InventoryPanel
            embedded
            variant="other"
            title={`Inventario di ${otherName}`}
            hint="tocca per chiedere"
            ownerBadge={otherName}
            filters={otherFilters}
            onFiltersChange={setOtherFilters}
            cards={otherInventory}
            filteredCards={filteredOther}
            selectedIds={selectedRequestedIds}
            onToggle={onToggleRequested}
          />
        </div>
      )}
    </section>
  );
}
