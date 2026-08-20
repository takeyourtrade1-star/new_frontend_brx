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

export type ListingCoverPhotoMap = Record<string, ListingPhotoSummary | null>;

export class ListingPhotoApiError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = 'ListingPhotoApiError';
    this.status = status;
  }
}

const LISTING_PHOTOS_CACHE_MS = 5 * 60 * 1000;
const LISTING_COVER_BATCH_SIZE = 40;
const LISTING_COVER_MAX_CONCURRENCY = 2;
const listingFullPhotosCache = new Map<string, { at: number; photos: ListingPhotoSummary[] }>();
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

async function fetchListingCoverPhotoChunk(listingIds: string[]): Promise<ListingCoverPhotoMap> {
  const qs = encodeURIComponent(listingIds.join(','));
  const res = await fetch(`/api/auctions/photos/by-listings?ids=${qs}`, {
    credentials: 'same-origin',
    headers: { Accept: 'application/json' },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message =
      (data as { detail?: string })?.detail ||
      (data as { error?: string })?.error ||
      `HTTP ${res.status}`;
    throw new ListingPhotoApiError(res.status, message);
  }

  const covers =
    (data as { data?: { covers?: Record<string, ListingPhotoSummary> } })?.data?.covers ?? {};

  return Object.fromEntries(
    listingIds.map((listingId) => {
      const photo = covers[listingId];
      const normalized = photo ? normalizeListingPhotos([photo])[0] ?? null : null;
      return [listingId, normalized];
    }),
  );
}

/**
 * Cover pubbliche per la tabella venditori. La query React Query chiamante
 * conserva anche i `null`, così le inserzioni senza foto non vengono richieste
 * di nuovo a ogni render/refetch. I chunk sono limitati per non creare burst.
 */
export async function fetchListingCoverPhotos(listingIds: string[]): Promise<ListingCoverPhotoMap> {
  const unique = [...new Set(listingIds.map(String).filter(Boolean))].sort();
  if (unique.length === 0) return {};

  const chunks: string[][] = [];
  for (let i = 0; i < unique.length; i += LISTING_COVER_BATCH_SIZE) {
    chunks.push(unique.slice(i, i + LISTING_COVER_BATCH_SIZE));
  }

  const result: ListingCoverPhotoMap = {};
  for (let i = 0; i < chunks.length; i += LISTING_COVER_MAX_CONCURRENCY) {
    const page = await Promise.all(
      chunks
        .slice(i, i + LISTING_COVER_MAX_CONCURRENCY)
        .map((chunk) => fetchListingCoverPhotoChunk(chunk)),
    );
    Object.assign(result, ...page);
  }
  return result;
}

/** Published photos for a marketplace listing (CDN URLs). Cached + deduped in-flight. */
export async function getListingPhotos(listingId: string): Promise<ListingPhotoSummary[]> {
  const key = String(listingId);
  const cached = listingFullPhotosCache.get(key);
  if (cached && Date.now() - cached.at < LISTING_PHOTOS_CACHE_MS) {
    return cached.photos;
  }

  const inflight = listingPhotosInflight.get(key);
  if (inflight) return inflight;

  const promise = fetchListingPhotosFromApi(key)
    .then((photos) => {
      listingFullPhotosCache.set(key, { at: Date.now(), photos });
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
