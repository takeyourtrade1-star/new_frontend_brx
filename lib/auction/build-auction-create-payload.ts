import type { AuctionCreateDraft, ListingPhotoSlot } from '@/lib/auction/auction-create-draft';
import { parseLocaleMoneyInput, roundUpToHalfStep } from '@/lib/auction/bid-math';
import { AUCTION_SHIPPING_REST_OF_WORLD_ISO } from '@/lib/auction/eu-shipping-regions';
import type { UploadedPhoto } from '@/lib/api/auction-photo-client';
import type { AuctionCreatePayload } from '@/types/auction';

export type PhotoUploadEntry = {
  status: 'uploading' | 'done' | 'error';
  progress: number;
  photo?: UploadedPhoto;
  error?: string;
  abort: AbortController;
};

export type BuildAuctionCreatePayloadResult =
  | { ok: true; payload: AuctionCreatePayload; startIso: string; endIso: string }
  | { ok: false; error: string; photoStep: 'photos' | 'review' };

export function buildAuctionCreatePayload(
  draft: AuctionCreateDraft,
  photoUploads: Map<File, PhotoUploadEntry>,
  isEmbedded: boolean
): BuildAuctionCreatePayloadResult {
  const startingPrice = roundUpToHalfStep(parseLocaleMoneyInput(String(draft.startingBidEur)));
  const reservePrice = draft.reservePriceEur
    ? roundUpToHalfStep(parseLocaleMoneyInput(String(draft.reservePriceEur)))
    : undefined;
  const now = new Date();
  const startDate = now;
  const endDate = new Date(startDate.getTime() + (draft.durationDays || 7) * 86_400_000);

  const photoIds: number[] = [];
  for (const slot of draft.listingPhotos) {
    if (slot.kind === 'remote') {
      photoIds.push(slot.photo.id);
      continue;
    }
    const entry = photoUploads.get(slot.file);
    if (!entry || entry.status !== 'done' || !entry.photo) {
      return {
        ok: false,
        error: 'Una o più foto non sono ancora state caricate. Riprova.',
        photoStep: isEmbedded ? 'review' : 'photos',
      };
    }
    photoIds.push(entry.photo.id);
  }

  const fallbackFront = photoIds.length === 0 ? draft.imageUrl || '' : '';
  const fallbackBack = fallbackFront;
  const slot0 = draft.listingPhotos[0];
  const slot1 = draft.listingPhotos[1];
  const firstPhotoCdn = cdnFromSlot(slot0, photoUploads) ?? '';
  const secondPhotoCdn = cdnFromSlot(slot1, photoUploads) ?? firstPhotoCdn;
  const imageFront = firstPhotoCdn || fallbackFront;
  const imageBack = secondPhotoCdn || fallbackBack;

  const buyNowRaw = draft.buyNowPriceEur.trim();
  const buyNowPrice = buyNowRaw
    ? roundUpToHalfStep(parseLocaleMoneyInput(buyNowRaw))
    : undefined;

  const payload: AuctionCreatePayload = {
    title: draft.title,
    description: draft.description || '',
    starting_price: startingPrice,
    reserve_price: reservePrice ?? null,
    start_time: startDate.toISOString(),
    end_time: endDate.toISOString(),
    product: {
      name: draft.title,
      description: draft.description || '',
      image_front: imageFront,
      image_back: imageBack,
      condition: draft.condition || '',
    },
    image_front: imageFront,
    image_back: imageBack,
    photo_ids: photoIds.length > 0 ? photoIds : undefined,
    buy_now_enabled: buyNowPrice != null && Number.isFinite(buyNowPrice) && buyNowPrice > 0,
    buy_now_price:
      buyNowPrice != null && Number.isFinite(buyNowPrice) && buyNowPrice > 0 ? buyNowPrice : null,
    shipping_payer: draft.shippingPayer,
    shipping_origin_country: draft.shippingOriginCountry || null,
    shipping_national_eur:
      draft.shippingPayer === 'buyer'
        ? roundUpToHalfStep(parseLocaleMoneyInput(String(draft.shippingNationalEur)))
        : null,
    shipping_eu_default_eur:
      draft.shippingPayer === 'buyer'
        ? roundUpToHalfStep(parseLocaleMoneyInput(String(draft.shippingEuDefaultEur)))
        : null,
    shipping_country_prices:
      draft.shippingPayer === 'buyer'
        ? (() => {
            const rest = roundUpToHalfStep(parseLocaleMoneyInput(String(draft.shippingRestOfWorldEur)));
            if (!Number.isFinite(rest) || rest < 0) return [];
            return [{ country_iso: AUCTION_SHIPPING_REST_OF_WORLD_ISO, price_eur: rest }];
          })()
        : [],
    anti_sniper_enabled: true,
    anti_sniper_minutes: draft.antiSniperMinutes,
  };

  return {
    ok: true,
    payload,
    startIso: payload.start_time,
    endIso: payload.end_time,
  };
}

function cdnFromSlot(
  slot: ListingPhotoSlot | undefined,
  photoUploads: Map<File, PhotoUploadEntry>
): string | undefined {
  if (!slot) return undefined;
  if (slot.kind === 'remote') return slot.photo.cdn_url;
  if (slot.kind === 'local') return photoUploads.get(slot.file)?.photo?.cdn_url;
  return undefined;
}

export function slotIncludedIn(slots: ListingPhotoSlot[], s: ListingPhotoSlot): boolean {
  if (s.kind === 'local') {
    return slots.some((x) => x.kind === 'local' && x.file === s.file);
  }
  return slots.some((x) => x.kind === 'remote' && x.photo.id === s.photo.id);
}
