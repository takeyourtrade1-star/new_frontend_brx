'use client';

import { useMemo, useState, useCallback, useRef, useEffect } from 'react';
import { Info, Eye, EyeOff } from 'lucide-react';
import { cn } from '@/lib/utils';

const BRAND_ORANGE = '#FF7300';
const SALES_BLUE = '#2563EB';
const GRID_COLOR = '#E8E8E8';
const AXIS_TEXT = '#5C5C5C';

/** Max punti evidenziati sulla linea (Cardmarket: pochi marker) */
const MAX_VISIBLE_DOTS = 12;
const DAY_MS = 24 * 60 * 60 * 1000;

type RangePreset = '1d' | '7d' | '30d' | 'all' | 'custom';

export type ProductPriceStats = {
  trendPrice: number;
  soldCopies: number;
  averageSalePrice: number;
  rangeLabel: string;
};

function hashSlug(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

function prng(seed: number, i: number): number {
  const x = Math.sin(seed * 0.001 + i * 12.9898) * 43758.5453;
  return x - Math.floor(x);
}

/** Serie storica demo (~3 anni, un punto ogni ~5 giorni) — sostituibile con API reale. */
export function buildPriceHistoryPoints(slug: string): { t: number; price: number; sales?: number }[] {
  const seed = hashSlug(slug || 'default');
  const end = new Date();
  end.setHours(12, 0, 0, 0);
  const start = new Date(end);
  start.setMonth(start.getMonth() - 38);
  const daysTotal = Math.ceil((end.getTime() - start.getTime()) / 86400000);
  const step = 12;
  const out: { t: number; price: number; sales: number }[] = [];
  for (let d = 0; d <= daysTotal; d += step) {
    const t = start.getTime() + d * 86400000;
    const progress = d / Math.max(daysTotal, 1);
    const wave = 16 + Math.sin(progress * 14 + seed * 0.0001) * 6 + Math.sin(progress * 28) * 2.5;
    const noise = (prng(seed, d) - 0.5) * 5;
    let price = wave + noise;
    /* Picco tipo Cardmarket verso fine timeline */
    if (progress > 0.82 && progress < 0.88) price += (progress - 0.82) * 280;
    if (progress > 0.88 && progress < 0.92) price -= (progress - 0.88) * 120;
    price = Math.max(8, Math.min(48, price));
    /* Vendite correlate al prezzo: quando il prezzo scende, le vendite salgono */
    const baseSales = 50 + Math.sin(progress * 8 + seed * 0.001) * 30;
    const priceFactor = Math.max(0, (50 - price) * 2);
    const salesNoise = (prng(seed, d + 1000) - 0.5) * 20;
    let sales = Math.round(Math.max(5, Math.min(200, baseSales + priceFactor + salesNoise)));
    /* Picco vendite vicino al picco prezzo */
    if (progress > 0.8 && progress < 0.92) sales += Math.round((progress - 0.8) * 300);
    out.push({ t, price: Math.round(price * 100) / 100, sales });
  }
  out.push({ t: end.getTime(), price: out[out.length - 1]?.price ?? 18, sales: out[out.length - 1]?.sales ?? 50 });
  return out;
}

function formatDateIt(t: number): string {
  const d = new Date(t);
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yy = d.getFullYear();
  return `${dd}.${mm}.${yy}`;
}

function formatEuroShort(n: number): string {
  return (
    new Intl.NumberFormat('it-IT', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(n) + ' €'
  );
}

function niceYSteps(minP: number, maxP: number): number[] {
  const pad = Math.max((maxP - minP) * 0.12, 2);
  let lo = Math.max(0, minP - pad);
  let hi = maxP + pad;
  const range = hi - lo;
  const step = range <= 20 ? 5 : range <= 40 ? 10 : 15;
  const start = Math.floor(lo / step) * step;
  const ticks: number[] = [];
  for (let y = start; y <= hi + step; y += step) {
    if (y >= 0) ticks.push(y);
    if (ticks.length > 8) break;
  }
  if (ticks.length < 3) {
    return [lo, (lo + hi) / 2, hi].map((v) => Math.round(v * 100) / 100);
  }
  return ticks;
}

function niceYStepsSales(minS: number, maxS: number): number[] {
  const pad = Math.max((maxS - minS) * 0.12, 5);
  let lo = Math.max(0, minS - pad);
  let hi = maxS + pad;
  const range = hi - lo;
  const step = range <= 50 ? 10 : range <= 100 ? 25 : 50;
  const start = Math.floor(lo / step) * step;
  const ticks: number[] = [];
  for (let y = start; y <= hi + step; y += step) {
    if (y >= 0) ticks.push(y);
    if (ticks.length > 6) break;
  }
  if (ticks.length < 3) {
    return [lo, (lo + hi) / 2, hi].map((v) => Math.round(v));
  }
  return ticks.map((v) => Math.round(v));
}

function formatDateInput(t: number): string {
  const d = new Date(t);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function parseDateInput(value: string, endOfDay: boolean): number | null {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  if (endOfDay) d.setHours(23, 59, 59, 999);
  else d.setHours(0, 0, 0, 0);
  return d.getTime();
}

function buildTimeMarkers(tMin: number, tMax: number): number[] {
  const span = Math.max(tMax - tMin, 1);
  const days = span / DAY_MS;
  const markers: number[] = [];

  if (days <= 14) {
    let cursor = new Date(tMin);
    cursor.setHours(0, 0, 0, 0);
    while (cursor.getTime() <= tMax) {
      markers.push(cursor.getTime());
      cursor = new Date(cursor.getTime() + DAY_MS);
      if (markers.length > 18) break;
    }
    return markers;
  }

  if (days <= 90) {
    let cursor = new Date(tMin);
    cursor.setHours(0, 0, 0, 0);
    while (cursor.getTime() <= tMax) {
      markers.push(cursor.getTime());
      cursor = new Date(cursor.getTime() + 7 * DAY_MS);
      if (markers.length > 16) break;
    }
    return markers;
  }

  let cursor = new Date(tMin);
  cursor = new Date(cursor.getFullYear(), cursor.getMonth(), 1, 0, 0, 0, 0);
  while (cursor.getTime() <= tMax) {
    markers.push(cursor.getTime());
    cursor = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1, 0, 0, 0, 0);
    if (markers.length > 14) break;
  }
  return markers;
}

export function ProductPriceChart({
  slug,
  className,
  onStatsChange,
}: {
  slug: string;
  className?: string;
  onStatsChange?: (stats: ProductPriceStats) => void;
}) {
  const [isLoading, setIsLoading] = useState(true);
  const [rangePreset, setRangePreset] = useState<RangePreset>('7d');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');

  useEffect(() => {
    // Simula caricamento dati
    const timer = setTimeout(() => setIsLoading(false), 400);
    return () => clearTimeout(timer);
  }, [slug]);

  const allPoints = useMemo(() => buildPriceHistoryPoints(slug), [slug]);
  const dataStartTs = allPoints[0]?.t ?? Date.now() - 30 * DAY_MS;
  const dataEndTs = allPoints[allPoints.length - 1]?.t ?? Date.now();

  useEffect(() => {
    setRangePreset('7d');
    setCustomFrom('');
    setCustomTo('');
  }, [slug]);

  useEffect(() => {
    if (!customFrom) setCustomFrom(formatDateInput(Math.max(dataStartTs, dataEndTs - 7 * DAY_MS)));
    if (!customTo) setCustomTo(formatDateInput(dataEndTs));
  }, [customFrom, customTo, dataStartTs, dataEndTs]);

  const { rangeStartTs, rangeEndTs, rangeLabel } = useMemo(() => {
    const end = dataEndTs;
    const fallbackStart = Math.max(dataStartTs, end - 7 * DAY_MS);

    if (rangePreset === 'custom') {
      const fromTs = parseDateInput(customFrom, false);
      const toTs = parseDateInput(customTo, true);
      if (fromTs != null && toTs != null && fromTs <= toTs) {
        const clampedFrom = Math.max(dataStartTs, fromTs);
        const clampedTo = Math.min(dataEndTs, toTs);
        if (clampedFrom <= clampedTo) {
          return {
            rangeStartTs: clampedFrom,
            rangeEndTs: clampedTo,
            rangeLabel: `${formatDateIt(clampedFrom)} - ${formatDateIt(clampedTo)}`,
          };
        }
      }
      return {
        rangeStartTs: fallbackStart,
        rangeEndTs: end,
        rangeLabel: 'Ultimi 7 giorni',
      };
    }

    if (rangePreset === 'all') {
      return {
        rangeStartTs: dataStartTs,
        rangeEndTs: dataEndTs,
        rangeLabel: 'Dall\'inizio',
      };
    }

    const days = rangePreset === '1d' ? 1 : rangePreset === '30d' ? 30 : 7;
    const start = Math.max(dataStartTs, end - days * DAY_MS);
    return {
      rangeStartTs: start,
      rangeEndTs: end,
      rangeLabel: `Ultimi ${days} giorni`,
    };
  }, [rangePreset, customFrom, customTo, dataStartTs, dataEndTs]);

  const visiblePoints = useMemo(() => {
    const inRange = allPoints.filter((p) => p.t >= rangeStartTs && p.t <= rangeEndTs);
    if (inRange.length >= 2) return inRange;
    const fallback = allPoints.filter((p) => p.t <= rangeEndTs).slice(-Math.max(2, Math.min(24, allPoints.length)));
    return fallback.length >= 2 ? fallback : allPoints.slice(-2);
  }, [allPoints, rangeStartTs, rangeEndTs]);

  const { minP, maxP, yTicks } = useMemo(() => {
    const prices = visiblePoints.map((p) => p.price);
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    const ticks = niceYSteps(min, max);
    return { minP: ticks[0] ?? min, maxP: ticks[ticks.length - 1] ?? max, yTicks: ticks };
  }, [visiblePoints]);

  const { minS, maxS, yTicksSales } = useMemo(() => {
    const sales = visiblePoints.map((p) => p.sales ?? 0);
    const min = Math.min(...sales);
    const max = Math.max(...sales);
    const ticks = niceYStepsSales(min, max);
    return { minS: ticks[0] ?? min, maxS: ticks[ticks.length - 1] ?? max, yTicksSales: ticks };
  }, [visiblePoints]);

  const tMin = visiblePoints[0]?.t ?? rangeStartTs;
  const tMax = visiblePoints[visiblePoints.length - 1]?.t ?? rangeEndTs;

  const containerRef = useRef<HTMLDivElement>(null);
  const [cw, setCw] = useState(560);
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setCw(Math.max(320, el.clientWidth || 560)));
    ro.observe(el);
    setCw(Math.max(320, el.clientWidth || 560));
    return () => ro.disconnect();
  }, []);

  const pad = { t: 8, r: 16, b: 48, l: 56 };
  const H = 200;
  const W = cw;
  const iw = W - pad.l - pad.r;
  const ih = H - pad.t - pad.b;

  const xScale = useCallback((t: number) => pad.l + ((t - tMin) / Math.max(tMax - tMin, 1)) * iw, [tMin, tMax, iw, pad.l]);
  const yScale = useCallback(
    (p: number) => pad.t + ih - ((p - minP) / Math.max(maxP - minP, 0.0001)) * ih,
    [minP, maxP, ih, pad.t]
  );

  const yScaleSales = useCallback(
    (s: number) => pad.t + ih - ((s - minS) / Math.max(maxS - minS, 0.0001)) * ih,
    [minS, maxS, ih, pad.t]
  );

  const linePath = useMemo(() => {
    if (visiblePoints.length < 2) return '';
    return visiblePoints
      .map((pt, i) => `${i === 0 ? 'M' : 'L'} ${xScale(pt.t).toFixed(2)} ${yScale(pt.price).toFixed(2)}`)
      .join(' ');
  }, [visiblePoints, xScale, yScale]);

  const salesPath = useMemo(() => {
    if (visiblePoints.length < 2) return '';
    return visiblePoints
      .map((pt, i) => `${i === 0 ? 'M' : 'L'} ${xScale(pt.t).toFixed(2)} ${yScaleSales(pt.sales ?? 0).toFixed(2)}`)
      .join(' ');
  }, [visiblePoints, xScale, yScaleSales]);

  /** Indici punti su cui disegnare i cerchi (linea usa tutti i punti). */
  const dotIndices = useMemo(() => {
    const n = visiblePoints.length;
    if (n <= 2) return n === 2 ? [0, 1] : [0];
    if (n <= MAX_VISIBLE_DOTS) return visiblePoints.map((_, i) => i);
    const out: number[] = [0];
    const inner = MAX_VISIBLE_DOTS - 2;
    const step = (n - 1) / (inner + 1);
    for (let k = 1; k <= inner; k++) {
      out.push(Math.min(n - 2, Math.round(k * step)));
    }
    out.push(n - 1);
    return [...new Set(out)].sort((a, b) => a - b);
  }, [visiblePoints]);

  const timeMarkers = useMemo(() => buildTimeMarkers(tMin, tMax), [tMin, tMax]);

  const [hover, setHover] = useState<{ x: number; y: number; t: number; price: number; sales: number } | null>(null);
  const [showPriceLine, setShowPriceLine] = useState(true);
  const [showSalesLine, setShowSalesLine] = useState(true);

  const stats = useMemo<ProductPriceStats>(() => {
    const first = visiblePoints[0];
    const last = visiblePoints[visiblePoints.length - 1];
    const soldCopies = visiblePoints.reduce((acc, p) => acc + (p.sales ?? 0), 0);
    const averageSalePrice =
      visiblePoints.length > 0
        ? visiblePoints.reduce((acc, p) => acc + p.price, 0) / visiblePoints.length
        : 0;
    return {
      trendPrice: last?.price ?? first?.price ?? 0,
      soldCopies,
      averageSalePrice,
      rangeLabel,
    };
  }, [visiblePoints, rangeLabel]);

  useEffect(() => {
    onStatsChange?.(stats);
  }, [onStatsChange, stats]);

  const currentDayX = useMemo(() => {
    const now = Date.now();
    if (now < tMin || now > tMax) return null;
    return xScale(now);
  }, [tMin, tMax, xScale]);

  const onSvgMove = useCallback(
    (e: React.MouseEvent<SVGSVGElement>) => {
      const svg = e.currentTarget;
      const rect = svg.getBoundingClientRect();
      const vx = ((e.clientX - rect.left) / rect.width) * W;
      if (vx < pad.l || vx > W - pad.r) {
        setHover(null);
        return;
      }
      const t = tMin + ((vx - pad.l) / iw) * (tMax - tMin);
      let best = visiblePoints[0];
      let bestD = Infinity;
      for (const p of visiblePoints) {
        const d = Math.abs(p.t - t);
        if (d < bestD) {
          bestD = d;
          best = p;
        }
      }
      if (!best) return;
      setHover({
        x: xScale(best.t),
        y: yScale(best.price),
        t: best.t,
        price: best.price,
        sales: best.sales ?? 0,
      });
    },
    [W, pad.l, pad.r, iw, tMin, tMax, visiblePoints, xScale, yScale]
  );

  if (isLoading) {
    return (
      <div className={cn('flex flex-col min-w-0', className)}>
        {/* Header skeleton */}
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-1.5">
            <div className="h-3.5 w-3.5 rounded-full bg-gray-200 animate-pulse" />
            <div className="h-3 w-16 bg-gray-200 rounded animate-pulse" />
          </div>
          <div className="flex items-center gap-0.5 rounded border border-gray-200 bg-white p-1">
            <div className="h-4 w-4 bg-gray-200 rounded animate-pulse" />
            <div className="h-3 w-24 bg-gray-200 rounded mx-2 animate-pulse" />
            <div className="h-4 w-4 bg-gray-200 rounded animate-pulse" />
          </div>
        </div>
        {/* Chart skeleton */}
        <div className="w-full rounded border border-gray-200 bg-white overflow-hidden" style={{ minHeight: 200 + 16 }}>
          <div className="p-4 space-y-3">
            {/* Grid lines skeleton */}
            <div className="space-y-4 pt-2">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className="h-2 w-8 bg-gray-200 rounded animate-pulse" />
                  <div className="h-px flex-1 bg-gray-100" />
                </div>
              ))}
            </div>
            {/* Line chart placeholder */}
            <div className="relative h-32 mt-4">
              <div className="absolute inset-0 bg-gradient-to-r from-gray-100 via-gray-200 to-gray-100 rounded animate-pulse" />
              <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
                <path
                  d="M0,80 Q50,60 100,70 T200,50 T300,65 T400,40"
                  fill="none"
                  stroke="#E5E7EB"
                  strokeWidth="2"
                  strokeDasharray="8 4"
                  className="animate-pulse"
                />
              </svg>
            </div>
          </div>
        </div>
        {/* Legend skeleton */}
        <div className="flex justify-center items-center gap-4 mt-3 py-2 border-t border-gray-100">
          <div className="flex items-center gap-1.5">
            <div className="h-3 w-5 bg-gray-200 rounded animate-pulse" />
            <div className="h-3 w-20 bg-gray-200 rounded animate-pulse" />
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-3 w-5 bg-gray-200 rounded border-2 border-dashed border-gray-300 animate-pulse" />
            <div className="h-3 w-24 bg-gray-200 rounded animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('flex flex-col min-w-0', className)}>
      <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-2 text-xs text-zinc-500 min-w-0">
          <span
            className="inline-flex cursor-help"
            title="Andamento prezzo e vendite nel periodo selezionato"
          >
            <Info className="h-4 w-4 shrink-0 text-zinc-400" aria-hidden />
          </span>
          <span className="font-medium truncate">{stats.rangeLabel}</span>
        </div>
        <div className="flex items-center gap-2">
          {/* Mini legenda accanto al selettore */}
          <div className="hidden sm:flex items-center gap-1.5 mr-1 shrink-0">
            <div className="flex items-center gap-1">
              <span className="inline-block h-1.5 w-2.5 rounded-sm" style={{ backgroundColor: BRAND_ORANGE }} aria-hidden />
              <span className="text-[9px] font-medium text-zinc-500 whitespace-nowrap">Prezzo</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="inline-block h-1.5 w-2.5 rounded-sm border border-dashed" style={{ borderColor: SALES_BLUE }} aria-hidden />
              <span className="text-[9px] font-medium whitespace-nowrap" style={{ color: SALES_BLUE }}>Vendite</span>
            </div>
          </div>
          <div className="inline-flex items-center rounded-lg border border-gray-200 bg-white p-0.5 shadow-sm">
            {([
              { value: '1d' as const, label: '1G' },
              { value: '7d' as const, label: '7G' },
              { value: '30d' as const, label: '30G' },
              { value: 'all' as const, label: 'Dall\'inizio' },
              { value: 'custom' as const, label: 'Date' },
            ]).map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setRangePreset(option.value)}
                className={cn(
                  'rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide transition-colors',
                  rangePreset === option.value
                    ? 'bg-orange-50 text-orange-700'
                    : 'text-gray-600 hover:bg-gray-100'
                )}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {rangePreset === 'custom' && (
        <div className="mb-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
          <label className="flex items-center gap-2 rounded-md border border-gray-200 bg-white px-2 py-1.5 text-xs text-gray-700">
            <span className="text-[10px] font-semibold uppercase tracking-wide text-gray-500">Da</span>
            <input
              type="date"
              value={customFrom}
              onChange={(e) => setCustomFrom(e.target.value)}
              className="w-full bg-transparent text-xs text-gray-800 outline-none"
            />
          </label>
          <label className="flex items-center gap-2 rounded-md border border-gray-200 bg-white px-2 py-1.5 text-xs text-gray-700">
            <span className="text-[10px] font-semibold uppercase tracking-wide text-gray-500">A</span>
            <input
              type="date"
              value={customTo}
              onChange={(e) => setCustomTo(e.target.value)}
              className="w-full bg-transparent text-xs text-gray-800 outline-none"
            />
          </label>
        </div>
      )}

      <div
        ref={containerRef}
        className="w-full overflow-hidden rounded-lg border border-gray-200 bg-white shadow-[0_2px_8px_rgba(0,0,0,0.06)]"
        style={{ minHeight: H + 16 }}
      >
        <svg
          width="100%"
          height={H}
          viewBox={`0 0 ${W} ${H}`}
          preserveAspectRatio="xMidYMid meet"
          className="block touch-none select-none"
          onMouseMove={onSvgMove}
          onMouseLeave={() => setHover(null)}
        >
          {/* Sfondo area grafico: grigio chiarissimo tipo Cardmarket (niente fill sotto linea) */}
          <rect x={pad.l} y={pad.t} width={iw} height={ih} fill="#F8FAFC" rx={4} />

          {/* Griglia orizzontale */}
          {yTicks.map((yv) => {
            const y = yScale(yv);
            return (
              <g key={`price-${yv}`}>
                <line x1={pad.l} y1={y} x2={W - pad.r} y2={y} stroke={GRID_COLOR} strokeWidth={1} />
                <text
                  x={pad.l - 8}
                  y={y + 4}
                  textAnchor="end"
                  className="text-[10px] fill-current"
                  style={{ fill: AXIS_TEXT }}
                >
                  {formatEuroShort(yv)}
                </text>
              </g>
            );
          })}

          {/* Asse Y destro - Vendite */}
          {yTicksSales.map((sv) => {
            const y = yScaleSales(sv);
            return (
              <g key={`sales-${sv}`}>
                <text
                  x={W - pad.r + 8}
                  y={y + 4}
                  textAnchor="start"
                  className="text-[9px] fill-current font-medium"
                  style={{ fill: SALES_BLUE }}
                >
                  {sv}
                </text>
              </g>
            );
          })}

          {/* Griglia verticale */}
          {timeMarkers.map((tx) => {
            if (tx < tMin || tx > tMax) return null;
            const x = xScale(tx);
            return (
              <line
                key={`grid-${tx}`}
                x1={x}
                y1={pad.t}
                x2={x}
                y2={pad.t + ih}
                stroke={GRID_COLOR}
                strokeWidth={1}
              />
            );
          })}

          {currentDayX != null && (
            <line
              x1={currentDayX}
              y1={pad.t}
              x2={currentDayX}
              y2={pad.t + ih}
              stroke="#0F172A"
              strokeWidth={1.2}
              opacity={0.45}
            />
          )}

          {showPriceLine && linePath ? (
            <path
              d={linePath}
              fill="none"
              stroke={BRAND_ORANGE}
              strokeWidth={2.8}
              strokeLinejoin="round"
              strokeLinecap="round"
            />
          ) : null}

          {showSalesLine && salesPath ? (
            <path
              d={salesPath}
              fill="none"
              stroke={SALES_BLUE}
              strokeWidth={2.2}
              strokeLinejoin="round"
              strokeLinecap="round"
              strokeDasharray="6 4"
            />
          ) : null}

          {dotIndices.map((i) => {
            const pt = visiblePoints[i];
            if (!pt) return null;
            const active = hover && Math.abs(hover.t - pt.t) < 86400000 * 8;
            return (
              <g key={`dots-${pt.t}-${i}`}>
                {showPriceLine && (
                  <circle
                    cx={xScale(pt.t)}
                    cy={yScale(pt.price)}
                    r={active ? 5 : 3.5}
                    fill="#fff"
                    stroke={BRAND_ORANGE}
                    strokeWidth={2}
                    className="pointer-events-none"
                  />
                )}
                {showSalesLine && (
                  <circle
                    cx={xScale(pt.t)}
                    cy={yScaleSales(pt.sales ?? 0)}
                    r={active ? 4 : 3}
                    fill="#fff"
                    stroke={SALES_BLUE}
                    strokeWidth={1.5}
                    className="pointer-events-none"
                  />
                )}
              </g>
            );
          })}

          {hover && (() => {
            const tw = 120;
            const th = 54;
            let tx = hover.x - tw / 2;
            tx = Math.max(pad.l + 4, Math.min(tx, W - pad.r - tw - 4));
            const ty = Math.max(pad.t + 4, hover.y - th - 14);
            return (
              <>
                <line
                  x1={hover.x}
                  y1={pad.t}
                  x2={hover.x}
                  y2={pad.t + ih}
                  stroke="#111827"
                  strokeWidth={1.25}
                  strokeDasharray="4 2"
                  opacity={0.65}
                />
                <g transform={`translate(${tx}, ${ty})`}>
                  <rect width={tw} height={th} rx={6} fill="#2a2a2a" opacity={0.96} />
                  <text x={tw / 2} y={14} textAnchor="middle" fill="#fff" className="text-[10px] font-medium">
                    {formatDateIt(hover.t)}
                  </text>
                  <text x={tw / 2} y={30} textAnchor="middle" fill={BRAND_ORANGE} className="text-[11px] font-bold">
                    {formatEuroShort(hover.price)}
                  </text>
                  <text x={tw / 2} y={46} textAnchor="middle" fill={SALES_BLUE} className="text-[10px] font-semibold">
                    {hover.sales} carte vendute
                  </text>
                </g>
              </>
            );
          })()}

          {/* Asse X etichette */}
          {timeMarkers.map((tx) => {
            if (tx < tMin || tx > tMax) return null;
            const x = xScale(tx);
            return (
              <text
                key={`xl-${tx}`}
                x={x}
                y={H - 10}
                textAnchor="middle"
                className="text-[9px] fill-current"
                style={{ fill: AXIS_TEXT }}
                transform={`rotate(-40 ${x} ${H - 10})`}
              >
                {formatDateIt(tx)}
              </text>
            );
          })}
        </svg>
      </div>

      {/* Toggle linee - solo su mobile, nascosto su desktop dove c'è la mini legenda */}
      <div className="flex sm:hidden justify-center items-center gap-2 mt-2">
        <button
          type="button"
          onClick={() => setShowPriceLine((v) => !v)}
          className={cn(
            "flex items-center gap-1 px-2 py-1 rounded-md border text-[10px] font-medium transition-colors",
            showPriceLine
              ? "border-orange-200 bg-orange-50 text-orange-700"
              : "border-gray-200 bg-gray-50 text-gray-400 line-through"
          )}
        >
          {showPriceLine ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
          <span className="inline-block h-2 w-3 rounded-sm shrink-0" style={{ backgroundColor: BRAND_ORANGE }} aria-hidden />
          Prezzo
        </button>
        <button
          type="button"
          onClick={() => setShowSalesLine((v) => !v)}
          className={cn(
            "flex items-center gap-1 px-2 py-1 rounded-md border text-[10px] font-medium transition-colors",
            showSalesLine
              ? "border-blue-200 bg-blue-50 text-blue-700"
              : "border-gray-200 bg-gray-50 text-gray-400 line-through"
          )}
        >
          {showSalesLine ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
          <span className="inline-block h-2 w-3 rounded-sm shrink-0 border border-dashed" style={{ borderColor: SALES_BLUE }} aria-hidden />
          Vendite
        </button>
      </div>
    </div>
  );
}
