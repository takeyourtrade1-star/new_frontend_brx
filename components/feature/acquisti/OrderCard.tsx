'use client';

import { useMemo, useState } from 'react';
import { Gavel } from 'lucide-react';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { reportOrderSupport } from '@/lib/support/submit-support-case';
import {
  OrderActionButton,
  OrderItemCard,
  type OrderItemModel,
  type OrderStatusTone,
  type OrderViewMode,
} from '@/components/feature/ordini/OrderItemCard';
import type { OrderAPI, OrderStatus } from '@/types/order';
import { useIntlLocale } from '@/lib/i18n/useIntlLocale';
import { formatEur } from '@/lib/utils';

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

function formatDateTime(iso: string | null, locale: string): string {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString(locale, {
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
  const sign = isOverdue ? '−' : '';
  const hours = Math.floor(absMs / 3_600_000);
  const days = Math.floor(hours / 24);
  const years = Math.floor(days / 365);
  const months = Math.floor(days / 30);
  if (years >= 1) return { label: `${sign}${years} ${years === 1 ? 'anno' : 'anni'}`, isOverdue };
  if (months >= 1) return { label: `${sign}${months} ${months === 1 ? 'mese' : 'mesi'}`, isOverdue };
  if (days >= 2) return { label: `${sign}${days} giorni`, isOverdue };
  if (hours >= 1) return { label: `${sign}${hours} ore`, isOverdue };
  const minutes = Math.max(1, Math.floor(absMs / 60_000));
  return { label: `${sign}${minutes} min`, isOverdue };
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
  const intlLocale = useIntlLocale();
  const { t } = useTranslation();
  const [reportState, setReportState] = useState<'idle' | 'sending' | 'sent'>('idle');
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
  const canReportIssue =
    !canPay
    && order.status !== 'CANCELLED'
    && order.status !== 'REASSIGNED';

  const metaLine =
    order.status === 'PAID'
      ? `Pagato il ${formatDateTime(order.paid_at, intlLocale)}`
      : order.due_at
        ? `${dueRelative.isOverdue ? 'Scaduto da ' : 'Scade tra '}${dueRelative.label} · ${formatDateTime(order.due_at, intlLocale)}`
        : undefined;

  const model: OrderItemModel = {
    id: String(order.id),
    title: order.auction_title || `Asta #${order.auction_id}`,
    href: `/aste/${order.auction_id}`,
    fallbackIcon: Gavel,
    priceLabel: formatEur(order.total_amount, intlLocale),
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
      ) : canReportIssue ? (
        <OrderActionButton
          variant="danger"
          disabled={reportState !== 'idle'}
          onClick={() => {
            if (reportState !== 'idle') return;
            setReportState('sending');
            void reportOrderSupport({
              orderId: String(order.id),
              subject: `Problema ordine asta #${order.id}`,
              description: `Problema segnalato sull'ordine asta #${order.id} (${order.auction_title || 'asta'}).`,
              label: (order.auction_title || `Asta #${order.auction_id}`).slice(0, 200),
              sourcePath: '/acquisti',
            }).then(() => setReportState('sent')).catch(() => setReportState('idle'));
          }}
        >
          {reportState === 'sending' ? t('support.orderIssueSending') : reportState === 'sent' ? t('support.orderIssueSent') : t('support.orderIssue')}
        </OrderActionButton>
      ) : undefined,
  };

  return <OrderItemCard model={model} layout={layout} />;
}
