'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Loader2, ShoppingCart } from 'lucide-react';
import { useCartStore } from '@/lib/stores/cart-store';
import { useMockPurchaseStore } from '@/lib/stores/mock-purchase-store';
import { formatEuroNoSpace } from '@/lib/utils';
import { getCdnImageUrl } from '@/lib/config';
import { useTranslation } from '@/lib/i18n/useTranslation';
import type { MarketplaceCartLine } from '@/types';

function resolveImageSrc(imageUrl: string): string {
  if (!imageUrl) return '';
  return imageUrl.startsWith('http') ? imageUrl : getCdnImageUrl(imageUrl);
}

type CartPreviewSectionProps = {
  onOrdersCreated?: () => void;
};

function PreviewLine({ line }: { line: MarketplaceCartLine }) {
  const imageSrc = resolveImageSrc(line.imageUrl);
  const lineTotal = (line.priceCents / 100) * line.quantity;

  return (
    <div className="flex items-center gap-3 border-t border-gray-100 py-3 first:border-t-0 first:pt-0">
      <div className="relative h-12 w-9 shrink-0 overflow-hidden rounded-md bg-gray-100 ring-1 ring-black/5">
        {imageSrc ? (
          <Image
            src={imageSrc}
            alt={line.title}
            fill
            className="object-contain p-0.5"
            sizes="36px"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-gray-400">
            <ShoppingCart className="h-4 w-4" aria-hidden />
          </div>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-gray-900">{line.title}</p>
        <p className="text-xs text-gray-500">
          Qtà {line.quantity} · {formatEuroNoSpace(lineTotal, 'it-IT')}
        </p>
      </div>
    </div>
  );
}

export function CartPreviewSection({ onOrdersCreated }: CartPreviewSectionProps) {
  const { t } = useTranslation();
  const items = useCartStore((s) => s.items);
  const removeItem = useCartStore((s) => s.removeItem);
  const createFromCartLines = useMockPurchaseStore((s) => s.createFromCartLines);
  const [submitting, setSubmitting] = useState(false);

  if (items.length === 0) return null;

  const cartTotal = items.reduce(
    (acc, line) => acc + (line.priceCents / 100) * line.quantity,
    0,
  );

  const handleConfirmDemoOrder = () => {
    setSubmitting(true);
    const lineIds = items.map((l) => l.lineId);
    createFromCartLines(items, 'cart');
    lineIds.forEach((id) => removeItem(id));
    setSubmitting(false);
    onOrdersCreated?.();
  };

  return (
    <section className="mb-6 overflow-hidden rounded-lg border border-amber-200 bg-amber-50/50 shadow-sm">
      <div className="border-b border-amber-200 bg-amber-100/60 px-4 py-3 sm:px-5">
        <div className="flex flex-wrap items-center gap-2">
          <ShoppingCart className="h-4 w-4 text-amber-800" aria-hidden />
          <h2 className="text-sm font-bold uppercase tracking-wide text-amber-900">
            {t('mockCheckout.cartPreviewTitle')}
          </h2>
          <span className="inline-flex rounded-full bg-blue-600 px-2 py-0.5 text-[10px] font-bold uppercase text-white">
            DEMO
          </span>
        </div>
        <p className="mt-1 text-xs text-amber-800">{t('mockCheckout.cartPreviewHint')}</p>
      </div>

      <div className="px-4 py-3 sm:px-5">
        {items.map((line) => (
          <PreviewLine key={line.lineId} line={line} />
        ))}

        <div className="mt-3 flex items-center justify-between border-t border-amber-200 pt-3 text-sm">
          <span className="font-medium text-gray-700">{t('cart.total')}</span>
          <span className="font-bold tabular-nums text-gray-900">
            {formatEuroNoSpace(cartTotal, 'it-IT')}
          </span>
        </div>
      </div>

      <div className="flex flex-col gap-2 border-t border-amber-200 bg-white px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5">
        <Link
          href="/cart"
          className="text-center text-sm font-medium text-[#FF7300] hover:underline sm:text-left"
        >
          {t('mockCheckout.editCart')}
        </Link>
        <button
          type="button"
          onClick={handleConfirmDemoOrder}
          disabled={submitting}
          className="inline-flex items-center justify-center gap-2 rounded-md bg-[#FF7300] px-4 py-2 text-sm font-bold uppercase tracking-wide text-white transition-colors hover:bg-[#e56500] focus:outline-none focus:ring-2 focus:ring-[#FF7300]/40 disabled:opacity-60"
        >
          {submitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              {t('mockCheckout.confirming')}
            </>
          ) : (
            t('mockCheckout.confirmOrder')
          )}
        </button>
      </div>
    </section>
  );
}
