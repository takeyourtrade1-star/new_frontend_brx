import type { AuctionGame } from '@/components/feature/aste/mock-auctions';
import type { UploadedPhoto } from '@/lib/api/auction-photo-client';
import type { MessageKey } from '@/lib/i18n/messages/en';
import { parseLocaleMoneyInput, roundUpToHalfStep } from '@/lib/auction/bid-math';

export type AuctionCreateShippingPayer = 'buyer' | 'seller';

/** Slot in the listing photo grid: local file (upload from this device) or finalized CDN photo (e.g. from phone QR). */
export type ListingPhotoSlot =
  | { kind: 'local'; file: File }
  | { kind: 'remote'; photo: UploadedPhoto };

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
  /** Dati inventario per prefill condizione / lingua / prezzo. */
  condition?: string;
  cardLanguage?: string;
  startingBidEur?: string;
  /** Lingue effettivamente disponibili per questa carta (da Meilisearch available_languages). */
  availableLanguages?: string[];
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
  /** Lingua carta (es. it, en), utile in prefill da inventario. */
  cardLanguage: string;
  imageUrl: string;
  startingBidEur: string;
  reservePriceEur: string;
  durationDays: 3 | 5 | 7;
  /** Hours granted to the winner to pay before the order can escalate to a
   * dispute. Marketplace policy: default & minimum are 7 days (168h); the
   * upper bound is 30 days (720h). The wizard does NOT currently expose this
   * field — every newly created auction inherits the policy default — but the
   * shape stays in the draft so we can re-introduce a UI later without
   * touching every call site. */
  paymentDeadlineHours: number;
  shippingPayer: AuctionCreateShippingPayer;
  shippingFlatEur: string;
  shippingOriginCountry: string;
  shippingNationalEur: string;
  shippingEuDefaultEur: string;
  /** Prezzo spedizione per acquirenti fuori UE (persistito come riga `XZ` in shipping_country_prices). */
  shippingRestOfWorldEur: string;
  /** Opzionale: integrazione catalogo / inventario (es. da ricerca o sync). */
  catalogCardId?: string;
  selectedInventoryItemId?: string | null;
  /** Foto dell'oggetto reale (min/max prima della pubblicazione): locale o già su CDN (es. da telefono). */
  listingPhotos: ListingPhotoSlot[];
};

/** Minimo foto richieste per pubblicare l'inserzione. */
export const AUCTION_LISTING_PHOTO_MIN = 2;
/** Massimo foto consentite. */
export const AUCTION_LISTING_PHOTO_MAX = 4;

/** Allowed range for the per-auction payment deadline (hours).
 * Backend mirrors these bounds via a Pydantic validator (168..720) and a
 * permissive DB CHECK (1..720) for admin overrides. The wizard currently
 * uses the default (no UI exposure) but we keep the constants exported so
 * future admin tooling / future seller UI can reuse them. */
export const AUCTION_PAYMENT_DEADLINE_MIN_HOURS = 168;
export const AUCTION_PAYMENT_DEADLINE_MAX_HOURS = 720;
export const AUCTION_PAYMENT_DEADLINE_DEFAULT_HOURS = 168;

/** Massimo caratteri per la descrizione personalizzata dell'asta (flusso carta da catalogo). */
export const AUCTION_CUSTOM_DESCRIPTION_MAX = 200;

/** Stessi valori del form «VENDI» in ProductDetailView (select condizione). */
export const AUCTION_CARD_CONDITION_OPTIONS = [
  { value: 'near_mint', labelKey: 'auctions.cardConditionNearMint' },
  { value: 'lightly_played', labelKey: 'auctions.cardConditionLightlyPlayed' },
  { value: 'moderately_played', labelKey: 'auctions.cardConditionModeratelyPlayed' },
  { value: 'heavily_played', labelKey: 'auctions.cardConditionHeavilyPlayed' },
  { value: 'damaged', labelKey: 'auctions.cardConditionDamaged' },
] as const satisfies ReadonlyArray<{ value: string; labelKey: MessageKey }>;

/**
 * Mappa codice lingua → etichetta leggibile.
 * Copre sia i codici ISO standard che alias comuni (es. "jp" usato da alcuni DB).
 * Usata per costruire le opzioni del dropdown direttamente dai codici di Meilisearch.
 */
export const AUCTION_LANG_LABEL_BY_CODE: Readonly<Record<string, string>> = {
  en: 'English',
  it: 'Italiano',
  de: 'Deutsch',
  fr: 'Français',
  es: 'Español',
  pt: 'Português',
  ja: '日本語',
  jp: '日本語',
  ko: '한국어',
  zh: '中文',
  'zh-hans': '中文 (简体)',
  'zh-hant': '中文 (繁體)',
  ru: 'Русский',
  pl: 'Polski',
  cs: 'Čeština',
  hu: 'Magyar',
  ro: 'Română',
};

/**
 * Costruisce le opzioni del dropdown lingua DIRETTAMENTE dai codici di Meilisearch.
 * Non filtra mai una lista statica: se il codice non è in AUCTION_LANG_LABEL_BY_CODE
 * lo mostra comunque usando il codice come label (nessuna lingua viene persa).
 * Se langs è vuoto/null → fallback a solo English.
 */
export function buildAuctionLanguageOptions(
  langs: string[] | undefined | null
): ReadonlyArray<{ value: string; label: string }> {
  if (!langs?.length) {
    return [{ value: 'en', label: 'English' }];
  }
  const seen = new Set<string>();
  const options: { value: string; label: string }[] = [];
  for (const code of langs) {
    if (!code || seen.has(code)) continue;
    seen.add(code);
    options.push({ value: code, label: AUCTION_LANG_LABEL_BY_CODE[code] ?? code });
  }
  return options.length > 0 ? options : [{ value: 'en', label: 'English' }];
}

/** @deprecated Usa buildAuctionLanguageOptions(). Mantenuta per retrocompatibilità. */
export const AUCTION_CARD_LANGUAGE_OPTIONS: ReadonlyArray<{ value: string; label: string }> = [
  { value: 'en', label: 'English' },
  { value: 'it', label: 'Italiano' },
  { value: 'de', label: 'Deutsch' },
  { value: 'fr', label: 'Français' },
  { value: 'es', label: 'Español' },
  { value: 'pt', label: 'Português' },
  { value: 'ja', label: '日本語' },
  { value: 'ko', label: '한국어' },
  { value: 'zh', label: '中文' },
];

/**
 * Normalizza un codice lingua proveniente dall'inventario.
 * Converte alias noti (es. "jp" → "ja") ma NON valida contro una lista statica:
 * qualsiasi codice non vuoto viene restituito così com'è per non perdere lingue.
 */
export function normalizeAuctionCardLanguage(value: string | null | undefined): string {
  const raw = (value ?? '').trim().toLowerCase();
  if (!raw) return '';
  if (raw === 'jp') return 'ja';
  return raw;
}

/** Migrazione da vecchi valori nm/mp del wizard. */
export function normalizeAuctionCardCondition(value: string): string {
  const legacy: Record<string, string> = {
    nm: 'near_mint',
    mint: 'near_mint',
    near_mint: 'near_mint',
    lp: 'lightly_played',
    sp: 'lightly_played',
    lightly_played: 'lightly_played',
    mp: 'moderately_played',
    pl: 'moderately_played',
    moderately_played: 'moderately_played',
    hp: 'heavily_played',
    heavily_played: 'heavily_played',
    ex: 'near_mint',
    excellent: 'near_mint',
    gd: 'lightly_played',
    good: 'lightly_played',
    po: 'damaged',
    poor: 'damaged',
    played: 'moderately_played',
    damaged: 'damaged',
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
  cardLanguage: '',
  imageUrl: '',
  startingBidEur: '',
  reservePriceEur: '',
  durationDays: 7,
  paymentDeadlineHours: AUCTION_PAYMENT_DEADLINE_DEFAULT_HOURS,
  shippingPayer: 'buyer',
  shippingFlatEur: '4.99',
  shippingOriginCountry: 'IT',
  shippingNationalEur: '4.99',
  shippingEuDefaultEur: '9.99',
  shippingRestOfWorldEur: '14.99',
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

export function moneyInputStringFromNumber(value: number): string {
  const rounded = roundUpToHalfStep(value);
  if (!Number.isFinite(rounded)) return '';
  const isInteger = Math.abs(rounded - Math.trunc(rounded)) < 1e-9;
  return isInteger ? String(Math.trunc(rounded)) : rounded.toFixed(1).replace('.', ',');
}

export function normalizeAuctionDraftMoneyInput(rawInput: string): string {
  const parsed = parseLocaleMoneyInput(rawInput);
  if (!Number.isFinite(parsed)) return '';
  return moneyInputStringFromNumber(parsed);
}
