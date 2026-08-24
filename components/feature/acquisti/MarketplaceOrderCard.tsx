'use client';

import { useState } from 'react';
import { Package } from 'lucide-react';
import { formatEuroNoSpace } from '@/lib/utils';
import { useIntlLocale } from '@/lib/i18n/useIntlLocale';
import { useTranslation } from '@/lib/i18n/useTranslation';
import {
  OrderActionButton,
  OrderItemCard,
  type OrderItemModel,
  type OrderStatusTone,
  type OrderViewMode,
} from '@/components/feature/ordini/OrderItemCard';
import type { OrderResponse, OrderStatus } from '@/lib/api/marketplace-client';
import { reportOrderSupport, SupportCaseSubmissionError } from '@/lib/support/submit-support-case';

const STATUS_META: Record<OrderStatus, { label: string; tone: OrderStatusTone }> = {
  pending: { label: 'In attesa', tone: 'waiting' },
  confirmed: { label: 'Confermato', tone: 'done' },
  shipped: { label: 'Spedito', tone: 'progress' },
  completed: { label: 'Completato', tone: 'done' },
  cancelled: { label: 'Annullato', tone: 'cancelled' },
  mock: { label: 'Demo', tone: 'cancelled' },
};

function formatDateTime(iso: string, locale: string): string {
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

type MarketplaceOrderCardProps = {
  order: OrderResponse;
  layout?: OrderViewMode;
};

export function MarketplaceOrderCard({ order, layout = 'list' }: MarketplaceOrderCardProps) {
  const intlLocale = useIntlLocale();
  const { t } = useTranslation();
  const [reportState, setReportState] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const statusMeta = STATUS_META[order.status] ?? { label: order.status.toUpperCase(), tone: 'cancelled' as const };
  const title = order.listing_title?.trim() || `Inserzione ${order.listing_id.slice(0, 8)}…`;
  const total = Number.parseFloat(order.total_amount);
  const canReport = !order.is_mock && (order.status === 'shipped' || order.status === 'confirmed' || order.status === 'completed');

  const handleReport = async () => {
    if (reportState === 'sending' || reportState === 'sent') return;
    setReportState('sending');
    try {
      await reportOrderSupport({
        orderId: order.id,
        subject: `Problema ordine marketplace ${order.id.slice(0, 8)}`,
        description: `Merce non arrivata o problema con l'ordine marketplace ${order.id}.`,
        label: title.slice(0, 200),
        sourcePath: '/acquisti',
      });
      setReportState('sent');
    } catch (error) {
      setReportState(error instanceof SupportCaseSubmissionError && error.code === 'unauthorized' ? 'error' : 'error');
    }
  };

  const model: OrderItemModel = {
    id: order.id,
    title,
    href: order.card_id ? `/products/${order.card_id}` : null,
    fallbackIcon: Package,
    priceLabel: formatEuroNoSpace(total, intlLocale),
    status: statusMeta,
    channel: order.is_mock ? 'Demo' : 'Marketplace',
    metaLine: `${formatDateTime(order.created_at, intlLocale)} · Qtà ${order.quantity}`,
    actions: canReport ? (
      <OrderActionButton variant="danger" disabled={reportState === 'sending' || reportState === 'sent'} onClick={() => void handleReport()}>
        {reportState === 'sending' ? t('support.orderIssueSending') : reportState === 'sent' ? t('support.orderIssueSent') : t('support.orderIssue')}
      </OrderActionButton>
    ) : undefined,
  };

  return <OrderItemCard model={model} layout={layout} />;
}
