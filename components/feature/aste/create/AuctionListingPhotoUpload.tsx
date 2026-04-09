'use client';

import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import { Camera, ImageIcon, Trash2, Upload } from 'lucide-react';
import { useTranslation } from '@/lib/i18n/useTranslation';
import {
  AUCTION_LISTING_PHOTO_MAX,
  AUCTION_LISTING_PHOTO_MIN,
} from '@/lib/auction/auction-create-draft';
import { cn } from '@/lib/utils';

function isImageFile(file: File) {
  return file.type.startsWith('image/');
}

export function AuctionListingPhotoUpload({
  photos,
  onPhotosChange,
  compact = false,
}: {
  photos: File[];
  onPhotosChange: (next: File[]) => void;
  /** Layout più stretto (es. wizard embedded nella scheda prodotto). */
  compact?: boolean;
}) {
  const { t } = useTranslation();
  const baseId = useId();
  const previewUrls = useMemo(() => photos.map((f) => URL.createObjectURL(f)), [photos]);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const galleryRefs = useRef<(HTMLInputElement | null)[]>([]);
  const cameraRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    return () => {
      previewUrls.forEach((u) => URL.revokeObjectURL(u));
    };
  }, [previewUrls]);

  const canAddMore = photos.length < AUCTION_LISTING_PHOTO_MAX;

  const appendFiles = useCallback(
    (incoming: File[]) => {
      let next = [...photos];
      for (const f of incoming) {
        if (!isImageFile(f)) continue;
        if (next.length >= AUCTION_LISTING_PHOTO_MAX) break;
        next.push(f);
      }
      if (next.length > photos.length) onPhotosChange(next);
    },
    [photos, onPhotosChange]
  );

  const replaceAt = useCallback(
    (index: number, file: File | null) => {
      if (file === null) {
        onPhotosChange(photos.filter((_, j) => j !== index));
        return;
      }
      if (!isImageFile(file)) return;
      const next = [...photos];
      if (index < next.length) next[index] = file;
      else if (index === next.length && next.length < AUCTION_LISTING_PHOTO_MAX) next.push(file);
      onPhotosChange(next);
    },
    [photos, onPhotosChange]
  );

  const handleFileListAt = useCallback(
    (index: number, fileList: FileList | null) => {
      const file = fileList?.[0];
      if (!file) return;
      replaceAt(index, file);
    },
    [replaceAt]
  );

  const handleDrop = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverIndex(null);
    const dt = e.dataTransfer.files;
    if (index < photos.length) {
      const file = dt?.[0];
      if (file && isImageFile(file)) replaceAt(index, file);
    } else {
      appendFiles(Array.from(dt ?? []));
    }
  };

  const slotCount = photos.length + (canAddMore ? 1 : 0);
  const setGalleryRef = (i: number, el: HTMLInputElement | null) => {
    galleryRefs.current[i] = el;
  };
  const setCameraRef = (i: number, el: HTMLInputElement | null) => {
    cameraRefs.current[i] = el;
  };

  return (
    <div className={cn('space-y-5', compact && 'space-y-3')}>
      <p className={cn('text-sm text-gray-600', compact && 'text-xs leading-snug')}>
        {t('auctions.createStepPhotosIntro', {
          min: AUCTION_LISTING_PHOTO_MIN,
          max: AUCTION_LISTING_PHOTO_MAX,
        })}
      </p>
      <p className={cn('text-xs font-semibold text-[#1D3160]/80', compact && 'text-[11px]')}>
        {t('auctions.createPhotoCountHint', {
          current: photos.length,
          min: AUCTION_LISTING_PHOTO_MIN,
          max: AUCTION_LISTING_PHOTO_MAX,
        })}
      </p>
      <div className={cn('grid gap-4 sm:grid-cols-2', compact && 'gap-3')}>
        {photos.map((_, slot) => {
          const url = previewUrls[slot];
          const galleryId = `${baseId}-gallery-${slot}`;
          const cameraId = `${baseId}-camera-${slot}`;

          return (
            <div key={`filled-${slot}`} className="flex flex-col gap-2">
              <p className="text-xs font-bold uppercase tracking-wide text-gray-600">
                {t('auctions.createPhotoSlotLabel', { n: slot + 1 })}
              </p>
              <div
                role="group"
                aria-label={t('auctions.createPhotoSlotLabel', { n: slot + 1 })}
                onDragEnter={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setDragOverIndex(slot);
                }}
                onDragOver={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  e.dataTransfer.dropEffect = 'copy';
                }}
                onDragLeave={(e) => {
                  e.preventDefault();
                  if (!e.currentTarget.contains(e.relatedTarget as Node)) setDragOverIndex(null);
                }}
                onDrop={(e) => handleDrop(e, slot)}
                className={cn(
                  'relative flex min-h-[200px] flex-col overflow-hidden rounded-xl border-2 border-dashed bg-gray-50/80 transition-colors',
                  compact && 'min-h-[140px] rounded-lg',
                  dragOverIndex === slot ? 'border-[#FF7300] bg-orange-50/60' : 'border-gray-300',
                  'border-solid border-gray-200 bg-white'
                )}
              >
                <input
                  ref={(el) => setGalleryRef(slot, el)}
                  id={galleryId}
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  onChange={(e) => {
                    handleFileListAt(slot, e.target.files);
                    e.target.value = '';
                  }}
                />
                <input
                  ref={(el) => setCameraRef(slot, el)}
                  id={cameraId}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="sr-only"
                  onChange={(e) => {
                    handleFileListAt(slot, e.target.files);
                    e.target.value = '';
                  }}
                />

                {url ? (
                  <div className="relative flex flex-1 flex-col">
                    {/* eslint-disable-next-line @next/next/no-img-element -- blob URLs */}
                    <img
                      src={url}
                      alt=""
                      className={cn('h-48 w-full object-contain sm:h-56', compact && 'h-36 sm:h-40')}
                    />
                    <div className="flex flex-wrap gap-2 border-t border-gray-100 bg-white/95 p-2">
                      <button
                        type="button"
                        onClick={() => replaceAt(slot, null)}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-2.5 py-1.5 text-xs font-semibold text-red-800 transition hover:bg-red-100"
                      >
                        <Trash2 className="h-3.5 w-3.5" aria-hidden />
                        {t('auctions.createPhotoRemove')}
                      </button>
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          );
        })}

        {canAddMore && (
          <div className="flex flex-col gap-2">
            <p className="text-xs font-bold uppercase tracking-wide text-gray-600">
              {t('auctions.createPhotoSlotLabel', { n: photos.length + 1 })}
              {photos.length + 1 > AUCTION_LISTING_PHOTO_MIN ? (
                <span className="ml-1 font-normal normal-case text-gray-400">({t('auctions.createPhotoOptionalSlot')})</span>
              ) : null}
            </p>
            <div
              role="group"
              aria-label={t('auctions.createPhotoAddSlotAria')}
              onDragEnter={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setDragOverIndex(photos.length);
              }}
              onDragOver={(e) => {
                e.preventDefault();
                e.stopPropagation();
                e.dataTransfer.dropEffect = 'copy';
              }}
              onDragLeave={(e) => {
                e.preventDefault();
                if (!e.currentTarget.contains(e.relatedTarget as Node)) setDragOverIndex(null);
              }}
              onDrop={(e) => handleDrop(e, photos.length)}
              className={cn(
                'relative flex min-h-[200px] flex-col overflow-hidden rounded-xl border-2 border-dashed bg-gray-50/80 transition-colors',
                compact && 'min-h-[140px] rounded-lg',
                dragOverIndex === photos.length ? 'border-[#FF7300] bg-orange-50/60' : 'border-gray-300'
              )}
            >
              <input
                ref={(el) => setGalleryRef(photos.length, el)}
                id={`${baseId}-gallery-add`}
                type="file"
                accept="image/*"
                className="sr-only"
                onChange={(e) => {
                  appendFiles(Array.from(e.target.files ?? []));
                  e.target.value = '';
                }}
              />
              <input
                ref={(el) => setCameraRef(photos.length, el)}
                id={`${baseId}-camera-add`}
                type="file"
                accept="image/*"
                capture="environment"
                className="sr-only"
                onChange={(e) => {
                  appendFiles(Array.from(e.target.files ?? []));
                  e.target.value = '';
                }}
              />
              <div
                className={cn(
                  'flex flex-1 flex-col items-center justify-center gap-3 p-4 text-center',
                  compact && 'gap-2 p-3'
                )}
              >
                <Upload className={cn('h-10 w-10 text-gray-400', compact && 'h-8 w-8')} strokeWidth={1.5} aria-hidden />
                <p className={cn('text-xs text-gray-600', compact && 'text-[11px] leading-snug')}>
                  {t('auctions.createPhotoDropHint')}
                </p>
                <div className="flex w-full max-w-[240px] flex-col gap-2 sm:flex-row sm:justify-center">
                  <button
                    type="button"
                    onClick={() => galleryRefs.current[photos.length]?.click()}
                    className="inline-flex items-center justify-center gap-2 rounded-lg border border-[#1D3160]/20 bg-white px-3 py-2 text-xs font-semibold text-[#1D3160] shadow-sm transition hover:bg-gray-50"
                  >
                    <ImageIcon className="h-4 w-4 shrink-0" aria-hidden />
                    {t('auctions.createPhotoChooseFile')}
                  </button>
                  <button
                    type="button"
                    onClick={() => cameraRefs.current[photos.length]?.click()}
                    className="btn-orange-outline-glow inline-flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-xs"
                  >
                    <Camera className="h-4 w-4 shrink-0" aria-hidden />
                    {t('auctions.createPhotoTakePicture')}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      <p className={cn('text-xs text-gray-500', compact && 'text-[11px] leading-snug')}>
        {t('auctions.createStepPhotosFormats')}
      </p>
    </div>
  );
}

export function listingPhotosComplete(photos: File[]): boolean {
  return photos.length >= AUCTION_LISTING_PHOTO_MIN && photos.length <= AUCTION_LISTING_PHOTO_MAX;
}

/** Anteprima in revisione (revoca blob URL al cambio). */
export function ListingPhotoThumbnailsRow({ photos }: { photos: File[] }) {
  const urls = useMemo(() => photos.map((f) => URL.createObjectURL(f)), [photos]);

  useEffect(() => {
    return () => {
      urls.forEach((u) => URL.revokeObjectURL(u));
    };
  }, [urls]);

  if (photos.length === 0) {
    return <span className="text-sm text-gray-500">—</span>;
  }

  return (
    <div className="flex flex-wrap gap-3">
      {urls.map((u, i) => (
        // eslint-disable-next-line @next/next/no-img-element -- blob URLs
        <img key={i} src={u} alt="" className="h-24 w-24 rounded-lg border border-gray-200 object-cover sm:h-28 sm:w-28" />
      ))}
    </div>
  );
}
