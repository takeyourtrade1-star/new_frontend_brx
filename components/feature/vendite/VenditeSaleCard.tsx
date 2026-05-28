'use client';

import {
  CheckCircle2,
  Clock,
  Package,
  Sparkles,
  Truck,
  User,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  getStatoMeta,
  type VenditaMock,
  type VenditaStato,
} from './venditeMockData';

function formatPrice(price: number): string {
  return new Intl.NumberFormat('it-IT', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: price % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(price);
}

function formatDateTime(iso: string): string {
  try {
    return new Date(iso).toLocaleString('it-IT', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

const STATO_VISUAL: Record<
  VenditaStato,
  { icon: typeof Clock; pill: string; accent: string }
> = {
  'in-attesa-pagamento': {
    icon: Clock,
    pill: 'bg-amber-50/90 text-amber-800 ring-amber-200/80',
    accent: 'from-amber-400/20 to-orange-300/10',
  },
  'da-spedire': {
    icon: Package,
    pill: 'bg-[#FF7300]/10 text-[#c45a00] ring-[#FF7300]/25',
    accent: 'from-[#FF7300]/15 to-amber-200/10',
  },
  spedito: {
    icon: Truck,
    pill: 'bg-blue-50/90 text-blue-800 ring-blue-200/80',
    accent: 'from-blue-400/15 to-sky-300/10',
  },
  completato: {
    icon: CheckCircle2,
    pill: 'bg-emerald-50/90 text-emerald-800 ring-emerald-200/80',
    accent: 'from-emerald-400/15 to-teal-300/10',
  },
};

const CHANNEL_LABEL = {
  marketplace: 'Marketplace',
  asta: 'Asta',
} as const;

type VenditeSaleCardProps = {
  vendita: VenditaMock;
  showStatoBadge?: boolean;
};

export function VenditeSaleCard({ vendita, showStatoBadge = false }: VenditeSaleCardProps) {
  const statoMeta = getStatoMeta(vendita.stato);
  const visual = STATO_VISUAL[vendita.stato];
  const StatoIcon = visual.icon;

  return (
    <article
      className={cn(
        'group relative overflow-hidden rounded-[1.25rem] border border-white/70',
        'bg-white/60 p-4 shadow-[0_4px_24px_rgba(15,23,42,0.06)] backdrop-blur-xl',
        'transition duration-200 hover:border-white hover:bg-white/75 hover:shadow-[0_8px_32px_rgba(15,23,42,0.08)]',
        'sm:p-5',
      )}
    >
      <div
        className={cn(
          'pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-gradient-to-br opacity-80 blur-2xl',
          visual.accent,
        )}
        aria-hidden
      />

      <div className="relative flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 flex-1 gap-3.5 sm:gap-4">
          <div
            className={cn(
              'relative flex h-[4.5rem] w-[3.25rem] shrink-0 flex-col items-center justify-end overflow-hidden rounded-xl',
              'border border-white/80 bg-gradient-to-br shadow-inner ring-1 ring-black/[0.04]',
              visual.accent,
            )}
          >
            <div className="absolute inset-0 bg-[#1D3160]/[0.04]" aria-hidden />
            <Sparkles className="absolute left-1.5 top-1.5 h-3 w-3 text-[#FF7300]/70" aria-hidden />
            <span className="relative z-[1] mb-1.5 px-1 text-center text-[8px] font-bold uppercase leading-tight tracking-wide text-[#1D3160]/80">
              {vendita.language}
            </span>
          </div>

          <div className="min-w-0 flex-1">
            <div className="mb-1.5 flex flex-wrap items-center gap-2">
              <span className="text-[10px] font-semibold uppercase tracking-wide text-[#86868B]">
                {CHANNEL_LABEL[vendita.channel]} · {vendita.orderId}
              </span>
              {showStatoBadge && (
                <span
                  className={cn(
                    'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ring-1',
                    visual.pill,
                  )}
                >
                  <StatoIcon className="h-3 w-3" aria-hidden />
                  {statoMeta.shortLabel}
                </span>
              )}
            </div>

            <h3 className="truncate text-[1.05rem] font-semibold leading-snug text-[#1D1D1F] sm:text-lg">
              {vendita.itemName}
            </h3>
            <p className="mt-0.5 truncate text-[13px] text-[#6E6E73]">
              {vendita.setName} · {vendita.condition}
            </p>

            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[13px] text-[#6E6E73]">
              <span className="inline-flex items-center gap-1.5">
                <User className="h-3.5 w-3.5 shrink-0 text-[#86868B]" aria-hidden />
                <span className="text-[#86868B]">Acquirente</span>
                <span className="font-semibold text-[#1D1D1F]">@{vendita.buyerUsername}</span>
              </span>
              <span className="text-[#AEAEB2]">·</span>
              <time dateTime={vendita.soldAt} className="tabular-nums">
                {formatDateTime(vendita.soldAt)}
              </time>
            </div>

            {vendita.trackingCode && (
              <p className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-white/50 px-2.5 py-1 text-[12px] text-[#6E6E73] ring-1 ring-slate-200/60">
                <Truck className="h-3.5 w-3.5 text-blue-600" aria-hidden />
                Tracking{' '}
                <span className="font-mono text-[11px] font-medium text-[#1D1D1F]">
                  {vendita.trackingCode}
                </span>
              </p>
            )}
          </div>
        </div>

        <div className="flex shrink-0 flex-row items-center justify-between gap-3 border-t border-white/50 pt-3 sm:flex-col sm:items-end sm:border-t-0 sm:pt-0">
          {!showStatoBadge && (
            <span
              className={cn(
                'inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ring-1 sm:order-2',
                visual.pill,
              )}
            >
              <StatoIcon className="h-3 w-3" aria-hidden />
              {statoMeta.label}
            </span>
          )}
          <div className="text-left sm:text-right sm:order-1">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-[#86868B]">
              Importo vendita
            </p>
            <p className="text-2xl font-semibold tabular-nums tracking-tight text-[#1D1D1F]">
              {formatPrice(vendita.price)}
            </p>
          </div>
        </div>
      </div>
    </article>
  );
}
