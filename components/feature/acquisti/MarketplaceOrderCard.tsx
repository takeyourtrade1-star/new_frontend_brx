'use client';

import Link from 'next/link';
import { Package } from 'lucide-react';
import { cn, formatEuroNoSpace } from '@/lib/utils';
import { ExpandableCard } from '@/components/shared/ExpandableCard';
import type { OrderResponse, OrderStatus } from '@/lib/api/marketplace-client';

const STATUS_LABELS: Record<OrderStatus, { label: string; cls: string }> = {
  pending: { label: 'In attesa', cls: 'bg-amber-50 text-amber-700' },
  confirmed: { label: 'Confermato', cls: 'bg-emerald-50 text-emerald-700' },
  shipped: { label: 'Spedito', cls: 'bg-blue-50 text-blue-700' },
  completed: { label: 'Completato', cls: 'bg-emerald-50 text-emerald-700' },
  cancelled: { label: 'Annullato', cls: 'bg-gray-100 text-gray-600' },
  mock: { label: 'Demo', cls: 'bg-gray-50 text-gray-500 border border-gray-200' },
};

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

type MarketplaceOrderCardProps = {
  order: OrderResponse;
};

export function MarketplaceOrderCard({ order }: MarketplaceOrderCardProps) {
  const statusMeta = STATUS_LABELS[order.status] ?? {
    label: order.status.toUpperCase(),
    cls: 'bg-gray-100 text-gray-600',
  };
  const title = order.listing_title?.trim() || `Inserzione ${order.listing_id.slice(0, 8)}…`;
  const total = Number.parseFloat(order.total_amount);
  const productHref = order.card_id ? `/products/${order.card_id}` : null;

  const summary = (
    <div className="flex items-start gap-3">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#F5F4F0] text-[#FF7300]">
        <Package className="h-5 w-5" aria-hidden />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          {productHref ? (
            <Link href={productHref} className="text-sm font-semibold text-gray-900 hover:text-[#FF7300] hover:underline truncate">
              {title}
            </Link>
          ) : (
            <h3 className="text-sm font-semibold text-gray-900 truncate">{title}</h3>
          )}
          <span className="text-sm font-bold text-gray-900 shrink-0">{formatEuroNoSpace(total, 'it-IT')}</span>
        </div>
        <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
          <span className={cn('inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold', statusMeta.cls)}>
            {statusMeta.label}
          </span>
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex rounded-full border border-gray-200 bg-gray-50 px-2 py-0.5 text-[10px] font-medium text-gray-500">
              Marketplace
            </span>
            {order.is_mock && (
              <span className="inline-flex rounded-full border border-gray-200 bg-white px-2 py-0.5 text-[10px] font-medium text-gray-400">
                Demo
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  const details = (
    <div className="space-y-2">
      <p className="text-xs text-gray-500">{formatDateTime(order.created_at)}</p>
      <p className="text-xs text-gray-600">Qtà {order.quantity}</p>
    </div>
  );

  return <ExpandableCard summary={summary} details={details} />;
}
