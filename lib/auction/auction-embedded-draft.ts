import { getCardImageUrl } from '@/lib/assets';
import type { CardDocument } from '@/lib/product-detail';
import {
  AUCTION_CREATE_DEFAULT_DRAFT,
  normalizeAuctionCardLanguage,
  type AuctionCreateDraft,
  searchGameSlugToAuctionGame,
} from '@/lib/auction/auction-create-draft';
import type { InventoryItemWithCatalog } from '@/lib/sync/inventory-types';

function blueprintFromCard(card: CardDocument): number | undefined {
  const raw = card.cardtrader_id;
  if (raw == null) return undefined;
  if (typeof raw === 'number') return raw;
  const s = String(raw);
  const n = parseInt(s.includes(':') ? s.split(':')[0]! : s, 10);
  return Number.isFinite(n) ? n : undefined;
}

/** True se il prodotto è trattato come «non carta singola» (es. sealed, playmat). */
export function productIsSealedOrNonSingle(card: CardDocument): boolean {
  return card.id.startsWith('sealed_') || card.game_slug === 'sealed' || card.game_slug === 'sealed_products';
}

/**
 * Draft iniziale per flusso asta dalla pagina prodotto (carta/già nota).
 */
export function createEmbeddedDraftFromProduct(card: CardDocument): AuctionCreateDraft {
  const sealed = productIsSealedOrNonSingle(card);
  const img = getCardImageUrl(card.image ?? '') ?? (card.image?.startsWith('http') ? card.image : '') ?? '';
  return {
    ...AUCTION_CREATE_DEFAULT_DRAFT,
    listingPhotos: [],
    isCard: !sealed,
    nonCardCategory: sealed ? 'other_object' : '',
    game: searchGameSlugToAuctionGame(card.game_slug),
    title: card.name,
    description: '',
    imageUrl: img,
    cardSelection: {
      id: card.id,
      title: card.name,
      image: card.image ?? '',
      setName: card.set_name,
      gameSlug: card.game_slug,
      blueprintId: blueprintFromCard(card),
    },
    selectedInventoryItemId: null,
  };
}

/** Mappa testo condizione inventario → valore select wizard (CardTrader 5 condizioni). */
export function inventoryConditionToWizardValue(raw: string | null | undefined): string {
  if (!raw || typeof raw !== 'string') return 'near_mint';
  const s = raw.trim();
  const lower = s.toLowerCase();
  if (lower === 'near mint' || lower === 'nm' || lower === 'mint' || lower === 'excellent' || lower === 'ex') return 'near_mint';
  if (lower === 'lightly played' || lower === 'light played' || lower === 'lp' || lower === 'slightly played' || lower === 'sp' || lower === 'good' || lower === 'gd') return 'lightly_played';
  if (lower === 'moderately played' || lower === 'mp' || lower === 'played' || lower === 'pl') return 'moderately_played';
  if (lower === 'heavily played' || lower === 'hp') return 'heavily_played';
  if (lower === 'damaged' || lower === 'poor' || lower === 'po') return 'damaged';
  return 'near_mint';
}

/** Applica dati inventario al draft (dopo scelta utente). */
export function mergeInventoryIntoAuctionDraft(
  draft: AuctionCreateDraft,
  item: InventoryItemWithCatalog
): AuctionCreateDraft {
  const props = item.properties as Record<string, unknown> | undefined;
  const cond =
    typeof props?.condition === 'string' ? inventoryConditionToWizardValue(props.condition) : draft.condition;
  const rawLanguage =
    typeof props?.mtg_language === 'string'
      ? props.mtg_language
      : typeof props?.language === 'string'
        ? props.language
        : null;
  const language = normalizeAuctionCardLanguage(rawLanguage);
  const priceHint = item.price_cents > 0 ? (item.price_cents / 100).toFixed(2) : draft.startingBidEur;
  return {
    ...draft,
    condition: cond,
    cardLanguage: language || draft.cardLanguage,
    startingBidEur: priceHint,
    cardSelection: draft.cardSelection
      ? {
          ...draft.cardSelection,
          inventoryItemId: item.id,
        }
      : null,
    selectedInventoryItemId: String(item.id),
  };
}

export function clearInventoryFromAuctionDraft(draft: AuctionCreateDraft): AuctionCreateDraft {
  if (!draft.cardSelection) return draft;
  const { inventoryItemId: _i, ...rest } = draft.cardSelection;
  return {
    ...draft,
    cardSelection: { ...rest },
    selectedInventoryItemId: null,
    startingBidEur: '',
  };
}
