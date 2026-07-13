import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';

import { useProductCart } from '@/hooks/product/useProductCart';
import type { ListingItem } from '@/lib/api/sync-client';

const baseArgs = () => ({
  userId: 'u1' as string | undefined,
  accessToken: 'tok' as string | null,
  card: { id: 'c1', name: 'Sol Ring', cardtrader_id: '42' } as never,
  title: 'SOL RING',
  imageSrc: '/img/card.png' as string | null,
  effectiveImageSrc: '/img/card.png',
  cardImages: ['/img/card.png'],
  currentImageIndex: 0,
  blueprintIdForAuction: 42 as number | null,
  flyToCart: vi.fn(),
  addToCartStore: vi.fn(),
  createFromCartLines: vi.fn(),
  router: { push: vi.fn() },
  setListingActionMessage: vi.fn(),
});

const item = {
  item_id: 7,
  seller_id: 's1',
  seller_display_name: 'Pippo',
  price_cents: 1000,
  quantity: 5,
  condition: 'near_mint',
} as ListingItem;

beforeEach(() => {
  vi.clearAllMocks();
  window.sessionStorage.clear();
});

describe('useProductCart', () => {
  it('blocca l\'aggiunta al carrello senza autenticazione', () => {
    const args = { ...baseArgs(), userId: undefined };
    const { result } = renderHook(() => useProductCart(args));

    act(() => {
      result.current.handleMarketplaceAddToCart(item, 1, document.createElement('div'));
    });

    expect(args.setListingActionMessage).toHaveBeenCalledWith(
      'Accedi per aggiungere al carrello.'
    );
    expect(args.addToCartStore).not.toHaveBeenCalled();
  });

  it('aggiunge al carrello e anima fly-to-cart quando autenticato', () => {
    const args = baseArgs();
    const { result } = renderHook(() => useProductCart(args));
    const el = document.createElement('div');

    act(() => {
      result.current.handleMarketplaceAddToCart(item, 2, el);
    });

    expect(args.flyToCart).toHaveBeenCalledWith(el, { imageSrc: '/img/card.png' });
    expect(args.addToCartStore).toHaveBeenCalledTimes(1);
  });

  it('handleMarketplaceBuyNow imposta lo stato di acquisto con quantità limitata', () => {
    const args = baseArgs();
    const { result } = renderHook(() => useProductCart(args));

    act(() => {
      result.current.handleMarketplaceBuyNow(item, 99);
    });

    expect(result.current.purchaseListing).toBe(item);
    expect(result.current.purchaseQty).toBe(5); // clamp a item.quantity
  });

  it('avvia lo scambio mantenendo il riferimento all\'inserzione reale', () => {
    const args = baseArgs();
    const marketplaceItem = {
      ...item,
      marketplace_listing_id: 'listing-uuid',
      listing_source: 'marketplace' as const,
    };
    const { result } = renderHook(() => useProductCart(args));

    act(() => {
      result.current.handleProposeTrade(marketplaceItem);
    });

    expect(JSON.parse(window.sessionStorage.getItem('ebartex_trade_proposal_ctx') ?? '{}')).toMatchObject({
      listing: {
        id: 'mkt:listing-uuid',
        source: 'marketplace',
        sellerId: 's1',
        quantity: 5,
      },
      card: {
        id: 'mkt:listing-uuid',
        name: 'Sol Ring',
      },
    });
    expect(args.router.push).toHaveBeenCalledWith('/scambi/proponi');
  });
});
