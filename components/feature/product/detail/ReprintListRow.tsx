'use client';

import Link from 'next/link';
import { CardImageCameraPeek } from '@/components/ui/CardImageCameraPeek';
import type { ReprintCard } from '@/lib/product-detail/product-detail-view-types';
import { ReprintCardPreview } from '@/components/feature/product/detail/ReprintCardPreview';
import { ReprintSetIconLink } from '@/components/feature/product/detail/ReprintSetIconLink';

export function ReprintListRow({
  reprint,
  rowIndex,
  totalRows,
}: {
  reprint: ReprintCard;
  rowIndex: number;
  totalRows: number;
}) {
  const previewSide: 'left' | 'right' = rowIndex < Math.ceil(totalRows / 2) ? 'right' : 'left';

  return (
    <div className="group relative h-14 min-h-14 shrink-0 overflow-hidden rounded-md shadow-sm ring-1 ring-zinc-200/70 transition-all hover:ring-primary/30">
      <Link
        href={`/products/${reprint.id}`}
        className="absolute inset-0 z-0 block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary/40"
        title={`${reprint.setName} • ${reprint.rarity}`}
      >
        <ReprintCardPreview imageSrc={reprint.imageSrc} alt={reprint.setName} className="h-full min-h-14" />
      </Link>

      {reprint.imageSrc && (
        <div
          className="absolute left-1 top-1 z-10"
          onClick={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.preventDefault()}
        >
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-white/90 shadow-sm">
            <CardImageCameraPeek
              imageUrl={reprint.imageSrc}
              name={reprint.setName}
              previewSide={previewSide}
              className="!h-3.5 !w-3.5"
              ariaLabel={`Anteprima ${reprint.setName}`}
            />
          </div>
        </div>
      )}

      <div className="absolute right-1 top-1">
        <ReprintSetIconLink
          setName={reprint.setName}
          setIconSrc={reprint.setIconSrc}
          gameSlug={reprint.gameSlug}
          size="sm"
        />
      </div>
    </div>
  );
}
