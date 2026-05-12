'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import { Clock, Mail, ShieldAlert, Truck, CheckCircle2, XCircle, ArrowRightLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { OrderAPI, OrderStatus } from '@/types/order';

const STATUS_BADGES: Record<
  OrderStatus,
  { label: string; cls: string; Icon: typeof Clock }
> = {
  PAYMENT_PENDING: {
    label: 'DA PAGARE',
    cls: 'bg-amber-100 text-amber-800',
    Icon: Clock,
  },
  PAYMENT_OVERDUE: {
    label: 'PAGAMENTO IN RITARDO',
    cls: 'bg-orange-100 text-orange-800',
    Icon: ShieldAlert,
  },
  DISPUTED: {
    label: 'IN CONTESTAZIONE',
    cls: 'bg-red-100 text-red-800',
    Icon: ShieldAlert,
  },
  PAID: {
    label: 'PAGATO',
    cls: 'bg-emerald-100 text-emerald-800',
    Icon: CheckCircle2,
  },
  SHIPPED: {
    label: 'INVIATO',
    cls: 'bg-blue-100 text-blue-800',
    Icon: Truck,
  },
  DELIVERED: {
    label: 'CONSEGNATO',
    cls: 'bg-emerald-200 text-emerald-900',
    Icon: CheckCircle2,
  },
  CANCELLED: {
    label: 'CANCELLATO',
    cls: 'bg-gray-200 text-gray-700',
    Icon: XCircle,
  },
  REASSIGNED: {
    label: 'RIASSEGNATO',
    cls: 'bg-gray-200 text-gray-700',
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
  /** When true the card surfaces the buyer's perspective (buy now button); when
   * false the seller perspective (waiting for payment). */
  perspective: 'buyer' | 'seller';
  onPay?: (order: OrderAPI) => void;
  /** Disable the "Paga ora" CTA while a request is in flight. */
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
          <span className="text-xs text-gray-500">Ordine #{order.id}</span>
        </div>

        <h3 className="text-lg font-semibold text-gray-900">
          <Link href={`/aste/${order.auction_id}`} className="hover:underline">
            {order.auction_title || `Asta #${order.auction_id}`}
          </Link>
        </h3>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-600">
          <span className="flex items-center gap-1">
            <Mail className="h-4 w-4" aria-hidden />
            {perspective === 'buyer' ? 'Venditore' : 'Acquirente'}: <strong className="text-gray-800">{counterparty}</strong>
          </span>
          {order.due_at && (
            <span className={cn('flex items-center gap-1', dueRelative.isOverdue ? 'text-red-700' : 'text-gray-600')}>
              <Clock className="h-4 w-4" aria-hidden />
              {dueRelative.isOverdue ? 'Scaduto da ' : 'Scade tra '}
              <strong>{dueRelative.label}</strong>
              <span className="text-gray-400">({formatDateTime(order.due_at)})</span>
            </span>
          )}
        </div>
      </div>

      <div className="flex flex-col items-stretch gap-2 sm:items-end">
        <div className="text-right">
          <div className="text-xs uppercase tracking-wide text-gray-500">Totale</div>
          <div className="text-2xl font-bold text-gray-900">
            {eurFmt.format(order.total_amount)}
          </div>
        </div>
        {canPay && onPay && (
          <button
            type="button"
            onClick={() => onPay(order)}
            disabled={paying}
            className={cn(
              'inline-flex items-center justify-center rounded-md bg-[#FF7300] px-4 py-2 text-sm font-bold uppercase tracking-wide text-white transition-colors hover:bg-[#e56500] focus:outline-none focus:ring-2 focus:ring-[#FF7300]/40 disabled:cursor-not-allowed disabled:opacity-60',
            )}
          >
            {paying ? 'Pagamento…' : 'Paga ora'}
          </button>
        )}
        {canOpenDispute && onOpenDispute && (
          <button
            type="button"
            onClick={() => onOpenDispute(order)}
            disabled={openingDispute}
            className={cn(
              'inline-flex items-center justify-center rounded-md border border-red-300 bg-white px-4 py-2 text-sm font-bold uppercase tracking-wide text-red-700 transition-colors hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-400/30 disabled:cursor-not-allowed disabled:opacity-60',
            )}
          >
            {openingDispute ? 'Apertura…' : 'Apri contestazione'}
          </button>
        )}
        {order.status === 'PAID' && (
          <span className="text-xs text-emerald-700">Pagato il {formatDateTime(order.paid_at)}</span>
        )}
      </div>
    </article>
  );
}
