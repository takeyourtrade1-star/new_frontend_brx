'use client';

import { Clock, Package, Truck, CheckCircle2, User, Mail } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ExpandableCard } from '@/components/shared/ExpandableCard';
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
    label: 'In attesa',
    cls: 'bg-amber-50 text-amber-700',
    Icon: Clock,
  },
  'da-spedire': {
    label: 'Da spedire',
    cls: 'bg-orange-50 text-orange-700',
    Icon: Package,
  },
  spedito: {
    label: 'Spedito',
    cls: 'bg-blue-50 text-blue-700',
    Icon: Truck,
  },
  completato: {
    label: 'Completato',
    cls: 'bg-emerald-50 text-emerald-700',
    Icon: CheckCircle2,
  },
};

const CATEGORY_BADGES: Record<VenditaMock['category'], { label: string; cls: string }> = {
  asta: { label: 'Asta', cls: 'bg-gray-50 text-gray-500 border border-gray-200' },
  marketplace: { label: 'Marketplace', cls: 'bg-gray-50 text-gray-500 border border-gray-200' },
  demo: { label: 'Demo', cls: 'bg-white text-gray-400 border border-gray-200' },
};

type VenditeSaleCardProps = {
  vendita: VenditaMock;
  showStatoBadge?: boolean;
};

export function VenditeSaleCard({ vendita, showStatoBadge = false }: VenditeSaleCardProps) {
  const badge = STATUS_BADGES[vendita.stato];
  const catBadge = CATEGORY_BADGES[vendita.category];
  const StatusIcon = badge.Icon;

  const summary = (
    <div className="flex items-start gap-3">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#F5F4F0] text-[#FF7300]">
        <Package className="h-5 w-5" aria-hidden />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-sm font-semibold text-gray-900 truncate">{vendita.itemName}</h3>
          <span className="text-sm font-bold text-gray-900 shrink-0">{formatPrice(vendita.price)}</span>
        </div>
        <div className="mt-0.5 flex items-center gap-1 text-xs text-gray-600">
          <User className="h-3.5 w-3.5" aria-hidden />
          <span className="font-medium text-gray-800">@{vendita.buyerUsername}</span>
        </div>
        <div className="mt-1.5 flex flex-wrap items-center justify-between gap-2">
          <span
            className={cn(
              'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold',
              badge.cls,
            )}
          >
            <StatusIcon className="h-3 w-3" aria-hidden />
            {badge.label}
          </span>
          <span className={cn('inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium', catBadge.cls)}>
            {catBadge.label}
          </span>
        </div>
      </div>
    </div>
  );

  const details = (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-600">
        <span className="flex items-center gap-1">
          <Mail className="h-3.5 w-3.5" aria-hidden />
          {vendita.language}
        </span>
        <span className="text-gray-500">{formatDateTime(vendita.soldAt)}</span>
      </div>
      <p className="text-sm text-gray-600">
        {vendita.setName} · {vendita.condition}
      </p>
      {vendita.trackingCode && (
        <p className="inline-flex items-center gap-1.5 rounded-lg bg-white/50 px-2.5 py-1 text-xs text-gray-600 ring-1 ring-gray-200">
          <Truck className="h-3.5 w-3.5 text-blue-600" aria-hidden />
          Tracking{' '}
          <span className="font-mono text-[11px] font-medium text-gray-900">
            {vendita.trackingCode}
          </span>
        </p>
      )}
    </div>
  );

  return <ExpandableCard summary={summary} details={details} />;
}
