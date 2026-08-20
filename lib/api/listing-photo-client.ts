/**
 * Marketplace listing photos — same Direct-to-S3 pipeline as auctions,
 * with listing context for pairing sessions and post-publish attach.
 */

export {
  compressImage,
  uploadPhoto,
  deletePhoto,
  listPairingSessionPhotos,
  revokePhotoPairingSession,
  type UploadedPhoto,
  type UploadOptions,
} from '@/lib/api/auction-photo-client';

import { tokenManager } from '@/lib/api/refresh-token';
import { createPhotoPairingSession, type PhotoPairingSessionCreated } from '@/lib/api/auction-photo-client';

export type ListingPhotoPairingSession = PhotoPairingSessionCreated;

/** QR pairing session scoped to marketplace sell flow (vendi-foto page). */
export async function createListingPhotoPairingSession(): Promise<ListingPhotoPairingSession> {
  return createPhotoPairingSession('listing');
}

export interface AttachListingPhotosResult {
  listing_id: string;
  photos: Array<{
    id: number;
    cdn_url: string;
    position: number;
  }>;
}

export interface ListingPhotoSummary {
  id: number;
  cdn_url: string;
  position: number;
}

const LISTING_PHOTOS_CACHE_MS = 5 * 60 * 1000;
const listingPhotosCache = new Map<string, { at: number; photos: ListingPhotoSummary[] }>();
const listingPhotosInflight = new Map<string, Promise<ListingPhotoSummary[]>>();

function normalizeListingPhotos(
  photos: ListingPhotoSummary[] | undefined,
): ListingPhotoSummary[] {
  return (photos ?? []).map((p) => ({
    id: p.id,
    cdn_url: p.cdn_url,
    position: p.position ?? 0,
  }));
}

async function fetchListingPhotosFromApi(listingId: string): Promise<ListingPhotoSummary[]> {
  const res = await fetch(`/api/auctions/photos/by-listing/${encodeURIComponent(listingId)}`, {
    credentials: 'same-origin',
    headers: { Accept: 'application/json' },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    if (res.status === 401 && typeof window !== 'undefined') {
      const refreshed = await tokenManager.ensureFreshSession();
      if (refreshed) {
        return fetchListingPhotosFromApi(listingId);
      }
    }
    const message =
      (data as { detail?: string })?.detail ||
      (data as { error?: string })?.error ||
      `HTTP ${res.status}`;
    throw new Error(message);
  }
  const photos = (data as { data?: { photos?: ListingPhotoSummary[] } })?.data?.photos ?? [];
  return normalizeListingPhotos(photos);
}

type PhotoCacheListener = () => void;
const photoCacheListeners = new Set<PhotoCacheListener>();

export function subscribeListingPhotos(listener: PhotoCacheListener): () => void {
  photoCacheListeners.add(listener);
  return () => {
    photoCacheListeners.delete(listener);
  };
}

function notifyListingPhotos(): void {
  for (const listener of photoCacheListeners) {
    try {
      listener();
    } catch {
      /* ignore listener error */
    }
  }
}

export function getCachedListingPhotos(listingId: string): ListingPhotoSummary[] | null {
  const key = String(listingId);
  const cached = listingPhotosCache.get(key);
  if (cached && Date.now() - cached.at < LISTING_PHOTOS_CACHE_MS) {
    return cached.photos;
  }
  return null;
}

function seedListingPhotosCache(listingId: string, photos: ListingPhotoSummary[]): void {
  listingPhotosCache.set(String(listingId), { at: Date.now(), photos: normalizeListingPhotos(photos) });
  notifyListingPhotos();
}

/** Warm cache for many listings in one request (product detail venditori tab). */
export async function prefetchListingCoverPhotos(listingIds: string[]): Promise<void> {
  const unique = [...new Set(listingIds.map(String).filter(Boolean))];
  if (unique.length === 0) return;

  const missing = unique.filter((id) => {
    const cached = listingPhotosCache.get(id);
    return !cached || Date.now() - cached.at >= LISTING_PHOTOS_CACHE_MS;
  });
  if (missing.length === 0) return;

  const chunks: string[][] = [];
  for (let i = 0; i < missing.length; i += 40) {
    chunks.push(missing.slice(i, i + 40));
  }

  await Promise.allSettled(
    chunks.map(async (chunk) => {
      const qs = encodeURIComponent(chunk.join(','));
      const res = await fetch(`/api/auctions/photos/by-listings?ids=${qs}`, {
        credentials: 'same-origin',
        headers: { Accept: 'application/json' },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) return;

      const covers = (data as { data?: { covers?: Record<string, ListingPhotoSummary> } })?.data?.covers ?? {};
      for (const [listingId, photo] of Object.entries(covers)) {
        listingPhotosCache.set(String(listingId), {
          at: Date.now(),
          photos: normalizeListingPhotos([photo]),
        });
      }
    })
  );
  notifyListingPhotos();
}

/** Published photos for a marketplace listing (CDN URLs). Cached + deduped in-flight. */
export async function getListingPhotos(listingId: string): Promise<ListingPhotoSummary[]> {
  const key = String(listingId);
  const cached = listingPhotosCache.get(key);
  if (cached && Date.now() - cached.at < LISTING_PHOTOS_CACHE_MS) {
    return cached.photos;
  }

  const inflight = listingPhotosInflight.get(key);
  if (inflight) return inflight;

  const promise = fetchListingPhotosFromApi(key)
    .then((photos) => {
      listingPhotosCache.set(key, { at: Date.now(), photos });
      return photos;
    })
    .finally(() => {
      listingPhotosInflight.delete(key);
    });

  listingPhotosInflight.set(key, promise);
  return promise;
}

/** Bind finalized PENDING photos to a marketplace listing after createListing. */
export async function attachListingPhotos(
  listingId: string,
  photoIds: number[],
  retried = false,
): Promise<AttachListingPhotosResult> {
  const res = await fetch('/api/auctions/photos/attach-listing', {
    method: 'POST',
    credentials: 'same-origin',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ listing_id: listingId, photo_ids: photoIds }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    if (res.status === 401 && !retried && typeof window !== 'undefined') {
      const refreshed = await tokenManager.ensureFreshSession();
      if (refreshed) {
        return attachListingPhotos(listingId, photoIds, true);
      }
    }
    const message =
      (data as { detail?: string })?.detail ||
      (data as { error?: string })?.error ||
      (data as { message?: string })?.message ||
      `HTTP ${res.status}`;
    throw new Error(message);
  }
  return (data as { data: AttachListingPhotosResult }).data;
}
