'use client';

import { Package, CheckCircle2, AlertTriangle } from 'lucide-react';
import { formatEuroNoSpace } from '@/lib/utils';
import { getCdnImageUrl } from '@/lib/config';
import { useIntlLocale } from '@/lib/i18n/useIntlLocale';
import {
  OrderActionButton,
  OrderItemCard,
  type OrderItemModel,
  type OrderViewMode,
} from '@/components/feature/ordini/OrderItemCard';

export interface MockShippingOrder {
  id: string;
  title: string;
  quantity: number;
  priceCents: number;
  sellerDisplayName: string;
  imageUrl: string;
  shippedAt: string;
  shippingDays: number;
  status: 'in_transit' | 'received' | 'delayed';
}

function resolveImageSrc(imageUrl: string): string {
  if (!imageUrl) return '';
  return imageUrl.startsWith('http') ? imageUrl : getCdnImageUrl(imageUrl);
}

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

interface MockShippingOrderCardProps {
  order: MockShippingOrder;
  onReceived?: (orderId: string) => void;
  onNotReceived?: (order: MockShippingOrder) => void;
  layout?: OrderViewMode;
}

export function MockShippingOrderCard({
  order,
  onReceived,
  onNotReceived,
  layout = 'list',
}: MockShippingOrderCardProps) {
  const intlLocale = useIntlLocale();
  const total = (order.priceCents * order.quantity) / 100;
  const isDelayed = order.shippingDays > 14;
  const isReceived = order.status === 'received';

  const model: OrderItemModel = {
    id: order.id,
    title: order.title,
    imageUrl: resolveImageSrc(order.imageUrl) || null,
    fallbackIcon: Package,
    subtitle: order.sellerDisplayName || undefined,
    priceLabel: formatEuroNoSpace(total, intlLocale),
    status: isReceived
      ? { label: 'Ricevuto', tone: 'done' }
      : { label: `In transito · ${order.shippingDays} g`, tone: 'progress' },
    alert: isDelayed && !isReceived ? 'In ritardo' : undefined,
    channel: 'Demo',
    metaLine: `Spedito il ${formatDateTime(order.shippedAt, intlLocale)}`,
    actions:
      order.status === 'in_transit' ? (
        <>
          <OrderActionButton variant="danger" icon={AlertTriangle} onClick={() => onNotReceived?.(order)}>
            Non ricevuto
          </OrderActionButton>
          <OrderActionButton variant="positive" icon={CheckCircle2} onClick={() => onReceived?.(order.id)}>
            Ricevuto
          </OrderActionButton>
        </>
      ) : undefined,
  };

  return <OrderItemCard model={model} layout={layout} />;
}
