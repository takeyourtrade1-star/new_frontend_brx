'use client';

import Image from 'next/image';
import { Minus, Plus, ShoppingBag, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ListingCartPhoto, isMarketplaceListingUuid } from '@/components/feature/cart/ListingCartPhoto';
import { formatEuroNoSpace } from '@/lib/utils';
import { getCdnImageUrl } from '@/lib/config';
import { useTranslation } from '@/lib/i18n/useTranslation';
import type { MarketplaceCartLine } from '@/types';
import { cn } from '@/lib/utils';

function resolveImageSrc(imageUrl: string): string {
  if (!imageUrl) return '';
  return imageUrl.startsWith('http') ? imageUrl : getCdnImageUrl(imageUrl);
}

type CartLineItemProps = {
  item: MarketplaceCartLine;
  intlLocale: string;
  onUpdateQuantity: (lineId: string, quantity: number) => void;
  onRemove: (lineId: string) => void;
};

export function CartLineItem({
  item,
  intlLocale,
  onUpdateQuantity,
  onRemove,
}: CartLineItemProps) {
  const { t } = useTranslation();
  const lineTotal = (item.priceCents / 100) * item.quantity;
  const unitPrice = item.priceCents / 100;
  const sourceLabel = item.isBrxExpress
    ? t('cart.brxExpress')
    : item.source === 'sync'
      ? t('cart.sourceSync')
      : t('cart.sourceMarketplace');

  const metaParts = [sourceLabel, item.condition, item.language].filter(Boolean);

  return (
    <article
      className={cn(
        'group grid gap-4 border-t border-black/[0.06] py-4 first:border-t-0',
        'grid-cols-[auto_1fr] sm:grid-cols-[auto_1fr_auto] sm:items-center sm:gap-x-5',
      )}
    >
      <div className="row-span-2 sm:row-span-1">
        {item.source === 'marketplace' && isMarketplaceListingUuid(item.listingId) ? (
          <ListingCartPhoto
            listingId={item.listingId}
            fallbackImageUrl={item.imageUrl}
            alt={item.title}
          />
        ) : (
          <div className="relative h-[4.5rem] w-[3.25rem] shrink-0 overflow-hidden rounded-xl bg-neutral-100 ring-1 ring-black/5">
            {item.imageUrl ? (
              <Image
                src={resolveImageSrc(item.imageUrl)}
                alt={item.title}
                fill
                className="object-contain p-0.5"
                sizes="52px"
                unoptimized
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center">
                <ShoppingBag className="h-5 w-5 text-neutral-400" />
              </div>
            )}
          </div>
        )}
      </div>

      <div className="min-w-0 space-y-1">
        <h3 className="line-clamp-2 text-[15px] font-semibold leading-snug tracking-tight text-neutral-900">
          {item.title}
        </h3>
        {metaParts.length > 0 && (
          <p className="text-xs text-neutral-500">{metaParts.join(' · ')}</p>
        )}
        <p className="text-sm font-medium tabular-nums text-neutral-700 sm:hidden">
          {formatEuroNoSpace(lineTotal, intlLocale)}
        </p>
      </div>

      <div className="col-span-2 flex flex-wrap items-center justify-between gap-3 sm:col-span-1 sm:flex-col sm:items-end sm:justify-center sm:gap-3">
        <div
          className="inline-flex items-center rounded-full bg-neutral-100/90 p-0.5 ring-1 ring-black/[0.06]"
          role="group"
          aria-label={t('cart.qty')}
        >
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-8 w-8 rounded-full p-0 text-neutral-700 hover:bg-white"
            onClick={() => onUpdateQuantity(item.lineId, item.quantity - 1)}
            aria-label={t('cart.decreaseQty')}
          >
            <Minus className="h-3.5 w-3.5" />
          </Button>
          <span className="min-w-[2rem] px-1 text-center text-sm font-semibold tabular-nums text-neutral-900">
            {item.quantity}
          </span>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-8 w-8 rounded-full p-0 text-neutral-700 hover:bg-white"
            onClick={() => onUpdateQuantity(item.lineId, item.quantity + 1)}
            disabled={item.quantity >= item.maxQuantity}
            aria-label={t('cart.increaseQty')}
          >
            <Plus className="h-3.5 w-3.5" />
          </Button>
        </div>

        <div className="flex items-center gap-4">
          <span className="hidden text-base font-semibold tabular-nums tracking-tight text-neutral-900 sm:block">
            {formatEuroNoSpace(lineTotal, intlLocale)}
          </span>
          <span className="hidden text-xs text-neutral-400 sm:block">
            {formatEuroNoSpace(unitPrice, intlLocale)} / {t('cart.item')}
          </span>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onRemove(item.lineId)}
            className="h-8 gap-1.5 rounded-full px-2.5 text-xs text-neutral-500 hover:bg-red-50 hover:text-red-600"
            aria-label={t('cart.remove')}
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span className="sm:hidden">{t('cart.remove')}</span>
          </Button>
        </div>
      </div>
    </article>
  );
}
