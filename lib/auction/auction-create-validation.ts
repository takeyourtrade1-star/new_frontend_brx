import {
  AUCTION_CUSTOM_DESCRIPTION_MAX,
  type AuctionCreateDraft,
} from '@/lib/auction/auction-create-draft';
import { listingPhotosComplete } from '@/components/feature/aste/create/AuctionListingPhotoUpload';
import { parseLocaleMoneyInput, roundUpToHalfStep } from '@/lib/auction/bid-math';
import type { EmbeddedInventoryPick } from '@/lib/auction/auction-create-wizard-types';
import type { WizardStepId } from '@/lib/auction/auction-create-wizard-types';

export type AuctionStepValidationMessages = {
  pickInventory: string;
  continueDisabled: string;
  pickCard: string;
  title: string;
  auctionNoteMax: string;
  start: string;
  buyNow: string;
  shipping: string;
  photos: string;
  photosUploadFailed: string;
  photosUploadPending: string;
};

export type ValidateAuctionCreateStepInput = {
  stepId: WizardStepId;
  draft: AuctionCreateDraft;
  isEmbedded: boolean;
  embeddedInventoryPick: EmbeddedInventoryPick;
  allPhotosUploaded: boolean;
  failedUploadCount: number;
  messages: AuctionStepValidationMessages;
};

export type AuctionStepValidationResult =
  | { ok: true }
  | { ok: false; error: string };

export function validateAuctionCreateStep(
  input: ValidateAuctionCreateStepInput
): AuctionStepValidationResult {
  const {
    stepId: id,
    draft,
    isEmbedded,
    embeddedInventoryPick,
    allPhotosUploaded,
    failedUploadCount,
    messages: m,
  } = input;

  if (id === 'inventory_pick') {
    if (embeddedInventoryPick === 'unset') {
      return { ok: false, error: m.pickInventory };
    }
  }
  if (id === 'item_pick') {
    if (draft.fromSyncInventory === null) {
      return { ok: false, error: m.continueDisabled };
    }
    if (!draft.cardSelection && !draft.title.trim()) {
      return { ok: false, error: m.pickCard };
    }
  }
  if (id === 'details') {
    if (!draft.title.trim()) {
      return { ok: false, error: m.title };
    }
    if (draft.isCard) {
      if (draft.description.length > AUCTION_CUSTOM_DESCRIPTION_MAX) {
        return { ok: false, error: m.auctionNoteMax };
      }
    }
  }
  if (id === 'price' || (isEmbedded && id === 'details')) {
    const start = roundUpToHalfStep(parseLocaleMoneyInput(String(draft.startingBidEur)));
    if (!Number.isFinite(start) || start <= 0) {
      return { ok: false, error: m.start };
    }
    const buyNowRaw = draft.buyNowPriceEur.trim();
    if (buyNowRaw) {
      const buyNow = roundUpToHalfStep(parseLocaleMoneyInput(buyNowRaw));
      if (!Number.isFinite(buyNow) || buyNow <= start) {
        return { ok: false, error: m.buyNow };
      }
    }
  }
  if (id === 'shipping' || (isEmbedded && id === 'review')) {
    if (draft.shippingPayer === 'buyer') {
      const national = roundUpToHalfStep(parseLocaleMoneyInput(String(draft.shippingNationalEur)));
      const euDefault = roundUpToHalfStep(parseLocaleMoneyInput(String(draft.shippingEuDefaultEur)));
      if (!Number.isFinite(national) || national < 0 || !Number.isFinite(euDefault) || euDefault < 0) {
        return { ok: false, error: m.shipping };
      }
      const restWorld = roundUpToHalfStep(parseLocaleMoneyInput(String(draft.shippingRestOfWorldEur)));
      if (!Number.isFinite(restWorld) || restWorld < 0) {
        return { ok: false, error: m.shipping };
      }
    }
  }
  if (id === 'photos' || (isEmbedded && id === 'review')) {
    if (!listingPhotosComplete(draft.listingPhotos)) {
      return { ok: false, error: m.photos };
    }
    if (!allPhotosUploaded) {
      if (failedUploadCount > 0) {
        return { ok: false, error: m.photosUploadFailed };
      }
      return { ok: false, error: m.photosUploadPending };
    }
  }
  return { ok: true };
}
