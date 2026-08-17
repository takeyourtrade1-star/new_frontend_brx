'use client';

import { useId, useState } from 'react';
import { Info, Scale, Sparkles } from 'lucide-react';
import { useIntlLocale } from '@/lib/i18n/useIntlLocale';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { cn } from '@/lib/utils';

const MAX_TILT_DEG = 17;

export type TradeBalanceDirection = 'empty' | 'balanced' | 'offered' | 'requested';

export interface TradeBalanceSummary {
  direction: TradeBalanceDirection;
  differenceCents: number;
  differencePercent: number;
  tiltDeg: number;
}

export function getTradeBalanceSummary(
  offeredCents: number,
  requestedCents: number,
): TradeBalanceSummary {
  const safeOffered = Math.max(0, offeredCents);
  const safeRequested = Math.max(0, requestedCents);
  const maximum = Math.max(safeOffered, safeRequested);
  if (maximum === 0) {
    return { direction: 'empty', differenceCents: 0, differencePercent: 0, tiltDeg: 0 };
  }

  const signedDifference = safeRequested - safeOffered;
  const differenceCents = Math.abs(signedDifference);
  const differencePercent = differenceCents / maximum;
  const direction: TradeBalanceDirection = differencePercent <= 0.05
    ? 'balanced'
    : signedDifference > 0
      ? 'requested'
      : 'offered';
  const tiltDeg = Math.max(-1, Math.min(1, signedDifference / maximum)) * MAX_TILT_DEG;
  return { direction, differenceCents, differencePercent, tiltDeg };
}

function coinCount(cents: number): number {
  if (cents <= 0) return 0;
  if (cents < 1_000) return 1;
  if (cents < 3_000) return 2;
  return 3;
}

function CoinStack({ count }: { count: number }) {
  return (
    <g>
      {Array.from({ length: count }, (_, index) => (
        <g key={index} transform={`translate(0 ${-index * 2.2})`}>
          <ellipse cx="0" cy="10" rx="4.3" ry="1.65" fill="#9A5C08" />
          <ellipse cx="0" cy="9.1" rx="4.3" ry="1.65" fill="#F8C34D" stroke="#FFE4A0" strokeWidth="0.45" />
        </g>
      ))}
    </g>
  );
}

function ScalePan({ x, coins, counterTilt, panGradientId }: {
  x: number;
  coins: number;
  counterTilt: number;
  panGradientId: string;
}) {
  return (
    <g transform={`translate(${x} 22)`}>
      <g
        style={{
          transform: `rotate(${counterTilt}deg)`,
          transformOrigin: '0px 0px',
          transformBox: 'view-box',
          transition: 'transform 700ms cubic-bezier(.22,1.2,.36,1)',
        }}
      >
        <line x1="0" y1="0" x2="-8" y2="12" stroke="#D9E0EA" strokeWidth="1" />
        <line x1="0" y1="0" x2="8" y2="12" stroke="#D9E0EA" strokeWidth="1" />
        <path d="M-10 12 C-8 20 8 20 10 12 C5 14 -5 14 -10 12Z" fill={`url(#${panGradientId})`} stroke="#FFD09D" strokeWidth="0.7" />
        <CoinStack count={coins} />
      </g>
    </g>
  );
}

function AnimatedScale({ offeredCents, requestedCents, tiltDeg }: {
  offeredCents: number;
  requestedCents: number;
  tiltDeg: number;
}) {
  const id = useId().replace(/:/g, '');
  const panGradientId = `trade-pan-${id}`;
  const beamGradientId = `trade-beam-${id}`;

  return (
    <svg viewBox="0 0 84 68" className="h-14 w-[4.5rem] overflow-visible" fill="none" aria-hidden>
      <defs>
        <linearGradient id={panGradientId} x1="0" y1="0" x2="0" y2="1">
          <stop stopColor="#FFAE63" />
          <stop offset="1" stopColor="#E86100" />
        </linearGradient>
        <linearGradient id={beamGradientId} x1="0" y1="0" x2="0" y2="1">
          <stop stopColor="#FFF2D9" />
          <stop offset="0.45" stopColor="#E7B76B" />
          <stop offset="1" stopColor="#8D5C21" />
        </linearGradient>
      </defs>
      <ellipse cx="42" cy="64" rx="22" ry="2.5" fill="#000" opacity="0.2" />
      <path d="M30 61 H54 L50 55 H34Z" fill={`url(#${beamGradientId})`} />
      <rect x="39.5" y="22" width="5" height="35" rx="2.5" fill={`url(#${beamGradientId})`} />
      <g
        style={{
          transform: `rotate(${tiltDeg}deg)`,
          transformOrigin: '42px 22px',
          transformBox: 'view-box',
          transition: 'transform 700ms cubic-bezier(.22,1.2,.36,1)',
        }}
      >
        <rect x="15" y="20" width="54" height="4" rx="2" fill={`url(#${beamGradientId})`} />
        <circle cx="15" cy="22" r="2.3" fill="#FFF2D9" />
        <circle cx="69" cy="22" r="2.3" fill="#FFF2D9" />
        <ScalePan x={15} coins={coinCount(offeredCents)} counterTilt={-tiltDeg} panGradientId={panGradientId} />
        <ScalePan x={69} coins={coinCount(requestedCents)} counterTilt={-tiltDeg} panGradientId={panGradientId} />
      </g>
      <circle cx="42" cy="22" r="6.5" fill="#FF7300" opacity="0.22" className="motion-safe:animate-pulse" />
      <circle cx="42" cy="22" r="3.4" fill="#FFF7ED" stroke="#FF8A26" strokeWidth="1.4" />
    </svg>
  );
}

export function TradeBalanceIndicator({
  offeredCents,
  requestedCents,
  otherName,
  className,
}: {
  offeredCents: number;
  requestedCents: number;
  otherName: string;
  className?: string;
}) {
  const { t } = useTranslation();
  const locale = useIntlLocale();
  const [open, setOpen] = useState(false);
  const summary = getTradeBalanceSummary(offeredCents, requestedCents);
  const difference = new Intl.NumberFormat(locale, { style: 'currency', currency: 'EUR' })
    .format(summary.differenceCents / 100);
  const message = summary.direction === 'empty'
    ? t('trades.balance.empty')
    : summary.direction === 'balanced'
      ? t('trades.balance.balanced')
      : summary.direction === 'offered'
        ? t('trades.balance.offeredHeavy', { amount: difference })
        : t('trades.balance.requestedHeavy', { user: otherName, amount: difference });

  return (
    <div className={cn('relative z-30 flex flex-col items-center', className)}>
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-expanded={open}
        aria-label={t('trades.balance.open')}
        className={cn(
          'group relative rounded-2xl border bg-[#071E22]/88 px-2 py-0.5 shadow-[0_10px_28px_rgba(0,0,0,.32)] backdrop-blur-md outline-none transition-all hover:-translate-y-0.5 hover:border-orange-200/55 focus-visible:ring-2 focus-visible:ring-orange-200/70 motion-reduce:transform-none',
          summary.direction === 'balanced' ? 'border-emerald-200/45' : 'border-white/20',
        )}
      >
        <AnimatedScale offeredCents={offeredCents} requestedCents={requestedCents} tiltDeg={summary.tiltDeg} />
        <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full border border-white/20 bg-[#FF7300] text-white shadow-md">
          {summary.direction === 'balanced'
            ? <Sparkles className="h-3 w-3" aria-hidden />
            : <Info className="h-3 w-3" aria-hidden />}
        </span>
      </button>

      {open && (
        <div className="absolute top-full mt-2 w-64 rounded-2xl border border-white/15 bg-[#08162E]/95 p-3 text-center text-white shadow-[0_18px_45px_rgba(0,0,0,.42)] backdrop-blur-xl" role="status">
          <div className="flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-[0.16em] text-[#FFB477]">
            <Scale className="h-3.5 w-3.5" aria-hidden /> {t('trades.balance.title')}
          </div>
          <p className="mt-1.5 text-xs font-semibold leading-relaxed text-white/75">{message}</p>
        </div>
      )}
    </div>
  );
}
