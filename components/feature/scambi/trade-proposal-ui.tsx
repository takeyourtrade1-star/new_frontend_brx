'use client';

import { useId, useState, useRef, useEffect, useCallback, type CSSProperties } from 'react';
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

const BALANCE_MAX_TILT_DEG = 22;
const BALANCE_MOTION =
  'transform 0.8s cubic-bezier(0.34, 1.45, 0.5, 1)';

/** Angolo di inclinazione: positivo = più valore richiesto (destra), negativo = più offerto (sinistra). */
export function tradeBalanceTiltDeg(offeredValue: number, requestedValue: number): number {
  const total = offeredValue + requestedValue;
  const denominator = total > 0 ? total : Math.max(offeredValue, requestedValue, 1);
  const imbalance = (requestedValue - offeredValue) / denominator;
  return Math.max(-1, Math.min(1, imbalance)) * BALANCE_MAX_TILT_DEG;
}

/** Numero di monetine impilate su un piatto in base al valore di quel lato. */
function coinsForValue(value: number): number {
  if (value <= 0) return 0;
  if (value < 8) return 1;
  if (value < 25) return 2;
  if (value < 55) return 3;
  return 4;
}

/** Scintilla a quattro punte che brilla in loop (twinkle). */
function Sparkle({ cx, cy, r, begin }: { cx: number; cy: number; r: number; begin: string }) {
  const t = r * 0.3;
  return (
    <path
      d={`M${cx} ${cy - r} L${cx + t} ${cy - t} L${cx + r} ${cy} L${cx + t} ${cy + t} L${cx} ${cy + r} L${cx - t} ${cy + t} L${cx - r} ${cy} L${cx - t} ${cy - t} Z`}
      fill="#FFFDF5"
      opacity={0}
    >
      <animate
        attributeName="opacity"
        values="0;0.95;0"
        dur="2.6s"
        begin={begin}
        repeatCount="indefinite"
        calcMode="spline"
        keyTimes="0;0.5;1"
        keySplines="0.4 0 0.6 1; 0.4 0 0.6 1"
      />
    </path>
  );
}

/** Pila di monetine dorate dentro al piatto (origine: centro piatto). */
function CoinStack({ count, goldId, sparkleBegin }: { count: number; goldId: string; sparkleBegin: string }) {
  if (count <= 0) return null;
  const coins = [];
  for (let i = 0; i < count; i += 1) {
    const cy = 9 - i * 1.85;
    coins.push(
      <g key={i}>
        <ellipse cx={0} cy={cy + 0.5} rx={3.6} ry={1.5} fill="#7A4600" opacity={0.4} />
        <ellipse cx={0} cy={cy} rx={3.6} ry={1.55} fill={`url(#${goldId})`} stroke="#B26A00" strokeWidth={0.3} />
        <ellipse cx={-0.5} cy={cy - 0.4} rx={2.1} ry={0.65} fill="#FFF6D0" opacity={0.85} />
      </g>,
    );
  }
  const topCy = 9 - (count - 1) * 1.85;
  return (
    <g>
      {coins}
      <Sparkle cx={1.7} cy={topCy - 0.7} r={1.5} begin={sparkleBegin} />
    </g>
  );
}

/** Piatto appeso: catene + scodella + monetine. Origine (0,0) = punto di aggancio (cima). */
function ScalePan({
  coins,
  panId,
  chainId,
  goldId,
  sparkleBegin,
}: {
  coins: number;
  panId: string;
  chainId: string;
  goldId: string;
  sparkleBegin: string;
}) {
  return (
    <g>
      {/* anello di aggancio */}
      <circle cx={0} cy={0} r={1.1} fill={`url(#${chainId})`} />
      {/* catene */}
      <line x1={0} y1={0} x2={-6.2} y2={8} stroke={`url(#${chainId})`} strokeWidth={0.7} strokeLinecap="round" />
      <line x1={0} y1={0} x2={0} y2={8} stroke={`url(#${chainId})`} strokeWidth={0.7} strokeLinecap="round" />
      <line x1={0} y1={0} x2={6.2} y2={8} stroke={`url(#${chainId})`} strokeWidth={0.7} strokeLinecap="round" />
      {/* scodella metallica con profondità */}
      <ellipse cx={0} cy={14.6} rx={6.2} ry={1.2} fill="#1D3160" opacity={0.14} />
      <path d="M-7 8 C -6.6 13 -4 13.8 0 13.8 C 4 13.8 6.6 13 7 8 Z" fill={`url(#${panId})`} />
      <path d="M-5.6 9.6 C -3 12 3 12 5.6 9.6" stroke="#7A2E00" strokeWidth={0.6} strokeLinecap="round" opacity={0.25} fill="none" />
      <path d="M-7 8 C -3 6.7 3 6.7 7 8" stroke="#FFF4EC" strokeWidth={0.75} strokeLinecap="round" opacity={0.7} />
      {/* monetine (sopra le catene, dentro la scodella) */}
      <CoinStack count={coins} goldId={goldId} sparkleBegin={sparkleBegin} />
    </g>
  );
}

/**
 * Bilancia animata super-figa: fulcro centrale, asta inclinata in base
 * all'equilibrio della proposta, piatti orizzontali con monetine metalliche
 * che brillano, gemma centrale pulsante, ago con finiale a diamante e leggera
 * oscillazione di riposo.
 */
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
  const goldGradientId = `trade-balance-gold-${uid}`;
  const glowGradientId = `trade-balance-glow-${uid}`;
  const shadowFilterId = `trade-balance-shadow-${uid}`;

  const tilt = tradeBalanceTiltDeg(offeredValue, requestedValue);
  const leftCoins = coinsForValue(offeredValue);
  const rightCoins = coinsForValue(requestedValue);

  const pivotX = 40;
  const pivotY = 24;
  const beamHalf = 24;

  const beamTransition = { transform: `rotate(${tilt}deg)`, transformOrigin: `${pivotX}px ${pivotY}px`, transformBox: 'view-box', transition: BALANCE_MOTION } as const;
  const panTransition = { transform: `rotate(${-tilt}deg)`, transformOrigin: '50% 0', transformBox: 'fill-box', transition: BALANCE_MOTION } as const;

  return (
    <span className={`inline-flex shrink-0 items-center justify-center ${className}`} aria-hidden>
      <svg viewBox="0 0 80 78" className="h-12 w-12 overflow-visible" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id={beamGradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#3A5088" />
            <stop offset="100%" stopColor="#1D3160" />
          </linearGradient>
          <radialGradient id={panGradientId} cx="50%" cy="18%" r="92%">
            <stop offset="0%" stopColor="#FFB066" />
            <stop offset="55%" stopColor="#FF7300" />
            <stop offset="100%" stopColor="#C95400" />
          </radialGradient>
          <linearGradient id={chainGradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#A9B6C8" />
            <stop offset="100%" stopColor="#475569" />
          </linearGradient>
          <radialGradient id={goldGradientId} cx="36%" cy="28%" r="78%">
            <stop offset="0%" stopColor="#FFF6D0" />
            <stop offset="45%" stopColor="#F7C24B" />
            <stop offset="100%" stopColor="#C9821A" />
          </radialGradient>
          <radialGradient id={glowGradientId} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#FF7300" stopOpacity={0.55} />
            <stop offset="100%" stopColor="#FF7300" stopOpacity={0} />
          </radialGradient>
          <filter id={shadowFilterId} x="-40%" y="-40%" width="180%" height="180%">
            <feDropShadow dx="0" dy="1.4" stdDeviation="1" floodColor="#1D3160" floodOpacity="0.2" />
          </filter>
        </defs>

        {/* ombra a terra */}
        <ellipse cx={pivotX} cy={70} rx={20} ry={2.6} fill="#1D3160" opacity={0.08} />

        {/* base + colonna */}
        <path d="M28 67 L52 67 L47.5 61 L32.5 61 Z" fill={`url(#${beamGradientId})`} />
        <rect x={pivotX - 2.4} y={26} width={4.8} height={36} rx={1.8} fill={`url(#${beamGradientId})`} />
        <rect x={pivotX - 1} y={28} width={1.4} height={32} rx={0.7} fill="#FFF4EC" opacity={0.18} />
        {/* fulcro */}
        <path d={`M${pivotX} ${pivotY + 1} L${pivotX - 4.5} ${pivotY + 7} H${pivotX + 4.5} Z`} fill="#16264D" />

        {/* gruppo oscillante (riposo) attorno al fulcro */}
        <g filter={`url(#${shadowFilterId})`}>
          <animateTransform
            attributeName="transform"
            type="rotate"
            values={`-1.1 ${pivotX} ${pivotY}; 1.1 ${pivotX} ${pivotY}; -1.1 ${pivotX} ${pivotY}`}
            dur="5s"
            repeatCount="indefinite"
            calcMode="spline"
            keyTimes="0;0.5;1"
            keySplines="0.45 0 0.55 1; 0.45 0 0.55 1"
          />

          {/* asta che si inclina in base all'equilibrio */}
          <g style={beamTransition}>
            {/* ago indicatore + finiale a diamante */}
            <line x1={pivotX} y1={pivotY} x2={pivotX} y2={pivotY - 9} stroke={`url(#${beamGradientId})`} strokeWidth={1.1} strokeLinecap="round" />
            <path
              d={`M${pivotX} ${pivotY - 12} L${pivotX + 1.5} ${pivotY - 10} L${pivotX} ${pivotY - 8} L${pivotX - 1.5} ${pivotY - 10} Z`}
              fill="#FF7300"
            />
            <path d={`M${pivotX} ${pivotY - 11.4} L${pivotX + 0.7} ${pivotY - 10} L${pivotX} ${pivotY - 8.6} Z`} fill="#FFC58A" opacity={0.85} />

            {/* barra */}
            <rect x={pivotX - beamHalf} y={pivotY - 1.5} width={beamHalf * 2} height={3} rx={1.5} fill={`url(#${beamGradientId})`} />
            <rect x={pivotX - beamHalf + 4} y={pivotY - 0.6} width={beamHalf * 2 - 8} height={1} rx={0.5} fill="#FFF4EC" opacity={0.22} />
            <circle cx={pivotX - beamHalf} cy={pivotY} r={1.8} fill="#16264D" />
            <circle cx={pivotX + beamHalf} cy={pivotY} r={1.8} fill="#16264D" />

            {/* gemma centrale con bagliore pulsante */}
            <circle cx={pivotX} cy={pivotY} r={7} fill={`url(#${glowGradientId})`}>
              <animate
                attributeName="opacity"
                values="0.7;0.2;0.7"
                dur="3.2s"
                repeatCount="indefinite"
                calcMode="spline"
                keyTimes="0;0.5;1"
                keySplines="0.4 0 0.6 1; 0.4 0 0.6 1"
              />
            </circle>
            <circle cx={pivotX} cy={pivotY} r={2.8} fill="#F5F4F0" stroke="#1D3160" strokeWidth={1.2} />
            <circle cx={pivotX} cy={pivotY} r={1} fill="#FF7300" />

            {/* piatto sinistro (offerto) */}
            <g transform={`translate(${pivotX - beamHalf} ${pivotY})`}>
              <g style={panTransition}>
                <ScalePan coins={leftCoins} panId={panGradientId} chainId={chainGradientId} goldId={goldGradientId} sparkleBegin="0s" />
              </g>
            </g>

            {/* piatto destro (richiesto) */}
            <g transform={`translate(${pivotX + beamHalf} ${pivotY})`}>
              <g style={panTransition}>
                <ScalePan coins={rightCoins} panId={panGradientId} chainId={chainGradientId} goldId={goldGradientId} sparkleBegin="1.3s" />
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

/** Carta appoggiata sul tavolo: ombra, leggera inclinazione, prezzo overlay e
 * "sollevamento" all'hover come se la prendessi in mano. */
export function TableCard({ card, onRemove, tiltDeg = 0 }: { card: TradeCard; onRemove?: () => void; tiltDeg?: number }) {
  return (
    <div
      className="group relative w-[3.25rem] shrink-0 transition-transform duration-200 ease-out [transform:rotate(var(--tilt))] hover:z-10 hover:[transform:translateY(-5px)_rotate(0deg)_scale(1.07)] sm:w-[3.6rem]"
      style={{ '--tilt': `${tiltDeg}deg` } as CSSProperties}
      title={card.name}
    >
      {/* ombra di contatto: la carta sembra appoggiata sul feltro */}
      <span
        className="pointer-events-none absolute inset-x-1 bottom-0 h-2.5 rounded-[50%] bg-black/50 blur-[4px] transition-all duration-200 group-hover:-bottom-1.5 group-hover:opacity-55"
        aria-hidden
      />
      <div className="relative aspect-[200/280] w-full overflow-hidden rounded-[5px] bg-gray-300 shadow-[0_6px_12px_-5px_rgba(0,0,0,0.7)] ring-1 ring-black/30 transition-shadow duration-200 group-hover:shadow-[0_16px_24px_-8px_rgba(0,0,0,0.75)]">
        <Image src={card.image} alt={card.name} fill unoptimized className="object-cover" sizes="72px" />
        {/* riflesso/lucentezza diagonale */}
        <span className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/25 via-transparent to-black/15" />
        {/* filo di luce sul bordo superiore */}
        <span className="pointer-events-none absolute inset-x-0 top-0 h-px bg-white/40" />
        {/* prezzo overlay */}
        <span className="absolute inset-x-0 bottom-0.5 flex justify-center">
          <span className="rounded-full bg-black/70 px-1.5 py-[1px] text-[8px] font-bold tabular-nums text-white ring-1 ring-white/10">
            {formatTradeEuro(card.value)}
          </span>
        </span>
        {onRemove && (
          <button
            type="button"
            onClick={onRemove}
            className="absolute right-0.5 top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-black/65 text-white shadow-sm ring-1 ring-white/15 transition hover:bg-red-500"
            aria-label={`Rimuovi ${card.name}`}
          >
            <Minus className="h-3 w-3" strokeWidth={3} />
          </button>
        )}
      </div>
    </div>
  );
}

/** Gettone "differenza in crediti" appoggiato sul tavolo. */
export function MoneyChip({ amount, tiltDeg = 0 }: { amount: number; tiltDeg?: number }) {
  return (
    <div className="group relative w-[3.25rem] shrink-0 sm:w-[3.6rem]" style={{ transform: `rotate(${tiltDeg}deg)` }}>
      {/* ombra di contatto sul feltro */}
      <span className="pointer-events-none absolute inset-x-1 bottom-0 h-2.5 rounded-[50%] bg-black/50 blur-[4px]" aria-hidden />
      <div
        className="relative flex aspect-[200/280] w-full flex-col items-center justify-center gap-1 overflow-hidden rounded-[5px] bg-gradient-to-b from-[#FF9A40] to-[#FF6A00] shadow-[0_6px_12px_-5px_rgba(0,0,0,0.7)] ring-1 ring-black/20"
        title={`+${formatTradeEuro(amount)} in crediti`}
      >
        {/* lucentezza + filo di luce */}
        <span className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/30 via-transparent to-black/15" aria-hidden />
        <span className="pointer-events-none absolute inset-x-0 top-0 h-px bg-white/45" aria-hidden />
        {/* moneta dorata in rilievo */}
        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-b from-[#FFE7B0] to-[#F4B53C] text-[10px] font-black text-[#7A4600] shadow-[inset_0_1px_1px_rgba(255,255,255,0.85),0_1px_2px_rgba(0,0,0,0.25)] ring-1 ring-[#C9821A]">
          €
        </span>
        <span className="relative text-[11px] font-black leading-none tabular-nums text-white [text-shadow:0_1px_1px_rgba(0,0,0,0.3)]">
          +{formatTradeEuro(amount)}
        </span>
        <span className="relative text-[7px] font-bold uppercase tracking-wide text-white/85">crediti</span>
      </div>
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
          ? isOther
            ? 'border-[#1D3160] bg-[#EEF1F8]'
            : 'border-[#FF7300] bg-[#FFF4EC]'
          : isOther
            ? 'border-[#C9D3E3] bg-white/85 hover:border-[#1D3160]/35'
            : 'border-gray-200 bg-white hover:border-[#FF7300]/45'
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
            ? isOther
              ? 'bg-[#1D3160] text-white'
              : 'bg-[#FF7300] text-white'
            : isOther
              ? 'bg-[#E8ECF3] text-gray-500 group-hover:bg-[#1D3160]/10 group-hover:text-[#1D3160]'
              : 'bg-gray-100 text-gray-400 group-hover:bg-[#FF7300]/15 group-hover:text-[#FF7300]'
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
  embedded = false,
  ownerBadge,
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
  /** Incassato dentro al blocco scambio: niente bordo/ombra propri. */
  embedded?: boolean;
  /** Etichetta proprietario (es. "Tu" o nome utente) per distinguere le due liste. */
  ownerBadge?: string;
}) {
  const isOther = variant === 'other';

  // Identità coi colori del sito: arancione = TU, navy = altro utente.
  const accent = isOther
    ? { dot: 'bg-[#1D3160]', text: 'text-[#1D3160]', chip: 'bg-white text-[#1D3160] ring-[#C9D3E3]', border: 'border-[#C9D3E3]/80' }
    : { dot: 'bg-[#FF7300]', text: 'text-[#C2410C]', chip: 'bg-white text-[#C2410C] ring-[#FFD7B5]', border: 'border-[#FFD7B5]/80' };

  const sectionClass = embedded
    ? cn('p-2.5', isOther ? 'bg-[#F4F6FB]' : 'bg-[#FFF9F3]')
    : isOther
      ? 'rounded-xl border border-[#C9D3E3] bg-[#E8ECF3] p-2.5 shadow-sm'
      : 'rounded-xl border border-gray-200 bg-white p-2.5 shadow-sm';

  return (
    <section className={sectionClass}>
      <div className={cn('mb-1.5 flex items-center justify-between gap-2 border-b pb-1.5', accent.border)}>
        <span className="flex min-w-0 items-center gap-1.5">
          <span className={cn('h-2 w-2 shrink-0 rounded-full', accent.dot)} aria-hidden />
          <h2 className={cn('truncate text-[12px] font-bold uppercase tracking-tight', accent.text)}>{title}</h2>
          {ownerBadge && (
            <span
              className={cn(
                'inline-flex max-w-[7rem] shrink items-center truncate rounded-full px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide ring-1',
                accent.chip,
              )}
            >
              {ownerBadge}
            </span>
          )}
        </span>
        <span className="shrink-0 text-[10px] font-medium text-gray-500">{hint}</span>
      </div>
      <InventoryToolbar filters={filters} onChange={onFiltersChange} cards={cards} variant={variant} />
      <div className="flex max-h-[260px] flex-col gap-1.5 overflow-y-auto pr-1">
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
