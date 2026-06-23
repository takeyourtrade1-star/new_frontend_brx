'use client';

import Link from 'next/link';
import { cn } from '@/lib/utils';
import { CardImageCameraPeek } from '@/components/ui/CardImageCameraPeek';
import type { ReprintCard } from '@/lib/product-detail/product-detail-view-types';
import { REPRINT_TILE_CLASS } from '@/lib/product-detail/product-detail-view-types';
import { ReprintCardPreview } from '@/components/feature/product/detail/ReprintCardPreview';
import { ReprintSetIconLink } from '@/components/feature/product/detail/ReprintSetIconLink';

export function ReprintThumbnail({
  reprint,
  columnIndex,
  className,
}: {
  reprint: ReprintCard;
  columnIndex: number;
  className?: string;
}) {
  const previewSide = columnIndex % 2 === 0 ? 'left' : 'right';

  return (
    <div
      className={cn(
        'group relative overflow-hidden rounded-lg shadow-sm ring-1 ring-zinc-200/70 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:ring-primary/30',
        REPRINT_TILE_CLASS,
        className
      )}
    >
      <Link
        href={`/products/${reprint.id}`}
        className="absolute inset-0 z-0 block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary/40"
        title={`${reprint.setName} • ${reprint.rarity}`}
      >
        <ReprintCardPreview imageSrc={reprint.imageSrc} alt={reprint.setName} className="h-full min-h-20" />
      </Link>

      {reprint.imageSrc && (
        <div
          className="absolute left-1.5 top-1.5 z-10"
          onClick={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.preventDefault()}
        >
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-white/90 shadow-sm backdrop-blur-sm">
            <CardImageCameraPeek
              imageUrl={reprint.imageSrc}
              name={reprint.setName}
              previewSide={previewSide}
              className="!h-4 !w-4"
              ariaLabel={`Anteprima ${reprint.setName}`}
            />
          </div>
        </div>
      )}

      <div className="absolute right-1.5 top-1.5">
        <ReprintSetIconLink
          setName={reprint.setName}
          setIconSrc={reprint.setIconSrc}
          gameSlug={reprint.gameSlug}
        />
      </div>
    </div>
  );
}
