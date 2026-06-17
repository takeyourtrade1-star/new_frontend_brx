'use client';

import { useId, useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import Image from 'next/image';
import { Check, ChevronDown, Minus, Plus, Search } from 'lucide-react';
import { CardLanguageFlag } from '@/components/ui/CardLanguageFlag';
import { CustomSelect, type CustomSelectOption } from '@/components/ui/CustomSelect';
import { cn, formatEuroNoSpace } from '@/lib/utils';
import { getCardLanguageLabel } from '@/lib/card-languages';
import { getMockCardValueEur } from '@/lib/scambi/card-mock-value';
import type { MockInventoryItem, MockInventoryPrinting } from './mock-trade-inventories';

export type TradeCardPrinting = MockInventoryPrinting;

export interface TradeCard {
  id: string;
  name: string;
  image: string;
  condition: string;
  language: string;
  printing: TradeCardPrinting;
  value: number;
}

export interface InventoryFiltersState {
  query: string;
  condition: string | null;
  language: string | null;
  /** Foil, firmate e/o alterate — selezione multipla; vuoto = tutte. */
  printings: SpecialPrintingFilter[];
}

export type SpecialPrintingFilter = Exclude<TradeCardPrinting, 'standard'>;

export type InventoryPanelVariant = 'mine' | 'other';

const SPECIAL_PRINTING_FILTERS: SpecialPrintingFilter[] = ['foil', 'signed', 'altered'];

const PRINTING_LABELS: Record<TradeCardPrinting, string> = {
  standard: 'Standard',
  foil: 'Foil',
  signed: 'Firmate',
  altered: 'Alterate',
};

export function formatTradeEuro(n: number): string {
  return formatEuroNoSpace(n, 'it-IT');
}

const BALANCE_MAX_TILT_DEG = 24;
const BALANCE_MOTION =
  'transform 0.65s cubic-bezier(0.34, 1.25, 0.64, 1), opacity 0.65s ease';

/** Angolo di inclinazione: positivo = più valore richiesto (destra), negativo = più offerto (sinistra). */
export function tradeBalanceTiltDeg(offeredValue: number, requestedValue: number): number {
  const total = offeredValue + requestedValue;
  const denominator = total > 0 ? total : Math.max(offeredValue, requestedValue, 1);
  const imbalance = (requestedValue - offeredValue) / denominator;
  return Math.max(-1, Math.min(1, imbalance)) * BALANCE_MAX_TILT_DEG;
}

function ScalePan({
  weight,
  panGradientId,
  chainGradientId,
}: {
  weight: number;
  panGradientId: string;
  chainGradientId: string;
}) {
  const bowlOpacity = 0.55 + weight * 0.45;

  return (
    <g transform="translate(0, 9)">
      <line x1="-2.2" y1="-9" x2="-6.2" y2="0" stroke={`url(#${chainGradientId})`} strokeWidth="0.9" strokeLinecap="round" />
      <line x1="0" y1="-9" x2="0" y2="0" stroke={`url(#${chainGradientId})`} strokeWidth="0.9" strokeLinecap="round" />
      <line x1="2.2" y1="-9" x2="6.2" y2="0" stroke={`url(#${chainGradientId})`} strokeWidth="0.9" strokeLinecap="round" />
      <ellipse cx="0" cy="0.8" rx="7.8" ry="1.35" fill="#1D3160" opacity="0.18" />
      <path
        d="M-7.4 0.5 C-7.4 0.5 -7.6 5.8 0 7.2 C7.6 5.8 7.4 0.5 7.4 0.5 C7.4 0.5 4.2 -0.8 0 -0.8 C-4.2 -0.8 -7.4 0.5 -7.4 0.5 Z"
        fill={`url(#${panGradientId})`}
        opacity={bowlOpacity}
      />
      <path
        d="M-7.2 0.6 C-4.2 -0.4 4.2 -0.4 7.2 0.6"
        stroke="#FFF4EC"
        strokeWidth="0.75"
        strokeLinecap="round"
        opacity={0.55 + weight * 0.25}
      />
      <ellipse cx="0" cy="6.8" rx="4.8" ry="1.1" fill="#1D3160" opacity={0.08 + weight * 0.1} />
    </g>
  );
}

/** Bilancia animata: asta inclinata e piatti sempre orizzontali, come una bilancia reale. */
export function AnimatedBalanceScale({
  offeredValue,
  requestedValue,
  className = '',
}: {
  offeredValue: number;
  requestedValue: number;
  className?: string;
}) {
  const uid = useId().replace(/:/g, '');
  const beamGradientId = `trade-balance-beam-${uid}`;
  const panGradientId = `trade-balance-pan-${uid}`;
  const chainGradientId = `trade-balance-chain-${uid}`;
  const shadowFilterId = `trade-balance-shadow-${uid}`;

  const tilt = tradeBalanceTiltDeg(offeredValue, requestedValue);
  const total = Math.max(offeredValue + requestedValue, 1);
  const leftWeight = offeredValue / total;
  const rightWeight = requestedValue / total;

  const pivotX = 32;
  const pivotY = 27.5;
  const beamHalf = 22;

  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center ${className}`}
      aria-hidden
    >
      <svg
        viewBox="0 0 64 56"
        className="h-9 w-9 overflow-visible"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id={beamGradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#3A5088" />
            <stop offset="100%" stopColor="#1D3160" />
          </linearGradient>
          <linearGradient id={panGradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#FF9A4D" />
            <stop offset="55%" stopColor="#FF7300" />
            <stop offset="100%" stopColor="#D95F00" />
          </linearGradient>
          <linearGradient id={chainGradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#64748B" />
            <stop offset="100%" stopColor="#334155" />
          </linearGradient>
          <filter id={shadowFilterId} x="-30%" y="-30%" width="160%" height="160%">
            <feDropShadow dx="0" dy="1.2" stdDeviation="0.9" floodColor="#1D3160" floodOpacity="0.18" />
          </filter>
        </defs>

        <ellipse cx={pivotX} cy={pivotY + 1.2} rx="18" ry="2.2" fill="#1D3160" opacity="0.06" />

        <rect x="27.5" y="44" width="9" height="2.6" rx="1.3" fill="#1D3160" opacity="0.92" />
        <rect x="29.8" y="31.5" width="4.4" height="13" rx="1.2" fill={`url(#${beamGradientId})`} />
        <path d={`M${pivotX} ${pivotY + 2.2} L${pivotX - 5.2} ${pivotY + 8.4} H${pivotX + 5.2} Z`} fill="#1D3160" />
        <path
          d={`M${pivotX} ${pivotY + 1.8} L${pivotX - 3.6} ${pivotY + 6.2} H${pivotX + 3.6} Z`}
          fill="#2A4480"
          opacity="0.55"
        />

        <g transform={`translate(${pivotX} ${pivotY})`} filter={`url(#${shadowFilterId})`}>
          <g
            style={{
              transform: `rotate(${tilt}deg)`,
              transformOrigin: '0px 0px',
              transformBox: 'fill-box',
              transition: BALANCE_MOTION,
            }}
          >
            <rect
              x={-beamHalf}
              y={-1.35}
              width={beamHalf * 2}
              height={2.7}
              rx={1.35}
              fill={`url(#${beamGradientId})`}
            />
            <rect x={-beamHalf + 4} y={-0.55} width={beamHalf * 2 - 8} height={0.9} rx={0.45} fill="#FFF4EC" opacity="0.22" />
            <circle cx={-beamHalf} cy={0} r={1.65} fill="#1D3160" />
            <circle cx={beamHalf} cy={0} r={1.65} fill="#1D3160" />
            <circle cx={0} cy={0} r={2.45} fill="#F5F4F0" stroke="#1D3160" strokeWidth="1.1" />
            <circle cx={0} cy={0} r={0.95} fill="#FF7300" opacity="0.85" />

            <g transform={`translate(${-beamHalf} 0)`}>
              <g
                style={{
                  transform: `rotate(${-tilt}deg)`,
                  transformOrigin: '0px 0px',
                  transformBox: 'fill-box',
                  transition: BALANCE_MOTION,
                }}
              >
                <ScalePan weight={leftWeight} panGradientId={panGradientId} chainGradientId={chainGradientId} />
              </g>
            </g>

            <g transform={`translate(${beamHalf} 0)`}>
              <g
                style={{
                  transform: `rotate(${-tilt}deg)`,
                  transformOrigin: '0px 0px',
                  transformBox: 'fill-box',
                  transition: BALANCE_MOTION,
                }}
              >
                <ScalePan weight={rightWeight} panGradientId={panGradientId} chainGradientId={chainGradientId} />
              </g>
            </g>
          </g>
        </g>
      </svg>
    </span>
  );
}

export function mockToTradeCard(item: MockInventoryItem): TradeCard {
  return {
    id: item.id,
    name: item.name,
    image: item.image,
    condition: item.condition,
    language: item.language,
    printing: item.printing,
    value: getMockCardValueEur(item.id),
  };
}

export function filterTradeCards(cards: TradeCard[], filters: InventoryFiltersState): TradeCard[] {
  const q = filters.query.trim().toLowerCase();
  return cards.filter((card) => {
    if (filters.condition && card.condition !== filters.condition) return false;
    if (filters.language && card.language !== filters.language) return false;
    if (filters.printings.length > 0) {
      if (card.printing === 'standard' || !filters.printings.includes(card.printing)) return false;
    }
    if (q && !card.name.toLowerCase().includes(q)) return false;
    return true;
  });
}

function uniqueValues(cards: TradeCard[], key: 'condition' | 'language' | 'printing'): string[] {
  return [...new Set(cards.map((c) => c[key]))].sort();
}

export function idsEqual(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false;
  const sortedA = [...a].sort();
  const sortedB = [...b].sort();
  return sortedA.every((id, i) => id === sortedB[i]);
}

/** Carta sul tavolo (compatta), con eventuale pulsante di rimozione. */
export function TableCard({ card, onRemove }: { card: TradeCard; onRemove?: () => void }) {
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
      <p className="text-[10px] font-bold tabular-nums text-[#1D3160]">{formatTradeEuro(card.value)}</p>
    </div>
  );
}

/** Chip "differenza in crediti" sul tavolo. */
export function MoneyChip({ amount }: { amount: number }) {
  return (
    <div className="flex w-16 shrink-0 flex-col items-center justify-center rounded-lg border border-dashed border-[#FF7300]/50 bg-orange-50/60 py-2 sm:w-[4.5rem]">
      <span className="text-sm font-bold tabular-nums text-[#1D3160]">+{formatTradeEuro(amount)}</span>
      <span className="text-[8px] font-semibold uppercase text-gray-500">crediti</span>
    </div>
  );
}

/** Menu a tendina multi-selezione per foil / firmate / alterate. */
function PrintingMultiSelect({
  value,
  onChange,
  className,
}: {
  value: SpecialPrintingFilter[];
  onChange: (next: SpecialPrintingFilter[]) => void;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [menuPos, setMenuPos] = useState<{ top: number; left: number; width: number } | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const calcPos = useCallback(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const menuHeight = SPECIAL_PRINTING_FILTERS.length * 36 + 16;
    let top = rect.bottom + 4;
    if (top + menuHeight > window.innerHeight) {
      top = rect.top - menuHeight - 4;
    }
    setMenuPos({ top, left: rect.left, width: rect.width });
  }, []);

  useEffect(() => {
    if (!open) return;
    calcPos();
    function onResize() {
      calcPos();
    }
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [open, calcPos]);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: MouseEvent) {
      const target = e.target as Node;
      if (triggerRef.current?.contains(target)) return;
      if (menuRef.current?.contains(target)) return;
      setOpen(false);
    }
    document.addEventListener('mousedown', onPointerDown);
    return () => document.removeEventListener('mousedown', onPointerDown);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  const triggerLabel =
    value.length === 0
      ? 'Tutte'
      : value.map((printing) => PRINTING_LABELS[printing]).join(', ');

  const toggle = (printing: SpecialPrintingFilter) => {
    if (value.includes(printing)) {
      onChange(value.filter((p) => p !== printing));
      return;
    }
    onChange([...value, printing]);
  };

  return (
    <div className={cn('relative', className)}>
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className={cn(
          'flex w-full items-center justify-between gap-2 rounded-md border border-zinc-200/80 bg-zinc-50/40 px-2 py-1 text-left text-[13px] font-medium text-zinc-900 transition-colors',
          'focus:border-primary/40 focus:outline-none focus:ring-1 focus:ring-primary/15',
        )}
      >
        <span className="min-w-0 truncate">{triggerLabel}</span>
        <ChevronDown
          className={cn('h-3.5 w-3.5 shrink-0 text-zinc-400 transition-transform', open && 'rotate-180')}
          aria-hidden
        />
      </button>

      {open &&
        menuPos &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            ref={menuRef}
            role="listbox"
            aria-multiselectable
            className="z-[200] overflow-hidden rounded-lg border border-zinc-200 bg-white py-1 shadow-lg"
            style={{
              position: 'fixed',
              top: menuPos.top,
              left: menuPos.left,
              width: menuPos.width,
            }}
          >
            {SPECIAL_PRINTING_FILTERS.map((printing) => {
              const isSelected = value.includes(printing);
              return (
                <button
                  key={printing}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  className={cn(
                    'flex w-full items-center gap-2 px-2.5 py-1.5 text-left text-[13px] text-zinc-800 hover:bg-zinc-50',
                    isSelected && 'bg-primary/5 font-semibold text-primary',
                  )}
                  onClick={() => toggle(printing)}
                >
                  <span
                    className={cn(
                      'flex h-4 w-4 shrink-0 items-center justify-center rounded border',
                      isSelected ? 'border-primary bg-primary text-white' : 'border-zinc-300 bg-white',
                    )}
                  >
                    {isSelected && <Check className="h-2.5 w-2.5" strokeWidth={3} aria-hidden />}
                  </span>
                  <span className="min-w-0 flex-1 truncate">{PRINTING_LABELS[printing]}</span>
                </button>
              );
            })}
          </div>,
          document.body,
        )}
    </div>
  );
}

/** Ricerca e filtri compatti per una lista inventario. */
export function InventoryToolbar({
  filters,
  onChange,
  cards,
  variant = 'mine',
}: {
  filters: InventoryFiltersState;
  onChange: (next: InventoryFiltersState) => void;
  cards: TradeCard[];
  variant?: InventoryPanelVariant;
}) {
  const conditions = uniqueValues(cards, 'condition');
  const languages = uniqueValues(cards, 'language');

  const isOther = variant === 'other';

  const labelClass = `mb-0.5 block text-[8px] font-bold uppercase tracking-wider ${
    isOther ? 'text-gray-500' : 'text-gray-400'
  }`;

  const selectClass = cn(
    'min-w-0',
    isOther && '[&_button]:border-[#C9D3E3] [&_button]:bg-white/80',
  );

  const searchClass = isOther
    ? 'h-7 w-full rounded-full border border-[#C9D3E3] bg-white/75 pl-7 pr-2.5 text-[11px] text-gray-800 outline-none placeholder:text-gray-400 focus:border-[#FF7300]/50 focus:bg-white'
    : 'h-7 w-full rounded-full border border-gray-200 bg-gray-50 pl-7 pr-2.5 text-[11px] text-gray-800 outline-none placeholder:text-gray-400 focus:border-[#FF7300]/50 focus:bg-white';

  const conditionSelectOptions: CustomSelectOption[] = [
    { value: '', label: 'Tutte' },
    ...conditions.map((condition) => ({ value: condition, label: condition })),
  ];

  const languageSelectOptions: CustomSelectOption[] = [
    { value: '', label: 'Tutte' },
    ...languages.map((language) => ({
      value: language,
      label: getCardLanguageLabel(language),
      icon: <CardLanguageFlag code={language} size="xs" />,
    })),
  ];

  const showConditionFilter = conditions.length > 1;
  const showLanguageFilter = languages.length > 1;
  const showPrintingFilter = true;
  const filterCount = [showConditionFilter, showLanguageFilter, showPrintingFilter].filter(Boolean).length;

  return (
    <div className="mb-1.5 space-y-1.5">
      <div className="relative">
        <Search className="pointer-events-none absolute left-2 top-1/2 h-3 w-3 -translate-y-1/2 text-gray-400" />
        <input
          type="search"
          value={filters.query}
          onChange={(e) => onChange({ ...filters, query: e.target.value })}
          placeholder="Cerca..."
          className={searchClass}
        />
      </div>

      {filterCount > 0 && (
        <div
          className={cn(
            'grid gap-1.5',
            filterCount === 1 && 'grid-cols-1',
            filterCount === 2 && 'grid-cols-2',
            filterCount === 3 && 'grid-cols-3',
          )}
        >
          {showConditionFilter && (
            <div className="min-w-0">
              <span className={labelClass}>Condizione</span>
              <CustomSelect
                options={conditionSelectOptions}
                value={filters.condition ?? ''}
                onChange={(value) => onChange({ ...filters, condition: value || null })}
                className={selectClass}
              />
            </div>
          )}

          {showLanguageFilter && (
            <div className="min-w-0">
              <span className={labelClass}>Lingua</span>
              <CustomSelect
                options={languageSelectOptions}
                value={filters.language ?? ''}
                onChange={(value) => onChange({ ...filters, language: value || null })}
                className={selectClass}
              />
            </div>
          )}

          {showPrintingFilter && (
            <div className="min-w-0">
              <span className={labelClass}>Foil / Firmate / Alterate</span>
              <PrintingMultiSelect
                value={filters.printings}
                onChange={(printings) => onChange({ ...filters, printings })}
                className={selectClass}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/** Riga selezionabile nelle liste inventario. */
export function InventoryRow({
  card,
  selected,
  onToggle,
  variant = 'mine',
}: {
  card: TradeCard;
  selected: boolean;
  onToggle: () => void;
  variant?: InventoryPanelVariant;
}) {
  const isOther = variant === 'other';

  return (
    <button
      type="button"
      onClick={onToggle}
      className={`group flex w-full items-center gap-2.5 rounded-lg border p-1.5 text-left transition ${
        selected
          ? 'border-[#FF7300] bg-orange-50/70'
          : isOther
            ? 'border-[#C9D3E3] bg-white/85 hover:border-orange-200'
            : 'border-gray-200 bg-white hover:border-orange-200'
      }`}
    >
      <div className="relative h-12 w-9 shrink-0 overflow-hidden rounded bg-gray-200">
        <Image src={card.image} alt={card.name} fill unoptimized className="object-cover" sizes="36px" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[13px] font-semibold text-gray-900">{card.name}</p>
        <p className="text-[11px] font-bold tabular-nums text-[#1D3160]">
          {formatTradeEuro(card.value)}{' '}
          <span className="font-medium text-gray-400">
            · {card.condition} · {getCardLanguageLabel(card.language)}
            {card.printing !== 'standard' ? ` · ${PRINTING_LABELS[card.printing]}` : ''}
          </span>
        </p>
      </div>
      <span
        className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full transition ${
          selected
            ? 'bg-[#FF7300] text-white'
            : isOther
              ? 'bg-[#E8ECF3] text-gray-500 group-hover:bg-orange-100 group-hover:text-[#FF7300]'
              : 'bg-gray-100 text-gray-400 group-hover:bg-orange-100 group-hover:text-[#FF7300]'
        }`}
      >
        {selected ? <Check className="h-3.5 w-3.5" strokeWidth={3} /> : <Plus className="h-3.5 w-3.5" strokeWidth={2.5} />}
      </span>
    </button>
  );
}

/** Pannello inventario con sfondo differenziato (mio vs altro utente). */
export function InventoryPanel({
  variant,
  title,
  hint,
  filters,
  onFiltersChange,
  cards,
  filteredCards,
  selectedIds,
  onToggle,
}: {
  variant: InventoryPanelVariant;
  title: string;
  hint: string;
  filters: InventoryFiltersState;
  onFiltersChange: (next: InventoryFiltersState) => void;
  cards: TradeCard[];
  filteredCards: TradeCard[];
  selectedIds: string[];
  onToggle: (id: string) => void;
}) {
  const isOther = variant === 'other';

  return (
    <section
      className={
        isOther
          ? 'rounded-xl border border-[#C9D3E3] bg-[#E8ECF3] p-2.5 shadow-sm'
          : 'rounded-xl border border-gray-200 bg-white p-2.5 shadow-sm'
      }
    >
      <div
        className={`mb-1.5 flex items-center justify-between border-b pb-1.5 ${
          isOther ? 'border-[#C9D3E3]/80' : 'border-gray-100'
        }`}
      >
        <h2 className="truncate text-[13px] font-bold uppercase tracking-tight text-[#1D3160]">{title}</h2>
        <span className="shrink-0 text-[10px] font-medium text-gray-500">{hint}</span>
      </div>
      <InventoryToolbar filters={filters} onChange={onFiltersChange} cards={cards} variant={variant} />
      <div className="flex max-h-[380px] flex-col gap-1.5 overflow-y-auto pr-1">
        {filteredCards.length === 0 ? (
          <p className="py-4 text-center text-[11px] text-gray-500">Nessuna carta trovata</p>
        ) : (
          filteredCards.map((card) => (
            <InventoryRow
              key={card.id}
              card={card}
              selected={selectedIds.includes(card.id)}
              onToggle={() => onToggle(card.id)}
              variant={variant}
            />
          ))
        )}
      </div>
    </section>
  );
}

/** Campo monetario compatto (differenza in euro). */
export function MoneyField({
  value,
  onChange,
  label,
}: {
  value: number;
  onChange: (v: number) => void;
  label: string;
}) {
  const digitCount = Math.max(String(value || '').length, 1);

  return (
    <label className="flex items-center gap-2">
      <span className="whitespace-nowrap text-[11px] font-bold uppercase tracking-wide text-gray-500">{label}</span>
      <span className="flex items-center rounded-lg border border-gray-300 bg-white focus-within:border-[#FF7300]">
        <button
          type="button"
          onClick={() => onChange(Math.max(0, value - 5))}
          className="flex h-8 w-7 shrink-0 items-center justify-center text-gray-500 hover:bg-gray-50"
          aria-label="Diminuisci"
        >
          <Minus className="h-3 w-3" />
        </button>
        <span className="relative shrink-0">
          <span className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400">
            €
          </span>
          <input
            type="number"
            min={0}
            value={value || ''}
            onChange={(e) => onChange(Math.max(0, parseInt(e.target.value, 10) || 0))}
            placeholder="0"
            style={{ width: `${digitCount + 2.25}ch` }}
            className="h-8 min-w-[4.75rem] max-w-[9rem] border-x border-gray-200 bg-transparent pl-6 pr-2 text-right text-sm font-bold tabular-nums text-gray-900 outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
          />
        </span>
        <button
          type="button"
          onClick={() => onChange(value + 5)}
          className="flex h-8 w-7 shrink-0 items-center justify-center text-gray-500 hover:bg-gray-50"
          aria-label="Aumenta"
        >
          <Plus className="h-3 w-3" />
        </button>
      </span>
    </label>
  );
}
