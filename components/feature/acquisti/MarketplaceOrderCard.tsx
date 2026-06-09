'use client';

import Link from 'next/link';
import { Package } from 'lucide-react';
import { cn, formatEuroNoSpace } from '@/lib/utils';
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

  return (
    <article className="border border-gray-200 bg-white p-4 shadow-sm sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 flex-1 items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-[#F5F4F0] text-[#FF7300]">
            <Package className="h-5 w-5" aria-hidden />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-500">
              Marketplace · #{order.id.slice(0, 8)}
            </p>
            {productHref ? (
              <Link
                href={productHref}
                className="mt-0.5 block truncate text-base font-bold text-gray-900 hover:text-[#FF7300] hover:underline"
              >
                {title}
              </Link>
            ) : (
              <p className="mt-0.5 truncate text-base font-bold text-gray-900">{title}</p>
            )}
            <p className="mt-1 text-sm text-gray-600">
              Qtà {order.quantity} · {formatEuroNoSpace(total, 'it-IT')} · {statusMeta.label}
            </p>
            <p className="mt-1 text-xs text-gray-500">{formatDateTime(order.created_at)}</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {order.is_mock && (
            <span className="inline-flex rounded-full bg-blue-600 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
              DEMO
            </span>
          )}
          <span className="inline-flex rounded-full bg-sky-100 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-sky-700">
            MARKETPLACE
          </span>
          <span
            className={cn(
              'inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide',
              statusMeta.cls,
            )}
          >
            {statusMeta.label}
          </span>
        </div>
      </div>
    </article>
  );
}
