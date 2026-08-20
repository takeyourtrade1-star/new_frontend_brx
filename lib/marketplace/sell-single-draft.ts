import type { ListingPhotoSlot } from '@/lib/auction/auction-create-draft';
import type { CardDocument } from '@/lib/product-detail';
import { buildCardLanguageOptions } from '@/lib/card-languages';

export type SellSingleDraft = {
  quantity: number;
  condition: string;
  language: string;
  price: string;
  comments: string;
  extraFoil: boolean;
  extraSigned: boolean;
  extraAltered: boolean;
  extraGraded: boolean;
  listingPhotos: ListingPhotoSlot[];
};

export const SELL_SINGLE_DEFAULT_DRAFT: SellSingleDraft = {
  quantity: 1,
  condition: '',
  language: 'en',
  price: '',
  comments: '',
  extraFoil: false,
  extraSigned: false,
  extraAltered: false,
  extraGraded: false,
  listingPhotos: [],
};

export function createSellSingleDraftFromCard(card: CardDocument): SellSingleDraft {
  const langs = buildCardLanguageOptions(card.available_languages);
  const market =
    typeof card.market_price === 'number' && Number.isFinite(card.market_price) && card.market_price > 0
      ? card.market_price.toFixed(2)
      : '';
  return {
    ...SELL_SINGLE_DEFAULT_DRAFT,
    language: langs[0]?.code ?? 'en',
    price: market,
  };
}

/** Sanitize price string to allow digits, max 1 dot, and at most 2 decimal digits */
export function sanitizePriceInput(raw: string): string {
  let cleaned = raw.replace(',', '.').replace(/[^\d.]/g, '');
  const parts = cleaned.split('.');
  if (parts.length > 2) {
    cleaned = parts[0] + '.' + parts.slice(1).join('');
  }
  const dotIndex = cleaned.indexOf('.');
  if (dotIndex !== -1) {
    const intPart = cleaned.slice(0, dotIndex);
    const decPart = cleaned.slice(dotIndex + 1, dotIndex + 3); // max 2 decimals
    cleaned = `${intPart}.${decPart}`;
  }
  // Strip leading redundant zeros (e.g. "05" -> "5", but keep "0.5")
  if (/^0\d/.test(cleaned)) {
    cleaned = cleaned.replace(/^0+/, '');
    if (cleaned === '' || cleaned.startsWith('.')) cleaned = '0' + cleaned;
  }
  return cleaned;
}

export function parseSellSinglePriceInput(raw: string): number {
  const normalized = raw.replace(',', '.').replace(/[^\d.]/g, '');
  const parsed = Number.parseFloat(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}
