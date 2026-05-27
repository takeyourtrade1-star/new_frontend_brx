'use client';

import {
  CheckCircle2,
  Clock,
  Copy,
  Package,
  Truck,
  User,
} from 'lucide-react';
import { cn, formatEuroNoSpace } from '@/lib/utils';
import type { MockVendita, VenditaStato } from './venditeMockData';

const STATO_META: Record<
  VenditaStato,
  { label: string; pill: string; icon: typeof Clock }
> = {
  'in-attesa-pagamento': {
    label: 'In attesa di pagamento',
    pill: 'bg-amber-50/90 text-amber-800 ring-amber-200/80',
    icon: Clock,
  },
  'da-spedire': {
    label: 'Da spedire',
    pill: 'bg-[#FF7300]/10 text-[#c45a00] ring-[#FF7300]/25',
    icon: Package,
  },
  spedito: {
    label: 'Spedito',
    pill: 'bg-blue-50/90 text-blue-800 ring-blue-200/80',
    icon: Truck,
  },
  completato: {
    label: 'Completato',
    pill: 'bg-emerald-50/90 text-emerald-800 ring-emerald-200/80',
    icon: CheckCircle2,
  },
};

type VenditeSaleCardProps = {
  vendita: MockVendita;
  showStatoBadge?: boolean;
};

export function VenditeSaleCard({ vendita, showStatoBadge = false }: VenditeSaleCardProps) {
  const meta = STATO_META[vendita.stato];
  const StatoIcon = meta.icon;

  return (
    <article
      className="group relative overflow-hidden rounded-[1.25rem] border border-white/70 bg-white/60 shadow-[0_4px_24px_rgba(15,23,42,0.06)] backdrop-blur-2xl backdrop-saturate-150 transition duration-300 hover:border-white/90 hover:bg-white/75 hover:shadow-[0_12px_40px_rgba(15,23,42,0.08)]"
      aria-label={`Vendita ${vendita.orderId}`}
    >
      <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-stretch sm:gap-5 sm:p-5">
        <div
          className="flex h-20 w-full shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200/80 text-lg font-semibold text-slate-500 ring-1 ring-black/[0.04] sm:h-auto sm:w-24"
          aria-hidden
        >
          {vendita.buyerInitials}
        </div>

        <div className="min-w-0 flex-1 space-y-3">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="min-w-0 space-y-1">
              <p className="font-mono text-[11px] font-medium uppercase tracking-wider text-[#86868B]">
                {vendita.orderId}
              </p>
              <h3 className="text-[15px] font-semibold leading-snug tracking-tight text-[#1D1D1F] sm:text-base">
                {vendita.itemName}
              </h3>
              <p className="text-[13px] text-[#6E6E73]">{vendita.category}</p>
            </div>
            <p className="shrink-0 text-lg font-semibold tabular-nums tracking-tight text-[#1D1D1F]">
              {formatEuroNoSpace(vendita.price)}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[13px] text-[#6E6E73]">
            <span className="inline-flex items-center gap-1.5">
              <User className="h-3.5 w-3.5 shrink-0 text-[#86868B]" aria-hidden />
              <span>
                Acquirente{' '}
                <span className="font-medium text-[#1D1D1F]">@{vendita.buyerUsername}</span>
              </span>
            </span>
            <span className="hidden h-3 w-px bg-slate-200 sm:inline" aria-hidden />
            <time dateTime={vendita.sortDate}>{vendita.date}</time>
          </div>

          {(showStatoBadge || vendita.paymentDue || vendita.trackingCode || vendita.deliveredAt) && (
            <div className="flex flex-wrap items-center gap-2 pt-0.5">
              {showStatoBadge && (
                <span
                  className={cn(
                    'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1',
                    meta.pill,
                  )}
                >
                  <StatoIcon className="h-3 w-3" aria-hidden />
                  {meta.label}
                </span>
              )}
              {vendita.paymentDue && (
                <span className="rounded-full bg-amber-50/80 px-2.5 py-1 text-[11px] font-medium text-amber-900 ring-1 ring-amber-200/60">
                  Scadenza pagamento: {vendita.paymentDue}
                </span>
              )}
              {vendita.trackingCode && (
                <span className="inline-flex items-center gap-1 rounded-full bg-blue-50/80 px-2.5 py-1 font-mono text-[11px] font-medium text-blue-900 ring-1 ring-blue-200/60">
                  <Truck className="h-3 w-3" aria-hidden />
                  {vendita.trackingCode}
                  <button
                    type="button"
                    className="ml-0.5 rounded p-0.5 text-blue-700/70 transition hover:bg-blue-100 hover:text-blue-900"
                    aria-label={`Copia tracking ${vendita.trackingCode}`}
                    onClick={() => void navigator.clipboard?.writeText(vendita.trackingCode ?? '')}
                  >
                    <Copy className="h-3 w-3" />
                  </button>
                </span>
              )}
              {vendita.deliveredAt && (
                <span className="rounded-full bg-emerald-50/80 px-2.5 py-1 text-[11px] font-medium text-emerald-900 ring-1 ring-emerald-200/60">
                  Consegnato il {vendita.deliveredAt}
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </article>
  );
}
