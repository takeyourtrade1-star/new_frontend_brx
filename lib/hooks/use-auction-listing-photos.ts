'use client';

import { useCallback, useEffect, useMemo, useState, type Dispatch, type SetStateAction } from 'react';
import {
  AUCTION_LISTING_PHOTO_MAX,
  type AuctionCreateDraft,
  type ListingPhotoSlot,
} from '@/lib/auction/auction-create-draft';
import { slotIncludedIn } from '@/lib/auction/build-auction-create-payload';
import type { PhotoUploadEntry } from '@/lib/auction/build-auction-create-payload';
import {
  deletePhoto as deleteUploadedPhoto,
  uploadPhoto,
} from '@/lib/api/auction-photo-client';
import { usePhotoPairingSession } from '@/lib/hooks/use-photo-pairing-session';
import {
  listingPhotosReady,
  type ListingPhotoUploadStatus,
} from '@/components/feature/aste/create/AuctionListingPhotoUpload';
import type { WizardStepId } from '@/lib/auction/auction-create-wizard-types';

type UseAuctionListingPhotosArgs = {
  draft: AuctionCreateDraft;
  setDraft: Dispatch<SetStateAction<AuctionCreateDraft>>;
  stepId: WizardStepId;
  isEmbedded: boolean;
  onErrorClear: () => void;
};

export function useAuctionListingPhotos({
  draft,
  setDraft,
  stepId,
  isEmbedded,
  onErrorClear,
}: UseAuctionListingPhotosArgs) {
  const [photoUploads, setPhotoUploads] = useState<Map<File, PhotoUploadEntry>>(
    () => new Map()
  );

  const startUploadFor = useCallback((file: File) => {
    const abort = new AbortController();
    setPhotoUploads((prev) => {
      const next = new Map(prev);
      next.set(file, { status: 'uploading', progress: 0, abort });
      return next;
    });

    uploadPhoto(file, {
      signal: abort.signal,
      onProgress: (pct) => {
        setPhotoUploads((prev) => {
          const entry = prev.get(file);
          if (!entry || entry.status !== 'uploading') return prev;
          const next = new Map(prev);
          next.set(file, { ...entry, progress: pct });
          return next;
        });
      },
    })
      .then((photo) => {
        setPhotoUploads((prev) => {
          if (!prev.has(file)) return prev;
          const next = new Map(prev);
          next.set(file, { status: 'done', progress: 100, photo, abort });
          return next;
        });
      })
      .catch((err: unknown) => {
        if (abort.signal.aborted) return;
        const message =
          err instanceof Error ? err.message : 'Upload fallito. Riprova.';
        setPhotoUploads((prev) => {
          if (!prev.has(file)) return prev;
          const next = new Map(prev);
          next.set(file, { status: 'error', progress: 0, error: message, abort });
          return next;
        });
      });
  }, []);

  const setListingPhotos = useCallback(
    (next: ListingPhotoSlot[]) => {
      setDraft((d) => {
        const previous = d.listingPhotos;

        for (const old of previous) {
          if (slotIncludedIn(next, old)) continue;
          if (old.kind === 'local') {
            const entry = photoUploads.get(old.file);
            if (!entry) continue;
            entry.abort.abort();
            if (entry.status === 'done' && entry.photo) {
              void deleteUploadedPhoto(entry.photo.id).catch(() => {});
            }
            setPhotoUploads((prev) => {
              if (!prev.has(old.file)) return prev;
              const m = new Map(prev);
              m.delete(old.file);
              return m;
            });
          } else {
            void deleteUploadedPhoto(old.photo.id).catch(() => {});
          }
        }

        for (const s of next) {
          if (slotIncludedIn(previous, s)) continue;
          if (s.kind === 'local') {
            startUploadFor(s.file);
          }
        }

        return { ...d, listingPhotos: next };
      });
      onErrorClear();
    },
    [photoUploads, setDraft, startUploadFor, onErrorClear]
  );

  const pairing = usePhotoPairingSession({
    stepId,
    photoStepId: isEmbedded ? 'review' : 'photos',
    contextType: 'auction',
    qrBasePath: '/c/asta-foto',
    maxPhotos: AUCTION_LISTING_PHOTO_MAX,
    listingPhotos: draft.listingPhotos,
    setListingPhotos,
    toastMessageKey: 'auctions.createPhotoReceivedFromPhone',
    autoCloseOnFirstRemotePhoto: isEmbedded,
  });

  const appendEmbeddedPhotos = useCallback(
    (fileList: FileList | null) => {
      if (!fileList?.length) return;
      const next = [...draft.listingPhotos];
      for (const f of Array.from(fileList)) {
        if (!f.type.startsWith('image/')) continue;
        if (next.length >= AUCTION_LISTING_PHOTO_MAX) break;
        next.push({ kind: 'local', file: f });
      }
      if (next.length > draft.listingPhotos.length) setListingPhotos(next);
    },
    [draft.listingPhotos, setListingPhotos]
  );

  const retryFailedUpload = useCallback(
    (file: File) => {
      setPhotoUploads((prev) => {
        if (!prev.has(file)) return prev;
        const m = new Map(prev);
        m.delete(file);
        return m;
      });
      startUploadFor(file);
    },
    [startUploadFor]
  );

  const photoUploadStatuses = useMemo<ListingPhotoUploadStatus[]>(
    () =>
      draft.listingPhotos.map((slot) => {
        if (slot.kind === 'remote') {
          return { kind: 'done', cdnUrl: slot.photo.cdn_url };
        }
        const entry = photoUploads.get(slot.file);
        if (!entry) return { kind: 'idle' };
        if (entry.status === 'uploading') {
          return { kind: 'uploading', progress: entry.progress };
        }
        if (entry.status === 'done' && entry.photo) {
          return { kind: 'done', cdnUrl: entry.photo.cdn_url };
        }
        return { kind: 'error', message: entry.error || 'Upload fallito' };
      }),
    [draft.listingPhotos, photoUploads]
  );

  const allPhotosUploaded = useMemo(
    () => listingPhotosReady(draft.listingPhotos, photoUploadStatuses),
    [draft.listingPhotos, photoUploadStatuses]
  );

  const failedUploadFiles = useMemo(
    () =>
      draft.listingPhotos
        .filter(
          (s): s is Extract<ListingPhotoSlot, { kind: 'local' }> =>
            s.kind === 'local' && photoUploads.get(s.file)?.status === 'error'
        )
        .map((s) => s.file),
    [draft.listingPhotos, photoUploads]
  );

  const lightboxUrls = useMemo(
    () =>
      draft.listingPhotos.map((slot) =>
        slot.kind === 'local' ? URL.createObjectURL(slot.file) : slot.photo.cdn_url
      ),
    [draft.listingPhotos]
  );

  useEffect(() => {
    return () => {
      draft.listingPhotos.forEach((slot, i) => {
        if (slot.kind === 'local') URL.revokeObjectURL(lightboxUrls[i]!);
      });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lightboxUrls]);

  return {
    photoUploads,
    setListingPhotos,
    appendEmbeddedPhotos,
    retryFailedUpload,
    photoUploadStatuses,
    allPhotosUploaded,
    failedUploadFiles,
    lightboxUrls,
    pairing,
  };
}

export type { PhotoUploadEntry };
