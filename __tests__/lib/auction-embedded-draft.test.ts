import { describe, expect, it } from 'vitest';

import { AUCTION_CREATE_DEFAULT_DRAFT } from '@/lib/auction/auction-create-draft';
import { mergeInventoryIntoAuctionDraft } from '@/lib/auction/auction-embedded-draft';
import { validateAuctionCreateStep } from '@/lib/auction/auction-create-validation';
import type { InventoryItemWithCatalog } from '@/lib/sync/inventory-types';

const validationMessages = {
  pickInventory: 'pick inventory',
  continueDisabled: 'continue disabled',
  pickCard: 'pick card',
  title: 'title',
  auctionNoteMax: 'note max',
  start: 'start',
  buyNow: 'buy now',
  shipping: 'shipping',
  photos: 'photos',
  photosUploadFailed: 'photos failed',
  photosUploadPending: 'photos pending',
};

function inventoryItem(overrides: Partial<InventoryItemWithCatalog>): InventoryItemWithCatalog {
  return {
    id: 42,
    blueprint_id: 123,
    quantity: 1,
    price_cents: 0,
    properties: null,
    updated_at: '2026-07-01T00:00:00.000Z',
    ...overrides,
  };
}

describe('mergeInventoryIntoAuctionDraft', () => {
  it('mantiene il prezzo inventario come compra subito senza bloccare la validazione embedded', () => {
    const draft = mergeInventoryIntoAuctionDraft(
      {
        ...AUCTION_CREATE_DEFAULT_DRAFT,
        isCard: true,
        title: 'Black Lotus',
      },
      inventoryItem({
        price_cents: 5000,
        properties: { condition: 'Near Mint', mtg_language: 'it' },
      })
    );

    expect(draft.startingBidEur).toBe('1');
    expect(draft.inventoryListPriceEur).toBe('50');
    expect(draft.buyNowPriceEur).toBe('50');
    expect(draft.keepInventoryListing).toBe(true);

    expect(
      validateAuctionCreateStep({
        stepId: 'details',
        draft,
        isEmbedded: true,
        embeddedInventoryPick: 42,
        allPhotosUploaded: true,
        failedUploadCount: 0,
        messages: validationMessages,
      })
    ).toEqual({ ok: true });
  });
}
