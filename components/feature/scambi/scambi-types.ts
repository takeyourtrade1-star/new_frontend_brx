export type ScambioGame = 'mtg' | 'lorcana' | 'pokemon' | 'op' | 'ygo' | 'other';

export interface ScambioUI {
  id: string;
  numericId: number;
  title: string;
  image: string;
  seller: string;
  sellerCountry: string;
  sellerRating: number;
  sellerReviewCount: number;
  game: ScambioGame;
  description: string;
  imageFront: string;
  imageBack: string;
  condition: string;
  createdByUserId: string | null;
  wantsInReturn: string;
}

export interface TradePayload {
  requestedCardId: string;
  offeredItems: Array<{ id: string; name: string; image: string; qty: number }>;
  offeredCredits: number;
  requestedItems: Array<{ id: string; name: string; image: string; qty: number }>;
  requestedCredits: number;
  isRealtime: boolean;
  message: string;
}
