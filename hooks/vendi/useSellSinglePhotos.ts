import { useCallback, useEffect, useMemo, useRef, useState, type Dispatch, type SetStateAction } from 'react';
import { AUCTION_LISTING_PHOTO_MAX, type ListingPhotoSlot } from '@/lib/auction/auction-create-draft';
import {
  deletePhoto as deleteUploadedPhoto,
  uploadPhoto,
  type UploadedPhoto,
} from '@/lib/api/listing-photo-client';
import { listingPhotosReady, type ListingPhotoUploadStatus } from '@/components/feature/vendi/singles/ListingPhotoUpload';
import type { SellSingleDraft } from '@/lib/marketplace/sell-single-draft';

type PhotoUploadEntry = {
  status: 'uploading' | 'done' | 'error';
  progress: number;
  photo?: UploadedPhoto;
  error?: string;
  abort: AbortController;
};

function slotIncludedIn(slots: ListingPhotoSlot[], s: ListingPhotoSlot): boolean {
  if (s.kind === 'local') {
    return slots.some((x) => x.kind === 'local' && x.file === s.file);
  }
  return slots.some((x) => x.kind === 'remote' && x.photo.id === s.photo.id);
}

/**
 * Piano 1.5 — seam "foto inserzione" estratto da SellSingleWizard.
 * Possiede lo stato degli upload (con AbortController per slot), avvio/annullo/
 * retry upload, sincronizzazione slot↔draft, stati derivati e raccolta degli id
 * foto pronti. Il QR pairing resta in `usePhotoPairingSession` (consuma
 * `setListingPhotos` esposto qui). Logica spostata fedelmente.
 */
export function useSellSinglePhotos({
  listingPhotos,
  setDraft,
  setError,
}: {
  listingPhotos: ListingPhotoSlot[];
  setDraft: Dispatch<SetStateAction<SellSingleDraft>>;
  setError: (message: string | null) => void;
}) {
  const [photoUploads, setPhotoUploads] = useState<Map<File, PhotoUploadEntry>>(() => new Map());

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
        const message = err instanceof Error ? err.message : 'Upload fallito. Riprova.';
        setPhotoUploads((prev) => {
          if (!prev.has(file)) return prev;
          const next = new Map(prev);
          next.set(file, { status: 'error', progress: 0, error: message, abort });
          return next;
        });
      });
  }, []);

  const listingPhotosRef = useRef(listingPhotos);
  listingPhotosRef.current = listingPhotos;
  const photoUploadsRef = useRef(photoUploads);
  photoUploadsRef.current = photoUploads;

  const setListingPhotos = useCallback(
    (next: ListingPhotoSlot[]) => {
      const previous = listingPhotosRef.current;
      const currentUploads = photoUploadsRef.current;

      // Handle removed photos: abort in-flight and delete from backend
      for (const old of previous) {
        if (slotIncludedIn(next, old)) continue;
        if (old.kind === 'local') {
          const entry = currentUploads.get(old.file);
          if (entry) {
            entry.abort.abort();
            if (entry.status === 'done' && entry.photo) {
              void deleteUploadedPhoto(entry.photo.id).catch(() => {});
            }
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

      // Handle newly added local photos: start upload
      for (const s of next) {
        if (!slotIncludedIn(previous, s) && s.kind === 'local') {
          startUploadFor(s.file);
        }
      }

      setDraft((d) => ({ ...d, listingPhotos: next }));
      setError(null);
    },
    [startUploadFor, setDraft, setError],
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
    [startUploadFor],
  );

  /** Aggiunge foto dalla riga azioni unificata, rispettando il massimo. */
  const appendListingPhotos = useCallback(
    (fileList: FileList | null) => {
      if (!fileList?.length) return;
      const currentList = listingPhotosRef.current;
      const next = [...currentList];
      for (const f of Array.from(fileList)) {
        const isImg = f.type.startsWith('image/') || /\.(jpe?g|png|webp|heic|heif|avif|gif)$/i.test(f.name);
        if (!isImg) continue;
        if (next.length >= AUCTION_LISTING_PHOTO_MAX) break;
        next.push({ kind: 'local', file: f });
      }
      if (next.length > currentList.length) setListingPhotos(next);
    },
    [setListingPhotos],
  );

  const photoUploadStatuses = useMemo<ListingPhotoUploadStatus[]>(
    () =>
      listingPhotos.map((slot) => {
        if (slot.kind === 'remote') return { kind: 'done', cdnUrl: slot.photo.cdn_url };
        const entry = photoUploads.get(slot.file);
        if (!entry) return { kind: 'idle' };
        if (entry.status === 'uploading') return { kind: 'uploading', progress: entry.progress };
        if (entry.status === 'done' && entry.photo) return { kind: 'done', cdnUrl: entry.photo.cdn_url };
        return { kind: 'error', message: entry.error || 'Upload fallito' };
      }),
    [listingPhotos, photoUploads],
  );

  const allPhotosUploaded = useMemo(
    () => listingPhotosReady(listingPhotos, photoUploadStatuses),
    [listingPhotos, photoUploadStatuses],
  );

  const failedUploadFiles = useMemo(
    () =>
      listingPhotos
        .filter(
          (s): s is Extract<ListingPhotoSlot, { kind: 'local' }> =>
            s.kind === 'local' && photoUploads.get(s.file)?.status === 'error',
        )
        .map((s) => s.file),
    [listingPhotos, photoUploads],
  );

  const lightboxUrls = useMemo(
    () => listingPhotos.map((slot) => (slot.kind === 'local' ? URL.createObjectURL(slot.file) : slot.photo.cdn_url)),
    [listingPhotos],
  );

  useEffect(() => {
    return () => {
      listingPhotos.forEach((slot, i) => {
        if (slot.kind === 'local') URL.revokeObjectURL(lightboxUrls[i]!);
      });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lightboxUrls]);

  const collectPhotoIds = useCallback((): number[] => {
    const ids: number[] = [];
    for (const slot of listingPhotos) {
      if (slot.kind === 'remote') {
        ids.push(slot.photo.id);
        continue;
      }
      const entry = photoUploads.get(slot.file);
      if (entry?.status === 'done' && entry.photo) ids.push(entry.photo.id);
    }
    return ids;
  }, [listingPhotos, photoUploads]);

  const resetUploads = useCallback(() => setPhotoUploads(new Map()), []);

  return {
    setListingPhotos,
    retryFailedUpload,
    appendListingPhotos,
    photoUploadStatuses,
    allPhotosUploaded,
    failedUploadFiles,
    lightboxUrls,
    collectPhotoIds,
    resetUploads,
  };
}
