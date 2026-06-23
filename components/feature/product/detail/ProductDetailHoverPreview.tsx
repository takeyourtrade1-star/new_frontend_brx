'use client';

import Image from 'next/image';
import { EBARTEX_LOGO_PLACEHOLDER } from '@/lib/product-detail/product-detail-view-types';

export interface ProductDetailHoverPreviewProps {
  open: boolean;
  headerHeight: number;
  showImagePlaceholder: boolean;
  cardImages: string[];
  currentImageIndex: number;
  cardName?: string;
  title: string;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
}

export function ProductDetailHoverPreview({
  open,
  headerHeight,
  showImagePlaceholder,
  cardImages,
  currentImageIndex,
  cardName,
  title,
  onMouseEnter,
  onMouseLeave,
}: ProductDetailHoverPreviewProps) {
  if (!open) return null;

  return (
    <div
      className="hidden sm:flex fixed left-1/2 -translate-x-1/2 z-[60] items-center justify-center"
      style={{ top: `calc(${headerHeight}px + 5vh)`, bottom: '5vh' }}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      {!showImagePlaceholder && cardImages[currentImageIndex] && (
        <div className="relative h-full aspect-[63/88] max-w-[85vw]">
          <Image
            src={cardImages[currentImageIndex]}
            alt={cardName ?? title}
            fill
            className="object-contain rounded-lg shadow-[0_20px_60px_rgba(0,0,0,0.35)]"
            sizes="85vw"
            unoptimized
            draggable={false}
          />
        </div>
      )}
      {showImagePlaceholder && (
        <div className="flex flex-col items-center justify-center text-zinc-700">
          <Image
            src={EBARTEX_LOGO_PLACEHOLDER}
            alt="Ebartex"
            width={96}
            height={96}
            className="w-24 h-24 object-contain opacity-50"
            draggable={false}
            unoptimized={false}
          />
          <p className="mt-4 text-sm">Immagine non disponibile</p>
        </div>
      )}
    </div>
  );
}
