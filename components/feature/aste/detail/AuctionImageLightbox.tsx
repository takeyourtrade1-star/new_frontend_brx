'use client';

import Image from 'next/image';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useTranslation } from '@/lib/i18n/useTranslation';

export function AuctionImageLightbox({
  mainImg,
  onPrev,
  onNext,
  onClose,
}: {
  mainImg: string;
  onPrev: () => void;
  onNext: () => void;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  return (
    <div
      className="fixed inset-0 z-[260] flex items-center justify-center bg-black/90 p-4"
      onClick={onClose}
    >
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onPrev();
        }}
        aria-label={t('auctions.lightbox.prevAria')}
        className="absolute left-4 top-1/2 z-[261] hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/20 text-white transition hover:bg-white/30 md:flex"
      >
        <ChevronLeft className="h-6 w-6" />
      </button>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onNext();
        }}
        aria-label={t('auctions.lightbox.nextAria')}
        className="absolute right-4 top-1/2 z-[261] hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/20 text-white transition hover:bg-white/30 md:flex"
      >
        <ChevronRight className="h-6 w-6" />
      </button>
      <button
        type="button"
        onClick={onClose}
        aria-label={t('common.close')}
        className="absolute right-4 top-4 z-[261] rounded-full bg-white/20 px-3 py-1 text-sm font-semibold text-white transition hover:bg-white/30"
      >
        {t('common.close')}
      </button>
      <div className="relative h-[82vh] w-full max-w-5xl" onClick={(e) => e.stopPropagation()}>
        <Image src={mainImg} alt="" fill className="object-contain" sizes="100vw" unoptimized />
      </div>
    </div>
  );
}
