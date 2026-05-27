'use client';

import type { ComponentProps } from 'react';

/**
 * Marketplace listing photo grid — same UX as auction create (compress, S3, min/max).
 * Reuses auction i18n keys and helpers; marketplace photos are optional (auctions: min 2).
 */
import {
  AuctionListingPhotoUpload,
  ListingPhotoThumbnailsRow,
  listingPhotosComplete as auctionListingPhotosComplete,
  listingPhotosReady as auctionListingPhotosReady,
  type ListingPhotoUploadStatus,
} from '@/components/feature/aste/create/AuctionListingPhotoUpload';
import {
  MARKETPLACE_LISTING_PHOTO_MIN,
  type ListingPhotoSlot,
} from '@/lib/auction/auction-create-draft';

export type { ListingPhotoUploadStatus };

export function ListingPhotoUpload(props: ComponentProps<typeof AuctionListingPhotoUpload>) {
  return (
    <AuctionListingPhotoUpload {...props} photoMin={MARKETPLACE_LISTING_PHOTO_MIN} />
  );
}

export { ListingPhotoThumbnailsRow };

export function listingPhotosComplete(photos: ListingPhotoSlot[]): boolean {
  return auctionListingPhotosComplete(photos, MARKETPLACE_LISTING_PHOTO_MIN);
}

export function listingPhotosReady(
  photos: ListingPhotoSlot[],
  uploadStatuses: ListingPhotoUploadStatus[] | undefined,
): boolean {
  return auctionListingPhotosReady(photos, uploadStatuses, MARKETPLACE_LISTING_PHOTO_MIN);
}
