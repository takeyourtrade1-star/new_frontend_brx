'use client';

import { useMemo, useState, useCallback, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

const BRAND_ORANGE = '#FF7300';
const GRID_COLOR = '#E8E8E8';
const AXIS_TEXT = '#5C5C5C';

const MONTHS_VISIBLE = 4;
/** Max punti evidenziati sulla linea (Cardmarket: pochi marker) */
const MAX_VISIBLE_DOTS = 12;

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
export function buildPriceHistoryPoints(slug: string): { t: number; price: number }[] {
  const seed = hashSlug(slug || 'default');
  const end = new Date();
  end.setHours(12, 0, 0, 0);
  const start = new Date(end);
  start.setMonth(start.getMonth() - 38);
  const daysTotal = Math.ceil((end.getTime() - start.getTime()) / 86400000);
  const step = 12;
  const out: { t: number; price: number }[] = [];
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
    out.push({ t, price: Math.round(price * 100) / 100 });
  }
  out.push({ t: end.getTime(), price: out[out.length - 1]?.price ?? 18 });
  return out;
}

function startOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1, 0, 0, 0, 0);
}

function endOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);
}

function addMonths(d: Date, n: number): Date {
  const x = new Date(d);
  x.setMonth(x.getMonth() + n);
  return x;
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

export function ProductPriceChart({
  slug,
  className,
}: {
  slug: string;
  className?: string;
}) {
  const allPoints = useMemo(() => buildPriceHistoryPoints(slug), [slug]);
  const dataStart = useMemo(() => {
    const t0 = allPoints[0]?.t ?? Date.now();
    return startOfMonth(new Date(t0));
  }, [allPoints]);
  const dataEndMonth = useMemo(() => {
    const t1 = allPoints[allPoints.length - 1]?.t ?? Date.now();
    return startOfMonth(new Date(t1));
  }, [allPoints]);

  /** Ultimo mese della finestra visibile (4 mesi). */
  const [endMonth, setEndMonth] = useState<Date>(() => dataEndMonth);

  useEffect(() => {
    setEndMonth(dataEndMonth);
  }, [dataEndMonth]);

  const windowStart = useMemo(() => addMonths(startOfMonth(endMonth), -(MONTHS_VISIBLE - 1)), [endMonth]);
  const windowEnd = useMemo(() => endOfMonth(endMonth), [endMonth]);

  const visiblePoints = useMemo(() => {
    const ws = windowStart.getTime();
    const we = windowEnd.getTime();
    const inWin = allPoints.filter((p) => p.t >= ws && p.t <= we);
    if (inWin.length >= 2) return inWin;
    const near = allPoints.filter((p) => p.t <= we).slice(-24);
    return near.length >= 2 ? near : allPoints.slice(-24);
  }, [allPoints, windowStart, windowEnd]);

  const oldestEndMonth = useMemo(() => addMonths(dataStart, MONTHS_VISIBLE - 1), [dataStart]);

  const canGoOlder = useMemo(
    () => endMonth.getTime() > oldestEndMonth.getTime(),
    [endMonth, oldestEndMonth]
  );

  const canGoNewer = useMemo(() => {
    const next = addMonths(endMonth, 1);
    return next.getTime() <= dataEndMonth.getTime();
  }, [endMonth, dataEndMonth]);

  const goOlder = useCallback(() => {
    if (canGoOlder) setEndMonth((m) => addMonths(m, -1));
  }, [canGoOlder]);

  const goNewer = useCallback(() => {
    if (canGoNewer) setEndMonth((m) => addMonths(m, 1));
  }, [canGoNewer]);

  const { minP, maxP, yTicks } = useMemo(() => {
    const prices = visiblePoints.map((p) => p.price);
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    const ticks = niceYSteps(min, max);
    return { minP: ticks[0] ?? min, maxP: ticks[ticks.length - 1] ?? max, yTicks: ticks };
  }, [visiblePoints]);

  const tMin = windowStart.getTime();
  const tMax = windowEnd.getTime();

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

  const pad = { t: 8, r: 12, b: 40, l: 48 };
  const H = 220;
  const W = cw;
  const iw = W - pad.l - pad.r;
  const ih = H - pad.t - pad.b;

  const xScale = useCallback((t: number) => pad.l + ((t - tMin) / Math.max(tMax - tMin, 1)) * iw, [tMin, tMax, iw, pad.l]);
  const yScale = useCallback(
    (p: number) => pad.t + ih - ((p - minP) / Math.max(maxP - minP, 0.0001)) * ih,
    [minP, maxP, ih, pad.t]
  );

  const linePath = useMemo(() => {
    if (visiblePoints.length < 2) return '';
    return visiblePoints
      .map((pt, i) => `${i === 0 ? 'M' : 'L'} ${xScale(pt.t).toFixed(2)} ${yScale(pt.price).toFixed(2)}`)
      .join(' ');
  }, [visiblePoints, xScale, yScale]);

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

  const monthMarkers = useMemo(() => {
    const markers: Date[] = [];
    let d = new Date(windowStart);
    while (d <= windowEnd) {
      markers.push(new Date(d));
      d = addMonths(d, 1);
    }
    return markers;
  }, [windowStart, windowEnd]);

  const [hover, setHover] = useState<{ x: number; y: number; t: number; price: number } | null>(null);

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
      });
    },
    [W, pad.l, pad.r, iw, tMin, tMax, visiblePoints, xScale, yScale]
  );

  return (
    <div className={cn('flex flex-col min-w-0', className)}>
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-1.5 text-xs text-gray-600">
          <Info className="h-3.5 w-3.5 shrink-0" style={{ color: BRAND_ORANGE }} aria-hidden />
          <span className="font-medium">Info.</span>
        </div>
        <div className="flex items-center gap-0.5 rounded border border-gray-200 bg-white shadow-sm">
          <button
            type="button"
            onClick={goOlder}
            disabled={!canGoOlder}
            className="p-1.5 text-gray-700 hover:bg-gray-50 disabled:opacity-35 disabled:pointer-events-none transition-colors"
            aria-label="Periodo precedente"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="px-2 text-[10px] font-semibold uppercase tracking-wide text-gray-500 border-x border-gray-100 max-w-[140px] sm:max-w-none truncate text-center">
            {formatDateIt(windowStart.getTime())} – {formatDateIt(windowEnd.getTime())}
          </span>
          <button
            type="button"
            onClick={goNewer}
            disabled={!canGoNewer}
            className="p-1.5 text-gray-700 hover:bg-gray-50 disabled:opacity-35 disabled:pointer-events-none transition-colors"
            aria-label="Periodo successivo"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div
        ref={containerRef}
        className="w-full rounded border border-gray-200 bg-white overflow-hidden"
        style={{ minHeight: H + 24 }}
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
          <rect x={pad.l} y={pad.t} width={iw} height={ih} fill="#FAFAFA" rx={2} />

          {/* Griglia orizzontale */}
          {yTicks.map((yv) => {
            const y = yScale(yv);
            return (
              <g key={yv}>
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

          {/* Griglia verticale (inizio mese) */}
          {monthMarkers.map((md) => {
            const tx = md.getTime();
            if (tx < tMin || tx > tMax) return null;
            const x = xScale(tx);
            return (
              <line
                key={md.toISOString()}
                x1={x}
                y1={pad.t}
                x2={x}
                y2={pad.t + ih}
                stroke={GRID_COLOR}
                strokeWidth={1}
              />
            );
          })}

          {linePath ? (
            <path
              d={linePath}
              fill="none"
              stroke={BRAND_ORANGE}
              strokeWidth={2.25}
              strokeLinejoin="round"
              strokeLinecap="round"
            />
          ) : null}

          {dotIndices.map((i) => {
            const pt = visiblePoints[i];
            if (!pt) return null;
            const active = hover && Math.abs(hover.t - pt.t) < 86400000 * 8;
            return (
              <circle
                key={`dot-${pt.t}-${i}`}
                cx={xScale(pt.t)}
                cy={yScale(pt.price)}
                r={active ? 5 : 3.5}
                fill="#fff"
                stroke={BRAND_ORANGE}
                strokeWidth={2}
                className="pointer-events-none"
              />
            );
          })}

          {hover && (() => {
            const tw = 108;
            const th = 40;
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
                  stroke={BRAND_ORANGE}
                  strokeWidth={1}
                  strokeDasharray="4 3"
                  opacity={0.45}
                />
                <g transform={`translate(${tx}, ${ty})`}>
                  <rect width={tw} height={th} rx={6} fill="#2a2a2a" opacity={0.96} />
                  <text x={tw / 2} y={16} textAnchor="middle" fill="#fff" className="text-[10px] font-medium">
                    {formatDateIt(hover.t)}
                  </text>
                  <text x={tw / 2} y={32} textAnchor="middle" fill="#fff" className="text-[11px] font-bold">
                    {formatEuroShort(hover.price)}
                  </text>
                </g>
              </>
            );
          })()}

          {/* Asse X etichette */}
          {monthMarkers.map((md) => {
            const mid = new Date(md.getFullYear(), md.getMonth(), 15).getTime();
            if (mid < tMin || mid > tMax) return null;
            const x = xScale(mid);
            return (
              <text
                key={`xl-${md.toISOString()}`}
                x={x}
                y={H - 10}
                textAnchor="middle"
                className="text-[9px] fill-current"
                style={{ fill: AXIS_TEXT }}
                transform={`rotate(-40 ${x} ${H - 10})`}
              >
                {formatDateIt(mid)}
              </text>
            );
          })}
        </svg>
      </div>

      <div className="flex justify-center items-center gap-2 mt-3 py-2 border-t border-gray-100">
        <span className="inline-block h-3 w-5 rounded-sm shrink-0" style={{ backgroundColor: BRAND_ORANGE }} aria-hidden />
        <span className="text-xs font-medium text-gray-800">Prezzo medio di vendita</span>
      </div>
    </div>
  );
}
