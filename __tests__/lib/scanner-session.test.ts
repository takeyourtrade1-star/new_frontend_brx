import { describe, expect, it } from 'vitest';

import type { ScanSession } from '@/hooks/scanner/scanner-types';
import {
  MAX_SCAN_SESSION_ITEMS,
  normalizeScanSession,
} from '@/hooks/scanner/useLocalScanSession';

const result = {
  card_name: 'Lightning Bolt',
  set_name: 'Magic 2011',
  set_code: 'm11',
  image_uri: null,
  confidence: 0.9,
  method: 'server',
  search_url: '/search',
  search_query: 'lightning bolt',
  latency_ms: 100,
};

describe('sessione locale Asso Vision', () => {
  it('migra i vecchi lotti e applica il limite di 100 carte', () => {
    const stored = {
      version: 1,
      id: 'legacy',
      createdAt: '2026-07-16T08:00:00.000Z',
      updatedAt: '2026-07-16T08:00:00.000Z',
      items: Array.from({ length: 101 }, (_, index) => ({
        id: `scan-${index}`,
        capturedAt: `2026-07-16T08:00:${String(index % 60).padStart(2, '0')}.000Z`,
        status: 'recognized',
        result,
      })),
    } as unknown as ScanSession;

    const normalized = normalizeScanSession(stored);
    expect(normalized.version).toBe(2);
    expect(normalized.items).toHaveLength(MAX_SCAN_SESSION_ITEMS);
    expect(normalized.items[0]?.quantity).toBe(1);
    expect(normalized.items[0]?.sale).toMatchObject({
      selectedCard: null,
      language: 'en',
      condition: 'near_mint',
      publishStatus: 'draft',
    });
  });

  it('rende ripetibile una pubblicazione interrotta', () => {
    const stored = {
      version: 2,
      id: 'current',
      createdAt: '2026-07-16T08:00:00.000Z',
      updatedAt: '2026-07-16T08:00:00.000Z',
      items: [{
        id: 'scan-1',
        capturedAt: '2026-07-16T08:00:00.000Z',
        status: 'confirmed',
        quantity: 1,
        result,
        sale: {
          selectedCard: null,
          language: 'it',
          condition: 'near_mint',
          price: '2.50',
          priceTouched: true,
          publishStatus: 'publishing',
        },
      }],
    } satisfies ScanSession;

    expect(normalizeScanSession(stored).items[0]?.sale.publishStatus).toBe('failed');
  });
});
