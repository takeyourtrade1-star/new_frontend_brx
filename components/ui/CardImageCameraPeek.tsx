'use client';

import Image from 'next/image';
import { Camera, X } from 'lucide-react';
import { createPortal } from 'react-dom';
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type MouseEvent as ReactMouseEvent,
} from 'react';
import { useTranslation } from '@/lib/i18n/useTranslation';
import type { MessageKey } from '@/lib/i18n/messages/en';
import { cn } from '@/lib/utils';
import {
  CARD_PREVIEW_WIDTH_DESKTOP,
  CARD_PREVIEW_WIDTH_MOBILE,
  getCardImagePreviewLayout,
} from '@/lib/cardImagePreviewLayout';

const HOVER_HIDE_MS = 140;

type HoverPreview = { url: string; name: string; left: number; top: number; width: number };

export const CARD_IMAGE_CAMERA_TRIGGER_CLASS =
  'relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/90 bg-gradient-to-b from-white via-[#f6f7fa] to-[#e8ebf0] shadow-[0_1px_2px_rgba(15,23,42,0.06),inset_0_1px_0_rgba(255,255,255,0.95)] transition-[box-shadow,border-color,transform,background] duration-200 ease-out hover:border-[#FF7300]/45 hover:from-orange-50/95 hover:via-white hover:to-[#f2f4f8] hover:shadow-[0_2px_10px_rgba(255,115,0,0.14),0_0_0_3px_rgba(255,115,0,0.1)] active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF7300]/40 focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-white/90 disabled:hover:from-white disabled:hover:via-[#f6f7fa] disabled:hover:to-[#e8ebf0] disabled:hover:shadow-[0_1px_2px_rgba(15,23,42,0.06)] disabled:active:scale-100';

/**
 * Trigger con icona fotocamera (senza miniatura). Hover desktop → anteprima a sinistra; tap → modale.
 */
export function CardImageCameraPeek({
  imageUrl,
  name,
  className,
  previewSide = 'left',
  ariaLabelKey = 'search.previewCardImage',
  ariaLabel,
  closeModalLabelKey = 'search.closePreviewModal',
  onImageClick,
  onModalOpenChange,
}: {
  imageUrl: string | null;
  name: string;
  className?: string;
  previewSide?: 'left' | 'right';
  ariaLabelKey?: MessageKey;
  /** Se impostato, ha priorità su ariaLabelKey (es. messaggi con {name}). */
  ariaLabel?: string;
  closeModalLabelKey?: MessageKey;
  onImageClick?: () => void;
  onModalOpenChange?: (open: boolean) => void;
}) {
  const { t } = useTranslation();
  const triggerAriaLabel = ariaLabel ?? t(ariaLabelKey);
  const [mounted, setMounted] = useState(false);
  const [hoverPreview, setHoverPreview] = useState<HoverPreview | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    onModalOpenChange?.(modalOpen);
  }, [modalOpen, onModalOpenChange]);

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
    (e: ReactMouseEvent<HTMLButtonElement>) => {
      cancelHide();
      if (!imageUrl || typeof window === 'undefined') return;
      if (!window.matchMedia('(hover: hover)').matches) return;
      const anchorRect = e.currentTarget.getBoundingClientRect();
      const preferredWidth =
        window.innerWidth < 640 ? CARD_PREVIEW_WIDTH_MOBILE : CARD_PREVIEW_WIDTH_DESKTOP;
      const { left, top, width } = getCardImagePreviewLayout(
        anchorRect,
        preferredWidth,
        previewSide
      );
      setHoverPreview({ url: imageUrl, name, left, top, width });
    },
    [cancelHide, imageUrl, name, previewSide]
  );

  const handleClick = useCallback(
    (e: ReactMouseEvent<HTMLButtonElement>) => {
      e.preventDefault();
      e.stopPropagation();
      if (onImageClick) {
        onImageClick();
        return;
      }
      if (!imageUrl || typeof window === 'undefined') return;
      const coarse = window.matchMedia('(pointer: coarse)').matches;
      const noHover = !window.matchMedia('(hover: hover)').matches;
      if (coarse || noHover) {
        setHoverPreview(null);
        setModalOpen(true);
      }
    },
    [imageUrl, onImageClick]
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
        aria-label={t(ariaLabelKey)}
        onClick={() => setModalOpen(false)}
      >
        <button
          type="button"
          className="absolute right-3 top-3 z-[1] rounded-full bg-white/95 p-2 shadow-md ring-1 ring-black/10 hover:bg-white"
          aria-label={t(closeModalLabelKey)}
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
            <Image
              src={imageUrl}
              alt={name}
              fill
              className="object-contain"
              sizes="(max-width: 640px) 92vw, 320px"
              unoptimized
            />
          </div>
          <p className="px-4 py-3 text-center text-sm font-semibold text-[#1D3160]">{name}</p>
        </div>
      </div>,
      document.body
    );

  return (
    <>
      <button
        type="button"
        disabled={!imageUrl}
        className={cn(CARD_IMAGE_CAMERA_TRIGGER_CLASS, 'group', className)}
        aria-label={triggerAriaLabel}
        onClick={handleClick}
        onMouseEnter={openHoverPreview}
        onMouseLeave={scheduleHide}
      >
        <span
          className="pointer-events-none absolute inset-[3px] rounded-full bg-white/50 opacity-0 transition-opacity duration-200 group-hover:opacity-100 group-disabled:opacity-0"
          aria-hidden
        />
        <Camera
          className={cn(
            'relative h-[15px] w-[15px] transition-[color,transform] duration-200 group-hover:scale-105',
            imageUrl ? 'text-[#5c6b7a] group-hover:text-[#FF7300]' : 'text-gray-300'
          )}
          strokeWidth={2}
          aria-hidden
        />
      </button>
      {hoverPortal}
      {modalPortal}
    </>
  );
}
