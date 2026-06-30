'use client';

import type { AuctionCreateCardSelection, AuctionCreateDraft } from '@/lib/auction/auction-create-draft';
import type { InventoryItemWithCatalog } from '@/lib/sync/inventory-types';
import type { WizardStepId, EmbeddedInventoryPick } from '@/lib/auction/auction-create-wizard-types';
import type { usePhotoPairingSession } from '@/lib/hooks/use-photo-pairing-session';
import type { ListingPhotoUploadStatus } from '../AuctionListingPhotoUpload';
import type { ListingPhotoSlot } from '@/lib/auction/auction-create-draft';
import type { CardLanguageOption } from '@/lib/card-languages';
import type { RefObject } from 'react';
import { AuctionCreateItemPickStep } from './AuctionCreateItemPickStep';
import { AuctionCreateInventoryPickStep } from './AuctionCreateInventoryPickStep';
import { AuctionCreateEmbeddedDetailsStep } from './AuctionCreateEmbeddedDetailsStep';
import { AuctionCreateDetailsStep } from './AuctionCreateDetailsStep';
import { AuctionCreatePriceStep } from './AuctionCreatePriceStep';
import { AuctionCreateShippingStep } from './AuctionCreateShippingStep';
import { AuctionCreatePhotosStep } from './AuctionCreatePhotosStep';
import { AuctionCreateEmbeddedReviewStep } from './AuctionCreateEmbeddedReviewStep';
import { AuctionCreateReviewStep } from './AuctionCreateReviewStep';

type DraftUpdate = <K extends keyof AuctionCreateDraft>(
  key: K,
  value: AuctionCreateDraft[K]
) => void;

export type AuctionCreateStepPanelProps = {
  stepId: WizardStepId;
  isEmbedded: boolean;
  draft: AuctionCreateDraft;
  update: DraftUpdate;
  embeddedCard?: { id: string };
  embeddedInventoryItems: InventoryItemWithCatalog[];
  embeddedInventoryPick: EmbeddedInventoryPick;
  onEmbeddedInventoryPickChange: (pick: EmbeddedInventoryPick) => void;
  cardLanguageFlagOptions: CardLanguageOption[];
  onChooseInInventoryYes: () => void;
  onChooseInInventoryNo: () => void;
  onCardSelect: (sel: AuctionCreateCardSelection) => void;
  onGenericSelect: (sel: AuctionCreateCardSelection) => void;
  onClearCardSelection: () => void;
  listingPhotos: ListingPhotoSlot[];
  setListingPhotos: (next: ListingPhotoSlot[]) => void;
  pairing: ReturnType<typeof usePhotoPairingSession>;
  photoUploadStatuses: ListingPhotoUploadStatus[];
  failedUploadFiles: File[];
  retryFailedUpload: (file: File) => void;
  appendEmbeddedPhotos: (fileList: FileList | null) => void;
  embGalleryInputRef: RefObject<HTMLInputElement | null>;
  embCameraInputRef: RefObject<HTMLInputElement | null>;
  setLightboxIndex: (index: number) => void;
  setLightboxOpen: (open: boolean) => void;
};

export function AuctionCreateStepPanel({
  stepId,
  isEmbedded,
  draft,
  update,
  embeddedCard,
  embeddedInventoryItems,
  embeddedInventoryPick,
  onEmbeddedInventoryPickChange,
  cardLanguageFlagOptions,
  onChooseInInventoryYes,
  onChooseInInventoryNo,
  onCardSelect,
  onGenericSelect,
  onClearCardSelection,
  listingPhotos,
  setListingPhotos,
  pairing,
  photoUploadStatuses,
  failedUploadFiles,
  retryFailedUpload,
  appendEmbeddedPhotos,
  embGalleryInputRef,
  embCameraInputRef,
  setLightboxIndex,
  setLightboxOpen,
}: AuctionCreateStepPanelProps) {
  switch (stepId) {
    case 'item_pick':
      return (
        <AuctionCreateItemPickStep
          draft={draft}
          update={update}
          onChooseInInventoryYes={onChooseInInventoryYes}
          onChooseInInventoryNo={onChooseInInventoryNo}
          onCardSelect={onCardSelect}
          onGenericSelect={onGenericSelect}
          onClearCardSelection={onClearCardSelection}
        />
      );
    case 'inventory_pick':
      if (!embeddedCard) return null;
      return (
        <AuctionCreateInventoryPickStep
          draft={draft}
          update={update}
          isEmbedded={isEmbedded}
          embeddedInventoryItems={embeddedInventoryItems}
          embeddedInventoryPick={embeddedInventoryPick}
          onEmbeddedInventoryPickChange={onEmbeddedInventoryPickChange}
        />
      );
    case 'details':
      if (isEmbedded) {
        return (
          <AuctionCreateEmbeddedDetailsStep
            draft={draft}
            update={update}
            cardLanguageFlagOptions={cardLanguageFlagOptions}
          />
        );
      }
      return <AuctionCreateDetailsStep draft={draft} update={update} isEmbedded={false} />;
    case 'price':
      return <AuctionCreatePriceStep draft={draft} update={update} isEmbedded={false} />;
    case 'shipping':
      return <AuctionCreateShippingStep draft={draft} update={update} isEmbedded={false} />;
    case 'photos':
      return (
        <AuctionCreatePhotosStep
          isEmbedded={false}
          listingPhotos={listingPhotos}
          onListingPhotosChange={setListingPhotos}
          pairing={pairing}
          photoUploadStatuses={photoUploadStatuses}
          failedUploadFiles={failedUploadFiles}
          onRetryFailedUpload={retryFailedUpload}
          appendPhotos={appendEmbeddedPhotos}
          galleryInputRef={embGalleryInputRef}
          cameraInputRef={embCameraInputRef}
          onPhotoClick={(index) => {
            setLightboxIndex(index);
            setLightboxOpen(true);
          }}
        />
      );
    case 'review':
      if (isEmbedded) {
        return (
          <AuctionCreateEmbeddedReviewStep
            draft={draft}
            update={update}
            pairing={pairing}
            setListingPhotos={setListingPhotos}
            photoUploadStatuses={photoUploadStatuses}
            failedUploadFiles={failedUploadFiles}
            retryFailedUpload={retryFailedUpload}
            appendEmbeddedPhotos={appendEmbeddedPhotos}
            embGalleryInputRef={embGalleryInputRef}
            embCameraInputRef={embCameraInputRef}
            setLightboxIndex={setLightboxIndex}
            setLightboxOpen={setLightboxOpen}
          />
        );
      }
      return <AuctionCreateReviewStep draft={draft} />;
    default: {
      const _exhaustive: never = stepId;
      return _exhaustive;
    }
  }
}
