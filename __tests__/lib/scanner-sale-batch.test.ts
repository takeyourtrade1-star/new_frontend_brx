import { describe, expect, it } from 'vitest';

import type { ScanSessionItem } from '@/hooks/scanner/scanner-types';
import {
  buildScannerListingGroups,
  isScannerItemReadyToPublish,
  parseScannerPrice,
} from '@/lib/scanner/sale-batch';

function item(overrides: Partial<ScanSessionItem> = {}): ScanSessionItem {
  return {
    id: 'scan-1',
    capturedAt: '2026-07-16T08:00:00.000Z',
    status: 'confirmed',
    quantity: 1,
    result: {
      card_name: 'Lightning Bolt',
      set_name: 'Magic 2011',
      set_code: 'm11',
      image_uri: null,
      confidence: 0.88,
      method: 'server',
      search_url: '/search',
      search_query: 'lightning bolt',
      latency_ms: 200,
    },
    sale: {
      selectedCard: {
        cardId: 'mtg_123',
        blueprintId: 456,
        name: 'Lightning Bolt',
        setName: 'Magic 2011',
        setCode: 'm11',
        collectorNumber: '149',
        image: null,
        availableLanguages: ['en', 'it'],
        marketPrice: 2.5,
        foilPrice: 8,
      },
      language: 'it',
      condition: 'near_mint',
      price: '2,50',
      priceTouched: true,
      publishStatus: 'draft',
    },
    ...overrides,
  };
}

describe('scanner sale batch', () => {
  it('normalizza il prezzo europeo', () => {
    expect(parseScannerPrice('€ 12,349')).toBe(12.35);
    expect(parseScannerPrice('non valido')).toBe(0);
  });

  it('richiede conferma, carta ufficiale e prezzo valido', () => {
    expect(isScannerItemReadyToPublish(item())).toBe(true);
    expect(isScannerItemReadyToPublish(item({ status: 'recognized' }))).toBe(false);
    expect(
      isScannerItemReadyToPublish(item({ sale: { ...item().sale, selectedCard: null } })),
    ).toBe(false);
  });

  it('unisce copie con carta e dati commerciali identici', () => {
    const groups = buildScannerListingGroups([
      item(),
      item({ id: 'scan-2', quantity: 2 }),
      item({
        id: 'scan-3',
        sale: { ...item().sale, condition: 'lightly_played' },
      }),
    ]);
    expect(groups).toHaveLength(2);
    expect(groups[0]?.itemIds).toEqual(['scan-1', 'scan-2']);
    expect(groups[0]?.body.quantity).toBe(3);
    expect(groups[0]?.body.cardtrader_blueprint_id).toBe(456);
  });
});
