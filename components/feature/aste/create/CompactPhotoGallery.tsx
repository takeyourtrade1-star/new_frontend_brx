'use client';

import { useEffect, useMemo } from 'react';
import { AlertCircle, CheckCircle2, Loader2, Trash2 } from 'lucide-react';
import {
  type ListingPhotoSlot,
} from '@/lib/auction/auction-create-draft';
import { cn } from '@/lib/utils';
import type { ListingPhotoUploadStatus } from './AuctionListingPhotoUpload';

function slotPreviewUrl(slot: ListingPhotoSlot): string {
  return slot.kind === 'local' ? URL.createObjectURL(slot.file) : slot.photo.cdn_url;
}

export function CompactPhotoGallery({
  photos,
  uploadStatuses,
  onRemove,
  highlightPhotoId = null,
  onPhotoClick,
}: {
  photos: ListingPhotoSlot[];
  uploadStatuses?: ListingPhotoUploadStatus[];
  onRemove: (index: number) => void;
  highlightPhotoId?: number | null;
  onPhotoClick?: (index: number) => void;
}) {
  const urls = useMemo(() => photos.map(slotPreviewUrl), [photos]);

  useEffect(() => {
    return () => {
      photos.forEach((slot, i) => {
        if (slot.kind === 'local') URL.revokeObjectURL(urls[i]!);
      });
    };
  }, [urls, photos]);

  if (photos.length === 0) {
    return (
      <div className="flex h-40 items-center justify-center rounded-lg border border-dashed border-gray-300 bg-gray-50/80 text-xs text-gray-500">
        Nessuna foto caricata
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
      {photos.map((slot, index) => {
        const url = urls[index];
        const remoteId = slot.kind === 'remote' ? slot.photo.id : null;
        const isHighlighted = highlightPhotoId != null && remoteId === highlightPhotoId;
        const status = uploadStatuses?.[index];

        return (
          <div
            key={`compact-${index}`}
            className={cn(
              'group relative aspect-square overflow-hidden rounded-lg border border-gray-200 bg-white',
              isHighlighted && 'ring-2 ring-emerald-400 ring-offset-2'
            )}
          >
            {/* eslint-disable-next-line @next/next/no-img-element -- blob + CDN URLs */}
            <img
              src={url}
              alt=""
              className="h-full w-full cursor-zoom-in object-cover transition-transform duration-200 group-hover:scale-[1.03]"
              onClick={() => onPhotoClick?.(index)}
            />

            {/* Trash always visible */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onRemove(index);
              }}
              className="absolute right-1.5 top-1.5 rounded-md bg-black/50 p-1 text-white transition hover:bg-red-600/90"
              aria-label="Rimuovi foto"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>

            {/* Upload overlay */}
            <UploadStatusOverlay status={status} />
          </div>
        );
      })}
    </div>
  );
}

function UploadStatusOverlay({
  status,
}: {
  status: ListingPhotoUploadStatus | undefined;
}) {
  if (!status || status.kind === 'idle') return null;

  if (status.kind === 'uploading') {
    const pct = Math.max(0, Math.min(100, status.progress));
    return (
      <div className="pointer-events-none absolute inset-x-0 top-0 flex flex-col gap-1 bg-gradient-to-b from-black/60 to-transparent p-2">
        <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide text-white drop-shadow">
          <Loader2 className="h-3 w-3 animate-spin" aria-hidden />
          {pct}%
        </div>
        <div className="h-1 w-full overflow-hidden rounded-full bg-white/30">
          <div className="h-full bg-[#FF7300] transition-[width] duration-200" style={{ width: `${pct}%` }} />
        </div>
      </div>
    );
  }

  if (status.kind === 'done') {
    return (
      <div className="pointer-events-none absolute right-1.5 top-1.5 inline-flex items-center gap-1 rounded-full bg-emerald-600/90 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-white shadow">
        <CheckCircle2 className="h-2.5 w-2.5" aria-hidden />
        CDN
      </div>
    );
  }

  return (
    <div
      className="pointer-events-none absolute inset-x-0 top-0 flex items-center gap-1.5 bg-red-700/85 px-2 py-1 text-[10px] font-semibold text-white"
      title={status.message}
    >
      <AlertCircle className="h-3 w-3 shrink-0" aria-hidden />
      <span className="truncate">{status.message || 'Errore'}</span>
    </div>
  );
}
