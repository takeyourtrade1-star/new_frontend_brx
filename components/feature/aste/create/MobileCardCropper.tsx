'use client';

import { useCallback, useState, type RefObject, type Ref } from 'react';
import { Cropper, CropperRef, RectangleStencil } from 'react-advanced-cropper';
import 'react-advanced-cropper/dist/style.css';
import { RotateCcw, RotateCw, ZoomIn } from 'lucide-react';
import { cn } from '@/lib/utils';

/** Standard MTG card aspect (portrait). */
export const CARD_ASPECT = 63 / 88;

const MAX_CROP_EXPORT_EDGE = 1600;

export type CropMode = 'card' | 'free';

export interface MobileCardCropperProps {
  imageSrc: string;
  mode: CropMode;
  onModeChange: (mode: CropMode) => void;
  modeCardLabel: string;
  modeFreeLabel: string;
  zoomLabel: string;
  rotateLeftLabel: string;
  rotateRightLabel: string;
  cropperRef: RefObject<CropperRef | null>;
  className?: string;
  /**
   * Lettura EXIF interna del cropper. Disattivarla (false) quando l'immagine
   * è già pre-processata: il loader EXIF della libreria legge il blob via XHR
   * senza handler di errore e, se fallisce, lascia il cropper vuoto (nero).
   */
  checkOrientation?: boolean;
  /** Notifica quando il cropper non riesce a caricare l'immagine (altrimenti resta nero senza feedback). */
  onImageLoadError?: () => void;
}

async function canvasToWebpFile(canvas: HTMLCanvasElement): Promise<File> {
  let dw = canvas.width;
  let dh = canvas.height;
  const maxEdge = Math.max(dw, dh);
  if (maxEdge > MAX_CROP_EXPORT_EDGE) {
    const s = MAX_CROP_EXPORT_EDGE / maxEdge;
    dw = Math.max(1, Math.round(dw * s));
    dh = Math.max(1, Math.round(dh * s));
    const scaled = document.createElement('canvas');
    scaled.width = dw;
    scaled.height = dh;
    const ctx = scaled.getContext('2d');
    if (!ctx) throw new Error('Canvas not supported');
    ctx.drawImage(canvas, 0, 0, dw, dh);
    canvas = scaled;
  }

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (b) => {
        if (b) resolve(b);
        else {
          canvas.toBlob(
            (b2) => (b2 ? resolve(b2) : reject(new Error('toBlob failed'))),
            'image/jpeg',
            0.9,
          );
        }
      },
      'image/webp',
      0.86,
    );
  });
  const mime = blob.type || 'image/webp';
  const ext = mime.includes('jpeg') ? 'jpg' : 'webp';
  return new File([blob], `photo.${ext}`, { type: mime });
}

export function MobileCardCropper({
  imageSrc,
  mode,
  onModeChange,
  modeCardLabel,
  modeFreeLabel,
  zoomLabel,
  rotateLeftLabel,
  rotateRightLabel,
  cropperRef,
  className,
  checkOrientation = true,
  onImageLoadError,
}: MobileCardCropperProps) {
  const [zoom, setZoom] = useState(0);

  const handleZoom = useCallback(
    (value: number) => {
      setZoom(value);
      const cropper = cropperRef.current;
      if (!cropper) return;
      cropper.zoomImage(value);
    },
    [cropperRef],
  );

  const rotate = useCallback(
    (deg: number) => {
      cropperRef.current?.rotateImage(deg);
    },
    [cropperRef],
  );

  const handleDoubleTap = useCallback(() => {
    cropperRef.current?.reset();
    setZoom(0);
  }, [cropperRef]);

  return (
    <div className={cn('flex flex-col gap-3', className)}>
      <div className="flex justify-center gap-2">
        <button
          type="button"
          onClick={() => onModeChange('card')}
          className={cn(
            'rounded-full px-3 py-1.5 text-xs font-semibold transition',
            mode === 'card'
              ? 'bg-[#FF7300] text-white'
              : 'border border-white/15 bg-white/5 text-white/70',
          )}
        >
          {modeCardLabel}
        </button>
        <button
          type="button"
          onClick={() => onModeChange('free')}
          className={cn(
            'rounded-full px-3 py-1.5 text-xs font-semibold transition',
            mode === 'free'
              ? 'bg-[#FF7300] text-white'
              : 'border border-white/15 bg-white/5 text-white/70',
          )}
        >
          {modeFreeLabel}
        </button>
      </div>

      <div
        className={cn(
          'relative mx-auto w-full max-w-[min(92vw,320px)] overflow-hidden rounded-2xl bg-[#0a0f1a]',
          mode === 'card' ? 'aspect-[63/88] min-h-[min(58vh,520px)] max-h-[72vh]' : 'h-[min(58vh,520px)]',
          'shadow-[0_20px_50px_-20px_rgba(0,0,0,0.6)] ring-2 ring-[#FF7300]/25',
        )}
        onDoubleClick={handleDoubleTap}
      >
        <div className="pointer-events-none absolute inset-3 z-10 rounded-sm border border-white/20" aria-hidden />
        <div className="pointer-events-none absolute left-3 top-3 z-10 h-4 w-4 border-l-2 border-t-2 border-[#FF7300]/80" aria-hidden />
        <div className="pointer-events-none absolute right-3 top-3 z-10 h-4 w-4 border-r-2 border-t-2 border-[#FF7300]/80" aria-hidden />
        <div className="pointer-events-none absolute bottom-3 left-3 z-10 h-4 w-4 border-b-2 border-l-2 border-[#FF7300]/80" aria-hidden />
        <div className="pointer-events-none absolute bottom-3 right-3 z-10 h-4 w-4 border-b-2 border-r-2 border-[#FF7300]/80" aria-hidden />

        <Cropper
          ref={cropperRef as Ref<CropperRef>}
          src={imageSrc}
          className="h-full w-full"
          checkOrientation={checkOrientation}
          onError={() => onImageLoadError?.()}
          stencilComponent={RectangleStencil}
          stencilProps={
            mode === 'card'
              ? { aspectRatio: CARD_ASPECT, movable: true, resizable: true, grid: true }
              : { movable: true, resizable: true, grid: true }
          }
          defaultSize={({ imageSize, visibleArea }) => ({
            width: (visibleArea || imageSize).width,
            height: (visibleArea || imageSize).height,
          })}
        />
      </div>

      <div className="mx-auto w-full max-w-[min(92vw,320px)] space-y-3 rounded-2xl border border-white/10 bg-white/5 p-3">
        <div className="flex items-center gap-2">
          <ZoomIn className="h-4 w-4 shrink-0 text-[#FF7300]/80" aria-hidden />
          <input
            type="range"
            min={-0.5}
            max={2}
            step={0.01}
            value={zoom}
            onChange={(e) => handleZoom(Number(e.target.value))}
            className="h-2 flex-1 accent-[#FF7300]"
            aria-label={zoomLabel}
          />
        </div>
        <div className="flex items-center justify-center gap-2">
          <button
            type="button"
            onClick={() => rotate(-90)}
            className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-white/80"
          >
            <RotateCcw className="h-3.5 w-3.5" aria-hidden />
            {rotateLeftLabel}
          </button>
          <button
            type="button"
            onClick={() => rotate(90)}
            className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-white/80"
          >
            <RotateCw className="h-3.5 w-3.5" aria-hidden />
            {rotateRightLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

/** Export cropped image from the advanced cropper ref. */
export async function exportMobileCropFile(cropperRef: RefObject<CropperRef | null>): Promise<File> {
  // maxWidth/maxHeight: evita canvas oltre i limiti di area di Safari iOS
  // (canvas troppo grandi vengono restituiti neri/vuoti senza errore).
  const canvas = cropperRef.current?.getCanvas({
    maxWidth: MAX_CROP_EXPORT_EDGE,
    maxHeight: MAX_CROP_EXPORT_EDGE,
  });
  if (!canvas) throw new Error('Impossibile ritagliare l\u2019immagine');
  return canvasToWebpFile(canvas);
}
