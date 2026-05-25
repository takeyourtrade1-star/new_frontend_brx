'use client';

import Image from 'next/image';
import { X } from 'lucide-react';
import { createPortal } from 'react-dom';
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type MouseEvent as ReactMouseEvent,
} from 'react';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { cn } from '@/lib/utils';
import {
  CARD_PREVIEW_WIDTH_DESKTOP,
  CARD_PREVIEW_WIDTH_MOBILE,
  getCardImagePreviewLayout,
} from '@/lib/cardImagePreviewLayout';

const HOVER_HIDE_MS = 140;

type HoverPreview = { url: string; name: string; left: number; top: number; width: number };

/**
 * Ritaglio parte alta della carta (come ristampe / CardTrader) con anteprima grande al hover.
 */
export function CardArtStripHoverPreview({
  imageUrl,
  name,
  previewSide = 'right',
  className,
  stripClassName,
}: {
  imageUrl: string | null;
  name: string;
  previewSide?: 'left' | 'right';
  className?: string;
  stripClassName?: string;
}) {
  const { t } = useTranslation();
  const [mounted, setMounted] = useState(false);
  const [hoverPreview, setHoverPreview] = useState<HoverPreview | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const stripRef = useRef<HTMLDivElement>(null);

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

  const openHoverPreview = useCallback(() => {
    cancelHide();
    if (!imageUrl || typeof window === 'undefined') return;
    if (!window.matchMedia('(hover: hover)').matches) return;
    const anchorRect = stripRef.current?.getBoundingClientRect();
    if (!anchorRect) return;
    const preferredWidth =
      window.innerWidth < 640 ? CARD_PREVIEW_WIDTH_MOBILE : CARD_PREVIEW_WIDTH_DESKTOP;
    const { left, top, width } = getCardImagePreviewLayout(
      anchorRect,
      preferredWidth,
      previewSide
    );
    setHoverPreview({ url: imageUrl, name, left, top, width });
  }, [cancelHide, imageUrl, name, previewSide]);

  const handleStripClick = useCallback(
    (e: ReactMouseEvent) => {
      if (!imageUrl || typeof window === 'undefined') return;
      const coarse = window.matchMedia('(pointer: coarse)').matches;
      const noHover = !window.matchMedia('(hover: hover)').matches;
      if (coarse || noHover) {
        e.preventDefault();
        e.stopPropagation();
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
    const onKey = (ev: KeyboardEvent) => {
      if (ev.key === 'Escape') setModalOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
  }, [modalOpen]);

  const stripInner = !imageUrl ? (
    <div
      className={cn(
        'flex h-[4.25rem] w-[2.875rem] items-center justify-center rounded-md bg-zinc-100 text-[9px] font-semibold text-zinc-400',
        stripClassName
      )}
    >
      N/A
    </div>
  ) : (
    <div
      ref={stripRef}
      role="button"
      tabIndex={0}
      className={cn(
        'relative h-[4.25rem] w-[2.875rem] shrink-0 overflow-hidden rounded-md bg-zinc-900/[0.04] ring-1 ring-zinc-200/80 transition-shadow duration-200',
        'cursor-zoom-in hover:ring-[#FF7300]/40 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF7300]/50',
        stripClassName
      )}
      onMouseEnter={openHoverPreview}
      onMouseLeave={scheduleHide}
      onClick={handleStripClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleStripClick(e as unknown as ReactMouseEvent);
        }
      }}
      aria-label={`${t('search.previewCardImage')}: ${name}`}
    >
      <Image
        src={imageUrl}
        alt=""
        fill
        className="object-cover object-top"
        sizes="46px"
        unoptimized
      />
    </div>
  );

  const hoverPortal =
    mounted &&
    hoverPreview &&
    createPortal(
      <div
        role="presentation"
        className="fixed z-[250] pointer-events-auto animate-in fade-in zoom-in-95 duration-150"
        style={{
          left: hoverPreview.left,
          top: hoverPreview.top,
          width: hoverPreview.width,
        }}
        onMouseEnter={cancelHide}
        onMouseLeave={scheduleHide}
      >
        <div className="relative w-full overflow-hidden rounded-lg border border-gray-200/90 bg-white shadow-[0_12px_40px_rgba(0,0,0,0.28)] ring-1 ring-black/5">
          <div className="relative aspect-[63/88] w-full bg-gray-50">
            <Image
              src={hoverPreview.url}
              alt={hoverPreview.name}
              fill
              className="object-contain p-0.5"
              sizes="208px"
              unoptimized
            />
          </div>
        </div>
      </div>,
      document.body
    );

  const modalPortal =
    mounted &&
    modalOpen &&
    imageUrl &&
    createPortal(
      <div
        className="fixed inset-0 z-[300] flex items-center justify-center bg-black/60 p-4"
        role="dialog"
        aria-modal="true"
        aria-label={`${t('search.previewCardImage')}: ${name}`}
        onClick={() => setModalOpen(false)}
      >
        <button
          type="button"
          className="absolute right-3 top-3 z-[1] rounded-full bg-white/95 p-2 shadow-md ring-1 ring-black/10 hover:bg-white"
          aria-label={t('search.closePreviewModal')}
          onClick={(e) => {
            e.stopPropagation();
            setModalOpen(false);
          }}
        >
          <X className="h-6 w-6 text-gray-800" aria-hidden />
        </button>
        <div
          className="relative max-h-[85vh] w-full max-w-[min(92vw,320px)] overflow-hidden rounded-xl border border-white/20 bg-white shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="relative aspect-[63/88] w-full bg-gray-100">
            <Image src={imageUrl} alt={name} fill className="object-contain" sizes="320px" unoptimized />
          </div>
          <p className="px-4 py-3 text-center text-sm font-semibold text-[#1D3160]">{name}</p>
        </div>
      </div>,
      document.body
    );

  return (
    <div className={cn('relative shrink-0', className)}>
      {stripInner}
      {hoverPortal}
      {modalPortal}
    </div>
  );
}
