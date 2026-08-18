import { describe, it, expect } from 'vitest';
import {
  composeAccountInventory,
  isCardTraderSyncRow,
  isTradableSyncRow,
} from '@/lib/inventory/compose-account-inventory';
import { isVisibleInventoryGame } from '@/lib/inventory/inventory-filter-utils';
import type { InventoryItemResponse } from '@/lib/api/sync-client';
import type { ListingResponse } from '@/lib/api/marketplace-client';
import type { InventoryItemWithCatalog } from '@/lib/sync/inventory-types';

function syncRow(overrides: Partial<InventoryItemResponse> = {}): InventoryItemResponse {
  return {
    id: 1,
    blueprint_id: 100,
    quantity: 2,
    price_cents: 500,
    external_stock_id: 'ct-1',
    source: 'cardtrader',
    updated_at: '2026-07-01T00:00:00Z',
    ...overrides,
  };
}

function listing(overrides: Partial<ListingResponse> = {}): ListingResponse {
  return {
    id: 'aaaaaaaa-0000-0000-0000-000000000001',
    user_id: 'user-1',
    card_id: 'mtg_123',
    cardtrader_blueprint_id: 100,
    cardtrader_article_id: null,
    title: 'Lightning Bolt',
    price: '5.00',
    quantity: 1,
    condition: 'NM',
    language: 'en',
    status: 'active',
    sync_mode_at_creation: 'real',
    cardtrader_synced_at: null,
    created_at: '2026-07-01T00:00:00Z',
    updated_at: '2026-07-01T00:00:00Z',
    ...overrides,
  };
}

describe('isCardTraderSyncRow', () => {
  it('accetta righe con external_stock_id valorizzato', () => {
    expect(isCardTraderSyncRow(syncRow())).toBe(true);
  });

  it('rifiuta righe interne senza external_stock_id (mock/test)', () => {
    expect(isCardTraderSyncRow(syncRow({ source: 'trade', external_stock_id: null }))).toBe(false);
    expect(isCardTraderSyncRow(syncRow({ source: 'internal_test', external_stock_id: null }))).toBe(false);
  });
});

describe('isTradableSyncRow', () => {
  it('accetta stock CardTrader e carte ricevute tramite scambio', () => {
    expect(isTradableSyncRow(syncRow())).toBe(true);
    expect(isTradableSyncRow(syncRow({ source: 'trade', external_stock_id: null }))).toBe(true);
  });

  it('rifiuta lo stock di test interno', () => {
    expect(isTradableSyncRow(syncRow({ source: 'internal_test' }))).toBe(false);
  });
});

describe('composeAccountInventory', () => {
  it('esclude le righe sync interne senza external_stock_id', () => {
    const items = composeAccountInventory(
      [syncRow(), syncRow({ id: 2, source: 'internal_test', external_stock_id: null })],
      []
    );
    expect(items).toHaveLength(1);
    expect(items[0].id).toBe(1);
    expect(items[0].listing_source).toBe('sync');
  });

  it('mostra nell inventario le carte ricevute da uno scambio', () => {
    const items = composeAccountInventory(
      [syncRow({ id: 2, source: 'trade', external_stock_id: null })],
      []
    );
    expect(items).toHaveLength(1);
    expect(items[0].source).toBe('trade');
  });

  it('esclude le righe sync a quantità zero (sold out)', () => {
    const items = composeAccountInventory(
      [syncRow(), syncRow({ id: 2, external_stock_id: 'ct-2', quantity: 0 })],
      []
    );
    expect(items.map((i) => i.id)).toEqual([1]);
  });

  it('mantiene visibile una riga CardTrader interamente bloccata nello scambio', () => {
    const items = composeAccountInventory(
      [syncRow({ quantity: 0, reserved_quantity: 1 })],
      []
    );
    expect(items).toHaveLength(1);
    expect(items[0].reserved_quantity).toBe(1);
  });

  it('include i listing presenti solo su Ebartex anche in modalità DEMO', () => {
    const items = composeAccountInventory(
      [],
      [listing(), listing({ id: 'aaaaaaaa-0000-0000-0000-000000000002', sync_mode_at_creation: 'demo' })]
    );
    expect(items).toHaveLength(2);
    expect(items.map((item) => item.marketplace_listing_id)).toEqual([
      'aaaaaaaa-0000-0000-0000-000000000001',
      'aaaaaaaa-0000-0000-0000-000000000002',
    ]);
  });

  it('deduplica il listing marketplace collegato a una riga sync via cardtrader_article_id', () => {
    const items = composeAccountInventory(
      [syncRow({ external_stock_id: '424242' })],
      [
        listing({ cardtrader_article_id: 424242 }),
        listing({ id: 'aaaaaaaa-0000-0000-0000-000000000003', cardtrader_article_id: 999 }),
      ]
    );
    // La riga sync resta (fonte autorevole), il duplicato marketplace sparisce,
    // il listing non collegato resta.
    expect(items).toHaveLength(2);
    expect(items.filter((i) => i.listing_source === 'sync')).toHaveLength(1);
    expect(
      items.filter((i) => i.marketplace_listing_id === 'aaaaaaaa-0000-0000-0000-000000000003')
    ).toHaveLength(1);
  });

  it('mantiene i listing marketplace non-demo senza collegamento CardTrader', () => {
    const items = composeAccountInventory([syncRow()], [listing()]);
    expect(items).toHaveLength(2);
  });
});

describe('isVisibleInventoryGame', () => {
  function withCard(
    gameSlug: string | undefined,
    cardIdPrefix = 'mtg_'
  ): InventoryItemWithCatalog {
    return {
      ...syncRow(),
      card: { id: `${cardIdPrefix}123`, game_slug: gameSlug },
    };
  }

  it('mostra le carte MTG e i prodotti sealed', () => {
    expect(isVisibleInventoryGame(withCard('mtg'))).toBe(true);
    expect(isVisibleInventoryGame(withCard('sealed', 'sealed_'))).toBe(true);
  });

  it('nasconde i giochi non supportati risolti dal catalogo', () => {
    expect(isVisibleInventoryGame(withCard('pokemon', 'pk_'))).toBe(false);
    expect(isVisibleInventoryGame(withCard('one-piece', 'op_'))).toBe(false);
    expect(isVisibleInventoryGame(withCard('yugioh', 'ygo_'))).toBe(false);
  });

  it('mantiene visibili le righe senza dato catalogo (caricamento o mapping mancante)', () => {
    const item: InventoryItemWithCatalog = { ...syncRow(), card: undefined };
    expect(isVisibleInventoryGame(item)).toBe(true);
  });

  it('mantiene visibili le righe CardTrader MTG anche se il catalogo ha id numerico e game_slug non definito', () => {
    const item: InventoryItemWithCatalog = {
      ...syncRow({ game_id: 1, source: 'cardtrader' }),
      card: { id: '3205', game_slug: undefined },
    };
    expect(isVisibleInventoryGame(item)).toBe(true);
  });

  it('nasconde le righe marketplace senza catalogo ma con card_id di gioco non supportato', () => {
    const pokemon: InventoryItemWithCatalog = { ...syncRow(), card_id: 'pk_456' };
    const onePiece: InventoryItemWithCatalog = { ...syncRow(), card_id: 'op_789' };
    const yugioh: InventoryItemWithCatalog = { ...syncRow(), card_id: 'ygo_999' };
    const mtg: InventoryItemWithCatalog = { ...syncRow(), card_id: 'mtg_111' };
    expect(isVisibleInventoryGame(pokemon)).toBe(false);
    expect(isVisibleInventoryGame(onePiece)).toBe(false);
    expect(isVisibleInventoryGame(yugioh)).toBe(false);
    expect(isVisibleInventoryGame(mtg)).toBe(true);
  });
});
