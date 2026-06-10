'use client';

import Image from 'next/image';
import { Package, CheckCircle2, AlertTriangle, Truck } from 'lucide-react';
import { cn, formatEuroNoSpace } from '@/lib/utils';
import { getCdnImageUrl } from '@/lib/config';
import { ExpandableCard } from '@/components/shared/ExpandableCard';

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

interface MockShippingOrderCardProps {
  order: MockShippingOrder;
  onReceived?: (orderId: string) => void;
  onNotReceived?: (order: MockShippingOrder) => void;
}

export function MockShippingOrderCard({
  order,
  onReceived,
  onNotReceived,
}: MockShippingOrderCardProps) {
  const imageSrc = resolveImageSrc(order.imageUrl);
  const total = (order.priceCents * order.quantity) / 100;
  const isDelayed = order.shippingDays > 14;

  const summary = (
    <div className="flex items-start gap-3">
      <div className="relative h-12 w-10 shrink-0 overflow-hidden rounded-lg bg-[#F5F4F0] ring-1 ring-black/5">
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
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-sm font-semibold text-gray-900 truncate">{order.title}</h3>
          <span className="text-sm font-bold text-gray-900 shrink-0">{formatEuroNoSpace(total, 'it-IT')}</span>
        </div>
        <p className="mt-0.5 text-xs text-gray-500 truncate">{order.sellerDisplayName}</p>
        <div className="mt-1.5 flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-semibold text-blue-700">
              <Truck className="h-3 w-3" aria-hidden />
              In transito · {order.shippingDays} giorni
            </span>
            {isDelayed && (
              <span className="inline-flex items-center gap-1 rounded-full border border-red-100 bg-red-50 px-2 py-0.5 text-[10px] font-medium text-red-700">
                <AlertTriangle className="h-3 w-3" aria-hidden />
                In ritardo
              </span>
            )}
          </div>
          <span className="inline-flex rounded-full border border-gray-200 bg-white px-2 py-0.5 text-[10px] font-medium text-gray-400">
            Demo
          </span>
        </div>
      </div>
    </div>
  );

  const details = (
    <div className="space-y-3">
      <p className="text-xs text-gray-500">Spedito il {formatDateTime(order.shippedAt)}</p>
      {order.status === 'in_transit' && (
        <div className="flex flex-wrap items-center justify-end gap-2">
          <button
            type="button"
            onClick={() => onNotReceived?.(order)}
            className="inline-flex items-center justify-center gap-1.5 rounded-md bg-red-50 px-3 py-2 text-xs font-bold uppercase tracking-wide text-red-700 ring-1 ring-red-200 transition-colors hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-300"
          >
            <AlertTriangle className="h-3.5 w-3.5" aria-hidden />
            Non ricevuto
          </button>
          <button
            type="button"
            onClick={() => onReceived?.(order.id)}
            className="inline-flex items-center justify-center gap-1.5 rounded-md bg-emerald-600 px-3 py-2 text-xs font-bold uppercase tracking-wide text-white transition-colors hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-300"
          >
            <CheckCircle2 className="h-3.5 w-3.5" aria-hidden />
            Ricevuto
          </button>
        </div>
      )}
    </div>
  );

  return <ExpandableCard summary={summary} details={details} />;
}
