'use client';

import { CreditCard, Package } from 'lucide-react';
import { formatEuroNoSpace } from '@/lib/utils';
import { getCdnImageUrl } from '@/lib/config';
import { useTranslation } from '@/lib/i18n/useTranslation';
import {
  OrderActionButton,
  OrderItemCard,
  type OrderItemModel,
  type OrderViewMode,
} from '@/components/feature/ordini/OrderItemCard';
import {
  getMockOrderTotalCents,
  type MockPurchaseOrder,
} from '@/lib/stores/mock-purchase-store';

function resolveImageSrc(imageUrl: string): string {
  if (!imageUrl) return '';
  return imageUrl.startsWith('http') ? imageUrl : getCdnImageUrl(imageUrl);
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

type MockPurchaseOrderCardProps = {
  order: MockPurchaseOrder;
  onPay?: (order: MockPurchaseOrder) => void;
  paying?: boolean;
  layout?: OrderViewMode;
};

export function MockPurchaseOrderCard({
  order,
  onPay,
  paying = false,
  layout = 'list',
}: MockPurchaseOrderCardProps) {
  const { t } = useTranslation();
  const isPending = order.status === 'payment_pending';
  const total = getMockOrderTotalCents(order) / 100;

  const model: OrderItemModel = {
    id: order.id,
    title: order.title,
    href: order.cardId ? `/products/${order.cardId}` : null,
    imageUrl: resolveImageSrc(order.imageUrl) || null,
    fallbackIcon: Package,
    subtitle: order.sellerDisplayName || undefined,
    priceLabel: formatEuroNoSpace(total, 'it-IT'),
    status: isPending
      ? { label: t('mockCheckout.statusPending'), tone: 'waiting' }
      : { label: t('mockCheckout.statusPaid'), tone: 'done' },
    channel: 'Demo',
    metaLine:
      !isPending && order.paidAt
        ? t('mockCheckout.paidAt', { date: formatDateTime(order.paidAt) })
        : formatDateTime(order.createdAt),
    actions:
      isPending && onPay ? (
        <OrderActionButton variant="primary" icon={CreditCard} disabled={paying} onClick={() => onPay(order)}>
          {paying ? t('mockCheckout.paying') : t('mockCheckout.simulatePayment')}
        </OrderActionButton>
      ) : undefined,
  };

  return <OrderItemCard model={model} layout={layout} />;
}
