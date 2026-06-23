'use client';

import type { Ref } from 'react';
import Image from 'next/image';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import type { ListingItem } from '@/lib/api/sync-client';
import { EBARTEX_LOGO_PLACEHOLDER } from '@/lib/product-detail/product-detail-view-types';
import { CardImageActionContent } from '@/components/ui/CardImageActionContent';

export interface ProductDetailLightboxProps {
  isOpen: boolean;
  lightboxRef: Ref<HTMLDivElement>;
  headerHeight: number;
  showImagePlaceholder: boolean;
  cardImages: string[];
  currentImageIndex: number;
  cardName?: string;
  title: string;
  buyNowLabel: string;
  onClose: () => void;
  onTouchStart: (e: React.TouchEvent) => void;
  onTouchMove: (e: React.TouchEvent) => void;
  onTouchEnd: () => void;
  onPrevImage: () => void;
  onNextImage: () => void;
  onShare: () => void;
  onOpenQtyPopup: (item: ListingItem, sourceEl: HTMLElement, imageSrc?: string) => void;
}

export function ProductDetailLightbox({
  isOpen,
  lightboxRef,
  headerHeight,
  showImagePlaceholder,
  cardImages,
  currentImageIndex,
  cardName,
  title,
  buyNowLabel,
  onClose,
  onTouchStart,
  onTouchMove,
  onTouchEnd,
  onPrevImage,
  onNextImage,
  onShare,
  onOpenQtyPopup,
}: ProductDetailLightboxProps) {
  if (!isOpen) return null;

  return (
    <div
      ref={lightboxRef}
      className="fixed inset-0 z-50 bg-black/95"
      onClick={onClose}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      <button
        onClick={(e) => { e.stopPropagation(); onClose(); }}
        className="absolute top-5 right-5 p-2.5 rounded-full bg-white/20 backdrop-blur-md border border-white/30 hover:bg-white/40 text-white transition-colors z-[100] shadow-lg"
        aria-label="Chiudi"
      >
        <X className="h-6 w-6 drop-shadow-md" />
      </button>

      <div
        className="hidden sm:flex fixed left-1/2 -translate-x-1/2 items-center justify-center"
        style={{ top: `calc(${headerHeight}px + 5vh)`, bottom: '5vh' }}
        onClick={onClose}
      >
        {cardImages.length > 1 && (
          <span className="absolute -top-8 left-1/2 -translate-x-1/2 text-white/70 text-sm font-medium">
            {currentImageIndex + 1} / {cardImages.length}
          </span>
        )}
        {!showImagePlaceholder && cardImages[currentImageIndex] && (
          <div
            className="relative h-full aspect-[63/88] max-w-[85vw]"
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              src={cardImages[currentImageIndex]}
              alt={cardName ?? title}
              fill
              className="object-contain rounded-sm shadow-2xl"
              sizes="85vw"
              unoptimized
              draggable={false}
            />
          </div>
        )}
        {showImagePlaceholder && (
          <div className="flex flex-col items-center justify-center text-white/70" onClick={(e) => e.stopPropagation()}>
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

      <div
        className="sm:hidden fixed inset-0 flex flex-col items-center justify-center"
        onClick={onClose}
      >
        <CardImageActionContent
          imageUrl={cardImages[currentImageIndex]}
          showPlaceholder={showImagePlaceholder}
          name={cardName ?? title}
          buyLabel={buyNowLabel}
          onBuy={(e) => {
            onOpenQtyPopup(
              { item_id: 0, seller_id: 'lightbox', seller_display_name: '', country: null, quantity: 1, price_cents: 0, condition: null, mtg_language: null },
              e.currentTarget,
              cardImages[currentImageIndex],
            );
          }}
          onShare={onShare}
        />
      </div>

      {cardImages.length > 1 && (
        <>
          <button
            onClick={(e) => { e.stopPropagation(); onPrevImage(); }}
            className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
            aria-label="Immagine precedente"
          >
            <ChevronLeft className="h-8 w-8" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onNextImage(); }}
            className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
            aria-label="Immagine successiva"
          >
            <ChevronRight className="h-8 w-8" />
          </button>
        </>
      )}
    </div>
  );
}
