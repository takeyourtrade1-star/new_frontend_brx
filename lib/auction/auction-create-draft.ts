import type { AuctionGame } from '@/components/feature/aste/mock-auctions';
import type { MessageKey } from '@/lib/i18n/messages/en';

export type AuctionCreateShippingPayer = 'buyer' | 'seller';

export type AuctionCreateCardSelection = {
  id: string;
  title: string;
  image: string;
  setName?: string;
  /** Slug gioco da Meilisearch (`game_slug`), per impostare `draft.game`. */
  gameSlug?: string;
  /** Selezionato dalla collezione Sync (inventario) */
  inventoryItemId?: number;
  blueprintId?: number;
};

export type AuctionCreateDraft = {
  /** null = non ancora risposto nel flusso "È una carta?" */
  isCard: boolean | null;
  cardSelection: AuctionCreateCardSelection | null;
  /** Ramo non-carta: obbligatorio confermare «altro oggetto». */
  nonCardCategory: '' | 'other_object';
  game: AuctionGame | '';
  title: string;
  description: string;
  condition: string;
  imageUrl: string;
  startingBidEur: string;
  reservePriceEur: string;
  durationDays: 3 | 5 | 7 | 10;
  shippingPayer: AuctionCreateShippingPayer;
  shippingFlatEur: string;
  /** Opzionale: integrazione catalogo / inventario (es. da ricerca o sync). */
  catalogCardId?: string;
  selectedInventoryItemId?: string | null;
  /** Foto dell’oggetto reale (min/max prima della pubblicazione; solo client fino all’upload API). */
  listingPhotos: File[];
};

/** Minimo foto richieste per pubblicare l’inserzione. */
export const AUCTION_LISTING_PHOTO_MIN = 2;
/** Massimo foto consentite. */
export const AUCTION_LISTING_PHOTO_MAX = 4;

/** Massimo caratteri per la descrizione personalizzata dell’asta (flusso carta da catalogo). */
export const AUCTION_CUSTOM_DESCRIPTION_MAX = 200;

/** Stessi valori del form «VENDI» in ProductDetailView (select condizione). */
export const AUCTION_CARD_CONDITION_OPTIONS = [
  { value: 'near_mint', labelKey: 'auctions.cardConditionNearMint' },
  { value: 'mint', labelKey: 'auctions.cardConditionMint' },
  { value: 'ex', labelKey: 'auctions.cardConditionExcellent' },
  { value: 'gd', labelKey: 'auctions.cardConditionGood' },
  { value: 'lp', labelKey: 'auctions.cardConditionLightPlayed' },
  { value: 'pl', labelKey: 'auctions.cardConditionPlayed' },
  { value: 'po', labelKey: 'auctions.cardConditionPoor' },
] as const satisfies ReadonlyArray<{ value: string; labelKey: MessageKey }>;

/** Migrazione da vecchi valori nm/mp del wizard. */
export function normalizeAuctionCardCondition(value: string): string {
  const legacy: Record<string, string> = {
    nm: 'near_mint',
    mp: 'pl',
  };
  return legacy[value] ?? value;
}

export function auctionConditionLabelKey(condition: string): MessageKey {
  const normalized = normalizeAuctionCardCondition(condition);
  const found = AUCTION_CARD_CONDITION_OPTIONS.find((o) => o.value === normalized);
  return found?.labelKey ?? 'auctions.cardConditionNearMint';
}

/** Valore valido per `<select>` condizione (fallback se dati legacy). */
export function conditionSelectValue(condition: string): string {
  const n = normalizeAuctionCardCondition(condition);
  return AUCTION_CARD_CONDITION_OPTIONS.some((o) => o.value === n) ? n : 'near_mint';
}

export const AUCTION_CREATE_DEFAULT_DRAFT: AuctionCreateDraft = {
  isCard: null,
  cardSelection: null,
  nonCardCategory: '',
  game: '',
  title: '',
  description: '',
  condition: 'near_mint',
  imageUrl: '',
  startingBidEur: '',
  reservePriceEur: '',
  durationDays: 7,
  shippingPayer: 'buyer',
  shippingFlatEur: '4.99',
  listingPhotos: [],
};

/** Valore `game` per GET /api/search (filtro `game_slug` in Meilisearch). */
export function auctionGameToSearchParam(game: AuctionGame | ''): string {
  if (!game || game === 'other') return '';
  const map: Partial<Record<AuctionGame, string>> = {
    mtg: 'mtg',
    lorcana: 'lorcana',
    pokemon: 'pokemon',
    op: 'one-piece',
    ygo: 'ygo',
  };
  return map[game] ?? '';
}

/** Mappa `game_slug` da Meilisearch a `AuctionGame` per il draft. */
export function searchGameSlugToAuctionGame(slug: string | undefined): AuctionGame {
  const s = (slug ?? '').trim().toLowerCase();
  if (s === 'one-piece') return 'op';
  if (s === 'mtg' || s === 'magic') return 'mtg';
  if (s === 'pokemon') return 'pokemon';
  if (s === 'lorcana') return 'lorcana';
  if (s === 'ygo' || s === 'yu-gi-oh' || s === 'yu-gi-oh!') return 'ygo';
  return 'other';
}

export const AUCTION_CREATE_GAMES: { value: AuctionGame; labelKey: MessageKey }[] = [
  { value: 'mtg', labelKey: 'auctions.gameMtg' },
  { value: 'lorcana', labelKey: 'auctions.gameLorcana' },
  { value: 'pokemon', labelKey: 'auctions.gamePokemon' },
  { value: 'op', labelKey: 'auctions.gameOp' },
  { value: 'ygo', labelKey: 'auctions.gameYgo' },
  { value: 'other', labelKey: 'auctions.gameOther' },
];
