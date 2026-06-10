'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import { Clock, Mail, ShieldAlert, Truck, CheckCircle2, XCircle, ArrowRightLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ExpandableCard } from '@/components/shared/ExpandableCard';
import type { OrderAPI, OrderStatus } from '@/types/order';

const STATUS_BADGES: Record<
  OrderStatus,
  { label: string; cls: string; Icon: typeof Clock }
> = {
  PAYMENT_PENDING: {
    label: 'Da pagare',
    cls: 'bg-amber-50 text-amber-700',
    Icon: Clock,
  },
  PAYMENT_OVERDUE: {
    label: 'In ritardo',
    cls: 'bg-orange-50 text-orange-700',
    Icon: ShieldAlert,
  },
  DISPUTED: {
    label: 'Contesa',
    cls: 'bg-red-50 text-red-700',
    Icon: ShieldAlert,
  },
  PAID: {
    label: 'Pagato',
    cls: 'bg-emerald-50 text-emerald-700',
    Icon: CheckCircle2,
  },
  SHIPPED: {
    label: 'Inviato',
    cls: 'bg-blue-50 text-blue-700',
    Icon: Truck,
  },
  DELIVERED: {
    label: 'Consegnato',
    cls: 'bg-emerald-50 text-emerald-700',
    Icon: CheckCircle2,
  },
  CANCELLED: {
    label: 'Cancellato',
    cls: 'bg-gray-100 text-gray-600',
    Icon: XCircle,
  },
  REASSIGNED: {
    label: 'Riassegnato',
    cls: 'bg-gray-100 text-gray-600',
    Icon: ArrowRightLeft,
  },
};

const eurFmt = new Intl.NumberFormat('it-IT', {
  style: 'currency',
  currency: 'EUR',
});

function formatDateTime(iso: string | null): string {
  if (!iso) return '—';
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

function relativeTime(targetIso: string | null): { label: string; isOverdue: boolean } {
  if (!targetIso) return { label: '—', isOverdue: false };
  const target = new Date(targetIso).getTime();
  const diff = target - Date.now();
  const isOverdue = diff < 0;
  const absMs = Math.abs(diff);
  const hours = Math.floor(absMs / 3_600_000);
  const days = Math.floor(hours / 24);
  if (days >= 2) {
    return { label: `${isOverdue ? '−' : ''}${days} giorni`, isOverdue };
  }
  if (hours >= 1) {
    return { label: `${isOverdue ? '−' : ''}${hours} ore`, isOverdue };
  }
  const minutes = Math.max(1, Math.floor(absMs / 60_000));
  return { label: `${isOverdue ? '−' : ''}${minutes} min`, isOverdue };
}

export interface OrderCardProps {
  order: OrderAPI;
  perspective: 'buyer' | 'seller';
  onPay?: (order: OrderAPI) => void;
  paying?: boolean;
  onOpenDispute?: (order: OrderAPI) => void;
  openingDispute?: boolean;
}

export function OrderCard({
  order,
  perspective,
  onPay,
  paying = false,
  onOpenDispute,
  openingDispute = false,
}: OrderCardProps) {
  const badge = STATUS_BADGES[order.status];
  const dueRelative = useMemo(() => relativeTime(order.due_at), [order.due_at]);

  const counterparty =
    perspective === 'buyer'
      ? order.seller_display_name || 'Venditore'
      : order.buyer_display_name || 'Acquirente';

  const canPay = perspective === 'buyer' && (order.status === 'PAYMENT_PENDING' || order.status === 'PAYMENT_OVERDUE');
  const canOpenDispute =
    perspective === 'seller' &&
    (order.status === 'PAYMENT_PENDING' || order.status === 'PAYMENT_OVERDUE');
  const StatusIcon = badge.Icon;

  const summary = (
    <div className="flex items-start gap-3">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#F5F4F0] text-[#FF7300]">
        <StatusIcon className="h-5 w-5" aria-hidden />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-sm font-semibold text-gray-900 truncate">
            <Link href={`/aste/${order.auction_id}`} className="hover:text-[#FF7300] hover:underline">
              {order.auction_title || `Asta #${order.auction_id}`}
            </Link>
          </h3>
          <span className="text-sm font-bold text-gray-900 shrink-0">{eurFmt.format(order.total_amount)}</span>
        </div>
        <div className="mt-0.5 flex items-center gap-1 text-xs text-gray-600">
          <Mail className="h-3.5 w-3.5" aria-hidden />
          {perspective === 'buyer' ? 'Venditore' : 'Acquirente'}:
          <span className="font-medium text-gray-800">{counterparty}</span>
        </div>
        <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className={cn('inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold', badge.cls)}>
              <StatusIcon className="h-3 w-3" aria-hidden />
              {badge.label}
            </span>
            {order.due_at && dueRelative.isOverdue && (
              <span className="inline-flex items-center gap-1 rounded-full border border-red-100 bg-red-50 px-2 py-0.5 text-[10px] font-medium text-red-700">
                <Clock className="h-3 w-3" aria-hidden />
                Scaduto
              </span>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex rounded-full border border-gray-200 bg-gray-50 px-2 py-0.5 text-[10px] font-medium text-gray-500">
              Asta
            </span>
            {canPay && onPay && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onPay(order);
                }}
                disabled={paying}
                className="inline-flex items-center justify-center rounded-md bg-[#FF7300] px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-white transition-colors hover:bg-[#e56500] focus:outline-none focus:ring-2 focus:ring-[#FF7300]/40 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {paying ? 'Pagamento…' : 'Paga ora'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  const details = (
    <div className="space-y-3">
      {order.due_at && (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-600">
          <span className={cn('flex items-center gap-1', dueRelative.isOverdue ? 'text-red-700' : 'text-gray-600')}>
            <Clock className="h-3.5 w-3.5" aria-hidden />
            {dueRelative.isOverdue ? 'Scaduto da ' : 'Scade tra '}
            <strong>{dueRelative.label}</strong>
          </span>
          <span className="text-gray-400">({formatDateTime(order.due_at)})</span>
        </div>
      )}
      <div className="flex flex-wrap items-center gap-2">
        {canOpenDispute && onOpenDispute && (
          <button
            type="button"
            onClick={() => onOpenDispute(order)}
            disabled={openingDispute}
            className="inline-flex items-center justify-center rounded-md border border-red-300 bg-white px-4 py-2 text-sm font-bold uppercase tracking-wide text-red-700 transition-colors hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-400/30 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {openingDispute ? 'Apertura…' : 'Apri contestazione'}
          </button>
        )}
      </div>
      {order.status === 'PAID' && (
        <p className="text-xs text-emerald-700">Pagato il {formatDateTime(order.paid_at)}</p>
      )}
    </div>
  );

  return <ExpandableCard summary={summary} details={details} />;
}
