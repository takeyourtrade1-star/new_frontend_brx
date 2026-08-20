import { describe, expect, it } from 'vitest';
import type { ListingItem } from '@/lib/api/sync-client';
import { buildSyncCartLine } from '@/lib/marketplace/cart-line';
import {
  getCartSellerCount,
  groupCartItemsBySeller,
} from '@/lib/marketplace/cart-groups';
import { isBrxExpressListing } from '@/lib/marketplace/brx-express';
import type { MarketplaceCartLine } from '@/types';

function cartLine(
  lineId: string,
  sellerId: string,
  overrides: Partial<MarketplaceCartLine> = {},
): MarketplaceCartLine {
  return {
    lineId,
    source: 'sync',
    listingId: lineId,
    sellerId,
    sellerDisplayName: sellerId,
    priceCents: 1_000,
    quantity: 1,
    maxQuantity: 4,
    title: lineId,
    imageUrl: '',
    ...overrides,
  };
}

function listing(overrides: Partial<ListingItem> = {}): ListingItem {
  return {
    item_id: 10,
    seller_id: 'seller-a',
    seller_display_name: 'Seller A',
    country: 'IT',
    quantity: 3,
    price_cents: 1_500,
    condition: 'near_mint',
    mtg_language: 'en',
    ...overrides,
  };
}

describe('raggruppamento carrello BRX Express', () => {
  it('accumuna in un solo gruppo le carte Express di venditori diversi', () => {
    const groups = groupCartItemsBySeller(
      [
        cartLine('express-a', 'seller-a', { isBrxExpress: true }),
        cartLine('express-b', 'seller-b', {
          isBrxExpress: true,
          priceCents: 2_000,
          quantity: 2,
        }),
        cartLine('standard-a', 'seller-a'),
      ],
      (line) => line.sellerDisplayName ?? line.sellerId,
      () => 'personal',
    );

    expect(groups).toHaveLength(2);
    expect(groups[0]).toMatchObject({
      id: 'fulfillment:brx-express',
      kind: 'brx-express',
      sellerId: null,
      sellerDisplayName: 'BRX Express',
      subtotalCents: 5_000,
      lineCount: 2,
      unitCount: 3,
    });
    expect(groups[0].items.map((item) => item.sellerId)).toEqual([
      'seller-a',
      'seller-b',
    ]);
    expect(groups[1]).toMatchObject({
      id: 'seller:seller-a',
      kind: 'seller',
      sellerId: 'seller-a',
    });
    expect(getCartSellerCount(groups)).toBe(1);
  });

  it('mantiene il segnale Express quando crea la riga carrello', () => {
    const item = listing({ brx_express: true });
    const line = buildSyncCartLine(item, 2, {
      title: 'Black Lotus',
      imageUrl: '/black-lotus.png',
    });

    expect(isBrxExpressListing(item)).toBe(true);
    expect(line.isBrxExpress).toBe(true);
    expect(line.sellerId).toBe('seller-a');
  });

  it('riconosce anche il valore shipping_method del backend', () => {
    expect(isBrxExpressListing(listing({ shipping_method: 'brx_express' }))).toBe(true);
    expect(isBrxExpressListing(listing())).toBe(false);
  });
});
