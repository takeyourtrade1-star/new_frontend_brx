import { describe, expect, it } from 'vitest';
import {
  getProductDetailHref,
  getVendiCatalogHref,
  isSellFlow,
  shouldOpenVendiTab,
  withSellFlow,
} from '@/lib/sell-flow/sell-flow';

describe('sell-flow', () => {
  it('detects sell flow from search params', () => {
    expect(isSellFlow({ get: (k) => (k === 'flow' ? 'sell' : null) })).toBe(true);
    expect(isSellFlow({ get: () => null })).toBe(false);
  });

  it('should open vendi tab when flow=sell or tab=vendi', () => {
    expect(shouldOpenVendiTab({ get: (k) => (k === 'flow' ? 'sell' : null) })).toBe(true);
    expect(shouldOpenVendiTab({ get: (k) => (k === 'tab' ? 'vendi' : null) })).toBe(true);
    expect(shouldOpenVendiTab({ get: () => null })).toBe(false);
  });

  it('withSellFlow appends query params', () => {
    expect(withSellFlow('/products/singles')).toBe('/products/singles?flow=sell');
    expect(withSellFlow('/products/singles?game=mtg')).toBe('/products/singles?game=mtg&flow=sell');
    expect(withSellFlow('/products/mtg_1', { tab: 'vendi' })).toBe(
      '/products/mtg_1?flow=sell&tab=vendi',
    );
  });

  it('getProductDetailHref adds sell flow when requested', () => {
    expect(getProductDetailHref('mtg_42', { sellFlow: true })).toBe(
      '/products/mtg_42?flow=sell&tab=vendi',
    );
    expect(getProductDetailHref('mtg_42')).toBe('/products/mtg_42');
  });

  it('getVendiCatalogHref wraps catalog paths', () => {
    expect(getVendiCatalogHref('/products/singles')).toBe('/products/singles?flow=sell');
  });
});
