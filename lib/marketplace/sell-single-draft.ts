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
  listingPhotos: ListingPhotoSlot[];
};

export const SELL_SINGLE_DEFAULT_DRAFT: SellSingleDraft = {
  quantity: 1,
  condition: 'near_mint',
  language: 'en',
  price: '0.00',
  comments: '',
  extraFoil: false,
  extraSigned: false,
  extraAltered: false,
  listingPhotos: [],
};

export function createSellSingleDraftFromCard(card: CardDocument): SellSingleDraft {
  const langs = buildCardLanguageOptions(card.available_languages);
  const market =
    typeof card.market_price === 'number' && Number.isFinite(card.market_price)
      ? card.market_price.toFixed(2)
      : '0.00';
  return {
    ...SELL_SINGLE_DEFAULT_DRAFT,
    language: langs[0]?.code ?? 'en',
    price: market,
  };
}

export function parseSellSinglePriceInput(raw: string): number {
  const normalized = raw.replace(',', '.').replace(/[^\d.]/g, '');
  const parsed = Number.parseFloat(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}
