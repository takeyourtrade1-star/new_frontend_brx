'use client';

/**
 * Marketplace listing photo grid — same UX as auction create (compress, S3, min/max).
 * Reuses auction i18n keys and helpers for identical copy and validation.
 */
export {
  AuctionListingPhotoUpload as ListingPhotoUpload,
  ListingPhotoThumbnailsRow,
  listingPhotosComplete,
  listingPhotosReady,
  type ListingPhotoUploadStatus,
} from '@/components/feature/aste/create/AuctionListingPhotoUpload';
