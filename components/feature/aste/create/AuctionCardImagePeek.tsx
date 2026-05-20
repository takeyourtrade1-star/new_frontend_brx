'use client';

import { CardImageCameraPeek } from '@/components/ui/CardImageCameraPeek';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/lib/i18n/useTranslation';

/**
 * Miniatura carta in flussi asta/collezione: icona fotocamera + anteprima a sinistra (desktop) / modale (touch).
 */
export function AuctionCardImagePeek({
  imageUrl,
  name,
  className,
  thumbClassName,
  sizes: _sizes,
  onImageClick,
}: {
  imageUrl: string | null;
  name: string;
  className?: string;
  thumbClassName?: string;
  sizes?: string;
  onImageClick?: () => void;
}) {
  const { t } = useTranslation();

  if (!imageUrl) {
    return (
      <div
        className={cn(
          'relative shrink-0 overflow-hidden rounded-md border border-gray-200 bg-gray-100',
          thumbClassName,
          className
        )}
      >
        <div className="flex h-full w-full items-center justify-center text-[10px] text-gray-400">—</div>
      </div>
    );
  }

  const ariaLabel = onImageClick
    ? t('auctions.createCollectionSelectByImage', { name })
    : t('auctions.createImagePreviewOpen', { name });

  return (
    <CardImageCameraPeek
      imageUrl={imageUrl}
      name={name}
      previewSide="left"
      className={cn(thumbClassName, className)}
      onImageClick={onImageClick}
      ariaLabel={ariaLabel}
      closeModalLabelKey="auctions.createImagePreviewClose"
    />
  );
}
