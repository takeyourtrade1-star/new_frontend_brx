'use client';

import Image from 'next/image';
import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { cn } from '@/lib/utils';

const HOVER_HIDE_MS = 160;
const PREVIEW_W = 300;

type HoverPreview = { url: string; left: number; top: number };

/**
 * Miniatura carta: tap (touch / senza hover) → modale immagine grande + chiudi.
 * Desktop con hover fine → anteprima ingrandita al passaggio del mouse.
 * Il click sulla miniatura non deve propagare al contenitore padre (es. selezione riga).
 */
export function AuctionCardImagePeek({
  imageUrl,
  name,
  className,
  thumbClassName,
  sizes,
}: {
  imageUrl: string | null;
  name: string;
  className?: string;
  thumbClassName?: string;
  sizes?: string;
}) {
  const { t } = useTranslation();
  const [mounted, setMounted] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [hoverPreview, setHoverPreview] = useState<HoverPreview | null>(null);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => setMounted(true), []);

  const cancelHide = useCallback(() => {
    if (hideTimerRef.current) {
      clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }
  }, []);

  const scheduleHide = useCallback(() => {
    hideTimerRef.current = setTimeout(() => setHoverPreview(null), HOVER_HIDE_MS);
  }, []);

  const openHoverPreview = useCallback(
    (e: React.MouseEvent<HTMLElement>) => {
      cancelHide();
      if (!imageUrl || typeof window === 'undefined') return;
      if (!window.matchMedia('(hover: hover)').matches) return;
      if (!window.matchMedia('(pointer: fine)').matches) return;
      const rect = e.currentTarget.getBoundingClientRect();
      const margin = 8;
      let left = rect.right + margin;
      if (left + PREVIEW_W > window.innerWidth - margin) {
        left = Math.max(margin, rect.left - PREVIEW_W - margin);
      }
      let top = rect.top;
      const maxH = Math.min(window.innerHeight * 0.85, 520);
      if (top + maxH > window.innerHeight - margin) {
        top = Math.max(margin, window.innerHeight - margin - maxH);
      }
      setHoverPreview({ url: imageUrl, left, top });
    },
    [cancelHide, imageUrl]
  );

  const handleThumbClick = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (!imageUrl || typeof window === 'undefined') return;
      const coarse = window.matchMedia('(pointer: coarse)').matches;
      const noHover = !window.matchMedia('(hover: hover)').matches;
      if (coarse || noHover) {
        setHoverPreview(null);
        setModalOpen(true);
      }
    },
    [imageUrl]
  );

  useEffect(() => {
    if (!modalOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setModalOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
  }, [modalOpen]);

  const hoverPortal =
    mounted &&
    hoverPreview &&
    createPortal(
      <div
        className="fixed z-[199] rounded-lg border border-gray-200 bg-white p-1 shadow-xl"
        style={{ left: hoverPreview.left, top: hoverPreview.top, width: PREVIEW_W }}
        onMouseEnter={cancelHide}
        onMouseLeave={scheduleHide}
        role="presentation"
      >
        <img
          src={hoverPreview.url}
          alt=""
          className="max-h-[min(520px,85vh)] w-full rounded object-contain"
          draggable={false}
        />
      </div>,
      document.body
    );

  const modalPortal =
    mounted &&
    modalOpen &&
    imageUrl &&
    createPortal(
      <div
        className="fixed inset-0 z-[200] flex items-center justify-center p-4"
        role="dialog"
        aria-modal="true"
        aria-label={name}
      >
        <div
          className="absolute inset-0 bg-black/55 backdrop-blur-[1px]"
          role="presentation"
          onClick={() => setModalOpen(false)}
        />
        <div className="relative z-[1] w-full max-w-[min(92vw,440px)] rounded-xl border border-white/20 bg-white p-3 shadow-2xl">
          <button
            type="button"
            onClick={() => setModalOpen(false)}
            className="absolute -right-2 -top-2 flex h-11 w-11 items-center justify-center rounded-full bg-[#1D3160] text-white shadow-md transition hover:bg-[#2a4370]"
            aria-label={t('auctions.createImagePreviewClose')}
          >
            <X className="h-5 w-5" strokeWidth={2.5} />
          </button>
          <img
            src={imageUrl}
            alt={name}
            className="mx-auto max-h-[min(70vh,580px)] w-full rounded-lg object-contain"
            draggable={false}
          />
          <p className="mt-3 text-center text-sm font-semibold text-[#1D3160]">{name}</p>
        </div>
      </div>,
      document.body
    );

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

  return (
    <>
      <button
        type="button"
        onClick={handleThumbClick}
        onMouseEnter={openHoverPreview}
        onMouseLeave={scheduleHide}
        className={cn(
          'relative shrink-0 overflow-hidden rounded-md border border-gray-200 bg-gray-100 outline-none focus-visible:ring-2 focus-visible:ring-[#FF7300]',
          thumbClassName,
          className
        )}
        aria-label={t('auctions.createImagePreviewOpen', { name })}
      >
        <Image src={imageUrl} alt="" fill className="object-cover" sizes={sizes ?? '64px'} unoptimized />
      </button>
      {hoverPortal}
      {modalPortal}
    </>
  );
}
