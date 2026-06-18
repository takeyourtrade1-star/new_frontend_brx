'use client';

import { useMemo } from 'react';
import { Gavel } from 'lucide-react';
import {
  OrderActionButton,
  OrderItemCard,
  type OrderItemModel,
  type OrderStatusTone,
  type OrderViewMode,
} from '@/components/feature/ordini/OrderItemCard';
import type { OrderAPI, OrderStatus } from '@/types/order';

const STATUS_META: Record<OrderStatus, { label: string; tone: OrderStatusTone }> = {
  PAYMENT_PENDING: { label: 'Da pagare', tone: 'waiting' },
  PAYMENT_OVERDUE: { label: 'In ritardo', tone: 'action' },
  DISPUTED: { label: 'Contesa', tone: 'action' },
  PAID: { label: 'Pagato', tone: 'done' },
  SHIPPED: { label: 'Inviato', tone: 'progress' },
  DELIVERED: { label: 'Consegnato', tone: 'done' },
  CANCELLED: { label: 'Cancellato', tone: 'cancelled' },
  REASSIGNED: { label: 'Riassegnato', tone: 'cancelled' },
};

const eurFmt = new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' });

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
  if (days >= 2) return { label: `${isOverdue ? '−' : ''}${days} giorni`, isOverdue };
  if (hours >= 1) return { label: `${isOverdue ? '−' : ''}${hours} ore`, isOverdue };
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
  layout?: OrderViewMode;
}

export function OrderCard({
  order,
  perspective,
  onPay,
  paying = false,
  onOpenDispute,
  openingDispute = false,
  layout = 'list',
}: OrderCardProps) {
  const statusMeta = STATUS_META[order.status];
  const dueRelative = useMemo(() => relativeTime(order.due_at), [order.due_at]);

  const counterpartyName =
    perspective === 'buyer'
      ? order.seller_display_name || 'Venditore'
      : order.buyer_display_name || 'Acquirente';

  const canPay =
    perspective === 'buyer' && (order.status === 'PAYMENT_PENDING' || order.status === 'PAYMENT_OVERDUE');
  const canOpenDispute =
    perspective === 'seller' && (order.status === 'PAYMENT_PENDING' || order.status === 'PAYMENT_OVERDUE');

  const metaLine =
    order.status === 'PAID'
      ? `Pagato il ${formatDateTime(order.paid_at)}`
      : order.due_at
        ? `${dueRelative.isOverdue ? 'Scaduto da ' : 'Scade tra '}${dueRelative.label} · ${formatDateTime(order.due_at)}`
        : undefined;

  const model: OrderItemModel = {
    id: String(order.id),
    title: order.auction_title || `Asta #${order.auction_id}`,
    href: `/aste/${order.auction_id}`,
    fallbackIcon: Gavel,
    priceLabel: eurFmt.format(order.total_amount),
    counterparty: { label: perspective === 'buyer' ? 'Venditore' : 'Acquirente', name: counterpartyName },
    status: statusMeta,
    alert: order.due_at && dueRelative.isOverdue ? 'Scaduto' : undefined,
    channel: 'Asta',
    metaLine,
    actions:
      canPay && onPay ? (
        <OrderActionButton variant="primary" disabled={paying} onClick={() => onPay(order)}>
          {paying ? 'Pagamento…' : 'Paga ora'}
        </OrderActionButton>
      ) : canOpenDispute && onOpenDispute ? (
        <OrderActionButton variant="danger" disabled={openingDispute} onClick={() => onOpenDispute(order)}>
          {openingDispute ? 'Apertura…' : 'Apri contestazione'}
        </OrderActionButton>
      ) : undefined,
  };

  return <OrderItemCard model={model} layout={layout} />;
}
