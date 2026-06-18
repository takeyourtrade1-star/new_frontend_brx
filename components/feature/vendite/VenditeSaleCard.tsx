'use client';

import { Package } from 'lucide-react';
import {
  OrderItemCard,
  type OrderItemModel,
  type OrderStatusTone,
  type OrderViewMode,
} from '@/components/feature/ordini/OrderItemCard';
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

const STATUS_META: Record<VenditaMock['stato'], { label: string; tone: OrderStatusTone }> = {
  'in-attesa-pagamento': { label: 'In attesa', tone: 'waiting' },
  'da-spedire': { label: 'Da spedire', tone: 'action' },
  spedito: { label: 'Spedito', tone: 'progress' },
  completato: { label: 'Completato', tone: 'done' },
};

const CHANNEL_LABEL: Record<VenditaMock['category'], string> = {
  asta: 'Asta',
  marketplace: 'Marketplace',
  demo: 'Demo',
};

type VenditeSaleCardProps = {
  vendita: VenditaMock;
  layout?: OrderViewMode;
};

export function VenditeSaleCard({ vendita, layout = 'list' }: VenditeSaleCardProps) {
  const metaParts = [`${vendita.setName} · ${vendita.condition} · ${vendita.language}`, formatDateTime(vendita.soldAt)];
  if (vendita.trackingCode) metaParts.push(`Tracking ${vendita.trackingCode}`);

  const model: OrderItemModel = {
    id: vendita.id,
    title: vendita.itemName,
    fallbackIcon: Package,
    subtitle: vendita.setName,
    counterparty: { label: 'Acquirente', name: `@${vendita.buyerUsername}` },
    priceLabel: formatPrice(vendita.price),
    status: STATUS_META[vendita.stato],
    channel: CHANNEL_LABEL[vendita.category],
    metaLine: [formatDateTime(vendita.soldAt), vendita.trackingCode ? `Tracking ${vendita.trackingCode}` : null]
      .filter(Boolean)
      .join(' · '),
  };

  return <OrderItemCard model={model} layout={layout} />;
}
