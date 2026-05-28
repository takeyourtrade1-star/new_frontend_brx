'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Package, CreditCard } from 'lucide-react';
import { cn, formatEuroNoSpace } from '@/lib/utils';
import { getCdnImageUrl } from '@/lib/config';
import { useTranslation } from '@/lib/i18n/useTranslation';
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
};

export function MockPurchaseOrderCard({
  order,
  onPay,
  paying = false,
}: MockPurchaseOrderCardProps) {
  const { t } = useTranslation();
  const isPending = order.status === 'payment_pending';
  const total = getMockOrderTotalCents(order) / 100;
  const productHref = order.cardId ? `/products/${order.cardId}` : null;
  const imageSrc = resolveImageSrc(order.imageUrl);

  return (
    <article className="border border-gray-200 bg-white p-4 shadow-sm sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 flex-1 items-start gap-3">
          <div className="relative h-14 w-10 shrink-0 overflow-hidden rounded-lg bg-[#F5F4F0] ring-1 ring-black/5">
            {imageSrc ? (
              <Image
                src={imageSrc}
                alt={order.title}
                fill
                className="object-contain p-0.5"
                sizes="40px"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-[#FF7300]">
                <Package className="h-5 w-5" aria-hidden />
              </div>
            )}
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-500">
              {t('mockCheckout.demoOrderLabel')} · #{order.id.slice(0, 8)}
            </p>
            {productHref ? (
              <Link
                href={productHref}
                className="mt-0.5 block truncate text-base font-bold text-gray-900 hover:text-[#FF7300] hover:underline"
              >
                {order.title}
              </Link>
            ) : (
              <p className="mt-0.5 truncate text-base font-bold text-gray-900">{order.title}</p>
            )}
            {order.sellerDisplayName && (
              <p className="mt-0.5 text-xs text-gray-500">{order.sellerDisplayName}</p>
            )}
            <p className="mt-1 text-sm text-gray-600">
              Qtà {order.quantity} · {formatEuroNoSpace(total, 'it-IT')}
            </p>
            <p className="mt-1 text-xs text-gray-500">{formatDateTime(order.createdAt)}</p>
            {!isPending && order.paidAt && (
              <p className="mt-1 text-xs font-medium text-emerald-700">
                {t('mockCheckout.paidAt', { date: formatDateTime(order.paidAt) })}
              </p>
            )}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex rounded-full bg-blue-600 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
            DEMO
          </span>
          <span
            className={cn(
              'inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide',
              isPending
                ? 'bg-amber-100 text-amber-800'
                : 'bg-emerald-100 text-emerald-800',
            )}
          >
            {isPending ? t('mockCheckout.statusPending') : t('mockCheckout.statusPaid')}
          </span>
        </div>
      </div>

      {isPending && onPay && (
        <div className="mt-4 flex justify-end border-t border-gray-100 pt-4">
          <button
            type="button"
            onClick={() => onPay(order)}
            disabled={paying}
            className="inline-flex items-center justify-center gap-2 rounded-md bg-[#FF7300] px-4 py-2 text-sm font-bold uppercase tracking-wide text-white transition-colors hover:bg-[#e56500] focus:outline-none focus:ring-2 focus:ring-[#FF7300]/40 disabled:opacity-60"
          >
            <CreditCard className="h-4 w-4" aria-hidden />
            {paying ? t('mockCheckout.paying') : t('mockCheckout.simulatePayment')}
          </button>
        </div>
      )}
    </article>
  );
}
