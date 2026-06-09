'use client';

import Link from 'next/link';
import { Package } from 'lucide-react';
import { cn, formatEuroNoSpace } from '@/lib/utils';
import { ExpandableCard } from '@/components/shared/ExpandableCard';
import type { OrderResponse, OrderStatus } from '@/lib/api/marketplace-client';

const STATUS_LABELS: Record<OrderStatus, { label: string; cls: string }> = {
  pending: { label: 'IN ATTESA', cls: 'bg-amber-100 text-amber-800' },
  confirmed: { label: 'CONFERMATO', cls: 'bg-emerald-100 text-emerald-800' },
  shipped: { label: 'SPEDITO', cls: 'bg-blue-100 text-blue-800' },
  completed: { label: 'COMPLETATO', cls: 'bg-emerald-200 text-emerald-900' },
  cancelled: { label: 'ANNULLATO', cls: 'bg-gray-200 text-gray-700' },
  mock: { label: 'DEMO', cls: 'bg-blue-100 text-blue-700' },
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
    cls: 'bg-gray-100 text-gray-700',
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
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <span className={cn('inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide', statusMeta.cls)}>
            {statusMeta.label}
          </span>
          <span className="inline-flex rounded-full bg-sky-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-sky-700">
            MARKETPLACE
          </span>
          {order.is_mock && (
            <span className="inline-flex rounded-full bg-blue-600 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
              DEMO
            </span>
          )}
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
