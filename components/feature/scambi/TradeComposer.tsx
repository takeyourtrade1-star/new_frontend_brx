'use client';

/**
 * Blocco scambio riutilizzabile — un'unica "scheda" coerente e gerarchica:
 *
 *   1. tavolo    → "Chiedi" (sopra) / "Offri" (sotto) con totali
 *   2. crediti   → differenza da aggiungere / richiedere (opzionale, vedi
 *                  `showCredits`: nel flusso proposta i crediti vivono in un
 *                  passaggio dedicato, qui restano solo per la controproposta)
 *   3. inventari → il mio | dell'altro utente (due colonne)
 *
 * Usato sia da TradeProposalPage (proposta/controproposta) sia da
 * ReceivedProposalDetail (proposta ricevuta). Lo stato di business (carte
 * selezionate, crediti, valori, equità) resta nel genitore; il composer
 * possiede solo i filtri locali delle due liste.
 */

import { useMemo, useState, type Ref } from 'react';
import { Plus } from 'lucide-react';
import { ScambiIcon } from '@/components/ui/ScambiIcon';
import { cn } from '@/lib/utils';
import {
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

  /** Valori (calcolati dal genitore). */
  offeredValue: number;
  requestedValue: number;

  /** Carta richiesta "base" non rimovibile (es. quella scelta dal venditore). */
  lockedRequestedId?: string | null;
  /**
   * In sola lettura (default true = modificabile). Quando false mostra solo
   * il tavolo: niente inventari, crediti o tasti di rimozione.
   */
  editable?: boolean;
  /** Mostra i campi crediti sopra gli inventari (default true). Il flusso
   *  proposta li nasconde: i crediti si scelgono in un passaggio dedicato. */
  showCredits?: boolean;
  /** Ref opzionale sulla sezione inventari (per scroll quando si apre). */
  inventoriesSectionRef?: Ref<HTMLElement>;
}

/** Grana fine del feltro: rumore frattale monocromatico in un'unica tile SVG.
 * Applicata in sovrimpressione con blend "soft-light" dà materia vera al
 * tessuto, senza il look "a righe" delle trame CSS. */
const FELT_GRAIN =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")";

/** Superficie del "tavolo": due zone di colore che si fondono al centro —
 * blu freddo in alto (lato dell'altro utente, "Chiedi") e ambra calda in basso
 * (il tuo lato, "Offri"). Le due tinte sfumano a metà in un blend neutro, così
 * resta chiaro a colpo d'occhio di chi è ciascuna metà del tavolo.
 * La grana del feltro è un layer a parte. */
const FELT_STYLE = {
  backgroundColor: '#202A4D',
  backgroundImage:
    // lato dell'altro utente (sopra) — zona blu fredda che sfuma verso il centro
    'linear-gradient(180deg, rgba(20,52,102,0.95) 0%, rgba(20,52,102,0.32) 36%, rgba(20,52,102,0) 50%),' +
    // il tuo lato (sotto) — zona ambra calda che sfuma verso il centro
    'linear-gradient(0deg, rgba(122,58,18,0.92) 0%, rgba(122,58,18,0.30) 36%, rgba(122,58,18,0) 50%),' +
    // luce zenitale morbida dall'alto
    'radial-gradient(110% 60% at 50% -22%, rgba(170,196,240,0.20), rgba(27,44,84,0) 60%),' +
    // corpo centrale leggermente sollevato (blend)
    'radial-gradient(74% 40% at 50% 50%, rgba(74,92,140,0.28), rgba(20,33,66,0) 72%),' +
    // vignettatura profonda agli angoli
    'radial-gradient(130% 112% at 50% 50%, rgba(0,0,0,0) 44%, rgba(6,12,33,0.5) 100%)',
};

/** Cornice in legno attorno al panno: bande tonali calde + venatura morbida
 * (streaks quasi verticali) che danno l'idea della sponda di un tavolo da
 * gioco. Il bevel e il filo d'ottone sono layer a parte. */
const WOOD_STYLE = {
  backgroundColor: '#5C3A22',
  backgroundImage:
    // venatura del legno
    'repeating-linear-gradient(92deg, rgba(0,0,0,0.16) 0px, rgba(0,0,0,0) 3px, rgba(255,255,255,0.05) 5px, rgba(0,0,0,0) 9px),' +
    // luce calda sul bordo superiore
    'radial-gradient(120% 60% at 50% -10%, rgba(196,140,86,0.45), rgba(92,58,34,0) 60%),' +
    // bande tonali del legno (dal chiaro in alto allo scuro in basso)
    'linear-gradient(180deg, #7A4B2B 0%, #5C3A22 48%, #3C2616 100%)',
};

/** Inclinazioni leggere per far sembrare le carte "appoggiate" sul tavolo. */
const CARD_TILTS = [-3, 2.5, -1.5, 3, -2, 1.5, -2.5, 2];

function FeltSide({
  accent,
  owner,
  value,
  cards,
  money,
  emptyHint,
  lockedId,
  onRemove,
}: {
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
    ? { chip: 'bg-[#FF7300] text-white ring-[#FF7300]', glow: 'bg-gradient-to-t from-[#FF7300]/22 to-transparent' }
    : { chip: 'bg-[#3D65C6]/30 text-[#DCE6FA] ring-[#5E8AE0]/40', glow: 'bg-gradient-to-b from-[#4F79D6]/22 to-transparent' };

  /* Intestazione (proprietario + valore) sul bordo esterno del lato:
     in alto per "Chiedi", in basso per "Offri". Le etichette Chiedi/Offri
     stanno al centro del tavolo (banda centrale). */
  const header = (
    <div
      className={cn(
        'relative flex items-center justify-between gap-2 [text-shadow:0_1px_2px_rgba(0,0,0,0.45)]',
        isOffer ? 'mt-2' : 'mb-2',
      )}
    >
      <span
        className={cn(
          'inline-flex max-w-[10rem] shrink items-center truncate rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide ring-1 [text-shadow:none]',
          cfg.chip,
        )}
      >
        {owner}
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
  );

  const body = isEmpty ? (
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
    <div className="relative flex gap-2.5 overflow-x-auto px-1 pb-1.5 pt-1.5">
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
  );

  return (
    <div className="relative flex flex-col px-3 py-1.5">
      {/* alone caldo/freddo verso il bordo esterno del lato */}
      <span className={cn('pointer-events-none absolute inset-x-0 h-10', isOffer ? 'bottom-0' : 'top-0', cfg.glow)} aria-hidden />
      {isOffer ? (
        <>
          {body}
          {header}
        </>
      ) : (
        <>
          {header}
          {body}
        </>
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
  lockedRequestedId,
  editable = true,
  showCredits = true,
  inventoriesSectionRef,
}: TradeComposerProps) {
  const [myFilters, setMyFilters] = useState<InventoryFiltersState>(EMPTY_FILTERS);
  const [otherFilters, setOtherFilters] = useState<InventoryFiltersState>(EMPTY_FILTERS);

  const filteredMy = useMemo(() => filterTradeCards(myInventory, myFilters), [myInventory, myFilters]);
  const filteredOther = useMemo(() => filterTradeCards(otherInventory, otherFilters), [otherInventory, otherFilters]);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col items-center">
        {/* 1. Tavolo da gioco: sponda in legno stondata attorno al panno incassato */}
        <div className="relative isolate w-full overflow-hidden rounded-[20px] p-2.5 shadow-[0_12px_30px_-12px_rgba(0,0,0,0.5)] sm:p-3" style={WOOD_STYLE}>
        {/* venatura del legno */}
        <span
          className="pointer-events-none absolute inset-0 opacity-[0.5] mix-blend-overlay"
          style={{ backgroundImage: FELT_GRAIN, backgroundSize: '180px 180px' }}
          aria-hidden
        />
        {/* bevel della sponda: filo di luce in alto, ombra in basso + bordo scuro */}
        <span
          className="pointer-events-none absolute inset-0 rounded-[20px] shadow-[inset_0_2px_0_rgba(255,255,255,0.18),inset_0_-3px_6px_rgba(0,0,0,0.45)] ring-1 ring-inset ring-black/40"
          aria-hidden
        />

        {/* Panno: superficie di gioco incassata, con filo d'ottone sul bordo */}
        <div
          className="relative isolate overflow-hidden rounded-[13px] shadow-[inset_0_0_0_1px_rgba(0,0,0,0.6),inset_0_2px_12px_rgba(0,0,0,0.6),inset_0_20px_40px_-16px_rgba(0,0,0,0.5),inset_0_-16px_32px_-16px_rgba(0,0,0,0.55)] ring-1 ring-inset ring-[#C9A24B]/25"
          style={FELT_STYLE}
        >
          {/* grana del feltro */}
          <span
            className="pointer-events-none absolute inset-0 opacity-[0.14] mix-blend-soft-light"
            style={{ backgroundImage: FELT_GRAIN, backgroundSize: '200px 200px' }}
            aria-hidden
          />
          <FeltSide
            accent="request"
          owner={otherName}
          value={requestedValue}
          cards={requestedCards}
          money={reqMoney}
          emptyHint={`Aggiungi carte dall'inventario di ${otherName}`}
          lockedId={lockedRequestedId}
          onRemove={editable ? onToggleRequested : undefined}
        />
        {/* Banda centrale: etichette Chiedi/Offri attorno al medaglione con
            icona scambi che si anima all'hover. Hairline appena accennata così
            le due tinte del tavolo si fondono. */}
        <div className="group/center relative flex flex-col items-center justify-center gap-0.5 py-0.5">
          <span className="pointer-events-none absolute inset-x-3 top-1/2 h-px -translate-y-1/2 bg-gradient-to-r from-transparent via-black/20 to-transparent" aria-hidden />
          <span className="relative z-10 text-[10px] font-bold uppercase tracking-[0.22em] text-[#AFC4EC] [text-shadow:0_1px_2px_rgba(0,0,0,0.5)]">
            Chiedi
          </span>
          <span className="relative z-10 my-0.5 flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-b from-[#22386C] to-[#12224A] shadow-[inset_0_1px_1px_rgba(255,255,255,0.16),inset_0_-1px_2px_rgba(0,0,0,0.55),0_2px_6px_rgba(0,0,0,0.5)] ring-1 ring-[#C9A24B]/30">
            <ScambiIcon className="h-4 w-4 text-[#FFD08A] transition-transform duration-500 ease-out group-hover/center:rotate-180" />
          </span>
          <span className="relative z-10 text-[10px] font-bold uppercase tracking-[0.22em] text-[#FFB066] [text-shadow:0_1px_2px_rgba(0,0,0,0.5)]">
            Offri
          </span>
        </div>
        <FeltSide
          accent="offer"
          owner="Tu"
          value={offeredValue}
          cards={offeredCards}
          money={addMoney}
          emptyHint="Aggiungi le tue carte qui sotto"
          onRemove={editable ? onToggleOffered : undefined}
        />
        </div>
      </div>
      </div>

      {/* 2. Crediti (opzionali) + inventari */}
      {editable && (
        <section
          ref={inventoriesSectionRef}
          className="scroll-mt-4 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-[0_1px_2px_rgba(16,24,40,0.06),0_14px_34px_-18px_rgba(29,49,96,0.32)]"
        >
          {/* Crediti di compensazione (solo dove richiesto, es. controproposta) */}
          {showCredits && (
            <div className="flex flex-col gap-2 bg-[#FAFAF7] px-3 py-2 sm:flex-row sm:items-center sm:justify-between">
              <MoneyField value={addMoney} onChange={onAddMoneyChange} label="Aggiungi differenza" />
              <MoneyField value={reqMoney} onChange={onReqMoneyChange} label="Richiedi differenza" />
            </div>
          )}

          {/* Inventari: il mio (TU) | dell'altro utente */}
          <div className={cn('grid grid-cols-1 sm:grid-cols-2', showCredits && 'border-t border-gray-200')}>
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
        </section>
      )}
    </div>
  );
}
