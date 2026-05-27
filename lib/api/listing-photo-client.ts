/**
 * Marketplace listing photos — same Direct-to-S3 pipeline as auctions,
 * with listing context for pairing sessions and post-publish attach.
 */

export {
  compressImage,
  uploadPhoto,
  deletePhoto,
  listPairingSessionPhotos,
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

function authHeaders(): Record<string, string> {
  if (typeof window === 'undefined') return {};
  const token = window.localStorage.getItem('ebartex_access_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export interface ListingPhotoSummary {
  id: number;
  cdn_url: string;
  position: number;
}

/** Published photos for a marketplace listing (CDN URLs). */
export async function getListingPhotos(listingId: string): Promise<ListingPhotoSummary[]> {
  const res = await fetch(`/api/auctions/photos/by-listing/${encodeURIComponent(listingId)}`, {
    headers: { Accept: 'application/json', ...authHeaders() },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    if (res.status === 401 && typeof window !== 'undefined') {
      const newToken = await tokenManager.ensureFreshToken();
      if (newToken) {
        return getListingPhotos(listingId);
      }
    }
    const message =
      (data as { detail?: string })?.detail ||
      (data as { error?: string })?.error ||
      `HTTP ${res.status}`;
    throw new Error(message);
  }
  const photos = (data as { data?: { photos?: ListingPhotoSummary[] } })?.data?.photos ?? [];
  return photos.map((p) => ({
    id: p.id,
    cdn_url: p.cdn_url,
    position: p.position ?? 0,
  }));
}

/** Bind finalized PENDING photos to a marketplace listing after createListing. */
export async function attachListingPhotos(
  listingId: string,
  photoIds: number[],
): Promise<AttachListingPhotosResult> {
  const res = await fetch('/api/auctions/photos/attach-listing', {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      ...authHeaders(),
    },
    body: JSON.stringify({ listing_id: listingId, photo_ids: photoIds }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    if (res.status === 401 && typeof window !== 'undefined') {
      const newToken = await tokenManager.ensureFreshToken();
      if (newToken) {
        return attachListingPhotos(listingId, photoIds);
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
