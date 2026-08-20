import { describe, expect, it } from 'vitest';
import {
  createSellSingleDraftFromCard,
  parseSellSinglePriceInput,
  sanitizePriceInput,
  SELL_SINGLE_DEFAULT_DRAFT,
} from '@/lib/marketplace/sell-single-draft';
import {
  sellSingleConditionLabel,
  SELL_SINGLE_CONDITION_OPTIONS,
} from '@/lib/marketplace/sell-single-conditions';
import type { CardDocument } from '@/lib/product-detail';

describe('sell-single-draft', () => {
  it('default draft starts with empty condition and empty price', () => {
    expect(SELL_SINGLE_DEFAULT_DRAFT.condition).toBe('');
    expect(SELL_SINGLE_DEFAULT_DRAFT.price).toBe('');
    expect(SELL_SINGLE_DEFAULT_DRAFT.quantity).toBe(1);
  });

  it('createSellSingleDraftFromCard creates draft with empty condition and formats market price if present', () => {
    const cardWithPrice: CardDocument = {
      id: 'card-1',
      name: 'Black Lotus',
      market_price: 120.5,
      available_languages: ['it', 'en'],
    } as unknown as CardDocument;

    const draft = createSellSingleDraftFromCard(cardWithPrice);
    expect(draft.condition).toBe('');
    expect(draft.price).toBe('120.50');
    expect(draft.language).toBe('it');

    const cardWithoutPrice: CardDocument = {
      id: 'card-2',
      name: 'Mox Pearl',
      market_price: undefined,
    } as unknown as CardDocument;

    const draft2 = createSellSingleDraftFromCard(cardWithoutPrice);
    expect(draft2.condition).toBe('');
    expect(draft2.price).toBe('');
  });

  it('sanitizePriceInput limits to 2 decimal places and normalizes commas', () => {
    expect(sanitizePriceInput('10,50')).toBe('10.50');
    expect(sanitizePriceInput('10.50')).toBe('10.50');
    expect(sanitizePriceInput('10.999')).toBe('10.99');
    expect(sanitizePriceInput('05')).toBe('5');
    expect(sanitizePriceInput('0.5')).toBe('0.5');
    expect(sanitizePriceInput('abc12.34xyz')).toBe('12.34');
    expect(sanitizePriceInput('1.2.3')).toBe('1.23');
    expect(sanitizePriceInput('')).toBe('');
  });

  it('parseSellSinglePriceInput parses valid numbers', () => {
    expect(parseSellSinglePriceInput('12.50')).toBe(12.5);
    expect(parseSellSinglePriceInput('12,50')).toBe(12.5);
    expect(parseSellSinglePriceInput('')).toBe(0);
    expect(parseSellSinglePriceInput('invalid')).toBe(0);
  });
});

describe('sell-single-conditions', () => {
  it('has "Seleziona condizione" as first option with empty string value', () => {
    expect(SELL_SINGLE_CONDITION_OPTIONS[0]).toEqual({
      value: '',
      label: 'Seleziona condizione',
    });
  });

  it('sellSingleConditionLabel returns "Seleziona condizione" when empty or missing', () => {
    expect(sellSingleConditionLabel('')).toBe('Seleziona condizione');
    expect(sellSingleConditionLabel('unknown')).toBe('Seleziona condizione');
    expect(sellSingleConditionLabel('near_mint')).toBe('Near Mint');
  });
});
