'use client';

import { Clock, Package, Truck, CheckCircle2, User, Mail } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { VenditaMock } from './venditeMockData';

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
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

const STATUS_BADGES: Record<VenditaMock['stato'], { label: string; cls: string; Icon: typeof Clock }> = {
  'in-attesa-pagamento': {
    label: 'IN ATTESA',
    cls: 'bg-amber-100 text-amber-800',
    Icon: Clock,
  },
  'da-spedire': {
    label: 'DA SPEDIRE',
    cls: 'bg-[#FF7300]/10 text-[#c45a00]',
    Icon: Package,
  },
  spedito: {
    label: 'SPEDITO',
    cls: 'bg-blue-100 text-blue-800',
    Icon: Truck,
  },
  completato: {
    label: 'COMPLETATO',
    cls: 'bg-emerald-100 text-emerald-800',
    Icon: CheckCircle2,
  },
};

const CATEGORY_BADGES: Record<VenditaMock['category'], { label: string; cls: string }> = {
  asta: { label: 'ASTA', cls: 'bg-purple-100 text-purple-700' },
  marketplace: { label: 'MARKETPLACE', cls: 'bg-sky-100 text-sky-700' },
  demo: { label: 'DEMO', cls: 'bg-gray-100 text-gray-700' },
};

type VenditeSaleCardProps = {
  vendita: VenditaMock;
  showStatoBadge?: boolean;
};

export function VenditeSaleCard({ vendita, showStatoBadge = false }: VenditeSaleCardProps) {
  const badge = STATUS_BADGES[vendita.stato];
  const catBadge = CATEGORY_BADGES[vendita.category];
  const StatusIcon = badge.Icon;

  return (
    <article className="flex flex-col gap-4 border border-gray-200 bg-white p-5 sm:flex-row sm:items-start sm:justify-between">
      <div className="flex-1 space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={cn(
              'inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide',
              badge.cls,
            )}
          >
            <StatusIcon className="h-3.5 w-3.5" aria-hidden />
            {badge.label}
          </span>
          <span className="text-xs text-gray-500">Ordine {vendita.orderId}</span>
          <span className={cn('inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide', catBadge.cls)}>
            {catBadge.label}
          </span>
        </div>

        <h3 className="text-lg font-semibold text-gray-900">
          {vendita.itemName}
        </h3>

        <p className="text-sm text-gray-600">
          {vendita.setName} · {vendita.condition}
        </p>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-600">
          <span className="flex items-center gap-1">
            <User className="h-4 w-4" aria-hidden />
            Acquirente: <strong className="text-gray-800">@{vendita.buyerUsername}</strong>
          </span>
          <span className="flex items-center gap-1">
            <Mail className="h-4 w-4" aria-hidden />
            {vendita.language}
          </span>
          <span className="text-xs text-gray-500">
            {formatDateTime(vendita.soldAt)}
          </span>
        </div>

        {vendita.trackingCode && (
          <p className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-white/50 px-2.5 py-1 text-xs text-gray-600 ring-1 ring-gray-200">
            <Truck className="h-3.5 w-3.5 text-blue-600" aria-hidden />
            Tracking{' '}
            <span className="font-mono text-[11px] font-medium text-gray-900">
              {vendita.trackingCode}
            </span>
          </p>
        )}
      </div>

      <div className="flex flex-col items-stretch gap-2 sm:items-end">
        <div className="text-right">
          <div className="text-xs uppercase tracking-wide text-gray-500">Importo</div>
          <div className="text-2xl font-bold text-gray-900">
            {formatPrice(vendita.price)}
          </div>
        </div>
      </div>
    </article>
  );
}
